/**
 * PATCH - Bổ sung từ còn thiếu để đủ 100/topic
 * Chạy: node seed-words-patch.cjs
 */
const mongoose = require('mongoose');
const MONGO_URI = 'mongodb://admin:Demo%40123@ac-ab0jgsf-shard-00-00.yyx5afj.mongodb.net:27017,ac-ab0jgsf-shard-00-01.yyx5afj.mongodb.net:27017,ac-ab0jgsf-shard-00-02.yyx5afj.mongodb.net/signlanguage_db?authSource=admin&ssl=true';

const ASLContentSchema = new mongoose.Schema({
    type:{type:String,enum:['letter','word','sentence'],required:true},
    label:{type:String,required:true,trim:true},
    meaning:{type:String,default:''},
    topic:{type:String,default:''},
    isActive:{type:Boolean,default:true},
    createdBy:{type:mongoose.Schema.Types.ObjectId,ref:'User',default:null}
},{ timestamps:true });
const ASLContent = mongoose.model('ASLContent', ASLContentSchema);

const W = (w,m,t) => ({type:'word',label:w,meaning:m,topic:t,isActive:true});

const PATCHES = [
  // Emotion (cần 1)
  W('OVERWHELMED','Quá tải cảm xúc','Emotion'),
  // Actions (cần 2)
  W('CHANGE','Thay đổi','Actions'), W('MANAGE','Quản lý','Actions'),
  // School (cần 1)
  W('PRINCIPAL','Hiệu trưởng','School'),
  // Job (cần 6)
  W('VETERINARIAN','Bác sĩ thú y','Job'), W('DENTIST','Nha sĩ','Job'),
  W('PHARMACIST','Dược sĩ','Job'), W('PSYCHOLOGIST','Nhà tâm lý học','Job'),
  W('ECONOMIST','Nhà kinh tế','Job'), W('HISTORIAN','Nhà sử học','Job'),
  // Weather (cần 1)
  W('OVERCAST','Trời u ám','Weather'),
  // Clothes (cần 1)
  W('APRON','Tạp dề','Clothes'),
  // Technology (cần 3)
  W('SEMICONDUCTOR','Chất bán dẫn','Technology'), W('PROCESSOR','Bộ vi xử lý','Technology'), W('DISPLAY','Màn hình hiển thị','Technology'),
  // Sport (cần 1)
  W('REFEREE','Trọng tài','Sport'),
  // Nature (cần 1)
  W('TSUNAMI','Sóng thần','Nature'),
  // Health (cần 2)
  W('PHYSICAL THERAPY','Vật lý trị liệu','Health'), W('ACUPUNCTURE','Châm cứu','Health'),
  // Shopping (cần 4)
  W('PRICE TAG','Nhãn giá','Shopping'), W('BARCODE','Mã vạch','Shopping'),
  W('CATALOGUE','Danh mục sản phẩm','Shopping'), W('AUCTION','Đấu giá','Shopping'),
  // DailyRoutine (cần 2)
  W('PODCAST','Nghe podcast','DailyRoutine'), W('NEWSLETTER','Đọc bản tin','DailyRoutine'),
  // Hobby (cần 4)
  W('GENEALOGY','Nghiên cứu gia phả','Hobby'), W('LOCK PICKING','Mở khóa nghề','Hobby'),
  W('BEEKEEPING','Nuôi ong','Hobby'), W('HOMEBREWING','Ủ bia tại nhà','Hobby'),
  // Feelings (cần 3)
  W('AWE','Kính sợ / Choáng ngợp','Feelings'), W('MELANCHOLY','U buồn','Feelings'), W('ELATION','Niềm hân hoan','Feelings'),
  // Holiday (cần 3)
  W('COSTUME PARADE','Diễu hành hóa trang','Holiday'), W('CAROLING','Hát mừng Giáng sinh','Holiday'), W('VIGIL','Lễ vọng','Holiday'),
  // Transportation (cần 1)
  W('FERRY','Phà','Transportation'),
];

async function patch() {
    console.log('🔄 Kết nối...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối thành công!\n');
    await ASLContent.insertMany(PATCHES);
    console.log(`✅ Đã bổ sung ${PATCHES.length} từ vào các topic còn thiếu\n`);

    // Kiểm tra lại
    const topics = [...new Set(PATCHES.map(p => p.topic))];
    for (const t of topics) {
        const cnt = await ASLContent.countDocuments({ type:'word', topic:t });
        const flag = cnt >= 100 ? '✅' : '⚠️ ';
        console.log(`   ${flag} ${t.padEnd(16)}: ${cnt} từ`);
    }
    const total = await ASLContent.countDocuments({ type:'word' });
    console.log(`\n   TỔNG từ vựng: ${total}`);
    await mongoose.disconnect();
    process.exit(0);
}

patch().catch(err => { console.error('❌',err.message); process.exit(1); });
