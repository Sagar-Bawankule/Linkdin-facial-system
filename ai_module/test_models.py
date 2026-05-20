#!/usr/bin/env python3
"""
Diagnostic script to test SCRFD and ArcFace models
"""
import cv2
import numpy as np
import onnxruntime as ort

print("=" * 60)
print("Testing SCRFD Detector")
print("=" * 60)

try:
    sess = ort.InferenceSession('models/scrfd_500m.onnx', providers=['CPUExecutionProvider'])
    print(f"✓ SCRFD model loaded")
    print(f"  Input name: {sess.get_inputs()[0].name}")
    print(f"  Input shape: {sess.get_inputs()[0].shape}")
    
    # List all inputs and outputs
    print(f"\n  Inputs:")
    for inp in sess.get_inputs():
        print(f"    - {inp.name}: {inp.shape}")
    
    print(f"\n  Outputs:")
    for i, out in enumerate(sess.get_outputs()):
        print(f"    {i}. {out.name}: {out.shape}")
    
    # Test with dummy input
    h, w = sess.get_inputs()[0].shape[2:] if len(sess.get_inputs()[0].shape) >= 3 else [640, 640]
    print(f"\n  Testing with dummy input ({h}x{w})...")
    
    dummy_input = np.random.randn(1, 3, h, w).astype(np.float32)
    dummy_input = (dummy_input - 0.5) * 2  # Normalize to [-1, 1]
    
    outputs = sess.run(None, {sess.get_inputs()[0].name: dummy_input})
    print(f"  ✓ Inference successful")
    print(f"  Output shapes:")
    for i, out in enumerate(outputs):
        print(f"    Output {i}: {out.shape}")
        
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("Testing ArcFace Recognizer")
print("=" * 60)

try:
    sess = ort.InferenceSession('models/mobilefacenet.onnx', providers=['CPUExecutionProvider'])
    print(f"✓ ArcFace model loaded")
    print(f"  Input name: {sess.get_inputs()[0].name}")
    print(f"  Input shape: {sess.get_inputs()[0].shape}")
    
    # List all inputs and outputs
    print(f"\n  Inputs:")
    for inp in sess.get_inputs():
        print(f"    - {inp.name}: {inp.shape}")
    
    print(f"\n  Outputs:")
    for i, out in enumerate(sess.get_outputs()):
        print(f"    {i}. {out.name}: {out.shape}")
    
    # Test with dummy input
    h, w = sess.get_inputs()[0].shape[2:] if len(sess.get_inputs()[0].shape) >= 3 else [112, 112]
    print(f"\n  Testing with dummy input ({h}x{w})...")
    
    dummy_input = np.random.randn(1, 3, h, w).astype(np.float32)
    dummy_input = (dummy_input - 0.5) * 2  # Normalize
    
    outputs = sess.run(None, {sess.get_inputs()[0].name: dummy_input})
    print(f"  ✓ Inference successful")
    print(f"  Output shapes:")
    for i, out in enumerate(outputs):
        print(f"    Output {i}: {out.shape}")
        if i == 0:
            print(f"    Output {i} sample values: {out[0, :5]}")
        
except Exception as e:
    print(f"✗ Error: {e}")

print("\n" + "=" * 60)
print("Summary")
print("=" * 60)
print("If both models loaded successfully, check if the output shapes")
print("match what your post-processing code expects.")
