import os, re, json, hashlib, codecs

directory = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\components\admin'
trans_file = r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\data\translations.js'

viet_chars = set('àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđÀÁẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬÈÉẺẼẸÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴĐ')

def is_viet(text):
    return any(c in viet_chars for c in text)

def get_key(text):
    return 'k_' + hashlib.md5(text.encode('utf-8')).hexdigest()[:8]

# Manual EN translations for common toast/confirm/JS logic strings
en_map = {
    'Thao tác thất bại!': 'Operation failed!',
    'Đang lưu...': 'Saving...',
    'Lưu thất bại!': 'Save failed!',
    'Gửi thất bại!': 'Send failed!',
    'Xóa thất bại!': 'Delete failed!',
    'Đã xóa!': 'Deleted!',
    'Đã cập nhật!': 'Updated!',
    'Đã thêm mới!': 'Added!',
    'Vui lòng nhập nội dung!': 'Please enter content!',
    'Vui lòng nhập đầy đủ!': 'Please fill in all fields!',
    'Vui lòng chọn học viên!': 'Please select a student!',
    'Vui lòng chọn lớp đích!': 'Please select target class!',
    'Vui lòng chọn giảng viên!': 'Please select instructor!',
    'Vui lòng chọn lớp!': 'Please select class!',
    'Không thể tải danh sách lớp!': 'Unable to load class list!',
    'Không thể tải chi tiết lớp!': 'Unable to load class details!',
    'Không thể tải danh sách giảng viên!': 'Unable to load instructor list!',
    'Không thể tải danh sách học viên!': 'Unable to load student list!',
    'Không thể tải hồ sơ!': 'Unable to load profile!',
    'Không thể tải hồ sơ học viên!': 'Unable to load student profile!',
    'Không thể tải dữ liệu huy hiệu!': 'Unable to load badge data!',
    'Không thể tải nhật ký!': 'Unable to load logs!',
    'Không thể tải nhật ký hệ thống!': 'Unable to load system logs!',
    'Không thể tải thông báo!': 'Unable to load notifications!',
    'Không thể tải thông tin tài khoản!': 'Unable to load account info!',
    'Không thể tải báo cáo!': 'Unable to load report!',
    'Không thể tải dữ liệu thống kê!': 'Unable to load statistics!',
    'Không thể tải danh sách ticket!': 'Unable to load ticket list!',
    'Không thể tải chi tiết ticket!': 'Unable to load ticket details!',
    'Không thể tải dữ liệu phân quyền!': 'Unable to load permission data!',
    'Không thể tải danh sách người dùng!': 'Unable to load user list!',
    'Không thể vô hiệu hóa vai trò Admin!': 'Cannot deactivate Admin role!',
    'Không thể thay đổi quyền của Admin!': 'Cannot change Admin permissions!',
    'Tên lớp và giảng viên là bắt buộc!': 'Class name and instructor are required!',
    'Đã tạo lớp học!': 'Class created!',
    'Xóa lớp học này?': 'Delete this class?',
    'Đã xóa lớp học!': 'Class deleted!',
    'Đã cập nhật lớp học!': 'Class updated!',
    'Đã thêm học viên!': 'Student added!',
    'Xóa học viên khỏi lớp này?': 'Remove student from class?',
    'Đã xóa học viên khỏi lớp!': 'Student removed from class!',
    'Đã chuyển học viên sang lớp mới!': 'Student transferred to new class!',
    'Đã thay đổi giảng viên phụ trách!': 'Instructor changed!',
    'Đã tạo tài khoản giảng viên! Hệ thống đã ghi nhận thông tin đăng nhập.': 'Instructor account created! Login info recorded.',
    'Đã cập nhật thông tin giảng viên!': 'Instructor info updated!',
    'Khóa tài khoản giảng viên?': 'Lock instructor account?',
    'Đã khóa!': 'Locked!',
    'Mật khẩu phải ít nhất 6 ký tự!': 'Password must be at least 6 characters!',
    'Đã đặt lại mật khẩu!': 'Password reset!',
    'Đã gán giảng viên vào lớp!': 'Instructor assigned to class!',
    'Tên tiếng Việt và tiếng Anh là bắt buộc!': 'Vietnamese and English names are required!',
    'Đã cập nhật huy hiệu!': 'Badge updated!',
    'Đã tạo huy hiệu mới!': 'New badge created!',
    'Đã xóa huy hiệu!': 'Badge deleted!',
    'Tiêu đề và nội dung là bắt buộc!': 'Title and content are required!',
    'Đã cập nhật thông báo!': 'Notification updated!',
    'Đã tạo thông báo!': 'Notification created!',
    'Xóa thông báo này?': 'Delete this notification?',
    'Đã xóa thông báo!': 'Notification deleted!',
    'Ảnh không được vượt quá 5MB!': 'Image must not exceed 5MB!',
    'Họ tên phải có ít nhất 2 ký tự!': 'Name must have at least 2 characters!',
    'Cập nhật thông tin thành công!': 'Info updated successfully!',
    'Vui lòng điền đầy đủ thông tin!': 'Please fill in all fields!',
    'Mật khẩu mới phải có ít nhất 6 ký tự!': 'New password must be at least 6 characters!',
    'Xác nhận mật khẩu không khớp!': 'Password confirmation does not match!',
    'Đổi mật khẩu thành công!': 'Password changed successfully!',
    'Đổi mật khẩu thất bại!': 'Password change failed!',
    'Vui lòng tạo báo cáo trước!': 'Please generate report first!',
    'Đã xuất file Excel (.xlsx)!': 'Excel file exported (.xlsx)!',
    'Khóa tài khoản này?': 'Lock this account?',
    'Mở khóa tài khoản này?': 'Unlock this account?',
    'Đã khóa tài khoản!': 'Account locked!',
    'Đã mở khóa tài khoản!': 'Account unlocked!',
    'Xóa vĩnh viễn tài khoản này? Hành động không thể hoàn tác!': 'Permanently delete this account? This action cannot be undone!',
    'Đã xóa tài khoản!': 'Account deleted!',
    'Buộc đăng xuất tài khoản này?': 'Force logout this account?',
    'Đã buộc đăng xuất!': 'Force logout successful!',
    'Đã kết thúc toàn bộ phiên!': 'All sessions ended!',
    'Backup thất bại!': 'Backup failed!',
    'Đã khôi phục dữ liệu!': 'Data restored!',
    'Khôi phục thất bại!': 'Restore failed!',
    'Đã cập nhật chính sách bảo mật!': 'Security policy updated!',
    'Cập nhật thất bại!': 'Update failed!',
    'Đã cập nhật trạng thái!': 'Status updated!',
    'Vui lòng nhập nội dung!': 'Please enter content!',
    'Đã lưu thay đổi!': 'Changes saved!',
    'Đã xóa ticket!': 'Ticket deleted!',
    'Tiêu đề và nội dung không được để trống!': 'Title and content are required!',
    'Sync thất bại, vui lòng thử lại!': 'Sync failed, please try again!',
    'Đang sync...': 'Syncing...',
    'Sync Stats Thực Tế': 'Sync Real Stats',
    'Reset quyền về mặc định của vai trò?': 'Reset permissions to role default?',
    'Reset thất bại!': 'Reset failed!',
    'Lưu thất bại!': 'Save failed!',
    'vô hiệu hóa': 'deactivate',
    'kích hoạt': 'activate',
    'Đã cập nhật dữ liệu!': 'Data updated!',
    'Không thể tải dữ liệu dashboard!': 'Unable to load dashboard data!',
    # Data/label strings
    'Thường': 'Common',
    'Trung Cấp': 'Rare',
    'Hiếm': 'Epic',
    'Sử Thi': 'Epic',
    'Huyền Thoại': 'Legendary',
    'Nộp bài đầu tiên': 'First submission',
    'Đạt 100 điểm': 'Score 100 points',
    'Streak 3 ngày': '3-day streak',
    'Streak 7 ngày': '7-day streak',
    'Streak 14 ngày': '14-day streak',
    'Streak 30 ngày': '30-day streak',
    'Streak 60 ngày': '60-day streak',
    'Số lần luyện tập': 'Practice count',
    'Độ chính xác ≥ 95%': 'Accuracy ≥ 95%',
    'Độ chính xác 100%': '100% accuracy',
    'Điểm TB ≥ 70': 'Avg score ≥ 70',
    'Điểm TB ≥ 80': 'Avg score ≥ 80',
    'Điểm TB ≥ 90': 'Avg score ≥ 90',
    'Điểm TB ≥ 95': 'Avg score ≥ 95',
    'Số bài tập hoàn thành': 'Assignments completed',
    'Số bài kiểm tra đã làm': 'Exams taken',
    '5 bài liên tiếp 100đ': '5 consecutive 100',
    '10 bài liên tiếp 100đ': '10 consecutive 100',
    'Hoàn thành nhanh': 'Quick completion',
    'Tùy chỉnh': 'Custom',
    'Ký hiệu chữ cái': 'Letter signs',
    'Từ vựng': 'Vocabulary',
    'Câu giao tiếp': 'Sentences',
    'Khác': 'Other',
    'Cơ bản': 'Basic',
    'Trung cấp': 'Intermediate',
    'Nâng cao': 'Advanced',
    'Tổng lớp học': 'Total classes',
    'Tổng học viên': 'Total students',
    'Tổng giảng viên': 'Total instructors',
    'Tổng nội dung': 'Total content',
    'Tab hiện tại': 'Current tab',
    'Tổng thông báo': 'Total notifications',
    'Tổng ticket': 'Total tickets',
    'Tổng': 'Total',
    'Hệ thống': 'System',
    'Đang bật': 'Enabled',
    'Đã trao': 'Awarded',
    'Tên huy hiệu': 'Badge name',
    'Từ': 'Word',
    'Cập nhật': 'Update',
    'Nhập email': 'Enter email',
    'Mật khẩu khởi tạo': 'Initial password',
    'Số lớp': 'Classes',
    'Bài kiểm tra': 'Exams',
    'Đăng nhập': 'Login',
    'Đăng nhập thất bại': 'Login failed',
    'Đăng xuất': 'Logout',
    'Đăng ký': 'Register',
    'Nộp bài': 'Submit',
    'Cập nhật hồ sơ': 'Update profile',
    'Đổi mật khẩu': 'Change password',
    'Hành động người dùng': 'User actions',
    'Sự kiện hệ thống': 'System events',
    'Đăng ký mới': 'New registrations',
    'Lượt nộp bài': 'Submissions',
    'Tiến bộ nhất': 'Most improved',
    'Yếu nhất': 'Weakest',
    'Tích cực nhất': 'Most active',
    'Không hoạt động': 'Inactive',
    'Tỷ lệ hoàn thành': 'Completion rate',
    'Điểm TB hệ thống': 'System avg score',
    'Toàn hệ thống': 'Entire system',
    'Học viên yếu': 'Weak students',
    'Đã gửi': 'Sent',
    'Phiên đăng nhập': 'Login sessions',
    'Sao lưu & Khôi phục': 'Backup & Restore',
    'Chính sách bảo mật': 'Security policy',
    'Đang backup...': 'Backing up...',
    'Thành công': 'Success',
    'Mới tạo': 'New',
    'Đang xử lý': 'Processing',
    'Đã hoàn thành': 'Completed',
    'Đã đóng': 'Closed',
    'Nhận diện ASL': 'ASL Recognition',
    'Người dùng': 'User',
    'Quản lý vai trò & quyền': 'Manage roles & permissions',
    'Gán & kiểm tra quyền': 'Assign & check permissions',
    'Tất cả vai trò': 'All roles',
    'Tất cả trạng thái': 'All statuses',
    'Tất cả loại lỗi': 'All error types',
    '● Hoạt động': '● Active',
    '● Bị khóa': '● Locked',
    'Bài thực hành': 'Practice',
    'điểm': 'points',
    'phút': 'minutes',
    'mục': 'items',
    'Tổng bài đã làm': 'Total completed',
    'Bài hoàn thành': 'Completed',
    'Điểm trung bình': 'Average score',
    'Tỷ lệ chính xác': 'Accuracy rate',
    'Thời gian thực hành': 'Practice time',
    'Ngày tạo TK': 'Account created',
    'Ngày tạo:': 'Created:',
    'BÁO CÁO KẾT QUẢ HỌC TẬP HỌC VIÊN': 'STUDENT LEARNING RESULTS REPORT',
    'BÁO CÁO HOẠT ĐỘNG GIẢNG DẠY': 'TEACHING ACTIVITY REPORT',
    'BÁO CÁO TỔNG HỢP HỆ THỐNG': 'SYSTEM SUMMARY REPORT',
    'BÁO CÁO KẾT QUẢ HỌC TẬP': 'LEARNING RESULTS REPORT',
    'Hệ thống thực hành, kiểm tra và đánh giá thủ ngữ ASL': 'ASL practice, testing and evaluation system',
    'Thống kê hoạt động giảng dạy của giảng viên': 'Instructor teaching activity statistics',
    'Thống kê dữ liệu vận hành toàn hệ thống': 'System-wide operation data statistics',
    'Kết quả học tập': 'Learning results',
    'Hoạt động giảng dạy': 'Teaching activities',
    'Tổng hợp hệ thống': 'System summary',
    'Số báo cáo:': 'Report #:',
    'Ngày lập:': 'Date:',
    'Kỳ báo cáo:': 'Period:',
    'Lớp:': 'Class:',
    'Học viên:': 'Students:',
    'Lớp học:': 'Class:',
    'Tổng số học viên:': 'Total students:',
    'Tổng giảng viên:': 'Total instructors:',
    'Tổng bản ghi:': 'Total records:',
    'Báo cáo học viên': 'Student report',
    'Báo cáo giảng viên': 'Instructor report',
    'Báo cáo hệ thống': 'System report',
    'Tất cả lớp': 'All classes',
    'Tất cả học viên': 'All students',
    'Đang tải...': 'Loading...',
    'Quản lý học viên': 'Student management',
    'Xem học viên': 'View students',
    'Tạo bài tập': 'Create assignments',
    'Xem bài tập': 'View assignments',
    'Chấm bài': 'Grade',
    'Tạo bài kiểm tra': 'Create exams',
    'Xem báo cáo': 'View reports',
    'Xuất báo cáo': 'Export reports',
    'Gửi thông báo': 'Send notifications',
    'Quản lý người dùng': 'User management',
    'Quản lý hệ thống': 'System management',
    'Bạn có chắc muốn xóa ticket này không? Hành động này không thể hoàn tác.': 'Are you sure you want to delete this ticket? This cannot be undone.',
    'Đã chuyển sang Tiếng Việt': 'Đã chuyển sang Tiếng Việt',
    'Kết thúc toàn bộ phiên đăng nhập của tất cả người dùng? Hành động này sẽ đăng xuất mọi người.': 'End all login sessions? This will log out everyone.',
    'Tìm huy hiệu...': 'Search badges...',
    'Tìm theo tên lớp...': 'Search by class name...',
    'Tìm theo tên, email...': 'Search by name, email...',
    'Mô tả lớp học...': 'Class description...',
    '-- Chọn giảng viên --': '-- Select instructor --',
    '-- Chọn học viên --': '-- Select student --',
    '-- Chọn lớp đích --': '-- Select target class --',
    '-- Chọn giảng viên mới --': '-- Select new instructor --',
    '-- Chọn lớp --': '-- Select class --',
    '-- Chọn nhóm --': '-- Select group --',
    '-- Chọn chủ đề --': '-- Select topic --',
    'Nhập nghĩa tiếng Việt...': 'Enter Vietnamese meaning...',
    'Nhập tiêu đề thông báo...': 'Enter notification title...',
    'Nhập nội dung thông báo...': 'Enter notification content...',
    'Nhập họ và tên...': 'Enter full name...',
    'Nhập mật khẩu hiện tại...': 'Enter current password...',
    'Nhập mật khẩu mới (ít nhất 6 ký tự)...': 'Enter new password (min 6 chars)...',
    'Nhập lại mật khẩu mới...': 'Re-enter new password...',
    'Nhập tin nhắn trả lời...': 'Enter reply message...',
    'Mật khẩu mới (ít nhất 6 ký tự)': 'New password (min 6 chars)',
    'Tìm theo tên, email, mã học viên...': 'Search name, email, student ID...',
    'Tìm tên hoặc email...': 'Search name or email...',
    'VD: Học Viên Chăm Chỉ': 'Ex: Hardworking Student',
    'Mô tả điều kiện...': 'Condition description...',
    'Tất cả độ hiếm': 'All rarities',
    'Học viên': 'Students',
    'Giảng viên': 'Instructors',
    'Lượt học': 'Sessions',
    'Nội dung': 'Content',
    'Họ tên': 'Full name',
    'Bài tập đã giao': 'Assigned tasks',
    'Hoạt động': 'Active',
    'Admin có toàn bộ quyền — không thể thay đổi': 'Admin has full permissions — cannot be changed',
    'Admin được phép toàn bộ quyền trong hệ thống': 'Admin has full permissions in the system',
    'Vai trò này đang bị vô hiệu hóa': 'This role is currently deactivated',
    'Trang đầu': 'First',
    'Trang trước': 'Previous',
    'Trước': 'Prev',
    'Trang cuối': 'Last',
    'Đang hoạt động': 'Active',
    'Toàn bộ hệ thống (tất cả học viên + giảng viên)': 'Entire system (all students + instructors)',
    'Tất cả học viên': 'All students',
    'Tất cả giảng viên': 'All instructors',
    'Theo lớp': 'By class',
    'Theo nhóm': 'By group',
    'Học viên yếu (điểm dưới 50)': 'Weak students (score below 50)',
    'Học viên mới (7 ngày gần đây)': 'New students (last 7 days)',
}

files_to_process = [f for f in os.listdir(directory) if f.endswith('.jsx')]
new_vi = {}
new_en = {}

for filename in sorted(files_to_process):
    filepath = os.path.join(directory, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Find all single-quoted strings with Vietnamese
    def replacer(match):
        text = match.group(1)
        if not is_viet(text):
            return match.group(0)
        if 'admin.auto' in text:
            return match.group(0)
        
        key = get_key(text)
        safe = text.replace("'", "\\'")
        new_vi[key] = text
        new_en[key] = en_map.get(text, text)
        return f"t('admin.auto.{key}', '{safe}')"
    
    # Replace 'Vietnamese text' that is NOT inside className, import, src, style, path contexts
    # We process line by line for more control
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        stripped = line.strip()
        # Skip comment lines
        if stripped.startswith('//') or stripped.startswith('/*') or stripped.startswith('*'):
            new_lines.append(line)
            continue
        # Skip import lines
        if stripped.startswith('import '):
            new_lines.append(line)
            continue
        # Skip className lines
        if 'className=' in line and 'label' not in line and 'title' not in line:
            # Only skip if this is purely a className line
            if line.count("'") <= 2 and 'className' in line:
                new_lines.append(line)
                continue
        
        new_line = re.sub(r"'([^']{2,}?)'", replacer, line)
        new_lines.append(new_line)
    
    content = '\n'.join(new_lines)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Patched: {filename}')

# Now inject new keys into translations.js
with codecs.open(trans_file, 'r', 'utf-8') as f:
    trans_content = f.read()

# Build vi block
vi_block = ""
for k, v in new_vi.items():
    sv = v.replace("'", "\\'")
    vi_block += f"        {k}: '{sv}',\n"

# Build en block
en_block = ""
for k, v in new_en.items():
    sv = v.replace("'", "\\'")
    en_block += f"        {k}: '{sv}',\n"

# Find and inject into vi.admin.auto (after existing entries)
# We'll find the pattern "k_258f00b2: 'Tắt'," in vi section and prepend before it
import re as re2
vi_match = re2.search(r"(    admin: \{\n      auto: \{\n)", trans_content)
if vi_match:
    pos = vi_match.end()
    trans_content = trans_content[:pos] + vi_block + trans_content[pos:]
    print(f"Injected {len(new_vi)} keys into vi.admin.auto")

# Find en.admin.auto - it appears after vi section
# Find the second occurrence
matches = list(re2.finditer(r"(    admin: \{\n      auto: \{\n)", trans_content))
if len(matches) >= 2:
    pos = matches[1].end()
    trans_content = trans_content[:pos] + en_block + trans_content[pos:]
    print(f"Injected {len(new_en)} keys into en.admin.auto")

with codecs.open(trans_file, 'w', 'utf-8') as f:
    f.write(trans_content)

print(f"\nTotal new keys: {len(new_vi)}")
print("Done!")
