import cv2
import base64
import requests
import json

# Read webcam image
img = cv2.imread('hand_clear.jpg')
print(f"Image shape: {img.shape}")

# Create proper data URL
_, buffer = cv2.imencode('.jpg', img, [cv2.IMWRITE_JPEG_QUALITY, 90])
image_base64 = base64.b64encode(buffer).decode()
image_data = f"data:image/jpeg;base64,{image_base64}"

print('Sending to API...')
try:
    response = requests.post(
        'http://127.0.0.1:5001/predict',
        json={'image': image_data, 'target_letter': 'A'},
        timeout=30
    )
    print(f"Status: {response.status_code}")
    result = response.json()
    print(json.dumps(result, indent=2))
except Exception as e:
    print(f"Error: {e}")
