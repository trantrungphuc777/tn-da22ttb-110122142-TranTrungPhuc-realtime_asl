"""
Test API với ảnh thực từ webcam
"""
import cv2
import base64
import requests
import json
from PIL import Image
import io

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("Taking photo in 3 seconds... Make sure your hand is in front of camera!")
import time
time.sleep(3)

ret, frame = cap.read()
cap.release()

if ret:
    # Encode to JPEG
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    image_bytes = buffer.tobytes()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    image_data = f"data:image/jpeg;base64,{image_base64}"
    
    # Send to API
    print("Sending image to API...")
    response = requests.post(
        'http://127.0.0.1:5001/predict',
        json={'image': image_data, 'target_letter': 'A'},
        timeout=30
    )
    
    result = response.json()
    print("\n=== API Response ===")
    print(f"Hand detected: {result.get('is_hand_present')}")
    print(f"Letter: {result.get('current_letter')}")
    print(f"Confidence: {result.get('confidence')}")
    print(f"Corrections: {result.get('corrections')}")
    print(f"\nDebug info: {json.dumps(result.get('debug', {}), indent=2)}")
    
    # Save received skeleton image
    if result.get('skeleton_image'):
        skeleton_data = result['skeleton_image'].split(',')[1]
        skeleton_bytes = base64.b64decode(skeleton_data)
        with open('skeleton_result.jpg', 'wb') as f:
            f.write(skeleton_bytes)
        print("\nSkeleton image saved to skeleton_result.jpg")
else:
    print("Failed to capture frame")
