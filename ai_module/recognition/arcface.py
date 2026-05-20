import cv2
import numpy as np
import onnxruntime as ort

class ArcFaceRecognizer:
    def __init__(self, model_path='models/mobilefacenet.onnx', device='cpu'):
        self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name
        self.output_name = self.session.get_outputs()[0].name
        self.input_shape = [112, 112] # Standard for ArcFace

    def preprocess(self, face_img):
        # Validate input
        if face_img is None or face_img.size == 0:
            return None
        
        # Resize face crop to 112x112
        face_img = cv2.resize(face_img, (112, 112))
        
        # Normalize: convert to float and apply normalization
        face_img = face_img.astype(np.float32)
        face_img = (face_img - 127.5) / 128.0
        
        # Convert BGR to RGB if needed (most models expect RGB)
        # face_img = cv2.cvtColor(face_img, cv2.COLOR_BGR2RGB)
        
        # Transpose to (C, H, W)
        face_img = np.transpose(face_img, (2, 0, 1))
        
        # Add batch dimension
        face_img = np.expand_dims(face_img, axis=0).astype(np.float32)
        return face_img

    def get_embedding(self, face_img):
        if face_img is None or face_img.size == 0:
            return np.array([])
        
        try:
            blob = self.preprocess(face_img)
            if blob is None:
                return np.array([])
            
            embedding = self.session.run([self.output_name], {self.input_name: blob})[0]
            
            # Normalize embedding to unit length (L2 normalization)
            embedding = embedding.flatten()
            norm = np.linalg.norm(embedding)
            if norm > 0:
                embedding = embedding / norm
            
            return embedding
        except Exception as e:
            print(f"Error getting embedding: {e}")
            return np.array([])

    def compare(self, em1, em2):
        """Calculate cosine similarity between two embeddings"""
        if len(em1) == 0 or len(em2) == 0:
            return 0.0
        
        # Ensure both are 1D
        em1 = em1.flatten()
        em2 = em2.flatten()
        
        # Cosine similarity
        dot_product = np.dot(em1, em2)
        norm1 = np.linalg.norm(em1)
        norm2 = np.linalg.norm(em2)
        
        if norm1 == 0 or norm2 == 0:
            return 0.0
        
        return dot_product / (norm1 * norm2)

# Example Usage
if __name__ == "__main__":
    recognizer = ArcFaceRecognizer()
    # Mock face crop
    face_img = np.random.randint(0, 255, (112, 112, 3), dtype=np.uint8)
    embedding = recognizer.get_embedding(face_img)
    print(f"Embedding Shape: {embedding.shape}")
