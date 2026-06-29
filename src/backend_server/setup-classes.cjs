// Script xử lý và đồng bộ dữ liệu: Giáo viên, Học sinh, Lớp học
const mongoose = require('mongoose');

// MongoDB URI từ .env
const MONGO_URI = 'mongodb://admin:Demo%40123@ac-ab0jgsf-shard-00-00.yyx5afj.mongodb.net:27017,ac-ab0jgsf-shard-00-01.yyx5afj.mongodb.net:27017,ac-ab0jgsf-shard-00-02.yyx5afj.mongodb.net:27017/signlanguage_db?authSource=admin&ssl=true';

// Schema tạm thời để kết nối
const UserSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    username: String,
    password: String,
    role: String,
    instructorId: mongoose.Schema.Types.ObjectId,
    classIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    avatar: String,
    isActive: Boolean,
    studentStats: Object,
    commonErrors: Array,
    practicedContent: Object
}, { timestamps: true });

const ClassSchema = new mongoose.Schema({
    name: String,
    description: String,
    instructorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    studentIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    level: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    status: { type: String, enum: ['active', 'archived', 'deleted'], default: 'active' },
    classStats: Object,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Class = mongoose.model('Class', ClassSchema);

// Map tên giáo viên cho dễ đọc
const instructorNames = {
    'minh.nguyen': 'Nguyễn Văn Minh',
    'lan.tran': 'Trần Thị Lan',
    'nam.hoang': 'Lê Hoàng Nam',
    'ha.pham': 'Phạm Thu Hà',
    'tuan.dang': 'Đặng Minh Tuấn',
    'mai.bui': 'Bùi Thị Mai',
    'anh.hoang': 'Hoàng Đức Anh',
    'phuong.vu': 'Vũ Thị Phương'
};

async function processData() {
    try {
        console.log('='.repeat(60));
        console.log('🔄 BẮT ĐẦU XỬ LÝ DỮ LIỆU');
        console.log('='.repeat(60));

        // Bước 1: Kết nối MongoDB
        console.log('\n📡 Đang kết nối MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối thành công!');

        // Bước 2: Kiểm tra dữ liệu hiện tại
        console.log('\n📊 BƯỚC 1: KIỂM TRA DỮ LIỆU HIỆN TẠI');
        console.log('-'.repeat(50));

        const instructors = await User.find({ role: 'instructor' }).lean();
        const students = await User.find({ role: 'user' }).lean();
        const classes = await Class.find({}).lean();

        console.log(`   - Số giáo viên: ${instructors.length}`);
        console.log(`   - Số học sinh: ${students.length}`);
        console.log(`   - Số lớp học: ${classes.length}`);

        // Kiểm tra học sinh không có giáo viên
        const studentsWithoutInstructor = students.filter(s => !s.instructorId);
        console.log(`   - HS không có GV quản lý: ${studentsWithoutInstructor.length}`);

        // Kiểm tra học sinh chưa có lớp
        const studentsWithoutClass = students.filter(s => !s.classIds || s.classIds.length === 0);
        console.log(`   - HS chưa có lớp: ${studentsWithoutClass.length}`);

        // Bước 3: Tạo lớp học cho mỗi giáo viên
        console.log('\n📚 BƯỚC 2: TẠO/XỬ LÝ LỚP HỌC');
        console.log('-'.repeat(50));

        const classesCreated = [];
        const classesMap = new Map(); // Map: instructorUsername -> classId

        for (const instructor of instructors) {
            // Tạo tên lớp dựa trên giáo viên
            const instructorName = instructor.fullName || instructor.username;
            const className = `Lớp ${instructorName}`;

            // Kiểm tra lớp đã tồn tại chưa
            let existingClass = await Class.findOne({ instructorId: instructor._id });

            if (existingClass) {
                console.log(`   ⚠️ Lớp "${existingClass.name}" đã tồn tại cho GV: ${instructorName}`);
                classesMap.set(instructor.username, existingClass._id);
            } else {
                // Tạo lớp mới
                const newClass = await Class.create({
                    name: className,
                    description: `Lớp học của giáo viên ${instructorName}`,
                    instructorId: instructor._id,
                    studentIds: [],
                    level: 'beginner',
                    status: 'active',
                    classStats: {
                        totalStudents: 0,
                        averageScore: 0,
                        averageAccuracy: 0,
                        completionRate: 0,
                        activeStudents: 0
                    },
                    createdBy: instructor._id
                });
                console.log(`   ✅ Đã tạo lớp: "${className}"`);
                classesMap.set(instructor.username, newClass._id);
                classesCreated.push(newClass);
            }
        }

        // Bước 4: Phân chia học sinh vào các lớp
        console.log('\n👨‍🎓 BƯỚC 3: PHÂN CHIA HỌC SINH VÀO LỚP');
        console.log('-'.repeat(50));

        // Gom nhóm học sinh theo instructorId
        const studentsByInstructor = new Map();

        for (const instructor of instructors) {
            studentsByInstructor.set(instructor._id.toString(), []);
        }

        for (const student of students) {
            if (student.instructorId) {
                const key = student.instructorId.toString();
                if (studentsByInstructor.has(key)) {
                    studentsByInstructor.get(key).push(student);
                }
            }
        }

        // Xử lý từng giáo viên và lớp của họ
        let totalStudentsAssigned = 0;

        for (const instructor of instructors) {
            const instructorStudents = studentsByInstructor.get(instructor._id.toString()) || [];
            const classId = classesMap.get(instructor.username);

            if (!classId) {
                console.log(`   ❌ Không tìm thấy lớp cho GV: ${instructor.fullName}`);
                continue;
            }

            // Lấy lớp học
            const classObj = await Class.findById(classId);
            if (!classObj) continue;

            // Cập nhật danh sách học sinh trong lớp
            const studentIds = instructorStudents.map(s => s._id);
            classObj.studentIds = studentIds;
            classObj.classStats.totalStudents = studentIds.length;
            classObj.classStats.activeStudents = studentIds.length;
            await classObj.save();

            // Cập nhật classIds cho từng học sinh
            for (const student of instructorStudents) {
                await User.findByIdAndUpdate(student._id, {
                    classIds: [classId] // Thêm classId vào danh sách lớp của học sinh
                });
            }

            totalStudentsAssigned += instructorStudents.length;
            console.log(`   ✅ GV ${instructor.fullName}:`);
            console.log(`      - Số HS được giao: ${instructorStudents.length}`);
            console.log(`      - Lớp: "${classObj.name}"`);
        }

        // Bước 5: Kiểm tra học sinh không có giáo viên
        console.log('\n⚠️ XỬ LÝ HỌC SINH KHÔNG CÓ GIÁO VIÊN');
        console.log('-'.repeat(50));

        if (studentsWithoutInstructor.length > 0) {
            // Gán cho giáo viên đầu tiên
            if (instructors.length > 0) {
                const defaultInstructor = instructors[0];
                const defaultClassId = classesMap.get(defaultInstructor.username);

                for (const student of studentsWithoutInstructor) {
                    await User.findByIdAndUpdate(student._id, {
                        instructorId: defaultInstructor._id,
                        classIds: defaultClassId ? [defaultClassId] : []
                    });

                    if (defaultClassId) {
                        await Class.findByIdAndUpdate(defaultClassId, {
                            $addToSet: { studentIds: student._id }
                        });
                    }
                }

                console.log(`   ✅ Đã gán ${studentsWithoutInstructor.length} HS không có GV cho: ${defaultInstructor.fullName}`);
            }
        } else {
            console.log('   ✅ Tất cả học sinh đều có giáo viên quản lý!');
        }

        // Bước 6: Cập nhật stats cho các lớp
        console.log('\n📈 BƯỚC 4: CẬP NHẬT THỐNG KÊ');
        console.log('-'.repeat(50));

        const allClasses = await Class.find({}).lean();
        for (const cls of allClasses) {
            const studentCount = cls.studentIds ? cls.studentIds.length : 0;
            await Class.findByIdAndUpdate(cls._id, {
                'classStats.totalStudents': studentCount,
                'classStats.activeStudents': studentCount
            });
        }

        // Bước 7: Xác minh kết quả
        console.log('\n✅ BƯỚC 5: XÁC MINH KẾT QUẢ');
        console.log('='.repeat(60));

        const finalInstructors = await User.find({ role: 'instructor' }).lean();
        const finalStudents = await User.find({ role: 'user' }).lean();
        const finalClasses = await Class.find({ status: 'active' }).lean();

        console.log(`\n📊 TỔNG KẾT:`);
        console.log(`   - Giáo viên: ${finalInstructors.length}`);
        console.log(`   - Học sinh: ${finalStudents.length}`);
        console.log(`   - Lớp học: ${finalClasses.length}`);

        // Đếm HS có giáo viên
        const studentsWithInstructor = finalStudents.filter(s => s.instructorId);
        console.log(`   - HS có GV quản lý: ${studentsWithInstructor.length}/${finalStudents.length}`);

        // Đếm HS có lớp
        const studentsWithClass = finalStudents.filter(s => s.classIds && s.classIds.length > 0);
        console.log(`   - HS có lớp học: ${studentsWithClass.length}/${finalStudents.length}`);

        // Hiển thị chi tiết từng lớp
        console.log('\n📋 CHI TIẾT CÁC LỚP HỌC:');
        console.log('-'.repeat(60));

        for (const cls of finalClasses) {
            const instructor = finalInstructors.find(i => i._id.toString() === cls.instructorId?.toString());
            const instructorName = instructor ? instructor.fullName : 'N/A';
            const studentCount = cls.studentIds ? cls.studentIds.length : 0;

            console.log(`   Lớp: "${cls.name}"`);
            console.log(`     - GV phụ trách: ${instructorName}`);
            console.log(`     - Số học sinh: ${studentCount}`);
            console.log(`     - Cấp độ: ${cls.level}`);
            console.log('');
        }

        console.log('='.repeat(60));
        console.log('🎉 HOÀN TẤT! Dữ liệu đã được đồng bộ!');
        console.log('='.repeat(60));

        await mongoose.disconnect();
        console.log('\n👋 Đã ngắt kết nối MongoDB');

    } catch (error) {
        console.error('\n❌ LỖI:', error.message);
        console.error(error.stack);
        await mongoose.disconnect();
    }
}

// Chạy script
processData();
