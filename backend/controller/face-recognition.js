

const Embedding = require('../model/embedding');
const User = require('../model/user');
const RecognitionAttempt = require('../model/recognitionAttempt');


// face-api.js descriptors must be compared using Euclidean distance, NOT cosine similarity.
// Cosine similarity stays high (~0.9+) even for completely different people's faces,
// which allows any face (or a celebrity photo) to pass verification.
// Euclidean distance: 0 = identical, higher = more different.
// Typical threshold: < 0.4 = same person, >= 0.4 = different person.
const calculateEuclideanDistance = (embedding1, embedding2) => {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embedding vectors must have the same length');
  }

  let sum = 0;
  for (let i = 0; i < embedding1.length; i++) {
    const diff = embedding1[i] - embedding2[i];
    sum += diff * diff;
  }

  return Math.sqrt(sum);
};

const parseEmbeddingInput = (embeddingInput) => {
  if (Array.isArray(embeddingInput)) {
    return embeddingInput;
  }
  if (typeof embeddingInput === 'string') {
    return JSON.parse(embeddingInput);
  }
  return null;
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (Array.isArray(forwarded)) {
    return forwarded[0] || '';
  }
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection?.remoteAddress || '';
};

const logRecognitionAttempt = async (req, payload) => {
  try {
    await RecognitionAttempt.create({
      endpoint: 'find-closest-match',
      source: req.body?.source || 'web-client',
      resultType: payload.resultType,
      similarity: payload.similarity ?? null,
      threshold: payload.threshold ?? null,
      matchedUser: payload.matchedUser || null,
      classroom: req.body?.classroomId || null,
      class: req.body?.classId || null,
      embeddingLength: payload.embeddingLength || 0,
      note: payload.note || '',
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || '',
    });
  } catch (attemptError) {
    console.error('Failed to log recognition attempt:', attemptError.message);
  }
};

const embeddingController = {
  
  findClosestMatch: async (req, res) => {
    try {
      const { embedding: embeddingInput } = req.body;
      const embedding = parseEmbeddingInput(embeddingInput);
    //   console.log(embedding)
      // Validate request
      if (!embedding || !Array.isArray(embedding)) {
        await logRecognitionAttempt(req, {
          resultType: 'error',
          note: 'Invalid embedding payload',
          embeddingLength: 0,
        });
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid embedding. Must provide an array of numbers.' 
        });
      }

      // Get all active embeddings
      const allEmbeddings = await Embedding.find({ isActive: true })
        .populate('user', 'firstName lastName email role profileImage group rollNumber mobile permanentAddress currentAddress');

      if (allEmbeddings.length === 0) {
        await logRecognitionAttempt(req, {
          resultType: 'error',
          note: 'No active embeddings found',
          embeddingLength: embedding.length,
        });
        return res.status(404).json({ 
          success: false, 
          message: 'No embeddings found in the database.' 
        });
      }

      // Calculate Euclidean distance for each stored embedding (lower = more similar)
      const similarities = allEmbeddings.map(storedEmbedding => {
        const distance = calculateEuclideanDistance(embedding, storedEmbedding.embedding);
        return {
          embeddingId: storedEmbedding._id,
          userId: storedEmbedding.user._id,
          user: storedEmbedding.user,
          distance
        };
      });

      // Sort by distance ascending (lowest distance = best match)
      similarities.sort((a, b) => a.distance - b.distance);

      // Get the top match
      const bestMatch = similarities[0];

      // Stricter threshold to reduce false accepts from lookalike faces.
      const DISTANCE_THRESHOLD = 0.38;

      if (bestMatch.distance >= DISTANCE_THRESHOLD) {
        console.log('Best match distance:', bestMatch.distance, '(rejected - above threshold)');
        await logRecognitionAttempt(req, {
          resultType: 'unknown',
          similarity: bestMatch.distance,
          threshold: DISTANCE_THRESHOLD,
          embeddingLength: embedding.length,
          note: 'Above distance threshold - face does not match any registered student',
        });
        return res.status(404).json({
          success: false,
          message: 'No matching user found. Please ensure you are registered and try again.',
          distance: bestMatch.distance
        });
      }

      // Return the best match
      console.log('Face matched:', bestMatch.user?.firstName, bestMatch.user?.lastName, '| distance:', bestMatch.distance);
      await logRecognitionAttempt(req, {
        resultType: 'matched',
        similarity: bestMatch.distance,
        threshold: DISTANCE_THRESHOLD,
        matchedUser: bestMatch.user?._id,
        embeddingLength: embedding.length,
      });
      return res.status(200).json({
        success: true,
        match: {
          user: bestMatch.user,
          distance: bestMatch.distance,
          embeddingId: bestMatch.embeddingId
        }
      });
    } catch (error) {
      console.error('Error finding closest embedding match:', error);
        await logRecognitionAttempt(req, {
          resultType: 'error',
          note: error.message,
          embeddingLength: 0,
        });
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  },

  getUserEmbeddings: async (req, res) => {
    try {
      const { userId } = req.params;
      
      const embeddings = await Embedding.find({ 
        user: userId,
        isActive: true 
      });
      
      return res.status(200).json({
        success: true,
        count: embeddings.length,
        data: embeddings
      });
    } catch (error) {
      console.error('Error fetching user embeddings:', error);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }
};

module.exports = embeddingController;