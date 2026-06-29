// Practice Feedback Data - Detailed feedback for each ASL letter
// Sử dụng dữ liệu chi tiết từ dataset 26 thủ ngữ ASL

export const ASL_LETTER_FEEDBACK = {
  // ========== CHỮ A ==========
  'A': {
    name: 'Chữ A',
    description: 'Nắm đấm với ngón cái đặt bên hông ngón trỏ',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái duỗi, đặt áp sát bên hông ngón trỏ. Không kẹp vào trong, không che các ngón', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài (về phía camera)', status: 'important' },
      { aspect: 'wrist', feedback: 'Cổ tay thẳng, không nghiêng', status: 'minor' }
    ],
    corrections: {
      'thumb_over_fingers': 'Ngón cái cần đặt SANG BÊN HÔNG ngón trỏ, không đè lên trên!',
      'thumb_folded_in': 'Ngón cái cần DUỖI ra và ÁP SÁT cạnh ngón trỏ!',
      'finger_not_bent': 'Ngón [X] cần GẬP HOÀN TOÀN vào lòng bàn tay!',
      'palm_inward': 'Xoay cổ tay để lòng bàn tay HƯỚNG RA NGÀI (về phía camera)!',
      'confused_with_S': 'Đây là chữ A, không phải S — ngón cái đặt bên cạnh, không đè lên trên!'
    }
  },

  // ========== CHỮ B ==========
  'B': {
    name: 'Chữ B',
    description: 'Bàn tay phẳng, 4 ngón duỗi thẳng, ngón cái gập vào',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái gập vào lòng bàn tay, đè lên gốc 4 ngón. Không duỗi ra ngoài', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng hoàn toàn, hướng lên trên', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa duỗi thẳng hoàn toàn, khép sát ngón trỏ', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út duỗi thẳng hoàn toàn, khép sát ngón giữa', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út duỗi thẳng hoàn toàn, khép sát ngón áp út', status: 'critical' },
      { aspect: 'palm', feedback: '4 ngón phải khép sát nhau, không tách', status: 'critical' },
      { aspect: 'wrist', feedback: 'Cổ tay thẳng đứng, các ngón hướng thẳng lên trên', status: 'important' }
    ],
    corrections: {
      'thumb_extended': 'Ngón cái cần GẬP vào lòng bàn tay, không duỗi ra!',
      'fingers_separated': '4 ngón cần KHÉP SÁT nhau, không tách rời!',
      'finger_bent': 'Ngón [X] cần DUỖI THẲNG hoàn toàn!',
      'wrist_tilted': 'Cổ tay cần THẲNG ĐỨNG, các ngón hướng thẳng lên trên!'
    }
  },

  // ========== CHỮ C ==========
  'C': {
    name: 'Chữ C',
    description: 'Tay tạo hình chữ C, các ngón cong tạo vòng cung',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái cong đối diện, tạo cung phía dưới-trong. Khoảng cách với đầu ngón út ~3-4cm', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ cong tạo cung trên của chữ C', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa cong theo cung chữ C', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út cong theo cung chữ C', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út cong tạo cung dưới của chữ C', status: 'critical' },
      { aspect: 'palm', feedback: 'Khoảng hở của chữ C hướng sang ngang. Không hướng lên hoặc xuống', status: 'critical' },
      { aspect: 'opening', feedback: 'Lòng bàn tay hướng sang ngang (cùng chiều khoảng hở)', status: 'important' }
    ],
    corrections: {
      'fingers_too_curved': 'Mở rộng các ngón ra hơn — hình dạng cần là chữ C, không phải O!',
      'fingers_too_straight': 'Các ngón cần CONG LẠI thêm để tạo hình vòng cung!',
      'opening_up_or_down': 'Xoay cổ tay để khoảng hở chữ C HƯỚNG SANG NGANG, không lên trên!',
      'thumb_straight': 'Ngón cái cần CONG LẠI đối diện các ngón kia!'
    }
  },

  // ========== CHỮ D ==========
  'D': {
    name: 'Chữ D',
    description: 'Ngón trỏ duỗi lên, 3 ngón gập chạm ngón cái tạo vòng tròn',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái cong, đầu ngón chạm đầu 3 ngón gập (giữa/áp út/út). Tạo thành vòng tròn phía dưới', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng lên trên, hơi cong nhẹ về phía ngón cái. Tạo thành nét thẳng của chữ D', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập cong, đầu ngón chạm đầu ngón cái', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập cong, đầu ngón chạm đầu ngón cái', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập cong, đầu ngón chạm đầu ngón cái', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng sang ngang', status: 'important' }
    ],
    corrections: {
      'middle_not_touching_thumb': 'Đầu ngón giữa cần CHẠM vào đầu ngón cái để tạo vòng tròn!',
      'index_too_curved': 'Ngón trỏ cần DUỖI THẲNG hơn lên trên!',
      'circle_open': 'Ngón cái và các ngón cần KHÉP KÍN tạo thành vòng tròn!',
      'confused_with_G': 'Ngón trỏ cần HƯỚNG LÊN TRÊN, không sang ngang!'
    }
  },

  // ========== CHỮ E ==========
  'E': {
    name: 'Chữ E',
    description: 'Tất cả ngón gập xuống, tay "thu nhỏ lại"',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái gập vào trong, đặt sát bên dưới các ngón đang gập. Ngón cái thu gọn vào, không nhô ra', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ gập xuống, móng tay hướng về lòng bàn tay', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập xuống, móng tay hướng về lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập xuống, móng tay hướng về lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập xuống, móng tay hướng về lòng bàn tay', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài. Hình dạng tổng thể: bàn tay "thu nhỏ lại", nhìn từ ngoài thấy đốt ngón', status: 'important' }
    ],
    corrections: {
      'thumb_sticking_out': 'Ngón cái cần THU VÀO dưới các ngón gập, không nhô ra!',
      'fingers_not_deep': 'Các ngón cần GẬP SÂU HƠN, đầu ngón gần chạm lòng bàn tay!',
      'confused_with_S': 'Đây là E — các ngón gập xuống phía trước, không nắm vào lòng!',
      'nails_visible': 'Xoay tay để lòng bàn tay HƯỚNG RA NGÀI về phía camera!'
    }
  },

  // ========== CHỮ F ==========
  'F': {
    name: 'Chữ F',
    description: 'Ngón trỏ và ngón cái chạm nhau tạo vòng tròn nhỏ, 3 ngón còn lại duỗi',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái cong, chạm đầu ngón trỏ tạo vòng tròn. Vòng tròn F nhỏ hơn O', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ cong, đầu ngón chạm đầu ngón cái tạo vòng tròn', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa duỗi thẳng lên trên', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út duỗi thẳng lên trên', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út duỗi thẳng lên trên', status: 'critical' },
      { aspect: 'palm', feedback: '3 ngón còn lại tách nhẹ nhau, không khép chặt', status: 'important' }
    ],
    corrections: {
      'index_not_touching_thumb': 'Đầu ngón trỏ và ngón cái cần CHẠM NHAU tạo vòng tròn!',
      'three_fingers_bent': 'Ngón giữa, áp út, út cần DUỖI THẲNG lên trên!',
      'confused_with_OK': '3 ngón còn lại cần DUỖI lên, không gập vào!'
    }
  },

  // ========== CHỮ G ==========
  'G': {
    name: 'Chữ G',
    description: 'Ngón trỏ và ngón cái chỉ sang ngang song song, 3 ngón còn lại gập',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái duỗi thẳng, hướng sang ngang, song song và bên dưới ngón trỏ', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng, hướng sang ngang (trái nếu tay phải). Song song với mặt đất', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'palm', feedback: 'Bàn tay xoay ngang, lòng bàn tay hướng vào trong', status: 'important' }
    ],
    corrections: {
      'index_up': 'Ngón trỏ cần XOAY SANG NGANG, song song mặt đất!',
      'thumb_not_parallel': 'Ngón cái cần SONG SONG bên DƯỚI ngón trỏ!',
      'confused_with_L': 'Xoay toàn bộ bàn tay 90 độ sang ngang — đây là G, không phải L!',
      // Khi người dùng đang làm G đúng nhưng bị nhận thành H
      'confused_with_H': 'BẠN ĐANG LÀM ĐÚNG CHỮ G! Model nhầm với H. Chữ G chỉ có 1 ngón (trỏ) duỗi ngang + ngón cái, khác H có 2 ngón (trỏ + giữa) duỗi ngang. Bạn cần GẬP ngón giữa!'
    }
  },

  // ========== CHỮ H ==========
  'H': {
    name: 'Chữ H',
    description: 'Ngón trỏ và ngón giữa duỗi sang ngang khép sát nhau',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái gập vào / đặt dưới ngón giữa', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng, hướng sang ngang', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa duỗi thẳng, khép sát ngón trỏ, cùng hướng sang ngang', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'palm', feedback: 'Xoay ngang, lòng bàn tay hướng xuống hoặc vào trong', status: 'important' }
    ],
    corrections: {
      'fingers_separated': 'Ngón trỏ và ngón giữa cần KHÉP SÁT nhau!',
      'only_one_finger_sideways': 'Cần thêm ngón giữa duỗi thẳng sang ngang cùng ngón trỏ!',
      'middle_curved': 'Ngón giữa cần DUỖI THẲNG hoàn toàn!',
      // Khi người dùng đang làm H đúng nhưng bị nhận thành G
      'confused_with_G': 'BẠN ĐANG LÀM ĐÚNG CHỮ H! Model nhầm với G. Chữ H có 2 ngón (trỏ + giữa) duỗi ngang, khác G chỉ có 1 ngón (trỏ) duỗi ngang. Tiếp tục giữ đúng tư thế H!'
    }
  },

  // ========== CHỮ I ==========
  'I': {
    name: 'Chữ I',
    description: 'Chỉ có ngón út duỗi thẳng lên, các ngón khác gập',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái đặt đè nhẹ lên các ngón gập', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út duỗi thẳng lên trên — ngón duy nhất duỗi', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài', status: 'important' }
    ],
    corrections: {
      'wrong_finger_extended': 'Cần duỗi NGÓN ÚT (ngón nhỏ nhất), không phải ngón trỏ!',
      'pinky_bent': 'Ngón út cần DUỖI THẲNG hoàn toàn lên trên!',
      'confused_with_Y': 'Ngón cái cần GẬP vào trong, không duỗi ra ngoài!'
    }
  },

  // ========== CHỮ J ==========
  'J': {
    name: 'Chữ J',
    description: 'Giống chữ I nhưng có chuyển động vẽ chữ J trong không khí',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái đặt đè nhẹ lên các ngón gập', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út duỗi thẳng lên, sau đó vẽ đường cong xuống. Di chuyển: lên → vòng xuống → cong ra ngoài', status: 'critical' },
      { aspect: 'movement', feedback: 'Bắt đầu như chữ I, sau đó vẽ: đưa ngón út lên cao → vòng xuống dưới → cong ra ngoài → kết thúc bằng đường ngang nhỏ sang phải', status: 'critical' }
    ],
    corrections: {
      'no_movement': 'Chữ J cần VẼ HÌNH MÓC CÂU trong không khí bằng ngón út!',
      'wrong_direction': 'Hướng vẽ: LÊN → vòng XUỐNG → cong RA NGÀI!',
      'wrong_finger': 'Chỉ dùng ngón út để vẽ, các ngón khác giữ GẬP!',
      'too_fast': 'Thực hiện CHẬM vừa phải, không quá nhanh để camera nhận diện!'
    }
  },

  // ========== CHỮ K ==========
  'K': {
    name: 'Chữ K',
    description: 'Ngón trỏ lên, ngón giữa nghiêng 45°, ngón cái kẹp giữa',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái đặt kẹp giữa ngón trỏ và ngón giữa, chạm mặt trong ngón giữa. Nhô lên giữa hai ngón', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng lên trên', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa duỗi chéo ra ngoài ~45°', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài', status: 'important' }
    ],
    corrections: {
      'thumb_not_between': 'Ngón cái cần KẸP VÀO GIỮA ngón trỏ và ngón giữa!',
      'middle_straight_up': 'Ngón giữa cần NGHIÊNG CHÉO RA NGÀI ~45 độ!',
      'confused_with_U_V': 'Ngón giữa cần nghiêng chéo, không thẳng lên!',
      'ring_pinky_extended': 'Ngón áp út và ngón út cần GẬP HOÀN TOÀN!'
    }
  },

  // ========== CHỮ L ==========
  'L': {
    name: 'Chữ L',
    description: 'Ngón trỏ lên thẳng, ngón cái ngang vuông góc 90°',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái duỗi thẳng sang ngang. Tạo nét ngang của chữ L, góc 90° với ngón trỏ', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng lên trên. Tạo nét đứng của chữ L', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'angle', feedback: 'Góc giữa ngón trỏ và ngón cái là 90 độ chính xác', status: 'critical' }
    ],
    corrections: {
      'thumb_not_perpendicular': 'Ngón cái cần duỗi NGANG hoàn toàn, tạo GÓC 90° với ngón trỏ!',
      'index_curved': 'Ngón trỏ cần THẲNG ĐỨNG hoàn toàn!',
      'middle_not_bent': 'Ngón giữa cần GẬP vào trong lòng bàn tay!'
    }
  },

  // ========== CHỮ M ==========
  'M': {
    name: 'Chữ M',
    description: 'Ngón cái ẩn dưới 3 ngón (trỏ, giữa, áp út) đè lên',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái gập vào lòng bàn tay, ẩn bên dưới 3 ngón. Không nhô ra', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ gập xuống, đè lên ngón cái — ngón đầu tiên từ ngoài vào đè', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập xuống, đè lên ngón cái', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập xuống, đè lên ngón cái — ngón thứ 3 đè', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào trong nhẹ, không đè lên ngón cái', status: 'critical' },
      { aspect: 'palm', feedback: 'Nhìn từ ngoài thấy 3 đốt ngón che phủ ngón cái', status: 'important' }
    ],
    corrections: {
      'only_two_fingers': 'Cần 3 ngón (trỏ, giữa, áp út) đè lên ngón cái — không phải 2!',
      'thumb_visible': 'Ngón cái cần ẨN HOÀN TOÀN bên dưới 3 ngón!',
      'pinky_pressing': 'Ngón út không đè lên, chỉ gập nhẹ vào trong!'
    }
  },

  // ========== CHỮ N ==========
  'N': {
    name: 'Chữ N',
    description: 'Ngón cái ẩn dưới 2 ngón (trỏ và giữa) đè lên',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái ẩn bên dưới 2 ngón', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ gập xuống, đè lên ngón cái', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập xuống, đè lên ngón cái', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào nhưng không đè lên ngón cái', status: 'important' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào nhưng không đè lên ngón cái', status: 'important' },
      { aspect: 'palm', feedback: 'Khác M: chỉ 2 ngón đè thay vì 3', status: 'critical' }
    ],
    corrections: {
      'three_fingers': 'Chữ N chỉ cần 2 ngón (trỏ và giữa) đè lên ngón cái — không phải 3!',
      'thumb_visible': 'Ngón cái cần THU VÀO hoàn toàn dưới 2 ngón!',
      'ring_pressing': 'Ngón áp út chỉ gập vào trong, không đè lên ngón cái!'
    }
  },

  // ========== CHỮ O ==========
  'O': {
    name: 'Chữ O',
    description: 'Tất cả ngón cong chạm nhau tạo hình tròn khép kín',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái cong, chạm tất cả đầu các ngón kia. Tạo hình tròn/oval khép kín', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ cong, đầu ngón chạm đầu ngón cái', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa cong, đầu ngón chạm đầu ngón cái', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út cong, đầu ngón chạm đầu ngón cái', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út cong, đầu ngón chạm đầu ngón cái', status: 'critical' },
      { aspect: 'shape', feedback: 'Hình dạng tròn/oval khép kín. Không hở', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài', status: 'important' }
    ],
    corrections: {
      'circle_not_closed': 'Các ngón và ngón cái cần CHẠM NHAU để KHÉP KÍN hình tròn!',
      'circle_too_open': 'Các ngón cần CONG NHIỀU HƠN để khép kín thành hình O!',
      'thumb_not_touching': 'Ngón cái cần chạm đầu TẤT CẢ các ngón đang cong!'
    }
  },

  // ========== CHỮ P ==========
  'P': {
    name: 'Chữ P',
    description: 'Ngón trỏ chỉ xuống, ngón cái kẹp giữa, cổ tay gập',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái kẹp giữa ngón trỏ và ngón giữa, chạm mặt trong ngón giữa', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng, hướng xuống dưới', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa duỗi chéo, hướng xuống và ra ngoài', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'wrist', feedback: 'Cổ tay gập xuống — bàn tay chúc xuống. Đây là K lật ngược', status: 'critical' }
    ],
    corrections: {
      'index_up': 'Cổ tay cần GẬP XUỐNG để ngón trỏ hướng xuống dưới!',
      'thumb_not_between': 'Ngón cái cần KẸP VÀO GIỮA ngón trỏ và ngón giữa!',
      'wrist_not_bent': 'Cổ tay cần GẬP SÂU hơn để bàn tay chúc xuống hoàn toàn!',
      'confused_with_K': 'Đây là P — cổ tay gập xuống, ngón trỏ hướng xuống!'
    }
  },

  // ========== CHỮ Q ==========
  'Q': {
    name: 'Chữ Q',
    description: 'Ngón trỏ và ngón cái chỉ xuống song song, cổ tay gập',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái duỗi thẳng, hướng xuống, song song ngón trỏ. Khoảng cách nhỏ giữa 2 ngón', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng, hướng xuống dưới', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'wrist', feedback: 'Cổ tay gập xuống — đây là G lật ngược', status: 'critical' }
    ],
    corrections: {
      'index_sideways': 'Cổ tay cần GẬP XUỐNG để 2 ngón hướng xuống dưới!',
      'thumb_not_parallel': 'Ngón cái cần SONG SONG và BÊN DƯỚI ngón trỏ, cùng hướng xuống!',
      'confused_with_G': 'Đây là Q — cổ tay gập xuống, không phải G ngang!'
    }
  },

  // ========== CHỮ R ==========
  'R': {
    name: 'Chữ R',
    description: 'Ngón trỏ và ngón giữa duỗi chồng chéo lên nhau',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái gập nhẹ, đặt lên các ngón gập', status: 'important' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng lên trên', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa duỗi thẳng lên trên, bắt chéo đè lên ngón trỏ. Ngón giữa ở phía trước ngón trỏ', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'crossing', feedback: 'Mức độ bắt chéo: ngón giữa đặt chéo hoàn toàn qua ngón trỏ', status: 'critical' }
    ],
    corrections: {
      'not_crossed': 'Ngón giữa cần BẮT CHÉO ĐÈ LÊN ngón trỏ!',
      'crossed_not_enough': 'Ngón giữa cần VẮT HOÀN TOÀN qua ngón trỏ, không chỉ chạm!',
      'ring_extended': 'Ngón áp út cần GẬP HOÀN TOÀN vào lòng bàn tay!',
      'confused_with_U': 'Cần bắt chéo ngón giữa qua ngón trỏ!'
    }
  },

  // ========== CHỮ S ==========
  'S': {
    name: 'Chữ S',
    description: 'Nắm đấm với ngón cái đè lên các ngón từ phía trước',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái duỗi, đặt đè lên trên các ngón đang gập. Phủ lên phía trước các ngón', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài. Khác A: ngón cái đè lên trên các ngón, không đặt bên cạnh', status: 'critical' }
    ],
    corrections: {
      'thumb_on_side': 'Ngón cái cần ĐÈ LÊN TRÊN các ngón gập, không đặt bên cạnh!',
      'finger_not_bent': 'Ngón [X] cần GẬP HOÀN TOÀN vào lòng bàn tay!',
      'confused_with_A': 'Đây là S — ngón cái đè lên trên, không đặt bên cạnh!',
      'thumb_folded': 'Ngón cái cần DUỖI RA và đặt PHỦ LÊN trên các ngón!'
    }
  },

  // ========== CHỮ T ==========
  'T': {
    name: 'Chữ T',
    description: 'Ngón cái kẹp giữa ngón trỏ và giữa, đầu ngón cái nhô ra',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái kẹp giữa ngón trỏ và ngón giữa, đầu ngón cái nhô ra giữa. Đầu ngón cái lộ ra phía trước', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ gập xuống, tạo khe hở phía trên', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập xuống', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập xuống', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập xuống', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài. Hình dạng: đầu ngón cái nhô ra giữa ngón trỏ và giữa', status: 'important' }
    ],
    corrections: {
      'thumb_not_sticking_out': 'Ngón cái cần KẸP VÀO GIỮA ngón trỏ và giữa, đầu ngón NHÔ RA!',
      'thumb_below': 'Ngón cái cần Ở GIỮA ngón trỏ và giữa, không ẩn dưới!',
      'confused_with_M_N': 'Đây là T — đầu ngón cái nhô ra giữa, không ẩn dưới!',
      'fingers_not_folded': 'Các ngón cần GẬP CHẶT để giữ ngón cái kẹp ở giữa!'
    }
  },

  // ========== CHỮ U ==========
  'U': {
    name: 'Chữ U',
    description: 'Ngón trỏ và ngón giữa duỗi lên khép sát nhau song song',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng lên trên, khép sát ngón giữa. Hai ngón song song, không tách', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa duỗi thẳng lên trên, khép sát ngón trỏ', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài', status: 'important' }
    ],
    corrections: {
      'fingers_separated': 'Ngón trỏ và ngón giữa cần KHÉP SÁT nhau, không tách rời!',
      'confused_with_V': 'Hai ngón cần SÁT NHAU — đây là U, không phải V!',
      'ring_extended': 'Ngón áp út cần GẬP vào trong, không duỗi ra!',
      'middle_curved': 'Ngón giữa cần DUỖI THẲNG hoàn toàn!'
    }
  },

  // ========== CHỮ V ==========
  'V': {
    name: 'Chữ V',
    description: 'Ngón trỏ và ngón giữa duỗi lên tách nhau tạo hình chữ V',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng lên trên, tách ra — tạo nét trái của V', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa duỗi thẳng lên trên, tách ra khỏi ngón trỏ — tạo nét phải của V. Khoảng cách ~2-3cm giữa hai đầu ngón', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài. Hình dạng chữ V rõ ràng — hai ngón tạo góc ~30-40°', status: 'critical' }
    ],
    corrections: {
      'fingers_together': 'Tách ngón trỏ và ngón giữa RA XA nhau để tạo hình chữ V!',
      'confused_with_U': 'Hai ngón cần TÁCH RA — đây là V, không phải U!',
      'ring_extended': 'Ngón áp út cần GẬP vào trong, không duỗi ra!',
      'v_too_narrow': 'Mở rộng khoảng cách hai ngón hơn để tạo hình V rõ ràng!'
    }
  },

  // ========== CHỮ W ==========
  'W': {
    name: 'Chữ W',
    description: 'Ngón trỏ, giữa, áp út duỗi lên tách đều tạo hình chữ W',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái chạm vào / giữ ngón út đang gập', status: 'important' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng lên trên, tách ra', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa duỗi thẳng lên trên, tách ra ở giữa', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út duỗi thẳng lên trên, tách ra', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập vào, ngón cái chạm nhẹ', status: 'critical' },
      { aspect: 'palm', feedback: '3 ngón tách đều nhau, tạo hình W. Lòng bàn tay hướng ra ngoài', status: 'critical' }
    ],
    corrections: {
      'only_two_fingers': 'Cần thêm ngón áp út duỗi thẳng lên — chữ W có 3 ngón!',
      'fingers_together': '3 ngón cần TÁCH ĐỀU nhau để tạo hình chữ W!',
      'thumb_not_touching': 'Ngón cái cần CHẠM vào ngón út đang gập!',
      'confused_with_V': 'Đây là W — có 3 ngón, không phải V chỉ có 2 ngón!'
    }
  },

  // ========== CHỮ X ==========
  'X': {
    name: 'Chữ X',
    description: 'Ngón trỏ cong móc xuống như móc câu, các ngón khác gập',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái gập nhẹ, đặt lên các ngón gập', status: 'important' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi lên rồi cong móc lại như dấu hỏi nhỏ / móc câu. Đốt đầu ngón cong xuống ~90°', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'palm', feedback: 'Lòng bàn tay hướng ra ngoài', status: 'important' }
    ],
    corrections: {
      'index_straight': 'Ngón trỏ cần CONG MÓC XUỐNG ở đốt đầu, như hình móc câu!',
      'confused_with_D': 'Đây là X — ngón trỏ cong móc xuống, không duỗi thẳng!',
      'curled_too_much': 'Chỉ đốt đầu ngón trỏ cong xuống, không gập toàn bộ ngón!',
      'other_fingers_extended': 'Ngón giữa, áp út, út cần GẬP HOÀN TOÀN!'
    }
  },

  // ========== CHỮ Y ==========
  'Y': {
    name: 'Chữ Y',
    description: 'Ngón cái và ngón út duỗi ra tạo hình chữ Y / shaka',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái duỗi thẳng sang ngang ra ngoài', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út duỗi thẳng lên trên', status: 'critical' },
      { aspect: 'shape', feedback: 'Ngón cái và ngón út tạo hình chữ Y / shaka. Lòng bàn tay hướng ra ngoài', status: 'important' }
    ],
    corrections: {
      'pinky_bent': 'Ngón út cần DUỖI THẲNG hoàn toàn lên trên!',
      'thumb_not_sideways': 'Ngón cái cần DUỖI THẲNG SANG NGANG, không hướng lên hay xuống!',
      'confused_with_I': 'Chữ Y cần CẢ ngón cái VÀ ngón út cùng duỗi ra!',
      'index_extended': 'Ngón trỏ cần GẬP vào trong, không duỗi ra!'
    }
  },

  // ========== CHỮ Z ==========
  'Z': {
    name: 'Chữ Z',
    description: 'Vẽ chữ Z bằng ngón trỏ trong không khí',
    keyPoints: [
      { aspect: 'thumb', feedback: 'Ngón cái gập vào lòng bàn tay', status: 'critical' },
      { aspect: 'index', feedback: 'Ngón trỏ duỗi thẳng, vẽ đường ziczac. Tư thế: ngón trỏ duỗi, các ngón khác gập', status: 'critical' },
      { aspect: 'middle', feedback: 'Ngón giữa gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'ring', feedback: 'Ngón áp út gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'pinky', feedback: 'Ngón út gập hoàn toàn vào lòng bàn tay', status: 'critical' },
      { aspect: 'movement', feedback: 'Vẽ hình Z: ngang → chéo xuống trái → ngang. Tốc độ: rõ ràng, vừa phải, 3 nét phân biệt', status: 'critical' }
    ],
    corrections: {
      'no_movement': 'Chữ Z cần VẼ HÌNH CHỮ Z trong không khí bằng ngón trỏ!',
      'wrong_sequence': 'Vẽ theo thứ tự: ngang → chéo xuống → ngang, như viết chữ Z!',
      'too_fast': 'Thực hiện CHẬM HƠN để camera nhận ra 3 nét riêng biệt của Z!',
      'wrong_finger': 'Chỉ dùng ngón trỏ để vẽ, các ngón khác giữ GẬP!'
    }
  }
};

// Generate feedback based on detected letter and actual performance
export const generateFeedback = (targetLetter, detectedLetter, accuracy, corrections = []) => {
  const letterData = ASL_LETTER_FEEDBACK[targetLetter.toUpperCase()];
  
  if (!letterData) {
    return {
      error: 'Không có dữ liệu phản hồi cho chữ này',
      tips: ['Vui lòng kiểm tra lại chữ cái']
    };
  }

  const isCorrect = targetLetter.toUpperCase() === detectedLetter?.toUpperCase();
  
  let performanceLevel;
  if (accuracy >= 90) {
    performanceLevel = 'excellent';
  } else if (accuracy >= 70) {
    performanceLevel = 'good';
  } else if (accuracy >= 50) {
    performanceLevel = 'fair';
  } else {
    performanceLevel = 'needsImprovement';
  }

  // Tạo danh sách phản hồi chi tiết từ corrections của server
  let detailedCorrections = corrections.map(c => ({
    finger: c.finger || 'general',
    issue: c.issue || '',
    fix: c.fix || '',
    direction: c.direction || '',
    priority: c.priority || 'medium'
  }));

  // Tự động phát hiện và thêm correction cho cặp G/H bị nhầm
  if (!isCorrect && letterData.corrections) {
    const detected = (detectedLetter || '').toUpperCase();
    const target = targetLetter.toUpperCase();
    
    // Phát hiện nhầm G <-> H
    if ((target === 'G' && detected === 'H') || (target === 'H' && detected === 'G')) {
      const confusionKey = target === 'G' ? 'confused_with_H' : 'confused_with_G';
      if (letterData.corrections[confusionKey]) {
        detailedCorrections.unshift({
          finger: 'middle',
          issue: target === 'G' ? 'GẬP NGÓN GIỮA' : 'DUỖI NGÓN GIỮA',
          fix: letterData.corrections[confusionKey],
          direction: '',
          priority: 'high'
        });
      }
    }
  }

  return {
    letter: targetLetter.toUpperCase(),
    letterData,
    isCorrect,
    accuracy,
    performanceLevel,
    summary: isCorrect 
      ? getSuccessMessage(accuracy) 
      : getErrorMessage(detectedLetter, targetLetter, detailedCorrections),
    detailedFeedback: detailedCorrections,
    tips: getImprovementTips(letterData, isCorrect, performanceLevel, detailedCorrections)
  };
};

const getSuccessMessage = (accuracy) => {
  if (accuracy >= 95) {
    return {
      emoji: '🌟',
      title: 'Xuất sắc!',
      message: 'Bạn thực hiện gần như hoàn hảo!'
    };
  } else if (accuracy >= 85) {
    return {
      emoji: '👏',
      title: 'Tốt lắm!',
      message: 'Chỉ cần cải thiện một chút!'
    };
  } else {
    return {
      emoji: '👍',
      title: 'Đúng rồi!',
      message: 'Hãy tiếp tục luyện tập để hoàn thiện hơn!'
    };
  }
};

const getErrorMessage = (detected, target, corrections) => {
  const highPriorityCorrection = corrections?.find(c => c.priority === 'high');
  const correction = highPriorityCorrection || corrections?.[0];
  
  if (correction?.fix) {
    return {
      emoji: '💡',
      title: correction.issue || `Bạn thực hiện chưa đúng`,
      message: correction.fix
    };
  }
  
  return {
    emoji: '💡',
    title: `Bạn thực hiện "${detected || '?'}" thay vì "${target}"`,
    message: 'Hãy chú ý đến các điểm sau để cải thiện:'
  };
};

const getImprovementTips = (letterData, isCorrect, performanceLevel, corrections) => {
  const tips = [];
  
  if (corrections && corrections.length > 0) {
    corrections.forEach(c => {
      if (c.fix) {
        tips.push({
          text: c.fix,
          type: 'correction',
          priority: c.priority || 'medium'
        });
      }
    });
  }
  
  if (letterData.improvementTips) {
    letterData.improvementTips.forEach(tip => {
      tips.push({
        text: tip,
        type: 'specific'
      });
    });
  }
  
  if (performanceLevel === 'needsImprovement' || performanceLevel === 'fair') {
    tips.push({
      text: 'Tập trung giữ ngón tay ổn định trong 2-3 giây',
      type: 'general'
    });
    tips.push({
      text: 'Thực hiện chậm rãi trước, sau đó tăng tốc độ',
      type: 'general'
    });
  }
  
  if (performanceLevel === 'excellent' || performanceLevel === 'good') {
    tips.push({
      text: 'Tiếp tục duy trì phong độ!',
      type: 'encouragement'
    });
  }
  
  return tips;
};

export const FEEDBACK_CATEGORIES = [
  { id: 'accuracy', name: 'Độ chính xác ký hiệu', icon: '✅', description: 'Đánh giá mức độ khớp với ký hiệu chuẩn' },
  { id: 'handAngle', name: 'Góc bàn tay', icon: '📐', description: 'Kiểm tra góc độ của lòng bàn tay và ngón tay' },
  { id: 'fingerPosition', name: 'Vị trí ngón tay', icon: '✋', description: 'Đánh giá vị trí tương đối của các ngón' },
  { id: 'stability', name: 'Độ ổn định thao tác', icon: '🎯', description: 'Kiểm tra tính ổn định trong quá trình thực hiện' }
];

// Feedback phrases for encouragement and guidance
export const FEEDBACK_PHRASES = {
  excellent: [
    'Xuất sắc! Bạn làm rất tốt!',
    'Tuyệt vời! Giữ vững phong độ!',
    'Hoàn hảo! Tiếp tục phát huy!'
  ],
  good: [
    'Tốt lắm! Cải thiện thêm một chút nữa nhé!',
    'Khá tốt! Hãy tập trung vào chi tiết nhỏ!',
    'Đã tiến bộ nhiều! Giữ nhịp đều nhé!'
  ],
  fair: [
    'Cố gắng thêm một chút!',
    'Hãy giữ ổn định hơn nữa nhé!',
    'Từ từ thôi, bạn đang tiến bộ!'
  ],
  needsImprovement: [
    'Đừng nản lòng, hãy thử lại!',
    'Mỗi lần tập là một lần tiến bộ!',
    'Hãy chú ý đến vị trí các ngón tay!'
  ],
  correct: [
    'Chính xác! Giỏi lắm!',
    'Đúng rồi! Bạn làm được!',
    'Hoàn hảo!'
  ],
  incorrect: [
    'Chưa đúng lắm, hãy thử lại!',
    'Gần đúng rồi, điều chỉnh một chút nhé!',
    'Cố gắng hơn nữa!'
  ]
};
