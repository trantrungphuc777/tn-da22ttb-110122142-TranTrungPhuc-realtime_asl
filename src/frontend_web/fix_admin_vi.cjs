const fs = require('fs');
const path = require('path');

const adminDir = 'src/components/admin';
const files = fs.readdirSync(adminDir).filter(f => f.endsWith('.jsx') || f.endsWith('.js'));

const replacements = [
  // AdminStudents
  ['Tìm kiếm & Lọc', 'Search & Filter'],
  ['Sync lại stats thực tế từ dữ liệu làm bài cho TẤT CẢ', 'Sync real stats from submission data for ALL'],
  ['học viên?\\n\\nThao tác này sẽ xoá dữ liệu seed giả và thay bằng dữ liệu thật.', 'students?\\n\\nThis will remove seed data and replace with real data.'],
  ['Đã sync', 'Synced'],
  ['học viên thành công!', 'students successfully!'],
  ["'Ngày tạo: '", "'Account created: '"],
  ["'Ngày tạo:'", "'Account created:'"],
  ['Ngày tạo: {new Date', 'Account created: {new Date'],
  ['Ngày tạo:', 'Account created:'],
  [' điểm', ' pts'],
  [' phút', ' min'],
  ['huy hiệu', 'badges'],
  ['lần', 'times'],

  // AdminNotifications
  ['Gửi lúc:', 'Sent at:'],
  ['Người gửi:', 'From:'],
  ['người nhận', 'recipients'],
  ["'Lớp: '", "'Class: '"],
  ["'Nhóm: '", "'Group: '"],
  ['`Lớp: ${', '`Class: ${'],
  ['`Nhóm: ${', '`Group: ${'],
  ['Học viên yếu (điểm < 50)', 'Weak students (score < 50)'],
  ['Học viên mới (7 ngày)', 'New students (7 days)'],
  ['Trang ${', 'Page ${'],
  ['— ${', '— '],

  // AdminSupport  
  ['Xem', 'View'],
  ['Lịch sử trao đổi', 'Message history'],
  ['tin nhắn', 'messages'],
  ["|| 'Khác'", "|| 'Other'"],
  ['toLocaleString(\'vi-VN\')', 'toLocaleString()'],

  // AdminRoles
  ['Xem Dashboard', 'View Dashboard'],
  ['`Chuyển ${', '`Change ${'],
  [' thành ', ' to '],
  ['Đã vô hiệu hóa vai trò!', 'Role deactivated!'],
  ['Đã kích hoạt vai trò!', 'Role activated!'],
  ['Quyền hạn — ', 'Permissions — '],
  [' đang bật', ' enabled'],
  [' người', ' users'],
  ['Người dùng học tập, thực hành và làm bài kiểm tra', 'Learning, practicing and taking exams'],
  ['Người quản lý lớp học, giao bài tập và đánh giá học viên', 'Manages classes, assigns tasks and evaluates students'],

  // AdminLogs  
  ['Đăng nhập thành công', 'Login successful'],
  ['Đăng nhập thất bại', 'Login failed'],
  ['Trang ${page}/${pages}', 'Page ${page}/${pages}'],
  ['bản ghi', 'records'],

  // AdminReports
  ['Xuất lúc:', 'Exported at:'],
  ['Ngày lập:', 'Date:'],
  ['Số:', 'No:'],
  ['người', 'people'],
  ['TP. Hồ Chí Minh', 'Ho Chi Minh City'],
  ['Dữ liệu tính đến:', 'Data as of:'],
  ['Số hiệu:', 'Report No:'],

  // General pagination
  ["'Trang '", "'Page '"],
  ['Trang 1/', 'Page 1/'],
  ['ticket', 'ticket'],
];

let totalFixed = 0;

for (const file of files) {
  const filePath = path.join(adminDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;
  
  for (const [from, to] of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
      totalFixed++;
    }
  }
  
  if (changed) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed: ${file}`);
  }
}

console.log(`\nTotal replacements: ${totalFixed}`);
