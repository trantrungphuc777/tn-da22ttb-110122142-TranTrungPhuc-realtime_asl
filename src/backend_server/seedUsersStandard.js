import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';

// Standard connection string (không qua SRV)
const uri = 'mongodb://admin:Demo%40123@cluster0-shard-00-00.yyx5afj.mongodb.net:27017,cluster0-shard-00-01.yyx5afj.mongodb.net:27017,cluster0-shard-00-02.yyx5afj.mongodb.net:27017/signlanguage_db?authSource=admin&ssl=true&replicaSet=atlas-cluster0-shard-0';
const dbName = 'signlanguage_db';

async function seedDatabase() {
    const client = new MongoClient(uri);
    
    try {
        console.log('🔄 Đang kết nối MongoDB (Standard)...');
        await client.connect();
        console.log('✅ Kết nối thành công!');

        const db = client.db(dbName);
        const usersCollection = db.collection('users');

        const hashedInstructorPassword = await bcrypt.hash('instructor123', 10);
        const hashedStudentPassword = await bcrypt.hash('student123', 10);

        const instructors = [
            { fullName: 'Nguyễn Văn Minh', email: 'minh.nguyen@instructor.edu', username: 'minh.nguyen', password: hashedInstructorPassword, role: 'instructor' },
            { fullName: 'Trần Thị Lan', email: 'lan.tran@instructor.edu', username: 'lan.tran', password: hashedInstructorPassword, role: 'instructor' },
            { fullName: 'Lê Hoàng Nam', email: 'nam.le@instructor.edu', username: 'nam.hoang', password: hashedInstructorPassword, role: 'instructor' },
            { fullName: 'Phạm Thu Hà', email: 'ha.pham@instructor.edu', username: 'ha.pham', password: hashedInstructorPassword, role: 'instructor' },
            { fullName: 'Đặng Minh Tuấn', email: 'tuan.dang@instructor.edu', username: 'tuan.dang', password: hashedInstructorPassword, role: 'instructor' },
            { fullName: 'Bùi Thị Mai', email: 'mai.bui@instructor.edu', username: 'mai.bui', password: hashedInstructorPassword, role: 'instructor' },
            { fullName: 'Hoàng Đức Anh', email: 'anh.hoang@instructor.edu', username: 'anh.hoang', password: hashedInstructorPassword, role: 'instructor' },
            { fullName: 'Vũ Thị Phương', email: 'phuong.vu@instructor.edu', username: 'phuong.vu', password: hashedInstructorPassword, role: 'instructor' }
        ];

        console.log('\n📚 Đang tạo 8 Giáo Viên...');
        const instructorIds = [];

        for (const instructor of instructors) {
            const existingUser = await usersCollection.findOne({ $or: [{ email: instructor.email }, { username: instructor.username }] });
            if (existingUser) {
                console.log(`   ⚠️ Đã tồn tại: ${instructor.fullName}`);
                instructorIds.push(existingUser._id);
            } else {
                const result = await usersCollection.insertOne(instructor);
                instructorIds.push(result.insertedId);
                console.log(`   ✅ Đã tạo GV: ${instructor.fullName} (${instructor.username})`);
            }
        }

        const students = [
            { fullName: 'Lê Thị Hương', email: 'huong.le@student.edu', username: 'huong.le1', password: hashedStudentPassword },
            { fullName: 'Trần Đức Long', email: 'long.tran@student.edu', username: 'long.tran1', password: hashedStudentPassword },
            { fullName: 'Phạm Minh Châu', email: 'chau.pham@student.edu', username: 'chau.pham1', password: hashedStudentPassword },
            { fullName: 'Ngô Thị Ngọc', email: 'ngoc.ngo@student.edu', username: 'ngoc.ngo1', password: hashedStudentPassword },
            { fullName: 'Đỗ Quang Huy', email: 'huy.do@student.edu', username: 'huy.do1', password: hashedStudentPassword },
            { fullName: 'Bùi Thị Hạnh', email: 'hanh.bui@student.edu', username: 'hanh.bui2', password: hashedStudentPassword },
            { fullName: 'Hoàng Văn Đức', email: 'duc.hoang@student.edu', username: 'duc.hoang2', password: hashedStudentPassword },
            { fullName: 'Vũ Thị Lan Anh', email: 'lanh.vu@student.edu', username: 'lanh.vu2', password: hashedStudentPassword },
            { fullName: 'Nguyễn Minh Tuấn', email: 'tuan.nguyen@student.edu', username: 'tuan.nguyen2', password: hashedStudentPassword },
            { fullName: 'Trịnh Thị Thanh', email: 'thanh.trinh@student.edu', username: 'thanh.trinh2', password: hashedStudentPassword },
            { fullName: 'Phạm Văn Toàn', email: 'toan.pham@student.edu', username: 'toan.pham3', password: hashedStudentPassword },
            { fullName: 'Lê Thị Bích', email: 'bich.le@student.edu', username: 'bich.le3', password: hashedStudentPassword },
            { fullName: 'Cao Minh Đức', email: 'duc.cao@student.edu', username: 'duc.cao3', password: hashedStudentPassword },
            { fullName: 'Đặng Thị Hồng', email: 'hong.dang@student.edu', username: 'hong.dang3', password: hashedStudentPassword },
            { fullName: 'Lưu Văn Minh', email: 'minh.luu@student.edu', username: 'minh.luu3', password: hashedStudentPassword },
            { fullName: 'Trần Văn Hùng', email: 'hung.tran@student.edu', username: 'hung.tran4', password: hashedStudentPassword },
            { fullName: 'Nguyễn Thị Phương', email: 'phuong.nguyen@student.edu', username: 'phuong.nguyen4', password: hashedStudentPassword },
            { fullName: 'Bùi Đức Anh', email: 'anh.bui@student.edu', username: 'anh.bui4', password: hashedStudentPassword },
            { fullName: 'Đỗ Thị Mai', email: 'mai.do@student.edu', username: 'mai.do4', password: hashedStudentPassword },
            { fullName: 'Võ Minh Khôi', email: 'khoi.vo@student.edu', username: 'khoi.vo4', password: hashedStudentPassword },
            { fullName: 'Lê Thị Ngân', email: 'ngan.le@student.edu', username: 'ngan.le5', password: hashedStudentPassword },
            { fullName: 'Trần Hoàng Nam', email: 'nam.tran@student.edu', username: 'nam.tran5', password: hashedStudentPassword },
            { fullName: 'Phạm Văn Thắng', email: 'thang.pham@student.edu', username: 'thang.pham5', password: hashedStudentPassword },
            { fullName: 'Ngô Thị Xuân', email: 'xuan.ngo@student.edu', username: 'xuan.ngo5', password: hashedStudentPassword },
            { fullName: 'Đặng Đức Minh', email: 'minh.dang@student.edu', username: 'minh.dang5', password: hashedStudentPassword },
            { fullName: 'Lưu Thị Hà', email: 'ha.luu@student.edu', username: 'ha.luu6', password: hashedStudentPassword },
            { fullName: 'Hoàng Văn Phong', email: 'phong.hoang@student.edu', username: 'phong.hoang6', password: hashedStudentPassword },
            { fullName: 'Vũ Thị Minh', email: 'minh.vu@student.edu', username: 'minh.vu6', password: hashedStudentPassword },
            { fullName: 'Nguyễn Đức Cường', email: 'cuong.nguyen@student.edu', username: 'cuong.nguyen6', password: hashedStudentPassword },
            { fullName: 'Trịnh Văn Thành', email: 'thanh.trinh@student.edu', username: 'thanh.trinh6', password: hashedStudentPassword },
            { fullName: 'Phạm Thị Hương', email: 'huong.pham@student.edu', username: 'huong.pham7', password: hashedStudentPassword },
            { fullName: 'Đặng Văn Bình', email: 'binh.dang@student.edu', username: 'binh.dang7', password: hashedStudentPassword },
            { fullName: 'Cao Thị Linh', email: 'linh.cao@student.edu', username: 'linh.cao7', password: hashedStudentPassword },
            { fullName: 'Lê Đức Vinh', email: 'vinh.le@student.edu', username: 'vinh.le7', password: hashedStudentPassword },
            { fullName: 'Nguyễn Thị Thanh', email: 'thanh.nguyen@student.edu', username: 'thanh.nguyen7', password: hashedStudentPassword },
            { fullName: 'Bùi Văn Hải', email: 'hai.bui@student.edu', username: 'hai.bui8', password: hashedStudentPassword },
            { fullName: 'Trần Thị Yến', email: 'yen.tran@student.edu', username: 'yen.tran8', password: hashedStudentPassword },
            { fullName: 'Hoàng Minh Đạt', email: 'dat.hoang@student.edu', username: 'dat.hoang8', password: hashedStudentPassword },
            { fullName: 'Võ Thị Thu', email: 'thu.vo@student.edu', username: 'thu.vo8', password: hashedStudentPassword },
            { fullName: 'Nguyễn Văn Khánh', email: 'khanh.nguyen@student.edu', username: 'khanh.nguyen8', password: hashedStudentPassword }
        ];

        console.log('\n👨‍🎓 Đang tạo 40 Học Viên...');

        for (let i = 0; i < students.length; i++) {
            const student = students[i];
            const instructorIndex = Math.floor(i / 5);
            const instructorId = instructorIds[instructorIndex];

            const existingStudent = await usersCollection.findOne({ $or: [{ email: student.email }, { username: student.username }] });
            if (existingStudent) {
                console.log(`   ⚠️ Đã tồn tại: ${student.fullName}`);
            } else {
                const studentData = {
                    ...student,
                    role: 'user',
                    instructorId: instructorId,
                    avatar: '',
                    isActive: true,
                    studentStats: {
                        totalPracticeCount: Math.floor(Math.random() * 50),
                        totalAssignmentsCompleted: Math.floor(Math.random() * 20),
                        averageScore: Math.floor(Math.random() * 40) + 60,
                        averageAccuracy: Math.floor(Math.random() * 30) + 70,
                        totalPracticeTime: Math.floor(Math.random() * 500),
                        lastPracticeDate: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
                        currentStreak: Math.floor(Math.random() * 15),
                        longestStreak: Math.floor(Math.random() * 60)
                    }
                };
                await usersCollection.insertOne(studentData);
                console.log(`   ✅ Đã tạo HV: ${student.fullName} (${student.username})`);
            }
        }

        console.log('\n========================================');
        console.log('🎉 HOÀN TẤT! Đã tạo thành công!');
        console.log('========================================');
        console.log('📊 Tổng cộng: 8 Giáo Viên + 40 Học Viên');
        console.log('\n🔑 Thông tin đăng nhập:');
        console.log('   Giáo Viên: username (VD: minh.nguyen), password: instructor123');
        console.log('   Học Viên: username (VD: huong.le1), password: student123');
        console.log('========================================\n');

    } finally {
        await client.close();
        console.log('👋 Đã ngắt kết nối MongoDB');
    }
}

seedDatabase().catch(console.error);
