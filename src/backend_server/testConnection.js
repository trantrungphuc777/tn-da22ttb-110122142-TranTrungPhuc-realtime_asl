import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGO_URI = 'mongodb+srv://admin:Demo%40123@cluster0.yyx5afj.mongodb.net/?appName=Cluster0';

async function testConnection() {
    try {
        console.log('🔄 Đang kết nối MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('✅ Kết nối thành công!');
        
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('📦 Collections:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('👋 Đã ngắt kết nối');
    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    }
}

testConnection();
