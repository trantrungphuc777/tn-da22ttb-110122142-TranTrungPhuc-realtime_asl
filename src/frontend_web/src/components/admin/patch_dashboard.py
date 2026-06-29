import re

f = open(r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\components\admin\AdminDashboard.jsx', 'r', encoding='utf-8')
c = f.read()
f.close()

# 1. Add useLanguage import after axios import
if 'useLanguage' not in c:
    c = c.replace("import { toast } from 'react-hot-toast';", "import { toast } from 'react-hot-toast';\nimport { useLanguage } from '../../contexts/LanguageContext';")

# 2. Add const { t } = useLanguage(); inside component
if "const { t } = useLanguage();" not in c:
    c = c.replace(
        "const AdminDashboard = () => {",
        "const AdminDashboard = () => {\n    const { t } = useLanguage();"
    )

# 3. Loading state text
c = c.replace(
    ">Đang tải dữ liệu...</p>",
    ">{t('admin.auto.k_loading_data', 'Đang tải dữ liệu...')}</p>"
)

# 4. Hero banner
c = c.replace(
    "<span className=\"text-blue-200 text-xs font-semibold uppercase tracking-widest\">Live Dashboard</span>",
    "<span className=\"text-blue-200 text-xs font-semibold uppercase tracking-widest\">{t('admin.auto.k_live_dash','Live Dashboard')}</span>"
)
c = c.replace(
    "<h1 className=\"text-3xl font-black text-white mb-1\">Dashboard Quản trị</h1>",
    "<h1 className=\"text-3xl font-black text-white mb-1\">{t('admin.auto.k_dash_title','Dashboard Quản trị')}</h1>"
)
c = c.replace(
    "<p className=\"text-blue-200 text-sm\">Tổng quan hệ thống ASL — cập nhật thời gian thực</p>",
    "<p className=\"text-blue-200 text-sm\">{t('admin.auto.k_dash_sub','Tổng quan hệ thống ASL — cập nhật thời gian thực')}</p>"
)
c = c.replace(
    "<p className=\"text-blue-300 text-xs\">Tài khoản</p>",
    "<p className=\"text-blue-300 text-xs\">{t('admin.auto.k_acc','Tài khoản')}</p>"
)
c = c.replace(
    "<p className=\"text-blue-300 text-xs\">Trạng thái</p>",
    "<p className=\"text-blue-300 text-xs\">{t('admin.auto.k_status','Trạng thái')}</p>"
)
c = c.replace(
    "{refreshing ? 'Đang tải...' : 'Làm mới'}",
    "{refreshing ? t('admin.auto.k_d5fe42f6','Đang tải...') : t('admin.auto.k_4d20363e','Làm mới')}"
)
c = c.replace(
    "if (silent) toast.success('Đã cập nhật dữ liệu!',",
    "if (silent) toast.success(t('admin.auto.k_data_updated','Đã cập nhật dữ liệu!'),",
)
c = c.replace(
    "toast.error('Không thể tải dữ liệu dashboard!');",
    "toast.error(t('admin.auto.k_data_error','Không thể tải dữ liệu dashboard!'));"
)

# 5. SectionHeader props - Users section
c = c.replace(
    'title="Người dùng" subtitle="Thống kê tài khoản thời gian thực"',
    "title={t('admin.auto.k_users','Người dùng')} subtitle={t('admin.auto.k_users_sub','Thống kê tài khoản thời gian thực')}"
)
c = c.replace(
    'badge={`${u.totalAccounts ?? 0} tổng`}',
    "badge={`${u.totalAccounts ?? 0} ${t('admin.auto.k_total','tổng')}`}"
)

# 6. KPI labels - users
c = c.replace('label="Học viên"', "label={t('admin.auto.k_1b83df7a','Học viên')}")
c = c.replace('label="Giảng viên"', "label={t('admin.auto.k_6e4e1637','Giảng viên')}")
c = c.replace('label="Hoạt động"', "label={t('admin.auto.k_cfaecd87','Hoạt động')}")
c = c.replace('label="Bị khóa"', "label={t('admin.auto.k_fce0d83b','Bị khóa')}")
c = c.replace('label="Mới hôm nay"', "label={t('admin.auto.k_new_today','Mới hôm nay')}")
c = c.replace('label="Mới tháng này"', "label={t('admin.auto.k_new_month','Mới tháng này')}")
c = c.replace('label="Tổng tài khoản"', "label={t('admin.auto.k_total_acc','Tổng tài khoản')}")

# 7. Learning section
c = c.replace(
    'title="Học tập" subtitle="Thống kê hoạt động học tập"',
    "title={t('admin.auto.k_learning','Học tập')} subtitle={t('admin.auto.k_learn_sub','Thống kê hoạt động học tập')}"
)
c = c.replace('label="Bài tập đã tạo"', "label={t('admin.auto.k_assign_created','Bài tập đã tạo')}")
c = c.replace('label="Bài kiểm tra đã tạo"', "label={t('admin.auto.k_exam_created','Bài kiểm tra đã tạo')}")
c = c.replace('label="Hoàn thành hôm nay"', "label={t('admin.auto.k_comp_today','Hoàn thành hôm nay')}")
c = c.replace('label="Hoàn thành tháng này"', "label={t('admin.auto.k_comp_month','Hoàn thành tháng này')}")
c = c.replace('sub="Tổng assignment"', "sub={t('admin.auto.k_tot_assign','Tổng assignment')}")
c = c.replace('sub="Tổng exam"', "sub={t('admin.auto.k_tot_exam','Tổng exam')}")
c = c.replace('sub={`ĐTB: ${l.avgScore ?? 0}`}', "sub={`${t('admin.auto.k_avg_score','ĐTB')}: ${l.avgScore ?? 0}`}")

# 8. System section
c = c.replace(
    'title="Hệ thống" subtitle="Trạng thái máy chủ & tài nguyên"',
    "title={t('admin.auto.k_system','Hệ thống')} subtitle={t('admin.auto.k_sys_sub','Trạng thái máy chủ & tài nguyên')}"
)
c = c.replace(
    '<p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Trạng thái hệ thống</p>',
    "<p className=\"text-xs font-semibold text-slate-500 uppercase tracking-wide\">{t('admin.auto.k_sys_status','Trạng thái hệ thống')}</p>"
)
c = c.replace('label="DB Size"', "label={t('admin.auto.k_db_size','DB Size')}")
c = c.replace('label="Đang online"', "label={t('admin.auto.k_online_now','Đang online')}")
c = c.replace('label="TK mới hôm nay"', "label={t('admin.auto.k_new_acc_today','TK mới hôm nay')}")
c = c.replace('label="Huy hiệu đã trao"', "label={t('admin.auto.k_badges_awarded','Huy hiệu đã trao')}")

# 9. Charts section header
c = c.replace(
    'title="Biểu đồ phân tích" subtitle="Xu hướng & hoạt động theo thời gian"',
    "title={t('admin.auto.k_charts','Biểu đồ phân tích')} subtitle={t('admin.auto.k_charts_sub','Xu hướng & hoạt động theo thời gian')}"
)
c = c.replace('title="Tăng trưởng người dùng"', "title={t('admin.auto.k_user_growth','Tăng trưởng người dùng')}")

# 10. Growth tab labels
c = c.replace(
    "{[{k:'day',l:'Ngày'},{k:'month',l:'Tháng'},{k:'year',l:'Năm'}]",
    "{[{k:'day',l:t('admin.auto.k_day','Ngày')},{k:'month',l:t('admin.auto.k_month','Tháng')},{k:'year',l:t('admin.auto.k_year','Năm')}]"
)

# 11. Chart titles
c = c.replace('title="Hoạt động học tập theo tháng"', "title={t('admin.auto.k_learn_month','Hoạt động học tập theo tháng')}")
c = c.replace('title="Tỷ lệ hoàn thành"', "title={t('admin.auto.k_comp_rate','Tỷ lệ hoàn thành')}")
c = c.replace(
    '<span className="text-xs text-slate-500">hoàn thành</span>',
    "<span className=\"text-xs text-slate-500\">{t('admin.auto.k_completed_text','hoàn thành')}</span>"
)
c = c.replace('title="Nhận diện ASL"', "title={t('admin.auto.k_asl_recog','Nhận diện ASL')}")
c = c.replace('title="Chỉ số tổng hợp"', "title={t('admin.auto.k_agg_index','Chỉ số tổng hợp')}")
c = c.replace('title="So sánh thực hành & kiểm tra"', "title={t('admin.auto.k_compare','So sánh thực hành & kiểm tra')}")

# 12. LegendDot labels
c = c.replace(
    "label={`Đã xong ${completionRate}%`}",
    "label={`${t('admin.auto.k_done','Đã xong')} ${completionRate}%`}"
)
c = c.replace(
    "label={`Còn lại ${100-completionRate}%`}",
    "label={`${t('admin.auto.k_remaining','Còn lại')} ${100-completionRate}%`}"
)

# 13. Chart data keys for learning activity bars
c = c.replace(
    "const learningData  = (c.learningActivity||[]).slice(-8).map(i=>({ label:`T${i._id?.month}/${String(i._id?.year).slice(-2)}`, 'Thực hành':i.count??0, 'Kiểm tra':i.examCount??0 }));",
    "const practiceKey = t('admin.auto.k_practice','Thực hành'); const examKey = t('admin.auto.k_exam','Kiểm tra');\n    const learningData  = (c.learningActivity||[]).slice(-8).map(i=>({ label:`T${i._id?.month}/${String(i._id?.year).slice(-2)}`, [practiceKey]:i.count??0, [examKey]:i.examCount??0 }));"
)
c = c.replace(
    "const safeLearning  = learningData.length ? learningData : [{label:'—','Thực hành':0,'Kiểm tra':0}];",
    "const safeLearning  = learningData.length ? learningData : [{label:'—',[practiceKey]:0,[examKey]:0}];"
)

# 14. Pie chart data names
c = c.replace("name:'Hoàn thành',value:completionRate", "name:t('admin.auto.k_eb889c21','Hoàn thành'),value:completionRate")
c = c.replace("name:'Còn lại',value:100-completionRate", "name:t('admin.auto.k_remaining','Còn lại'),value:100-completionRate")
c = c.replace("{name:'Đúng',value:recCorrect", "{name:t('admin.auto.k_correct','Đúng'),value:recCorrect")
c = c.replace("{name:'Sai',value:recIncorrect", "{name:t('admin.auto.k_incorrect','Sai'),value:recIncorrect")
c = c.replace("{name:'Hoàn thành', value:completionRate", "{name:t('admin.auto.k_eb889c21','Hoàn thành'), value:completionRate")
c = c.replace("{name:'Nhận diện',  value:recCorrect", "{name:t('admin.auto.k_recognition','Nhận diện'),  value:recCorrect")
c = c.replace("{name:'Online',     value:Math.min", "{name:'Online',     value:Math.min")

# 15. Bar/Area dataKey names
c = c.replace('dataKey="Thực hành"', "dataKey={practiceKey}")
c = c.replace('dataKey="Kiểm tra"', "dataKey={examKey}")
c = c.replace('name="Người dùng mới"', "name={t('admin.auto.k_new_users_chart','Người dùng mới')}")

open(r'd:\CC\Sign-Language-To-Text-and-Speech-Conversion\backend_server\frontend_web\src\components\admin\AdminDashboard.jsx', 'w', encoding='utf-8').write(c)
print("Done!")
