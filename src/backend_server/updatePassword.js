import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const MONGO_URI = process.env.MONGO_URI || 'mongodb+srv://admin:Demo%40123@cluster0.yyx5afj.mongodb.net/signlanguage_db?appName=Cluster0';

const USERNAME = 'giaovien';
const NEW_PASSWORD = 'giaovien123';

async function updatePassword() {
    try {
        console.log('🔄 Đang kết nối MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối MongoDB thành công!');

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(NEW_PASSWORD, salt);

        console.log('🔐 Password đã được hash:', hashedPassword);

        const User = mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const result = await User.updateOne(
            { username: USERNAME },
            { $set: { password: hashedPassword } }
        );

        if (result.matchedCount === 0) {
            console.log('❌ Không tìm thấy user với username:', USERNAME);
        } else if (result.modifiedCount === 1) {
            console.log('✅ Cập nhật password thành công!');
            console.log('📧 Username:', USERNAME);
            console.log('🔑 Password:', NEW_PASSWORD);
        } else {
            console.log('⚠️  Password đã được cập nhật trước đó');
        }

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Đã ngắt kết nối MongoDB');
        process.exit(0);
    }
}

updatePassword();
