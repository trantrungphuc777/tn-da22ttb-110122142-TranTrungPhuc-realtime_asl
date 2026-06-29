/**
 * SEED ASL CONTENT DATA - ĐẦY ĐỦ
 * Toàn bộ dữ liệu từ aslQuizData.js + sentencesByTopic.js
 *   1. 26 chữ cái A-Z (cố định)
 *   2. Từ vựng theo từng topic (35+ topics)
 *   3. Câu giao tiếp theo từng topic (30-40 câu/topic)
 *
 * Chạy: node seed-asl-content.cjs
 */

const mongoose = require('mongoose');

const MONGO_URI = 'mongodb://admin:Demo%40123@ac-ab0jgsf-shard-00-00.yyx5afj.mongodb.net:27017,ac-ab0jgsf-shard-00-01.yyx5afj.mongodb.net:27017,ac-ab0jgsf-shard-00-02.yyx5afj.mongodb.net/signlanguage_db?authSource=admin&ssl=true';

// ─── Schema ───────────────────────────────────────────────────────────────
const ASLContentSchema = new mongoose.Schema({
    type:      { type: String, enum: ['letter','word','sentence'], required: true },
    label:     { type: String, required: true, trim: true },
    meaning:   { type: String, default: '' },
    topic:     { type: String, default: '' },
    imageUrl:  { type: String, default: '' },
    isActive:  { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
}, { timestamps: true });

const ASLContent = mongoose.model('ASLContent', ASLContentSchema);

const QuestionSchema = new mongoose.Schema({
    questionCode:  { type: String, unique: true, sparse: true },
    title:         { type: String, required: true, trim: true },
    content:       { type: String, required: true, trim: true },
    correctAnswer: { type: String, required: true },
    wrongAnswers:  [{ type: String }],
    topic:         { type: String, default: '' },
    difficulty:    { type: String, enum: ['easy','medium','hard'], default: 'medium' },
    type:          { type: String, enum: ['multiple_choice','recognition','spelling'], default: 'multiple_choice' },
    createdBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    isDeleted:     { type: Boolean, default: false },
    usageCount:    { type: Number, default: 0 }
}, { timestamps: true });

const Question = mongoose.model('Question', QuestionSchema);

// ══════════════════════════════════════════════════════════════
// 1. 26 CHỮ CÁI A-Z (cố định)
// ══════════════════════════════════════════════════════════════
const LETTERS = [
    { label:'A', meaning:'Nắm tay, ngón cái đặt bên cạnh' },
    { label:'B', meaning:'Bốn ngón thẳng, ngón cái gập vào lòng bàn tay' },
    { label:'C', meaning:'Bàn tay cong hình chữ C' },
    { label:'D', meaning:'Ngón trỏ thẳng, các ngón tạo vòng tròn với ngón cái' },
    { label:'E', meaning:'Tất cả ngón gập xuống, ngón cái thu vào bên dưới' },
    { label:'F', meaning:'Ngón cái và ngón trỏ tạo vòng tròn, ba ngón còn lại thẳng' },
    { label:'G', meaning:'Ngón trỏ và ngón cái song song chỉ sang ngang' },
    { label:'H', meaning:'Ngón trỏ và ngón giữa thẳng song song, nằm ngang' },
    { label:'I', meaning:'Chỉ ngón út thẳng đứng' },
    { label:'J', meaning:'Ngón út vẽ chữ J trong không khí' },
    { label:'K', meaning:'Ngón trỏ và ngón giữa chữ V, ngón cái giữa hai ngón, hướng lên' },
    { label:'L', meaning:'Ngón cái và ngón trỏ tạo hình chữ L' },
    { label:'M', meaning:'Ba ngón (trỏ, giữa, áp út) đặt chồng lên ngón cái' },
    { label:'N', meaning:'Hai ngón (trỏ, giữa) đặt chồng lên ngón cái' },
    { label:'O', meaning:'Tất cả ngón tạo hình chữ O' },
    { label:'P', meaning:'Tương tự K nhưng hướng xuống dưới' },
    { label:'Q', meaning:'Tương tự G nhưng hướng xuống dưới' },
    { label:'R', meaning:'Ngón trỏ và ngón giữa bắt chéo nhau' },
    { label:'S', meaning:'Nắm tay, ngón cái đặt lên trên các ngón' },
    { label:'T', meaning:'Ngón cái kẹp giữa ngón trỏ và ngón giữa' },
    { label:'U', meaning:'Ngón trỏ và ngón giữa thẳng đứng song song' },
    { label:'V', meaning:'Ngón trỏ và ngón giữa tạo hình chữ V' },
    { label:'W', meaning:'Ba ngón (trỏ, giữa, áp út) thẳng đứng, xòe ra' },
    { label:'X', meaning:'Ngón trỏ cong móc câu' },
    { label:'Y', meaning:'Ngón cái và ngón út thẳng, các ngón còn lại gập' },
    { label:'Z', meaning:'Ngón trỏ vẽ chữ Z trong không khí' },
];

// ══════════════════════════════════════════════════════════════
// 2. TỪ VỰNG THEO TOPIC - khớp hoàn toàn với VOCABULARY_BY_TOPIC
// ══════════════════════════════════════════════════════════════
const WORDS_BY_TOPIC = {
  Greeting: [
    {w:'HELLO',m:'Xin chào'},{w:'THANK YOU',m:'Cảm ơn'},{w:'GOODBYE',m:'Tạm biệt'},
    {w:'SORRY',m:'Xin lỗi'},{w:'YES',m:'Đồng ý / Vâng'},{w:'NO',m:'Không'},
    {w:'PLEASE',m:'Làm ơn / Xin vui lòng'},{w:'OKAY',m:'Được / OK'},{w:'MAYBE',m:'Có thể'},
  ],
  Family: [
    {w:'MOTHER',m:'Mẹ'},{w:'FATHER',m:'Cha / Bố'},{w:'SISTER',m:'Chị / Em gái'},
    {w:'BROTHER',m:'Anh / Em trai'},{w:'BABY',m:'Em bé'},{w:'GRANDMOTHER',m:'Bà'},
    {w:'GRANDFATHER',m:'Ông'},{w:'AUNT',m:'Cô / Dì'},{w:'UNCLE',m:'Chú / Bác'},
    {w:'COUSIN',m:'Anh em họ'},{w:'NEPHEW',m:'Cháu trai'},{w:'NIECE',m:'Cháu gái'},
  ],
  Food: [
    {w:'WATER',m:'Nước'},{w:'FOOD',m:'Thức ăn'},{w:'MILK',m:'Sữa'},{w:'COFFEE',m:'Cà phê'},
    {w:'TEA',m:'Trà'},{w:'JUICE',m:'Nước ép'},{w:'RICE',m:'Cơm'},{w:'BREAD',m:'Bánh mì'},
    {w:'EGG',m:'Trứng'},{w:'CHICKEN',m:'Thịt gà'},{w:'BEEF',m:'Thịt bò'},{w:'PORK',m:'Thịt heo'},
    {w:'FISH',m:'Cá'},{w:'SHRIMP',m:'Tôm'},{w:'SALT',m:'Muối'},{w:'SUGAR',m:'Đường'},
    {w:'VEGETABLE',m:'Rau'},{w:'FRUIT',m:'Trái cây'},{w:'APPLE',m:'Táo'},{w:'BANANA',m:'Chuối'},
    {w:'ORANGE',m:'Cam'},{w:'GRAPE',m:'Nho'},{w:'MANGO',m:'Xoài'},{w:'PINEAPPLE',m:'Dứa / Khóm'},
    {w:'WATERMELON',m:'Dưa hấu'},{w:'CAKE',m:'Bánh ngọt'},{w:'COOKIE',m:'Bánh quy'},
    {w:'CANDY',m:'Kẹo'},{w:'CHOCOLATE',m:'Socola'},{w:'ICE CREAM',m:'Kem'},
    {w:'SOUP',m:'Súp / Canh'},{w:'NOODLE',m:'Mì'},{w:'PHO',m:'Phở'},
  ],
  Colors: [
    {w:'RED',m:'Đỏ'},{w:'BLUE',m:'Xanh dương'},{w:'GREEN',m:'Xanh lá'},
    {w:'YELLOW',m:'Vàng'},{w:'PURPLE',m:'Tím'},{w:'PINK',m:'Hồng'},
    {w:'BLACK',m:'Đen'},{w:'WHITE',m:'Trắng'},{w:'GRAY',m:'Xám'},
    {w:'BROWN',m:'Nâu'},{w:'GOLD',m:'Vàng gold'},{w:'SILVER',m:'Bạc'},
  ],
  Animal: [
    {w:'DOG',m:'Con chó'},{w:'CAT',m:'Con mèo'},{w:'BIRD',m:'Con chim'},
    {w:'HORSE',m:'Con ngựa'},{w:'COW',m:'Con bò'},{w:'PIG',m:'Con heo'},
    {w:'GOAT',m:'Con dê'},{w:'SHEEP',m:'Con cừu'},{w:'RABBIT',m:'Con thỏ'},
    {w:'ELEPHANT',m:'Con voi'},{w:'LION',m:'Con sư tử'},{w:'TIGER',m:'Con hổ'},
    {w:'MONKEY',m:'Con khỉ'},{w:'SNAKE',m:'Con rắn'},{w:'TURTLE',m:'Con rùa'},
    {w:'FROG',m:'Con ếch'},{w:'DUCK',m:'Con vịt'},{w:'BEE',m:'Con ong'},
    {w:'BUTTERFLY',m:'Con bướm'},{w:'ANT',m:'Con kiến'},{w:'SHARK',m:'Cá mập'},
    {w:'DOLPHIN',m:'Cá heo'},{w:'WHALE',m:'Cá voi'},{w:'PENGUIN',m:'Chim cánh cụt'},
  ],
  Numbers: [
    {w:'ONE',m:'Một'},{w:'TWO',m:'Hai'},{w:'THREE',m:'Ba'},{w:'FOUR',m:'Bốn'},
    {w:'FIVE',m:'Năm'},{w:'SIX',m:'Sáu'},{w:'SEVEN',m:'Bảy'},{w:'EIGHT',m:'Tám'},
    {w:'NINE',m:'Chín'},{w:'TEN',m:'Mười'},{w:'HUNDRED',m:'Một trăm'},{w:'THOUSAND',m:'Một nghìn'},
  ],
  Time: [
    {w:'MORNING',m:'Buổi sáng'},{w:'AFTERNOON',m:'Buổi chiều'},{w:'EVENING',m:'Buổi tối'},
    {w:'NIGHT',m:'Đêm'},{w:'TODAY',m:'Hôm nay'},{w:'TOMORROW',m:'Ngày mai'},
    {w:'YESTERDAY',m:'Hôm qua'},{w:'WEEK',m:'Tuần'},{w:'MONTH',m:'Tháng'},
    {w:'YEAR',m:'Năm'},{w:'HOUR',m:'Giờ'},{w:'MINUTE',m:'Phút'},
    {w:'SECOND',m:'Giây'},{w:'CLOCK',m:'Đồng hồ'},
  ],
  Body: [
    {w:'HEAD',m:'Đầu'},{w:'FACE',m:'Mặt'},{w:'EYE',m:'Mắt'},{w:'NOSE',m:'Mũi'},
    {w:'MOUTH',m:'Miệng'},{w:'EAR',m:'Tai'},{w:'HAND',m:'Tay'},{w:'FOOT',m:'Chân (bàn chân)'},
    {w:'ARM',m:'Cánh tay'},{w:'LEG',m:'Chân (đùi)'},{w:'FINGER',m:'Ngón tay'},
    {w:'HAIR',m:'Tóc'},{w:'TOOTH',m:'Răng'},{w:'NECK',m:'Cổ'},
    {w:'SHOULDER',m:'Vai'},{w:'BACK',m:'Lưng'},{w:'CHEST',m:'Ngực'},{w:'STOMACH',m:'Bụng'},
  ],
  Emotion: [
    {w:'HAPPY',m:'Vui / Hạnh phúc'},{w:'SAD',m:'Buồn'},{w:'ANGRY',m:'Tức giận'},
    {w:'AFRAID',m:'Sợ hãi'},{w:'EXCITED',m:'Phấn khích'},{w:'TIRED',m:'Mệt mỏi'},
    {w:'SURPRISED',m:'Ngạc nhiên'},{w:'CONFUSED',m:'Bối rối'},{w:'PROUD',m:'Tự hào'},
    {w:'LOVE',m:'Yêu thương'},{w:'HATE',m:'Ghét'},{w:'LIKE',m:'Thích'},
    {w:'NERVOUS',m:'Lo lắng'},{w:'CALM',m:'Bình tĩnh'},
  ],
  Actions: [
    {w:'HELP',m:'Giúp đỡ'},{w:'PLAY',m:'Chơi'},{w:'STUDY',m:'Học'},{w:'WORK',m:'Làm việc'},
    {w:'EAT',m:'Ăn'},{w:'DRINK',m:'Uống'},{w:'SLEEP',m:'Ngủ'},{w:'WAKE',m:'Thức dậy'},
    {w:'RUN',m:'Chạy'},{w:'WALK',m:'Đi bộ'},{w:'SIT',m:'Ngồi'},{w:'STAND',m:'Đứng'},
    {w:'SWIM',m:'Bơi'},{w:'JUMP',m:'Nhảy'},{w:'SPEAK',m:'Nói'},{w:'LISTEN',m:'Nghe'},
    {w:'SEE',m:'Nhìn / Thấy'},{w:'THINK',m:'Nghĩ'},{w:'KNOW',m:'Biết'},{w:'FORGET',m:'Quên'},
    {w:'WRITE',m:'Viết'},{w:'READ',m:'Đọc'},{w:'DRAW',m:'Vẽ'},{w:'SING',m:'Hát'},
    {w:'DANCE',m:'Nhảy / Múa'},{w:'COOK',m:'Nấu ăn'},{w:'BUY',m:'Mua'},
    {w:'COME',m:'Đến / Đi đến'},{w:'GO',m:'Đi'},{w:'STOP',m:'Dừng'},
    {w:'START',m:'Bắt đầu'},{w:'WIN',m:'Thắng'},{w:'LOSE',m:'Thua'},{w:'DREAM',m:'Mơ / Ước mơ'},
  ],
};

// tiếp WORDS_BY_TOPIC (các topic còn lại)
Object.assign(WORDS_BY_TOPIC, {
  Place: [
    {w:'HOME',m:'Nhà'},{w:'SCHOOL',m:'Trường học'},{w:'HOSPITAL',m:'Bệnh viện'},
    {w:'MARKET',m:'Chợ'},{w:'STORE',m:'Cửa hàng'},{w:'RESTAURANT',m:'Nhà hàng'},
    {w:'CAFE',m:'Quán cà phê'},{w:'HOTEL',m:'Khách sạn'},{w:'AIRPORT',m:'Sân bay'},
    {w:'PARK',m:'Công viên'},{w:'BEACH',m:'Bãi biển'},{w:'CHURCH',m:'Nhà thờ'},
    {w:'LIBRARY',m:'Thư viện'},{w:'OFFICE',m:'Văn phòng'},{w:'BANK',m:'Ngân hàng'},
    {w:'THEATER',m:'Rạp chiếu phim'},{w:'GYM',m:'Phòng gym'},{w:'POOL',m:'Hồ bơi'},
    {w:'MOUNTAIN',m:'Núi'},{w:'RIVER',m:'Sông'},{w:'OCEAN',m:'Đại dương'},
    {w:'CITY',m:'Thành phố'},{w:'VILLAGE',m:'Làng'},{w:'WORLD',m:'Thế giới'},
    {w:'EARTH',m:'Trái đất'},{w:'GARDEN',m:'Vườn'},{w:'FOREST',m:'Rừng'},
    {w:'ZOO',m:'Sở thú'},{w:'MUSEUM',m:'Bảo tàng'},
  ],
  School: [
    {w:'TEACHER',m:'Giáo viên'},{w:'STUDENT',m:'Học sinh'},{w:'BOOK',m:'Sách'},
    {w:'PEN',m:'Bút'},{w:'PENCIL',m:'Bút chì'},{w:'PAPER',m:'Giấy'},
    {w:'NOTEBOOK',m:'Vở'},{w:'RULER',m:'Thước kẻ'},{w:'ERASER',m:'Tẩy'},
    {w:'DESK',m:'Bàn học'},{w:'CHAIR',m:'Ghế'},{w:'BOARD',m:'Bảng'},
    {w:'EXAM',m:'Kỳ thi'},{w:'TEST',m:'Bài kiểm tra'},{w:'HOMEWORK',m:'Bài tập về nhà'},
    {w:'LESSON',m:'Bài học'},
  ],
  Job: [
    {w:'DOCTOR',m:'Bác sĩ'},{w:'NURSE',m:'Y tá'},{w:'ENGINEER',m:'Kỹ sư'},
    {w:'LAWYER',m:'Luật sư'},{w:'POLICE',m:'Cảnh sát'},{w:'FIREFIGHTER',m:'Lính cứu hỏa'},
    {w:'FARMER',m:'Nông dân'},{w:'COOK',m:'Đầu bếp'},{w:'DRIVER',m:'Tài xế'},
    {w:'PILOT',m:'Phi công'},{w:'SECRETARY',m:'Thư ký'},{w:'MANAGER',m:'Quản lý'},
    {w:'ACCOUNTANT',m:'Kế toán'},{w:'SINGER',m:'Ca sĩ'},{w:'ACTOR',m:'Diễn viên'},
    {w:'PHOTOGRAPHER',m:'Nhiếp ảnh gia'},{w:'ARTIST',m:'Họa sĩ'},
    {w:'JOURNALIST',m:'Nhà báo'},{w:'SCIENTIST',m:'Nhà khoa học'},
  ],
  Weather: [
    {w:'SUNNY',m:'Nắng'},{w:'RAINY',m:'Mưa'},{w:'CLOUDY',m:'Nhiều mây'},
    {w:'WINDY',m:'Gió'},{w:'SNOW',m:'Tuyết'},{w:'HOT',m:'Nóng'},{w:'COLD',m:'Lạnh'},
    {w:'WARM',m:'Ấm'},{w:'COOL',m:'Mát'},{w:'STORM',m:'Bão'},{w:'THUNDER',m:'Sấm'},
    {w:'LIGHTNING',m:'Sét'},{w:'FOG',m:'Sương mù'},{w:'SPRING',m:'Mùa xuân'},
    {w:'SUMMER',m:'Mùa hạ'},{w:'AUTUMN',m:'Mùa thu'},{w:'WINTER',m:'Mùa đông'},
    {w:'RAINBOW',m:'Cầu vồng'},
  ],
  Clothes: [
    {w:'SHIRT',m:'Áo sơ mi'},{w:'PANTS',m:'Quần dài'},{w:'DRESS',m:'Đầm'},
    {w:'SKIRT',m:'Váy'},{w:'SHORTS',m:'Quần ngắn'},{w:'JACKET',m:'Áo khoác'},
    {w:'SHOE',m:'Giày'},{w:'SANDAL',m:'Dép'},{w:'HAT',m:'Mũ'},
    {w:'GLASSES',m:'Kính mắt'},{w:'SCARF',m:'Khăn choàng'},{w:'GLOVE',m:'Găng tay'},
    {w:'SOCK',m:'Vớ / Tất'},{w:'UMBRELLA',m:'Ô / Dù'},{w:'RING',m:'Nhẫn'},
    {w:'BRACELET',m:'Vòng tay'},{w:'NECKLACE',m:'Dây chuyền'},
  ],
  Technology: [
    {w:'COMPUTER',m:'Máy tính'},{w:'PHONE',m:'Điện thoại'},{w:'TABLET',m:'Máy tính bảng'},
    {w:'LAPTOP',m:'Laptop'},{w:'KEYBOARD',m:'Bàn phím'},{w:'MOUSE',m:'Chuột máy tính'},
    {w:'SCREEN',m:'Màn hình'},{w:'CAMERA',m:'Máy ảnh'},{w:'TELEVISION',m:'Tivi'},
    {w:'INTERNET',m:'Internet'},{w:'WIFI',m:'Wifi'},{w:'CHARGER',m:'Sạc'},
    {w:'BATTERY',m:'Pin'},{w:'HEADPHONE',m:'Tai nghe'},{w:'SPEAKER',m:'Loa'},
    {w:'SOFTWARE',m:'Phần mềm'},{w:'GAME',m:'Trò chơi'},{w:'ROBOT',m:'Robot'},
    {w:'EMAIL',m:'Email'},{w:'MESSAGE',m:'Tin nhắn'},{w:'VIDEO',m:'Video'},
    {w:'PHOTO',m:'Hình ảnh'},{w:'MUSIC',m:'Âm nhạc'},{w:'MOVIE',m:'Phim'},
  ],
  Sport: [
    {w:'SOCCER',m:'Bóng đá'},{w:'BASKETBALL',m:'Bóng rổ'},{w:'VOLLEYBALL',m:'Bóng chuyền'},
    {w:'TENNIS',m:'Tennis'},{w:'BADMINTON',m:'Cầu lông'},{w:'SWIMMING',m:'Bơi lội'},
    {w:'DIVING',m:'Lặn'},{w:'JOGGING',m:'Chạy bộ'},{w:'BOXING',m:'Đấm bốc'},
    {w:'KARATE',m:'Karate'},{w:'YOGA',m:'Yoga'},{w:'CHESS',m:'Cờ vua'},{w:'BOWLING',m:'Bowling'},
  ],
  Music: [
    {w:'SONG',m:'Bài hát'},{w:'PIANO',m:'Piano'},{w:'GUITAR',m:'Guitar'},{w:'DRUM',m:'Trống'},
    {w:'VIOLIN',m:'Violin'},{w:'FLUTE',m:'Sáo'},{w:'TRUMPET',m:'Kèn'},
    {w:'CONCERT',m:'Buổi hòa nhạc'},{w:'ALBUM',m:'Album'},{w:'LYRICS',m:'Lời bài hát'},
  ],
  Nature: [
    {w:'SUN',m:'Mặt trời'},{w:'MOON',m:'Mặt trăng'},{w:'STAR',m:'Sao / Ngôi sao'},
    {w:'SKY',m:'Bầu trời'},{w:'CLOUD',m:'Mây'},{w:'TREE',m:'Cây'},{w:'FLOWER',m:'Hoa'},
    {w:'GRASS',m:'Cỏ'},{w:'LEAF',m:'Lá'},{w:'HILL',m:'Đồi'},{w:'LAKE',m:'Hồ'},
    {w:'SEA',m:'Biển'},{w:'ISLAND',m:'Đảo'},{w:'WATERFALL',m:'Thác nước'},{w:'DESERT',m:'Sa mạc'},
  ],
  Health: [
    {w:'HEALTH',m:'Sức khỏe'},{w:'MEDICINE',m:'Thuốc'},{w:'PILL',m:'Viên thuốc'},
    {w:'FEVER',m:'Sốt'},{w:'COUGH',m:'Ho'},{w:'HEADACHE',m:'Đau đầu'},
    {w:'TOOTHACHE',m:'Đau răng'},{w:'EXERCISE',m:'Tập thể dục'},{w:'VITAMIN',m:'Vitamin'},
    {w:'INSURANCE',m:'Bảo hiểm'},
  ],
  Travel: [
    {w:'TRAVEL',m:'Du lịch'},{w:'TRIP',m:'Chuyến đi'},{w:'PASSPORT',m:'Hộ chiếu'},
    {w:'VISA',m:'Visa'},{w:'TICKET',m:'Vé'},{w:'LUGGAGE',m:'Hành lý'},{w:'MAP',m:'Bản đồ'},
    {w:'HOTEL',m:'Khách sạn'},{w:'RESORT',m:'Khu nghỉ dưỡng'},{w:'VACATION',m:'Kỳ nghỉ'},
    {w:'CAMPING',m:'Cắm trại'},{w:'ADVENTURE',m:'Phiêu lưu'},
  ],
  Shopping: [
    {w:'SHOP',m:'Cửa hàng'},{w:'SUPERMARKET',m:'Siêu thị'},{w:'MALL',m:'Trung tâm thương mại'},
    {w:'PRICE',m:'Giá'},{w:'DISCOUNT',m:'Giảm giá'},{w:'MONEY',m:'Tiền'},{w:'CASH',m:'Tiền mặt'},
    {w:'CARD',m:'Thẻ'},{w:'RECEIPT',m:'Hóa đơn'},{w:'CHEAP',m:'Rẻ'},{w:'EXPENSIVE',m:'Đắt'},
    {w:'ONLINE',m:'Trực tuyến'},{w:'DELIVERY',m:'Giao hàng'},
  ],
  DailyRoutine: [
    {w:'MONDAY',m:'Thứ hai'},{w:'TUESDAY',m:'Thứ ba'},{w:'WEDNESDAY',m:'Thứ tư'},
    {w:'THURSDAY',m:'Thứ năm'},{w:'FRIDAY',m:'Thứ sáu'},{w:'SATURDAY',m:'Thứ bảy'},
    {w:'SUNDAY',m:'Chủ nhật'},{w:'TODAY',m:'Hôm nay'},{w:'TOMORROW',m:'Ngày mai'},
    {w:'YESTERDAY',m:'Hôm qua'},
  ],
  Months: [
    {w:'JANUARY',m:'Tháng một'},{w:'FEBRUARY',m:'Tháng hai'},{w:'MARCH',m:'Tháng ba'},
    {w:'APRIL',m:'Tháng tư'},{w:'MAY',m:'Tháng năm'},{w:'JUNE',m:'Tháng sáu'},
    {w:'JULY',m:'Tháng bảy'},{w:'AUGUST',m:'Tháng tám'},{w:'SEPTEMBER',m:'Tháng chín'},
    {w:'OCTOBER',m:'Tháng mười'},{w:'NOVEMBER',m:'Tháng mười một'},{w:'DECEMBER',m:'Tháng mười hai'},
  ],
  Directions: [
    {w:'LEFT',m:'Trái'},{w:'RIGHT',m:'Phải'},{w:'STRAIGHT',m:'Thẳng'},
    {w:'UP',m:'Lên'},{w:'DOWN',m:'Xuống'},{w:'NORTH',m:'Hướng Bắc'},
    {w:'SOUTH',m:'Hướng Nam'},{w:'EAST',m:'Hướng Đông'},{w:'WEST',m:'Hướng Tây'},
    {w:'NEAR',m:'Gần'},{w:'FAR',m:'Xa'},{w:'FRONT',m:'Trước'},
    {w:'BACK',m:'Sau'},{w:'INSIDE',m:'Trong'},{w:'OUTSIDE',m:'Ngoài'},
  ],
  Communication: [
    {w:'HELLO',m:'Xin chào'},{w:'BYE',m:'Tạm biệt'},{w:'YES',m:'Vâng/Có'},{w:'NO',m:'Không'},
    {w:'PLEASE',m:'Làm ơn'},{w:'THANK YOU',m:'Cảm ơn'},{w:'SORRY',m:'Xin lỗi'},
    {w:'OKAY',m:'Được'},{w:'REPEAT',m:'Lặp lại'},{w:'HELP ME',m:'Giúp tôi'},
    {w:'TALK',m:'Nói chuyện'},{w:'ASK',m:'Hỏi'},{w:'ANSWER',m:'Trả lời'},
    {w:'TELL',m:'Kể'},{w:'CALL',m:'Gọi'},{w:'LISTEN',m:'Nghe'},
    {w:'I UNDERSTAND',m:'Tôi hiểu'},{w:'I DONT UNDERSTAND',m:'Tôi không hiểu'},
    {w:'SPEAK SLOWER',m:'Nói chậm hơn'},{w:'WRITE DOWN',m:'Viết xuống'},
  ],
  Money: [
    {w:'MONEY',m:'Tiền'},{w:'CHEAP',m:'Rẻ'},{w:'EXPENSIVE',m:'Đắt'},{w:'FREE',m:'Miễn phí'},
    {w:'PAY',m:'Trả tiền'},{w:'BUY',m:'Mua'},{w:'SELL',m:'Bán'},{w:'COST',m:'Giá'},
    {w:'PRICE',m:'Giá cả'},{w:'DISCOUNT',m:'Giảm giá'},{w:'CASH',m:'Tiền mặt'},
    {w:'CARD',m:'Thẻ'},{w:'BANK',m:'Ngân hàng'},{w:'RICH',m:'Giàu'},{w:'POOR',m:'Nghèo'},
    {w:'SAVE',m:'Tiết kiệm'},{w:'SPEND',m:'Chi tiêu'},{w:'BORROW',m:'Mượn'},
    {w:'LEND',m:'Cho mượn'},{w:'DEBT',m:'Nợ'},
  ],
  Movie: [
    {w:'MOVIE',m:'Phim'},{w:'FILM',m:'Phim ảnh'},{w:'CINEMA',m:'Rạp chiếu phim'},
    {w:'ACTOR',m:'Diễn viên nam'},{w:'ACTRESS',m:'Diễn viên nữ'},{w:'SCARY',m:'Kinh dị'},
    {w:'COMEDY',m:'Hài kịch'},{w:'ACTION',m:'Hành động'},{w:'DRAMA',m:'Chính kịch'},
    {w:'ROMANCE',m:'Lãng mạn'},{w:'HORROR',m:'Kinh hoàng'},{w:'ANIMATION',m:'Hoạt hình'},
    {w:'THRILLER',m:'Gay cấn'},{w:'WATCH',m:'Xem'},{w:'DIRECTOR',m:'Đạo diễn'},
    {w:'SCREEN',m:'Màn hình'},
  ],
  Hobby: [
    {w:'HOBBY',m:'Sở thích'},{w:'READ',m:'Đọc'},{w:'WRITE',m:'Viết'},{w:'DRAW',m:'Vẽ'},
    {w:'PAINT',m:'Sơn'},{w:'SING',m:'Hát'},{w:'DANCE',m:'Nhảy'},{w:'PLAY',m:'Chơi'},
    {w:'GAME',m:'Trò chơi'},{w:'COLLECT',m:'Sưu tầm'},{w:'PHOTOGRAPH',m:'Chụp ảnh'},
    {w:'COOK',m:'Nấu ăn'},{w:'GARDEN',m:'Làm vườn'},{w:'FISHING',m:'Câu cá'},
    {w:'HIKING',m:'Leo núi'},{w:'TRAVEL',m:'Du lịch'},{w:'CAMPING',m:'Cắm trại'},
    {w:'KNIT',m:'Đan'},{w:'SEW',m:'May'},{w:'CRAFT',m:'Thủ công'},
  ],
  Feelings: [
    {w:'LOVE',m:'Yêu'},{w:'HATE',m:'Ghét'},{w:'LIKE',m:'Thích'},{w:'DISLIKE',m:'Không thích'},
    {w:'HAPPY',m:'Vui'},{w:'SAD',m:'Buồn'},{w:'ANGRY',m:'Tức giận'},{w:'SCARED',m:'Sợ'},
    {w:'EXCITED',m:'Hào hứng'},{w:'BORED',m:'Chán'},{w:'TIRED',m:'Mệt'},
    {w:'HUNGRY',m:'Đói'},{w:'THIRSTY',m:'Khát'},{w:'CONFUSED',m:'Bối rối'},
    {w:'PROUD',m:'Tự hào'},{w:'JEALOUS',m:'Ghen tỵ'},{w:'NERVOUS',m:'Lo lắng'},
    {w:'RELAXED',m:'Thư giãn'},{w:'GRATEFUL',m:'Biết ơn'},{w:'LONELY',m:'Cô đơn'},
  ],
  Holiday: [
    {w:'HOLIDAY',m:'Ngày lễ'},{w:'BIRTHDAY',m:'Sinh nhật'},{w:'CHRISTMAS',m:'Giáng sinh'},
    {w:'NEW YEAR',m:'Năm mới'},{w:'VALENTINE',m:'Valentine'},{w:'EASTER',m:'Phục sinh'},
    {w:'THANKSGIVING',m:'Lễ Tạ ơn'},{w:'HALLOWEEN',m:'Halloween'},{w:'PARTY',m:'Tiệc'},
    {w:'CELEBRATE',m:'Kỷ niệm'},{w:'GIFT',m:'Quà tặng'},{w:'CAKE',m:'Bánh'},
    {w:'BALLOON',m:'Bóng bay'},{w:'DECORATION',m:'Trang trí'},{w:'FIREWORK',m:'Pháo hoa'},
    {w:'VACATION',m:'Nghỉ lễ'},{w:'FESTIVAL',m:'Lễ hội'},{w:'PICNIC',m:'Dã ngoại'},
  ],
  Internet: [
    {w:'INTERNET',m:'Internet'},{w:'WEBSITE',m:'Trang web'},{w:'EMAIL',m:'Email'},
    {w:'PASSWORD',m:'Mật khẩu'},{w:'USERNAME',m:'Tên đăng nhập'},{w:'LOGIN',m:'Đăng nhập'},
    {w:'LOGOUT',m:'Đăng xuất'},{w:'SIGN UP',m:'Đăng ký'},{w:'SEARCH',m:'Tìm kiếm'},
    {w:'CLICK',m:'Nhấp chuột'},{w:'DOWNLOAD',m:'Tải xuống'},{w:'UPLOAD',m:'Tải lên'},
    {w:'SHARE',m:'Chia sẻ'},{w:'LIKE',m:'Thích'},{w:'COMMENT',m:'Bình luận'},
    {w:'POST',m:'Đăng bài'},{w:'CHAT',m:'Trò chuyện'},{w:'VIDEO CALL',m:'Gọi video'},
    {w:'STREAM',m:'Phát trực tiếp'},{w:'BROADCAST',m:'Phát sóng'},
  ],
  Transportation: [
    {w:'CAR',m:'Ô tô'},{w:'BUS',m:'Xe buýt'},{w:'TRAIN',m:'Tàu hỏa'},{w:'PLANE',m:'Máy bay'},
    {w:'BICYCLE',m:'Xe đạp'},{w:'MOTORCYCLE',m:'Xe máy'},{w:'TAXI',m:'Taxi'},
    {w:'SUBWAY',m:'Tàu điện ngầm'},{w:'BOAT',m:'Thuyền'},{w:'SHIP',m:'Tàu thuyền'},
    {w:'HELICOPTER',m:'Trực thăng'},{w:'DRIVE',m:'Lái xe'},{w:'RIDE',m:'Đi xe'},
    {w:'WALK',m:'Đi bộ'},{w:'STOP',m:'Dừng'},{w:'WAIT',m:'Chờ'},
    {w:'CROSS',m:'Qua đường'},{w:'TURN',m:'Rẽ'},{w:'SPEED',m:'Tốc độ'},{w:'TICKET',m:'Vé'},
  ],
  Feelings2: [
    {w:'LOVE',m:'Yêu / Tình yêu'},{w:'HEART',m:'Trái tim'},{w:'SOUL',m:'Tâm hồn'},
    {w:'ROMANCE',m:'Lãng mạn'},{w:'KISS',m:'Hôn'},{w:'HUG',m:'Ôm'},
    {w:'MARRIAGE',m:'Hôn nhân'},{w:'WEDDING',m:'Đám cưới'},{w:'PARTNER',m:'Bạn đời'},
    {w:'BOYFRIEND',m:'Bạn trai'},{w:'GIRLFRIEND',m:'Bạn gái'},{w:'HUSBAND',m:'Chồng'},
    {w:'WIFE',m:'Vợ'},{w:'PASSION',m:'Đam mê'},{w:'DEVOTION',m:'Tận tâm'},
    {w:'CHERISH',m:'Trân trọng'},{w:'FOREVER',m:'Mãi mãi'},
  ],
  Opposites: [
    {w:'BIG',m:'Lớn'},{w:'SMALL',m:'Nhỏ'},{w:'TALL',m:'Cao'},{w:'SHORT',m:'Thấp / Ngắn'},
    {w:'LONG',m:'Dài'},{w:'THIN',m:'Gầy'},{w:'FAT',m:'Béo'},{w:'YOUNG',m:'Trẻ'},
    {w:'RICH',m:'Giàu'},{w:'POOR',m:'Nghèo'},{w:'STRONG',m:'Mạnh'},{w:'WEAK',m:'Yếu'},
    {w:'FAST',m:'Nhanh'},{w:'SLOW',m:'Chậm'},{w:'HEAVY',m:'Nặng'},{w:'LIGHT',m:'Nhẹ'},
    {w:'HARD',m:'Cứng'},{w:'SOFT',m:'Mềm'},{w:'BRIGHT',m:'Sáng'},{w:'DARK',m:'Tối'},
    {w:'LOUD',m:'To / Ồn'},{w:'QUIET',m:'Im lặng'},{w:'CLEAN',m:'Sạch'},{w:'DIRTY',m:'Bẩn'},
    {w:'BEAUTIFUL',m:'Đẹp'},{w:'UGLY',m:'Xấu'},{w:'GOOD',m:'Tốt'},{w:'BAD',m:'Xấu / Dở'},
    {w:'EASY',m:'Dễ'},{w:'DIFFICULT',m:'Khó'},{w:'OPEN',m:'Mở'},{w:'CLOSE',m:'Đóng'},
    {w:'SWEET',m:'Ngọt'},{w:'SOUR',m:'Chua'},{w:'SALTY',m:'Mặn'},{w:'SPICY',m:'Cay'},
    {w:'DELICIOUS',m:'Ngon'},{w:'SMART',m:'Thông minh'},{w:'LAZY',m:'Lười'},
    {w:'DILIGENT',m:'Chăm chỉ'},{w:'BUSY',m:'Bận'},{w:'LATE',m:'Trễ / Muộn'},
    {w:'POSSIBLE',m:'Có thể'},{w:'IMPOSSIBLE',m:'Không thể'},{w:'SAME',m:'Giống / Như nhau'},
    {w:'DIFFERENT',m:'Khác'},{w:'SAFE',m:'An toàn'},{w:'DANGEROUS',m:'Nguy hiểm'},
  ],
  Misc: [
    {w:'QUESTION',m:'Câu hỏi'},{w:'ANSWER',m:'Câu trả lời'},{w:'IDEA',m:'Ý tưởng'},
    {w:'PLAN',m:'Kế hoạch'},{w:'GOAL',m:'Mục tiêu'},{w:'SUCCESS',m:'Thành công'},
    {w:'FAILURE',m:'Thất bại'},{w:'EFFORT',m:'Cố gắng'},{w:'PROBLEM',m:'Vấn đề'},
    {w:'SOLUTION',m:'Giải pháp'},{w:'CHANGE',m:'Thay đổi'},{w:'IMPROVE',m:'Cải thiện'},
    {w:'BUILD',m:'Xây dựng'},{w:'CREATE',m:'Tạo'},{w:'SAVE',m:'Lưu'},
    {w:'AGREE',m:'Đồng ý'},{w:'SUPPORT',m:'Ủng hộ'},{w:'EXPLAIN',m:'Giải thích'},
    {w:'UNDERSTAND',m:'Hiểu'},{w:'ALWAYS',m:'Luôn luôn'},{w:'NEVER',m:'Không bao giờ'},
    {w:'OFTEN',m:'Thường'},{w:'SOMETIMES',m:'Đôi khi'},{w:'NOW',m:'Bây giờ'},
    {w:'CAN',m:'Có thể / Biết'},{w:'MUST',m:'Phải'},{w:'SHOULD',m:'Nên'},
    {w:'NEED',m:'Cần'},{w:'HOPE',m:'Hy vọng'},{w:'BELIEVE',m:'Tin'},
    {w:'CONFIDENT',m:'Tự tin'},{w:'PATIENT',m:'Kiên nhẫn'},{w:'RESPONSIBLE',m:'Có trách nhiệm'},
  ],
});

// ══════════════════════════════════════════════════════════════
// 3. CÂU GIAO TIẾP THEO TOPIC - khớp hoàn toàn với SENTENCES_BY_TOPIC
// ══════════════════════════════════════════════════════════════
const SENTENCES_BY_TOPIC = {
  Greetings: [
    {s:'HOW ARE YOU',m:'Bạn khỏe không?'},{s:'WHAT IS YOUR NAME',m:'Bạn tên gì?'},
    {s:'NICE TO MEET YOU',m:'Rất vui được gặp bạn'},{s:'GOOD MORNING',m:'Chào buổi sáng'},
    {s:'GOOD NIGHT',m:'Chào buổi tối / Ngủ ngon'},{s:'SEE YOU LATER',m:'Hẹn gặp lại'},
    {s:'HOW OLD ARE YOU',m:'Bạn bao nhiêu tuổi?'},{s:'WHERE DO YOU LIVE',m:'Bạn sống ở đâu?'},
    {s:'WHAT DO YOU DO',m:'Bạn làm nghề gì?'},{s:'ARE YOU OKAY',m:'Bạn có sao không?'},
    {s:'GOOD AFTERNOON',m:'Chào buổi chiều'},{s:'GOOD EVENING',m:'Chào buổi tối'},
    {s:'HOW HAVE YOU BEEN',m:'Dạo này bạn thế nào?'},{s:'I AM FINE',m:'Tôi khỏe'},
    {s:'I AM NOT BAD',m:'Tôi không tệ'},{s:'AND YOU',m:'Còn bạn thì sao?'},
    {s:'NOT TOO BAD',m:'Không quá tệ'},{s:'SO SO',m:'Bình thường'},
    {s:'IT IS NICE TO SEE YOU',m:'Thật vui được gặp bạn'},{s:'I MISSED YOU',m:'Tôi nhớ bạn'},
    {s:'LONG TIME NO SEE',m:'Lâu rồi không gặp'},{s:'HAVE A GREAT DAY',m:'Chúc một ngày tốt đẹp'},
    {s:'SLEEP WELL',m:'Ngủ ngon'},{s:'KEEP IN TOUCH',m:'Giữ liên lạc nhé'},
    {s:'I WILL SEE YOU SOON',m:'Tôi sẽ gặp bạn sớm'},{s:'HOPE TO SEE YOU AGAIN',m:'Hy vọng gặp lại bạn'},
    {s:'WELCOME BACK',m:'Chào mừng trở lại'},{s:'HOW IS EVERYTHING',m:'Mọi thứ thế nào?'},
    {s:'EVERYTHING IS FINE',m:'Mọi thứ đều tốt'},{s:'I AM GLAD TO SEE YOU',m:'Tôi vui được gặp bạn'},
  ],
  Emotion: [
    {s:'I AM HAPPY',m:'Tôi vui'},{s:'I AM SAD',m:'Tôi buồn'},{s:'I AM TIRED',m:'Tôi mệt'},
    {s:'I AM HUNGRY',m:'Tôi đói'},{s:'I AM THIRSTY',m:'Tôi khát'},{s:'I AM ANGRY',m:'Tôi tức giận'},
    {s:'I AM SCARED',m:'Tôi sợ'},{s:'I AM EXCITED',m:'Tôi phấn khích'},
    {s:'I AM CONFUSED',m:'Tôi bối rối'},{s:'I AM SURPRISED',m:'Tôi ngạc nhiên'},
    {s:'I AM PROUD',m:'Tôi tự hào'},{s:'I AM WORRIED',m:'Tôi lo lắng'},
    {s:'I AM NERVOUS',m:'Tôi hồi hộp'},{s:'I AM CALM',m:'Tôi bình tĩnh'},
    {s:'I AM STRESSED',m:'Tôi căng thẳng'},{s:'I AM RELIEVED',m:'Tôi nhẹ nhõm'},
    {s:'I AM GRATEFUL',m:'Tôi biết ơn'},{s:'I AM JEALOUS',m:'Tôi ghen tị'},
    {s:'I AM EMBARRASSED',m:'Tôi xấu hổ'},{s:'I AM FRUSTRATED',m:'Tôi thất vọng'},
    {s:'I AM LONELY',m:'Tôi cô đơn'},{s:'I AM BORED',m:'Tôi chán'},
    {s:'I AM SICK',m:'Tôi ốm'},{s:'I AM SLEEPY',m:'Tôi buồn ngủ'},
    {s:'I AM ANXIOUS',m:'Tôi lo âu'},{s:'I AM SHY',m:'Tôi ngại'},
    {s:'I AM CONFIDENT',m:'Tôi tự tin'},{s:'I AM PEACEFUL',m:'Tôi bình yên'},
    {s:'I FEEL GREAT TODAY',m:'Hôm nay tôi cảm thấy tuyệt vời'},
    {s:'THIS MAKES ME HAPPY',m:'Điều này làm tôi vui'},
  ],
  Actions: [
    {s:'I WANT TO GO',m:'Tôi muốn đi'},{s:'I WANT TO EAT',m:'Tôi muốn ăn'},
    {s:'I WANT TO SLEEP',m:'Tôi muốn ngủ'},{s:'I WANT TO PLAY',m:'Tôi muốn chơi'},
    {s:'I WANT TO STUDY',m:'Tôi muốn học'},{s:'I WANT TO WORK',m:'Tôi muốn làm việc'},
    {s:'LET US GO',m:'Chúng ta đi thôi'},{s:'STOP HERE',m:'Dừng lại đây'},
    {s:'WAIT FOR ME',m:'Đợi tôi'},{s:'COME HERE',m:'Đến đây'},
    {s:'I AM READING A BOOK',m:'Tôi đang đọc sách'},{s:'I AM WATCHING TV',m:'Tôi đang xem TV'},
    {s:'I AM LISTENING TO MUSIC',m:'Tôi đang nghe nhạc'},
    {s:'I AM DRIVING A CAR',m:'Tôi đang lái xe'},{s:'I AM SWIMMING',m:'Tôi đang bơi'},
    {s:'I AM RUNNING',m:'Tôi đang chạy'},{s:'I AM WALKING',m:'Tôi đang đi bộ'},
    {s:'I AM COOKING',m:'Tôi đang nấu ăn'},{s:'I AM CLEANING THE HOUSE',m:'Tôi đang dọn nhà'},
    {s:'I AM SHOPPING',m:'Tôi đang mua sắm'},
    {s:'I AM PRACTICING ASL',m:'Tôi đang luyện tập ASL'},
    {s:'I AM THINKING',m:'Tôi đang suy nghĩ'},
  ],
  Food: [
    {s:'I AM HUNGRY',m:'Tôi đói'},{s:'I AM THIRSTY',m:'Tôi khát'},
    {s:'I WANT COFFEE',m:'Tôi muốn cà phê'},{s:'I WANT WATER',m:'Tôi muốn nước'},
    {s:'THIS IS DELICIOUS',m:'Này ngon'},{s:'I AM FULL',m:'Tôi no rồi'},
    {s:'THE FOOD IS COLD',m:'Thức ăn nguội rồi'},{s:'THE FOOD IS HOT',m:'Thức ăn nóng'},
    {s:'THE FOOD IS SOUR',m:'Thức ăn chua'},{s:'THE FOOD IS SWEET',m:'Thức ăn ngọt'},
    {s:'THE FOOD IS SALTY',m:'Thức ăn mặn'},{s:'THE FOOD IS SPICY',m:'Thức ăn cay'},
    {s:'I WANT SOME RICE',m:'Tôi muốn cơm'},{s:'I WANT SOME BREAD',m:'Tôi muốn bánh mì'},
    {s:'I WANT SOME CHICKEN',m:'Tôi muốn thịt gà'},{s:'I WANT SOME FISH',m:'Tôi muốn cá'},
    {s:'I AM EATING BREAKFAST',m:'Tôi đang ăn sáng'},
    {s:'I AM EATING LUNCH',m:'Tôi đang ăn trưa'},
    {s:'I AM EATING DINNER',m:'Tôi đang ăn tối'},
    {s:'I AM A VEGETARIAN',m:'Tôi ăn chay'},
    {s:'THIS IS MY FAVORITE FOOD',m:'Đây là món ăn yêu thích của tôi'},
    {s:'I COOK EVERYDAY',m:'Tôi nấu ăn mỗi ngày'},
  ],
  Time: [
    {s:'WHAT TIME IS IT',m:'Bây giờ mấy giờ?'},{s:'WHAT DAY IS IT',m:'Hôm nay thứ mấy?'},
    {s:'WHAT IS TODAY',m:'Hôm nay là ngày gì?'},{s:'WHAT IS TOMORROW',m:'Ngày mai là ngày gì?'},
    {s:'HAVE A NICE DAY',m:'Chúc một ngày tốt lành'},{s:'I WILL BE LATE',m:'Tôi sẽ muộn'},
    {s:'I AM ON TIME',m:'Tôi đúng giờ'},{s:'I HAVE NO TIME',m:'Tôi không có thời gian'},
    {s:'I WOKE UP EARLY',m:'Tôi thức dậy sớm'},{s:'I WOKE UP LATE',m:'Tôi thức dậy muộn'},
    {s:'I WILL BE BACK SOON',m:'Tôi sẽ quay lại sớm'},
    {s:'HOW LONG WILL IT TAKE',m:'Nó sẽ mất bao lâu?'},
    {s:'I WILL SEE YOU NEXT WEEK',m:'Tôi sẽ gặp bạn tuần sau'},
    {s:'SEE YOU TOMORROW',m:'Hẹn gặp ngày mai'},
  ],
  Family: [
    {s:'MY FAMILY IS BIG',m:'Gia đình tôi đông'},{s:'I LIVE WITH MY PARENTS',m:'Tôi sống với bố mẹ'},
    {s:'ARE YOU MARRIED',m:'Bạn đã lập gia đình chưa?'},{s:'I AM SINGLE',m:'Tôi độc thân'},
    {s:'I AM MARRIED',m:'Tôi đã lập gia đình'},{s:'I HAVE A BROTHER',m:'Tôi có anh trai'},
    {s:'I HAVE A SISTER',m:'Tôi có chị gái'},{s:'MY MOM IS KIND',m:'Mẹ tôi dễ thương'},
    {s:'I AM THE OLDEST CHILD',m:'Tôi là con cả'},
    {s:'I AM THE YOUNGEST CHILD',m:'Tôi là con út'},
    {s:'I HAVE NO SIBLINGS',m:'Tôi là con một'},
    {s:'I LOVE MY FAMILY',m:'Tôi yêu gia đình'},
    {s:'I MISS MY FAMILY',m:'Tôi nhớ gia đình'},
    {s:'DO YOU HAVE CHILDREN',m:'Bạn có con chưa?'},
    {s:'WE ARE A HAPPY FAMILY',m:'Chúng tôi là gia đình hạnh phúc'},
  ],
  Weather: [
    {s:'IT IS HOT TODAY',m:'Hôm nay trời nóng'},{s:'IT IS COLD TODAY',m:'Hôm nay trời lạnh'},
    {s:'IT IS RAINING',m:'Trời đang mưa'},{s:'IT IS SNOWING',m:'Trời đang tuyết'},
    {s:'THE WEATHER IS NICE',m:'Thời tiết đẹp'},{s:'IT IS WINDY TODAY',m:'Hôm nay trời có gió'},
    {s:'IT IS CLOUDY TODAY',m:'Hôm nay trời nhiều mây'},
    {s:'IT IS SUNNY TODAY',m:'Hôm nay trời nắng'},
    {s:'THE SKY IS BLUE',m:'Bầu trời xanh'},{s:'I SEE A RAINBOW',m:'Tôi thấy cầu vồng'},
    {s:'I NEED AN UMBRELLA',m:'Tôi cần ô'},
    {s:'WHAT IS THE WEATHER LIKE',m:'Thời tiết như thế nào?'},
    {s:'I LIKE HOT WEATHER',m:'Tôi thích trời nóng'},
    {s:'I LOVE RAINY DAYS',m:'Tôi thích những ngày mưa'},
  ],
  Colors: [
    {s:'WHAT COLOR IS YOUR SHIRT',m:'Áo của bạn màu gì?'},
    {s:'I LIKE RED COLOR',m:'Tôi thích màu đỏ'},
    {s:'THE SKY IS BLUE TODAY',m:'Bầu trời hôm nay xanh dương'},
    {s:'THE GRASS IS GREEN',m:'Cỏ xanh'},{s:'MY SHOES ARE WHITE',m:'Giày tôi màu trắng'},
    {s:'THE CAR IS BLACK',m:'Chiếc xe đó màu đen'},
    {s:'WHAT IS YOUR FAVORITE COLOR',m:'Màu yêu thích của bạn là gì?'},
    {s:'MY FAVORITE COLOR IS BLUE',m:'Màu yêu thích của tôi là xanh dương'},
    {s:'THE RAINBOW HAS MANY COLORS',m:'Cầu vồng có nhiều màu'},
    {s:'I LIKE BRIGHT COLORS',m:'Tôi thích màu sáng'},
  ],
  Animals: [
    {s:'DO YOU LIKE DOGS',m:'Bạn có thích chó không?'},{s:'I HAVE A CAT',m:'Tôi có một con mèo'},
    {s:'THE ELEPHANT IS BIG',m:'Con voi lớn'},{s:'I LOVE HORSES',m:'Tôi yêu ngựa'},
    {s:'MY DOG IS FRIENDLY',m:'Con chó tôi thân thiện'},
    {s:'THE CAT IS SLEEPING',m:'Con mèo đang ngủ'},
    {s:'I WALK MY DOG EVERY MORNING',m:'Tôi dắt chó đi dạo mỗi sáng'},
    {s:'THE DOLPHIN IS SMART',m:'Cá heo thông minh'},
    {s:'I WENT TO THE ZOO',m:'Tôi đi sở thú'},
    {s:'I LOVE CUTE ANIMALS',m:'Tôi yêu động vật dễ thương'},
    {s:'THE SHARK IS DANGEROUS',m:'Cá mập nguy hiểm'},
    {s:'THE LION IS THE KING OF JUNGLE',m:'Sư tử là vua rừng'},
    {s:'THE BEE MAKES HONEY',m:'Con ong làm mật'},
    {s:'I AM AFRAID OF SNAKES',m:'Tôi sợ rắn'},
  ],
  Months: [
    {s:'MY BIRTHDAY IS IN JANUARY',m:'Sinh nhật tôi vào tháng một'},
    {s:'DECEMBER IS THE LAST MONTH',m:'Tháng mười hai là tháng cuối cùng'},
    {s:'WHAT IS YOUR BIRTHDAY MONTH',m:'Tháng sinh nhật của bạn là tháng mấy?'},
    {s:'I WAS BORN IN JULY',m:'Tôi sinh vào tháng bảy'},
    {s:'IT IS HOT IN JUNE',m:'Tháng sáu trời nóng'},
    {s:'CHRISTMAS IS IN DECEMBER',m:'Giáng sinh vào tháng mười hai'},
    {s:'VALENTINE IS IN FEBRUARY',m:'Lễ tình nhân vào tháng hai'},
    {s:'HALLOWEEN IS IN OCTOBER',m:'Lễ Halloween vào tháng mười'},
    {s:'THE YEAR HAS TWELVE MONTHS',m:'Một năm có mười hai tháng'},
    {s:'WHICH MONTH IS YOUR FAVORITE',m:'Tháng nào là tháng yêu thích của bạn?'},
    {s:'WHAT MONTH IS IT NOW',m:'Bây giờ là tháng mấy?'},
    {s:'SPRING COMES IN MARCH',m:'Mùa xuân đến vào tháng ba'},
  ],
};

// ══════════════════════════════════════════════════════════════
// 4. HÀM SEED CHÍNH
// ══════════════════════════════════════════════════════════════
async function seedAll() {
    console.log('🔄 Kết nối MongoDB Atlas...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối thành công!\n');

    // ── LETTERS ─────────────────────────────────────────────
    console.log('📌 [1/3] Seeding 26 chữ cái A-Z...');
    await ASLContent.deleteMany({ type: 'letter' });
    await ASLContent.insertMany(LETTERS.map(l => ({
        type: 'letter', label: l.label, meaning: l.meaning,
        topic: 'Alphabet', imageUrl: `/ASL_SIGN/${l.label}.jpg`, isActive: true
    })));
    console.log(`   ✅ ${LETTERS.length} chữ cái`);

    // ── WORDS by topic ──────────────────────────────────────
    console.log('\n📌 [2/3] Seeding từ vựng theo topic...');
    await ASLContent.deleteMany({ type: 'word' });
    const allWords = [];
    for (const [topic, words] of Object.entries(WORDS_BY_TOPIC)) {
        for (const w of words) {
            allWords.push({ type: 'word', label: w.w, meaning: w.m, topic, isActive: true });
        }
    }
    await ASLContent.insertMany(allWords);
    const wordTopics = Object.keys(WORDS_BY_TOPIC);
    console.log(`   ✅ ${allWords.length} từ vựng / ${wordTopics.length} topic`);
    for (const t of wordTopics) {
        console.log(`      • ${t}: ${WORDS_BY_TOPIC[t].length} từ`);
    }

    // ── SENTENCES by topic ──────────────────────────────────
    console.log('\n📌 [3/3] Seeding câu giao tiếp theo topic...');
    await ASLContent.deleteMany({ type: 'sentence' });
    const allSentences = [];
    for (const [topic, sentences] of Object.entries(SENTENCES_BY_TOPIC)) {
        for (const s of sentences) {
            allSentences.push({ type: 'sentence', label: s.s, meaning: s.m, topic, isActive: true });
        }
    }
    await ASLContent.insertMany(allSentences);
    const sentenceTopics = Object.keys(SENTENCES_BY_TOPIC);
    console.log(`   ✅ ${allSentences.length} câu giao tiếp / ${sentenceTopics.length} topic`);
    for (const t of sentenceTopics) {
        console.log(`      • ${t}: ${SENTENCES_BY_TOPIC[t].length} câu`);
    }

    // ── TỔNG KẾT ────────────────────────────────────────────
    const cntL = await ASLContent.countDocuments({ type: 'letter' });
    const cntW = await ASLContent.countDocuments({ type: 'word' });
    const cntS = await ASLContent.countDocuments({ type: 'sentence' });

    console.log('\n════════════════════════════════════════');
    console.log('🎉 SEED HOÀN THÀNH!');
    console.log('════════════════════════════════════════');
    console.log(`   📌 Chữ cái:       ${cntL}`);
    console.log(`   📌 Từ vựng:       ${cntW}`);
    console.log(`   📌 Câu giao tiếp: ${cntS}`);
    console.log(`   📌 TỔNG:          ${cntL + cntW + cntS}`);
    console.log('════════════════════════════════════════\n');

    await mongoose.disconnect();
    process.exit(0);
}

seedAll().catch(err => {
    console.error('❌ Lỗi:', err.message);
    process.exit(1);
});
