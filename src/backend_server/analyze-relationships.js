import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URI = 'mongodb+srv://admin:Demo%40123@cluster0.yyx5afj.mongodb.net/?appName=Cluster0';
const DB_NAME = 'signlanguage_db';

async function deepAnalyzeRelationships() {
  const client = new MongoClient(MONGO_URI, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
  });

  try {
    await client.connect();
    console.log('🔍 PHÂN TÍCH CHI TIẾT MỐI QUAN HỆ TRÊN MONGODB ATLAS\n');
    console.log('=' .repeat(80) + '\n');

    const db = client.db(DB_NAME);
    const collections = ['users', 'classes', 'assignments', 'exams', 'submissions',
                        'badges', 'studentbadges', 'feedbacks', 'instructorfeedbacks',
                        'notifications', 'conversations', 'messages', 'supporttickets',
                        'usersessions'];

    // Lấy tất cả users để map ID -> role
    const users = await db.collection('users').find({}).toArray();
    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = {
        fullName: u.fullName,
        role: u.role,
        email: u.email
      };
    });

    // Lấy classes để map
    const classes = await db.collection('classes').find({}).toArray();
    const classMap = {};
    classes.forEach(c => {
      classMap[c._id.toString()] = { name: c.name, instructorId: c.instructorId?.toString() };
    });

    // Lấy assignments và exams
    const assignments = await db.collection('assignments').find({}).toArray();
    const exams = await db.collection('exams').find({}).toArray();
    const submissions = await db.collection('submissions').find({}).toArray();

    console.log('📊 MỐI QUAN HỆ CHI TIẾT:\n');

    // 1. Users - Classes
    console.log('1️⃣ USERS ↔ CLASSES (1:N)');
    console.log('   Mô tả: Một User có thể tham gia nhiều Classes, một Class có nhiều Students');
    console.log('   Thực tế:');
    classes.forEach(cls => {
      if (cls.studentIds && cls.studentIds.length > 0) {
        console.log(`   • Class "${cls.name}" (${cls._id}) có ${cls.studentIds.length} học viên`);
        const studentNames = cls.studentIds.slice(0, 3).map(id => userMap[id.toString()]?.fullName || id.toString()).join(', ');
        if (cls.studentIds.length > 3) {
          console.log(`     └─ Danh sách: ${studentNames}...`);
        } else {
          console.log(`     └─ Danh sách: ${studentNames}`);
        }
      }
    });
    console.log();

    // 2. Users - Instructor relationship
    console.log('2️⃣ USERS ↔ INSTRUCTOR (1:N)');
    console.log('   Mô tả: Một Instructor có thể phụ trách nhiều Users (học viên)');
    console.log('   Thực tế:');
    users.filter(u => u.role === 'instructor').forEach(inst => {
      const students = users.filter(u => u.instructorId?.toString() === inst._id.toString());
      if (students.length > 0) {
        console.log(`   • Instructor "${inst.fullName}" phụ trách ${students.length} học viên`);
      }
    });
    console.log();

    // 3. Assignments - Classes - Users
    console.log('3️⃣ ASSIGNMENTS - CLASSES - USERS (1:N:N)');
    console.log('   Mô tả: Assignment được giao cho Class hoặc User cụ thể');
    console.log('   Thực tế:');
    assignments.forEach(a => {
      const instructor = userMap[a.instructorId?.toString()]?.fullName || 'Unknown';
      console.log(`   • "${a.title}" - Instructor: ${instructor}`);
      if (a.classId) {
        const cls = classMap[a.classId.toString()];
        console.log(`     └─ Giao cho Class: ${cls?.name || a.classId}`);
      }
    });
    console.log();

    // 4. Exams - Classes - Users
    console.log('4️⃣ EXAMS - CLASSES - USERS (1:N:N)');
    console.log('   Mô tả: Exam được giao cho Class hoặc User cụ thể');
    console.log('   Thực tế:');
    exams.forEach(e => {
      const instructor = userMap[e.instructorId?.toString()]?.fullName || 'Unknown';
      console.log(`   • "${e.title}" - Instructor: ${instructor} - Status: ${e.status}`);
      if (e.classIds && e.classIds.length > 0) {
        const classNames = e.classIds.map(id => classMap[id.toString()]?.name || id.toString()).join(', ');
        console.log(`     └─ Giao cho Classes: ${classNames}`);
      }
      if (e.assignedTo && e.assignedTo.length > 0) {
        const studentNames = e.assignedTo.map(id => userMap[id.toString()]?.fullName || id.toString()).join(', ');
        console.log(`     └─ Giao cho Students: ${studentNames}`);
      }
    });
    console.log();

    // 5. Submissions - Assignments/Exams - Users
    console.log('5️⃣ SUBMISSIONS - ASSIGNMENTS/EXAMS - USERS (N:1:1)');
    console.log('   Mô tả: Submission liên kết với Assignment hoặc Exam và User (student)');
    console.log('   Thực tế:');
    submissions.forEach(s => {
      const student = userMap[s.studentId?.toString()]?.fullName || 'Unknown';
      const assignment = assignments.find(a => a._id.toString() === s.assignmentId?.toString());
      const exam = exams.find(e => e._id.toString() === s.examId?.toString());
      const source = assignment ? `Assignment: "${assignment.title}"` : exam ? `Exam: "${exam.title}"` : 'Unknown';
      console.log(`   • Student: ${student}`);
      console.log(`     └─ Source: ${source} - Score: ${s.score}/${s.maxScore} - Status: ${s.status}`);
    });
    console.log();

    // 6. Badges - StudentBadges - Users
    console.log('6️⃣ BADGES ↔ STUDENTBADGES ↔ USERS (1:N:N)');
    console.log('   Mô tả: Badge được trao cho Student thông qua StudentBadge');
    const badges = await db.collection('badges').find({}).toArray();
    const studentbadges = await db.collection('studentbadges').find({}).toArray();
    console.log('   Thực tế:');
    console.log(`   • Tổng số Badge: ${badges.length}`);
    console.log(`   • Tổng số StudentBadge: ${studentbadges.length}`);
    studentbadges.forEach(sb => {
      const badge = badges.find(b => b._id.toString() === sb.badgeId?.toString());
      const student = userMap[sb.studentId?.toString()]?.fullName || 'Unknown';
      const badgeName = badge?.name?.vi || badge?.name?.en || 'Unknown Badge';
      console.log(`   • "${student}" nhận badge: "${badgeName}" (${sb.source})`);
    });
    console.log();

    // 7. Feedbacks - Users
    console.log('7️⃣ FEEDBACKS ↔ USERS (N:1)');
    console.log('   Mô tả: Feedback được gửi bởi User');
    const feedbacks = await db.collection('feedbacks').find({}).toArray();
    feedbacks.forEach(f => {
      const user = userMap[f.userId?.toString()]?.fullName || 'Unknown';
      console.log(`   • "${f.subject}" - Từ: ${user} - Type: ${f.type} - Status: ${f.status}`);
    });
    console.log();

    // 8. InstructorFeedbacks - Users
    console.log('8️⃣ INSTRUCTORFEEDBACKS ↔ USERS (N:1:1)');
    console.log('   Mô tả: Feedback từ Instructor gửi cho Student');
    const instFeedbacks = await db.collection('instructorfeedbacks').find({}).toArray();
    instFeedbacks.forEach(f => {
      const instructor = userMap[f.instructorId?.toString()]?.fullName || 'Unknown';
      const student = userMap[f.studentId?.toString()]?.fullName || 'Unknown';
      console.log(`   • Instructor "${instructor}" → Student "${student}": "${f.title}"`);
    });
    console.log();

    // 9. Conversations - Messages - Users
    console.log('9️⃣ CONVERSATIONS ↔ MESSAGES ↔ USERS (1:N:N)');
    console.log('   Mô tả: Conversation chứa nhiều Messages giữa các Users');
    const conversations = await db.collection('conversations').find({}).toArray();
    const messages = await db.collection('messages').find({}).toArray();
    console.log('   Thực tế:');
    conversations.forEach(conv => {
      const participants = conv.participants.map(p => userMap[p.toString()]?.fullName || p.toString()).join(', ');
      const msgCount = messages.filter(m => m.conversationId.toString() === conv._id.toString()).length;
      console.log(`   • Conversation ${conv._id}`);
      console.log(`     └─ Participants: ${participants}`);
      console.log(`     └─ Messages: ${msgCount}`);
    });
    console.log();

    // 10. SupportTickets - Users
    console.log('🔟 SUPPORTTICKETS ↔ USERS (N:1)');
    console.log('   Mô tả: Support Ticket được tạo bởi User');
    const tickets = await db.collection('supporttickets').find({}).toArray();
    tickets.forEach(t => {
      console.log(`   • ${t.ticketCode}: "${t.subject}" - User: ${t.userName} - Status: ${t.status}`);
    });
    console.log();

    // 11. UserSessions - Users
    console.log('1️⃣1️⃣ USERSESSIONS ↔ USERS (1:N)');
    console.log('   Mô tả: Mỗi User có thể có nhiều phiên đăng nhập');
    const sessions = await db.collection('usersessions').find({}).toArray();
    const sessionByUser = {};
    sessions.forEach(s => {
      const uid = s.userId?.toString();
      if (!sessionByUser[uid]) sessionByUser[uid] = [];
      sessionByUser[uid].push(s);
    });
    Object.entries(sessionByUser).forEach(([uid, sess]) => {
      const user = userMap[uid]?.fullName || uid;
      console.log(`   • ${user}: ${sess.length} phiên (${sess.filter(s => s.isActive).length} active)`);
    });
    console.log();

    // Tổng hợp sơ đồ ERD
    console.log('=' .repeat(80));
    console.log('\n📐 SƠ ĐỒ ERD TỔNG HỢP (MongoDB)\n');
    console.log(`
    ┌─────────────────┐
    │     USERS       │
    │─────────────────│
    │ _id (PK)        │
    │ fullName        │
    │ email (UNIQUE)  │
    │ username(UNIQUE)│
    │ password        │
    │ role            │
    │ instructorId(FK)│──────┐
    │ classIds (FK[]) │      │
    └────────┬────────┘      │
             │ 1:N           │ N:1
             ▼               ▼
    ┌─────────────────┐  ┌─────────────────┐
    │    CLASSES      │  │   INSTRUCTOR    │
    │─────────────────│  │   (User.role)  │
    │ _id (PK)        │  │                 │
    │ name            │◄─┼── instructorId  │
    │ instructorId(FK) │  └─────────────────┘
    │ studentIds[]    │
    │ level           │
    │ status          │
    └────────┬────────┘
             │ 1:N
             ▼
    ┌─────────────────┐
    │   ASSIGNMENTS   │
    │─────────────────│
    │ _id (PK)        │
    │ title           │
    │ instructorId(FK)│
    │ classId (FK)    │
    │ type            │
    │ status          │
    │ dueDate         │
    └────────┬────────┘
             │
             │ 1:N
             ▼
    ┌─────────────────┐
    │   SUBMISSIONS  │
    │─────────────────│
    │ _id (PK)        │
    │ assignmentId(FK)│
    │ examId (FK)     │
    │ studentId (FK)  │
    │ score           │
    │ status          │
    │ answers[]       │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌───────────┐  ┌───────────┐
│  BADGES   │  │  EXAMS    │
│───────────│  │───────────│
│ _id (PK)  │  │ _id (PK)  │
│ name      │  │ title     │
│ icon      │  │ type      │
│ rarity    │  │ settings  │
│ condition │  │ status    │
└─────┬─────┘  └─────┬─────┘
      │ 1:N           │
      ▼               │
┌───────────────┐     │
│ STUDENTBADGES │     │
│───────────────│     │
│ _id (PK)      │     │
│ studentId(FK) │◄────┘
│ badgeId (FK)  │
│ earnedAt      │
│ source        │
└───────────────┘
`);
    console.log('\n' + '=' .repeat(80));
    console.log('\n📊 TÓM TẮT CÁC COLLECTION VÀ THUỘC TÍNH:\n');

    const summary = [
      { name: 'users', docs: users.length, fields: 13, purpose: 'Tài khoản người dùng (admin/instructor/student)' },
      { name: 'usersessions', docs: sessions.length, fields: 13, purpose: 'Phiên đăng nhập JWT' },
      { name: 'classes', docs: classes.length, fields: 11, purpose: 'Lớp học do instructor quản lý' },
      { name: 'assignments', docs: assignments.length, fields: 13, purpose: 'Bài tập được giao cho lớp/học viên' },
      { name: 'exams', docs: exams.length, fields: 17, purpose: 'Bài kiểm tra tổng hợp' },
      { name: 'submissions', docs: submissions.length, fields: 17, purpose: 'Bài nộp của học viên' },
      { name: 'badges', docs: badges.length, fields: 17, purpose: 'Huy hiệu hệ thống' },
      { name: 'studentbadges', docs: studentbadges.length, fields: 10, purpose: 'Huy hiệu đạt được của học viên' },
      { name: 'feedbacks', docs: feedbacks.length, fields: 12, purpose: 'Phản hồi từ người dùng' },
      { name: 'instructorfeedbacks', docs: instFeedbacks.length, fields: 11, purpose: 'Phản hồi từ giảng viên' },
      { name: 'notifications', docs: (await db.collection('notifications').countDocuments()), fields: 12, purpose: 'Thông báo hệ thống' },
      { name: 'conversations', docs: conversations.length, fields: 8, purpose: 'Cuộc trò chuyện 1-1' },
      { name: 'messages', docs: messages.length, fields: 14, purpose: 'Tin nhắn trong cuộc trò chuyện' },
      { name: 'supporttickets', docs: tickets.length, fields: 17, purpose: 'Phiếu hỗ trợ kỹ thuật' },
      { name: 'auditlogs', docs: (await db.collection('auditlogs').countDocuments()), fields: 10, purpose: 'Nhật ký hành động người dùng' },
      { name: 'systemevents', docs: (await db.collection('systemevents').countDocuments()), fields: 8, purpose: 'Sự kiện hệ thống' },
      { name: 'securitypolicies', docs: (await db.collection('securitypolicies').countDocuments()), fields: 10, purpose: 'Cấu hình bảo mật' },
      { name: 'backuprecords', docs: (await db.collection('backuprecords').countDocuments()), fields: 13, purpose: 'Lịch sử backup' },
      { name: 'aslcontents', docs: (await db.collection('aslcontents').countDocuments()), fields: 10, purpose: 'Nội dung ASL (chữ cái, từ, câu)' },
      { name: 'aslsymbols', docs: (await db.collection('aslsymbols').countDocuments()), fields: 17, purpose: 'Ký hiệu ASL chuẩn hóa' },
      { name: 'questions', docs: (await db.collection('questions').countDocuments()), fields: 14, purpose: 'Câu hỏi trắc nghiệm' },
      { name: 'systemlogs', docs: (await db.collection('systemlogs').countDocuments()), fields: 7, purpose: 'Log hệ thống' },
      { name: 'adminnotifications', docs: (await db.collection('adminnotifications').countDocuments()), fields: 12, purpose: 'Thông báo quản trị' },
      { name: 'userfeedbacks', docs: 0, fields: 0, purpose: 'Collection rỗng' },
    ];

    console.log('┌─────┬────────────────────────┬──────────┬───────────┬─────────────────────────────────┐');
    console.log('│ STT │ Collection             │ Documents│ Fields    │ Mô tả                           │');
    console.log('├─────┼────────────────────────┼──────────┼───────────┼─────────────────────────────────┤');
    summary.forEach((s, i) => {
      const row = `│ ${(i+1).toString().padStart(3)} │ ${s.name.padEnd(24)} │ ${s.docs.toString().padStart(8)} │ ${s.fields.toString().padStart(9)} │ ${s.purpose.padEnd(33)} │`;
      console.log(row);
    });
    console.log('└─────┴────────────────────────┴──────────┴───────────┴─────────────────────────────────┘');

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await client.close();
  }
}

deepAnalyzeRelationships();
