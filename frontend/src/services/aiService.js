/**
 * AI Service - Handles communication with the Python AI microservice
 * Located at http://localhost:8000
 */

const AI_SERVICE_URL = 'http://localhost:8000';

/**
 * Send a video frame to the AI service for face analysis
 * @param {HTMLCanvasElement} canvas - Canvas with the face image
 * @returns {Promise<Object>} - Response with embeddings and detection results
 */
const analyzeFrame = async (canvas) => {
  try {
    // Convert canvas to blob
    return new Promise((resolve, reject) => {
      canvas.toBlob(async (blob) => {
        try {
          const formData = new FormData();
          formData.append('file', blob, 'face.png');

          const response = await fetch(`${AI_SERVICE_URL}/analyze_frame`, {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`AI Service error: ${response.statusText}`);
          }

          const data = await response.json();
          resolve(data);
        } catch (error) {
          reject(error);
        }
      }, 'image/png');
    });
  } catch (error) {
    throw new Error(`Failed to analyze frame: ${error.message}`);
  }
};

/**
 * Extract a single embedding from a video frame
 * @param {HTMLCanvasElement} canvas - Canvas with the face image
 * @returns {Promise<Array>} - Embedding array from ArcFace model
 */
const getEmbedding = async (canvas) => {
  try {
    const result = await analyzeFrame(canvas);

    if (!result.success) {
      throw new Error(result.message || 'AI service failed to analyze frame');
    }

    if (!result.results || result.results.length === 0) {
      throw new Error('No face detected in the image');
    }

    const firstResult = result.results[0];
    if (!firstResult.embedding || !Array.isArray(firstResult.embedding)) {
      throw new Error('Invalid embedding format from AI service');
    }

    return firstResult.embedding;
  } catch (error) {
    throw new Error(`Failed to get embedding: ${error.message}`);
  }
};

/**
 * Check AI service health
 * @returns {Promise<Object>} - Service status and loaded models
 */
const checkHealth = async () => {
  try {
    const response = await fetch(`${AI_SERVICE_URL}/`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Health check failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`AI service unreachable: ${error.message}`);
  }
};

const aiService = {
  analyzeFrame,
  getEmbedding,
  checkHealth,
};

export default aiService;
