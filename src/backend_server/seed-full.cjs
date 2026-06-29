/**
 * SEED FULL DATA - Theo đúng USER.md
 * 8 Giáo Viên + 169 Học Viên
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb://admin:Demo%40123@ac-ab0jgsf-shard-00-00.yyx5afj.mongodb.net:27017,ac-ab0jgsf-shard-00-01.yyx5afj.mongodb.net:27017,ac-ab0jgsf-shard-00-02.yyx5afj.mongodb.net/signlanguage_db?authSource=admin&ssl=true';

const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    username: String,
    password: String,
    role: String,
    instructorId: mongoose.Schema.Types.ObjectId,
    avatar: String,
    isActive: Boolean,
    studentStats: Object
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function seed() {
    try {
        console.log('🔄 Đang kết nối MongoDB Atlas...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối thành công!\n');

        const hashedInstructorPassword = await bcrypt.hash('instructor123', 10);
        const hashedStudentPassword = await bcrypt.hash('student123', 10);

        // 8 GIÁO VIÊN
        const instructors = [
            { fullName: 'Bùi Thị Mai', email: 'mai.bui@instructor.edu', username: 'mai.bui' },
            { fullName: 'Đặng Minh Tuấn', email: 'tuan.dang@instructor.edu', username: 'tuan.dang' },
            { fullName: 'Hoàng Đức Anh', email: 'anh.hoang@instructor.edu', username: 'anh.hoang' },
            { fullName: 'Lê Hoàng Nam', email: 'nam.le@instructor.edu', username: 'nam.hoang' },
            { fullName: 'Nguyễn Văn Minh', email: 'minh.nguyen@instructor.edu', username: 'minh.nguyen' },
            { fullName: 'Phạm Thu Hà', email: 'ha.pham@instructor.edu', username: 'ha.pham' },
            { fullName: 'Trần Thị Lan', email: 'lan.tran@instructor.edu', username: 'lan.tran' },
            { fullName: 'Vũ Thị Phương', email: 'phuong.vu@instructor.edu', username: 'phuong.vu' }
        ];

        // TẠO GIÁO VIÊN
        console.log('👨‍🏫 Đang tạo 8 Giáo Viên...\n');
        const instructorIds = [];

        for (const instructor of instructors) {
            const existing = await User.findOne({ $or: [{ email: instructor.email }, { username: instructor.username }] });
            if (existing) {
                console.log(`   ⚠️ Đã tồn tại: ${instructor.fullName}`);
                instructorIds.push(existing._id);
            } else {
                const user = await User.create({
                    ...instructor,
                    password: hashedInstructorPassword,
                    role: 'instructor',
                    avatar: '',
                    isActive: true
                });
                instructorIds.push(user._id);
                console.log(`   ✅ Đã tạo GV: ${instructor.fullName}`);
            }
        }

        // HỌC VIÊN THEO BLOCK - mỗi block 20 học viên cho 1 giáo viên
        const studentBlocks = [
            // Block 0: GV1 - Bùi Thị Mai (20 students)
            [
                { fullName: 'Bùi Đức Anh', email: 'anh.bui@student.edu', username: 'anh.bui4' },
                { fullName: 'Bùi Văn Minh', email: 'minh.bui2@student2.edu', username: 'minh.bui17' },
                { fullName: 'Cao Văn Minh', email: 'minh.cao2@student2.edu', username: 'minh.cao17' },
                { fullName: 'Đặng Thị Hạnh', email: 'hanh.dang2@student2.edu', username: 'hanh.dang17' },
                { fullName: 'Đặng Thị Hường', email: 'huong.dang2@student2.edu', username: 'huong.dang17' },
                { fullName: 'Đặng Văn Trung', email: 'trung.dang2@student2.edu', username: 'trung.dang17' },
                { fullName: 'Đỗ Thị Mai', email: 'mai.do@student.edu', username: 'mai.do4' },
                { fullName: 'Hoàng Thị Hà', email: 'ha.hoang2@student2.edu', username: 'ha.hoang17' },
                { fullName: 'Hoàng Thị Thanh', email: 'thanh.hoang3@student2.edu', username: 'thanh.hoang17' },
                { fullName: 'Lê Thị Thanh', email: 'thanh.le2@student2.edu', username: 'thanh.le17' },
                { fullName: 'Lê Văn Trung', email: 'trung.le2@student2.edu', username: 'trung.le17' },
                { fullName: 'Lưu Thị Thanh', email: 'thanh.luu2@student2.edu', username: 'thanh.luu17' },
                { fullName: 'Lưu Văn Minh', email: 'minh.luu@student.edu', username: 'minh.luu3' },
                { fullName: 'Nguyễn Thị Phương', email: 'phuong.nguyen@student.edu', username: 'phuong.nguyen4' },
                { fullName: 'Phạm Văn Bảo', email: 'bao.pham2@student2.edu', username: 'bao.pham17' },
                { fullName: 'Trần Văn Đạt', email: 'dat.tran2@student2.edu', username: 'dat.tran17' },
                { fullName: 'Trần Văn Hùng', email: 'hung.tran@student.edu', username: 'hung.tran4' },
                { fullName: 'Vũ Thị Hạnh', email: 'hanh.vu2@student2.edu', username: 'hanh.vu17' },
                { fullName: 'Vũ Văn Nam', email: 'nam.vu@student2.edu', username: 'nam.vu17' },
                { fullName: 'Vũ Văn Quốc', email: 'quoc.vu2@student2.edu', username: 'quoc.vu17' }
            ],
            // Block 1: GV2 - Đặng Minh Tuấn (20 students)
            [
                { fullName: 'Bùi Thị Ngọc', email: 'ngoc.bui2@student2.edu', username: 'ngoc.bui17' },
                { fullName: 'Bùi Văn Hải', email: 'hai.bui@student.edu', username: 'hai.bui8' },
                { fullName: 'Cao Văn Đức', email: 'duc.cao2@student2.edu', username: 'duc.cao17' },
                { fullName: 'Đỗ Thị Hồng', email: 'hong.do2@student2.edu', username: 'hong.do17' },
                { fullName: 'Đỗ Văn Hùng', email: 'hung.do2@student2.edu', username: 'hung.do17' },
                { fullName: 'Hoàng Minh Đạt', email: 'dat.hoang@student.edu', username: 'dat.hoang8' },
                { fullName: 'Lưu Thị Mai', email: 'mai.luu2@student2.edu', username: 'mai.luu17' },
                { fullName: 'Lưu Văn Đức', email: 'duc.luu2@student2.edu', username: 'duc.luu17' },
                { fullName: 'Ngô Thị Hương', email: 'huong.ngo2@student2.edu', username: 'huong.ngo17' },
                { fullName: 'Ngô Văn Bình', email: 'binh.ngo2@student2.edu', username: 'binh.ngo17' },
                { fullName: 'Ngô Văn Đức', email: 'duc.ngo2@student2.edu', username: 'duc.ngo17' },
                { fullName: 'Nguyễn Văn Hùng', email: 'hung.nguyen3@student2.edu', username: 'hung.nguyen17' },
                { fullName: 'Nguyễn Văn Khánh', email: 'khanh.nguyen@student.edu', username: 'khanh.nguyen8' },
                { fullName: 'Nguyễn Văn Tân', email: 'tan.nguyen2@student2.edu', username: 'tan.nguyen17' },
                { fullName: 'Phạm Thị Loan', email: 'loan.pham2@student2.edu', username: 'loan.pham17' },
                { fullName: 'Phạm Văn Nam', email: 'nam.pham2@student2.edu', username: 'nam.pham17' },
                { fullName: 'Phạm Văn Thắng', email: 'thang.pham2@student2.edu', username: 'thang.pham17' },
                { fullName: 'Trần Thị Yến', email: 'yen.tran@student.edu', username: 'yen.tran8' },
                { fullName: 'Trịnh Văn Hải', email: 'hai.trinh2@student2.edu', username: 'hai.trinh17' },
                { fullName: 'Võ Thị Thu', email: 'thu.vo@student.edu', username: 'thu.vo8' }
            ],
            // Block 2: GV3 - Hoàng Đức Anh (25 students)
            [
                { fullName: 'Bùi Văn Đức', email: 'duc.bui2@student2.edu', username: 'duc.bui17' },
                { fullName: 'Cao Thị Phương', email: 'phuong.cao2@student2.edu', username: 'phuong.cao17' },
                { fullName: 'Đặng Thị Yến', email: 'yen.dang2@student2.edu', username: 'yen.dang17' },
                { fullName: 'Hoàng Thị Lan', email: 'lan.hoang2@student2.edu', username: 'lan.hoang17' },
                { fullName: 'Hoàng Thị Oanh', email: 'oanh.hoang2@student2.edu', username: 'oanh.hoang17' },
                { fullName: 'Hoàng Văn Minh', email: 'minh.hoang@student2.edu', username: 'minh.hoang17' },
                { fullName: 'Hoàng Văn Thắng', email: 'thang.hoang2@student2.edu', username: 'thang.hoang17' },
                { fullName: 'Lê Minh Tuấn', email: 'tuan.le@student2.edu', username: 'tuan.le17' },
                { fullName: 'Lê Thị Dung', email: 'dung.le2@student2.edu', username: 'dung.le17' },
                { fullName: 'Lê Thị Hương', email: 'huong.le@student.edu', username: 'huong.le1' },
                { fullName: 'Lê Văn Minh', email: 'minh.le2@student2.edu', username: 'minh.le17' },
                { fullName: 'Lê Văn Phong', email: 'phong.le2@student2.edu', username: 'phong.le17' },
                { fullName: 'Ngô Thị Ngọc', email: 'ngoc.ngo@student.edu', username: 'ngoc.ngo1' },
                { fullName: 'Nguyễn Thị Hương', email: 'huong.nguyen2@student2.edu', username: 'huong.nguyen17' },
                { fullName: 'Nguyễn Thị Liên', email: 'lien.nguyen2@student2.edu', username: 'lien.nguyen17' },
                { fullName: 'Phạm Minh Châu', email: 'chau.pham@student.edu', username: 'chau.pham1' },
                { fullName: 'Phạm Văn Đức', email: 'duc.pham@student2.edu', username: 'duc.pham17' },
                { fullName: 'Trần Đức Long', email: 'long.tran@student.edu', username: 'long.tran1' },
                { fullName: 'Trần Thị Mai', email: 'mai.tran@student2.edu', username: 'mai.tran17' },
                { fullName: 'Trần Thị Thu', email: 'thu.tran2@student2.edu', username: 'thu.tran17' },
                { fullName: 'Trần Văn Toàn', email: 'toan.tran2@student2.edu', username: 'toan.tran17' },
                { fullName: 'Vũ Thị Hà', email: 'ha.vu2@student2.edu', username: 'ha.vu17' },
                { fullName: 'Vũ Văn Dương', email: 'duong.vu2@student2.edu', username: 'duong.vu17' },
                { fullName: 'Vũ Văn Thành', email: 'thanh.vu2@student2.edu', username: 'thanh.vu17' }
            ],
            // Block 3: GV4 - Lê Hoàng Nam (20 students)
            [
                { fullName: 'Bùi Văn Phú', email: 'phu.bui2@student2.edu', username: 'phu.bui17' },
                { fullName: 'Cao Thị Hà', email: 'ha.cao2@student2.edu', username: 'ha.cao17' },
                { fullName: 'Đặng Đức Minh', email: 'minh.dang@student.edu', username: 'minh.dang5' },
                { fullName: 'Đặng Thị Lan', email: 'lan.dang2@student2.edu', username: 'lan.dang17' },
                { fullName: 'Đỗ Thị Thơ', email: 'tho.do@student2.edu', username: 'tho.do17' },
                { fullName: 'Đỗ Văn Thành', email: 'thanh.do2@student2.edu', username: 'thanh.do17' },
                { fullName: 'Hoàng Văn Lợi', email: 'loi.hoang2@student2.edu', username: 'loi.hoang17' },
                { fullName: 'Hoàng Văn Phong', email: 'phong.hoang@student.edu', username: 'phong.hoang6' },
                { fullName: 'Lê Thị Ngọc', email: 'ngoc.le2@student2.edu', username: 'ngoc.le17' },
                { fullName: 'Lê Văn Thái', email: 'thai.le2@student2.edu', username: 'thai.le17' },
                { fullName: 'Lưu Thị Hà', email: 'ha.luu@student.edu', username: 'ha.luu6' },
                { fullName: 'Lưu Văn Quang', email: 'quang.luu2@student2.edu', username: 'quang.luu17' },
                { fullName: 'Nguyễn Đức Cường', email: 'cuong.nguyen@student.edu', username: 'cuong.nguyen6' },
                { fullName: 'Nguyễn Thị Lan', email: 'lan.nguyen3@student2.edu', username: 'lan.nguyen17' },
                { fullName: 'Nguyễn Văn Sơn', email: 'son.nguyen2@student2.edu', username: 'son.nguyen17' },
                { fullName: 'Phạm Văn Dũng', email: 'dung.pham2@student2.edu', username: 'dung.pham17' },
                { fullName: 'Trần Thị Huyền', email: 'huyen.tran2@student2.edu', username: 'huyen.tran17' },
                { fullName: 'Trần Văn Hưng', email: 'hung.tran2@student2.edu', username: 'hung.tran17' },
                { fullName: 'Trịnh Văn Tuấn', email: 'tuan.trinh2@student2.edu', username: 'tuan.trinh17' },
                { fullName: 'Vũ Thị Minh', email: 'minh.vu@student.edu', username: 'minh.vu6' }
            ],
            // Block 4: GV5 - Nguyễn Văn Minh (20 students)
            [
                { fullName: 'Bùi Văn Quang', email: 'quang.bui@student2.edu', username: 'quang.bui17' },
                { fullName: 'Cao Thị Hương', email: 'huong.cao2@student2.edu', username: 'huong.cao17' },
                { fullName: 'Cao Thị Linh', email: 'linh.cao2@student2.edu', username: 'linh.cao17' },
                { fullName: 'Đỗ Thị Kim', email: 'kim.do2@student2.edu', username: 'kim.do17' },
                { fullName: 'Hoàng Thị Hương', email: 'huong.hoang2@student2.edu', username: 'huong.hoang17' },
                { fullName: 'Lê Thị Ngân', email: 'ngan.le@student.edu', username: 'ngan.le5' },
                { fullName: 'Lê Văn Đạt', email: 'dat.le2@student2.edu', username: 'dat.le17' },
                { fullName: 'Lưu Thị Nga', email: 'nga.luu@student2.edu', username: 'nga.luu17' },
                { fullName: 'Lưu Văn Thắng', email: 'thang.luu2@student2.edu', username: 'thang.luu17' },
                { fullName: 'Ngô Thị Hồng', email: 'hong.ngo2@student2.edu', username: 'hong.ngo17' },
                { fullName: 'Ngô Thị Xuân', email: 'xuan.ngo@student.edu', username: 'xuan.ngo5' },
                { fullName: 'Ngô Thị Xuân', email: 'xuan.ngo2@student2.edu', username: 'xuan.ngo17' },
                { fullName: 'Nguyễn Văn Thắng', email: 'thang.nguyen2@student2.edu', username: 'thang.nguyen17' },
                { fullName: 'Phạm Thị Phượng', email: 'phuong.pham2@student2.edu', username: 'phuong.pham17' },
                { fullName: 'Phạm Văn Thắng', email: 'thang.pham@student.edu', username: 'thang.pham5' },
                { fullName: 'Trần Hoàng Nam', email: 'nam.tran@student.edu', username: 'nam.tran5' },
                { fullName: 'Trịnh Văn Duy', email: 'duy.trinh2@student2.edu', username: 'duy.trinh17' },
                { fullName: 'Trịnh Văn Phúc', email: 'phuc.trinh@student2.edu', username: 'phuc.trinh17' },
                { fullName: 'Võ Minh Khôi', email: 'khoi.vo@student.edu', username: 'khoi.vo4' },
                { fullName: 'Vũ Văn Hoàng', email: 'hoang.vu2@student2.edu', username: 'hoang.vu17' }
            ],
            // Block 5: GV6 - Phạm Thu Hà (24 students)
            [
                { fullName: 'Bùi Thị Hạnh', email: 'hanh.bui@student.edu', username: 'hanh.bui2' },
                { fullName: 'Bùi Thị Phương', email: 'phuong.bui@student2.edu', username: 'phuong.bui17' },
                { fullName: 'Bùi Thị Trang', email: 'trang.bui2@student2.edu', username: 'trang.bui17' },
                { fullName: 'Bùi Văn Tuấn', email: 'tuan.bui2@student2.edu', username: 'tuan.bui17' },
                { fullName: 'Cao Thị Nga', email: 'nga.cao2@student2.edu', username: 'nga.cao17' },
                { fullName: 'Cao Văn Long', email: 'long.cao2@student2.edu', username: 'long.cao17' },
                { fullName: 'Cao Văn Thành', email: 'thanh.cao@student2.edu', username: 'thanh.cao17' },
                { fullName: 'Đặng Văn Hùng', email: 'hung.dang@student2.edu', username: 'hung.dang17' },
                { fullName: 'Đặng Văn Lâm', email: 'lam.dang2@student2.edu', username: 'lam.dang17' },
                { fullName: 'Đỗ Quang Huy', email: 'huy.do@student.edu', username: 'huy.do1' },
                { fullName: 'Đỗ Văn Sơn', email: 'son.do2@student2.edu', username: 'son.do17' },
                { fullName: 'Hoàng Văn Đức', email: 'duc.hoang@student.edu', username: 'duc.hoang2' },
                { fullName: 'Lưu Văn Sơn', email: 'son.luu2@student2.edu', username: 'son.luu17' },
                { fullName: 'Ngô Thị Hà', email: 'ha.ngo2@student2.edu', username: 'ha.ngo17' },
                { fullName: 'Ngô Thị Thanh', email: 'thanh.ngo2@student2.edu', username: 'thanh.ngo17' },
                { fullName: 'Ngô Văn Hưng', email: 'hung.ngo2@student2.edu', username: 'hung.ngo17' },
                { fullName: 'Nguyễn Minh Tuấn', email: 'tuan.nguyen@student.edu', username: 'tuan.nguyen2' },
                { fullName: 'Phạm Thị Hà', email: 'ha.pham2@student2.edu', username: 'ha.pham17' },
                { fullName: 'Trịnh Thị Kim', email: 'kim.trinh2@student2.edu', username: 'kim.trinh17' },
                { fullName: 'Trịnh Thị Yến', email: 'yen.trinh2@student2.edu', username: 'yen.trinh17' },
                { fullName: 'Trịnh Văn Hùng', email: 'hung.trinh2@student2.edu', username: 'hung.trinh17' },
                { fullName: 'Trịnh Văn Lâm', email: 'lam.trinh2@student2.edu', username: 'lam.trinh17' },
                { fullName: 'Vũ Thị Lan', email: 'lan.vu2@student2.edu', username: 'lan.vu17' },
                { fullName: 'Vũ Thị Lan Anh', email: 'lanh.vu@student.edu', username: 'lanh.vu2' }
            ],
            // Block 6: GV7 - Trần Thị Lan (20 students)
            [
                { fullName: 'Cao Minh Đức', email: 'duc.cao@student.edu', username: 'duc.cao3' },
                { fullName: 'Đặng Thị Hồng', email: 'hong.dang@student.edu', username: 'hong.dang3' },
                { fullName: 'Đỗ Thị Minh', email: 'minh.do2@student2.edu', username: 'minh.do17' },
                { fullName: 'Đỗ Văn Khôi', email: 'khoi.do2@student2.edu', username: 'khoi.do17' },
                { fullName: 'Đỗ Văn Thắng', email: 'thang.do2@student2.edu', username: 'thang.do17' },
                { fullName: 'Lê Thị Bích', email: 'bich.le@student.edu', username: 'bich.le3' },
                { fullName: 'Lê Thị Thuỷ', email: 'thuy.le2@student2.edu', username: 'thuy.le17' },
                { fullName: 'Lưu Thị Hạnh', email: 'hanh.luu2@student2.edu', username: 'hanh.luu17' },
                { fullName: 'Lưu Văn Khánh', email: 'khanh.luu@student2.edu', username: 'khanh.luu17' },
                { fullName: 'Ngô Thị Thu', email: 'thu.ngo2@student2.edu', username: 'thu.ngo17' },
                { fullName: 'Nguyễn Thị Ngân', email: 'ngan.nguyen2@student2.edu', username: 'ngan.nguyen17' },
                { fullName: 'Nguyễn Thị Trang', email: 'trang.nguyen2@student2.edu', username: 'trang.nguyen17' },
                { fullName: 'Nguyễn Văn Thành', email: 'thanh.nguyen2@student2.edu', username: 'thanh.nguyen17' },
                { fullName: 'Phạm Thị Hoa', email: 'hoa.pham2@student2.edu', username: 'hoa.pham17' },
                { fullName: 'Phạm Thị Thanh', email: 'thanh.pham2@student2.edu', username: 'thanh.pham17' },
                { fullName: 'Phạm Văn Toàn', email: 'toan.pham@student.edu', username: 'toan.pham3' },
                { fullName: 'Phạm Văn Tùng', email: 'tung.pham2@student2.edu', username: 'tung.pham17' },
                { fullName: 'Trần Thị Phương', email: 'phuong.tran3@student2.edu', username: 'phuong.tran17' },
                { fullName: 'Trần Văn Tiến', email: 'tien.tran2@student2.edu', username: 'tien.tran17' },
                { fullName: 'Trịnh Thị Thanh', email: 'thanh.trinh@student.edu', username: 'thanh.trinh2' }
            ],
            // Block 7: GV8 - Vũ Thị Phương (20 students)
            [
                { fullName: 'Bùi Thị Thanh', email: 'thanh.bui2@student2.edu', username: 'thanh.bui17' },
                { fullName: 'Bùi Văn Kiên', email: 'kien.bui2@student2.edu', username: 'kien.bui17' },
                { fullName: 'Cao Thị Linh', email: 'linh.cao@student.edu', username: 'linh.cao7' },
                { fullName: 'Cao Thị My', email: 'my.cao2@student2.edu', username: 'my.cao17' },
                { fullName: 'Cao Văn Hùng', email: 'hung.cao2@student2.edu', username: 'hung.cao17' },
                { fullName: 'Đặng Thị Oanh', email: 'oanh.dang2@student2.edu', username: 'oanh.dang17' },
                { fullName: 'Đặng Văn Bình', email: 'binh.dang@student.edu', username: 'binh.dang7' },
                { fullName: 'Đặng Văn Thành', email: 'thanh.dang3@student2.edu', username: 'thanh.dang17' },
                { fullName: 'Đặng Văn Thắng', email: 'thang.dang2@student2.edu', username: 'thang.dang17' },
                { fullName: 'Hoàng Thị Bích', email: 'bich.hoang2@student2.edu', username: 'bich.hoang17' },
                { fullName: 'Hoàng Văn Trí', email: 'tri.hoang2@student2.edu', username: 'tri.hoang17' },
                { fullName: 'Lê Đức Vinh', email: 'vinh.le@student.edu', username: 'vinh.le7' },
                { fullName: 'Lê Thị Hà', email: 'ha.le2@student2.edu', username: 'ha.le17' },
                { fullName: 'Nguyễn Thị Thanh', email: 'thanh.nguyen@student.edu', username: 'thanh.nguyen7' },
                { fullName: 'Phạm Thị Hương', email: 'huong.pham@student.edu', username: 'huong.pham7' },
                { fullName: 'Phạm Thị Nga', email: 'nga.pham2@student2.edu', username: 'nga.pham17' },
                { fullName: 'Trần Văn Dũng', email: 'dung.tran2@student2.edu', username: 'dung.tran17' },
                { fullName: 'Trịnh Thị Hương', email: 'huong.trinh2@student2.edu', username: 'huong.trinh17' },
                { fullName: 'Vũ Thị Phương', email: 'phuong.vu2@student2.edu', username: 'phuong.vu17' },
                { fullName: 'Vũ Văn Bảo', email: 'bao.vu2@student2.edu', username: 'bao.vu17' }
            ]
        ];

        // TÍNH TỔNG
        const totalStudents = studentBlocks.reduce((sum, block) => sum + block.length, 0);
        console.log(`\n👨‍🎓 Đang tạo ${totalStudents} Học Viên...\n`);

        let created = 0;
        let existing = 0;
        let updated = 0;

        for (let blockIdx = 0; blockIdx < studentBlocks.length; blockIdx++) {
            const block = studentBlocks[blockIdx];
            const instructorId = instructorIds[blockIdx];

            console.log(`\n📚 Block ${blockIdx + 1} - ${instructors[blockIdx].fullName} (${block.length} học viên)`);

            for (const student of block) {
                const existingStudent = await User.findOne({ $or: [{ email: student.email }, { username: student.username }] });
                if (existingStudent) {
                    // Kiểm tra instructorId
                    if (!existingStudent.instructorId || String(existingStudent.instructorId) !== String(instructorId)) {
                        await User.updateOne({ _id: existingStudent._id }, { $set: { instructorId: instructorId } });
                        updated++;
                        console.log(`   🔄 ${student.fullName} -> GV: ${instructors[blockIdx].fullName}`);
                    } else {
                        existing++;
                    }
                } else {
                    await User.create({
                        ...student,
                        password: hashedStudentPassword,
                        role: 'user',
                        instructorId: instructorId,
                        avatar: '',
                        isActive: true,
                        studentStats: {
                            totalPracticeCount: Math.floor(Math.random() * 50) + 10,
                            totalAssignmentsCompleted: Math.floor(Math.random() * 20) + 5,
                            averageScore: Math.floor(Math.random() * 30) + 70,
                            averageAccuracy: Math.floor(Math.random() * 20) + 80,
                            totalPracticeTime: Math.floor(Math.random() * 500) + 100,
                            lastPracticeDate: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
                            currentStreak: Math.floor(Math.random() * 7),
                            longestStreak: Math.floor(Math.random() * 14) + 3
                        }
                    });
                    created++;
                    console.log(`   ✅ ${student.fullName}`);
                }
            }
        }

        // THỐNG KÊ CUỐI
        console.log('\n========================================');
        console.log('🎉 HOÀN TẤT SEED DỮ LIỆU!');
        console.log('========================================');

        const totalStudentsNow = await User.countDocuments({ role: 'user' });
        const totalInstructorsNow = await User.countDocuments({ role: 'instructor' });

        console.log(`\n📊 THỐNG KÊ:`);
        console.log(`   Tổng Giáo Viên: ${totalInstructorsNow}`);
        console.log(`   Tổng Học Viên: ${totalStudentsNow}`);
        console.log(`   Học viên mới tạo: ${created}`);
        console.log(`   Học viên đã tồn tại: ${existing}`);
        console.log(`   Học viên cập nhật GV: ${updated}`);

        console.log(`\n📋 PHÂN BỔ THEO GIÁO VIÊN:`);
        for (let i = 0; i < instructors.length; i++) {
            const count = await User.countDocuments({ instructorId: instructorIds[i], role: 'user' });
            console.log(`   ${i + 1}. ${instructors[i].fullName} (${instructors[i].username}): ${count} học viên`);
        }

        console.log('\n🔑 THÔNG TIN ĐĂNG NHẬP:');
        console.log('   Giáo Viên: username, password: instructor123');
        console.log('   Học Viên: username, password: student123');
        console.log('========================================\n');

        await mongoose.disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

seed();
