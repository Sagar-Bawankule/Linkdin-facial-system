import cv2
import numpy as np
import onnxruntime as ort

class SCRFDDetector:
    def __init__(self, model_path='models/scrfd_500m.onnx', device='cpu'):
        self.session = ort.InferenceSession(model_path, providers=['CPUExecutionProvider'])
        self.input_name = self.session.get_inputs()[0].name
        self.confidence_threshold = 0.5
        self.nms_threshold = 0.4

    def preprocess(self, img):
        """Preprocess image for SCRFD model"""
        # Get original dimensions
        h, w = img.shape[:2]
        
        # Resize - SCRFD works better with larger input
        # Use a multiple of 32 for best performance
        target_size = 640
        scale_x = target_size / w
        scale_y = target_size / h
        scale = min(scale_x, scale_y)
        
        new_w = int(w * scale)
        new_h = int(h * scale)
        
        # Pad to target size
        img_resized = cv2.resize(img, (new_w, new_h))
        img_padded = np.zeros((target_size, target_size, 3), dtype=np.uint8)
        img_padded[:new_h, :new_w] = img_resized
        
        # Normalize
        img_normalized = img_padded.astype(np.float32)
        img_normalized = (img_normalized - 127.5) / 128.0
        
        # Convert to (C, H, W)
        img_normalized = np.transpose(img_normalized, (2, 0, 1))
        img_normalized = np.expand_dims(img_normalized, axis=0).astype(np.float32)
        
        return img_normalized, scale, 0, 0  # scale, pad_top, pad_left

    def _nms(self, boxes, scores, threshold):
        """Non-Maximum Suppression"""
        if len(boxes) == 0:
            return []
        
        x1 = boxes[:, 0]
        y1 = boxes[:, 1]
        x2 = boxes[:, 2]
        y2 = boxes[:, 3]
        
        areas = (x2 - x1 + 1) * (y2 - y1 + 1)
        order = scores.argsort()[::-1]
        
        keep = []
        while order.size > 0:
            i = order[0]
            keep.append(i)
            
            if order.size == 1:
                break
            
            xx1 = np.maximum(x1[i], x1[order[1:]])
            yy1 = np.maximum(y1[i], y1[order[1:]])
            xx2 = np.minimum(x2[i], x2[order[1:]])
            yy2 = np.minimum(y2[i], y2[order[1:]])
            
            w = np.maximum(0.0, xx2 - xx1 + 1)
            h = np.maximum(0.0, yy2 - yy1 + 1)
            inter = w * h
            
            ovr = inter / (areas[i] + areas[order[1:]] - inter + 1e-5)
            inds = np.where(ovr <= threshold)[0]
            order = order[inds + 1]
        
        return keep

    def detect(self, frame):
        """Detect faces in frame"""
        h, w = frame.shape[:2]
        
        try:
            blob, scale, pad_top, pad_left = self.preprocess(frame)
            outputs = self.session.run(None, {self.input_name: blob})
            
            # Parse SCRFD outputs
            # Outputs: [score_8, score_16, score_32, bbox_8, bbox_16, bbox_32, kps_8, kps_16, kps_32]
            scores_list = [outputs[0], outputs[1], outputs[2]]  # 3 scales
            boxes_list = [outputs[3], outputs[4], outputs[5]]    # 3 scales
            kps_list = [outputs[6], outputs[7], outputs[8]]      # 3 scales (optional)
            
            all_boxes = []
            all_scores = []
            
            for scale_idx, (scores, boxes, kps) in enumerate(zip(scores_list, boxes_list, kps_list)):
                # scores: (N, 1) - confidence for face class
                # boxes: (N, 4) - (x1, y1, x2, y2)
                # kps: (N, 10) - 5 keypoints
                
                scores = scores.flatten()
                
                # Filter by confidence threshold
                valid_idx = np.where(scores > self.confidence_threshold)[0]
                
                for idx in valid_idx:
                    score = scores[idx]
                    bbox = boxes[idx]  # Already in (x1, y1, x2, y2) format
                    
                    # Unscale coordinates
                    x1, y1, x2, y2 = bbox / scale
                    
                    # Clip to frame bounds
                    x1 = max(0, min(w - 1, x1))
                    y1 = max(0, min(h - 1, y1))
                    x2 = max(1, min(w, x2))
                    y2 = max(1, min(h, y2))
                    
                    if x2 > x1 and y2 > y1:
                        all_boxes.append([x1, y1, x2, y2])
                        all_scores.append(score)
            
            # Apply NMS
            faces = []
            if all_boxes:
                all_boxes = np.array(all_boxes)
                all_scores = np.array(all_scores)
                
                keep_idx = self._nms(all_boxes, all_scores, self.nms_threshold)
                
                for idx in keep_idx:
                    bbox = all_boxes[idx]
                    faces.append({
                        "bbox": bbox.tolist(),
                        "score": float(all_scores[idx]),
                        "landmarks": []
                    })
            
            return faces
            
        except Exception as e:
            print(f"Error in face detection: {e}")
            import traceback
            traceback.print_exc()
            return []

# Example Usage
if __name__ == "__main__":
    detector = SCRFDDetector()
    frame = cv2.imread('test_face.png')
    if frame is not None:
        faces = detector.detect(frame)
        print(f"Detected Faces: {faces}")
    else:
        print("Could not load test image")
