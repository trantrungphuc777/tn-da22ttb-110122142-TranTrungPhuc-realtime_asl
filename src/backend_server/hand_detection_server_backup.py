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
CORS(app)

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
    Phân tích chi tiết từng ngón tay - PHIÊN BẢN NÂNG CAO
    Trả về corrections cụ thể cho từng ngón:
    - Ngón nào cần duỗi CAO HƠN
    - Ngón nào cần gập THẤP HƠN
    - Ngón nào cần GẬP LẠI
    - Ngón nào cần DUỖI RA
    """
    h, w = frame_shape[:2]
    corrections = []
    finger_states = {}
    
    if not hand_data or 'lmList' not in hand_data:
        return corrections
    
    lmList = hand_data['lmList']
    
    # Landmark indices (cvzone format: [x, y, z])
    THUMB_TIP, THUMB_IP, THUMB_MCP = 4, 3, 2
    INDEX_TIP, INDEX_PIP, INDEX_MCP = 8, 6, 5
    MIDDLE_TIP, MIDDLE_PIP, MIDDLE_MCP = 12, 10, 9
    RING_TIP, RING_PIP, RING_MCP = 16, 14, 13
    PINKY_TIP, PINKY_PIP, PINKY_MCP = 20, 18, 17
    
    # Tính wrist position để làm reference
    wrist_y = lmList[0][1] / h
    
    # =========================================
    # ANALYZE EACH FINGER
    # =========================================
    
    # INDEX FINGER
    index_tip_y = lmList[INDEX_TIP][1] / h
    index_pip_y = lmList[INDEX_PIP][1] / h
    index_mcp_y = lmList[INDEX_MCP][1] / h
    index_state = get_finger_state(index_tip_y, index_pip_y, index_mcp_y)
    finger_states['index'] = {
        'state': index_state,
        'tip_y': index_tip_y,
        'pip_y': index_pip_y,
        'mcp_y': index_mcp_y
    }
    
    # MIDDLE FINGER
    middle_tip_y = lmList[MIDDLE_TIP][1] / h
    middle_pip_y = lmList[MIDDLE_PIP][1] / h
    middle_mcp_y = lmList[MIDDLE_MCP][1] / h
    middle_state = get_finger_state(middle_tip_y, middle_pip_y, middle_mcp_y)
    finger_states['middle'] = {
        'state': middle_state,
        'tip_y': middle_tip_y,
        'pip_y': middle_pip_y,
        'mcp_y': middle_mcp_y
    }
    
    # RING FINGER
    ring_tip_y = lmList[RING_TIP][1] / h
    ring_pip_y = lmList[RING_PIP][1] / h
    ring_mcp_y = lmList[RING_MCP][1] / h
    ring_state = get_finger_state(ring_tip_y, ring_pip_y, ring_mcp_y)
    finger_states['ring'] = {
        'state': ring_state,
        'tip_y': ring_tip_y,
        'pip_y': ring_pip_y,
        'mcp_y': ring_mcp_y
    }
    
    # PINKY FINGER
    pinky_tip_y = lmList[PINKY_TIP][1] / h
    pinky_pip_y = lmList[PINKY_PIP][1] / h
    pinky_mcp_y = lmList[PINKY_MCP][1] / h
    pinky_state = get_finger_state(pinky_tip_y, pinky_pip_y, pinky_mcp_y)
    finger_states['pinky'] = {
        'state': pinky_state,
        'tip_y': pinky_tip_y,
        'pip_y': pinky_pip_y,
        'mcp_y': pinky_mcp_y
    }
    
    # THUMB - special case (x is more important)
    thumb_tip_x = lmList[THUMB_TIP][0] / w
    thumb_tip_y = lmList[THUMB_TIP][1] / h
    thumb_ip_y = lmList[THUMB_IP][1] / h
    thumb_mcp_x = lmList[THUMB_MCP][0] / w
    index_mcp_x = lmList[INDEX_MCP][0] / w
    
    thumb_state = 'gập'
    if thumb_tip_y < index_pip_y - 0.1:
        thumb_state = 'duỗi'
    elif thumb_tip_y < index_pip_y:
        thumb_state = 'cong_vừa'
    
    finger_states['thumb'] = {
        'state': thumb_state,
        'tip_x': thumb_tip_x,
        'tip_y': thumb_tip_y,
        'ip_y': thumb_ip_y
    }
    
    # =========================================
    # GENERATE SPECIFIC CORRECTIONS
    # =========================================
    
    # Compare finger heights (normalized y: smaller = higher)
    finger_heights = {
        'index': index_tip_y,
        'middle': middle_tip_y,
        'ring': ring_tip_y,
        'pinky': pinky_tip_y
    }
    
    # Check INDEX FINGER
    if index_state == 'gập':
        corrections.append({
            'finger': 'index',
            'emoji': '☝️',
            'issue': f'Ngón trỏ đang BỊ GẬP xuống!',
            'fix': 'DUỖI ngón trỏ THẲNG LÊN trên!',
            'direction': 'up',
            'priority': 'high'
        })
    elif index_state == 'cong_vừa' and target_letter in ['B', 'D', 'K', 'L', 'U', 'V']:
        corrections.append({
            'finger': 'index',
            'emoji': '☝️',
            'issue': f'Ngón trỏ đang cong, cần DUỖI THẲNG hơn!',
            'fix': 'Duỗi thẳng ngón trỏ lên trên!',
            'direction': 'up',
            'priority': 'medium'
        })
    elif index_tip_y > 0.5:  # Too low
        corrections.append({
            'finger': 'index',
            'emoji': '☝️',
            'issue': f'Ngón trỏ đang THẤP!',
            'fix': 'NÂNG ngón trỏ LÊN cao hơn!',
            'direction': 'up',
            'priority': 'medium'
        })
    
    # Check MIDDLE FINGER
    if middle_state == 'gập':
        corrections.append({
            'finger': 'middle',
            'emoji': '🖕',
            'issue': f'Ngón giữa đang BỊ GẬP xuống!',
            'fix': 'DUỖI ngón giữa THẲNG LÊN trên!',
            'direction': 'up',
            'priority': 'high'
        })
    elif middle_state == 'cong_vừa' and target_letter in ['B', 'K', 'U', 'V', 'W']:
        corrections.append({
            'finger': 'middle',
            'emoji': '🖕',
            'issue': f'Ngón giữa đang cong, cần DUỖI THẲNG hơn!',
            'fix': 'Duỗi thẳng ngón giữa lên trên!',
            'direction': 'up',
            'priority': 'medium'
        })
    elif middle_tip_y > 0.5:
        corrections.append({
            'finger': 'middle',
            'emoji': '🖕',
            'issue': f'Ngón giữa đang THẤP!',
            'fix': 'NÂNG ngón giữa LÊN cao hơn!',
            'direction': 'up',
            'priority': 'medium'
        })
    
    # Check RING FINGER
    if ring_state == 'gập' and target_letter in ['B', 'W']:
        corrections.append({
            'finger': 'ring',
            'emoji': '💍',
            'issue': f'Ngón nhẫn đang BỊ GẬP xuống!',
            'fix': 'DUỖI ngón nhẫn THẲNG LÊN trên!',
            'direction': 'up',
            'priority': 'high'
        })
    elif ring_state == 'cong_vừa' and target_letter == 'W':
        corrections.append({
            'finger': 'ring',
            'emoji': '💍',
            'issue': f'Ngón nhẫn đang cong, cần DUỖI THẲNG hơn!',
            'fix': 'Duỗi thẳng ngón nhẫn lên trên!',
            'direction': 'up',
            'priority': 'medium'
        })
    elif ring_tip_y > 0.5 and target_letter == 'W':
        corrections.append({
            'finger': 'ring',
            'emoji': '💍',
            'issue': f'Ngón nhẫn đang THẤP!',
            'fix': 'NÂNG ngón nhẫn LÊN cao hơn!',
            'direction': 'up',
            'priority': 'medium'
        })
    
    # Check PINKY FINGER
    if pinky_state == 'gập' and target_letter == 'I':
        corrections.append({
            'finger': 'pinky',
            'emoji': '🤙',
            'issue': f'Ngón út đang BỊ GẬP xuống!',
            'fix': 'DUỖI ngón út THẲNG LÊN trên!',
            'direction': 'up',
            'priority': 'high'
        })
    elif pinky_state == 'duỗi' and target_letter == 'E':
        corrections.append({
            'finger': 'pinky',
            'emoji': '🤙',
            'issue': f'Ngón út đang DUỖI ra!',
            'fix': 'GẬP ngón út XUỐNG!',
            'direction': 'down',
            'priority': 'high'
        })
    elif pinky_state == 'duỗi' and target_letter in ['A', 'S']:
        corrections.append({
            'finger': 'pinky',
            'emoji': '🤙',
            'issue': f'Ngón út đang DUỖI ra ngoài!',
            'fix': 'GẬP ngón út vào LÒNG BÀN TAY!',
            'direction': 'down',
            'priority': 'high'
        })
    
    # Check THUMB position - Chữ A: ngón cái DUỖI bên hông (không gập!)
    if thumb_state == 'duỗi' and target_letter == 'S':
        corrections.append({
            'finger': 'thumb',
            'issue': f'Ngón cái đang DUỖI ra!',
            'fix': 'GẬP ngón cái vào LÒNG BÀN TAY!',
            'direction': 'fold',
            'priority': 'high'
        })
    elif thumb_state == 'duỗi' and target_letter in ['E', 'I']:
        corrections.append({
            'finger': 'thumb',
            'issue': f'Ngón cái đang DUỖI ra!',
            'fix': 'GẬP ngón cái vào LÒNG BÀN TAY!',
            'direction': 'fold',
            'priority': 'high'
        })
    # Check THUMB position for G, L - thumb should point SIDEWAYS, not up
    elif thumb_state == 'duỗi' and target_letter in ['G', 'L']:
        if thumb_tip_y < index_pip_y - 0.1:
            corrections.append({
                'finger': 'thumb',
                'issue': f'Ngón cái đang hướng LÊN trên!',
                'fix': 'XOAY ngón cái SANG NGANG (vuông góc với ngón trỏ)!',
                'direction': 'side',
                'priority': 'high'
            })
        elif thumb_tip_x < thumb_mcp_x + 0.05:
            corrections.append({
                'finger': 'thumb',
                'issue': f'Ngón cái chưa XOAY ra ngoài!',
                'fix': 'Xoay cổ tay để ngón cái chỉ SANG NGANG!',
                'direction': 'rotate',
                'priority': 'high'
            })
    
    # Check H: thumb should be FOLDED, index and middle should point SIDEWAYS (parallel)
    elif target_letter == 'H':
        if thumb_state == 'duỗi':
            corrections.append({
                'finger': 'thumb',
                'issue': f'Ngón cái đang DUỖI ra!',
                'fix': 'GẬP ngón cái vào LÒNG BÀN TAY!',
                'direction': 'fold',
                'priority': 'high'
            })
        if index_state != 'duỗi':
            corrections.append({
                'finger': 'index',
                'emoji': '☝️',
                'issue': f'Ngón trỏ đang BỊ GẬP!',
                'fix': 'DUỖI ngón trỏ thẳng SANG NGANG!',
                'direction': 'side',
                'priority': 'high'
            })
        if middle_state != 'duỗi':
            corrections.append({
                'finger': 'middle',
                'emoji': '🖕',
                'issue': f'Ngón giữa đang BỊ GẬP!',
                'fix': 'DUỖI ngón giữa thẳng SANG NGANG!',
                'direction': 'side',
                'priority': 'high'
            })
        # Check if index and middle are parallel (similar X direction)
        if index_state == 'duỗi' and middle_state == 'duỗi':
            index_mcp_x = lmList[INDEX_MCP][0] / w
            middle_mcp_x = lmList[MIDDLE_MCP][0] / w
            index_tip_x = lmList[INDEX_TIP][0] / w
            middle_tip_x = lmList[MIDDLE_TIP][0] / w
            # Check if fingers are pointing roughly in same direction
            if abs((index_tip_x - index_mcp_x) - (middle_tip_x - middle_mcp_x)) > 0.1:
                corrections.append({
                    'finger': 'both',
                    'emoji': '✌️',
                    'issue': f'Hai ngón trỏ và giữa không SONG SONG!',
                    'fix': 'Điều chỉnh để hai ngón CHỈ CÙNG HƯỚNG NGANG!',
                    'direction': 'parallel',
                    'priority': 'high'
                })
    
    # Check R: middle finger should CROSS OVER index (thumbs still folded)
    elif target_letter == 'R':
        if thumb_state != 'gập':
            corrections.append({
                'finger': 'thumb',
                'issue': f'Ngón cái đang KHÔNG gập!',
                'fix': 'GẬP ngón cái vào LÒNG BÀN TAY!',
                'direction': 'fold',
                'priority': 'medium'
            })
        if index_state != 'duỗi':
            corrections.append({
                'finger': 'index',
                'emoji': '☝️',
                'issue': f'Ngón trỏ đang BỊ GẬP!',
                'fix': 'DUỖI ngón trỏ thẳng LÊN!',
                'direction': 'up',
                'priority': 'high'
            })
        if middle_state != 'duỗi':
            corrections.append({
                'finger': 'middle',
                'emoji': '🖕',
                'issue': f'Ngón giữa đang BỊ GẬP!',
                'fix': 'DUỖI ngón giữa thẳng LÊN và ĐÈ LÊN ngón trỏ!',
                'direction': 'cross',
                'priority': 'high'
            })
        # Check if middle is actually crossing over index
        elif index_state == 'duỗi':
            middle_tip_x = lmList[MIDDLE_TIP][0] / w
            index_tip_x = lmList[INDEX_TIP][0] / w
            if middle_tip_x < index_tip_x - 0.05:
                corrections.append({
                    'finger': 'middle',
                    'emoji': '🖕',
                    'issue': f'Ngón giữa chưa ĐÈ LÊN ngón trỏ!',
                    'fix': 'Di chuyển ngón giữa sang TRÁI để đè lên ngón trỏ!',
                    'direction': 'cross_left',
                    'priority': 'high'
                })
    
    # Check P and Q: index should point DOWN, thumb below for Q
    elif target_letter in ['P', 'Q']:
        if index_state != 'gập':
            corrections.append({
                'finger': 'index',
                'emoji': '☝️',
                'issue': f'Ngón trỏ đang KHÔNG gập!',
                'fix': 'GẬP ngón trỏ XUỐNG DƯỚI!',
                'direction': 'down',
                'priority': 'high'
            })
        # For Q specifically, thumb must point DOWN (below index)
        if target_letter == 'Q':
            if thumb_state == 'gập' and thumb_tip_y < index_pip_y:
                corrections.append({
                    'finger': 'thumb',
                    'issue': f'Ngón cái đang ở TRÊN ngón trỏ!',
                    'fix': 'XOAY ngón cái XUỐNG DƯỚI ngón trỏ!',
                    'direction': 'down',
                    'priority': 'high'
                })
    
    # Check Z: index points UP and thumb is to the LEFT
    elif target_letter == 'Z':
        if index_state != 'duỗi':
            corrections.append({
                'finger': 'index',
                'emoji': '☝️',
                'issue': f'Ngón trỏ đang BỊ GẬP!',
                'fix': 'DUỖI ngón trỏ THẲNG LÊN!',
                'direction': 'up',
                'priority': 'high'
            })
        if thumb_state != 'gập':
            corrections.append({
                'finger': 'thumb',
                'issue': f'Ngón cái đang KHÔNG gập!',
                'fix': 'GẬP ngón cái vào LÒNG BÀN TAY!',
                'direction': 'fold',
                'priority': 'medium'
            })
        # Z requires thumb to be to the LEFT of fingers
        elif thumb_state == 'gập':
            thumb_tip_x = lmList[THUMB_TIP][0] / w
            index_tip_x = lmList[INDEX_TIP][0] / w
            if thumb_tip_x > index_tip_x + 0.1:
                corrections.append({
                    'finger': 'thumb',
                    'issue': f'Ngón cái đang Ở BÊN PHẢI!',
                    'fix': 'Xoay cổ tay để ngón cái Ở BÊN TRÁI ngón trỏ!',
                    'direction': 'left',
                    'priority': 'medium'
                })
    
    # Check O: all fingers should form a circle
    elif target_letter == 'O':
        extended_fingers = sum([1 for state in [index_state, middle_state, ring_state, pinky_state] if state == 'duỗi'])
        if extended_fingers > 1:
            corrections.append({
                'finger': 'all',
                'emoji': '👌',
                'issue': f'{extended_fingers} ngón đang DUỖI ra!',
                'fix': 'GẬP TẤT CẢ các ngón lại tạo hình TRÒN!',
                'direction': 'circle',
                'priority': 'high'
            })
        if thumb_state == 'duỗi':
            corrections.append({
                'finger': 'thumb',
                'issue': f'Ngón cái đang DUỖI ra!',
                'fix': 'GẬP ngón cái vào TẠO VÒNG TRÒN với các ngón!',
                'direction': 'circle_thumb',
                'priority': 'high'
            })
    
    # Check if thumb is too far from palm
    elif thumb_tip_x > index_mcp_x + 0.1:
        corrections.append({
            'finger': 'thumb',
            'issue': f'Ngón cái đang Ở PHÍA TRƯỚC (xa mặt tay)!',
            'fix': 'Di chuyển ngón cái VÀO GẦN lòng bàn tay hơn!',
            'direction': 'inward',
            'priority': 'medium'
        })
    elif thumb_tip_y > index_pip_y + 0.05:
        corrections.append({
            'finger': 'thumb',
            'issue': f'Ngón cái đang CAO QUÁ!',
            'fix': 'Hạ ngón cái XUỐNG thấp hơn!',
            'direction': 'down',
            'priority': 'medium'
        })
    elif thumb_tip_y < index_pip_y - 0.1 and target_letter not in ['G', 'L', 'Y']:
        corrections.append({
            'finger': 'thumb',
            'issue': f'Ngón cái đang THẤP QUÁ!',
            'fix': 'Nâng ngón cái LÊN!',
            'direction': 'up',
            'priority': 'medium'
        })
    
    # =========================================
    # Compare relative finger heights
    # =========================================
    if abs(index_tip_y - middle_tip_y) > 0.05 and target_letter in ['U', 'V']:
        if index_tip_y > middle_tip_y:
            corrections.append({
                'finger': 'index',
                'emoji': '☝️',
                'issue': f'Ngón trỏ đang THẤP HƠN ngón giữa!',
                'fix': 'NÂNG ngón trỏ ngang với ngón giữa!',
                'direction': 'equal',
                'priority': 'medium'
            })
        else:
            corrections.append({
                'finger': 'middle',
                'emoji': '🖕',
                'issue': f'Ngón giữa đang THẤP HƠN ngón trỏ!',
                'fix': 'NÂNG ngón giữa ngang với ngón trỏ!',
                'direction': 'equal',
                'priority': 'medium'
            })
    
    # Check if fingers should be together (for B, V, W)
    if target_letter in ['B', 'V']:
        if abs(index_tip_y - middle_tip_y) > 0.03:
            corrections.append({
                'finger': 'both',
                'emoji': '👆',
                'issue': f'Hai ngón không CÙNG ĐỘ CAO!',
                'fix': 'Điều chỉnh để hai ngón NGANG NHAU!',
                'direction': 'equal',
                'priority': 'medium'
            })
    
    # Add wrist position feedback if needed
    if target_letter in ['A', 'B', 'E', 'S']:
        # Check if wrist angle might be off
        wrist_tilt = abs(wrist_y - 0.7)
        if wrist_tilt > 0.1:
            corrections.append({
                'finger': 'wrist',
                'emoji': '🤚',
                'issue': f'Cổ tay có thể bị NGHIÊNG!',
                'fix': 'Giữ cổ tay THẲNG!',
                'direction': 'straighten',
                'priority': 'low'
            })
    
    # If no specific corrections, add general feedback
    if len(corrections) == 0 and target_letter:
        corrections.append({
            'finger': 'general',
            'emoji': '✨',
            'issue': 'Tư thế tay đang TỐT!',
            'fix': 'Giữ nguyên tư thế hiện tại!',
            'direction': 'maintain',
            'priority': 'info'
        })
    
    return corrections


# ============================================================
# THUẬT TOÁN HEURISTIC RẼ NHÁNH - PHÂN BIỆT CHỮ TRONG CÙNG NHÓM
# Dựa trên final_pred.py - từ dòng 685-780
# ============================================================

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

def apply_heuristic_rules(cnn_group, pts):
    """
    Áp dụng thuật toán heuristic rẽ nhánh để phân biệt chữ trong cùng nhóm
    Dựa trên final_pred.py (dòng 685-764)
    
    Landmark indices:
    - pts[0] = WRIST (khớp cổ tay)
    - pts[4] = THUMB TIP (đầu ngón cái)
    - pts[5] = INDEX MCP, pts[6] = INDEX PIP, pts[8] = INDEX TIP
    - pts[9] = MIDDLE MCP, pts[10] = MIDDLE PIP, pts[12] = MIDDLE TIP
    - pts[13] = RING MCP, pts[14] = RING PIP, pts[16] = RING TIP
    - pts[17] = PINKY MCP, pts[18] = PINKY PIP, pts[20] = PINKY TIP
    
    Quy ước: pts[X][1] nhỏ hơn = ở CAO HƠN (y tăng từ trên xuống dưới)
    """
    # pts is a list of [x, y, z] from cvzone
    pts = [[p[0], p[1]] for p in pts]  # Convert to simple [x, y] format
    
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
        # Xác định ngón nào duỗi (tip cao hơn pip)
        # pts[X][1] > pts[Y][1] nghĩa là X ở CAO HƠN Y
        index_extended = pts[6][1] > pts[8][1]  # Index tip cao hơn index pip = duỗi
        middle_extended = pts[10][1] > pts[12][1]
        ring_extended = pts[14][1] > pts[16][1]
        pinky_extended = pts[18][1] > pts[20][1]
        
        # B: tất cả 4 ngón duỗi
        if index_extended and middle_extended and ring_extended and pinky_extended:
            return 'B'
        
        # F: index gập, 3 ngón còn lại duỗi
        if not index_extended and middle_extended and ring_extended and pinky_extended:
            return 'F'
        
        # D: index duỗi, 3 ngón còn lại gập
        if index_extended and not middle_extended and not ring_extended and not pinky_extended:
            return 'D'
        
        # I: 3 ngón trên duỗi, pinky gập
        if index_extended and middle_extended and ring_extended and not pinky_extended:
            # W: index, middle, ring duỗi, pinky gập (thêm điều kiện thumb cao hơn pinky base)
            if pts[4][1] < pts[9][1]:
                return 'W'
            return 'I'
        
        # U hoặc V hoặc R: index và middle duỗi, ring và pinky gập
        if index_extended and middle_extended and not ring_extended and not pinky_extended:
            dist_index_middle = calculate_distance(pts[8], pts[12])
            dist_index_pip_middle_pip = calculate_distance(pts[6], pts[10])
            diff = dist_index_middle - dist_index_pip_middle_pip
            
            # K: index và middle duỗi, thumb ở dưới middle MCP
            if pts[4][1] < pts[9][1]:
                return 'K'
            
            # R: index tip ở bên phải middle tip
            if pts[8][0] > pts[12][0]:
                return 'R'
            
            # U vs V: dựa vào khoảng cách giữa 2 ngón
            if diff < 8:
                return 'U'
            else:
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
    
    elif cnn_group == 7:  # Group [Y, J] - Phân biệt bằng khoảng cách
        dist = calculate_distance(pts[8], pts[4])  # Index tip vs Thumb tip
        if dist > 42:
            return 'Y'
        else:
            return 'J'
    
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
        
        # Áp dụng heuristic để phân biệt chữ trong cùng nhóm
        final_letter = apply_heuristic_rules(cnn_group, pts)
        
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
                        
                        # Dự đoán bằng CNN + Heuristic rẽ nhánh
                        letter, confidence, top_predictions, debug_info = predict_with_cnn_and_heuristic(white, pts)
                        
                        # Phân tích ngón tay để đưa ra corrections - với target letter
                        corrections = analyze_fingers_cvzone(hand_crop, frame.shape, target_letter)
                        
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


if __name__ == '__main__':
    print("Starting ASL Hand Detection Server...")
    print("Server running on http://127.0.0.1:5001")
    print(f"CNN Model: {'Loaded' if model else 'NOT FOUND'}")
    print(f"cvzone: {'Loaded' if hd else 'NOT FOUND'}")
    app.run(host='0.0.0.0', port=5001, debug=True)
