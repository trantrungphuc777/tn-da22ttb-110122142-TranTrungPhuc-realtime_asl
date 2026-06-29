import { MongoClient } from 'mongodb';

const MONGO_URI = 'mongodb+srv://admin:Demo%40123@cluster0.yyx5afj.mongodb.net/?appName=Cluster0';
const DB_NAME = 'signlanguage_db';

async function analyzeDatabase() {
  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log('✅ Kết nối MongoDB Atlas thành công!\n');

    const db = client.db(DB_NAME);
    const collections = await db.listCollections().toArray();

    console.log(`📊 TỔNG QUAN CƠ SỞ DỮ LIỆU: ${DB_NAME}`);
    console.log(`📁 Tổng số collection: ${collections.length}`);
    console.log('=' .repeat(80) + '\n');

    const results = [];

    for (const collInfo of collections) {
      const collName = collInfo.name;
      const collection = db.collection(collName);

      // Đếm số document
      const count = await collection.countDocuments();

      // Lấy 1 document mẫu để xem cấu trúc
      const sample = await collection.findOne({}, { projection: { _id: 0 } });

      // Lấy index information
      const indexes = await collection.indexes();

      results.push({
        name: collName,
        documentCount: count,
        sampleFields: sample ? Object.keys(sample) : [],
        fieldDetails: sample,
        indexes: indexes.map(idx => idx.name)
      });
    }

    // Sắp xếp theo số document giảm dần
    results.sort((a, b) => b.documentCount - a.documentCount);

    // In chi tiết từng collection
    results.forEach((coll, index) => {
      console.log(`${'─'.repeat(80)}`);
      console.log(`📋 COLLECTION ${index + 1}: ${coll.name}`);
      console.log(`   📈 Số document: ${coll.documentCount.toLocaleString()}`);
      console.log(`   🔑 Số thuộc tính: ${coll.sampleFields.length}`);
      console.log(`   📊 Indexes: ${coll.indexes.length > 0 ? coll.indexes.join(', ') : 'Không có index đặc biệt'}`);

      if (coll.sampleFields.length > 0) {
        console.log(`   📝 Danh sách thuộc tính:`);
        coll.sampleFields.forEach(field => {
          const value = coll.fieldDetails[field];
          const type = Array.isArray(value) ? 'Array' : typeof value;
          const preview = value !== null && value !== undefined
            ? String(value).substring(0, 50).replace(/\n/g, ' ')
            : 'null';
          console.log(`      • ${field} (${type}): ${preview}${preview.length >= 50 ? '...' : ''}`);
        });
      }
      console.log();
    });

    // Phân tích mối quan hệ
    console.log('=' .repeat(80));
    console.log('\n🔗 PHÂN TÍCH MỐI QUAN HỆ GIỮA CÁC COLLECTION\n');

    const relationships = [];
    const objectIdPattern = /^[a-f\d]{24}$/i;

    results.forEach(coll => {
      if (coll.fieldDetails) {
        Object.entries(coll.fieldDetails).forEach(([field, value]) => {
          if (field.includes('Id') || field.includes('id')) {
            // Kiểm tra xem có phải là ObjectId reference
            if (typeof value === 'string' && objectIdPattern.test(value)) {
              // Tìm collection mà field này tham chiếu đến
              const refColl = results.find(c =>
                c.name.toLowerCase().includes(field.replace('Id', '').replace('id', '').toLowerCase()) ||
                field.toLowerCase().includes(c.name.toLowerCase().replace('ies', 'y').replace('s', ''))
              );
              relationships.push({
                from: coll.name,
                field: field,
                to: refColl ? refColl.name : 'Unknown (ObjectId)',
                type: '1:N hoặc N:1'
              });
            }
            // Kiểm tra mảng ObjectId
            if (Array.isArray(value) && value.length > 0) {
              const firstElem = value[0];
              if (typeof firstElem === 'string' && objectIdPattern.test(firstElem)) {
                const refName = field.replace('Ids', '').replace('Id', '').replace('s', '');
                relationships.push({
                  from: coll.name,
                  field: field,
                  to: `Array<${refName}>`,
                  type: '1:N (mảng)'
                });
              }
            }
          }
        });
      }
    });

    // Hiển thị mối quan hệ theo nhóm
    const groupedRelations = {};
    results.forEach(coll => {
      groupedRelations[coll.name] = relationships.filter(r => r.from === coll.name);
    });

    Object.entries(groupedRelations).forEach(([collName, relations]) => {
      if (relations.length > 0) {
        console.log(`📌 ${collName}:`);
        relations.forEach(rel => {
          console.log(`   └── ${rel.field} → ${rel.to} (${rel.type})`);
        });
        console.log();
      }
    });

    // Tóm tắt
    console.log('=' .repeat(80));
    console.log('\n📊 TÓM TẮT THỐNG KÊ:\n');
    console.log(`   • Tổng số collection: ${results.length}`);
    console.log(`   • Collection có nhiều document nhất: ${results[0].name} (${results[0].documentCount.toLocaleString()} docs)`);
    console.log(`   • Collection có ít document nhất: ${results[results.length - 1].name} (${results[results.length - 1].documentCount.toLocaleString()} docs)`);

    const totalDocs = results.reduce((sum, r) => sum + r.documentCount, 0);
    console.log(`   • Tổng số document: ${totalDocs.toLocaleString()}`);
    console.log(`   • Số mối quan hệ phát hiện: ${relationships.length}`);

  } catch (error) {
    console.error('❌ Lỗi kết nối:', error.message);
  } finally {
    await client.close();
  }
}

analyzeDatabase();
