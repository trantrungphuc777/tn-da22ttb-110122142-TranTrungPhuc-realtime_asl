// ASL Quiz Data - Contains vocabulary and sentences for quiz
// Images from ASL_SIGN folder (single letter images A.jpg - Z.jpg)

// Topic categories - KHỚP 100% với App.jsx TOPICS (35 topics)
export const QUIZ_TOPICS = [
  { key: 'Food', viName: 'Đồ ăn', enName: 'Food', icon: '🍔' },
  { key: 'Sport', viName: 'Thể thao', enName: 'Sports', icon: '⚽' },
  { key: 'Animal', viName: 'Động vật', enName: 'Animals', icon: '🐕' },
  { key: 'Weather', viName: 'Thời tiết', enName: 'Weather', icon: '☀️' },
  { key: 'Family', viName: 'Gia đình', enName: 'Family', icon: '👨‍👩‍👧‍👦' },
  { key: 'Colors', viName: 'Màu sắc', enName: 'Colors', icon: '🎨' },
  { key: 'Numbers', viName: 'Số đếm', enName: 'Numbers', icon: '🔢' },
  { key: 'Emotion', viName: 'Cảm xúc', enName: 'Emotion', icon: '😊' },
  { key: 'Greeting', viName: 'Chào hỏi', enName: 'Greetings', icon: '👋' },
  { key: 'Health', viName: 'Sức khỏe', enName: 'Health', icon: '🏥' },
  { key: 'School', viName: 'Trường học', enName: 'School', icon: '🏫' },
  { key: 'Job', viName: 'Công việc', enName: 'Jobs', icon: '💼' },
  { key: 'Time', viName: 'Thời gian', enName: 'Time', icon: '⏰' },
  { key: 'Place', viName: 'Địa điểm', enName: 'Places', icon: '🏠' },
  { key: 'Travel', viName: 'Du lịch', enName: 'Travel', icon: '✈️' },
  { key: 'Shopping', viName: 'Mua sắm', enName: 'Shopping', icon: '🛒' },
  { key: 'Nature', viName: 'Thiên nhiên', enName: 'Nature', icon: '🌿' },
  { key: 'Technology', viName: 'Công nghệ', enName: 'Technology', icon: '💻' },
  { key: 'Communication', viName: 'Giao tiếp', enName: 'Communication', icon: '💬' },
  { key: 'Money', viName: 'Tiền bạc', enName: 'Money', icon: '💰' },
  { key: 'Clothes', viName: 'Quần áo', enName: 'Clothes', icon: '👕' },
  { key: 'Body', viName: 'Cơ thể', enName: 'Body', icon: '🧍' },
  { key: 'Music', viName: 'Âm nhạc', enName: 'Music', icon: '🎵' },
  { key: 'Movie', viName: 'Phim ảnh', enName: 'Movie', icon: '🎬' },
  { key: 'Hobby', viName: 'Sở thích', enName: 'Hobby', icon: '🎯' },
  { key: 'DailyRoutine', viName: 'Sinh hoạt', enName: 'Daily Routine', icon: '📅' },
  { key: 'Feelings', viName: 'Cảm giác', enName: 'Feelings', icon: '❤️' },
  { key: 'Holiday', viName: 'Ngày lễ', enName: 'Holiday', icon: '🎉' },
  { key: 'Internet', viName: 'Internet', enName: 'Internet', icon: '🌐' },
  { key: 'Transportation', viName: 'Giao thông', enName: 'Transportation', icon: '🚗' },
  { key: 'Feelings2', viName: 'Tình cảm', enName: 'Love & Romance', icon: '💕' },
  // Các topics bổ sung
  { key: 'Actions', viName: 'Hành động', enName: 'Actions', icon: '👣' },
  { key: 'Months', viName: 'Tháng', enName: 'Months', icon: '📆' },
  { key: 'Opposites', viName: 'Từ trái nghĩa', enName: 'Opposites', icon: '↔️' },
  { key: 'Misc', viName: 'Tổng hợp', enName: 'Miscellaneous', icon: '📌' },
  { key: 'Directions', viName: 'Chỉ đường', enName: 'Directions', icon: '🧭' },
];

// Vocabulary by topic
export const VOCABULARY_BY_TOPIC = {
  Greeting: [
    { word: 'HELLO', meaning: 'Xin chào', aslSpelling: ['H','E','L','L','O'] },
    { word: 'THANK YOU', meaning: 'Cảm ơn', aslSpelling: ['T','H','A','N','K',' ','Y','O','U'] },
    { word: 'GOODBYE', meaning: 'Tạm biệt', aslSpelling: ['G','O','O','D','B','Y','E'] },
    { word: 'SORRY', meaning: 'Xin lỗi', aslSpelling: ['S','O','R','R','Y'] },
    { word: 'YES', meaning: 'Đồng ý / Vâng', aslSpelling: ['Y','E','S'] },
    { word: 'NO', meaning: 'Không', aslSpelling: ['N','O'] },
    { word: 'PLEASE', meaning: 'Làm ơn / Xin vui lòng', aslSpelling: ['P','L','E','A','S','E'] },
    { word: 'OKAY', meaning: 'Được / OK', aslSpelling: ['O','K','A','Y'] },
    { word: 'MAYBE', meaning: 'Có thể', aslSpelling: ['M','A','Y','B','E'] },
  ],
  Family: [
    { word: 'MOTHER', meaning: 'Mẹ', aslSpelling: ['M','O','T','H','E','R'] },
    { word: 'FATHER', meaning: 'Cha / Bố', aslSpelling: ['F','A','T','H','E','R'] },
    { word: 'SISTER', meaning: 'Chị / Em gái', aslSpelling: ['S','I','S','T','E','R'] },
    { word: 'BROTHER', meaning: 'Anh / Em trai', aslSpelling: ['B','R','O','T','H','E','R'] },
    { word: 'BABY', meaning: 'Em bé', aslSpelling: ['B','A','B','Y'] },
    { word: 'GRANDMOTHER', meaning: 'Bà', aslSpelling: ['G','R','A','N','D','M','O','T','H','E','R'] },
    { word: 'GRANDFATHER', meaning: 'Ông', aslSpelling: ['G','R','A','N','D','F','A','T','H','E','R'] },
    { word: 'AUNT', meaning: 'Cô / Dì', aslSpelling: ['A','U','N','T'] },
    { word: 'UNCLE', meaning: 'Chú / Bác', aslSpelling: ['U','N','C','L','E'] },
    { word: 'COUSIN', meaning: 'Anh em họ', aslSpelling: ['C','O','U','S','I','N'] },
    { word: 'NEPHEW', meaning: 'Cháu trai', aslSpelling: ['N','E','P','H','E','W'] },
    { word: 'NIECE', meaning: 'Cháu gái', aslSpelling: ['N','I','E','C','E'] },
  ],
  Food: [
    { word: 'WATER', meaning: 'Nước', aslSpelling: ['W','A','T','E','R'] },
    { word: 'FOOD', meaning: 'Thức ăn', aslSpelling: ['F','O','O','D'] },
    { word: 'MILK', meaning: 'Sữa', aslSpelling: ['M','I','L','K'] },
    { word: 'COFFEE', meaning: 'Cà phê', aslSpelling: ['C','O','F','F','E','E'] },
    { word: 'TEA', meaning: 'Trà', aslSpelling: ['T','E','A'] },
    { word: 'JUICE', meaning: 'Nước ép', aslSpelling: ['J','U','I','C','E'] },
    { word: 'RICE', meaning: 'Cơm', aslSpelling: ['R','I','C','E'] },
    { word: 'BREAD', meaning: 'Bánh mì', aslSpelling: ['B','R','E','A','D'] },
    { word: 'EGG', meaning: 'Trứng', aslSpelling: ['E','G','G'] },
    { word: 'CHICKEN', meaning: 'Thịt gà', aslSpelling: ['C','H','I','C','K','E','N'] },
    { word: 'BEEF', meaning: 'Thịt bò', aslSpelling: ['B','E','E','F'] },
    { word: 'PORK', meaning: 'Thịt heo', aslSpelling: ['P','O','R','K'] },
    { word: 'FISH', meaning: 'Cá', aslSpelling: ['F','I','S','H'] },
    { word: 'SHRIMP', meaning: 'Tôm', aslSpelling: ['S','H','R','I','M','P'] },
    { word: 'SALT', meaning: 'Muối', aslSpelling: ['S','A','L','T'] },
    { word: 'SUGAR', meaning: 'Đường', aslSpelling: ['S','U','G','A','R'] },
    { word: 'VEGETABLE', meaning: 'Rau', aslSpelling: ['V','E','G','E','T','A','B','L','E'] },
    { word: 'FRUIT', meaning: 'Trái cây', aslSpelling: ['F','R','U','I','T'] },
    { word: 'APPLE', meaning: 'Táo', aslSpelling: ['A','P','P','L','E'] },
    { word: 'BANANA', meaning: 'Chuối', aslSpelling: ['B','A','N','A','N','A'] },
    { word: 'ORANGE', meaning: 'Cam', aslSpelling: ['O','R','A','N','G','E'] },
    { word: 'GRAPE', meaning: 'Nho', aslSpelling: ['G','R','A','P','E'] },
    { word: 'MANGO', meaning: 'Xoài', aslSpelling: ['M','A','N','G','O'] },
    { word: 'PINEAPPLE', meaning: 'Dứa / Khóm', aslSpelling: ['P','I','N','E','A','P','P','L','E'] },
    { word: 'WATERMELON', meaning: 'Dưa hấu', aslSpelling: ['W','A','T','E','R','M','E','L','O','N'] },
    { word: 'CAKE', meaning: 'Bánh ngọt', aslSpelling: ['C','A','K','E'] },
    { word: 'COOKIE', meaning: 'Bánh quy', aslSpelling: ['C','O','O','K','I','E'] },
    { word: 'CANDY', meaning: 'Kẹo', aslSpelling: ['C','A','N','D','Y'] },
    { word: 'CHOCOLATE', meaning: 'Socola', aslSpelling: ['C','H','O','C','O','L','A','T','E'] },
    { word: 'ICE CREAM', meaning: 'Kem', aslSpelling: ['I','C','E',' ','C','R','E','A','M'] },
    { word: 'SOUP', meaning: 'Súp / Canh', aslSpelling: ['S','O','U','P'] },
    { word: 'NOODLE', meaning: 'Mì', aslSpelling: ['N','O','O','D','L','E'] },
    { word: 'PHO', meaning: 'Phở', aslSpelling: ['P','H','O'] },
  ],
  Colors: [
    { word: 'RED', meaning: 'Đỏ', aslSpelling: ['R','E','D'] },
    { word: 'BLUE', meaning: 'Xanh dương', aslSpelling: ['B','L','U','E'] },
    { word: 'GREEN', meaning: 'Xanh lá', aslSpelling: ['G','R','E','E','N'] },
    { word: 'YELLOW', meaning: 'Vàng', aslSpelling: ['Y','E','L','L','O','W'] },
    { word: 'PURPLE', meaning: 'Tím', aslSpelling: ['P','U','R','P','L','E'] },
    { word: 'PINK', meaning: 'Hồng', aslSpelling: ['P','I','N','K'] },
    { word: 'BLACK', meaning: 'Đen', aslSpelling: ['B','L','A','C','K'] },
    { word: 'WHITE', meaning: 'Trắng', aslSpelling: ['W','H','I','T','E'] },
    { word: 'GRAY', meaning: 'Xám', aslSpelling: ['G','R','A','Y'] },
    { word: 'BROWN', meaning: 'Nâu', aslSpelling: ['B','R','O','W','N'] },
    { word: 'GOLD', meaning: 'Vàng gold', aslSpelling: ['G','O','L','D'] },
    { word: 'SILVER', meaning: 'Bạc', aslSpelling: ['S','I','L','V','E','R'] },
  ],
  Animal: [
    { word: 'DOG', meaning: 'Con chó', aslSpelling: ['D','O','G'] },
    { word: 'CAT', meaning: 'Con mèo', aslSpelling: ['C','A','T'] },
    { word: 'BIRD', meaning: 'Con chim', aslSpelling: ['B','I','R','D'] },
    { word: 'HORSE', meaning: 'Con ngựa', aslSpelling: ['H','O','R','S','E'] },
    { word: 'COW', meaning: 'Con bò', aslSpelling: ['C','O','W'] },
    { word: 'PIG', meaning: 'Con heo', aslSpelling: ['P','I','G'] },
    { word: 'GOAT', meaning: 'Con dê', aslSpelling: ['G','O','A','T'] },
    { word: 'SHEEP', meaning: 'Con cừu', aslSpelling: ['S','H','E','E','P'] },
    { word: 'RABBIT', meaning: 'Con thỏ', aslSpelling: ['R','A','B','B','I','T'] },
    { word: 'ELEPHANT', meaning: 'Con voi', aslSpelling: ['E','L','E','P','H','A','N','T'] },
    { word: 'LION', meaning: 'Con sư tử', aslSpelling: ['L','I','O','N'] },
    { word: 'TIGER', meaning: 'Con hổ', aslSpelling: ['T','I','G','E','R'] },
    { word: 'MONKEY', meaning: 'Con khỉ', aslSpelling: ['M','O','N','K','E','Y'] },
    { word: 'SNAKE', meaning: 'Con rắn', aslSpelling: ['S','N','A','K','E'] },
    { word: 'TURTLE', meaning: 'Con rùa', aslSpelling: ['T','U','R','T','L','E'] },
    { word: 'FROG', meaning: 'Con ếch', aslSpelling: ['F','R','O','G'] },
    { word: 'DUCK', meaning: 'Con vịt', aslSpelling: ['D','U','C','K'] },
    { word: 'BEE', meaning: 'Con ong', aslSpelling: ['B','E','E'] },
    { word: 'BUTTERFLY', meaning: 'Con bướm', aslSpelling: ['B','U','T','T','E','R','F','L','Y'] },
    { word: 'ANT', meaning: 'Con kiến', aslSpelling: ['A','N','T'] },
    { word: 'SHARK', meaning: 'Cá mập', aslSpelling: ['S','H','A','R','K'] },
    { word: 'DOLPHIN', meaning: 'Cá heo', aslSpelling: ['D','O','L','P','H','I','N'] },
    { word: 'WHALE', meaning: 'Cá voi', aslSpelling: ['W','H','A','L','E'] },
    { word: 'PENGUIN', meaning: 'Chim cánh cụt', aslSpelling: ['P','E','N','G','U','I','N'] },
  ],
  Numbers: [
    { word: 'ONE', meaning: 'Một', aslSpelling: ['O','N','E'] },
    { word: 'TWO', meaning: 'Hai', aslSpelling: ['T','W','O'] },
    { word: 'THREE', meaning: 'Ba', aslSpelling: ['T','H','R','E','E'] },
    { word: 'FOUR', meaning: 'Bốn', aslSpelling: ['F','O','U','R'] },
    { word: 'FIVE', meaning: 'Năm', aslSpelling: ['F','I','V','E'] },
    { word: 'SIX', meaning: 'Sáu', aslSpelling: ['S','I','X'] },
    { word: 'SEVEN', meaning: 'Bảy', aslSpelling: ['S','E','V','E','N'] },
    { word: 'EIGHT', meaning: 'Tám', aslSpelling: ['E','I','G','H','T'] },
    { word: 'NINE', meaning: 'Chín', aslSpelling: ['N','I','N','E'] },
    { word: 'TEN', meaning: 'Mười', aslSpelling: ['T','E','N'] },
    { word: 'HUNDRED', meaning: 'Một trăm', aslSpelling: ['H','U','N','D','R','E','D'] },
    { word: 'THOUSAND', meaning: 'Một nghìn', aslSpelling: ['T','H','O','U','S','A','N','D'] },
  ],
  Time: [
    { word: 'MORNING', meaning: 'Buổi sáng', aslSpelling: ['M','O','R','N','I','N','G'] },
    { word: 'AFTERNOON', meaning: 'Buổi chiều', aslSpelling: ['A','F','T','E','R','N','O','O','N'] },
    { word: 'EVENING', meaning: 'Buổi tối', aslSpelling: ['E','V','E','N','I','N','G'] },
    { word: 'NIGHT', meaning: 'Đêm', aslSpelling: ['N','I','G','H','T'] },
    { word: 'TODAY', meaning: 'Hôm nay', aslSpelling: ['T','O','D','A','Y'] },
    { word: 'TOMORROW', meaning: 'Ngày mai', aslSpelling: ['T','O','M','O','R','R','O','W'] },
    { word: 'YESTERDAY', meaning: 'Hôm qua', aslSpelling: ['Y','E','S','T','E','R','D','A','Y'] },
    { word: 'WEEK', meaning: 'Tuần', aslSpelling: ['W','E','E','K'] },
    { word: 'MONTH', meaning: 'Tháng', aslSpelling: ['M','O','N','T','H'] },
    { word: 'YEAR', meaning: 'Năm', aslSpelling: ['Y','E','A','R'] },
    { word: 'HOUR', meaning: 'Giờ', aslSpelling: ['H','O','U','R'] },
    { word: 'MINUTE', meaning: 'Phút', aslSpelling: ['M','I','N','U','T','E'] },
    { word: 'SECOND', meaning: 'Giây', aslSpelling: ['S','E','C','O','N','D'] },
    { word: 'CLOCK', meaning: 'Đồng hồ', aslSpelling: ['C','L','O','C','K'] },
  ],
  Body: [
    { word: 'HEAD', meaning: 'Đầu', aslSpelling: ['H','E','A','D'] },
    { word: 'FACE', meaning: 'Mặt', aslSpelling: ['F','A','C','E'] },
    { word: 'EYE', meaning: 'Mắt', aslSpelling: ['E','Y','E'] },
    { word: 'NOSE', meaning: 'Mũi', aslSpelling: ['N','O','S','E'] },
    { word: 'MOUTH', meaning: 'Miệng', aslSpelling: ['M','O','U','T','H'] },
    { word: 'EAR', meaning: 'Tai', aslSpelling: ['E','A','R'] },
    { word: 'HAND', meaning: 'Tay', aslSpelling: ['H','A','N','D'] },
    { word: 'FOOT', meaning: 'Chân (bàn chân)', aslSpelling: ['F','O','O','T'] },
    { word: 'ARM', meaning: 'Cánh tay', aslSpelling: ['A','R','M'] },
    { word: 'LEG', meaning: 'Chân (đùi)', aslSpelling: ['L','E','G'] },
    { word: 'FINGER', meaning: 'Ngón tay', aslSpelling: ['F','I','N','G','E','R'] },
    { word: 'HAIR', meaning: 'Tóc', aslSpelling: ['H','A','I','R'] },
    { word: 'TOOTH', meaning: 'Răng', aslSpelling: ['T','O','O','T','H'] },
    { word: 'NECK', meaning: 'Cổ', aslSpelling: ['N','E','C','K'] },
    { word: 'SHOULDER', meaning: 'Vai', aslSpelling: ['S','H','O','U','L','D','E','R'] },
    { word: 'BACK', meaning: 'Lưng', aslSpelling: ['B','A','C','K'] },
    { word: 'CHEST', meaning: 'Ngực', aslSpelling: ['C','H','E','S','T'] },
    { word: 'STOMACH', meaning: 'Bụng', aslSpelling: ['S','T','O','M','A','C','H'] },
  ],
  Emotion: [
    { word: 'HAPPY', meaning: 'Vui / Hạnh phúc', aslSpelling: ['H','A','P','P','Y'] },
    { word: 'SAD', meaning: 'Buồn', aslSpelling: ['S','A','D'] },
    { word: 'ANGRY', meaning: 'Tức giận', aslSpelling: ['A','N','G','R','Y'] },
    { word: 'AFRAID', meaning: 'Sợ hãi', aslSpelling: ['A','F','R','A','I','D'] },
    { word: 'EXCITED', meaning: 'Phấn khích', aslSpelling: ['E','X','C','I','T','E','D'] },
    { word: 'TIRED', meaning: 'Mệt mỏi', aslSpelling: ['T','I','R','E','D'] },
    { word: 'SURPRISED', meaning: 'Ngạc nhiên', aslSpelling: ['S','U','R','P','R','I','S','E','D'] },
    { word: 'CONFUSED', meaning: 'Bối rối', aslSpelling: ['C','O','N','F','U','S','E','D'] },
    { word: 'PROUD', meaning: 'Tự hào', aslSpelling: ['P','R','O','U','D'] },
    { word: 'LOVE', meaning: 'Yêu thương', aslSpelling: ['L','O','V','E'] },
    { word: 'HATE', meaning: 'Ghét', aslSpelling: ['H','A','T','E'] },
    { word: 'LIKE', meaning: 'Thích', aslSpelling: ['L','I','K','E'] },
    { word: 'NERVOUS', meaning: 'Lo lắng', aslSpelling: ['N','E','R','V','O','U','S'] },
    { word: 'CALM', meaning: 'Bình tĩnh', aslSpelling: ['C','A','L','M'] },
  ],
  Actions: [
    { word: 'HELP', meaning: 'Giúp đỡ', aslSpelling: ['H','E','L','P'] },
    { word: 'PLAY', meaning: 'Chơi', aslSpelling: ['P','L','A','Y'] },
    { word: 'STUDY', meaning: 'Học', aslSpelling: ['S','T','U','D','Y'] },
    { word: 'WORK', meaning: 'Làm việc', aslSpelling: ['W','O','R','K'] },
    { word: 'EAT', meaning: 'Ăn', aslSpelling: ['E','A','T'] },
    { word: 'DRINK', meaning: 'Uống', aslSpelling: ['D','R','I','N','K'] },
    { word: 'SLEEP', meaning: 'Ngủ', aslSpelling: ['S','L','E','E','P'] },
    { word: 'WAKE', meaning: 'Thức dậy', aslSpelling: ['W','A','K','E'] },
    { word: 'RUN', meaning: 'Chạy', aslSpelling: ['R','U','N'] },
    { word: 'WALK', meaning: 'Đi bộ', aslSpelling: ['W','A','L','K'] },
    { word: 'SIT', meaning: 'Ngồi', aslSpelling: ['S','I','T'] },
    { word: 'STAND', meaning: 'Đứng', aslSpelling: ['S','T','A','N','D'] },
    { word: 'SWIM', meaning: 'Bơi', aslSpelling: ['S','W','I','M'] },
    { word: 'JUMP', meaning: 'Nhảy', aslSpelling: ['J','U','M','P'] },
    { word: 'SPEAK', meaning: 'Nói', aslSpelling: ['S','P','E','A','K'] },
    { word: 'LISTEN', meaning: 'Nghe', aslSpelling: ['L','I','S','T','E','N'] },
    { word: 'SEE', meaning: 'Nhìn / Thấy', aslSpelling: ['S','E','E'] },
    { word: 'THINK', meaning: 'Nghĩ', aslSpelling: ['T','H','I','N','K'] },
    { word: 'KNOW', meaning: 'Biết', aslSpelling: ['K','N','O','W'] },
    { word: 'FORGET', meaning: 'Quên', aslSpelling: ['F','O','R','G','E','T'] },
    { word: 'WRITE', meaning: 'Viết', aslSpelling: ['W','R','I','T','E'] },
    { word: 'READ', meaning: 'Đọc', aslSpelling: ['R','E','A','D'] },
    { word: 'DRAW', meaning: 'Vẽ', aslSpelling: ['D','R','A','W'] },
    { word: 'SING', meaning: 'Hát', aslSpelling: ['S','I','N','G'] },
    { word: 'DANCE', meaning: 'Nhảy / Múa', aslSpelling: ['D','A','N','C','E'] },
    { word: 'COOK', meaning: 'Nấu ăn', aslSpelling: ['C','O','O','K'] },
    { word: 'BUY', meaning: 'Mua', aslSpelling: ['B','U','Y'] },
    { word: 'COME', meaning: 'Đến / Đi đến', aslSpelling: ['C','O','M','E'] },
    { word: 'GO', meaning: 'Đi', aslSpelling: ['G','O'] },
    { word: 'STOP', meaning: 'Dừng', aslSpelling: ['S','T','O','P'] },
    { word: 'START', meaning: 'Bắt đầu', aslSpelling: ['S','T','A','R','T'] },
    { word: 'WIN', meaning: 'Thắng', aslSpelling: ['W','I','N'] },
    { word: 'LOSE', meaning: 'Thua', aslSpelling: ['L','O','S','E'] },
    { word: 'DREAM', meaning: 'Mơ / Ước mơ', aslSpelling: ['D','R','E','A','M'] },
  ],
  Place: [
    { word: 'HOME', meaning: 'Nhà', aslSpelling: ['H','O','M','E'] },
    { word: 'SCHOOL', meaning: 'Trường học', aslSpelling: ['S','C','H','O','O','L'] },
    { word: 'HOSPITAL', meaning: 'Bệnh viện', aslSpelling: ['H','O','S','P','I','T','A','L'] },
    { word: 'MARKET', meaning: 'Chợ', aslSpelling: ['M','A','R','K','E','T'] },
    { word: 'STORE', meaning: 'Cửa hàng', aslSpelling: ['S','T','O','R','E'] },
    { word: 'RESTAURANT', meaning: 'Nhà hàng', aslSpelling: ['R','E','S','T','A','U','R','A','N','T'] },
    { word: 'CAFE', meaning: 'Quán cà phê', aslSpelling: ['C','A','F','E'] },
    { word: 'HOTEL', meaning: 'Khách sạn', aslSpelling: ['H','O','T','E','L'] },
    { word: 'AIRPORT', meaning: 'Sân bay', aslSpelling: ['A','I','R','P','O','R','T'] },
    { word: 'PARK', meaning: 'Công viên', aslSpelling: ['P','A','R','K'] },
    { word: 'BEACH', meaning: 'Bãi biển', aslSpelling: ['B','E','A','C','H'] },
    { word: 'CHURCH', meaning: 'Nhà thờ', aslSpelling: ['C','H','U','R','C','H'] },
    { word: 'LIBRARY', meaning: 'Thư viện', aslSpelling: ['L','I','B','R','A','R','Y'] },
    { word: 'OFFICE', meaning: 'Văn phòng', aslSpelling: ['O','F','F','I','C','E'] },
    { word: 'BANK', meaning: 'Ngân hàng', aslSpelling: ['B','A','N','K'] },
    { word: 'THEATER', meaning: 'Rạp chiếu phim', aslSpelling: ['T','H','E','A','T','E','R'] },
    { word: 'GYM', meaning: 'Phòng gym', aslSpelling: ['G','Y','M'] },
    { word: 'POOL', meaning: 'Hồ bơi', aslSpelling: ['P','O','O','L'] },
    { word: 'MOUNTAIN', meaning: 'Núi', aslSpelling: ['M','O','U','N','T','A','I','N'] },
    { word: 'RIVER', meaning: 'Sông', aslSpelling: ['R','I','V','E','R'] },
    { word: 'OCEAN', meaning: 'Đại dương', aslSpelling: ['O','C','E','A','N'] },
    { word: 'CITY', meaning: 'Thành phố', aslSpelling: ['C','I','T','Y'] },
    { word: 'VILLAGE', meaning: 'Làng', aslSpelling: ['V','I','L','L','A','G','E'] },
    { word: 'WORLD', meaning: 'Thế giới', aslSpelling: ['W','O','R','L','D'] },
    { word: 'EARTH', meaning: 'Trái đất', aslSpelling: ['E','A','R','T','H'] },
    { word: 'GARDEN', meaning: 'Vườn', aslSpelling: ['G','A','R','D','E','N'] },
    { word: 'FOREST', meaning: 'Rừng', aslSpelling: ['F','O','R','E','S','T'] },
    { word: 'ZOO', meaning: 'Sở thú', aslSpelling: ['Z','O','O'] },
    { word: 'MUSEUM', meaning: 'Bảo tàng', aslSpelling: ['M','U','S','E','U','M'] },
  ],
  School: [
    { word: 'TEACHER', meaning: 'Giáo viên', aslSpelling: ['T','E','A','C','H','E','R'] },
    { word: 'STUDENT', meaning: 'Học sinh', aslSpelling: ['S','T','U','D','E','N','T'] },
    { word: 'BOOK', meaning: 'Sách', aslSpelling: ['B','O','O','K'] },
    { word: 'PEN', meaning: 'Bút', aslSpelling: ['P','E','N'] },
    { word: 'PENCIL', meaning: 'Bút chì', aslSpelling: ['P','E','N','C','I','L'] },
    { word: 'PAPER', meaning: 'Giấy', aslSpelling: ['P','A','P','E','R'] },
    { word: 'NOTEBOOK', meaning: 'Vở', aslSpelling: ['N','O','T','E','B','O','O','K'] },
    { word: 'RULER', meaning: 'Thước kẻ', aslSpelling: ['R','U','L','E','R'] },
    { word: 'ERASER', meaning: 'Tẩy', aslSpelling: ['E','R','A','S','E','R'] },
    { word: 'DESK', meaning: 'Bàn học', aslSpelling: ['D','E','S','K'] },
    { word: 'CHAIR', meaning: 'Ghế', aslSpelling: ['C','H','A','I','R'] },
    { word: 'BOARD', meaning: 'Bảng', aslSpelling: ['B','O','A','R','D'] },
    { word: 'EXAM', meaning: 'Kỳ thi', aslSpelling: ['E','X','A','M'] },
    { word: 'TEST', meaning: 'Bài kiểm tra', aslSpelling: ['T','E','S','T'] },
    { word: 'HOMEWORK', meaning: 'Bài tập về nhà', aslSpelling: ['H','O','M','E','W','O','R','K'] },
    { word: 'LESSON', meaning: 'Bài học', aslSpelling: ['L','E','S','S','O','N'] },
  ],
  Job: [
    { word: 'DOCTOR', meaning: 'Bác sĩ', aslSpelling: ['D','O','C','T','O','R'] },
    { word: 'NURSE', meaning: 'Y tá', aslSpelling: ['N','U','R','S','E'] },
    { word: 'ENGINEER', meaning: 'Kỹ sư', aslSpelling: ['E','N','G','I','N','E','E','R'] },
    { word: 'LAWYER', meaning: 'Luật sư', aslSpelling: ['L','A','W','Y','E','R'] },
    { word: 'POLICE', meaning: 'Cảnh sát', aslSpelling: ['P','O','L','I','C','E'] },
    { word: 'FIREFIGHTER', meaning: 'Lính cứu hỏa', aslSpelling: ['F','I','R','E','F','I','G','H','T','E','R'] },
    { word: 'FARMER', meaning: 'Nông dân', aslSpelling: ['F','A','R','M','E','R'] },
    { word: 'COOK', meaning: 'Đầu bếp', aslSpelling: ['C','O','O','K'] },
    { word: 'DRIVER', meaning: 'Tài xế', aslSpelling: ['D','R','I','V','E','R'] },
    { word: 'PILOT', meaning: 'Phi công', aslSpelling: ['P','I','L','O','T'] },
    { word: 'SECRETARY', meaning: 'Thư ký', aslSpelling: ['S','E','C','R','E','T','A','R','Y'] },
    { word: 'MANAGER', meaning: 'Quản lý', aslSpelling: ['M','A','N','A','G','E','R'] },
    { word: 'ACCOUNTANT', meaning: 'Kế toán', aslSpelling: ['A','C','C','O','U','N','T','A','N','T'] },
    { word: 'SINGER', meaning: 'Ca sĩ', aslSpelling: ['S','I','N','G','E','R'] },
    { word: 'ACTOR', meaning: 'Diễn viên', aslSpelling: ['A','C','T','O','R'] },
    { word: 'PHOTOGRAPHER', meaning: 'Nhiếp ảnh gia', aslSpelling: ['P','H','O','T','O','G','R','A','P','H','E','R'] },
    { word: 'ARTIST', meaning: 'Họa sĩ', aslSpelling: ['A','R','T','I','S','T'] },
    { word: 'JOURNALIST', meaning: 'Nhà báo', aslSpelling: ['J','O','U','R','N','A','L','I','S','T'] },
    { word: 'SCIENTIST', meaning: 'Nhà khoa học', aslSpelling: ['S','C','I','E','N','T','I','S','T'] },
  ],
  Weather: [
    { word: 'SUNNY', meaning: 'Nắng', aslSpelling: ['S','U','N','N','Y'] },
    { word: 'RAINY', meaning: 'Mưa', aslSpelling: ['R','A','I','N','Y'] },
    { word: 'CLOUDY', meaning: 'Nhiều mây', aslSpelling: ['C','L','O','U','D','Y'] },
    { word: 'WINDY', meaning: 'Gió', aslSpelling: ['W','I','N','D','Y'] },
    { word: 'SNOW', meaning: 'Tuyết', aslSpelling: ['S','N','O','W'] },
    { word: 'HOT', meaning: 'Nóng', aslSpelling: ['H','O','T'] },
    { word: 'COLD', meaning: 'Lạnh', aslSpelling: ['C','O','L','D'] },
    { word: 'WARM', meaning: 'Ấm', aslSpelling: ['W','A','R','M'] },
    { word: 'COOL', meaning: 'Mát', aslSpelling: ['C','O','O','L'] },
    { word: 'STORM', meaning: 'Bão', aslSpelling: ['S','T','O','R','M'] },
    { word: 'THUNDER', meaning: 'Sấm', aslSpelling: ['T','H','U','N','D','E','R'] },
    { word: 'LIGHTNING', meaning: 'Sét', aslSpelling: ['L','I','G','H','T','N','I','N','G'] },
    { word: 'FOG', meaning: 'Sương mù', aslSpelling: ['F','O','G'] },
    { word: 'SPRING', meaning: 'Mùa xuân', aslSpelling: ['S','P','R','I','N','G'] },
    { word: 'SUMMER', meaning: 'Mùa hạ', aslSpelling: ['S','U','M','M','E','R'] },
    { word: 'AUTUMN', meaning: 'Mùa thu', aslSpelling: ['A','U','T','U','M','N'] },
    { word: 'WINTER', meaning: 'Mùa đông', aslSpelling: ['W','I','N','T','E','R'] },
    { word: 'RAINBOW', meaning: 'Cầu vồng', aslSpelling: ['R','A','I','N','B','O','W'] },
  ],
  Clothes: [
    { word: 'SHIRT', meaning: 'Áo sơ mi', aslSpelling: ['S','H','I','R','T'] },
    { word: 'PANTS', meaning: 'Quần dài', aslSpelling: ['P','A','N','T','S'] },
    { word: 'DRESS', meaning: 'Đầm', aslSpelling: ['D','R','E','S','S'] },
    { word: 'SKIRT', meaning: 'Váy', aslSpelling: ['S','K','I','R','T'] },
    { word: 'SHORTS', meaning: 'Quần ngắn', aslSpelling: ['S','H','O','R','T','S'] },
    { word: 'JACKET', meaning: 'Áo khoác', aslSpelling: ['J','A','C','K','E','T'] },
    { word: 'SHOE', meaning: 'Giày', aslSpelling: ['S','H','O','E'] },
    { word: 'SANDAL', meaning: 'Dép', aslSpelling: ['S','A','N','D','A','L'] },
    { word: 'HAT', meaning: 'Mũ', aslSpelling: ['H','A','T'] },
    { word: 'GLASSES', meaning: 'Kính mắt', aslSpelling: ['G','L','A','S','S','E','S'] },
    { word: 'SCARF', meaning: 'Khăn choàng', aslSpelling: ['S','C','A','R','F'] },
    { word: 'GLOVE', meaning: 'Găng tay', aslSpelling: ['G','L','O','V','E'] },
    { word: 'SOCK', meaning: 'Vớ / Tất', aslSpelling: ['S','O','C','K'] },
    { word: 'UMBRELLA', meaning: 'Ô / Dù', aslSpelling: ['U','M','B','R','E','L','L','A'] },
    { word: 'RING', meaning: 'Nhẫn', aslSpelling: ['R','I','N','G'] },
    { word: 'BRACELET', meaning: 'Vòng tay', aslSpelling: ['B','R','A','C','E','L','E','T'] },
    { word: 'NECKLACE', meaning: 'Dây chuyền', aslSpelling: ['N','E','C','K','L','A','C','E'] },
  ],
  Technology: [
    { word: 'COMPUTER', meaning: 'Máy tính', aslSpelling: ['C','O','M','P','U','T','E','R'] },
    { word: 'PHONE', meaning: 'Điện thoại', aslSpelling: ['P','H','O','N','E'] },
    { word: 'TABLET', meaning: 'Máy tính bảng', aslSpelling: ['T','A','B','L','E','T'] },
    { word: 'LAPTOP', meaning: 'Laptop', aslSpelling: ['L','A','P','T','O','P'] },
    { word: 'KEYBOARD', meaning: 'Bàn phím', aslSpelling: ['K','E','Y','B','O','A','R','D'] },
    { word: 'MOUSE', meaning: 'Chuột máy tính', aslSpelling: ['M','O','U','S','E'] },
    { word: 'SCREEN', meaning: 'Màn hình', aslSpelling: ['S','C','R','E','E','N'] },
    { word: 'CAMERA', meaning: 'Máy ảnh', aslSpelling: ['C','A','M','E','R','A'] },
    { word: 'TELEVISION', meaning: 'Tivi', aslSpelling: ['T','E','L','E','V','I','S','I','O','N'] },
    { word: 'INTERNET', meaning: 'Internet', aslSpelling: ['I','N','T','E','R','N','E','T'] },
    { word: 'WIFI', meaning: 'Wifi', aslSpelling: ['W','I','F','I'] },
    { word: 'CHARGER', meaning: 'Sạc', aslSpelling: ['C','H','A','R','G','E','R'] },
    { word: 'BATTERY', meaning: 'Pin', aslSpelling: ['B','A','T','T','E','R','Y'] },
    { word: 'HEADPHONE', meaning: 'Tai nghe', aslSpelling: ['H','E','A','D','P','H','O','N','E'] },
    { word: 'SPEAKER', meaning: 'Loa', aslSpelling: ['S','P','E','A','K','E','R'] },
    { word: 'SOFTWARE', meaning: 'Phần mềm', aslSpelling: ['S','O','F','T','W','A','R','E'] },
    { word: 'GAME', meaning: 'Trò chơi', aslSpelling: ['G','A','M','E'] },
    { word: 'ROBOT', meaning: 'Robot', aslSpelling: ['R','O','B','O','T'] },
    { word: 'EMAIL', meaning: 'Email', aslSpelling: ['E','M','A','I','L'] },
    { word: 'MESSAGE', meaning: 'Tin nhắn', aslSpelling: ['M','E','S','S','A','G','E'] },
    { word: 'VIDEO', meaning: 'Video', aslSpelling: ['V','I','D','E','O'] },
    { word: 'PHOTO', meaning: 'Hình ảnh', aslSpelling: ['P','H','O','T','O'] },
    { word: 'MUSIC', meaning: 'Âm nhạc', aslSpelling: ['M','U','S','I','C'] },
    { word: 'MOVIE', meaning: 'Phim', aslSpelling: ['M','O','V','I','E'] },
  ],
  Sport: [
    { word: 'SOCCER', meaning: 'Bóng đá', aslSpelling: ['S','O','C','C','E','R'] },
    { word: 'BASKETBALL', meaning: 'Bóng rổ', aslSpelling: ['B','A','S','K','E','T','B','A','L','L'] },
    { word: 'VOLLEYBALL', meaning: 'Bóng chuyền', aslSpelling: ['V','O','L','L','E','Y','B','A','L','L'] },
    { word: 'TENNIS', meaning: 'Tennis', aslSpelling: ['T','E','N','N','I','S'] },
    { word: 'BADMINTON', meaning: 'Cầu lông', aslSpelling: ['B','A','D','M','I','N','T','O','N'] },
    { word: 'SWIMMING', meaning: 'Bơi lội', aslSpelling: ['S','W','I','M','M','I','N','G'] },
    { word: 'DIVING', meaning: 'Lặn', aslSpelling: ['D','I','V','I','N','G'] },
    { word: 'JOGGING', meaning: 'Chạy bộ', aslSpelling: ['J','O','G','G','I','N','G'] },
    { word: 'BOXING', meaning: 'Đấm bốc', aslSpelling: ['B','O','X','I','N','G'] },
    { word: 'KARATE', meaning: 'Karate', aslSpelling: ['K','A','R','A','T','E'] },
    { word: 'YOGA', meaning: 'Yoga', aslSpelling: ['Y','O','G','A'] },
    { word: 'CHESS', meaning: 'Cờ vua', aslSpelling: ['C','H','E','S','S'] },
    { word: 'BOWLING', meaning: 'Bowling', aslSpelling: ['B','O','W','L','I','N','G'] },
  ],
  Music: [
    { word: 'SONG', meaning: 'Bài hát', aslSpelling: ['S','O','N','G'] },
    { word: 'PIANO', meaning: 'Piano', aslSpelling: ['P','I','A','N','O'] },
    { word: 'GUITAR', meaning: 'Guitar', aslSpelling: ['G','U','I','T','A','R'] },
    { word: 'DRUM', meaning: 'Trống', aslSpelling: ['D','R','U','M'] },
    { word: 'VIOLIN', meaning: 'Violin', aslSpelling: ['V','I','O','L','I','N'] },
    { word: 'FLUTE', meaning: 'Sáo', aslSpelling: ['F','L','U','T','E'] },
    { word: 'TRUMPET', meaning: 'Kèn', aslSpelling: ['T','R','U','M','P','E','T'] },
    { word: 'CONCERT', meaning: 'Buổi hòa nhạc', aslSpelling: ['C','O','N','C','E','R','T'] },
    { word: 'ALBUM', meaning: 'Album', aslSpelling: ['A','L','B','U','M'] },
    { word: 'LYRICS', meaning: 'Lời bài hát', aslSpelling: ['L','Y','R','I','C','S'] },
  ],
  Nature: [
    { word: 'SUN', meaning: 'Mặt trời', aslSpelling: ['S','U','N'] },
    { word: 'MOON', meaning: 'Mặt trăng', aslSpelling: ['M','O','O','N'] },
    { word: 'STAR', meaning: 'Sao / Ngôi sao', aslSpelling: ['S','T','A','R'] },
    { word: 'SKY', meaning: 'Bầu trời', aslSpelling: ['S','K','Y'] },
    { word: 'CLOUD', meaning: 'Mây', aslSpelling: ['C','L','O','U','D'] },
    { word: 'TREE', meaning: 'Cây', aslSpelling: ['T','R','E','E'] },
    { word: 'FLOWER', meaning: 'Hoa', aslSpelling: ['F','L','O','W','E','R'] },
    { word: 'GRASS', meaning: 'Cỏ', aslSpelling: ['G','R','A','S','S'] },
    { word: 'LEAF', meaning: 'Lá', aslSpelling: ['L','E','A','F'] },
    { word: 'HILL', meaning: 'Đồi', aslSpelling: ['H','I','L','L'] },
    { word: 'LAKE', meaning: 'Hồ', aslSpelling: ['L','A','K','E'] },
    { word: 'SEA', meaning: 'Biển', aslSpelling: ['S','E','A'] },
    { word: 'ISLAND', meaning: 'Đảo', aslSpelling: ['I','S','L','A','N','D'] },
    { word: 'WATERFALL', meaning: 'Thác nước', aslSpelling: ['W','A','T','E','R','F','A','L','L'] },
    { word: 'DESERT', meaning: 'Sa mạc', aslSpelling: ['D','E','S','E','R','T'] },
  ],
  Health: [
    { word: 'HEALTH', meaning: 'Sức khỏe', aslSpelling: ['H','E','A','L','T','H'] },
    { word: 'MEDICINE', meaning: 'Thuốc', aslSpelling: ['M','E','D','I','C','I','N','E'] },
    { word: 'PILL', meaning: 'Viên thuốc', aslSpelling: ['P','I','L','L'] },
    { word: 'FEVER', meaning: 'Sốt', aslSpelling: ['F','E','V','E','R'] },
    { word: 'COUGH', meaning: 'Ho', aslSpelling: ['C','O','U','G','H'] },
    { word: 'HEADACHE', meaning: 'Đau đầu', aslSpelling: ['H','E','A','D','A','C','H','E'] },
    { word: 'TOOTHACHE', meaning: 'Đau răng', aslSpelling: ['T','O','O','T','H','A','C','H','E'] },
    { word: 'EXERCISE', meaning: 'Tập thể dục', aslSpelling: ['E','X','E','R','C','I','S','E'] },
    { word: 'VITAMIN', meaning: 'Vitamin', aslSpelling: ['V','I','T','A','M','I','N'] },
    { word: 'INSURANCE', meaning: 'Bảo hiểm', aslSpelling: ['I','N','S','U','R','A','N','C','E'] },
  ],
  Travel: [
    { word: 'TRAVEL', meaning: 'Du lịch', aslSpelling: ['T','R','A','V','E','L'] },
    { word: 'TRIP', meaning: 'Chuyến đi', aslSpelling: ['T','R','I','P'] },
    { word: 'PASSPORT', meaning: 'Hộ chiếu', aslSpelling: ['P','A','S','S','P','O','R','T'] },
    { word: 'VISA', meaning: 'Visa', aslSpelling: ['V','I','S','A'] },
    { word: 'TICKET', meaning: 'Vé', aslSpelling: ['T','I','C','K','E','T'] },
    { word: 'LUGGAGE', meaning: 'Hành lý', aslSpelling: ['L','U','G','G','A','G','E'] },
    { word: 'MAP', meaning: 'Bản đồ', aslSpelling: ['M','A','P'] },
    { word: 'HOTEL', meaning: 'Khách sạn', aslSpelling: ['H','O','T','E','L'] },
    { word: 'RESORT', meaning: 'Khu nghỉ dưỡng', aslSpelling: ['R','E','S','O','R','T'] },
    { word: 'VACATION', meaning: 'Kỳ nghỉ', aslSpelling: ['V','A','C','A','T','I','O','N'] },
    { word: 'CAMPING', meaning: 'Cắm trại', aslSpelling: ['C','A','M','P','I','N','G'] },
    { word: 'ADVENTURE', meaning: 'Phiêu lưu', aslSpelling: ['A','D','V','E','N','T','U','R','E'] },
  ],
  Shopping: [
    { word: 'SHOP', meaning: 'Cửa hàng', aslSpelling: ['S','H','O','P'] },
    { word: 'SUPERMARKET', meaning: 'Siêu thị', aslSpelling: ['S','U','P','E','R','M','A','R','K','E','T'] },
    { word: 'MALL', meaning: 'Trung tâm thương mại', aslSpelling: ['M','A','L','L'] },
    { word: 'PRICE', meaning: 'Giá', aslSpelling: ['P','R','I','C','E'] },
    { word: 'DISCOUNT', meaning: 'Giảm giá', aslSpelling: ['D','I','S','C','O','U','N','T'] },
    { word: 'MONEY', meaning: 'Tiền', aslSpelling: ['M','O','N','E','Y'] },
    { word: 'CASH', meaning: 'Tiền mặt', aslSpelling: ['C','A','S','H'] },
    { word: 'CARD', meaning: 'Thẻ', aslSpelling: ['C','A','R','D'] },
    { word: 'RECEIPT', meaning: 'Hóa đơn', aslSpelling: ['R','E','C','E','I','P','T'] },
    { word: 'CHEAP', meaning: 'Rẻ', aslSpelling: ['C','H','E','A','P'] },
    { word: 'EXPENSIVE', meaning: 'Đắt', aslSpelling: ['E','X','P','E','N','S','I','V','E'] },
    { word: 'ONLINE', meaning: 'Trực tuyến', aslSpelling: ['O','N','L','I','N','E'] },
    { word: 'DELIVERY', meaning: 'Giao hàng', aslSpelling: ['D','E','L','I','V','E','R','Y'] },
  ],
  DailyRoutine: [
    { word: 'MONDAY', meaning: 'Thứ hai', aslSpelling: ['M','O','N','D','A','Y'] },
    { word: 'TUESDAY', meaning: 'Thứ ba', aslSpelling: ['T','U','E','S','D','A','Y'] },
    { word: 'WEDNESDAY', meaning: 'Thứ tư', aslSpelling: ['W','E','D','N','E','S','D','A','Y'] },
    { word: 'THURSDAY', meaning: 'Thứ năm', aslSpelling: ['T','H','U','R','S','D','A','Y'] },
    { word: 'FRIDAY', meaning: 'Thứ sáu', aslSpelling: ['F','R','I','D','A','Y'] },
    { word: 'SATURDAY', meaning: 'Thứ bảy', aslSpelling: ['S','A','T','U','R','D','A','Y'] },
    { word: 'SUNDAY', meaning: 'Chủ nhật', aslSpelling: ['S','U','N','D','A','Y'] },
    { word: 'TODAY', meaning: 'Hôm nay', aslSpelling: ['T','O','D','A','Y'] },
    { word: 'TOMORROW', meaning: 'Ngày mai', aslSpelling: ['T','O','M','O','R','R','O','W'] },
    { word: 'YESTERDAY', meaning: 'Hôm qua', aslSpelling: ['Y','E','S','T','E','R','D','A','Y'] },
  ],
  Months: [
    { word: 'JANUARY', meaning: 'Tháng một', aslSpelling: ['J','A','N','U','A','R','Y'] },
    { word: 'FEBRUARY', meaning: 'Tháng hai', aslSpelling: ['F','E','B','R','U','A','R','Y'] },
    { word: 'MARCH', meaning: 'Tháng ba', aslSpelling: ['M','A','R','C','H'] },
    { word: 'APRIL', meaning: 'Tháng tư', aslSpelling: ['A','P','R','I','L'] },
    { word: 'MAY', meaning: 'Tháng năm', aslSpelling: ['M','A','Y'] },
    { word: 'JUNE', meaning: 'Tháng sáu', aslSpelling: ['J','U','N','E'] },
    { word: 'JULY', meaning: 'Tháng bảy', aslSpelling: ['J','U','L','Y'] },
    { word: 'AUGUST', meaning: 'Tháng tám', aslSpelling: ['A','U','G','U','S','T'] },
    { word: 'SEPTEMBER', meaning: 'Tháng chín', aslSpelling: ['S','E','P','T','E','M','B','E','R'] },
    { word: 'OCTOBER', meaning: 'Tháng mười', aslSpelling: ['O','C','T','O','B','E','R'] },
    { word: 'NOVEMBER', meaning: 'Tháng mười một', aslSpelling: ['N','O','V','E','M','B','E','R'] },
    { word: 'DECEMBER', meaning: 'Tháng mười hai', aslSpelling: ['D','E','C','E','M','B','E','R'] },
  ],
  Opposites: [
    { word: 'BIG', meaning: 'Lớn', aslSpelling: ['B','I','G'] },
    { word: 'SMALL', meaning: 'Nhỏ', aslSpelling: ['S','M','A','L','L'] },
    { word: 'TALL', meaning: 'Cao', aslSpelling: ['T','A','L','L'] },
    { word: 'SHORT', meaning: 'Thấp / Ngắn', aslSpelling: ['S','H','O','R','T'] },
    { word: 'LONG', meaning: 'Dài', aslSpelling: ['L','O','N','G'] },
    { word: 'THIN', meaning: 'Gầy', aslSpelling: ['T','H','I','N'] },
    { word: 'FAT', meaning: 'Béo', aslSpelling: ['F','A','T'] },
    { word: 'YOUNG', meaning: 'Trẻ', aslSpelling: ['Y','O','U','N','G'] },
    { word: 'RICH', meaning: 'Giàu', aslSpelling: ['R','I','C','H'] },
    { word: 'POOR', meaning: 'Nghèo', aslSpelling: ['P','O','O','R'] },
    { word: 'STRONG', meaning: 'Mạnh', aslSpelling: ['S','T','R','O','N','G'] },
    { word: 'WEAK', meaning: 'Yếu', aslSpelling: ['W','E','A','K'] },
    { word: 'FAST', meaning: 'Nhanh', aslSpelling: ['F','A','S','T'] },
    { word: 'SLOW', meaning: 'Chậm', aslSpelling: ['S','L','O','W'] },
    { word: 'HEAVY', meaning: 'Nặng', aslSpelling: ['H','E','A','V','Y'] },
    { word: 'LIGHT', meaning: 'Nhẹ', aslSpelling: ['L','I','G','H','T'] },
    { word: 'HARD', meaning: 'Cứng', aslSpelling: ['H','A','R','D'] },
    { word: 'SOFT', meaning: 'Mềm', aslSpelling: ['S','O','F','T'] },
    { word: 'BRIGHT', meaning: 'Sáng', aslSpelling: ['B','R','I','G','H','T'] },
    { word: 'DARK', meaning: 'Tối', aslSpelling: ['D','A','R','K'] },
    { word: 'LOUD', meaning: 'To / Ồn', aslSpelling: ['L','O','U','D'] },
    { word: 'QUIET', meaning: 'Im lặng', aslSpelling: ['Q','U','I','E','T'] },
    { word: 'CLEAN', meaning: 'Sạch', aslSpelling: ['C','L','E','A','N'] },
    { word: 'DIRTY', meaning: 'Bẩn', aslSpelling: ['D','I','R','T','Y'] },
    { word: 'BEAUTIFUL', meaning: 'Đẹp', aslSpelling: ['B','E','A','U','T','I','F','U','L'] },
    { word: 'UGLY', meaning: 'Xấu', aslSpelling: ['U','G','L','Y'] },
    { word: 'GOOD', meaning: 'Tốt', aslSpelling: ['G','O','O','D'] },
    { word: 'BAD', meaning: 'Xấu / Dở', aslSpelling: ['B','A','D'] },
    { word: 'EASY', meaning: 'Dễ', aslSpelling: ['E','A','S','Y'] },
    { word: 'DIFFICULT', meaning: 'Khó', aslSpelling: ['D','I','F','F','I','C','U','L','T'] },
    { word: 'SAFE', meaning: 'An toàn', aslSpelling: ['S','A','F','E'] },
    { word: 'DANGEROUS', meaning: 'Nguy hiểm', aslSpelling: ['D','A','N','G','E','R','O','U','S'] },
    { word: 'OPEN', meaning: 'Mở', aslSpelling: ['O','P','E','N'] },
    { word: 'CLOSE', meaning: 'Đóng', aslSpelling: ['C','L','O','S','E'] },
    { word: 'INSIDE', meaning: 'Trong', aslSpelling: ['I','N','S','I','D','E'] },
    { word: 'OUTSIDE', meaning: 'Ngoài', aslSpelling: ['O','U','T','S','I','D','E'] },
    { word: 'UP', meaning: 'Lên / Trên', aslSpelling: ['U','P'] },
    { word: 'DOWN', meaning: 'Xuống / Dưới', aslSpelling: ['D','O','W','N'] },
    { word: 'LEFT', meaning: 'Trái', aslSpelling: ['L','E','F','T'] },
    { word: 'RIGHT', meaning: 'Phải', aslSpelling: ['R','I','G','H','T'] },
    { word: 'STRAIGHT', meaning: 'Thẳng', aslSpelling: ['S','T','R','A','I','G','H','T'] },
    { word: 'SWEET', meaning: 'Ngọt', aslSpelling: ['S','W','E','E','T'] },
    { word: 'SOUR', meaning: 'Chua', aslSpelling: ['S','O','U','R'] },
    { word: 'SALTY', meaning: 'Mặn', aslSpelling: ['S','A','L','T','Y'] },
    { word: 'SPICY', meaning: 'Cay', aslSpelling: ['S','P','I','C','Y'] },
    { word: 'DELICIOUS', meaning: 'Ngon', aslSpelling: ['D','E','L','I','C','I','O','U','S'] },
    { word: 'SMART', meaning: 'Thông minh', aslSpelling: ['S','M','A','R','T'] },
    { word: 'STUPID', meaning: 'Ngu / Dốt', aslSpelling: ['S','T','U','P','I','D'] },
    { word: 'BRAVE', meaning: 'Dũng cảm', aslSpelling: ['B','R','A','V','E'] },
    { word: 'BUSY', meaning: 'Bận', aslSpelling: ['B','U','S','Y'] },
    { word: 'LAZY', meaning: 'Lười', aslSpelling: ['L','A','Z','Y'] },
    { word: 'DILIGENT', meaning: 'Chăm chỉ', aslSpelling: ['D','I','L','I','G','E','N','T'] },
    { word: 'CAREFUL', meaning: 'Cẩn thận', aslSpelling: ['C','A','R','E','F','U','L'] },
    { word: 'PUNCTUAL', meaning: 'Đúng giờ', aslSpelling: ['P','U','N','C','T','U','A','L'] },
    { word: 'LATE', meaning: 'Trễ / Muộn', aslSpelling: ['L','A','T','E'] },
    { word: 'COMFORTABLE', meaning: 'Thoải mái', aslSpelling: ['C','O','M','F','O','R','T','A','B','L','E'] },
    { word: 'POSSIBLE', meaning: 'Có thể', aslSpelling: ['P','O','S','S','I','B','L','E'] },
    { word: 'IMPOSSIBLE', meaning: 'Không thể', aslSpelling: ['I','M','P','O','S','S','I','B','L','E'] },
    { word: 'DIFFERENT', meaning: 'Khác', aslSpelling: ['D','I','F','F','E','R','E','N','T'] },
    { word: 'SAME', meaning: 'Giống / Như nhau', aslSpelling: ['S','A','M','E'] },
  ],
  Misc: [
    { word: 'QUESTION', meaning: 'Câu hỏi', aslSpelling: ['Q','U','E','S','T','I','O','N'] },
    { word: 'ANSWER', meaning: 'Câu trả lời', aslSpelling: ['A','N','S','W','E','R'] },
    { word: 'IDEA', meaning: 'Ý tưởng', aslSpelling: ['I','D','E','A'] },
    { word: 'PLAN', meaning: 'Kế hoạch', aslSpelling: ['P','L','A','N'] },
    { word: 'GOAL', meaning: 'Mục tiêu', aslSpelling: ['G','O','A','L'] },
    { word: 'SUCCESS', meaning: 'Thành công', aslSpelling: ['S','U','C','C','E','S','S'] },
    { word: 'FAILURE', meaning: 'Thất bại', aslSpelling: ['F','A','I','L','U','R','E'] },
    { word: 'EFFORT', meaning: 'Cố gắng', aslSpelling: ['E','F','F','O','R','T'] },
    { word: 'PROBLEM', meaning: 'Vấn đề', aslSpelling: ['P','R','O','B','L','E','M'] },
    { word: 'SOLUTION', meaning: 'Giải pháp', aslSpelling: ['S','O','L','U','T','I','O','N'] },
    { word: 'CHANGE', meaning: 'Thay đổi', aslSpelling: ['C','H','A','N','G','E'] },
    { word: 'IMPROVE', meaning: 'Cải thiện', aslSpelling: ['I','M','P','R','O','V','E'] },
    { word: 'BUILD', meaning: 'Xây dựng', aslSpelling: ['B','U','I','L','D'] },
    { word: 'FIX', meaning: 'Sửa chữa', aslSpelling: ['F','I','X'] },
    { word: 'CREATE', meaning: 'Tạo', aslSpelling: ['C','R','E','A','T','E'] },
    { word: 'DELETE', meaning: 'Xóa', aslSpelling: ['D','E','L','E','T','E'] },
    { word: 'SAVE', meaning: 'Lưu', aslSpelling: ['S','A','V','E'] },
    { word: 'CONFIRM', meaning: 'Xác nhận', aslSpelling: ['C','O','N','F','I','R','M'] },
    { word: 'ACCEPT', meaning: 'Chấp nhận', aslSpelling: ['A','C','C','E','P','T'] },
    { word: 'AGREE', meaning: 'Đồng ý', aslSpelling: ['A','G','R','E','E'] },
    { word: 'SUPPORT', meaning: 'Ủng hộ', aslSpelling: ['S','U','P','P','O','R','T'] },
    { word: 'PROTECT', meaning: 'Bảo vệ', aslSpelling: ['P','R','O','T','E','C','T'] },
    { word: 'EXPLAIN', meaning: 'Giải thích', aslSpelling: ['E','X','P','L','A','I','N'] },
    { word: 'UNDERSTAND', meaning: 'Hiểu', aslSpelling: ['U','N','D','E','R','S','T','A','N','D'] },
    { word: 'DESCRIBE', meaning: 'Mô tả', aslSpelling: ['D','E','S','C','R','I','B','E'] },
    { word: 'COUNT', meaning: 'Đếm', aslSpelling: ['C','O','U','N','T'] },
    { word: 'ADD', meaning: 'Cộng', aslSpelling: ['A','D','D'] },
    { word: 'SUBTRACT', meaning: 'Trừ', aslSpelling: ['S','U','B','T','R','A','C','T'] },
    { word: 'ALWAYS', meaning: 'Luôn luôn', aslSpelling: ['A','L','W','A','Y','S'] },
    { word: 'NEVER', meaning: 'Không bao giờ', aslSpelling: ['N','E','V','E','R'] },
    { word: 'OFTEN', meaning: 'Thường', aslSpelling: ['O','F','T','E','N'] },
    { word: 'SOMETIMES', meaning: 'Đôi khi', aslSpelling: ['S','O','M','E','T','I','M','E','S'] },
    { word: 'NOW', meaning: 'Bây giờ', aslSpelling: ['N','O','W'] },
    { word: 'THEN', meaning: 'Sau đó', aslSpelling: ['T','H','E','N'] },
    { word: 'CAN', meaning: 'Có thể / Biết', aslSpelling: ['C','A','N'] },
    { word: 'MUST', meaning: 'Phải', aslSpelling: ['M','U','S','T'] },
    { word: 'SHOULD', meaning: 'Nên', aslSpelling: ['S','H','O','U','L','D'] },
    { word: 'NEED', meaning: 'Cần', aslSpelling: ['N','E','E','D'] },
    { word: 'HOPE', meaning: 'Hy vọng', aslSpelling: ['H','O','P','E'] },
    { word: 'BELIEVE', meaning: 'Tin', aslSpelling: ['B','E','L','I','E','V','E'] },
    { word: 'WONDER', meaning: 'Thắc mắc', aslSpelling: ['W','O','N','D','E','R'] },
    { word: 'REGRET', meaning: 'Hối hận', aslSpelling: ['R','E','G','R','E','T'] },
    { word: 'CONFIDENT', meaning: 'Tự tin', aslSpelling: ['C','O','N','F','I','D','E','N','T'] },
    { word: 'PATIENT', meaning: 'Kiên nhẫn', aslSpelling: ['P','A','T','I','E','N','T'] },
    { word: 'ORGANIZED', meaning: 'Có tổ chức', aslSpelling: ['O','R','G','A','N','I','Z','E','D'] },
    { word: 'NEAT', meaning: 'Ngăn nắp', aslSpelling: ['N','E','A','T'] },
    { word: 'RESPONSIBLE', meaning: 'Có trách nhiệm', aslSpelling: ['R','E','S','P','O','N','S','I','B','L','E'] },
    { word: 'STABLE', meaning: 'Ổn định', aslSpelling: ['S','T','A','B','L','E'] },
    { word: 'DEEP', meaning: 'Sâu', aslSpelling: ['D','E','E','P'] },
    { word: 'SHALLOW', meaning: 'Nông', aslSpelling: ['S','H','A','L','L','O','W'] },
    { word: 'HIGH', meaning: 'Cao', aslSpelling: ['H','I','G','H'] },
    { word: 'LOW', meaning: 'Thấp', aslSpelling: ['L','O','W'] },
    { word: 'WIDE', meaning: 'Rộng', aslSpelling: ['W','I','D','E'] },
    { word: 'NARROW', meaning: 'Hẹp', aslSpelling: ['N','A','R','R','O','W'] },
  ],

  // ==== BỔ SUNG THÊM TOPICS ====
  Directions: [
    { word: 'LEFT', meaning: 'Trái', aslSpelling: ['L','E','F','T'] },
    { word: 'RIGHT', meaning: 'Phải', aslSpelling: ['R','I','G','H','T'] },
    { word: 'STRAIGHT', meaning: 'Thẳng', aslSpelling: ['S','T','R','A','I','G','H','T'] },
    { word: 'UP', meaning: 'Lên', aslSpelling: ['U','P'] },
    { word: 'DOWN', meaning: 'Xuống', aslSpelling: ['D','O','W','N'] },
    { word: 'NORTH', meaning: 'Hướng Bắc', aslSpelling: ['N','O','R','T','H'] },
    { word: 'SOUTH', meaning: 'Hướng Nam', aslSpelling: ['S','O','U','T','H'] },
    { word: 'EAST', meaning: 'Hướng Đông', aslSpelling: ['E','A','S','T'] },
    { word: 'WEST', meaning: 'Hướng Tây', aslSpelling: ['W','E','S','T'] },
    { word: 'NEAR', meaning: 'Gần', aslSpelling: ['N','E','A','R'] },
    { word: 'FAR', meaning: 'Xa', aslSpelling: ['F','A','R'] },
    { word: 'FRONT', meaning: 'Trước', aslSpelling: ['F','R','O','N','T'] },
    { word: 'BACK', meaning: 'Sau', aslSpelling: ['B','A','C','K'] },
    { word: 'INSIDE', meaning: 'Trong', aslSpelling: ['I','N','S','I','D','E'] },
    { word: 'OUTSIDE', meaning: 'Ngoài', aslSpelling: ['O','U','T','S','I','D','E'] },
  ],

  // ==== BỔ SUNG TOPICS TỪ TRANG THAM KHẢO ====
  Communication: [
    { word: 'HELLO', meaning: 'Xin chào', aslSpelling: ['H','E','L','L','O'] },
    { word: 'BYE', meaning: 'Tạm biệt', aslSpelling: ['B','Y','E'] },
    { word: 'YES', meaning: 'Vâng/Có', aslSpelling: ['Y','E','S'] },
    { word: 'NO', meaning: 'Không', aslSpelling: ['N','O'] },
    { word: 'PLEASE', meaning: 'Làm ơn', aslSpelling: ['P','L','E','A','S','E'] },
    { word: 'THANK YOU', meaning: 'Cảm ơn', aslSpelling: ['T','H','A','N','K',' ','Y','O','U'] },
    { word: 'SORRY', meaning: 'Xin lỗi', aslSpelling: ['S','O','R','R','Y'] },
    { word: 'OKAY', meaning: 'Được', aslSpelling: ['O','K','A','Y'] },
    { word: 'I UNDERSTAND', meaning: 'Tôi hiểu', aslSpelling: ['I',' ','U','N','D','E','R','S','T','A','N','D'] },
    { word: 'I DONT UNDERSTAND', meaning: 'Tôi không hiểu', aslSpelling: ['I',' ','D','O','N','T',' ','U','N','D','E','R','S','T','A','N','D'] },
    { word: 'REPEAT', meaning: 'Lặp lại', aslSpelling: ['R','E','P','E','A','T'] },
    { word: 'SPEAK SLOWER', meaning: 'Nói chậm hơn', aslSpelling: ['S','P','E','A','K',' ','S','L','O','W','E','R'] },
    { word: 'WRITE DOWN', meaning: 'Viết xuống', aslSpelling: ['W','R','I','T','E',' ','D','O','W','N'] },
    { word: 'HELP ME', meaning: 'Giúp tôi', aslSpelling: ['H','E','L','P',' ','M','E'] },
    { word: 'TALK', meaning: 'Nói chuyện', aslSpelling: ['T','A','L','K'] },
    { word: 'ASK', meaning: 'Hỏi', aslSpelling: ['A','S','K'] },
    { word: 'ANSWER', meaning: 'Trả lời', aslSpelling: ['A','N','S','W','E','R'] },
    { word: 'TELL', meaning: 'Kể', aslSpelling: ['T','E','L','L'] },
    { word: 'CALL', meaning: 'Gọi', aslSpelling: ['C','A','L','L'] },
    { word: 'LISTEN', meaning: 'Nghe', aslSpelling: ['L','I','S','T','E','N'] },
  ],

  Money: [
    { word: 'MONEY', meaning: 'Tiền', aslSpelling: ['M','O','N','E','Y'] },
    { word: 'CHEAP', meaning: 'Rẻ', aslSpelling: ['C','H','E','A','P'] },
    { word: 'EXPENSIVE', meaning: 'Đắt', aslSpelling: ['E','X','P','E','N','S','I','V','E'] },
    { word: 'FREE', meaning: 'Miễn phí', aslSpelling: ['F','R','E','E'] },
    { word: 'PAY', meaning: 'Trả tiền', aslSpelling: ['P','A','Y'] },
    { word: 'BUY', meaning: 'Mua', aslSpelling: ['B','U','Y'] },
    { word: 'SELL', meaning: 'Bán', aslSpelling: ['S','E','L','L'] },
    { word: 'COST', meaning: 'Giá', aslSpelling: ['C','O','S','T'] },
    { word: 'PRICE', meaning: 'Giá cả', aslSpelling: ['P','R','I','C','E'] },
    { word: 'DISCOUNT', meaning: 'Giảm giá', aslSpelling: ['D','I','S','C','O','U','N','T'] },
    { word: 'CASH', meaning: 'Tiền mặt', aslSpelling: ['C','A','S','H'] },
    { word: 'CARD', meaning: 'Thẻ', aslSpelling: ['C','A','R','D'] },
    { word: 'BANK', meaning: 'Ngân hàng', aslSpelling: ['B','A','N','K'] },
    { word: 'RICH', meaning: 'Giàu', aslSpelling: ['R','I','C','H'] },
    { word: 'POOR', meaning: 'Nghèo', aslSpelling: ['P','O','O','R'] },
    { word: 'SAVE', meaning: 'Tiết kiệm', aslSpelling: ['S','A','V','E'] },
    { word: 'SPEND', meaning: 'Chi tiêu', aslSpelling: ['S','P','E','N','D'] },
    { word: 'BORROW', meaning: 'Mượn', aslSpelling: ['B','O','R','R','O','W'] },
    { word: 'LEND', meaning: 'Cho mượn', aslSpelling: ['L','E','N','D'] },
    { word: 'DEBT', meaning: 'Nợ', aslSpelling: ['D','E','B','T'] },
  ],

  Movie: [
    { word: 'MOVIE', meaning: 'Phim', aslSpelling: ['M','O','V','I','E'] },
    { word: 'FILM', meaning: 'Phim ảnh', aslSpelling: ['F','I','L','M'] },
    { word: 'CINEMA', meaning: 'Rạp chiếu phim', aslSpelling: ['C','I','N','E','M','A'] },
    { word: 'ACTOR', meaning: 'Diễn viên nam', aslSpelling: ['A','C','T','O','R'] },
    { word: 'ACTRESS', meaning: 'Diễn viên nữ', aslSpelling: ['A','C','T','R','E','S','S'] },
    { word: 'SCARY', meaning: 'Kinh dị', aslSpelling: ['S','C','A','R','Y'] },
    { word: 'COMEDY', meaning: 'Hài kịch', aslSpelling: ['C','O','M','E','D','Y'] },
    { word: 'ACTION', meaning: 'Hành động', aslSpelling: ['A','C','T','I','O','N'] },
    { word: 'DRAMA', meaning: 'Chính kịch', aslSpelling: ['D','R','A','M','A'] },
    { word: 'ROMANCE', meaning: 'Lãng mạn', aslSpelling: ['R','O','M','A','N','C','E'] },
    { word: 'HORROR', meaning: 'Kinh hoàng', aslSpelling: ['H','O','R','R','O','R'] },
    { word: 'ANIMATION', meaning: 'Hoạt hình', aslSpelling: ['A','N','I','M','A','T','I','O','N'] },
    { word: 'THRILLER', meaning: 'Gay cấn', aslSpelling: ['T','H','R','I','L','L','E','R'] },
    { word: 'SCIENCE FICTION', meaning: 'Khoa học viễn tưởng', aslSpelling: ['S','C','I','E','N','C','E',' ','F','I','C','T','I','O','N'] },
    { word: 'WATCH', meaning: 'Xem', aslSpelling: ['W','A','T','C','H'] },
    { word: 'DIRECTOR', meaning: 'Đạo diễn', aslSpelling: ['D','I','R','E','C','T','O','R'] },
    { word: 'THEATER', meaning: 'Nhà hát', aslSpelling: ['T','H','E','A','T','E','R'] },
    { word: 'SCREEN', meaning: 'Màn hình', aslSpelling: ['S','C','R','E','E','N'] },
    { word: 'CREDIT', meaning: 'Nhập cuộn', aslSpelling: ['C','R','E','D','I','T'] },
  ],

  Hobby: [
    { word: 'HOBBY', meaning: 'Sở thích', aslSpelling: ['H','O','B','B','Y'] },
    { word: 'READ', meaning: 'Đọc', aslSpelling: ['R','E','A','D'] },
    { word: 'WRITE', meaning: 'Viết', aslSpelling: ['W','R','I','T','E'] },
    { word: 'DRAW', meaning: 'Vẽ', aslSpelling: ['D','R','A','W'] },
    { word: 'PAINT', meaning: 'Sơn', aslSpelling: ['P','A','I','N','T'] },
    { word: 'SING', meaning: 'Hát', aslSpelling: ['S','I','N','G'] },
    { word: 'DANCE', meaning: 'Nhảy', aslSpelling: ['D','A','N','C','E'] },
    { word: 'PLAY', meaning: 'Chơi', aslSpelling: ['P','L','A','Y'] },
    { word: 'GAME', meaning: 'Trò chơi', aslSpelling: ['G','A','M','E'] },
    { word: 'COLLECT', meaning: 'Sưu tầm', aslSpelling: ['C','O','L','L','E','C','T'] },
    { word: 'PHOTOGRAPH', meaning: 'Chụp ảnh', aslSpelling: ['P','H','O','T','O','G','R','A','P','H'] },
    { word: 'COOK', meaning: 'Nấu ăn', aslSpelling: ['C','O','O','K'] },
    { word: 'GARDEN', meaning: 'Làm vườn', aslSpelling: ['G','A','R','D','E','N'] },
    { word: 'FISHING', meaning: 'Câu cá', aslSpelling: ['F','I','S','H','I','N','G'] },
    { word: 'HIKING', meaning: 'Leo núi', aslSpelling: ['H','I','K','I','N','G'] },
    { word: 'TRAVEL', meaning: 'Du lịch', aslSpelling: ['T','R','A','V','E','L'] },
    { word: 'CAMPING', meaning: 'Cắm trại', aslSpelling: ['C','A','M','P','I','N','G'] },
    { word: 'KNIT', meaning: 'Đan', aslSpelling: ['K','N','I','T'] },
    { word: 'SEW', meaning: 'May', aslSpelling: ['S','E','W'] },
    { word: 'CRAFT', meaning: 'Thủ công', aslSpelling: ['C','R','A','F','T'] },
  ],

  Feelings: [
    { word: 'LOVE', meaning: 'Yêu', aslSpelling: ['L','O','V','E'] },
    { word: 'HATE', meaning: 'Ghét', aslSpelling: ['H','A','T','E'] },
    { word: 'LIKE', meaning: 'Thích', aslSpelling: ['L','I','K','E'] },
    { word: 'DISLIKE', meaning: 'Không thích', aslSpelling: ['D','I','S','L','I','K','E'] },
    { word: 'HAPPY', meaning: 'Vui', aslSpelling: ['H','A','P','P','Y'] },
    { word: 'SAD', meaning: 'Buồn', aslSpelling: ['S','A','D'] },
    { word: 'ANGRY', meaning: 'Tức giận', aslSpelling: ['A','N','G','R','Y'] },
    { word: 'SCARED', meaning: 'Sợ', aslSpelling: ['S','C','A','R','E','D'] },
    { word: 'EXCITED', meaning: 'Hào hứng', aslSpelling: ['E','X','C','I','T','E','D'] },
    { word: 'BORED', meaning: 'Chán', aslSpelling: ['B','O','R','E','D'] },
    { word: 'TIRED', meaning: 'Mệt', aslSpelling: ['T','I','R','E','D'] },
    { word: 'HUNGRY', meaning: 'Đói', aslSpelling: ['H','U','N','G','R','Y'] },
    { word: 'THIRSTY', meaning: 'Khát', aslSpelling: ['T','H','I','R','S','T','Y'] },
    { word: 'CONFUSED', meaning: 'Bối rối', aslSpelling: ['C','O','N','F','U','S','E','D'] },
    { word: 'PROUD', meaning: 'Tự hào', aslSpelling: ['P','R','O','U','D'] },
    { word: 'JEALOUS', meaning: 'Ghen tỵ', aslSpelling: ['J','E','A','L','O','U','S'] },
    { word: 'NERVOUS', meaning: 'Lo lắng', aslSpelling: ['N','E','R','V','O','U','S'] },
    { word: 'RELAXED', meaning: 'Thư giãn', aslSpelling: ['R','E','L','A','X','E','D'] },
    { word: 'GRATEFUL', meaning: 'Biết ơn', aslSpelling: ['G','R','A','T','E','F','U','L'] },
    { word: 'LONELY', meaning: 'Cô đơn', aslSpelling: ['L','O','N','E','L','Y'] },
  ],

  Holiday: [
    { word: 'HOLIDAY', meaning: 'Ngày lễ', aslSpelling: ['H','O','L','I','D','A','Y'] },
    { word: 'BIRTHDAY', meaning: 'Sinh nhật', aslSpelling: ['B','I','R','T','H','D','A','Y'] },
    { word: 'CHRISTMAS', meaning: 'Giáng sinh', aslSpelling: ['C','H','R','I','S','T','M','A','S'] },
    { word: 'NEW YEAR', meaning: 'Năm mới', aslSpelling: ['N','E','W',' ','Y','E','A','R'] },
    { word: 'VALENTINE', meaning: 'Valentine', aslSpelling: ['V','A','L','E','N','T','I','N','E'] },
    { word: 'EASTER', meaning: 'Phục sinh', aslSpelling: ['E','A','S','T','E','R'] },
    { word: 'THANKSGIVING', meaning: 'Lễ Tạ ơn', aslSpelling: ['T','H','A','N','K','S','G','I','V','I','N','G'] },
    { word: 'HALLOWEEN', meaning: 'Halloween', aslSpelling: ['H','A','L','L','O','W','E','E','N'] },
    { word: 'PARTY', meaning: 'Tiệc', aslSpelling: ['P','A','R','T','Y'] },
    { word: 'CELEBRATE', meaning: 'Kỷ niệm', aslSpelling: ['C','E','L','E','B','R','A','T','E'] },
    { word: 'GIFT', meaning: 'Quà tặng', aslSpelling: ['G','I','F','T'] },
    { word: 'CAKE', meaning: 'Bánh', aslSpelling: ['C','A','K','E'] },
    { word: 'BALLOON', meaning: 'Bóng bay', aslSpelling: ['B','A','L','L','O','O','N'] },
    { word: 'DECORATION', meaning: 'Trang trí', aslSpelling: ['D','E','C','O','R','A','T','I','O','N'] },
    { word: 'FIREWORK', meaning: 'Pháo hoa', aslSpelling: ['F','I','R','E','W','O','R','K'] },
    { word: 'VACATION', meaning: 'Nghỉ lễ', aslSpelling: ['V','A','C','A','T','I','O','N'] },
    { word: 'FESTIVAL', meaning: 'Lễ hội', aslSpelling: ['F','E','S','T','I','V','A','L'] },
    { word: 'PICNIC', meaning: 'Dã ngoại', aslSpelling: ['P','I','C','N','I','C'] },
    { word: 'BBQ', meaning: 'Nướng', aslSpelling: ['B','B','Q'] },
    { word: 'FAMILY GATHERING', meaning: 'Họp mặt gia đình', aslSpelling: ['F','A','M','I','L','Y',' ','G','A','T','H','E','R','I','N','G'] },
  ],

  Internet: [
    { word: 'INTERNET', meaning: 'Internet', aslSpelling: ['I','N','T','E','R','N','E','T'] },
    { word: 'WEBSITE', meaning: 'Trang web', aslSpelling: ['W','E','B','S','I','T','E'] },
    { word: 'EMAIL', meaning: 'Email', aslSpelling: ['E','M','A','I','L'] },
    { word: 'PASSWORD', meaning: 'Mật khẩu', aslSpelling: ['P','A','S','S','W','O','R','D'] },
    { word: 'USERNAME', meaning: 'Tên đăng nhập', aslSpelling: ['U','S','E','R','N','A','M','E'] },
    { word: 'LOGIN', meaning: 'Đăng nhập', aslSpelling: ['L','O','G','I','N'] },
    { word: 'LOGOUT', meaning: 'Đăng xuất', aslSpelling: ['L','O','G','O','U','T'] },
    { word: 'SIGN UP', meaning: 'Đăng ký', aslSpelling: ['S','I','G','N',' ','U','P'] },
    { word: 'SEARCH', meaning: 'Tìm kiếm', aslSpelling: ['S','E','A','R','C','H'] },
    { word: 'CLICK', meaning: 'Nhấp chuột', aslSpelling: ['C','L','I','C','K'] },
    { word: 'DOWNLOAD', meaning: 'Tải xuống', aslSpelling: ['D','O','W','N','L','O','A','D'] },
    { word: 'UPLOAD', meaning: 'Tải lên', aslSpelling: ['U','P','L','O','A','D'] },
    { word: 'SHARE', meaning: 'Chia sẻ', aslSpelling: ['S','H','A','R','E'] },
    { word: 'LIKE', meaning: 'Thích', aslSpelling: ['L','I','K','E'] },
    { word: 'COMMENT', meaning: 'Bình luận', aslSpelling: ['C','O','M','M','E','N','T'] },
    { word: 'POST', meaning: 'Đăng bài', aslSpelling: ['P','O','S','T'] },
    { word: 'CHAT', meaning: 'Trò chuyện', aslSpelling: ['C','H','A','T'] },
    { word: 'VIDEO CALL', meaning: 'Gọi video', aslSpelling: ['V','I','D','E','O',' ','C','A','L','L'] },
    { word: 'STREAM', meaning: 'Phát trực tiếp', aslSpelling: ['S','T','R','E','A','M'] },
    { word: 'BROADCAST', meaning: 'Phát sóng', aslSpelling: ['B','R','O','A','D','C','A','S','T'] },
  ],

  Transportation: [
    { word: 'CAR', meaning: 'Ô tô', aslSpelling: ['C','A','R'] },
    { word: 'BUS', meaning: 'Xe buýt', aslSpelling: ['B','U','S'] },
    { word: 'TRAIN', meaning: 'Tàu hỏa', aslSpelling: ['T','R','A','I','N'] },
    { word: 'PLANE', meaning: 'Máy bay', aslSpelling: ['P','L','A','N','E'] },
    { word: 'BICYCLE', meaning: 'Xe đạp', aslSpelling: ['B','I','C','Y','C','L','E'] },
    { word: 'MOTORCYCLE', meaning: 'Xe máy', aslSpelling: ['M','O','T','O','R','C','Y','C','L','E'] },
    { word: 'TAXI', meaning: 'Taxi', aslSpelling: ['T','A','X','I'] },
    { word: 'SUBWAY', meaning: 'Tàu điện ngầm', aslSpelling: ['S','U','B','W','A','Y'] },
    { word: 'BOAT', meaning: 'Thuyền', aslSpelling: ['B','O','A','T'] },
    { word: 'SHIP', meaning: 'Tàu thuyền', aslSpelling: ['S','H','I','P'] },
    { word: 'HELICOPTER', meaning: 'Trực thăng', aslSpelling: ['H','E','L','I','C','O','P','T','E','R'] },
    { word: 'DRIVE', meaning: 'Lái xe', aslSpelling: ['D','R','I','V','E'] },
    { word: 'RIDE', meaning: 'Đi xe', aslSpelling: ['R','I','D','E'] },
    { word: 'WALK', meaning: 'Đi bộ', aslSpelling: ['W','A','L','K'] },
    { word: 'STOP', meaning: 'Dừng', aslSpelling: ['S','T','O','P'] },
    { word: 'WAIT', meaning: 'Chờ', aslSpelling: ['W','A','I','T'] },
    { word: 'CROSS', meaning: 'Qua đường', aslSpelling: ['C','R','O','S','S'] },
    { word: 'TURN', meaning: 'Rẽ', aslSpelling: ['T','U','R','N'] },
    { word: 'SPEED', meaning: 'Tốc độ', aslSpelling: ['S','P','E','E','D'] },
    { word: 'TICKET', meaning: 'Vé', aslSpelling: ['T','I','C','K','E','T'] },
  ],

  // Feelings2 - Tình cảm & Tình yêu
  Feelings2: [
    { word: 'LOVE', meaning: 'Yêu / Tình yêu', aslSpelling: ['L','O','V','E'] },
    { word: 'HEART', meaning: 'Trái tim', aslSpelling: ['H','E','A','R','T'] },
    { word: 'SOUL', meaning: 'Tâm hồn', aslSpelling: ['S','O','U','L'] },
    { word: 'ROMANCE', meaning: 'Lãng mạn', aslSpelling: ['R','O','M','A','N','C','E'] },
    { word: 'KISS', meaning: 'Hôn', aslSpelling: ['K','I','S','S'] },
    { word: 'HUG', meaning: 'Ôm', aslSpelling: ['H','U','G'] },
    { word: 'MARRIAGE', meaning: 'Hôn nhân', aslSpelling: ['M','A','R','R','I','A','G','E'] },
    { word: 'WEDDING', meaning: 'Đám cưới', aslSpelling: ['W','E','D','D','I','N','G'] },
    { word: 'PARTNER', meaning: 'Bạn đời', aslSpelling: ['P','A','R','T','N','E','R'] },
    { word: 'BOYFRIEND', meaning: 'Bạn trai', aslSpelling: ['B','O','Y','F','R','I','E','N','D'] },
    { word: 'GIRLFRIEND', meaning: 'Bạn gái', aslSpelling: ['G','I','R','L','F','R','I','E','N','D'] },
    { word: 'HUSBAND', meaning: 'Chồng', aslSpelling: ['H','U','S','B','A','N','D'] },
    { word: 'WIFE', meaning: 'Vợ', aslSpelling: ['W','I','F','E'] },
    { word: 'FIDELITY', meaning: 'Chung thủy', aslSpelling: ['F','I','D','E','L','I','T','Y'] },
    { word: 'LOYALTY', meaning: 'Trung thành', aslSpelling: ['L','O','Y','A','L','T','Y'] },
    { word: 'PASSION', meaning: 'Đam mê', aslSpelling: ['P','A','S','S','I','O','N'] },
    { word: 'DEVOTION', meaning: 'Tận tâm', aslSpelling: ['D','E','V','O','T','I','O','N'] },
    { word: 'CHERISH', meaning: 'Trân trọng', aslSpelling: ['C','H','E','R','I','S','H'] },
    { word: 'ADMIRATION', meaning: 'Ngưỡng mộ', aslSpelling: ['A','D','M','I','R','A','T','I','O','N'] },
    { word: 'FOREVER', meaning: 'Mãi mãi', aslSpelling: ['F','O','R','E','V','E','R'] },
  ],
};

// Import SENTENCES_BY_TOPIC từ file riêng với 30-40 câu mỗi topic
import { SENTENCES_BY_TOPIC } from './sentencesByTopic';
export { SENTENCES_BY_TOPIC };

// Mapping từ key của QUIZ_TOPICS → key thực tế trong SENTENCES_BY_TOPIC / VOCABULARY_BY_TOPIC
// Tất cả key đã được đồng bộ số ít, map này giữ lại phòng trường hợp cần
const TOPIC_KEY_MAP = {};

// Resolve topic key cho từng data source
const resolveTopicKey = (topic, dataSource) => {
  // Thử key gốc trước
  if (dataSource[topic] && dataSource[topic].length > 0) return topic;
  // Thử key đã map
  const mapped = TOPIC_KEY_MAP[topic];
  if (mapped && dataSource[mapped] && dataSource[mapped].length > 0) return mapped;
  // Thử thêm/bỏ 's' ở cuối
  const withS = topic + 's';
  if (dataSource[withS] && dataSource[withS].length > 0) return withS;
  const withoutS = topic.endsWith('s') ? topic.slice(0, -1) : null;
  if (withoutS && dataSource[withoutS] && dataSource[withoutS].length > 0) return withoutS;
  return topic; // fallback về key gốc (sẽ trả về undefined → dùng random)
};

// Letter quiz generator
export const generateLetterQuiz = (count = 10, forAssignment = false) => {
  const letters = ASL_LETTERS;
  const shuffled = [...letters].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, letters.length));

  return selected.map((letter, index) => {
    // Always generate 4 options (1 correct + 3 wrong) for proper multiple choice
    const otherLetters = letters.filter(l => l !== letter).sort(() => Math.random() - 0.5);
    const wrongOptions = otherLetters.slice(0, 3);
    const options = [...wrongOptions, letter].sort(() => Math.random() - 0.5);

    return {
      id: index,
      type: 'letter',
      letter: letter,
      aslImage: getASLLetterImage(letter),
      correctAnswer: letter,
      options: options,
      questionKey: 'quiz.questionLetter'
    };
  });
};

// Vocabulary quiz generator
export const generateVocabularyQuiz = (count = 10) => {
  const vocabData = VOCABULARY_QUIZ_DATA || [];
  const shuffled = [...vocabData].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((vocab, index) => {
    // Pick 3 random wrong meanings from the full pool
    const wrongOptions = vocabData
      .filter(v => v.word !== vocab.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.word);
    const options = [...wrongOptions, vocab.word].sort(() => Math.random() - 0.5);

    return {
      id: index,
      type: 'vocabulary',
      word: vocab.word,
      aslSpelling: vocab.aslSpelling,
      correctAnswer: vocab.word,
      options: options,
      questionKey: 'quiz.questionVocab'
    };
  });
};

// Sentence quiz generator
export const generateSentenceQuiz = (count = 10, forAssignment = false) => {
  const allSentences = Object.values(SENTENCES_BY_TOPIC).flat();
  const shuffled = [...allSentences].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return selected.map((sentence, index) => {
    // Always generate 4 options (1 correct + 3 wrong) for proper multiple choice
    // Use meaning (Vietnamese) as the answer options
    const otherSentences = allSentences.filter(s => s.sentence !== sentence.sentence).sort(() => Math.random() - 0.5);
    const wrongOptions = otherSentences.slice(0, 3).map(s => s.sentence);
    const options = [...wrongOptions, sentence.sentence].sort(() => Math.random() - 0.5);

    return {
      id: index,
      type: 'sentence',
      sentence: sentence.sentence,
      aslSpelling: sentence.aslSpelling,
      correctAnswer: sentence.sentence,
      options: options,
      questionKey: 'quiz.questionSentence'
    };
  });
};

// Topic vocabulary quiz generator
export const generateTopicVocabularyQuiz = (topic, count = 10) => {
  const resolvedKey = resolveTopicKey(topic, VOCABULARY_BY_TOPIC);
  const vocabList = VOCABULARY_BY_TOPIC[resolvedKey] || [];
  if (vocabList.length === 0) return generateVocabularyQuiz(count);

  const shuffled = [...vocabList].sort(() => Math.random() - 0.5);
  const questions = [];

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const vocab = shuffled[i];
    const wrongWords = vocabList
      .filter(v => v.word !== vocab.word)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(v => v.word);

    const options = [...wrongWords, vocab.word].sort(() => Math.random() - 0.5);

    questions.push({
      id: i,
      type: 'vocabulary',
      topic: topic,
      word: vocab.word,
      aslSpelling: vocab.aslSpelling,
      correctAnswer: vocab.word,
      options: options,
      questionKey: 'quiz.questionVocab'
    });
  }

  return questions;
};

// Topic sentence quiz generator
export const generateTopicSentenceQuiz = (topic, count = 10) => {
  const resolvedKey = resolveTopicKey(topic, SENTENCES_BY_TOPIC);
  const sentenceList = SENTENCES_BY_TOPIC[resolvedKey] || [];
  if (sentenceList.length === 0) return generateSentenceQuiz(count);

  const shuffled = [...sentenceList].sort(() => Math.random() - 0.5);
  const questions = [];

  for (let i = 0; i < Math.min(count, shuffled.length); i++) {
    const sentence = shuffled[i];
    const wrongSentences = sentenceList
      .filter(s => s.sentence !== sentence.sentence)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(s => s.sentence);

    const options = [...wrongSentences, sentence.sentence].sort(() => Math.random() - 0.5);

    questions.push({
      id: i,
      type: 'sentence',
      topic: topic,
      sentence: sentence.sentence,
      aslSpelling: sentence.aslSpelling,
      correctAnswer: sentence.sentence,
      options: options,
      questionKey: 'quiz.questionSentence'
    });
  }

  return questions;
};

export const ASL_LETTERS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
  'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
];

// Get ASL image path for a single letter
export const getASLLetterImage = (letter) => {
  return `/ASL_SIGN/${letter.toUpperCase()}.jpg`;
};

// Sentence quiz data for mixed quiz
export const SENTENCE_QUIZ_DATA = Object.values(SENTENCES_BY_TOPIC).flat().map(s => ({
  sentence: s.sentence,
  meaning: s.meaning,
  aslSpelling: s.aslSpelling
}));

// Vocabulary quiz data - flat list for mixed quiz
export const VOCABULARY_QUIZ_DATA = Object.values(VOCABULARY_BY_TOPIC).flat();
