"""
ASL Hand Detection Server - Kết hợp CNN Model + cvzone HandDetector
- CNN Model: Nhận diện chữ cái ASL (dựa trên skeleton xương tay)
- cvzone: Phân tích chi tiết vị trí ngón tay
- Skeleton hiển thị giống y như lúc train model CNN
"""

import cv2
import numpy as np
import base64
import io
import math
from PIL import Image
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import os

app = Flask(__name__)
CORS(app, resources={r"/predict": {"origins": "*"}}, supports_credentials=False)

# Global state for letter recognition (same as ai_server)
_predictor_state = None

def init_predictor_state():
    """Initialize the predictor state machine"""
    global _predictor_state
    if _predictor_state is None:
        _predictor_state = PredictorState()
    return _predictor_state


class PredictorState:
    """
    State machine để tracking và smoothing predictions
    Giống hệt LegacyPredictorState từ ai_server
    """
    
    def __init__(self):
        self.prev_char = ""
        self.count = -1
        self.ten_prev_char = [" " for _ in range(10)]
        self.sentence = ""
        self.current_symbol = ""
    
    def update(self, ch1, ch2, pts, ch3=None):
        """Cập nhật state với prediction từ CNN + Heuristic - GIỐNG HỆT final_pred.py"""
        pl = [ch1, ch2]

        # condition for [Aemnst]
        l = [[5, 2], [5, 3], [3, 5], [3, 6], [3, 0], [3, 2], [6, 4], [6, 1], [6, 2], [6, 6], [6, 7], [6, 0], [6, 5],
             [4, 1], [1, 0], [1, 1], [6, 3], [1, 6], [5, 6], [5, 1], [4, 5], [1, 4], [1, 5], [2, 0], [2, 6], [4, 6],
             [1, 0], [5, 7], [1, 6], [6, 1], [7, 6], [2, 5], [7, 1], [5, 4], [7, 0], [7, 5], [7, 2]]
        if pl in l:
            if (pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 0

        # condition for [o][s]
        l = [[2, 2], [2, 1]]
        if pl in l:
            if pts[5][0] < pts[4][0]:
                ch1 = 0

        # condition for [c0][aemnst]
        l = [[0, 0], [0, 6], [0, 2], [0, 5], [0, 1], [0, 7], [5, 2], [7, 6], [7, 1]]
        if pl in l:
            if (pts[0][0] > pts[8][0] and pts[0][0] > pts[4][0] and pts[0][0] > pts[12][0] and pts[0][0] > pts[16][0] and pts[0][0] > pts[20][0]) and pts[5][0] > pts[4][0]:
                ch1 = 2

        # condition for [c0][aemnst]
        l = [[6, 0], [6, 6], [6, 2]]
        if pl in l:
            if self.distance(pts[8], pts[16]) < 52:
                ch1 = 2

        # condition for [gh][bdfikruvw]
        l = [[1, 4], [1, 5], [1, 6], [1, 3], [1, 0]]
        if pl in l:
            if pts[6][1] > pts[8][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1] and pts[0][0] < pts[8][0] and pts[0][0] < pts[12][0] and pts[0][0] < pts[16][0] and pts[0][0] < pts[20][0]:
                ch1 = 3

        # con for [gh][l]
        l = [[4, 6], [4, 1], [4, 5], [4, 3], [4, 7]]
        if pl in l:
            if pts[4][0] > pts[0][0]:
                ch1 = 3

        # con for [gh][pqz]
        l = [[5, 3], [5, 0], [5, 7], [5, 4], [5, 2], [5, 1], [5, 5]]
        if pl in l:
            if pts[2][1] + 15 < pts[16][1]:
                ch1 = 3

        # con for [l][x]
        l = [[6, 4], [6, 1], [6, 2]]
        if pl in l:
            if self.distance(pts[4], pts[11]) > 55:
                ch1 = 4

        # con for [l][d]
        l = [[1, 4], [1, 6], [1, 1]]
        if pl in l:
            if (self.distance(pts[4], pts[11]) > 50) and (pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 4

        # con for [l][gh]
        l = [[3, 6], [3, 4]]
        if pl in l:
            if pts[4][0] < pts[0][0]:
                ch1 = 4

        # con for [l][c0]
        l = [[2, 2], [2, 5], [2, 4]]
        if pl in l:
            if pts[1][0] < pts[12][0]:
                ch1 = 4

        # con for [gh][z]
        l = [[3, 6], [3, 5], [3, 4]]
        if pl in l:
            if (pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and pts[4][1] > pts[10][1]:
                ch1 = 5

        # con for [gh][pq]
        l = [[3, 2], [3, 1], [3, 6]]
        if pl in l:
            if pts[4][1] + 17 > pts[8][1] and pts[4][1] + 17 > pts[12][1] and pts[4][1] + 17 > pts[16][1] and pts[4][1] + 17 > pts[20][1]:
                ch1 = 5

        # con for [l][pqz]
        l = [[4, 4], [4, 5], [4, 2], [7, 5], [7, 6], [7, 0]]
        if pl in l:
            if pts[4][0] > pts[0][0]:
                ch1 = 5

        # con for [pqz][aemnst]
        l = [[0, 2], [0, 6], [0, 1], [0, 5], [0, 0], [0, 7], [0, 4], [0, 3], [2, 7]]
        if pl in l:
            if pts[0][0] < pts[8][0] and pts[0][0] < pts[12][0] and pts[0][0] < pts[16][0] and pts[0][0] < pts[20][0]:
                ch1 = 5

        # con for [pqz][yj]
        l = [[5, 7], [5, 2], [5, 6]]
        if pl in l:
            if pts[3][0] < pts[0][0]:
                ch1 = 7

        # con for [l][yj]
        l = [[4, 6], [4, 2], [4, 4], [4, 1], [4, 5], [4, 7]]
        if pl in l:
            if pts[6][1] < pts[8][1]:
                ch1 = 7

        # con for [x][yj]
        l = [[6, 7], [0, 7], [0, 1], [0, 0], [6, 4], [6, 6], [6, 5], [6, 1]]
        if pl in l:
            if pts[18][1] > pts[20][1]:
                ch1 = 7

        # condition for [x][aemnst]
        l = [[0, 4], [0, 2], [0, 3], [0, 1], [0, 6]]
        if pl in l:
            if pts[5][0] > pts[16][0]:
                ch1 = 6

        # condition for [yj][x]
        l = [[7, 2]]
        if pl in l:
            if pts[18][1] < pts[20][1] and pts[8][1] < pts[10][1]:
                ch1 = 6

        # condition for [c0][x]
        l = [[2, 1], [2, 2], [2, 6], [2, 7], [2, 0]]
        if pl in l:
            if self.distance(pts[8], pts[16]) > 50:
                ch1 = 6

        # con for [l][x]
        l = [[4, 6], [4, 2], [4, 1], [4, 4]]
        if pl in l:
            if self.distance(pts[4], pts[11]) < 60:
                ch1 = 6

        # con for [x][d]
        l = [[1, 4], [1, 6], [1, 0], [1, 2]]
        if pl in l:
            if pts[5][0] - pts[4][0] - 15 > 0:
                ch1 = 6

        # con for [b][pqz]
        l = [[5, 0], [5, 1], [5, 4], [5, 5], [5, 6], [6, 1], [7, 6], [0, 2], [7, 1], [7, 4], [6, 6], [7, 2], [5, 0],
             [6, 3], [6, 4], [7, 5], [7, 2]]
        if pl in l:
            if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 1

        # con for [f][pqz]
        l = [[6, 1], [6, 0], [0, 3], [6, 4], [2, 2], [0, 6], [6, 2], [7, 6], [4, 6], [4, 1], [4, 2], [0, 2], [7, 1],
             [7, 4], [6, 6], [7, 2], [7, 5], [7, 2]]
        if pl in l:
            if pts[6][1] < pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 1

        l = [[6, 1], [6, 0], [4, 2], [4, 1], [4, 6], [4, 4]]
        if pl in l:
            if pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 1

        # con for [d][pqz]
        l = [[5, 0], [3, 4], [3, 0], [3, 1], [3, 5], [5, 5], [5, 4], [5, 1], [7, 6]]
        if pl in l:
            if ((pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and (pts[2][0] < pts[0][0]) and pts[4][1] > pts[14][1]):
                ch1 = 1

        l = [[4, 1], [4, 2], [4, 4]]
        if pl in l:
            if (self.distance(pts[4], pts[11]) < 50) and (pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 1

        l = [[3, 4], [3, 0], [3, 1], [3, 5], [3, 6]]
        if pl in l:
            if ((pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and (pts[2][0] < pts[0][0]) and pts[14][1] < pts[4][1]):
                ch1 = 1

        l = [[6, 6], [6, 4], [6, 1], [6, 2]]
        if pl in l:
            if pts[5][0] - pts[4][0] - 15 < 0:
                ch1 = 1

        # con for [i][pqz]
        l = [[5, 4], [5, 5], [5, 1], [0, 3], [0, 7], [5, 0], [0, 2], [6, 2], [7, 5], [7, 1], [7, 6], [7, 7]]
        if pl in l:
            if pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 1

        # con for [yj][bfdi]
        l = [[1, 5], [1, 7], [1, 1], [1, 6], [1, 3], [1, 0]]
        if pl in l:
            if (pts[4][0] < pts[5][0] + 15) and (pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]):
                ch1 = 7

        # con for [uvr]
        l = [[5, 5], [5, 0], [5, 4], [5, 1], [4, 6], [4, 1], [7, 6], [3, 0], [3, 5]]
        if pl in l:
            if ((pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1])) and pts[4][1] > pts[14][1]:
                ch1 = 1

        # con for [w]
        fg = 13
        l = [[3, 5], [3, 0], [3, 6], [5, 1], [4, 1], [2, 0], [5, 0], [5, 5]]
        if pl in l:
            if not (pts[0][0] + fg < pts[8][0] and pts[0][0] + fg < pts[12][0] and pts[0][0] + fg < pts[16][0] and pts[0][0] + fg < pts[20][0]) and not (
                    pts[0][0] > pts[8][0] and pts[0][0] > pts[12][0] and pts[0][0] > pts[16][0] and pts[0][0] > pts[20][0]) and self.distance(pts[4], pts[11]) < 50:
                ch1 = 1

        # con for [w]
        l = [[5, 0], [5, 5], [0, 1]]
        if pl in l:
            if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1]:
                ch1 = 1

        # -------------------------condn for subgroups  starts

        if ch1 == 0:
            ch1 = 'S'
            if pts[4][0] < pts[6][0] and pts[4][0] < pts[10][0] and pts[4][0] < pts[14][0] and pts[4][0] < pts[18][0]:
                ch1 = 'A'
            if pts[4][0] > pts[6][0] and pts[4][0] < pts[10][0] and pts[4][0] < pts[14][0] and pts[4][0] < pts[18][0] and pts[4][1] < pts[14][1] and pts[4][1] < pts[18][1]:
                ch1 = 'T'
            if pts[4][1] > pts[8][1] and pts[4][1] > pts[12][1] and pts[4][1] > pts[16][1] and pts[4][1] > pts[20][1]:
                ch1 = 'E'
            if pts[4][0] > pts[6][0] and pts[4][0] > pts[10][0] and pts[4][0] > pts[14][0] and pts[4][1] < pts[18][1]:
                ch1 = 'M'
            if pts[4][0] > pts[6][0] and pts[4][0] > pts[10][0] and pts[4][1] < pts[18][1] and pts[4][1] < pts[14][1]:
                ch1 = 'N'

        if ch1 == 2:
            if self.distance(pts[12], pts[4]) > 42:
                ch1 = 'C'
            else:
                ch1 = 'O'

        if ch1 == 3:
            if self.distance(pts[8], pts[12]) > 72:
                ch1 = 'G'
            else:
                ch1 = 'H'

        if ch1 == 7:
            if self.distance(pts[8], pts[4]) > 42:
                ch1 = 'Y'
            else:
                ch1 = 'J'

        if ch1 == 4:
            ch1 = 'L'

        if ch1 == 6:
            ch1 = 'X'

        if ch1 == 5:
            if pts[4][0] > pts[12][0] and pts[4][0] > pts[16][0] and pts[4][0] > pts[20][0]:
                if pts[8][1] < pts[5][1]:
                    ch1 = 'Z'
                else:
                    ch1 = 'Q'
            else:
                ch1 = 'P'

        if ch1 == 1:
            if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 'B'
            if pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]:
                ch1 = 'D'
            if pts[6][1] < pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 'F'
            if pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = 'I'
            if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] < pts[20][1]:
                ch1 = 'W'
            if (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and pts[4][1] < pts[9][1]:
                ch1 = 'K'
            if ((self.distance(pts[8], pts[12]) - self.distance(pts[6], pts[10])) < 8) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 'U'
            if ((self.distance(pts[8], pts[12]) - self.distance(pts[6], pts[10])) >= 8) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and (pts[4][1] > pts[9][1]):
                ch1 = 'V'
            if pts[8][0] > pts[12][0] and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
                ch1 = 'R'

        if ch1 == 1 or ch1 == 'E' or ch1 == 'S' or ch1 == 'X' or ch1 == 'Y' or ch1 == 'B':
            if pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]:
                ch1 = "  "

        if ch1 == 'E' or ch1 == 'Y' or ch1 == 'B':
            if pts[4][0] < pts[5][0] and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]):
                ch1 = "next"

        if ch1 in ('Next', 'B', 'C', 'H', 'F', 'X') or True:
            if (pts[0][0] > pts[8][0] and pts[0][0] > pts[12][0] and pts[0][0] > pts[16][0] and pts[0][0] > pts[20][0]) and (pts[4][1] < pts[8][1] and pts[4][1] < pts[12][1] and pts[4][1] < pts[16][1] and pts[4][1] < pts[20][1]) and (pts[4][1] < pts[6][1] and pts[4][1] < pts[10][1] and pts[4][1] < pts[14][1] and pts[4][1] < pts[18][1]):
                ch1 = 'Backspace'

        if ch1 == "next" and self.prev_char != "next":
            if self.ten_prev_char[(self.count-2)%10] != "next":
                if self.ten_prev_char[(self.count-2)%10] == "Backspace":
                    self.sentence = self.sentence[0:-1]
                else:
                    if self.ten_prev_char[(self.count - 2) % 10] != "Backspace":
                        self.sentence = self.sentence + self.ten_prev_char[(self.count-2)%10]
            else:
                if self.ten_prev_char[(self.count - 0) % 10] != "Backspace":
                    self.sentence = self.sentence + self.ten_prev_char[(self.count - 0) % 10]

        if ch1 == "  " and self.prev_char != "  ":
            self.sentence = self.sentence + "  "

        self.prev_char = ch1
        self.current_symbol = ch1
        self.count += 1
        self.ten_prev_char[self.count%10] = ch1

        return self.current_symbol, self.sentence

    @staticmethod
    def distance(x, y):
        return math.sqrt(((x[0] - y[0]) ** 2) + ((x[1] - y[1]) ** 2))
    
    def _insert_text(self, text):
        if not text:
            return
        self.sentence += text

    def delete_last_char(self):
        if len(self.sentence) > 0:
            self.sentence = self.sentence[:-1]

    def clear_sentence(self):
        self.sentence = ""
        self.prev_char = ""
        self.count = -1
        self.ten_prev_char = [" " for _ in range(10)]

# Load CNN model
print("Loading CNN model...")
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'cnn8grps_rad1_model.h5')
if os.path.exists(model_path):
    model = tf.keras.models.load_model(model_path)
    print(f"CNN model loaded from: {model_path}")
else:
    model = None
    print(f"CNN model not found at: {model_path}, will use cvzone only")

# Load TensorFlow function for faster prediction
_predict_fn = None
if model is not None:
    _predict_fn = tf.function(model, reduce_retracing=True)
    _dummy = np.ones((1, 400, 400, 3), dtype="float32")
    try:
        _predict_fn(_dummy, training=False)
        print("[OK] TensorFlow function optimized!")
    except Exception as e:
        print(f"[WARN] TensorFlow optimization failed: {e}")
        _predict_fn = None

# Class labels (ASL 26 letters + blank)
CLASS_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 
                'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'del', 'space', 'nothing']

# cvzone HandDetector setup - giống ai_server
try:
    from cvzone.HandTrackingModule import HandDetector
    hd = HandDetector(maxHands=1)
    hd2 = HandDetector(maxHands=1)
    print("cvzone HandDetector initialized!")
except ImportError:
    print("cvzone not installed, falling back to MediaPipe")
    hd = None
    hd2 = None

# White template cho skeleton - giống y như lúc train
WHITE_TEMPLATE_PATH = os.path.join(script_dir, 'white.jpg')
white_template = cv2.imread(WHITE_TEMPLATE_PATH)
if white_template is None:
    white_template = np.ones((400, 400, 3), np.uint8) * 255
    print("Using generated white template (400x400)")
else:
    print(f"White template loaded from: {WHITE_TEMPLATE_PATH}")

# Offset cho crop
offset = 29

# ============================================================
# DỮ LIỆU MÔ TẢ CHI TIẾT 26 THỦ NGỮ ASL - DÀNH CHO HỆ THỐNG FEEDBACK
# ============================================================

# Quy ước trạng thái:
# - DUỖI_THẲNG: ngón thẳng hoàn toàn
# - GẬP_HOÀN_TOÀN: ngón gập vào lòng bàn tay
# - CONG_NHE: cong nhẹ tạo cung
# - GẬP_CHẠM: gập và chạm ngón khác
# - NGOÀI: hướng ra ngoài/phía camera

ASL_LETTER_DESCRIPTIONS = {
    'A': {
        'name': 'Chữ A',
        'emoji': '✊',
        'description': 'Nắm đấm với ngón cái đặt bên hông ngón trỏ',
        'fingers': {
            'thumb': {'state': 'GẬP_NGANG', 'note': 'đặt áp sát bên hông ngón trỏ, không kẹp vào trong'},
            'index': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'thumb_over_fingers': 'Ngón cái cần đặt SANG BÊN HÔNG ngón trỏ, không đè lên trên!',
            'thumb_folded_in': 'Ngón cái cần DUỖI ra và ÁP SÁT cạnh ngón trỏ!',
            'finger_not_bent': 'Ngón [X] cần GẬP HOÀN TOÀN vào lòng bàn tay!',
            'palm_inward': 'Xoay cổ tay để lòng bàn tay HƯỚNG RA NGÀI (về phía camera)!',
            'confused_with_S': 'Đây là chữ A, không phải S — ngón cái đặt bên cạnh, không đè lên!'
        }
    },
    'B': {
        'name': 'Chữ B',
        'emoji': '🖐️',
        'description': 'Bàn tay phẳng, 4 ngón duỗi thẳng, ngón cái gập vào',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay, đè lên gốc 4 ngón'},
            'index': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng hoàn toàn, hướng lên trên'},
            'middle': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng hoàn toàn, khép sát ngón trỏ'},
            'ring': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng hoàn toàn, khép sát ngón giữa'},
            'pinky': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng hoàn toàn, khép sát ngón áp út'}
        },
        'palm_direction': 'NGOÀI',
        'four_fingers_together': True,
        'corrections': {
            'thumb_extended': 'Ngón cái cần GẬP vào lòng bàn tay, không duỗi ra!',
            'fingers_separated': '4 ngón cần KHÉP SÁT nhau, không tách rời!',
            'finger_bent': 'Ngón [X] cần DUỖI THẲNG hoàn toàn!',
            'wrist_tilted': 'Cổ tay cần THẲNG ĐỨNG, các ngón hướng thẳng lên trên!'
        }
    },
    'C': {
        'name': 'Chữ C',
        'emoji': '🤏',
        'description': 'Tay tạo hình chữ C, các ngón cong tạo vòng cung',
        'fingers': {
            'thumb': {'state': 'CONG_NHE', 'note': 'cong đối diện, tạo cung phía dưới-trong'},
            'index': {'state': 'CONG_NHE', 'note': 'cong tạo cung trên của chữ C'},
            'middle': {'state': 'CONG_NHE', 'note': 'cong theo cung chữ C'},
            'ring': {'state': 'CONG_NHE', 'note': 'cong theo cung chữ C'},
            'pinky': {'state': 'CONG_NHE', 'note': 'cong tạo cung dưới của chữ C'}
        },
        'palm_direction': 'NGANG',
        'opening_direction': 'NGANG',
        'corrections': {
            'fingers_too_curved': 'MỞ RỘNG các ngón ra hơn — hình cần là chữ C, không phải O!',
            'fingers_too_straight': 'Các ngón cần CONG LẠI thêm để tạo hình vòng cung!',
            'opening_up_or_down': 'Xoay cổ tay để khoảng hở chữ C HƯỚNG SANG NGANG, không lên trên!',
            'thumb_straight': 'Ngón cái cần CONG LẠI đối diện các ngón kia!'
        }
    },
    'D': {
        'name': 'Chữ D',
        'emoji': '☝️🤏',
        'description': 'Ngón trỏ duỗi lên, 3 ngón gập chạm ngón cái tạo vòng tròn',
        'fingers': {
            'thumb': {'state': 'GẬP_CHẠM', 'note': 'cong, đầu ngón chạm đầu 3 ngón gập (giữa/áp út/út)'},
            'index': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên, hơi cong nhẹ về phía ngón cái'},
            'middle': {'state': 'GẬP_CHẠM', 'note': 'gập cong, đầu ngón chạm đầu ngón cái'},
            'ring': {'state': 'GẬP_CHẠM', 'note': 'gập cong, đầu ngón chạm đầu ngón cái'},
            'pinky': {'state': 'GẬP_CHẠM', 'note': 'gập cong, đầu ngón chạm đầu ngón cái'}
        },
        'palm_direction': 'NGANG',
        'corrections': {
            'middle_not_touching_thumb': 'Đầu ngón giữa cần CHẠM vào đầu ngón cái để tạo vòng tròn!',
            'index_too_curved': 'Ngón trỏ cần DUỖI THẲNG hơn lên trên!',
            'circle_open': 'Ngón cái và các ngón cần KHÉP KÍN tạo thành vòng tròn!',
            'confused_with_G': 'Ngón trỏ cần HƯỚNG LÊN TRÊN, không sang ngang!'
        }
    },
    'E': {
        'name': 'Chữ E',
        'emoji': '🤚',
        'description': 'Tất cả ngón gập xuống, tay "thu nhỏ lại"',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào trong, đặt sát bên dưới các ngón đang gập'},
            'index': {'state': 'GẬP_XUỐNG', 'note': 'gập xuống, móng tay hướng về lòng bàn tay'},
            'middle': {'state': 'GẬP_XUỐNG', 'note': 'gập xuống, móng tay hướng về lòng bàn tay'},
            'ring': {'state': 'GẬP_XUỐNG', 'note': 'gập xuống, móng tay hướng về lòng bàn tay'},
            'pinky': {'state': 'GẬP_XUỐNG', 'note': 'gập xuống, móng tay hướng về lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'thumb_sticking_out': 'Ngón cái cần THU VÀO dưới các ngón gập, không nhô ra!',
            'fingers_not_curled_deep': 'Các ngón cần GẬP SÂU HƠN, đầu ngón gần chạm lòng bàn tay!',
            'confused_with_S': 'Đây là E — các ngón gập xuống phía trước, không nắm vào lòng!',
            'nails_visible': 'Xoay tay để lòng bàn tay HƯỚNG RA NGÀI về phía camera!'
        }
    },
    'F': {
        'name': 'Chữ F',
        'emoji': '🤟',
        'description': 'Ngón trỏ và ngón cái chạm nhau tạo vòng tròn nhỏ, 3 ngón còn lại duỗi',
        'fingers': {
            'thumb': {'state': 'GẬP_CHẠM', 'note': 'cong, chạm đầu ngón trỏ tạo vòng tròn (nhỏ hơn O)'},
            'index': {'state': 'GẬP_CHẠM', 'note': 'cong, đầu ngón chạm đầu ngón cái tạo vòng tròn'},
            'middle': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên'},
            'ring': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên'},
            'pinky': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên'}
        },
        'palm_direction': 'NGOÀI',
        'three_fingers_up': ['middle', 'ring', 'pinky'],
        'corrections': {
            'index_not_touching_thumb': 'Đầu ngón trỏ và ngón cái cần CHẠM NHAU tạo vòng tròn!',
            'three_fingers_bent': 'Ngón giữa, áp út, út cần DUỖI THẲNG lên trên, không gập!',
            'confused_with_OK': '3 ngón còn lại cần DUỖI lên, không gập vào!'
        }
    },
    'G': {
        'name': 'Chữ G',
        'emoji': '👆🤚',
        'description': 'Ngón trỏ và ngón cái chỉ sang ngang, 3 ngón còn lại gập',
        'fingers': {
            'thumb': {'state': 'DUỖI_NGANG', 'note': 'chỉ sang ngang cùng hướng với ngón trỏ'},
            'index': {'state': 'DUỖI_NGANG', 'note': 'chỉ thẳng sang ngang'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'TRONG',
        'corrections': {
            'thumb_up': 'Ngón cái cần XOAY SANG NGANG, không hướng lên trên!',
            'index_up': 'Ngón trỏ cần CHỈ SANG NGANG, không hướng lên!',
            'fingers_extended': 'Ngón giữa, áp út, út cần GẬP HOÀN TOÀN vào lòng bàn tay!'
        }
    },
    'H': {
        'name': 'Chữ H',
        'emoji': '✌️',
        'description': 'Ngón trỏ và ngón giữa chỉ sang ngang song song, ngón cái gập',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay'},
            'index': {'state': 'DUỖI_NGANG', 'note': 'chỉ thẳng sang ngang'},
            'middle': {'state': 'DUỖI_NGANG', 'note': 'chỉ thẳng sang ngang, song song với ngón trỏ'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'TRONG',
        'corrections': {
            'fingers_not_parallel': 'Ngón trỏ và ngón giữa cần SONG SONG nhau, chỉ sang ngang!',
            'thumb_extended': 'Ngón cái cần GẬP vào lòng bàn tay!',
            'ring_pinky_extended': 'Ngón áp út và út cần GẬP HOÀN TOÀN!'
        }
    },
    'I': {
        'name': 'Chữ I',
        'emoji': '🤙',
        'description': 'Chỉ có ngón út duỗi thẳng lên, các ngón khác gập',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay'},
            'index': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'pinky_bent': 'Ngón út cần DUỖI THẲNG LÊN trên!',
            'other_fingers_extended': 'Ngón trỏ, giữa, áp út cần GẬP HOÀN TOÀN!'
        }
    },
    'J': {
        'name': 'Chữ J',
        'emoji': '🤙↩️',
        'description': 'Giống chữ I nhưng có chuyển động vẽ chữ J trong không khí',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay'},
            'index': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên, sau đó vẽ đường cong xuống'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'pinky_bent': 'Ngón út cần DUỖI THẲNG LÊN trên!',
            'other_fingers_extended': 'Ngón trỏ, giữa, áp út cần GẬP HOÀN TOÀN!'
        }
    },
    'K': {
        'name': 'Chữ K',
        'emoji': '☝️☝️',
        'description': 'Ngón trỏ và ngón giữa duỗi lên hình chữ V ngược, ngón cái đặt giữa',
        'fingers': {
            'thumb': {'state': 'GẬP_GIỮA', 'note': 'đặt giữa ngón trỏ và ngón giữa'},
            'index': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên'},
            'middle': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên, cao hơn ngón trỏ'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'middle_lower': 'Ngón giữa cần CAO HƠN ngón trỏ!',
            'fingers_bent': 'Ngón trỏ và ngón giữa cần DUỖI THẲNG lên!',
            'thumb_position': 'Ngón cái cần đặt GIỮA ngón trỏ và ngón giữa!',
            'ring_pinky_extended': 'Ngón áp út và út cần GẬP HOÀN TOÀN!'
        }
    },
    'L': {
        'name': 'Chữ L',
        'emoji': '🤟',
        'description': 'Ngón trỏ chỉ lên, ngón cái chỉ ngang tạo hình chữ L',
        'fingers': {
            'thumb': {'state': 'DUỖI_NGANG', 'note': 'chỉ thẳng sang ngang'},
            'index': {'state': 'DUỖI_THẲNG', 'note': 'chỉ thẳng lên trên vuông góc với ngón cái'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'thumb_up': 'Ngón cái cần XOAY SANG NGANG, vuông góc với ngón trỏ!',
            'index_side': 'Ngón trỏ cần CHỈ THẲNG LÊN trên!',
            'other_fingers_extended': 'Ngón giữa, áp út, út cần GẬP HOÀN TOÀN!'
        }
    },
    'M': {
        'name': 'Chữ M',
        'emoji': '✊👇👇👇',
        'description': 'Nắm đấm với ngón cái đè lên 3 ngón giữa',
        'fingers': {
            'thumb': {'state': 'GẬP_ĐÈ', 'note': 'gập xuống đè lên 3 ngón giữa'},
            'index': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn, bị ngón cái đè lên'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn, bị ngón cái đè lên'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn, bị ngón cái đè lên'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn, nhô lên trên ngón cái'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'thumb_position': 'Ngón cái cần GẬP XUỐNG và ĐÈ LÊN 3 ngón giữa (trỏ, giữa, áp út)!',
            'pinky_under_thumb': 'Ngón út cần NHÔ LÊN trên ngón cái!'
        }
    },
    'N': {
        'name': 'Chữ N',
        'emoji': '✊👇👇',
        'description': 'Nắm đấm với ngón cái đè lên 2 ngón giữa',
        'fingers': {
            'thumb': {'state': 'GẬP_ĐÈ', 'note': 'gập xuống đè lên 2 ngón giữa'},
            'index': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn, bị ngón cái đè lên'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn, bị ngón cái đè lên'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn, nhô lên trên ngón cái'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn, nhô lên trên ngón cái'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'thumb_position': 'Ngón cái cần GẬP XUỐNG và ĐÈ LÊN 2 ngón (trỏ và giữa)!',
            'ring_pinky_under': 'Ngón áp út và út cần NHÔ LÊN trên ngón cái!'
        }
    },
    'O': {
        'name': 'Chữ O',
        'emoji': '👌',
        'description': 'Tất cả các ngón cong chạm nhau tạo hình tròn',
        'fingers': {
            'thumb': {'state': 'CONG_CHẠM', 'note': 'cong và chạm đầu các ngón khác'},
            'index': {'state': 'CONG_CHẠM', 'note': 'cong và chạm ngón cái'},
            'middle': {'state': 'CONG_CHẠM', 'note': 'cong và chạm ngón cái'},
            'ring': {'state': 'CONG_CHẠM', 'note': 'cong và chạm ngón cái'},
            'pinky': {'state': 'CONG_CHẠM', 'note': 'cong và chạm ngón cái'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'not_circular': 'Các ngón cần CONG vào và CHẠM nhau tạo hình TRÒN!',
            'thumb_far': 'Ngón cái cần CONG vào và CHẠM đầu các ngón khác!'
        }
    },
    'P': {
        'name': 'Chữ P',
        'emoji': '👆👇',
        'description': 'Ngón trỏ chỉ xuống, ngón cái đè lên tạo góc, các ngón khác gập',
        'fingers': {
            'thumb': {'state': 'GẬP_ĐÈ', 'note': 'gập xuống đè lên ngón trỏ'},
            'index': {'state': 'DUỖI_XUỐNG', 'note': 'duỗi thẳng chỉ xuống dưới'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'TRONG',
        'corrections': {
            'index_up': 'Ngón trỏ cần CHỈ XUỐNG DƯỚI!',
            'thumb_position': 'Ngón cái cần GẬP XUỐNG đè lên ngón trỏ!'
        }
    },
    'Q': {
        'name': 'Chữ Q',
        'emoji': '👇👇',
        'description': 'Ngón trỏ chỉ xuống, ngón cái đè xuống dưới',
        'fingers': {
            'thumb': {'state': 'DUỖI_XUỐNG', 'note': 'duỗi thẳng chỉ xuống dưới, dưới ngón trỏ'},
            'index': {'state': 'DUỖI_XUỐNG', 'note': 'duỗi thẳng chỉ xuống dưới'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'TRONG',
        'corrections': {
            'index_not_down': 'Ngón trỏ cần CHỈ XUỐNG DƯỚI!',
            'thumb_below_index': 'Ngón cái cần Ở DƯỚI ngón trỏ!'
        }
    },
    'R': {
        'name': 'Chữ R',
        'emoji': '🤞',
        'description': 'Ngón trỏ và ngón giữa duỗi chồng lên nhau, các ngón khác gập',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay'},
            'index': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên'},
            'middle': {'state': 'DUỖI_CHỒNG', 'note': 'duỗi thẳng lên trên, đè lên ngón trỏ'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'fingers_not_crossed': 'Ngón giữa cần ĐÈ LÊN ngón trỏ tạo hình chéo!',
            'other_fingers_extended': 'Ngón áp út và út cần GẬP HOÀN TOÀN!'
        }
    },
    'S': {
        'name': 'Chữ S',
        'emoji': '✊',
        'description': 'Nắm đấm với ngón cái đè lên các ngón khác từ phía trước',
        'fingers': {
            'thumb': {'state': 'GẬP_ĐÈ', 'note': 'gập từ phía trước đè lên các ngón'},
            'index': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'thumb_position': 'Ngón cái cần GẬP TỪ PHÍA TRƯỚC đè lên các ngón!',
            'palm_direction': 'Lòng bàn tay cần HƯỚNG RA NGÀI!'
        }
    },
    'T': {
        'name': 'Chữ T',
        'emoji': '✊👆',
        'description': 'Ngón cái đè lên ngón trỏ, các ngón còn lại gập',
        'fingers': {
            'thumb': {'state': 'GẬP_ĐÈ', 'note': 'gập từ trên xuống đè lên ngón trỏ'},
            'index': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn, bị ngón cái đè lên'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'thumb_on_index': 'Ngón cái cần GẬP XUỐNG đè LÊN ngón trỏ!',
            'thumb_side': 'Ngón cái cần Ở TRÊN ngón trỏ!'
        }
    },
    'U': {
        'name': 'Chữ U',
        'emoji': '👆👆',
        'description': 'Ngón trỏ và ngón giữa duỗi lên sát nhau tạo hình chữ I',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay'},
            'index': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên, sát ngón giữa'},
            'middle': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên, sát ngón trỏ'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'fingers_separate': 'Ngón trỏ và ngón giữa cần SÁT NHAU, không tách rời!',
            'fingers_bent': 'Ngón trỏ và ngón giữa cần DUỖI THẲNG lên!',
            'other_fingers_extended': 'Ngón áp út và út cần GẬP HOÀN TOÀN!'
        }
    },
    'V': {
        'name': 'Chữ V',
        'emoji': '✌️',
        'description': 'Ngón trỏ và ngón giữa duỗi lên tạo hình chữ V',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay'},
            'index': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên, nghiêng ra ngoài'},
            'middle': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên, nghiêng ra ngoài'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'fingers_not_v_shape': 'Ngón trỏ và ngón giữa cần TẠO HÌNH CHỮ V!',
            'fingers_together': 'Ngón trỏ và ngón giữa cần TÁCH RA một chút tạo góc V!',
            'other_fingers_extended': 'Ngón áp út và út cần GẬP HOÀN TOÀN!'
        }
    },
    'W': {
        'name': 'Chữ W',
        'emoji': '🖖',
        'description': 'Ngón trỏ, giữa, áp út duỗi lên tạo hình chữ W',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay'},
            'index': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên'},
            'middle': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên'},
            'ring': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên trên'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'ring_bent': 'Ngón áp út cần DUỖI THẲNG lên trên!',
            'fingers_bent': 'Ngón trỏ, giữa, áp út cần DUỖI THẲNG!',
            'pinky_extended': 'Ngón út cần GẬP HOÀN TOÀN!'
        }
    },
    'X': {
        'name': 'Chữ X',
        'emoji': '☝️👇',
        'description': 'Ngón trỏ gập xuống tạo móc, các ngón khác gập',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay'},
            'index': {'state': 'GẬP_MÓC', 'note': 'gập xuống tạo hình móc'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'index_hook': 'Ngón trỏ cần GẬP XUỐNG tạo hình MÓC!',
            'other_fingers_extended': 'Ngón giữa, áp út, út cần GẬP HOÀN TOÀN!'
        }
    },
    'Y': {
        'name': 'Chữ Y',
        'emoji': '🤟',
        'description': 'Ngón cái và ngón út duỗi ra tạo hình chữ Y',
        'fingers': {
            'thumb': {'state': 'DUỖI_RA', 'note': 'duỗi ra ngoài, nghiêng về phía ngón út'},
            'index': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'DUỖI_RA', 'note': 'duỗi ra ngoài, nghiêng về phía ngón cái'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'thumb_bent': 'Ngón cái cần DUỖI RA NGOÀI!',
            'pinky_bent': 'Ngón út cần DUỖI RA NGOÀI!',
            'middle_fingers_extended': 'Ngón trỏ, giữa, áp út cần GẬP HOÀN TOÀN!'
        }
    },
    'Z': {
        'name': 'Chữ Z',
        'emoji': '👆↩️',
        'description': 'Vẽ chữ Z bằng ngón trỏ trong không khí',
        'fingers': {
            'thumb': {'state': 'GẬP_VÀO', 'note': 'gập vào lòng bàn tay'},
            'index': {'state': 'DUỖI_THẲNG', 'note': 'duỗi thẳng lên, vẽ đường ziczac'},
            'middle': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'ring': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'},
            'pinky': {'state': 'GẬP_HOÀN_TOÀN', 'note': 'gập hoàn toàn vào lòng bàn tay'}
        },
        'palm_direction': 'NGOÀI',
        'corrections': {
            'index_extended': 'Ngón trỏ cần DUỖI THẲNG LÊN!',
            'other_fingers_extended': 'Ngón giữa, áp út, út cần GẬP HOÀN TOÀN!'
        }
    }
}

# Tiếp tục thêm cho các chữ G-Z khi có dữ liệu từ người dùng
# ... (sẽ cập nhật thêm)

def get_finger_state(tip_y, pip_y, mcp_y):
    """
    Xác định trạng thái ngón tay dựa trên vị trí tip, pip và mcp
    - tip_y: tọa độ Y của đầu ngón (càng nhỏ = càng cao)
    - pip_y: tọa độ Y của khớp thứ 2
    - mcp_y: tọa độ Y của khớp base (lòng bàn tay)
    
    Returns: 'duỗi', 'cong_vừa', 'gập'
    """
    # Tính độ gập tương đối (0 = thẳng, 1 = gập hoàn toàn)
    finger_length = pip_y - mcp_y
    if finger_length <= 0:
        finger_length = 1
    
    bend_ratio = (tip_y - pip_y) / finger_length
    
    if bend_ratio < 0.3:
        return 'duỗi'
    elif bend_ratio < 0.7:
        return 'cong_vừa'
    else:
        return 'gập'

def analyze_fingers_cvzone(hand_data, frame_shape, target_letter=''):
    """
    Phân tích ngón tay dựa trên QUY ƯỚC CHI TIẾT của user
    Trạng thái: DUỖI | CONG | GẬP | CHẠM
    Vị trí ngón cái: bên hông | đè lên | kẹp giữa | duỗi ngang | chạm đầu ngón khác
    """
    corrections = []
    
    if not hand_data or 'lmList' not in hand_data:
        return corrections
    
    lmList = hand_data['lmList']
    h, w = frame_shape[:2]
    
    # === LẤY TỌA ĐỘ ===
    # Cổ tay
    wrist = lmList[0]
    # Ngón trỏ
    index_tip = lmList[8]
    index_pip = lmList[6]
    index_mcp = lmList[5]
    # Ngón giữa
    middle_tip = lmList[12]
    middle_pip = lmList[10]
    middle_mcp = lmList[9]
    # Ngón áp út
    ring_tip = lmList[16]
    ring_pip = lmList[14]
    ring_mcp = lmList[13]
    # Ngón út
    pinky_tip = lmList[20]
    pinky_pip = lmList[18]
    pinky_mcp = lmList[17]
    # Ngón cái
    thumb_tip = lmList[4]
    thumb_ip = lmList[3]
    thumb_mcp = lmList[2]
    
    # === XÁC ĐỊNH TRẠNG THÁI ===
    # Trạng thái ngón (DUỖI = tip cao hơn pip)
    index_ext = index_tip[1] < index_pip[1]
    middle_ext = middle_tip[1] < middle_pip[1]
    ring_ext = ring_tip[1] < ring_pip[1]
    pinky_ext = pinky_tip[1] < pinky_pip[1]
    
    # Đếm số ngón duỗi
    num_extended = sum([index_ext, middle_ext, ring_ext, pinky_ext])
    
    # Ngón cái: kiểm tra nhiều hướng
    thumb_ext_up = thumb_tip[1] < thumb_ip[1] - 20  # Duỗi lên trên
    thumb_ext_side = thumb_tip[0] < thumb_mcp[0] - 20  # Duỗi sang ngang (trái)
    thumb_ext_down = thumb_tip[1] > index_pip[1] + 20  # Duỗi xuống dưới
    
    # Tính độ cong của ngón (cho phân biệt C vs O)
    def get_bend_ratio(tip_y, pip_y, mcp_y):
        finger_len = max(pip_y - mcp_y, 1)
        return (tip_y - pip_y) / finger_len
    
    index_bend = get_bend_ratio(index_tip[1], index_pip[1], index_mcp[1])
    middle_bend = get_bend_ratio(middle_tip[1], middle_pip[1], middle_mcp[1])
    ring_bend = get_bend_ratio(ring_tip[1], ring_pip[1], ring_mcp[1])
    pinky_bend = get_bend_ratio(pinky_tip[1], pinky_pip[1], pinky_mcp[1])
    
    # Kiểm tra các ngón có CONG (không duỗi thẳng, không gập hoàn toàn)
    index_curved = 0.3 <= index_bend < 0.8
    middle_curved = 0.3 <= middle_bend < 0.8
    ring_curved = 0.3 <= ring_bend < 0.8
    pinky_curved = 0.3 <= pinky_bend < 0.8
    
    # === KIỂM TRA KHOẢNG CÁCH GIỮA CÁC NGÓN ===
    # Khoảng cách index-middle (cho U vs V)
    dist_index_middle = math.sqrt((index_tip[0]-middle_tip[0])**2 + (index_tip[1]-middle_tip[1])**2)
    # Khoảng cách index-thumb (cho O, F)
    dist_index_thumb = math.sqrt((index_tip[0]-thumb_tip[0])**2 + (index_tip[1]-thumb_tip[1])**2)
    # Khoảng cách middle-thumb
    dist_middle_thumb = math.sqrt((middle_tip[0]-thumb_tip[0])**2 + (middle_tip[1]-thumb_tip[1])**2)
    
    # Kiểm tra ngón có CHẠM nhau (khoảng cách < ngưỡng)
    fingers_touching = dist_index_thumb < 50
    
    # ============================================================
    # CHỮ A: Cái bên hông, 4 ngón gập
    # ============================================================
    if target_letter == 'A':
        # Ngón cái: phải bên hông (ngang), không đè lên
        if thumb_ext_up or thumb_ext_down:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái không ở bên hông!', 'fix': 'Đặt ngón cái ÁP SÁT bên hông ngón trỏ!', 'priority': 'high'})
        elif not thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang gập vào trong!', 'fix': 'DUỖI ngón cái sang ngang bên hông ngón trỏ!', 'priority': 'high'})
        # Kiểm tra ngón cái có đè lên các ngón không (nhầm S)
        if thumb_tip[1] > index_pip[1] - 30 and thumb_tip[1] > middle_pip[1] - 30:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang ĐÈ LÊN các ngón (nhầm chữ S)!', 'fix': 'Đặt ngón cái SANG BÊN HÔNG, không đè lên trên!', 'priority': 'high'})
        # Ngón trỏ: phải gập hoàn toàn
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi!', 'fix': 'GẬP hoàn toàn ngón trỏ vào lòng bàn tay!', 'priority': 'high'})
        # Các ngón còn lại: phải gập
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa vào lòng bàn tay!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út vào lòng bàn tay!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út vào lòng bàn tay!', 'priority': 'high'})
        # Kiểm tra cái tách rời
        if thumb_ext_side and abs(thumb_tip[1] - index_tip[1]) > 40:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái tách rời khỏi ngón trỏ!', 'fix': 'Áp sát ngón cái vào hông ngón trỏ!', 'priority': 'medium'})
    
    # ============================================================
    # CHỮ B: 4 ngón duỗi thẳng, cái gập
    # ============================================================
    elif target_letter == 'B':
        # Ngón cái: phải gập vào
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi ra!', 'fix': 'GẬP ngón cái vào lòng bàn tay!', 'priority': 'high'})
        # 4 ngón: phải duỗi thẳng hoàn toàn
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI thẳng ngón trỏ lên trên!', 'priority': 'high'})
        if not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang gập!', 'fix': 'DUỖI thẳng ngón giữa lên trên!', 'priority': 'high'})
        if not ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang gập!', 'fix': 'DUỖI thẳng ngón áp út lên trên!', 'priority': 'high'})
        if not pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang gập!', 'fix': 'DUỖI thẳng ngón út lên trên!', 'priority': 'high'})
        # Kiểm tra 4 ngón khép sát nhau (nhầm số 4)
        if num_extended >= 3:
            dist_index_middle = abs(index_tip[0] - middle_tip[0])
            if dist_index_middle > 30:
                corrections.append({'finger': 'Các ngón', 'issue': '4 ngón đang tách rời nhau!', 'fix': 'Khép 4 ngón sát lại với nhau!', 'priority': 'medium'})
    
    # ============================================================
    # CHỮ C: Các ngón CONG tạo cung (không duỗi thẳng, không gập)
    # ============================================================
    elif target_letter == 'C':
        # Ngón cái: phải cong đối diện
        if thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi thẳng!', 'fix': 'CONG ngón cái vào đối diện các ngón kia!', 'priority': 'high'})
        # Các ngón: phải CONG, không duỗi thẳng
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi thẳng!', 'fix': 'CONG ngón trỏ tạo cung trên của chữ C!', 'priority': 'high'})
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi thẳng!', 'fix': 'CONG ngón giữa theo cung chữ C!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi thẳng!', 'fix': 'CONG ngón áp út tạo cung dưới!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi thẳng!', 'fix': 'CONG ngón út tạo cung dưới!', 'priority': 'high'})
        # Kiểm tra khoảng cách (C vs O - quá khép thành O)
        dist_thumb_pinky = math.sqrt((thumb_tip[0] - pinky_tip[0])**2 + (thumb_tip[1] - pinky_tip[1])**2)
        if dist_thumb_pinky < 60:
            corrections.append({'finger': 'Hình dạng', 'issue': 'Hình quá khép (nhầm chữ O)!', 'fix': 'MỞ RỘNG khoảng cách để tạo hình C hở!', 'priority': 'high'})
        # Kiểm tra các ngón cong đều nhau
        if num_extended == 0:
            corrections.append({'finger': 'Các ngón', 'issue': 'Các ngón đang gập quá nhiều!', 'fix': 'CONG các ngón vừa phải tạo cung C!', 'priority': 'medium'})
    
    # ============================================================
    # CHỮ D: Trỏ duỗi, 3 ngón gập, cái chạm tạo vòng
    # ============================================================
    elif target_letter == 'D':
        # Ngón trỏ: phải duỗi
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI thẳng ngón trỏ lên trên!', 'priority': 'high'})
        # Kiểm tra trỏ không nghiêng (nhầm G)
        if index_ext and index_tip[0] < index_mcp[0] - 30:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang nghiêng sang ngang!', 'fix': 'DUỖI thẳng ngón trỏ, hướng lên trên!', 'priority': 'high'})
        # 3 ngón còn lại: phải gập
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa xuống!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út xuống!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út xuống!', 'priority': 'high'})
        # Kiểm tra cái chạm các ngón (tạo vòng tròn)
        dist_thumb_middle = math.sqrt((thumb_tip[0] - middle_tip[0])**2 + (thumb_tip[1] - middle_tip[1])**2)
        if dist_thumb_middle > 90:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái chưa chạm các ngón gập!', 'fix': 'CONG ngón cái để chạm đầu các ngón gập!', 'priority': 'medium'})
    
    # ============================================================
    # CHỮ E: Tất cả gập sâu, cái thu vào
    # ============================================================
    elif target_letter == 'E':
        # Ngón cái: phải thu vào, không nhô ra
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang nhô ra ngoài!', 'fix': 'THU ngón cái vào bên dưới các ngón gập!', 'priority': 'high'})
        # 4 ngón: phải gập sâu
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi!', 'fix': 'GẬP SÂU ngón trỏ xuống!', 'priority': 'high'})
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP SÂU ngón giữa xuống!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP SÂU ngón áp út xuống!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP SÂU ngón út xuống!', 'priority': 'high'})
        # Kiểm tra cái có ở bên dưới không (nhầm A/S)
        if thumb_tip[1] < middle_pip[1] - 30:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đặt bên hông thay vì bên dưới!', 'fix': 'Đặt ngón cái bên DƯỚI các ngón gập!', 'priority': 'medium'})
    
    # ============================================================
    # CHỮ F: Trỏ+cái chạm, 3 ngón duỗi
    # ============================================================
    elif target_letter == 'F':
        # Ngón cái: phải cong, chạm ngón trỏ
        if not fingers_touching:
            corrections.append({'finger': 'Ngón cái + Trỏ', 'issue': 'Ngón cái và trỏ chưa chạm nhau!', 'fix': 'Đặt ngón cái chạm đầu ngón trỏ tạo vòng tròn nhỏ!', 'priority': 'high'})
        # Kiểm tra cái không duỗi ngang
        if thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi ngang!', 'fix': 'CONG ngón cái vào chạm ngón trỏ!', 'priority': 'high'})
        # 3 ngón còn lại: phải duỗi
        if not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang gập!', 'fix': 'DUỖI thẳng ngón giữa lên trên!', 'priority': 'high'})
        if not ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang gập!', 'fix': 'DUỖI thẳng ngón áp út lên trên!', 'priority': 'high'})
        if not pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang gập!', 'fix': 'DUỖI thẳng ngón út lên trên!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ G: Trỏ+cái duỗi ngang song song
    # ============================================================
    elif target_letter == 'G':
        # Ngón cái: phải duỗi ngang
        if not thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang không phải hướng ngang!', 'fix': 'DUỖI ngón cái SANG NGANG song song!', 'priority': 'high'})
        # Ngón trỏ: phải hướng ngang (không lên trên)
        if index_ext and index_tip[1] < index_pip[1] - 30:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang hướng LÊN trên!', 'fix': 'XOAY ngón trỏ SANG NGANG song song mặt đất!', 'priority': 'high'})
        # 3 ngón còn lại: phải gập
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa vào lòng bàn tay!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út vào lòng bàn tay!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út vào lòng bàn tay!', 'priority': 'high'})
        # Kiểm tra khoảng cách trỏ-cái (quá xa nhau)
        dist_thumb_index = math.sqrt((thumb_tip[0] - index_tip[0])**2 + (thumb_tip[1] - index_tip[1])**2)
        if dist_thumb_index > 120:
            corrections.append({'finger': 'Hai ngón', 'issue': 'Ngón trỏ và cái quá xa nhau!', 'fix': 'Đưa hai ngón gần nhau, song song nhau!', 'priority': 'medium'})
    
    # ============================================================
    # CHỮ H: Trỏ+giữa duỗi ngang song song, cái gập
    # ============================================================
    elif target_letter == 'H':
        # Ngón cái: phải gập
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi!', 'fix': 'GẬP ngón cái vào lòng bàn tay!', 'priority': 'high'})
        # Trỏ và giữa: phải duỗi ngang
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI ngón trỏ SANG NGANG!', 'priority': 'high'})
        if not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang gập!', 'fix': 'DUỖI ngón giữa SANG NGANG!', 'priority': 'high'})
        # Kiểm tra chỉ có 1 ngón ngang (nhầm G)
        if index_ext and not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Chỉ có 1 ngón ngang (nhầm chữ G)!', 'fix': 'Thêm ngón giữa duỗi thẳng SANG NGANG!', 'priority': 'high'})
        # Kiểm tra 2 ngón có tách nhau (G chỉ có 1 ngón)
        if index_ext and middle_ext:
            dist_index_middle = abs(index_tip[0] - middle_tip[0])
            if dist_index_middle < 20:
                corrections.append({'finger': 'Hai ngón', 'issue': 'Hai ngón đang quá gần nhau!', 'fix': 'TÁCH ngón trỏ và giữa ra xa nhau!', 'priority': 'medium'})
        # 2 ngón còn lại: phải gập
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út xuống!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út xuống!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ I: Chỉ ngón ÚT duỗi
    # ============================================================
    elif target_letter == 'I':
        # Ngón cái: phải gập
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi (nhầm chữ Y)!', 'fix': 'GẬP ngón cái vào trong!', 'priority': 'high'})
        # 3 ngón trên: phải gập
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi!', 'fix': 'GẬP ngón trỏ vào lòng bàn tay!', 'priority': 'high'})
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa vào lòng bàn tay!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út vào lòng bàn tay!', 'priority': 'high'})
        # Ngón út: phải duỗi
        if not pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang gập!', 'fix': 'DUỖI thẳng ngón út lên trên!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ J: Tư thế I + chuyển động vẽ móc câu
    # ============================================================
    elif target_letter == 'J':
        # J có chuyển động nên kiểm tra tư thế cơ bản như I
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi!', 'fix': 'GẬP ngón cái vào trong!', 'priority': 'high'})
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi!', 'fix': 'GẬP ngón trỏ vào!', 'priority': 'high'})
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa vào!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út vào!', 'priority': 'high'})
        if not pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang gập!', 'fix': 'DUỖI ngón út!', 'priority': 'high'})
        # Thông báo cần chuyển động
        corrections.append({'finger': 'Chuyển động', 'issue': 'Chữ J cần thực hiện chuyển động!', 'fix': 'Di chuyển ngón út: lên → vòng xuống → cong ra ngoài!', 'priority': 'medium'})

    # ============================================================
    # CHỮ K: Trỏ lên, giữa chéo 45 độ, cái kẹp giữa
    # ============================================================
    elif target_letter == 'K':
        # Ngón cái: phải kẹp giữa (không duỗi ngang)
        if thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi ngang (nhầm V)!', 'fix': 'Đặt ngón cái KẸP GIỮA ngón trỏ và giữa!', 'priority': 'high'})
        # Ngón trỏ: phải duỗi lên
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI thẳng ngón trỏ lên trên!', 'priority': 'high'})
        # Ngón giữa: phải duỗi chéo
        if not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang gập!', 'fix': 'DUỖI ngón giữa CHÉO ra ngoài khoảng 45 độ!', 'priority': 'high'})
        # Kiểm tra giữa nghiêng đủ chưa (nhầm U/V)
        if middle_ext and abs(middle_tip[0] - index_tip[0]) < 30:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa chưa nghiêng đủ!', 'fix': 'MỞ RỘNG ngón giữa ra ngoài ~45 độ!', 'priority': 'medium'})
        # 2 ngón còn lại: phải gập
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út xuống!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út xuống!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ L: Trỏ lên, cái ngang vuông góc
    # ============================================================
    elif target_letter == 'L':
        # Ngón cái: phải duỗi ngang
        if not thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang gập hoặc không phải hướng ngang!', 'fix': 'DUỖI ngón cái SANG NGANG vuông góc với ngón trỏ!', 'priority': 'high'})
        # Kiểm tra cái hướng lên (nhầm G)
        if thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang hướng lên trên!', 'fix': 'Ngón cái cần nằm ngang hoàn toàn!', 'priority': 'high'})
        # Ngón trỏ: phải duỗi lên
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI thẳng ngón trỏ lên trên!', 'priority': 'high'})
        # Kiểm tra góc L đủ vuông
        if thumb_ext_side and index_ext:
            if abs(index_tip[1] - thumb_tip[1]) < 50:
                corrections.append({'finger': 'Hai ngón', 'issue': 'Hai ngón chưa tạo góc vuông!', 'fix': 'MỞ RỘNG góc giữa ngón cái và ngón trỏ!', 'priority': 'medium'})
        # 3 ngón còn lại: phải gập
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa vào lòng bàn tay!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út vào lòng bàn tay!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út vào lòng bàn tay!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ M: Cái ẩn dưới 3 ngón đè
    # ============================================================
    elif target_letter == 'M':
        # Ngón cái: phải ẩn dưới 3 ngón
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang nhô ra!', 'fix': 'THU ngón cái xuống bên DƯỚI 3 ngón!', 'priority': 'high'})
        # 3 ngón trỏ/giữa/áp út: phải gập đè lên cái
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi!', 'fix': 'GẬP ngón trỏ ĐÈ LÊN ngón cái!', 'priority': 'high'})
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa ĐÈ LÊN ngón cái!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út ĐÈ LÊN ngón cái!', 'priority': 'high'})
        # Ngón út: chỉ gập nhẹ, không đè
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP nhẹ ngón út vào trong!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ N: Cái ẩn dưới 2 ngón đè
    # ============================================================
    elif target_letter == 'N':
        # Ngón cái: phải ẩn dưới 2 ngón
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang nhô ra!', 'fix': 'THU ngón cái xuống bên DƯỚI 2 ngón!', 'priority': 'high'})
        # 2 ngón trỏ/giữa: phải gập đè lên cái
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi!', 'fix': 'GẬP ngón trỏ ĐÈ LÊN ngón cái!', 'priority': 'high'})
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa ĐÈ LÊN ngón cái!', 'priority': 'high'})
        # Ngón áp út: chỉ gập, không đè
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út vào trong!', 'priority': 'high'})
        # Ngón út: gập
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út vào trong!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ O: Tất cả gập cong, chạm nhau tạo tròn
    # ============================================================
    elif target_letter == 'O':
        # Kiểm tra vòng tròn khép kín
        if not fingers_touching:
            corrections.append({'finger': 'Tất cả ngón', 'issue': 'Ngón cái và trỏ chưa chạm nhau!', 'fix': 'Các ngón và ngón cái cần CHẠM nhau tạo hình TRÒN khép kín!', 'priority': 'high'})
        # Các ngón: phải cong gập (không duỗi)
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi thẳng!', 'fix': 'CONG ngón trỏ chạm ngón cái!', 'priority': 'high'})
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'CONG ngón giữa chạm ngón cái!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'CONG ngón áp út chạm ngón cái!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'CONG ngón út chạm ngón cái!', 'priority': 'high'})
        # Ngón cái: phải cong
        if thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi!', 'fix': 'CONG ngón cái chạm các ngón khác!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ P: Trỏ xuống, giữa chéo, cái kẹp (K lật ngược)
    # ============================================================
    elif target_letter == 'P':
        # P là K xoay ngược - ngón trỏ hướng xuống
        # Kiểm tra cổ tay có gập không
        if index_ext and wrist[1] > index_tip[1] + 50:
            corrections.append({'finger': 'Cổ tay', 'issue': 'Cổ tay đang THẲNG (nhầm chữ K)!', 'fix': 'GẬP cổ tay xuống để ngón trỏ hướng XUỐNG DƯỚI!', 'priority': 'high'})
        # Ngón giữa: phải duỗi chéo xuống
        if not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang gập!', 'fix': 'DUỖI ngón giữa chéo xuống ngoài!', 'priority': 'high'})
        # Ngón cái: kẹp giữa
        if thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi ngang!', 'fix': 'KẸP ngón cái vào GIỮA ngón trỏ và giữa!', 'priority': 'high'})
        # 2 ngón còn lại: gập
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út xuống!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út xuống!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ Q: Trỏ+cái xuống song song (G lật ngược)
    # ============================================================
    elif target_letter == 'Q':
        # Q là G xoay ngược - ngón trỏ và cái hướng xuống
        # Kiểm tra cổ tay có gập không
        if index_ext and wrist[1] > index_tip[1] + 50:
            corrections.append({'finger': 'Cổ tay', 'issue': 'Cổ tay đang THẲNG (nhầm chữ G)!', 'fix': 'GẬP cổ tay xuống để 2 ngón hướng XUỐNG!', 'priority': 'high'})
        # Ngón trỏ: phải xuống
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI ngón trỏ xuống dưới!', 'priority': 'high'})
        # Ngón cái: xuống song song với trỏ
        if thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi ngang!', 'fix': 'DUỖI ngón cái XUỐNG song song với ngón trỏ!', 'priority': 'high'})
        # 3 ngón còn lại: gập
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa xuống!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út xuống!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út xuống!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ R: Trỏ+giữa duỗi, giữa đè lên trỏ
    # ============================================================
    elif target_letter == 'R':
        # Ngón cái: phải gập nhẹ đặt lên các ngón
        if thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi!', 'fix': 'GẬP nhẹ ngón cái đặt lên các ngón!', 'priority': 'high'})
        # Ngón trỏ: phải duỗi
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI thẳng ngón trỏ lên trên!', 'priority': 'high'})
        # Ngón giữa: phải duỗi và đè lên trỏ
        if not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang gập!', 'fix': 'DUỖI ngón giữa và ĐÈ LÊN ngón trỏ!', 'priority': 'high'})
        elif middle_tip[0] > index_tip[0]:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa chưa đè lên ngón trỏ!', 'fix': 'Di chuyển ngón giữa SANG TRÁI đè lên ngón trỏ!', 'priority': 'high'})
        # 2 ngón còn lại: gập
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út xuống!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út xuống!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ S: Tất cả gập, cái duỗi đè lên
    # ============================================================
    elif target_letter == 'S':
        # Ngón cái: phải duỗi đè lên (KHÁC A - đây là điểm phân biệt)
        if not thumb_ext_up and not thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang gập vào trong (nhầm A/E)!', 'fix': 'DUỖI ngón cái và ĐÈ LÊN trên các ngón gập!', 'priority': 'high'})
        # Kiểm tra cái đè lên hay đặt bên hông (nhầm A)
        if thumb_ext_side and thumb_tip[1] > index_pip[1] - 20:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đặt bên hông (nhầm chữ A)!', 'fix': 'ĐÈ ngón cái LÊN TRÊN các ngón gập!', 'priority': 'high'})
        # 4 ngón: phải gập hoàn toàn
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi!', 'fix': 'GẬP hoàn toàn ngón trỏ vào lòng bàn tay!', 'priority': 'high'})
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP hoàn toàn ngón giữa vào lòng bàn tay!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP hoàn toàn ngón áp út vào lòng bàn tay!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP hoàn toàn ngón út vào lòng bàn tay!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ T: Cái kẹp giữa trỏ và giữa, đầu nhô ra
    # ============================================================
    elif target_letter == 'T':
        # Ngón cái: kẹp giữa trỏ và giữa (không duỗi ngang)
        if thumb_ext_side:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi ngang!', 'fix': 'KẸP ngón cái GIỮA ngón trỏ và giữa, để đầu nhô ra!', 'priority': 'high'})
        # 4 ngón còn lại: gập
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi!', 'fix': 'GẬP ngón trỏ tạo khe hở!', 'priority': 'high'})
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ U: Trỏ+giữa duỗi SÁT nhau
    # ============================================================
    elif target_letter == 'U':
        # Ngón cái: phải gập
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi!', 'fix': 'GẬP ngón cái vào lòng bàn tay!', 'priority': 'high'})
        # Trỏ và giữa: phải duỗi SÁT nhau
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI thẳng ngón trỏ lên!', 'priority': 'high'})
        if not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang gập!', 'fix': 'DUỖI thẳng ngón giữa lên!', 'priority': 'high'})
        if dist_index_middle > 50:
            corrections.append({'finger': 'Hai ngón', 'issue': 'Hai ngón đang tách rời!', 'fix': 'KHÉP ngón trỏ và giữa SÁT nhau!', 'priority': 'high'})
        # 2 ngón còn lại: gập
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út xuống!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út xuống!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ V: Trỏ+giữa duỗi TÁCH nhau
    # ============================================================
    elif target_letter == 'V':
        # Ngón cái: phải gập
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi!', 'fix': 'GẬP ngón cái vào lòng bàn tay!', 'priority': 'high'})
        # Trỏ và giữa: phải duỗi TÁCH nhau
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI thẳng ngón trỏ lên!', 'priority': 'high'})
        if not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang gập!', 'fix': 'DUỖI thẳng ngón giữa lên!', 'priority': 'high'})
        if dist_index_middle < 30:
            corrections.append({'finger': 'Hai ngón', 'issue': 'Hai ngón đang khép sát!', 'fix': 'TÁCH ngón trỏ và giữa ra xa nhau tạo hình V!', 'priority': 'high'})
        # 2 ngón còn lại: gập
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út xuống!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út xuống!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ W: 3 ngón duỗi tách đều, cái chạm út
    # ============================================================
    elif target_letter == 'W':
        # Ngón cái: chạm ngón út đang gập
        # 3 ngón trỏ/giữa/áp út: phải duỗi tách đều
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI thẳng ngón trỏ lên!', 'priority': 'high'})
        if not middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang gập!', 'fix': 'DUỖI thẳng ngón giữa lên!', 'priority': 'high'})
        if not ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang gập!', 'fix': 'DUỖI thẳng ngón áp út lên!', 'priority': 'high'})
        # Ngón út: gập để cái chạm
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út xuống để ngón cái chạm vào!', 'priority': 'high'})

    # ============================================================
    # CHỮ X: Trỏ gập móc, các ngón gập
    # ============================================================
    elif target_letter == 'X':
        # Ngón cái: gập nhẹ
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi!', 'fix': 'GẬP nhẹ ngón cái!', 'priority': 'medium'})
        # Ngón trỏ: phải gập móc (cong đầu xuống)
        if index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang duỗi thẳng!', 'fix': 'GẬP đầu ngón trỏ tạo hình MÓC/CÂU như dấu hỏi!', 'priority': 'high'})
        # Các ngón còn lại: gập
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út!', 'priority': 'high'})
    
    # ============================================================
    # CHỮ Z: Chỉ cần trỏ duỗi, các ngón gập
    # (Z có chuyển động nên chỉ kiểm tra tĩnh)
    # ============================================================
    elif target_letter == 'Z':
        # Ngón cái: gập
        if thumb_ext_side or thumb_ext_up:
            corrections.append({'finger': 'Ngón cái', 'issue': 'Ngón cái đang duỗi!', 'fix': 'GẬP ngón cái xuống!', 'priority': 'high'})
        # Ngón trỏ: duỗi (để vẽ Z)
        if not index_ext:
            corrections.append({'finger': 'Ngón trỏ', 'issue': 'Ngón trỏ đang gập!', 'fix': 'DUỖI thẳng ngón trỏ (để vẽ chữ Z)!', 'priority': 'high'})
        # Các ngón còn lại: gập
        if middle_ext:
            corrections.append({'finger': 'Ngón giữa', 'issue': 'Ngón giữa đang duỗi!', 'fix': 'GẬP ngón giữa!', 'priority': 'high'})
        if ring_ext:
            corrections.append({'finger': 'Ngón áp út', 'issue': 'Ngón áp út đang duỗi!', 'fix': 'GẬP ngón áp út!', 'priority': 'high'})
        if pinky_ext:
            corrections.append({'finger': 'Ngón út', 'issue': 'Ngón út đang duỗi!', 'fix': 'GẬP ngón út!', 'priority': 'high'})
        # Thông báo cần chuyển động
        corrections.append({'finger': 'Chuyển động', 'issue': 'Chữ Z cần thực hiện chuyển động!', 'fix': 'Di chuyển ngón trỏ: ngang → chéo xuống → ngang!', 'priority': 'medium'})
    
    # Nếu không có corrections = tư thế đúng!
    if len(corrections) == 0 and target_letter:
        corrections.append({'finger': 'Tổng thể', 'issue': 'TUYỆT VỜI! Tư thế đang ĐÚNG!', 'fix': 'Giữ nguyên tư thế hiện tại!', 'priority': 'info'})
    
    return corrections

# ============================================================
# THUẬT TOÁN HEURISTIC RẼ NHÁNH=========================================================

def calculate_distance(p1, p2):
    """Tính khoảng cách Euclidean giữa 2 điểm"""
    return math.sqrt(((p1[0] - p2[0]) ** 2) + ((p1[1] - p2[1]) ** 2))

# CNN model output groups - dựa trên final_pred.py (dòng 405-764)
# CNN output là chỉ số nhóm 0-7, sau đó heuristic phân biệt chữ cụ thể
# Nhóm 0: A, E, M, N, S, T
# Nhóm 1: B, D, F, I, K, R, U, V, W  
# Nhóm 2: C, O
# Nhóm 3: G, H
# Nhóm 4: L
# Nhóm 5: P, Q, Z
# Nhóm 6: X
# Nhóm 7: Y, J

GROUP_LETTERS = {
    0: ['A', 'E', 'M', 'N', 'S', 'T'],
    1: ['B', 'D', 'F', 'I', 'K', 'R', 'U', 'V', 'W'],
    2: ['C', 'O'],
    3: ['G', 'H'],
    4: ['L'],
    5: ['P', 'Q', 'Z'],
    6: ['X'],
    7: ['Y', 'J']
}

# Motion tracking for J (same pose as I but with movement)
_motion_history = []  # Store recent wrist/hand positions
_MOTION_THRESHOLD = 15  # Pixel movement threshold to detect J

def distance(x, y):
    """Tính khoảng cách Euclidean giữa 2 điểm"""
    return math.sqrt(((x[0] - y[0]) ** 2) + ((x[1] - y[1]) ** 2))


def apply_heuristic_rules(cnn_group, pts, cnn_ch2=None):
    """
    Áp dụng THUẬT TOÁN HEURISTIC ĐẦY ĐỦ từ final_pred.py / LegacyPredictorState.update()
    Bao gồm TẤT CẢ logic phân biệt chữ cái.
    
    Landmark indices:
    - pts[0] = WRIST (khớp cổ tay)
    - pts[1] = THUMB CMC  
    - pts[2] = THUMB MCP
    - pts[3] = THUMB IP
    - pts[4] = THUMB TIP (đầu ngón cái)
    - pts[5] = INDEX MCP, pts[6] = INDEX PIP, pts[7] = INDEX DIP, pts[8] = INDEX TIP
    - pts[9] = MIDDLE MCP, pts[10] = MIDDLE PIP, pts[11] = MIDDLE DIP, pts[12] = MIDDLE TIP
    - pts[13] = RING MCP, pts[14] = RING PIP, pts[15] = RING DIP, pts[16] = RING TIP
    - pts[17] = PINKY MCP, pts[18] = PINKY PIP, pts[19] = PINKY DIP, pts[20] = PINKY TIP
    
    Quy ước: pts[X][1] nhỏ hơn = ở CAO HƠN (y tăng từ trên xuống dưới)
    pts[X][0] nhỏ hơn = ở BÊN TRÁI
    """
    # pts is a list of [x, y, z] from cvzone - convert to simple [x, y]
    pts = [[p[0], p[1]] for p in pts]
    
    ch1 = cnn_group
    ch2 = cnn_ch2 if cnn_ch2 is not None else 0
    
    # === BƯỚC 1: Kiểm tra [ch1, ch2] pairs để override group ===
    # Đây là logic QUAN TRỌNG mà phiên bản cũ thiếu!
    
    pl = [ch1, ch2]
    
    # List các pair và điều kiện - từ final_pred.py
    l = [[5, 2], [5, 3], [3, 5], [3, 6], [3, 0], [3, 2], [6, 4], [6, 1], [6, 2], [6, 6], [6, 7], [6, 0], [6, 5],
         [4, 1], [1, 0], [1, 1], [6, 3], [1, 6], [5, 6], [5, 1], [4, 5], [1, 4], [1, 5], [2, 0], [2, 6], [4, 6],
         [1, 0], [5, 7], [1, 6], [6, 1], [7, 6], [2, 5], [7, 1], [5, 4], [7, 0], [7, 5], [7, 2]]
    if pl in l:
        if (pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
            ch1 = 0

    l = [[2, 2], [2, 1]]
    if pl in l:
        if pts[5][0] < pts[4][0]:
            ch1 = 0

    l = [[0, 0], [0, 6], [0, 2], [0, 5], [0, 1], [0, 7], [5, 2], [7, 6], [7, 1]]
    if pl in l:
        if (pts[0][0] > pts[8][0] and pts[0][0] > pts[4][0] and pts[0][0] > pts[12][0] and pts[0][0] > pts[16][0] and pts[0][0] > pts[20][0]) and pts[5][0] > pts[4][0]:
            ch1 = 2

    l = [[6, 0], [6, 6], [6, 2]]
    if pl in l and distance(pts[8], pts[16]) < 52:
        ch1 = 2

    l = [[1, 4], [1, 5], [1, 6], [1, 3], [1, 0]]
    if pl in l:
        if pts[6][1] > pts[8][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1] and pts[0][0] < pts[8][0] and pts[0][0] < pts[12][0] and pts[0][0] < pts[16][0] and pts[0][0] < pts[20][0]:
            ch1 = 3

    l = [[4, 6], [4, 1], [4, 5], [4, 3], [4, 7]]
    if pl in l and pts[4][0] > pts[0][0]:
        ch1 = 3

    l = [[5, 3], [5, 0], [5, 7], [5, 4], [5, 2], [5, 1], [5, 5]]
    if pl in l and pts[2][1] + 15 < pts[16][1]:
        ch1 = 3

    l = [[6, 4], [6, 1], [6, 2]]
    if pl in l and distance(pts[4], pts[11]) > 55:
        ch1 = 4

    l = [[1, 4], [1, 6], [1, 1]]
    if pl in l:
        if (distance(pts[4], pts[11]) > 50) and (pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
            ch1 = 4

    l = [[3, 6], [3, 4]]
    if pl in l and pts[4][0] < pts[0][0]:
        ch1 = 4

    l = [[2, 2], [2, 5], [2, 4]]
    if pl in l and pts[1][0] < pts[12][0]:
        ch1 = 4

    l = [[3, 6], [3, 5], [3, 4]]
    if pl in l:
        if (pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and pts[4][1] > pts[10][1]:
            ch1 = 5

    l = [[3, 2], [3, 1], [3, 6]]
    if pl in l:
        if pts[4][1] + 17 > pts[8][1] and pts[4][1] + 17 > pts[12][1] and pts[4][1] + 17 > pts[16][1] and pts[4][1] + 17 > pts[20][1]:
            ch1 = 5

    l = [[4, 4], [4, 5], [4, 2], [7, 5], [7, 6], [7, 0]]
    if pl in l and pts[4][0] > pts[0][0]:
        ch1 = 5

    l = [[0, 2], [0, 6], [0, 1], [0, 5], [0, 0], [0, 7], [0, 4], [0, 3], [2, 7]]
    if pl in l and pts[0][0] < pts[8][0] and pts[0][0] < pts[12][0] and pts[0][0] < pts[16][0] and pts[0][0] < pts[20][0]:
        ch1 = 5

    l = [[5, 7], [5, 2], [5, 6]]
    if pl in l and pts[3][0] < pts[0][0]:
        ch1 = 7

    l = [[4, 6], [4, 2], [4, 4], [4, 1], [4, 5], [4, 7]]
    if pl in l and pts[6][1] < pts[8][1]:
        ch1 = 7

    l = [[6, 7], [0, 7], [0, 1], [0, 0], [6, 4], [6, 6], [6, 5], [6, 1]]
    if pl in l and pts[18][1] > pts[20][1]:
        ch1 = 7

    l = [[0, 4], [0, 2], [0, 3], [0, 1], [0, 6]]
    if pl in l and pts[5][0] > pts[16][0]:
        ch1 = 6

    l = [[7, 2]]
    if pl in l and pts[18][1] < pts[20][1] and pts[8][1] < pts[10][1]:
        ch1 = 6

    l = [[2, 1], [2, 2], [2, 6], [2, 7], [2, 0]]
    if pl in l and distance(pts[8], pts[16]) > 50:
        ch1 = 6

    l = [[4, 6], [4, 2], [4, 1], [4, 4]]
    if pl in l and distance(pts[4], pts[11]) < 60:
        ch1 = 6

    l = [[1, 4], [1, 6], [1, 0], [1, 2]]
    if pl in l and pts[5][0] - pts[4][0] - 15 > 0:
        ch1 = 6

    l = [[5, 0], [5, 1], [5, 4], [5, 5], [5, 6], [6, 1], [7, 6], [0, 2], [7, 1], [7, 4], [6, 6], [7, 2], [5, 0],
         [6, 3], [6, 4], [7, 5], [7, 2]]
    if pl in l:
        if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
            ch1 = 1

    l = [[6, 1], [6, 0], [0, 3], [6, 4], [2, 2], [0, 6], [6, 2], [7, 6], [4, 6], [4, 1], [4, 2], [0, 2], [7, 1],
         [7, 4], [6, 6], [7, 2], [7, 5], [7, 2]]
    if pl in l:
        if pts[6][1] < pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
            ch1 = 1

    l = [[6, 1], [6, 0], [4, 2], [4, 1], [4, 6], [4, 4]]
    if pl in l:
        if pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
            ch1 = 1

    l = [[5, 0], [3, 4], [3, 0], [3, 1], [3, 5], [5, 5], [5, 4], [5, 1], [7, 6]]
    if pl in l:
        if ((pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and
                (pts[2][0] < pts[0][0]) and pts[4][1] > pts[14][1]):
            ch1 = 1

    l = [[4, 1], [4, 2], [4, 4]]
    if pl in l:
        if (distance(pts[4], pts[11]) < 50) and (
                pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
            ch1 = 1

    l = [[3, 4], [3, 0], [3, 1], [3, 5], [3, 6]]
    if pl in l:
        if ((pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and
                (pts[2][0] < pts[0][0]) and pts[14][1] < pts[4][1]):
            ch1 = 1

    l = [[6, 6], [6, 4], [6, 1], [6, 2]]
    if pl in l and pts[5][0] - pts[4][0] - 15 < 0:
        ch1 = 1

    l = [[5, 4], [5, 5], [5, 1], [0, 3], [0, 7], [5, 0], [0, 2], [6, 2], [7, 5], [7, 1], [7, 6], [7, 7]]
    if pl in l:
        if pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]:
            ch1 = 1

    l = [[1, 5], [1, 7], [1, 1], [1, 6], [1, 3], [1, 0]]
    if pl in l:
        if (pts[4][0] < pts[5][0] + 15) and (pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]):
            ch1 = 7

    l = [[5, 5], [5, 0], [5, 4], [5, 1], [4, 6], [4, 1], [7, 6], [3, 0], [3, 5]]
    if pl in l:
        if ((pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1])) and pts[4][1] > pts[14][1]:
            ch1 = 1

    fg = 13
    l = [[3, 5], [3, 0], [3, 6], [5, 1], [4, 1], [2, 0], [5, 0], [5, 5]]
    if pl in l:
        if not (pts[0][0] + fg < pts[8][0] and pts[0][0] + fg < pts[12][0] and pts[0][0] + fg < pts[16][0] and pts[0][0] + fg < pts[20][0]) and not (
                pts[0][0] > pts[8][0] and pts[0][0] > pts[12][0] and pts[0][0] > pts[16][0] and pts[0][0] > pts[20][0]) and distance(pts[4], pts[11]) < 50:
            ch1 = 1

    l = [[5, 0], [5, 5], [0, 1]]
    if pl in l:
        if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1]:
            ch1 = 1

    # === BƯỚC 2: Subgroup decoding - phân biệt chữ trong cùng nhóm ===
    
    if ch1 == 0:
        ch1 = 'S'
        if pts[4][0] < pts[6][0] and pts[4][0] < pts[10][0] and pts[4][0] < pts[14][0] and pts[4][0] < pts[18][0]:
            ch1 = 'A'
        if pts[4][0] > pts[6][0] and pts[4][0] < pts[10][0] and pts[4][0] < pts[14][0] and pts[4][0] < pts[18][0] and pts[4][1] < pts[14][1] and pts[4][1] < pts[18][1]:
            ch1 = 'T'
        if pts[4][1] > pts[8][1] and pts[4][1] > pts[12][1] and pts[4][1] > pts[16][1] and pts[4][1] > pts[20][1]:
            ch1 = 'E'
        if pts[4][0] > pts[6][0] and pts[4][0] > pts[10][0] and pts[4][0] > pts[14][0] and pts[4][1] < pts[18][1]:
            ch1 = 'M'
        if pts[4][0] > pts[6][0] and pts[4][0] > pts[10][0] and pts[4][1] < pts[18][1] and pts[4][1] < pts[14][1]:
            ch1 = 'N'

    if ch1 == 2:
        ch1 = 'C' if distance(pts[12], pts[4]) > 42 else 'O'
    if ch1 == 3:
        ch1 = 'G' if distance(pts[8], pts[12]) > 72 else 'H'
    if ch1 == 7:
        ch1 = 'Y' if distance(pts[8], pts[4]) > 42 else 'J'
    if ch1 == 4:
        ch1 = 'L'
    if ch1 == 6:
        ch1 = 'X'
    if ch1 == 5:
        if pts[4][0] > pts[12][0] and pts[4][0] > pts[16][0] and pts[4][0] > pts[20][0]:
            index_is_up = pts[8][1] <= (pts[7][1] + 8)
            index_is_forward = pts[8][0] > pts[6][0]
            ch1 = 'Z' if (index_is_up and index_is_forward) else 'Q'
        else:
            ch1 = 'P'

    if ch1 == 1:
        if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
            ch1 = 'B'
        if pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]:
            ch1 = 'D'
        if pts[6][1] < pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]:
            ch1 = 'F'
        if pts[6][1] < pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]:
            ch1 = 'I'
        if pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] < pts[20][1]:
            ch1 = 'W'
        if (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and pts[4][1] < pts[9][1]:
            ch1 = 'K'
        if ((distance(pts[8], pts[12]) - distance(pts[6], pts[10])) < 8) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
            ch1 = 'U'
        if ((distance(pts[8], pts[12]) - distance(pts[6], pts[10])) >= 8) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]) and (pts[4][1] > pts[9][1]):
            ch1 = 'V'
        if (pts[8][0] > pts[12][0]) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] < pts[20][1]):
            ch1 = 'R'

    if ch1 in (1, 'E', 'S', 'X', 'Y', 'B'):
        if pts[6][1] > pts[8][1] and pts[10][1] < pts[12][1] and pts[14][1] < pts[16][1] and pts[18][1] > pts[20][1]:
            ch1 = "  "

    if ch1 in ('E', 'Y', 'B'):
        if (pts[4][0] < pts[5][0]) and (pts[6][1] > pts[8][1] and pts[10][1] > pts[12][1] and pts[14][1] > pts[16][1] and pts[18][1] > pts[20][1]):
            ch1 = "next"

    # Backspace detection
    if (ch1 in ('Next', 'B', 'C', 'H', 'F', 'X') or True) and (
            (pts[0][0] > pts[8][0] and pts[0][0] > pts[12][0] and pts[0][0] > pts[16][0] and pts[0][0] > pts[20][0]) and
            (pts[4][1] < pts[8][1] and pts[4][1] < pts[12][1] and pts[4][1] < pts[16][1] and pts[4][1] < pts[20][1]) and
            (pts[4][1] < pts[6][1] and pts[4][1] < pts[10][1] and pts[4][1] < pts[14][1] and pts[4][1] < pts[18][1])):
        ch1 = 'Backspace'

    return ch1
    
    if cnn_group == 0:  # Group [A, E, M, N, S, T]
        # A: thumb ở BÊN TRÁI tất cả các ngón
        if pts[4][0] < pts[6][0] and pts[4][0] < pts[10][0] and pts[4][0] < pts[14][0] and pts[4][0] < pts[18][0]:
            return 'A'
        # T: thumb ở trên index nhưng bên trái middle, ring, pinky
        if pts[4][0] > pts[6][0] and pts[4][0] < pts[10][0] and pts[4][0] < pts[14][0] and pts[4][0] < pts[18][0] and pts[4][1] < pts[14][1] and pts[4][1] < pts[18][1]:
            return 'T'
        # E: thumb tip ở THẤP hơn tất cả các ngón (gập xuống)
        if pts[4][1] > pts[8][1] and pts[4][1] > pts[12][1] and pts[4][1] > pts[16][1] and pts[4][1] > pts[20][1]:
            return 'E'
        # M: thumb ở PHẢI index và middle, và cao hơn pinky
        if pts[4][0] > pts[6][0] and pts[4][0] > pts[10][0] and pts[4][0] > pts[14][0] and pts[4][1] < pts[18][1]:
            return 'M'
        # N: thumb ở phải index và middle, và cao hơn ring và pinky
        if pts[4][0] > pts[6][0] and pts[4][0] > pts[10][0] and pts[4][1] < pts[18][1] and pts[4][1] < pts[14][1]:
            return 'N'
        return 'S'  # Default cho group 0
    
    elif cnn_group == 1:  # Group [B, D, F, I, K, R, U, V, W]
        # Xác định ngón nào duỗi (tip.y < pip.y = duỗi)
        index_ext = pts[6][1] > pts[8][1]
        middle_ext = pts[10][1] > pts[12][1]
        ring_ext = pts[14][1] > pts[16][1]
        pinky_ext = pts[18][1] > pts[20][1]
        
        num_extended = sum([index_ext, middle_ext, ring_ext, pinky_ext])
        
        # K: Index + Middle duỗi, thumb NẰM GIỮA index và middle (đặc trưng quan trọng nhất)
        # Dùng PIP joints thay vì tips để tracking ổn định hơn
        if index_ext and middle_ext and not ring_ext and not pinky_ext:
            # Thumb tip nằm giữa index PIP và middle PIP theo chiều ngang
            # Thêm margin 25 pixels để xử lý tracking error
            if pts[4][0] > pts[6][0] - 25 and pts[4][0] < pts[10][0] + 25:
                return 'K'
        
        # I: Chỉ ngón ÚT duỗi, 3 ngón kia GẬP
        if pinky_ext and not index_ext and not middle_ext and not ring_ext:
            return 'I'
        
        # D: Chỉ ngón TRỎ duỗi
        if index_ext and not middle_ext and not ring_ext and not pinky_ext:
            return 'D'
        
        # W: 3 ngón trên (trỏ+giữa+áp út) duỗi, ÚT gập
        if index_ext and middle_ext and ring_ext and not pinky_ext:
            return 'W'
        
        # F: Trỏ gập, 3 ngón còn lại duỗi
        if not index_ext and middle_ext and ring_ext and pinky_ext:
            return 'F'
        
        # B: 4 ngón đều duỗi
        if num_extended == 4:
            return 'B'
        
        # U/V/R: Trỏ và giữa duỗi, Áp út và Út gập (KHÔNG phải K)
        if index_ext and middle_ext and not ring_ext and not pinky_ext:
            # R: Giữa đè lên trỏ (middle tip bên phải index tip)
            if pts[12][0] < pts[8][0]:
                return 'R'
            
            # U vs V: dựa vào khoảng cách 2 ngón
            dist = calculate_distance(pts[8], pts[12])
            if dist < 40:
                return 'U'
            return 'V'
        
        return 'B'  # Default
    
    elif cnn_group == 2:  # Group [C, O] - Phân biệt bằng khoảng cách
        dist = calculate_distance(pts[12], pts[4])  # Middle tip vs Thumb tip
        if dist > 42:
            return 'C'
        else:
            return 'O'
    
    elif cnn_group == 3:  # Group [G, H] - Phân biệt bằng khoảng cách
        dist = calculate_distance(pts[8], pts[12])  # Index tip vs Middle tip
        dist_thumb_middle = calculate_distance(pts[4], pts[12])  # Thumb tip vs Middle tip
        
        # Cross-check: Phân biệt P vs G khi CNN nhầm nhóm
        # P: ngón cái gập vào trong (thumb tip gần middle-base area)
        # G: ngón cái chỉ sang ngang (thumb tip xa middle area)
        thumb_is_folded = dist_thumb_middle < 65  # Thumb gần middle = P gesture
        
        # P: ngón trỏ cao hơn nhiều so với ngón giữa (index cao, middle gập)
        index_height_vs_middle = pts[8][1] - pts[12][1]  # Positive = index lower (higher on screen)
        index_much_higher = index_height_vs_middle > 40
        
        if thumb_is_folded and index_much_higher:
            # P: thumb gập + index cao → chuyển sang nhóm P
            return 'P'
        
        if dist > 72:
            return 'G'
        else:
            return 'H'
    
    elif cnn_group == 4:  # Group [L]
        return 'L'
    
    elif cnn_group == 5:  # Group [P, Q, Z]
        # Z: thumb ở bên phải của middle, ring, pinky
        if pts[4][0] > pts[12][0] and pts[4][0] > pts[16][0] and pts[4][0] > pts[20][0]:
            if pts[8][1] < pts[5][1]:  # Index tip cao hơn index MCP = Z
                return 'Z'
            else:
                return 'Q'
        else:
            return 'P'
    
    elif cnn_group == 6:  # Group [X]
        return 'X'
    
    elif cnn_group == 7:  # Group [Y, J]
        # Y: Cái duỗi ngang + Út duỗi
        # I: Chỉ Út duỗi
        # J: Giống I nhưng có chuyển động (tay vẽ hình J)
        
        thumb_extended_side = pts[4][0] < pts[2][0] - 15
        pinky_ext = pts[18][1] > pts[20][1]
        
        # Y: Thumb duỗi ngang + Pinky duỗi
        if thumb_extended_side and pinky_ext:
            _motion_history.clear()  # Reset motion for Y
            return 'Y'
        
        # I vs J: Chỉ Pinky duỗi
        if pinky_ext and not thumb_extended_side:
            # Track motion using wrist position (point 0)
            wrist = pts[0]
            _motion_history.append((wrist[0], wrist[1]))
            if len(_motion_history) > 15:
                _motion_history.pop(0)
            
            # Calculate motion
            if len(_motion_history) >= 3:
                oldest = _motion_history[0]
                newest = _motion_history[-1]
                motion = abs(newest[0] - oldest[0]) + abs(newest[1] - oldest[1])
                
                if motion > _MOTION_THRESHOLD:
                    return 'J'  # Motion detected = J
                else:
                    return 'I'  # No motion = I
        
        return 'Y'  # Default
    
    # Fallback - trả về chữ đầu tiên của nhóm
    return GROUP_LETTERS.get(cnn_group, ['?'])[0]


def predict_with_cnn_and_heuristic(skeleton_img, pts):
    """
    Dự đoán chữ cái bằng CNN + Heuristic rẽ nhánh
    """
    if model is None:
        return None, 0.0, [], 'N/A'
    
    try:
        # Reshape và normalize cho model
        white_input = skeleton_img.reshape(1, 400, 400, 3)
        
        if _predict_fn is not None:
            prob = np.array(_predict_fn(white_input, training=False)[0], dtype='float32')
        else:
            prob = model.predict(white_input, verbose=0)[0]
        
        # Lấy top 2 predictions
        ch1 = int(np.argmax(prob))
        prob_copy = prob.copy()
        prob_copy[ch1] = 0
        ch2 = int(np.argmax(prob_copy))
        
        cnn_group = ch1
        cnn_confidence = float(prob[ch1])
        
        # Log top predictions for debugging
        print(f"  CNN: top3 groups={[int(np.argsort(prob)[-i-1]) for i in range(3)]}, conf={[float(prob[int(np.argsort(prob)[-i-1])]) for i in range(3)]}")
        
        # Áp dụng heuristic để phân biệt chữ trong cùng nhóm
        final_letter = apply_heuristic_rules(cnn_group, pts)
        
        print(f"  RESULT: group={cnn_group} -> letter={final_letter}")
        
        # Get top 3 predictions for debugging
        top_indices = np.argsort(prob)[-3:][::-1]
        top_predictions = [
            {'letter': CLASS_LABELS[int(i)], 'confidence': float(prob[i]), 'group': int(i)}
            for i in top_indices
        ]
        
        return final_letter, cnn_confidence, top_predictions, f"CNN:group={cnn_group}"
    except Exception as e:
        print(f"CNN+Heuristic prediction error: {e}")
        return None, 0.0, [], "Error"


@app.route('/predict', methods=['POST'])
def predict():
    """
    API endpoint cho việc dự đoán - SỬ DỤNG CNN + cvzone
    Giống như ai_server: vẽ skeleton trên nền trắng 400x400 rồi predict
    """
    try:
        data = request.json
        image_data = data.get('image', '')
        target_letter = data.get('target_letter', '').upper()
        
        if not image_data:
            return jsonify({'error': 'No image data'}), 400
        
        # Decode base64 image
        if ',' in image_data:
            image_data = image_data.split(',')[1]
        image_bytes = base64.b64decode(image_data)
        image = Image.open(io.BytesIO(image_bytes))
        image = np.array(image)
        
        # Handle RGBA images
        if len(image.shape) == 3 and image.shape[2] == 4:
            image = cv2.cvtColor(image, cv2.COLOR_RGBA2RGB)
        elif len(image.shape) == 3:
            image = cv2.cvtColor(image, cv2.COLOR_RGB2BGR)
        
        # Mirror frame như ai_server
        frame = cv2.flip(image, 1)
        
        letter = None
        confidence = 0.0
        corrections = []
        skeleton_base64 = None
        top_predictions = []
        debug_info = "N/A"
        is_hand_present = False
        
        if hd is not None:
            # Sử dụng cvzone HandDetector - giống ai_server
            hands_result = hd.findHands(frame, draw=False, flipType=True)
            hands = hands_result[0] if isinstance(hands_result, tuple) else hands_result
            
            if hands and len(hands) > 0:
                is_hand_present = True
                hand = hands[0]
                x, y, w, h = hand['bbox']
                
                # Crop với offset
                height, width, _ = frame.shape
                y1, y2 = max(0, y - offset), min(height, y + h + offset)
                x1, x2 = max(0, x - offset), min(width, x + w + offset)
                
                image_crop = frame[y1:y2, x1:x2]
                
                if image_crop.size > 0:
                    white = white_template.copy()
                    
                    # Find hands trong crop
                    handz_result = hd2.findHands(image_crop, draw=False, flipType=True)
                    handz = handz_result[0] if isinstance(handz_result, tuple) else handz_result
                    
                    if handz and len(handz) > 0:
                        hand_crop = handz[0]
                        pts = hand_crop['lmList']
                        
                        # Tính offset để căn giữa - giống ai_server
                        os = ((400 - w) // 2) - 15
                        os1 = ((400 - h) // 2) - 15
                        
                        # Vẽ skeleton lên nền trắng - GIỐNG Y LÚC TRAIN
                        for t in range(0, 4, 1):
                            cv2.line(white, 
                                    (int(pts[t][0] + os), int(pts[t][1] + os1)), 
                                    (int(pts[t + 1][0] + os), int(pts[t + 1][1] + os1)), 
                                    (0, 255, 0), 3)
                        for t in range(5, 8, 1):
                            cv2.line(white, 
                                    (int(pts[t][0] + os), int(pts[t][1] + os1)), 
                                    (int(pts[t + 1][0] + os), int(pts[t + 1][1] + os1)), 
                                    (0, 255, 0), 3)
                        for t in range(9, 12, 1):
                            cv2.line(white, 
                                    (int(pts[t][0] + os), int(pts[t][1] + os1)), 
                                    (int(pts[t + 1][0] + os), int(pts[t + 1][1] + os1)), 
                                    (0, 255, 0), 3)
                        for t in range(13, 16, 1):
                            cv2.line(white, 
                                    (int(pts[t][0] + os), int(pts[t][1] + os1)), 
                                    (int(pts[t + 1][0] + os), int(pts[t + 1][1] + os1)), 
                                    (0, 255, 0), 3)
                        for t in range(17, 20, 1):
                            cv2.line(white, 
                                    (int(pts[t][0] + os), int(pts[t][1] + os1)), 
                                    (int(pts[t + 1][0] + os), int(pts[t + 1][1] + os1)), 
                                    (0, 255, 0), 3)
                        
                        cv2.line(white, (int(pts[5][0] + os), int(pts[5][1] + os1)), 
                                 (int(pts[9][0] + os), int(pts[9][1] + os1)), (0, 255, 0), 3)
                        cv2.line(white, (int(pts[9][0] + os), int(pts[9][1] + os1)), 
                                 (int(pts[13][0] + os), int(pts[13][1] + os1)), (0, 255, 0), 3)
                        cv2.line(white, (int(pts[13][0] + os), int(pts[13][1] + os1)), 
                                 (int(pts[17][0] + os), int(pts[17][1] + os1)), (0, 255, 0), 3)
                        cv2.line(white, (int(pts[0][0] + os), int(pts[0][1] + os1)), 
                                 (int(pts[5][0] + os), int(pts[5][1] + os1)), (0, 255, 0), 3)
                        cv2.line(white, (int(pts[0][0] + os), int(pts[0][1] + os1)), 
                                 (int(pts[17][0] + os), int(pts[17][1] + os1)), (0, 255, 0), 3)
                        
                        for i in range(21):
                            cv2.circle(white, (int(pts[i][0] + os), int(pts[i][1] + os1)), 2, (0, 0, 255), 1)
                        
                        # Dự đoán bằng CNN + Heuristic với state machine
                        # Lấy ch1, ch2 từ CNN
                        white_input = white.reshape(1, 400, 400, 3)
                        if _predict_fn is not None:
                            prob = np.array(_predict_fn(white_input, training=False)[0], dtype='float32')
                        else:
                            prob = model.predict(white_input, verbose=0)[0]
                        
                        ch1 = int(np.argmax(prob))
                        prob_copy = prob.copy()
                        prob_copy[ch1] = 0
                        ch2 = int(np.argmax(prob_copy))
                        prob_copy[ch2] = 0
                        ch3 = int(np.argmax(prob_copy))
                        
                        confidence = float(prob[ch1])
                        
                        # Get top 3 predictions for debugging
                        top_indices = np.argsort(prob)[-3:][::-1]
                        top_predictions = [
                            {'letter': CLASS_LABELS[int(i)], 'confidence': float(prob[i]), 'group': int(i)}
                            for i in top_indices
                        ]
                        
                        # Use state machine to get final letter (with smoothing/deduplication)
                        state = init_predictor_state()
                        letter, sentence = state.update(ch1, ch2, pts, ch3)
                        debug_info = f"CNN:group={ch1},sentence={sentence[:20]}..."
                        
                        # Phân tích ngón tay để đưa ra corrections - với TARGET letter (chữ cần tập)
                        corrections = analyze_fingers_cvzone(hand_crop, frame.shape, target_letter if target_letter else letter)
                        
                        # Encode skeleton image
                        _, skeleton_buf = cv2.imencode('.jpg', white, [cv2.IMWRITE_JPEG_QUALITY, 80])
                        skeleton_base64 = 'data:image/jpeg;base64,' + base64.b64encode(skeleton_buf).decode('utf-8')
        
        return jsonify({
            'is_hand_present': is_hand_present,
            'current_letter': letter,
            'confidence': confidence,
            'corrections': corrections,
            'skeleton_image': skeleton_base64,
            'top_predictions': top_predictions,
            'debug_info': debug_info
        })
    
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'ASL Hand Detection Server',
        'model_loaded': model is not None,
        'cvzone_loaded': hd is not None,
        'white_template_loaded': white_template is not None
    })


@app.route('/clear', methods=['POST'])
def clear_sentence():
    """Clear the prediction sentence"""
    state = init_predictor_state()
    state.clear_sentence()
    return jsonify({'status': 'ok', 'message': 'Sentence cleared'})


if __name__ == '__main__':
    print("Starting ASL Hand Detection Server...")
    print("Server running on http://127.0.0.1:5001")
    print(f"CNN Model: {'Loaded' if model else 'NOT FOUND'}")
    print(f"cvzone: {'Loaded' if hd else 'NOT FOUND'}")
    app.run(host='0.0.0.0', port=5001, debug=True)
