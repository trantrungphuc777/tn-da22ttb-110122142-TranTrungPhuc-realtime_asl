// Simple seed script - chạy trực tiếp với node
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGO_URI = 'mongodb+srv://admin:Demo%40123@cluster0.yyx5afj.mongodb.net/signlanguage_db?appName=Cluster0';

const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    username: String,
    password: String,
    role: String,
    instructorId: mongoose.Schema.Types.ObjectId,
    avatar: String,
    isActive: Boolean,
    studentStats: {
        totalPracticeCount: Number,
        totalAssignmentsCompleted: Number,
        averageScore: Number,
        averageAccuracy: Number,
        totalPracticeTime: Number,
        lastPracticeDate: Date,
        currentStreak: Number,
        longestStreak: Number
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const instructors = [
    { fullName: 'Nguyễn Văn Minh', email: 'minh.nguyen@instructor.edu', username: 'minh.nguyen', role: 'instructor' },
    { fullName: 'Trần Thị Lan', email: 'lan.tran@instructor.edu', username: 'lan.tran', role: 'instructor' },
    { fullName: 'Lê Hoàng Nam', email: 'nam.le@instructor.edu', username: 'nam.hoang', role: 'instructor' },
    { fullName: 'Phạm Thu Hà', email: 'ha.pham@instructor.edu', username: 'ha.pham', role: 'instructor' },
    { fullName: 'Đặng Minh Tuấn', email: 'tuan.dang@instructor.edu', username: 'tuan.dang', role: 'instructor' },
    { fullName: 'Bùi Thị Mai', email: 'mai.bui@instructor.edu', username: 'mai.bui', role: 'instructor' },
    { fullName: 'Hoàng Đức Anh', email: 'anh.hoang@instructor.edu', username: 'anh.hoang', role: 'instructor' },
    { fullName: 'Vũ Thị Phương', email: 'phuong.vu@instructor.edu', username: 'phuong.vu', role: 'instructor' }
];

const students = [
    { fullName: 'Lê Thị Hương', email: 'huong.le@student.edu', username: 'huong.le1' },
    { fullName: 'Trần Đức Long', email: 'long.tran@student.edu', username: 'long.tran1' },
    { fullName: 'Phạm Minh Châu', email: 'chau.pham@student.edu', username: 'chau.pham1' },
    { fullName: 'Ngô Thị Ngọc', email: 'ngoc.ngo@student.edu', username: 'ngoc.ngo1' },
    { fullName: 'Đỗ Quang Huy', email: 'huy.do@student.edu', username: 'huy.do1' },
    { fullName: 'Bùi Thị Hạnh', email: 'hanh.bui@student.edu', username: 'hanh.bui2' },
    { fullName: 'Hoàng Văn Đức', email: 'duc.hoang@student.edu', username: 'duc.hoang2' },
    { fullName: 'Vũ Thị Lan Anh', email: 'lanh.vu@student.edu', username: 'lanh.vu2' },
    { fullName: 'Nguyễn Minh Tuấn', email: 'tuan.nguyen@student.edu', username: 'tuan.nguyen2' },
    { fullName: 'Trịnh Thị Thanh', email: 'thanh.trinh@student.edu', username: 'thanh.trinh2' },
    { fullName: 'Phạm Văn Toàn', email: 'toan.pham@student.edu', username: 'toan.pham3' },
    { fullName: 'Lê Thị Bích', email: 'bich.le@student.edu', username: 'bich.le3' },
    { fullName: 'Cao Minh Đức', email: 'duc.cao@student.edu', username: 'duc.cao3' },
    { fullName: 'Đặng Thị Hồng', email: 'hong.dang@student.edu', username: 'hong.dang3' },
    { fullName: 'Lưu Văn Minh', email: 'minh.luu@student.edu', username: 'minh.luu3' },
    { fullName: 'Trần Văn Hùng', email: 'hung.tran@student.edu', username: 'hung.tran4' },
    { fullName: 'Nguyễn Thị Phương', email: 'phuong.nguyen@student.edu', username: 'phuong.nguyen4' },
    { fullName: 'Bùi Đức Anh', email: 'anh.bui@student.edu', username: 'anh.bui4' },
    { fullName: 'Đỗ Thị Mai', email: 'mai.do@student.edu', username: 'mai.do4' },
    { fullName: 'Võ Minh Khôi', email: 'khoi.vo@student.edu', username: 'khoi.vo4' },
    { fullName: 'Lê Thị Ngân', email: 'ngan.le@student.edu', username: 'ngan.le5' },
    { fullName: 'Trần Hoàng Nam', email: 'nam.tran@student.edu', username: 'nam.tran5' },
    { fullName: 'Phạm Văn Thắng', email: 'thang.pham@student.edu', username: 'thang.pham5' },
    { fullName: 'Ngô Thị Xuân', email: 'xuan.ngo@student.edu', username: 'xuan.ngo5' },
    { fullName: 'Đặng Đức Minh', email: 'minh.dang@student.edu', username: 'minh.dang5' },
    { fullName: 'Lưu Thị Hà', email: 'ha.luu@student.edu', username: 'ha.luu6' },
    { fullName: 'Hoàng Văn Phong', email: 'phong.hoang@student.edu', username: 'phong.hoang6' },
    { fullName: 'Vũ Thị Minh', email: 'minh.vu@student.edu', username: 'minh.vu6' },
    { fullName: 'Nguyễn Đức Cường', email: 'cuong.nguyen@student.edu', username: 'cuong.nguyen6' },
    { fullName: 'Trịnh Văn Thành', email: 'thanh.trinh@student.edu', username: 'thanh.trinh6' },
    { fullName: 'Phạm Thị Hương', email: 'huong.pham@student.edu', username: 'huong.pham7' },
    { fullName: 'Đặng Văn Bình', email: 'binh.dang@student.edu', username: 'binh.dang7' },
    { fullName: 'Cao Thị Linh', email: 'linh.cao@student.edu', username: 'linh.cao7' },
    { fullName: 'Lê Đức Vinh', email: 'vinh.le@student.edu', username: 'vinh.le7' },
    { fullName: 'Nguyễn Thị Thanh', email: 'thanh.nguyen@student.edu', username: 'thanh.nguyen7' },
    { fullName: 'Bùi Văn Hải', email: 'hai.bui@student.edu', username: 'hai.bui8' },
    { fullName: 'Trần Thị Yến', email: 'yen.tran@student.edu', username: 'yen.tran8' },
    { fullName: 'Hoàng Minh Đạt', email: 'dat.hoang@student.edu', username: 'dat.hoang8' },
    { fullName: 'Võ Thị Thu', email: 'thu.vo@student.edu', username: 'thu.vo8' },
    { fullName: 'Nguyễn Văn Khánh', email: 'khanh.nguyen@student.edu', username: 'khanh.nguyen8' }
];

async function seed() {
    try {
        console.log('🔄 Đang kết nối MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối thành công!');

        const hashedInstructorPassword = await bcrypt.hash('instructor123', 10);
        const hashedStudentPassword = await bcrypt.hash('student123', 10);

        console.log('\n📚 Đang tạo 8 Giáo Viên...');
        const instructorIds = [];

        for (const instructor of instructors) {
            const existing = await User.findOne({ $or: [{ email: instructor.email }, { username: instructor.username }] });
            if (existing) {
                console.log(`   ⚠️ Đã tồn tại: ${instructor.fullName}`);
                instructorIds.push(existing._id);
            } else {
                instructor.password = hashedInstructorPassword;
                instructor.avatar = '';
                instructor.isActive = true;
                const user = await User.create(instructor);
                instructorIds.push(user._id);
                console.log(`   ✅ Đã tạo GV: ${instructor.fullName}`);
            }
        }

        console.log('\n👨‍🎓 Đang tạo 40 Học Viên...');

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const instructorIndex = Math.floor(i / 5);

            const existing = await User.findOne({ $or: [{ email: student.email }, { username: student.username }] });
            if (existing) {
                console.log(`   ⚠️ Đã tồn tại: ${student.fullName}`);
            } else {
                student.password = hashedStudentPassword;
                student.role = 'user';
                student.instructorId = instructorIds[instructorIndex];
                student.avatar = '';
                student.isActive = true;
                student.studentStats = {
                    totalPracticeCount: Math.floor(Math.random() * 50),
                    totalAssignmentsCompleted: Math.floor(Math.random() * 20),
                    averageScore: Math.floor(Math.random() * 40) + 60,
                    averageAccuracy: Math.floor(Math.random() * 30) + 70,
                    totalPracticeTime: Math.floor(Math.random() * 500),
                    lastPracticeDate: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
                    currentStreak: Math.floor(Math.random() * 15),
                    longestStreak: Math.floor(Math.random() * 60)
                };
                await User.create(student);
                console.log(`   ✅ Đã tạo HV: ${student.fullName}`);
            }
        }

        console.log('\n🎉 HOÀN TẤT! Đã tạo 8 Giáo Viên + 40 Học Viên!');
        console.log('🔑 Password GV: instructor123, HV: student123');

        await mongoose.disconnect();
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

seed();
