from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import cv2
import numpy as np
import io
from PIL import Image
from detection.scrfd import SCRFDDetector
from recognition.arcface import ArcFaceRecognizer
from anti_spoof.minifasnet import AntiSpoofingModel
from tracking.tracker import ByteTracker
from pipeline.fusion import ConfidenceFusionEngine

app = FastAPI(title="SmartAttend AI Microservice")

# Enable CORS for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins (can be restricted to ["http://localhost:5173"] in production)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models with error handling
try:
    detector = SCRFDDetector()
    print("[OK] Face detector (SCRFD) loaded")
except Exception as e:
    print(f"[ERROR] Failed to load detector: {e}")
    detector = None

try:
    recognizer = ArcFaceRecognizer()
    print("[OK] Face recognizer (ArcFace) loaded")
except Exception as e:
    print(f"[ERROR] Failed to load recognizer: {e}")
    recognizer = None

try:
    anti_spoof = AntiSpoofingModel()
    print("[OK] Anti-spoofing model loaded (or will skip liveness checks)")
except Exception as e:
    print(f"[ERROR] Failed to load anti-spoof: {e}")
    anti_spoof = None

try:
    tracker = ByteTracker()
    print("[OK] Face tracker loaded")
except Exception as e:
    print(f"[ERROR] Failed to load tracker: {e}")
    tracker = None

fusion_engine = ConfidenceFusionEngine()

@app.get("/")
async def root():
    return {
        "message": "SmartAttend AI Microservice Active",
        "models": {
            "detector": "loaded" if detector else "failed",
            "recognizer": "loaded" if recognizer else "failed",
            "anti_spoof": "loaded" if anti_spoof and anti_spoof.model_available else "not_available",
            "tracker": "loaded" if tracker else "failed"
        }
    }

@app.post("/analyze_frame")
async def analyze_frame(file: UploadFile = File(...)):
    try:
        # Read frame
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return {"success": False, "message": "Invalid image file"}
        
        # 1. Detection
        if not detector:
            return {"success": False, "message": "Face detector not available"}
        
        faces = detector.detect(frame)
        if not faces:
            return {"success": False, "message": "No face detected"}
        
        results = []
        for face in faces:
            bbox = face['bbox']
            # Crop face
            x1, y1, x2, y2 = int(bbox[0]), int(bbox[1]), int(bbox[2]), int(bbox[3])
            face_crop = frame[y1:y2, x1:x2]
            
            if face_crop.size == 0:
                continue
            
            # 2. Anti-Spoofing
            spoof_score = anti_spoof.predict(face_crop) if anti_spoof else 1.0
            
            # 3. Recognition
            if not recognizer:
                return {"success": False, "message": "Face recognizer not available"}
            
            embedding = recognizer.get_embedding(face_crop)
            
            # 4. Tracking (Optional for single frame)
            track_score = 1.0
            
            # 5. Fusion
            fusion_result = fusion_engine.fuse(face['score'], spoof_score, track_score)
            
            results.append({
                "is_accepted": fusion_result['is_accepted'],
                "score": fusion_result['score'],
                "details": fusion_result['details'],
                "embedding": embedding.tolist() if embedding is not None else [],
                "bbox": bbox
            })
        
        return {"success": True, "results": results}
    
    except Exception as e:
        return {"success": False, "message": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
