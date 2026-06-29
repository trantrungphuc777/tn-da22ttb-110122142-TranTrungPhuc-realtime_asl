import cv2
import numpy as np
import base64
import json
import math
import os
import asyncio
import tensorflow as tf
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from cvzone.HandTrackingModule import HandDetector
from keras.models import load_model

from tts_module import TTSModule
from legacy_predictor import LegacyPredictorState

app = FastAPI(title="AI Sign Language Microservice")

DEFAULT_ORIGINS = "http://localhost:5173,http://127.0.0.1:5173"
ALLOWED_ORIGINS = [origin.strip() for origin in os.getenv("AI_CORS_ORIGINS", DEFAULT_ORIGINS).split(",") if origin.strip()]
MAX_IMAGE_BASE64_LENGTH = int(os.getenv("MAX_IMAGE_BASE64_LENGTH", "2000000"))
HOLD_TIME_THRESHOLD = float(os.getenv("HOLD_TIME_THRESHOLD", "1.5"))
app.state.active_ws_connections = 0
model_lock = asyncio.Lock()

# Cho phép React gọi API/WebSocket
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Khởi tạo các module dùng chung ---
tts = TTSModule()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "cnn8grps_rad1_model.h5"))
WHITE_TEMPLATE_PATH = os.path.abspath(os.path.join(BASE_DIR, "..", "white.jpg"))

# Tải model (Cần chắc chắn path tới file model chuẩn xác)
try:
    model = load_model(MODEL_PATH)
    _predict_fn = tf.function(model, reduce_retracing=True)
    _dummy = np.ones((1, 400, 400, 3), dtype="float32")
    _predict_fn(_dummy, training=False)
    print("[OK] Model loaded successfully!")
except Exception as e:
    print(f"[ERROR] Error loading model: {e}")
    model = None
    _predict_fn = None

white_template = cv2.imread(WHITE_TEMPLATE_PATH)
if white_template is None:
    white_template = np.ones((400, 400, 3), np.uint8) * 255

# Thiết lập HandDetector từ cvzone theo logic cũ
hd = HandDetector(maxHands=1)
hd2 = HandDetector(maxHands=1)
offset = 29

# Danh sách nhóm chữ cái từ code gốc
# group 0: a,e,m,n,s,t
# group 1: b,d,f,i,k,r,u,v,w
# group 2: c,o
# group 3: g,h
# group 4: l
# group 5: p,q,z
# group 6: x
# group 7: y
dict_labels = {
    0: "AEMNST", 
    1: "BDFIKRUVW", 
    2: "CO", 
    3: "GH", 
    4: "L", 
    5: "PQZ", 
    6: "X", 
    7: "Y"
}

def distance(x, y):
    return math.sqrt(((x[0] - y[0]) ** 2) + ((x[1] - y[1]) ** 2))

def process_base64_frame(base64_string):
    """Giải mã base64 sang OpenCV image"""
    try:
        if not base64_string:
            return None
        if len(base64_string) > MAX_IMAGE_BASE64_LENGTH:
            return None
        # Bỏ header của base64 "data:image/jpeg;base64,"
        _, encoded = base64_string.split(",", 1) if "," in base64_string else ("", base64_string)
        decoded_data = base64.b64decode(encoded, validate=True)
        np_data = np.frombuffer(decoded_data, np.uint8)
        img = cv2.imdecode(np_data, cv2.IMREAD_COLOR)
        return img
    except Exception as e:
        print(f"[ERROR] Decode frame error: {e}")
        return None

def predict_sign(frame, state: LegacyPredictorState):
    """Logic nhận diện được chuyển từ prediction_wo_gui.py"""
    if model is None or _predict_fn is None:
        return "", False, state.sentence, [state.word1, state.word2, state.word3, state.word4], None

    # Flip frame như code gốc - webcam thường cho hình ngược
    frame = cv2.flip(frame, 1)
    
    # flipType=True vì frame đã được flip ở trên
    hands_result = hd.findHands(frame, draw=False, flipType=True)
    hands = hands_result[0] if isinstance(hands_result, tuple) else hands_result
    is_hand_present = False
    detected_letter = ""
    suggestions = [state.word1, state.word2, state.word3, state.word4]

    if hands and len(hands) > 0:
        is_hand_present = True
        hand = hands[0]
        x, y, w, h = hand['bbox']
        
        # Kiểm tra boundary để tránh lỗi crop ngoài màn hình
        height, width, _ = frame.shape
        y1, y2 = max(0, y - offset), min(height, y + h + offset)
        x1, x2 = max(0, x - offset), min(width, x + w + offset)
        
        image_crop = frame[y1:y2, x1:x2]
        
        if image_crop.size == 0:
            return "", True, state.sentence, suggestions, None
            
        white = white_template.copy()
        # flipType=True vì frame đã được flip ở trên
        handz_result = hd2.findHands(image_crop, draw=False, flipType=True)
        handz = handz_result[0] if isinstance(handz_result, tuple) else handz_result
        
        if handz and len(handz) > 0:
            hand_crop = handz[0]
            pts = hand_crop['lmList']
            
            os = ((400 - w) // 2) - 15
            os1 = ((400 - h) // 2) - 15
            
            # Vẽ lại xương tay lên nền trắng 400x400 như khi train
            for t in range(0, 4, 1):
                cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1), (0, 255, 0), 3)
            for t in range(5, 8, 1):
                cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1), (0, 255, 0), 3)
            for t in range(9, 12, 1):
                cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1), (0, 255, 0), 3)
            for t in range(13, 16, 1):
                cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1), (0, 255, 0), 3)
            for t in range(17, 20, 1):
                cv2.line(white, (pts[t][0] + os, pts[t][1] + os1), (pts[t + 1][0] + os, pts[t + 1][1] + os1), (0, 255, 0), 3)
            cv2.line(white, (pts[5][0] + os, pts[5][1] + os1), (pts[9][0] + os, pts[9][1] + os1), (0, 255, 0), 3)
            cv2.line(white, (pts[9][0] + os, pts[9][1] + os1), (pts[13][0] + os, pts[13][1] + os1), (0, 255, 0), 3)
            cv2.line(white, (pts[13][0] + os, pts[13][1] + os1), (pts[17][0] + os, pts[17][1] + os1), (0, 255, 0), 3)
            cv2.line(white, (pts[0][0] + os, pts[0][1] + os1), (pts[5][0] + os, pts[5][1] + os1), (0, 255, 0), 3)
            cv2.line(white, (pts[0][0] + os, pts[0][1] + os1), (pts[17][0] + os, pts[17][1] + os1), (0, 255, 0), 3)

            for i in range(21):
                cv2.circle(white, (pts[i][0] + os, pts[i][1] + os1), 2, (0, 0, 255), 1)

            # Predict
            white_input = white.reshape(1, 400, 400, 3)
            prob = np.array(_predict_fn(white_input, training=False)[0], dtype='float32')
            ch1 = np.argmax(prob, axis=0)
            prob[ch1] = 0
            ch2 = np.argmax(prob, axis=0)
            prob[ch2] = 0
            ch3 = np.argmax(prob, axis=0)

            detected_letter, sentence, suggestions = state.update(ch1, ch2, pts, ch3)
            # Encode skeleton image to base64 for frontend display
            _, skeleton_buf = cv2.imencode('.jpg', white, [cv2.IMWRITE_JPEG_QUALITY, 80])
            skeleton_b64 = 'data:image/jpeg;base64,' + base64.b64encode(skeleton_buf).decode('utf-8')
            return detected_letter, is_hand_present, sentence, suggestions, skeleton_b64

    return detected_letter, is_hand_present, state.sentence, suggestions, None

@app.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket):
    await websocket.accept()
    app.state.active_ws_connections += 1
    print("[OK] Client connected to WebSocket")
    predictor_state = LegacyPredictorState()
    
    try:
        while True:
            # Nhận JSON hoặc base64 text từ client
            data = await websocket.receive_text()
            frame_data = json.loads(data) if data.startswith("{") else {"image": data}
            action = frame_data.get("action")

            if action == "clear":
                predictor_state.clear_sentence()
                await websocket.send_json({
                    **predictor_state.payload(),
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue

            if action == "speak":
                tts.speak(predictor_state.sentence.strip())
                await websocket.send_json({
                    **predictor_state.payload(),
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue

            if action == "apply_suggestion":
                predictor_state.apply_suggestion(frame_data.get("word", ""))
                await websocket.send_json({
                    **predictor_state.payload(),
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue

            if action == "delete_char":
                predictor_state.delete_last_char()
                await websocket.send_json({
                    **predictor_state.payload(),
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue

            if action == "delete_forward_char":
                predictor_state.delete_forward_char()
                await websocket.send_json({
                    **predictor_state.payload(),
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue

            if action == "delete_word":
                predictor_state.delete_last_word()
                await websocket.send_json({
                    **predictor_state.payload(),
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue

            if action == "add_space":
                predictor_state.add_space()
                await websocket.send_json({
                    **predictor_state.payload(),
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue

            if action == "set_cursor":
                predictor_state.set_cursor(frame_data.get("position", 0))
                await websocket.send_json({
                    **predictor_state.payload(),
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue
            
            img = process_base64_frame(frame_data.get("image", ""))
            
            if img is None:
                await websocket.send_json({
                    "current_letter": "",
                    "sentence": predictor_state.sentence,
                    "cursor_position": predictor_state.cursor_position,
                    "suggestions": [],
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue

            try:
                # 1. Quét tay và dự đoán
                async with model_lock:
                    current_letter, is_hand_present, sentence, suggestions, skeleton_b64 = await asyncio.to_thread(
                        predict_sign,
                        img,
                        predictor_state,
                    )

                response = {
                    "current_letter": current_letter,
                    "sentence": sentence,
                    "cursor_position": predictor_state.cursor_position,
                    "suggestions": suggestions,
                    "is_hand_present": is_hand_present,
                    "server_ts": asyncio.get_event_loop().time(),
                }
                if skeleton_b64:
                    response["skeleton_image"] = skeleton_b64
                await websocket.send_json(response)
            except Exception as frame_error:
                # Keep websocket alive on bad frame/model edge case.
                print(f"[WARN] Frame processing error: {frame_error}")
                await websocket.send_json({
                    "current_letter": "",
                    "sentence": predictor_state.sentence,
                    "cursor_position": predictor_state.cursor_position,
                    "suggestions": [],
                    "is_hand_present": False,
                    "server_ts": asyncio.get_event_loop().time(),
                })
                continue
                
    except WebSocketDisconnect:
        print("[INFO] Client disconnected")
    except json.JSONDecodeError:
        print("[WARN] Invalid JSON payload from client")
    except Exception as e:
        print(f"[ERROR] WebSocket Error: {e}")
    finally:
        app.state.active_ws_connections = max(0, app.state.active_ws_connections - 1)

@app.get("/")
def read_root():
    return {"status": "AI Microservice is running!"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai_server",
        "model_loaded": model is not None,
        "active_ws_connections": app.state.active_ws_connections,
        "allowed_origins": ALLOWED_ORIGINS,
    }
