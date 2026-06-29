import time

class LogicWordBuilder:
    def __init__(self, hold_time_threshold=1.5):
        self.hold_time_threshold = hold_time_threshold
        
        self.current_letter = ""
        self.letter_start_time = 0
        self.sentence = ""
        self.hand_detected_previously = False
        
    def process_frame(self, detected_letter: str, is_hand_present: bool) -> tuple[str, str, bool]:
        """
        Xử lý từng khung hình để xây dựng từ.
        Trả về tuple: (Chữ cái hiện tại đang giữ, Câu/Từ hoàn chỉnh, Có phát âm thanh không)
        """
        should_speak = False
        speak_text = ""
        
        # Nếu bàn tay không có trong khung hình (hạ tay)
        if not is_hand_present:
            if self.hand_detected_previously:
                # Vừa hạ tay xuống -> Thêm khoảng trắng chặn từ
                if len(self.sentence) > 0 and self.sentence[-1] != " ":
                    self.sentence += " "
                    # Kích hoạt đọc phần từ vừa ghép
                    should_speak = True
                    speak_text = self.sentence.strip() 
                    
            self.hand_detected_previously = False
            self.current_letter = ""
            self.letter_start_time = 0
            return "", self.sentence, should_speak
            
        # Nếu có bàn tay
        self.hand_detected_previously = True
        
        if detected_letter:
            if detected_letter == self.current_letter:
                # Nếu đã giữ đúng chữ cái đó đủ lâu (ví dụ 1.5 giây)
                if time.time() - self.letter_start_time >= self.hold_time_threshold:
                    self.sentence += detected_letter
                    self.current_letter = "" # Reset để không bị ghi lặp liên tục
                    self.letter_start_time = time.time() # Reset clock
            else:
                # Đổi sang chữ cái khác
                self.current_letter = detected_letter
                self.letter_start_time = time.time()
                
        return self.current_letter, self.sentence, False
        
    def clear_sentence(self):
        self.sentence = ""
