import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Kết nối MongoDB - Sử dụng SRV connection string với đúng database name
const MONGO_URI = 'mongodb+srv://admin:Demo%40123@cluster0.yyx5afj.mongodb.net/signlanguage_db?appName=Cluster0';

// User Schema (định nghĩa trực tiếp để script độc lập)
const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String, default: '' },
    role: { type: String, default: 'user' },
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Class' }],
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: null },
    isActive: { type: Boolean, default: true },
    studentStats: {
        totalPracticeCount: { type: Number, default: 0 },
        totalAssignmentsCompleted: { type: Number, default: 0 },
        averageScore: { type: Number, default: 0 },
        averageAccuracy: { type: Number, default: 0 },
        totalPracticeTime: { type: Number, default: 0 },
        lastPracticeDate: { type: Date, default: null },
        currentStreak: { type: Number, default: 0 },
        longestStreak: { type: Number, default: 0 }
    },
    commonErrors: [{ type: String, timestamp: { type: Date, default: Date.now } }],
    practicedContent: {
        letters: [{ type: String }],
        words: [{ type: String }],
        sentences: [{ type: String }]
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

// Dữ liệu 8 Giáo Viên
const instructors = [
    { fullName: 'Nguyễn Văn Minh', email: 'minh.nguyen@instructor.edu', username: 'minh.nguyen', password: 'instructor123' },
    { fullName: 'Trần Thị Lan', email: 'lan.tran@instructor.edu', username: 'lan.tran', password: 'instructor123' },
    { fullName: 'Lê Hoàng Nam', email: 'nam.le@instructor.edu', username: 'nam.hoang', password: 'instructor123' },
    { fullName: 'Phạm Thu Hà', email: 'ha.pham@instructor.edu', username: 'ha.pham', password: 'instructor123' },
    { fullName: 'Đặng Minh Tuấn', email: 'tuan.dang@instructor.edu', username: 'tuan.dang', password: 'instructor123' },
    { fullName: 'Bùi Thị Mai', email: 'mai.bui@instructor.edu', username: 'mai.bui', password: 'instructor123' },
    { fullName: 'Hoàng Đức Anh', email: 'anh.hoang@instructor.edu', username: 'anh.hoang', password: 'instructor123' },
    { fullName: 'Vũ Thị Phương', email: 'phuong.vu@instructor.edu', username: 'phuong.vu', password: 'instructor123' }
];

// Dữ liệu 40 Học Viên
const students = [
    // Nhóm Giáo Viên 1: Nguyễn Văn Minh (index 0)
    { fullName: 'Lê Thị Hương', email: 'huong.le@student.edu', username: 'huong.le1', password: 'student123' },
    { fullName: 'Trần Đức Long', email: 'long.tran@student.edu', username: 'long.tran1', password: 'student123' },
    { fullName: 'Phạm Minh Châu', email: 'chau.pham@student.edu', username: 'chau.pham1', password: 'student123' },
    { fullName: 'Ngô Thị Ngọc', email: 'ngoc.ngo@student.edu', username: 'ngoc.ngo1', password: 'student123' },
    { fullName: 'Đỗ Quang Huy', email: 'huy.do@student.edu', username: 'huy.do1', password: 'student123' },
    
    // Nhóm Giáo Viên 2: Trần Thị Lan (index 1)
    { fullName: 'Bùi Thị Hạnh', email: 'hanh.bui@student.edu', username: 'hanh.bui2', password: 'student123' },
    { fullName: 'Hoàng Văn Đức', email: 'duc.hoang@student.edu', username: 'duc.hoang2', password: 'student123' },
    { fullName: 'Vũ Thị Lan Anh', email: 'lanh.vu@student.edu', username: 'lanh.vu2', password: 'student123' },
    { fullName: 'Nguyễn Minh Tuấn', email: 'tuan.nguyen@student.edu', username: 'tuan.nguyen2', password: 'student123' },
    { fullName: 'Trịnh Thị Thanh', email: 'thanh.trinh@student.edu', username: 'thanh.trinh2', password: 'student123' },
    
    // Nhóm Giáo Viên 3: Lê Hoàng Nam (index 2)
    { fullName: 'Phạm Văn Toàn', email: 'toan.pham@student.edu', username: 'toan.pham3', password: 'student123' },
    { fullName: 'Lê Thị Bích', email: 'bich.le@student.edu', username: 'bich.le3', password: 'student123' },
    { fullName: 'Cao Minh Đức', email: 'duc.cao@student.edu', username: 'duc.cao3', password: 'student123' },
    { fullName: 'Đặng Thị Hồng', email: 'hong.dang@student.edu', username: 'hong.dang3', password: 'student123' },
    { fullName: 'Lưu Văn Minh', email: 'minh.luu@student.edu', username: 'minh.luu3', password: 'student123' },
    
    // Nhóm Giáo Viên 4: Phạm Thu Hà (index 3)
    { fullName: 'Trần Văn Hùng', email: 'hung.tran@student.edu', username: 'hung.tran4', password: 'student123' },
    { fullName: 'Nguyễn Thị Phương', email: 'phuong.nguyen@student.edu', username: 'phuong.nguyen4', password: 'student123' },
    { fullName: 'Bùi Đức Anh', email: 'anh.bui@student.edu', username: 'anh.bui4', password: 'student123' },
    { fullName: 'Đỗ Thị Mai', email: 'mai.do@student.edu', username: 'mai.do4', password: 'student123' },
    { fullName: 'Võ Minh Khôi', email: 'khoi.vo@student.edu', username: 'khoi.vo4', password: 'student123' },
    
    // Nhóm Giáo Viên 5: Đặng Minh Tuấn (index 4)
    { fullName: 'Lê Thị Ngân', email: 'ngan.le@student.edu', username: 'ngan.le5', password: 'student123' },
    { fullName: 'Trần Hoàng Nam', email: 'nam.tran@student.edu', username: 'nam.tran5', password: 'student123' },
    { fullName: 'Phạm Văn Thắng', email: 'thang.pham@student.edu', username: 'thang.pham5', password: 'student123' },
    { fullName: 'Ngô Thị Xuân', email: 'xuan.ngo@student.edu', username: 'xuan.ngo5', password: 'student123' },
    { fullName: 'Đặng Đức Minh', email: 'minh.dang@student.edu', username: 'minh.dang5', password: 'student123' },
    
    // Nhóm Giáo Viên 6: Bùi Thị Mai (index 5)
    { fullName: 'Lưu Thị Hà', email: 'ha.luu@student.edu', username: 'ha.luu6', password: 'student123' },
    { fullName: 'Hoàng Văn Phong', email: 'phong.hoang@student.edu', username: 'phong.hoang6', password: 'student123' },
    { fullName: 'Vũ Thị Minh', email: 'minh.vu@student.edu', username: 'minh.vu6', password: 'student123' },
    { fullName: 'Nguyễn Đức Cường', email: 'cuong.nguyen@student.edu', username: 'cuong.nguyen6', password: 'student123' },
    { fullName: 'Trịnh Văn Thành', email: 'thanh.trinh@student.edu', username: 'thanh.trinh6', password: 'student123' },
    
    // Nhóm Giáo Viên 7: Hoàng Đức Anh (index 6)
    { fullName: 'Phạm Thị Hương', email: 'huong.pham@student.edu', username: 'huong.pham7', password: 'student123' },
    { fullName: 'Đặng Văn Bình', email: 'binh.dang@student.edu', username: 'binh.dang7', password: 'student123' },
    { fullName: 'Cao Thị Linh', email: 'linh.cao@student.edu', username: 'linh.cao7', password: 'student123' },
    { fullName: 'Lê Đức Vinh', email: 'vinh.le@student.edu', username: 'vinh.le7', password: 'student123' },
    { fullName: 'Nguyễn Thị Thanh', email: 'thanh.nguyen@student.edu', username: 'thanh.nguyen7', password: 'student123' },
    
    // Nhóm Giáo Viên 8: Vũ Thị Phương (index 7)
    { fullName: 'Bùi Văn Hải', email: 'hai.bui@student.edu', username: 'hai.bui8', password: 'student123' },
    { fullName: 'Trần Thị Yến', email: 'yen.tran@student.edu', username: 'yen.tran8', password: 'student123' },
    { fullName: 'Hoàng Minh Đạt', email: 'dat.hoang@student.edu', username: 'dat.hoang8', password: 'student123' },
    { fullName: 'Võ Thị Thu', email: 'thu.vo@student.edu', username: 'thu.vo8', password: 'student123' },
    { fullName: 'Nguyễn Văn Khánh', email: 'khanh.nguyen@student.edu', username: 'khanh.nguyen8', password: 'student123' }
];

async function seedDatabase() {
    try {
        console.log('🔄 Đang kết nối MongoDB...');
        console.log('📍 Connection string: cluster0 (SRV)');
        
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 30000
        });
        console.log('✅ Kết nối MongoDB thành công!');

        // Xóa tất cả user cũ (tùy chọn - uncomment nếu muốn reset)
        // await User.deleteMany({});
        // console.log('🗑️ Đã xóa tất cả user cũ');

        // Tạo 8 Giáo Viên
        console.log('\n📚 Đang tạo 8 Giáo Viên...');
        const instructorIds = [];
        
        for (const instructor of instructors) {
            // Mã hóa password trước khi lưu
            const hashedPassword = await bcrypt.hash(instructor.password, 10);
            
            const newUser = new User({
                ...instructor,
                password: hashedPassword,
                role: 'instructor'
            });
            
            const savedUser = await newUser.save();
            instructorIds.push(savedUser._id);
            console.log(`   ✅ Đã tạo GV: ${instructor.fullName} (${instructor.username})`);
        }

        // Tạo 40 Học Viên
        console.log('\n👨‍🎓 Đang tạo 40 Học Viên...');
        
        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            // Mỗi 5 học viên thuộc 1 giáo viên
            const instructorIndex = Math.floor(i / 5);
            const instructorId = instructorIds[instructorIndex];
            
            // Mã hóa password
            const hashedPassword = await bcrypt.hash(student.password, 10);
            
            // Tạo student với thông tin ngẫu nhiên
            const newStudent = new User({
                ...student,
                password: hashedPassword,
                role: 'user',
                instructorId: instructorId,
                studentStats: {
                    totalPracticeCount: Math.floor(Math.random() * 50),
                    totalAssignmentsCompleted: Math.floor(Math.random() * 20),
                    averageScore: Math.floor(Math.random() * 40) + 60, // 60-100
                    averageAccuracy: Math.floor(Math.random() * 30) + 70, // 70-100
                    totalPracticeTime: Math.floor(Math.random() * 500),
                    lastPracticeDate: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
                    currentStreak: Math.floor(Math.random() * 15),
                    longestStreak: Math.floor(Math.random() * 60)
                }
            });
            
            await newStudent.save();
            console.log(`   ✅ Đã tạo HV: ${student.fullName} (${student.username}) - GV: ${instructors[instructorIndex].fullName}`);
        }

        console.log('\n========================================');
        console.log('🎉 HOÀN TẤT! Đã tạo thành công!');
        console.log('========================================');
        console.log('📊 Tổng cộng:');
        console.log('   - 8 Giáo Viên (role: instructor)');
        console.log('   - 40 Học Viên (role: user)');
        console.log('\n🔑 Thông tin đăng nhập:');
        console.log('   Giáo Viên: username any, password: instructor123');
        console.log('   Học Viên: username any, password: student123');
        console.log('========================================\n');

        await mongoose.disconnect();
        console.log('👋 Đã ngắt kết nối MongoDB');
        
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        process.exit(1);
    }
}

seedDatabase();
