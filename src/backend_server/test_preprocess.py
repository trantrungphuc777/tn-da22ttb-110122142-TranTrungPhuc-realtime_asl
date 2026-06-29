import cv2
import base64
import requests

# Read webcam image
img = cv2.imread('hand_clear.jpg')
_, buffer = cv2.imencode('.jpg', img)
image_base64 = base64.b64encode(buffer).decode()
image_data = f'data:image/jpeg;base64,{image_base64}'

print('Sending to API...')
response = requests.post(
    'http://127.0.0.1:5001/predict',
    json={'image': image_data, 'target_letter': 'A'},
    timeout=30
)

result = response.json()
print(f'Hand: {result.get("is_hand_present")}')
print(f'Letter: {result.get("current_letter")}')
print(f'Confidence: {result.get("confidence")}')
print(f'Debug: {result.get("debug")}')
