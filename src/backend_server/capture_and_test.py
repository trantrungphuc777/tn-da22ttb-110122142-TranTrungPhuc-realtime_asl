"""
Capture and save image for testing
"""
import cv2
import base64
import requests
import time

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("Taking photo in 3 seconds...")
time.sleep(3)

ret, frame = cap.read()
cap.release()

if ret:
    cv2.imwrite('captured_hand.jpg', frame)
    print("Image saved to captured_hand.jpg")
    
    # Encode to JPEG
    _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 70])
    image_bytes = buffer.tobytes()
    image_base64 = base64.b64encode(image_bytes).decode('utf-8')
    image_data = f"data:image/jpeg;base64,{image_base64}"
    
    print("Sending to API...")
    response = requests.post(
        'http://127.0.0.1:5001/predict',
        json={'image': image_data, 'target_letter': 'A'},
        timeout=30
    )
    
    result = response.json()
    print(f"\nResult: Hand={result.get('is_hand_present')}, Letter={result.get('current_letter')}")
    print(f"Debug: {result.get('debug')}")
