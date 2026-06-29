"""
Phân tích ngón tay cho 26 chữ cái ASL - Bổ sung đầy đủ error cases
Dựa trên: ASL_26_letters_full_error_cases.md

Quy ước trạng thái:
- DUỖI THẲNG: tip.y < pip.y (đầu ngón cao hơn khớp)
- GẬP: tip.y > pip.y (đầu ngón thấp hơn khớp)
- Ngón cái duỗi ngang: tip.x < mcp.x - 20
"""

import math


def calculate_distance(p1, p2):
    """Tính khoảng cách Euclidean giữa 2 điểm"""
    return math.sqrt(((p1[0] - p2[0]) ** 2) + ((p1[1] - p2[1]) ** 2))


def analyze_fingers_cvzone(hand_data, frame_shape, target_letter=''):
    """
    Phân tích ngón tay dựa trên vị trí tuyệt đối từ cvzone/Mediapipe
    Bao gồm đầy đủ 26 chữ cái với các trường hợp lỗi thường gặp
    """
    corrections = []

    if not hand_data or 'lmList' not in hand_data:
        return corrections

    lmList = hand_data['lmList']

    # Vị trí các điểm landmark (x, y)
    index_tip = lmList[8]      # Đầu ngón trỏ
    index_pip = lmList[6]      # Khớp PIP ngón trỏ
    index_mcp = lmList[5]     # Khớp MCP ngón trỏ

    middle_tip = lmList[12]    # Đầu ngón giữa
    middle_pip = lmList[10]    # Khớp PIP ngón giữa

    ring_tip = lmList[16]      # Đầu ngón áp út
    ring_pip = lmList[14]      # Khớp PIP ngón áp út

    pinky_tip = lmList[20]     # Đầu ngón út
    pinky_pip = lmList[18]     # Khớp PIP ngón út

    thumb_tip = lmList[4]      # Đầu ngón cái
    thumb_mcp = lmList[2]      # Khớp MCP ngón cái
    thumb_ip = lmList[3]       # Khớp IP ngón cái

    wrist = lmList[0]          # Khớp cổ tay

    # XÁC ĐỊNH TRẠNG THÁI ngón (tip.y < pip.y = duỗi)
    index_ext = index_tip[1] < index_pip[1]
    middle_ext = middle_tip[1] < middle_pip[1]
    ring_ext = ring_tip[1] < ring_pip[1]
    pinky_ext = pinky_tip[1] < pinky_pip[1]

    # Ngón cái: duỗi ngang nếu tip.x < mcp.x (bên trái)
    thumb_sideways = thumb_tip[0] < thumb_mcp[0] - 20

    # Đếm số ngón duỗi
    num_extended = sum([index_ext, middle_ext, ring_ext, pinky_ext])

    # =========================================
    # CHỮ A: Cái DUỖI ngang, Trỏ GẬP, các ngón GẬP
    # =========================================
    if target_letter == 'A':
        # Lỗi ngón cái
        if not thumb_sideways:
            if thumb_tip[0] > thumb_mcp[0]:
                corrections.append({
                    'finger': 'Ngón cái',
                    'issue': 'Ngón cái đang gập vào trong!',
                    'fix': 'DUỖI ngón cái sang ngang, đặt bên hông ngón trỏ!',
                    'priority': 'high'
                })
            else:
                corrections.append({
                    'finger': 'Ngón cái',
                    'issue': 'Ngón cái đang hướng lên trên!',
                    'fix': 'Ngón cái cần nằm ngang áp sát hông ngón trỏ!',
                    'priority': 'high'
                })

        # Kiểm tra ngón cái có đè lên các ngón không (nhầm S)
        thumb_pressing_on = thumb_tip[1] > index_pip[1] - 20 and thumb_tip[1] > middle_pip[1] - 20
        if thumb_pressing_on:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang đè lên các ngón (giống chữ S)!',
                'fix': 'Đặt ngón cái sang bên hông ngón trỏ, không đè lên!',
                'priority': 'high'
            })

        # Lỗi ngón trỏ
        if index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang DUỖI!',
                'fix': 'GẬP ngón trỏ xuống lòng bàn tay!',
                'priority': 'high'
            })

        # Lỗi các ngón khác
        for name, ext in [('middle', middle_ext), ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'middle': 'Ngón giữa', 'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang DUỖI!',
                    'fix': f'GẬP {fn} xuống lòng bàn tay!',
                    'priority': 'high'
                })

        # Khoảng cách cái - trỏ
        if thumb_sideways and abs(thumb_tip[1] - index_tip[1]) > 30:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái tách rời khỏi ngón trỏ!',
                'fix': 'Áp sát ngón cái vào hông ngón trỏ!',
                'priority': 'medium'
            })

    # =========================================
    # CHỮ B: 4 ngón DUỖI, cái GẬP
    # =========================================
    elif target_letter == 'B':
        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra ngoài!',
                'fix': 'GẬP ngón cái vào lòng bàn tay!',
                'priority': 'high'
            })

        for name, ext in [('index', index_ext), ('middle', middle_ext),
                         ('ring', ring_ext), ('pinky', pinky_ext)]:
            if not ext:
                fn = {'index': 'Ngón trỏ', 'middle': 'Ngón giữa',
                      'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang gập!',
                    'fix': f'DUỖI {fn} thẳng lên!',
                    'priority': 'high'
                })

        # Kiểm tra 4 ngón có khép sát nhau không
        if num_extended >= 3:
            dist_index_middle = abs(index_tip[0] - middle_tip[0])
            if dist_index_middle > 30:
                corrections.append({
                    'finger': 'Các ngón',
                    'issue': 'Các ngón đang tách nhau!',
                    'fix': 'Khép 4 ngón sát lại với nhau!',
                    'priority': 'medium'
                })

    # =========================================
    # CHỮ C: Các ngón cong tạo cung
    # =========================================
    elif target_letter == 'C':
        all_ext = sum([index_ext, middle_ext, ring_ext, pinky_ext])
        if all_ext >= 3:
            corrections.append({
                'finger': 'Các ngón',
                'issue': 'Các ngón đang duỗi thẳng!',
                'fix': 'CONG các ngón lại tạo hình chữ C!',
                'priority': 'high'
            })

        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi thẳng!',
                'fix': 'CONG ngón cái vào đối diện các ngón khác!',
                'priority': 'high'
            })

        # Kiểm tra khoảng cách cái - út (C vs O)
        dist_thumb_pinky = calculate_distance(thumb_tip, pinky_tip)
        if dist_thumb_pinky < 50:
            corrections.append({
                'finger': 'Hai ngón',
                'issue': 'Ngón cái và út quá gần nhau (thành chữ O)!',
                'fix': 'MỞ RỘNG khoảng cách để tạo hình C!',
                'priority': 'high'
            })

    # =========================================
    # CHỮ D: Trỏ duỗi, 3 ngón gập, cái chạm các ngón
    # =========================================
    elif target_letter == 'D':
        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ thẳng lên!',
                'priority': 'high'
            })
        else:
            # Kiểm tra ngón trỏ có nghiêng không (nhầm G)
            if index_tip[0] < index_mcp[0] - 20:
                corrections.append({
                    'finger': 'Ngón trỏ',
                    'issue': 'Ngón trỏ đang nghiêng sang ngang!',
                    'fix': 'DUỖI ngón trỏ thẳng đứng lên trên!',
                    'priority': 'high'
                })

        for name, ext in [('middle', middle_ext), ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'middle': 'Ngón giữa', 'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

        # Kiểm tra cái có chạm các ngón gập không (tạo vòng tròn)
        dist_thumb_index = calculate_distance(thumb_tip, index_tip)
        dist_thumb_middle = calculate_distance(thumb_tip, middle_tip)
        if dist_thumb_middle > 80:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái chưa chạm vào các ngón gập!',
                'fix': 'CONG ngón cái để chạm đầu các ngón gập!',
                'priority': 'medium'
            })

    # =========================================
    # CHỮ E: Tất cả gập sâu, cái thu vào bên dưới
    # =========================================
    elif target_letter == 'E':
        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang nhô ra ngoài!',
                'fix': 'THU ngón cái vào bên dưới các ngón gập!',
                'priority': 'high'
            })

        for name, ext in [('index', index_ext), ('middle', middle_ext),
                         ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'index': 'Ngón trỏ', 'middle': 'Ngón giữa',
                      'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} sâu xuống!',
                    'priority': 'high'
                })

        # Kiểm tra ngón cái có ở dưới các ngón không
        if not thumb_sideways and thumb_tip[1] < middle_pip[1]:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đặt bên hông thay vì bên dưới!',
                'fix': 'Đặt ngón cái vào bên dưới các ngón gập!',
                'priority': 'medium'
            })

    # =========================================
    # CHỮ F: Trỏ và cái chạm nhau tạo vòng, 3 ngón duỗi
    # =========================================
    elif target_letter == 'F':
        # Kiểm tra vòng tròn F
        dist_thumb_index = calculate_distance(thumb_tip, index_tip)
        if dist_thumb_index > 50:
            corrections.append({
                'finger': 'Ngón trỏ và cái',
                'issue': 'Ngón trỏ và cái chưa chạm nhau!',
                'fix': 'Đặt đầu ngón trỏ chạm đầu ngón cái tạo vòng tròn!',
                'priority': 'high'
            })

        for name, ext in [('middle', middle_ext), ('ring', ring_ext), ('pinky', pinky_ext)]:
            if not ext:
                fn = {'middle': 'Ngón giữa', 'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang gập!',
                    'fix': f'DUỖI {fn} thẳng lên!',
                    'priority': 'high'
                })

        # Kiểm tra cái có duỗi ngang không
        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra ngoài!',
                'fix': 'CONG ngón cái vào chạm ngón trỏ!',
                'priority': 'high'
            })

    # =========================================
    # CHỮ G: Trỏ và cái duỗi ngang song song
    # =========================================
    elif target_letter == 'G':
        # Kiểm tra ngón trỏ có hướng lên không (nhầm L)
        if index_tip[1] < index_pip[1] - 30:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang chỉ lên trên!',
                'fix': 'XOAY ngón trỏ SANG NGANG, song song mặt đất!',
                'priority': 'high'
            })

        if not thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang gập!',
                'fix': 'DUỖI ngón cái SANG NGANG song song với ngón trỏ!',
                'priority': 'high'
            })

        for name, ext in [('middle', middle_ext), ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'middle': 'Ngón giữa', 'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

        # Kiểm tra khoảng cách trỏ - cái
        dist_thumb_index = calculate_distance(thumb_tip, index_tip)
        if dist_thumb_index > 100:
            corrections.append({
                'finger': 'Hai ngón',
                'issue': 'Ngón trỏ và cái quá xa nhau!',
                'fix': 'Đưa hai ngón gần nhau, song song nhau!',
                'priority': 'medium'
            })

    # =========================================
    # CHỮ H: Trỏ và giữa duỗi ngang song song
    # =========================================
    elif target_letter == 'H':
        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ SANG NGANG!',
                'priority': 'high'
            })
        elif index_tip[1] < index_pip[1] - 20:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang chỉ lên!',
                'fix': 'XOAY ngón trỏ SANG NGANG!',
                'priority': 'high'
            })

        if not middle_ext:
            corrections.append({
                'finger': 'Ngón giữa',
                'issue': 'Ngón giữa đang gập!',
                'fix': 'DUỖI ngón giữa SANG NGANG!',
                'priority': 'high'
            })
        elif middle_tip[1] < middle_pip[1] - 20:
            corrections.append({
                'finger': 'Ngón giữa',
                'issue': 'Ngón giữa đang chỉ lên!',
                'fix': 'XOAY ngón giữa SANG NGANG!',
                'priority': 'high'
            })

        # Hai ngón phải tách nhau (nhầm G chỉ có 1 ngón)
        if index_ext and middle_ext:
            dist_index_middle = abs(index_tip[0] - middle_tip[0])
            if dist_index_middle < 20:
                corrections.append({
                    'finger': 'Hai ngón',
                    'issue': 'Hai ngón đang quá gần nhau!',
                    'fix': 'TÁCH ngón trỏ và giữa ra xa nhau!',
                    'priority': 'high'
                })

        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra ngoài!',
                'fix': 'GẬP ngón cái xuống!',
                'priority': 'medium'
            })

    # =========================================
    # CHỮ I: Chỉ ngón ÚT duỗi
    # =========================================
    elif target_letter == 'I':
        if not pinky_ext:
            corrections.append({
                'finger': 'Ngón út',
                'issue': 'Ngón út đang gập!',
                'fix': 'DUỖI ngón út thẳng lên!',
                'priority': 'high'
            })

        for name, ext in [('index', index_ext), ('middle', middle_ext), ('ring', ring_ext)]:
            if ext:
                fn = {'index': 'Ngón trỏ', 'middle': 'Ngón giữa', 'ring': 'Ngón áp út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

        # Kiểm tra ngón cái (nhầm Y)
        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra ngoài (nhầm chữ Y)!',
                'fix': 'GẬP ngón cái vào trong, chỉ ngón út duỗi!',
                'priority': 'high'
            })

    # =========================================
    # CHỮ J: Tư thế I + chuyển động vẽ móc câu
    # =========================================
    elif target_letter == 'J':
        # J có chuyển động nên chỉ kiểm tra tư thế cơ bản
        if not pinky_ext:
            corrections.append({
                'finger': 'Ngón út',
                'issue': 'Ngón út đang gập!',
                'fix': 'DUỖI ngón út thẳng lên!',
                'priority': 'high'
            })

        for name, ext in [('index', index_ext), ('middle', middle_ext), ('ring', ring_ext)]:
            if ext:
                fn = {'index': 'Ngón trỏ', 'middle': 'Ngón giữa', 'ring': 'Ngón áp út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

        # Thông báo cần chuyển động
        corrections.append({
            'finger': 'Chuyển động',
            'issue': 'Chữ J cần thực hiện chuyển động vẽ móc câu!',
            'fix': 'Di chuyển ngón út: lên → vòng xuống → cong ra ngoài thành hình J!',
            'priority': 'medium'
        })

    # =========================================
    # CHỮ K: Trỏ và giữa duỗi, cái kẹp giữa
    # =========================================
    elif target_letter == 'K':
        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ thẳng lên!',
                'priority': 'high'
            })

        if not middle_ext:
            corrections.append({
                'finger': 'Ngón giữa',
                'issue': 'Ngón giữa đang gập!',
                'fix': 'DUỖI ngón giữa thẳng lên!',
                'priority': 'high'
            })

        # Kiểm tra ngón cái có kẹp giữa không (nhầm V)
        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra ngoài!',
                'fix': 'Đặt ngón cái KẸP GIỮA ngón trỏ và giữa!',
                'priority': 'high'
            })
        else:
            # Kiểm tra cái có ở giữa không
            if thumb_tip[0] < index_tip[0] - 30 or thumb_tip[0] > middle_tip[0] + 30:
                corrections.append({
                    'finger': 'Ngón cái',
                    'issue': 'Ngón cái chưa kẹp đúng giữa!',
                    'fix': 'Di chuyển ngón cái vào giữa ngón trỏ và giữa!',
                    'priority': 'high'
                })

        for name, ext in [('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

    # =========================================
    # CHỮ L: Trỏ DUỖI lên, cái DUỖI ngang (góc 90°)
    # =========================================
    elif target_letter == 'L':
        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ thẳng lên!',
                'priority': 'high'
            })

        if not thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang gập!',
                'fix': 'DUỖI ngón cái SANG NGANG!',
                'priority': 'high'
            })
        elif thumb_tip[1] < thumb_mcp[1] - 20:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang hướng lên trên!',
                'fix': 'DUỖI ngón cái nằm ngang hoàn toàn!',
                'priority': 'high'
            })

        for name, ext in [('middle', middle_ext), ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'middle': 'Ngón giữa', 'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

        # Kiểm tra góc L (nhầm G)
        if index_ext and thumb_sideways:
            if abs(index_tip[1] - thumb_tip[1]) < 50:
                corrections.append({
                    'finger': 'Hai ngón',
                    'issue': 'Hai ngón chưa tạo góc vuông!',
                    'fix': 'MỞ RỘNG góc giữa ngón cái và ngón trỏ!',
                    'priority': 'medium'
                })

    # =========================================
    # CHỮ M: 3 ngón đè lên cái
    # =========================================
    elif target_letter == 'M':
        # Kiểm tra ngón cái có bị che không
        if thumb_sideways or thumb_tip[1] < ring_pip[1]:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang lộ ra ngoài!',
                'fix': 'Đặt ngón cái vào trong lòng bàn tay để 3 ngón đè lên!',
                'priority': 'high'
            })

        # Kiểm tra 3 ngón (trỏ, giữa, áp út) có duỗi không
        for name, ext in [('index', index_ext), ('middle', middle_ext), ('ring', ring_ext)]:
            if not ext:
                fn = {'index': 'Ngón trỏ', 'middle': 'Ngón giữa', 'ring': 'Ngón áp út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang gập!',
                    'fix': f'GẬP {fn} xuống đè lên ngón cái!',
                    'priority': 'high'
                })

        # Kiểm tra ngón út
        if pinky_ext:
            corrections.append({
                'finger': 'Ngón út',
                'issue': 'Ngón út đang duỗi!',
                'fix': 'GẬP ngón út nhẹ vào trong (không đè)!',
                'priority': 'medium'
            })

    # =========================================
    # CHỮ N: 2 ngón đè lên cái
    # =========================================
    elif target_letter == 'N':
        if thumb_sideways or thumb_tip[1] < middle_pip[1]:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang lộ ra ngoài!',
                'fix': 'Đặt ngón cái vào trong lòng bàn tay để 2 ngón đè lên!',
                'priority': 'high'
            })

        # Chỉ 2 ngón (trỏ, giữa) đè
        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'GẬP ngón trỏ xuống đè lên ngón cái!',
                'priority': 'high'
            })

        if not middle_ext:
            corrections.append({
                'finger': 'Ngón giữa',
                'issue': 'Ngón giữa đang gập!',
                'fix': 'GẬP ngón giữa xuống đè lên ngón cái!',
                'priority': 'high'
            })

        if ring_ext:
            corrections.append({
                'finger': 'Ngón áp út',
                'issue': 'Ngón áp út đang duỗi (thành chữ M)!',
                'fix': 'GẬP ngón áp út vào trong!',
                'priority': 'high'
            })

        if pinky_ext:
            corrections.append({
                'finger': 'Ngón út',
                'issue': 'Ngón út đang duỗi!',
                'fix': 'GẬP ngón út vào trong!',
                'priority': 'medium'
            })

    # =========================================
    # CHỮ O: Tất cả gập tạo hình tròn khép kín
    # =========================================
    elif target_letter == 'O':
        all_ext = sum([index_ext, middle_ext, ring_ext, pinky_ext])
        if all_ext >= 2:
            corrections.append({
                'finger': 'Các ngón',
                'issue': f'{all_ext} ngón đang duỗi!',
                'fix': 'GẬP các ngón vào tạo hình TRÒN khép kín!',
                'priority': 'high'
            })

        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi thẳng!',
                'fix': 'CONG ngón cái vào chạm các ngón khác!',
                'priority': 'high'
            })

        # Kiểm tra vòng tròn có khép kín không
        dist_thumb_pinky = calculate_distance(thumb_tip, pinky_tip)
        if dist_thumb_pinky > 70:
            corrections.append({
                'finger': 'Hình dạng',
                'issue': 'Hình chưa khép kín (thành chữ C)!',
                'fix': 'CONG các ngón thêm để khép kín thành hình tròn!',
                'priority': 'high'
            })

    # =========================================
    # CHỮ P: Trỏ xuống, giữa chéo, cái kẹp, cổ tay gập
    # =========================================
    elif target_letter == 'P':
        # P là K xoay ngược nên ngón trỏ hướng xuống
        if index_ext and index_tip[1] < index_pip[1] - 30:
            # Index đang hướng lên, kiểm tra cổ tay
            if wrist[1] > index_tip[1]:
                corrections.append({
                    'finger': 'Cổ tay',
                    'issue': 'Cổ tay đang thẳng (nhầm chữ K)!',
                    'fix': 'GẬP cổ tay xuống để ngón trỏ hướng xuống dưới!',
                    'priority': 'high'
                })

        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ xuống dưới!',
                'priority': 'high'
            })

        # Kiểm tra ngón cái kẹp giữa
        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra!',
                'fix': 'Đặt ngón cái KẸP GIỮA ngón trỏ và giữa!',
                'priority': 'high'
            })

        for name, ext in [('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

    # =========================================
    # CHỮ Q: Trỏ và cái xuống song song, cổ tay gập
    # =========================================
    elif target_letter == 'Q':
        if index_ext and index_tip[1] < index_pip[1] - 30:
            if wrist[1] > index_tip[1]:
                corrections.append({
                    'finger': 'Cổ tay',
                    'issue': 'Cổ tay đang thẳng!',
                    'fix': 'GẬP cổ tay xuống để 2 ngón hướng xuống!',
                    'priority': 'high'
                })

        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ xuống dưới!',
                'priority': 'high'
            })

        if not thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang gập!',
                'fix': 'DUỖI ngón cái xuống dưới song song ngón trỏ!',
                'priority': 'high'
            })

        for name, ext in [('middle', middle_ext), ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'middle': 'Ngón giữa', 'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

    # =========================================
    # CHỮ R: Trỏ và giữa duỗi, giữa đè lên trỏ (bắt chéo)
    # =========================================
    elif target_letter == 'R':
        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ thẳng lên!',
                'priority': 'high'
            })

        if not middle_ext:
            corrections.append({
                'finger': 'Ngón giữa',
                'issue': 'Ngón giữa đang gập!',
                'fix': 'DUỖI ngón giữa thẳng lên!',
                'priority': 'high'
            })

        # Kiểm tra giữa có đè lên trỏ không (nhầm U)
        # Nếu middle_tip bên phải index_tip → nhầm U, cần đè sang trái
        if index_ext and middle_ext and middle_tip[0] > index_tip[0]:
            corrections.append({
                'finger': 'Ngón giữa',
                'issue': 'Ngón giữa chưa đè lên ngón trỏ!',
                'fix': 'Di chuyển ngón giữa sang TRÁI để đè lên ngón trỏ!',
                'priority': 'high'
            })

        for name, ext in [('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

    # =========================================
    # CHỮ S: Tất cả gập, cái đè lên
    # =========================================
    elif target_letter == 'S':
        if not thumb_sideways:
            # Kiểm tra cái có đè lên không (nhầm A)
            if thumb_tip[1] > index_pip[1] + 20:
                corrections.append({
                    'finger': 'Ngón cái',
                    'issue': 'Ngón cái đang gập vào trong (nhầm chữ A)!',
                    'fix': 'DUỖI ngón cái ra và ĐÈ LÊN các ngón gập!',
                    'priority': 'high'
                })
            else:
                corrections.append({
                    'finger': 'Ngón cái',
                    'issue': 'Ngón cái đang gập!',
                    'fix': 'DUỖI ngón cái và ĐÈ LÊN các ngón gập!',
                    'priority': 'high'
                })

        for name, ext in [('index', index_ext), ('middle', middle_ext),
                         ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'index': 'Ngón trỏ', 'middle': 'Ngón giữa',
                      'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} vào lòng bàn tay!',
                    'priority': 'high'
                })

    # =========================================
    # CHỮ T: Cái kẹp giữa trỏ và giữa, đầu nhô ra
    # =========================================
    elif target_letter == 'T':
        # Kiểm tra cái có kẹp không
        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra ngoài!',
                'fix': 'KẸP ngón cái vào GIỮA ngón trỏ và giữa!',
                'priority': 'high'
            })
        else:
            # Kiểm tra cái có ở giữa không
            if thumb_tip[0] < index_mcp[0] - 30 or thumb_tip[0] > middle_pip[0] + 30:
                corrections.append({
                    'finger': 'Ngón cái',
                    'issue': 'Ngón cái chưa kẹp đúng giữa!',
                    'fix': 'Đặt ngón cái kẹp giữa ngón trỏ và giữa!',
                    'priority': 'high'
                })

        for name, ext in [('index', index_ext), ('middle', middle_ext),
                         ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'index': 'Ngón trỏ', 'middle': 'Ngón giữa',
                      'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống để kẹp ngón cái!',
                    'priority': 'high'
                })

    # =========================================
    # CHỮ U: Trỏ và giữa duỗi SÁT nhau (song song)
    # =========================================
    elif target_letter == 'U':
        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ thẳng lên!',
                'priority': 'high'
            })

        if not middle_ext:
            corrections.append({
                'finger': 'Ngón giữa',
                'issue': 'Ngón giữa đang gập!',
                'fix': 'DUỖI ngón giữa thẳng lên!',
                'priority': 'high'
            })

        # Hai ngón phải khép sát nhau (nhầm V)
        if index_ext and middle_ext:
            dist_index_middle = abs(index_tip[0] - middle_tip[0])
            if dist_index_middle > 30:
                corrections.append({
                    'finger': 'Hai ngón',
                    'issue': 'Hai ngón đang tách xa nhau (nhầm chữ V)!',
                    'fix': 'KHÉP ngón trỏ và giữa sát nhau!',
                    'priority': 'high'
                })

        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra!',
                'fix': 'GẬP ngón cái vào lòng bàn tay!',
                'priority': 'high'
            })

        for name, ext in [('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

    # =========================================
    # CHỮ V: Trỏ và giữa duỗi TÁCH nhau (~30-40°)
    # =========================================
    elif target_letter == 'V':
        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ thẳng lên!',
                'priority': 'high'
            })

        if not middle_ext:
            corrections.append({
                'finger': 'Ngón giữa',
                'issue': 'Ngón giữa đang gập!',
                'fix': 'DUỖI ngón giữa thẳng lên!',
                'priority': 'high'
            })

        # Hai ngón phải tách nhau (nhầm U)
        if index_ext and middle_ext:
            dist_index_middle = abs(index_tip[0] - middle_tip[0])
            if dist_index_middle < 20:
                corrections.append({
                    'finger': 'Hai ngón',
                    'issue': 'Hai ngón đang quá gần nhau (nhầm chữ U)!',
                    'fix': 'TÁCH ngón trỏ và giữa ra xa nhau tạo hình V!',
                    'priority': 'high'
                })

        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra!',
                'fix': 'GẬP ngón cái vào lòng bàn tay!',
                'priority': 'high'
            })

        for name, ext in [('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

    # =========================================
    # CHỮ W: 3 ngón duỗi tách đều
    # =========================================
    elif target_letter == 'W':
        for name, ext in [('index', index_ext), ('middle', middle_ext), ('ring', ring_ext)]:
            if not ext:
                fn = {'index': 'Ngón trỏ', 'middle': 'Ngón giữa', 'ring': 'Ngón áp út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang gập!',
                    'fix': f'DUỖI {fn} thẳng lên!',
                    'priority': 'high'
                })

        if pinky_ext:
            corrections.append({
                'finger': 'Ngón út',
                'issue': 'Ngón út đang duỗi!',
                'fix': 'GẬP ngón út xuống!',
                'priority': 'high'
            })

        # Kiểm tra 3 ngón có tách đều không
        if num_extended >= 2:
            dist_index_ring = abs(index_tip[0] - ring_tip[0])
            if dist_index_ring > 150:
                corrections.append({
                    'finger': 'Các ngón',
                    'issue': '3 ngón đang tách không đều!',
                    'fix': 'Điều chỉnh để 3 ngón tách đều tạo hình W!',
                    'priority': 'medium'
                })

    # =========================================
    # CHỮ X: Trỏ cong móc, các ngón gập
    # =========================================
    elif target_letter == 'X':
        # Ngón trỏ phải móc (cong đầu xuống)
        if index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang duỗi thẳng!',
                'fix': 'CONG đầu ngón trỏ xuống tạo hình móc câu!',
                'priority': 'high'
            })
        else:
            # Kiểm tra có móc thật không
            if index_tip[1] > index_pip[1] + 30:
                corrections.append({
                    'finger': 'Ngón trỏ',
                    'issue': 'Ngón trỏ chưa cong đủ!',
                    'fix': 'CONG thêm đầu ngón trỏ xuống tạo móc câu!',
                    'priority': 'medium'
                })

        for name, ext in [('middle', middle_ext), ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'middle': 'Ngón giữa', 'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

        if thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang duỗi ra!',
                'fix': 'GẬP ngón cái nhẹ vào trong!',
                'priority': 'medium'
            })

    # =========================================
    # CHỮ Y: Cái và út duỗi, tạo hình shaka
    # =========================================
    elif target_letter == 'Y':
        if not thumb_sideways:
            corrections.append({
                'finger': 'Ngón cái',
                'issue': 'Ngón cái đang gập!',
                'fix': 'DUỖI ngón cái ra ngoài!',
                'priority': 'high'
            })

        if not pinky_ext:
            corrections.append({
                'finger': 'Ngón út',
                'issue': 'Ngón út đang gập!',
                'fix': 'DUỖI ngón út thẳng lên!',
                'priority': 'high'
            })

        for name, ext in [('index', index_ext), ('middle', middle_ext), ('ring', ring_ext)]:
            if ext:
                fn = {'index': 'Ngón trỏ', 'middle': 'Ngón giữa', 'ring': 'Ngón áp út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

    # =========================================
    # CHỮ Z: Tư thế I + chuyển động vẽ Z
    # =========================================
    elif target_letter == 'Z':
        # Z có chuyển động nên kiểm tra tư thế cơ bản
        if not index_ext:
            corrections.append({
                'finger': 'Ngón trỏ',
                'issue': 'Ngón trỏ đang gập!',
                'fix': 'DUỖI ngón trỏ thẳng!',
                'priority': 'high'
            })

        for name, ext in [('middle', middle_ext), ('ring', ring_ext), ('pinky', pinky_ext)]:
            if ext:
                fn = {'middle': 'Ngón giữa', 'ring': 'Ngón áp út', 'pinky': 'Ngón út'}[name]
                corrections.append({
                    'finger': fn,
                    'issue': f'{fn} đang duỗi!',
                    'fix': f'GẬP {fn} xuống!',
                    'priority': 'high'
                })

        # Thông báo cần chuyển động
        corrections.append({
            'finger': 'Chuyển động',
            'issue': 'Chữ Z cần thực hiện chuyển động vẽ hình Z!',
            'fix': 'Di chuyển ngón trỏ: ngang → chéo xuống → ngang!',
            'priority': 'medium'
        })

    # =========================================
    # Kết quả: Không có lỗi = ĐÚNG
    # =========================================
    if len(corrections) == 0 and target_letter:
        corrections.append({
            'finger': 'Tổng thể',
            'issue': 'TUYỆT VỜI! Tư thế đang ĐÚNG!',
            'fix': 'Giữ nguyên tư thế hiện tại!',
            'priority': 'info'
        })

    return corrections
