import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { FileText, Download, Filter, Users, GraduationCap, BarChart3, Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

const API       = 'http://localhost:5000/api/admin/reports';
const CLASS_API = 'http://localhost:5000/api/admin/classes';
const STU_API   = 'http://localhost:5000/api/admin/students';

// ── Helpers ────────────────────────────────────────────────────────────────
const now = () => new Date();
const fmtDate = (d) => new Date(d).toLocaleDateString('vi-VN');
const fmtDateTime = (d) => new Date(d).toLocaleString();
const reportCode = (type) => {
    const map = { students: 'BC-HV', instructors: 'BC-GV', system: 'BC-HT' };
    const d = now();
    return `${map[type] || 'BC'}-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
};

// ── Print styles injected once ─────────────────────────────────────────────
const PRINT_STYLE = `
@media print {
  body * { visibility: hidden; }
  #report-print-area, #report-print-area * { visibility: visible; }
  #report-print-area {
    position: absolute;
    top: 0; left: 0;
    width: 100%;
    padding: 12mm 16mm;
    background: #fff;
    font-family: 'Times New Roman', serif;
    font-size: 12pt;
    color: #000;
    box-sizing: border-box;
  }
  table { border-collapse: collapse; width: 100%; margin-bottom: 8pt; }
  th, td { border: 1px solid #333; padding: 4px 7px; font-size: 10.5pt; }
  thead tr th { background: #e8e8e8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; }
  tr { page-break-inside: avoid; }
  @page { margin: 10mm; size: A4 portrait; }
}
`;

// ── PrintDocument component (hidden, shown only on print) ─────────────────
const PrintDocument = React.forwardRef(({ type, data, filters, classes, students, generatedAt }, ref) => {
    const { t } = useLanguage();
    const cls = classes.find(c => c._id === filters.classId);
    const stu = students.find(s => s._id === filters.studentId);

    return (
        <div id="report-print-area" ref={ref} style={{ display: 'none' }}>
            {/* Tiêu đề đơn vị */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' }}> {t('admin.auto.k_4493dca0', t('admin.auto.k_4493dca0', 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM'))} </div>
                <div style={{ fontSize: 11 }}> {t('admin.auto.k_fda7549b', t('admin.auto.k_fda7549b', 'Độc lập – Tự do – Hạnh phúc'))} </div>
                <div style={{ fontSize: 11, marginTop: 2 }}>──────────────</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontSize: 12 }}>
                <div>
                    <div style={{ fontWeight: 'bold', textTransform: 'uppercase' }}> {t('admin.auto.k_56622ac8', t('admin.auto.k_56622ac8', 'HỆ THỐNG ĐÀO TẠO NGÔN NGỮ KÝ HIỆU ASL'))} </div>
                    <div> {t('admin.auto.k_e99c1f37', t('admin.auto.k_e99c1f37', 'Địa chỉ: Ho Chi Minh City, Việt Nam'))} </div>
                    <div>Email: admin@asl-edu.vn</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div> {t('admin.auto.k_0e6e025c', t('admin.auto.k_0e6e025c', 'No:'))} <strong>{reportCode(type)}</strong></div>
                    <div> {t('admin.auto.k_e62a4253', t('admin.auto.k_e62a4253', 'Date:'))} <strong>{fmtDate(generatedAt || now())}</strong></div>
                </div>
            </div>

            {/* Tên báo cáo */}
            <div style={{ textAlign: 'center', margin: '16px 0 12px' }}>
                <div style={{ fontSize: 16, fontWeight: 'bold', textTransform: 'uppercase' }}>
                    {type === 'students' ? t('admin.auto.k_ec1370b4', 'BÁO CÁO KẾT QUẢ HỌC TẬP HỌC VIÊN')
                     : type === 'instructors' ? t('admin.auto.k_c83ee0f5', 'BÁO CÁO HOẠT ĐỘNG GIẢNG DẠY')
                     : t('admin.auto.k_4dfcb4a9', 'BÁO CÁO TỔNG HỢP HỆ THỐNG')}
                </div>
                <div style={{ fontSize: 13, fontStyle: 'italic', marginTop: 4 }}>
                    {type === 'students' ? t('admin.auto.k_d647cef2', 'Hệ thống thực hành, kiểm tra và đánh giá thủ ngữ ASL')
                     : type === 'instructors' ? t('admin.auto.k_f76ea705', 'Thống kê hoạt động giảng dạy của giảng viên')
                     : t('admin.auto.k_910dd736', 'Thống kê dữ liệu vận hành toàn hệ thống')}
                </div>
            </div>

            {/* Thông tin chung */}
            <div style={{ border: '1px solid #ccc', padding: '8px 12px', marginBottom: 14, fontSize: 12, background: '#fafafa' }}>
                <div><strong> {t('admin.auto.k_97c83cf4', t('admin.auto.k_97c83cf4', 'Kỳ báo cáo:'))} </strong> {filters.startDate ? `${fmtDate(filters.startDate)} – ${fmtDate(filters.endDate || now())}` : t('admin.auto.k_9380e353', 'Toàn bộ thời gian')}</div>
                {type === 'students' && <div><strong> {t('admin.auto.k_b6bfbad9', t('admin.auto.k_b6bfbad9', 'Lớp học:'))} </strong> {cls?.name || t('admin.auto.k_addc984b', 'Tất cả lớp học')}</div>}
                {type === 'students' && <div><strong> {t('admin.auto.k_7e880e0e', t('admin.auto.k_7e880e0e', 'Học viên:'))} </strong> {stu?.fullName || t('admin.auto.k_78d82c4a', 'Tất cả học viên')}</div>}
                <div><strong> {t('admin.auto.k_47fc1783', t('admin.auto.k_47fc1783', 'Người lập báo cáo:'))} </strong> {t('admin.auto.k_f827ee9a', t('admin.auto.k_f827ee9a', 'Quản trị viên hệ thống'))} </div>
                <div><strong> {t('admin.auto.k_484b7be8', t('admin.auto.k_484b7be8', 'Thời gian xuất:'))} </strong> {fmtDateTime(generatedAt || now())}</div>
            </div>

            {/* Nội dung bảng */}
            {type === 'students' && (
                <>
                    <div style={{ fontWeight: 'bold', marginBottom: 6 }}> {t('admin.auto.k_062d9459', t('admin.auto.k_062d9459', 'I. DANH SÁCH KẾT QUẢ HỌC TẬP'))} </div>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 30 }}>STT</th>
                                <th> {t('admin.auto.k_623825de', t('admin.auto.k_623825de', 'Họ và tên'))} </th>
                                <th>Email</th>
                                <th> {t('admin.auto.k_74dd5d08', t('admin.auto.k_74dd5d08', 'Điểm TB'))} </th>
                                <th> {t('admin.auto.k_cb1832b2', t('admin.auto.k_cb1832b2', 'Độ chính xác'))} </th>
                                <th> {t('admin.auto.k_970c69b4', t('admin.auto.k_970c69b4', 'Tổng bài'))} </th>
                                <th> {t('admin.auto.k_eb889c21', t('admin.auto.k_eb889c21', 'Hoàn thành'))} </th>
                                <th> {t('admin.auto.k_1e047734', t('admin.auto.k_1e047734', 'Tỷ lệ HT'))} </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data || []).map((d, i) => {
                                const rate = d.summary?.totalSubmissions > 0
                                    ? Math.round((d.summary.completed / d.summary.totalSubmissions) * 100) : 0;
                                return (
                                    <tr key={i}>
                                        <td style={{ textAlign: 'center' }}>{i + 1}</td>
                                        <td>{d.student?.fullName}</td>
                                        <td>{d.student?.email}</td>
                                        <td style={{ textAlign: 'center' }}>{(d.summary?.averageScore || 0).toFixed(1)}</td>
                                        <td style={{ textAlign: 'center' }}>{(d.summary?.averageAccuracy || 0).toFixed(1)}%</td>
                                        <td style={{ textAlign: 'center' }}>{d.summary?.totalSubmissions || 0}</td>
                                        <td style={{ textAlign: 'center' }}>{d.summary?.completed || 0}</td>
                                        <td style={{ textAlign: 'center' }}>{rate}%</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    <div style={{ marginTop: 8, fontSize: 12, fontStyle: 'italic' }}> {t('admin.auto.k_2601678f', t('admin.auto.k_2601678f', 'Tổng số học viên:'))} <strong>{(data || []).length}</strong> {t('admin.auto.k_61b4cdc7', t('admin.auto.k_61b4cdc7', 'people'))} </div>
                </>
            )}

            {type === 'instructors' && (
                <>
                    <div style={{ fontWeight: 'bold', marginBottom: 6 }}> {t('admin.auto.k_22a67ca9', t('admin.auto.k_22a67ca9', 'I. THỐNG KÊ HOẠT ĐỘNG GIẢNG DẠY'))} </div>
                    <table>
                        <thead>
                            <tr>
                                <th style={{ width: 30 }}>STT</th>
                                <th> {t('admin.auto.k_6c7b8f2e', t('admin.auto.k_6c7b8f2e', 'Họ và tên giảng viên'))} </th>
                                <th>Email</th>
                                <th> {t('admin.auto.k_7d0a9099', t('admin.auto.k_7d0a9099', 'Số lớp phụ trách'))} </th>
                                <th> {t('admin.auto.k_dd75f11c', t('admin.auto.k_dd75f11c', 'Số học viên'))} </th>
                                <th> {t('admin.auto.k_533a8175', t('admin.auto.k_533a8175', 'Bài tập đã giao'))} </th>
                            </tr>
                        </thead>
                        <tbody>
                            {(data || []).map((d, i) => (
                                <tr key={i}>
                                    <td style={{ textAlign: 'center' }}>{i + 1}</td>
                                    <td>{d.instructor?.fullName}</td>
                                    <td>{d.instructor?.email}</td>
                                    <td style={{ textAlign: 'center' }}>{d.classCount || 0}</td>
                                    <td style={{ textAlign: 'center' }}>{d.studentCount || 0}</td>
                                    <td style={{ textAlign: 'center' }}>{d.assignmentCount || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div style={{ marginTop: 8, fontSize: 12, fontStyle: 'italic' }}> {t('admin.auto.k_f070934f', t('admin.auto.k_f070934f', 'Tổng số giảng viên:'))} <strong>{(data || []).length}</strong> {t('admin.auto.k_61b4cdc7', t('admin.auto.k_61b4cdc7', 'people'))} </div>
                </>
            )}

            {type === 'system' && (
                <>
                    <div style={{ fontWeight: 'bold', marginBottom: 6 }}> {t('admin.auto.k_633e8712', t('admin.auto.k_633e8712', 'I. TỔNG HỢP DỮ LIỆU HỆ THỐNG'))} </div>
                    <table>
                        <thead><tr><th> {t('admin.auto.k_545ea6bb', t('admin.auto.k_545ea6bb', 'Chỉ số'))} </th><th> {t('admin.auto.k_1fc5589a', t('admin.auto.k_1fc5589a', 'Giá trị'))} </th><th> {t('admin.auto.k_f481f91e', t('admin.auto.k_f481f91e', 'Ghi chú'))} </th></tr></thead>
                        <tbody>
                            <tr><td> {t('admin.auto.k_713969d9', t('admin.auto.k_713969d9', 'Tổng số tài khoản'))} </td><td style={{ textAlign: 'center' }}>{data?.totalAccounts ?? 0}</td><td> {t('admin.auto.k_fdc83a5f', t('admin.auto.k_fdc83a5f', 'Bao gồm học viên, giảng viên, quản trị viên'))} </td></tr>
                            <tr><td> {t('admin.auto.k_aba9ae02', t('admin.auto.k_aba9ae02', 'Tổng lượt nộp bài'))} </td><td style={{ textAlign: 'center' }}>{data?.totalSubmissions ?? 0}</td><td> {t('admin.auto.k_73e5e5d8', t('admin.auto.k_73e5e5d8', 'Tất cả bài thực hành và kiểm tra'))} </td></tr>
                            <tr><td> {t('admin.auto.k_3e3d7a99', t('admin.auto.k_3e3d7a99', 'Tổng lượt nhận diện ASL'))} </td><td style={{ textAlign: 'center' }}>{data?.totalRecognitions ?? 0}</td><td> {t('admin.auto.k_47ae3c81', t('admin.auto.k_47ae3c81', 'Lượt sử dụng camera nhận diện ký hiệu'))} </td></tr>
                        </tbody>
                    </table>
                </>
            )}

            {/* Nhận xét & kiến nghị */}
            <div style={{ marginTop: 20 }}>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}> {t('admin.auto.k_9e82f1ec', t('admin.auto.k_9e82f1ec', 'II. NHẬN XÉT VÀ KIẾN NGHỊ'))} </div>
                <div style={{ border: '1px solid #ccc', minHeight: 60, padding: '6px 10px', fontSize: 12, color: '#555', fontStyle: 'italic' }}> {t('admin.auto.k_14183906', t('admin.auto.k_14183906', '(Quản trị viên điền tay sau khi in)'))} </div>
            </div>

            {/* Chữ ký */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 32, fontSize: 12 }}>
                <div style={{ textAlign: 'center', width: '45%' }}>
                    <div style={{ fontStyle: 'italic' }}> {t('admin.auto.k_003f1581', t('admin.auto.k_003f1581', 'Người lập báo cáo'))} </div>
                    <div style={{ fontSize: 11, marginBottom: 48 }}> {t('admin.auto.k_140e12cb', t('admin.auto.k_140e12cb', '(Ký, ghi rõ họ tên)'))} </div>
                    <div style={{ borderTop: '1px solid #000', paddingTop: 4 }}> {t('admin.auto.k_f827ee9a', t('admin.auto.k_f827ee9a', 'Quản trị viên hệ thống'))} </div>
                </div>
                <div style={{ textAlign: 'center', width: '45%' }}>
                    <div style={{ whiteSpace: 'nowrap' }}>{t('admin.auto.k_report_date_line', 'Ho Chi Minh City, {day}/{month}/{year}').replace('{day}', now().getDate()).replace('{month}', now().getMonth()+1).replace('{year}', now().getFullYear())}</div>
                    <div style={{ fontWeight: 'bold', marginTop: 2 }}> {t('admin.auto.k_637ca96b', t('admin.auto.k_637ca96b', 'NGƯỜI PHÊ DUYỆT'))} </div>
                    <div style={{ fontSize: 11, marginBottom: 48 }}> {t('admin.auto.k_e99ae0a7', t('admin.auto.k_e99ae0a7', '(Ký, đóng dấu)'))} </div>
                    <div style={{ borderTop: '1px solid #000', paddingTop: 4 }}> {t('admin.auto.k_b0aeb588', t('admin.auto.k_b0aeb588', 'Trưởng bộ phận quản lý'))} </div>
                </div>
            </div>
        </div>
    );
});
PrintDocument.displayName = 'PrintDocument';

// ── Main component ──────────────────────────────────────────────────────────
const AdminReports = () => {
    const { t } = useLanguage();
    const [activeTab, setActiveTab]   = useState('students');
    const [loading, setLoading]       = useState(false);
    const [reportData, setReportData] = useState(null);
    const [filters, setFilters]       = useState({ classId: '', startDate: '', endDate: '', studentId: '' });
    const [classes, setClasses]       = useState([]);
    const [students, setStudents]     = useState([]);
    const printRef = useRef();

    const token   = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        axios.get(CLASS_API, { headers, params: { limit: 100 } }).then(r => setClasses(r.data.classes || [])).catch(() => {});
        axios.get(STU_API,   { headers, params: { limit: 200 } }).then(r => setStudents(r.data.students || [])).catch(() => {});
        // Inject print styles once
        if (!document.getElementById('report-print-style')) {
            const s = document.createElement('style');
            s.id = 'report-print-style';
            s.innerHTML = PRINT_STYLE;
            document.head.appendChild(s);
        }
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API}/${activeTab}`, { headers, params: filters });
            setReportData(res.data);
        } catch { toast.error(t('admin.auto.k_a733ccf0', 'Không thể tải báo cáo!')); }
        finally { setLoading(false); }
    };

    // CF8.4 — Xuất PDF (print với layout chuyên nghiệp)
    const exportPDF = () => {
        if (!reportData) { toast.error(t('admin.auto.k_a63038c1', 'Vui lòng tạo báo cáo trước!')); return; }
        // Hiện print area, đợi DOM render xong mới print
        if (printRef.current) printRef.current.style.display = 'block';
        // Dùng afterprint event để reset sau khi đóng dialog in
        const cleanup = () => {
            if (printRef.current) printRef.current.style.display = 'none';
            window.removeEventListener('afterprint', cleanup);
        };
        window.addEventListener('afterprint', cleanup);
        // 2 requestAnimationFrame đảm bảo DOM commit xong trước khi print
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                window.print();
            });
        });
    };

    // CF8.4 — Xuất Excel thực sự (.xlsx) với header chuyên nghiệp
    const exportExcel = () => {
        if (!reportData) { toast.error(t('admin.auto.k_a63038c1', 'Vui lòng tạo báo cáo trước!')); return; }
        const wb = XLSX.utils.book_new();
        const code = reportCode(activeTab);
        const dateStr = fmtDate(now());

        if (activeTab === 'students') {
            // Sheet 1: Thông tin báo cáo
            const infoRows = [
                [t('admin.auto.k_56622ac8', 'HỆ THỐNG ĐÀO TẠO NGÔN NGỮ KÝ HIỆU ASL')],
                [t('admin.auto.k_ec1370b4', 'BÁO CÁO KẾT QUẢ HỌC TẬP HỌC VIÊN')],
                [],
                [t('admin.auto.k_6f74d339', 'Số báo cáo:'), code],
                [t('admin.auto.k_e62a4253', 'Date:'), dateStr],
                [t('admin.auto.k_97c83cf4', 'Kỳ báo cáo:'), filters.startDate ? `${fmtDate(filters.startDate)} – ${fmtDate(filters.endDate || now())}` : t('admin.auto.k_9380e353', 'Toàn bộ thời gian')],
                [t('admin.auto.k_b6bfbad9', 'Lớp học:'), classes.find(c => c._id === filters.classId)?.name || t('admin.auto.k_d8586d08', 'Tất cả')],
                [t('admin.auto.k_7e880e0e', 'Học viên:'), students.find(s => s._id === filters.studentId)?.fullName || t('admin.auto.k_d8586d08', 'Tất cả')],
                [t('admin.auto.k_2601678f', 'Tổng số học viên:'), (reportData.data || []).length],
                [],
                ['STT', t('admin.auto.k_623825de', 'Họ và tên'), 'Email', t('admin.auto.k_4bf3eb4c', 'Điểm trung bình'), t('admin.auto.k_7b942384', 'Độ chính xác (%)'), t('admin.auto.k_cba15412', 'Tổng số bài'), t('admin.auto.k_d0845351', 'Bài hoàn thành'), t('admin.auto.k_2cb1e0f6', 'Tỷ lệ hoàn to (%)')],
            ];
            (reportData.data || []).forEach((d, i) => {
                const rate = d.summary?.totalSubmissions > 0
                    ? Math.round((d.summary.completed / d.summary.totalSubmissions) * 100) : 0;
                infoRows.push([
                    i + 1,
                    d.student?.fullName || '',
                    d.student?.email || '',
                    parseFloat((d.summary?.averageScore || 0).toFixed(1)),
                    parseFloat((d.summary?.averageAccuracy || 0).toFixed(1)),
                    d.summary?.totalSubmissions || 0,
                    d.summary?.completed || 0,
                    rate,
                ]);
            });
            const ws = XLSX.utils.aoa_to_sheet(infoRows);
            ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 14 }, { wch: 16 }, { wch: 12 }, { wch: 14 }, { wch: 18 }];
            XLSX.utils.book_append_sheet(wb, ws, t('admin.auto.k_87085f3c', 'Kết quả học tập'));

        } else if (activeTab === 'instructors') {
            const rows = [
                [t('admin.auto.k_56622ac8', 'HỆ THỐNG ĐÀO TẠO NGÔN NGỮ KÝ HIỆU ASL')],
                [t('admin.auto.k_c83ee0f5', 'BÁO CÁO HOẠT ĐỘNG GIẢNG DẠY')],
                [],
                [t('admin.auto.k_6f74d339', 'Số báo cáo:'), code],
                [t('admin.auto.k_e62a4253', 'Date:'), dateStr],
                [t('admin.auto.k_5111cc9d', 'Tổng giảng viên:'), (reportData.data || []).length],
                [],
                ['STT', t('admin.auto.k_6c7b8f2e', 'Họ và tên giảng viên'), 'Email', t('admin.auto.k_7d0a9099', 'Số lớp phụ trách'), t('admin.auto.k_34b8ad83', 'Số học viên quản lý'), t('admin.auto.k_1bbfb4e6', 'Số bài tập đã giao')],
            ];
            (reportData.data || []).forEach((d, i) => {
                rows.push([i + 1, d.instructor?.fullName || '', d.instructor?.email || '', d.classCount || 0, d.studentCount || 0, d.assignmentCount || 0]);
            });
            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws['!cols'] = [{ wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 16 }, { wch: 20 }, { wch: 20 }];
            XLSX.utils.book_append_sheet(wb, ws, t('admin.auto.k_be06b53d', 'Hoạt động giảng dạy'));

        } else {
            const rows = [
                [t('admin.auto.k_56622ac8', 'HỆ THỐNG ĐÀO TẠO NGÔN NGỮ KÝ HIỆU ASL')],
                [t('admin.auto.k_4dfcb4a9', 'BÁO CÁO TỔNG HỢP HỆ THỐNG')],
                [],
                [t('admin.auto.k_6f74d339', 'Số báo cáo:'), code],
                [t('admin.auto.k_e62a4253', 'Date:'), dateStr],
                [],
                [t('admin.auto.k_545ea6bb', 'Chỉ số'), t('admin.auto.k_1fc5589a', 'Giá trị'), t('admin.auto.k_f481f91e', 'Ghi chú')],
                [t('admin.auto.k_713969d9', 'Tổng số tài khoản'), reportData.totalAccounts ?? 0, t('admin.auto.k_b1db535d', 'Học viên + giảng viên + quản trị viên')],
                [t('admin.auto.k_aba9ae02', 'Tổng lượt nộp bài'), reportData.totalSubmissions ?? 0, t('admin.auto.k_4a9ae26f', 'Thực hành và kiểm tra')],
                [t('admin.auto.k_3e3d7a99', 'Tổng lượt nhận diện ASL'), reportData.totalRecognitions ?? 0, t('admin.auto.k_31bb1559', 'Lượt sử dụng camera nhận diện')],
            ];
            const ws = XLSX.utils.aoa_to_sheet(rows);
            ws['!cols'] = [{ wch: 28 }, { wch: 15 }, { wch: 40 }];
            XLSX.utils.book_append_sheet(wb, ws, t('admin.auto.k_5814a77e', 'Tổng hợp hệ thống'));
        }

        XLSX.writeFile(wb, `${code}-${activeTab}.xlsx`);
        toast.success(t('admin.auto.k_e7d7988b', 'Đã xuất file Excel (.xlsx)!'));
    };

    const TABS = [
        { key: 'students',    label: t('admin.auto.k_5368d3c7', 'Báo cáo học viên'),   icon: Users },
        { key: 'instructors', label: t('admin.auto.k_aeb5c838', 'Báo cáo giảng viên'), icon: GraduationCap },
        { key: 'system',      label: t('admin.auto.k_19e0e5b6', 'Báo cáo hệ thống'),   icon: BarChart3 }
    ];

    const printData = activeTab === 'system' ? reportData : reportData?.data;

    return (
        <AdminLayout>
            <div className="space-y-5">
                {/* ── Hero Banner ── */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-500 p-5 shadow-xl no-print">
                    <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                    <div className="absolute top-0 right-0 w-64 h-64 bg-purple-300/20 rounded-full blur-[60px] pointer-events-none" />
                    <div className="absolute bottom-0 left-1/4 w-48 h-48 bg-indigo-300/15 rounded-full blur-[50px] pointer-events-none" />
                    <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <FileText size={16} className="text-white" />
                                </div>
                                <h1 className="text-2xl font-extrabold text-white tracking-tight"> {t('admin.auto.k_70c37bb9', t('admin.auto.k_70c37bb9', 'Hệ thống báo cáo'))} </h1>
                            </div>
                            <p className="text-indigo-100 text-sm"> {t('admin.auto.k_57e2dc2b', t('admin.auto.k_57e2dc2b', 'Xuất báo cáo chính thức theo chuẩn công văn — PDF / Excel (.xlsx)'))} </p>
                            <div className="flex flex-wrap gap-2 mt-3">
                                {[
                                    { label: t('admin.auto.k_5368d3c7', 'Báo cáo học viên'), val: 'BC-HV' },
                                    { label: t('admin.auto.k_aeb5c838', 'Báo cáo giảng viên'), val: 'BC-GV' },
                                    { label: t('admin.auto.k_19e0e5b6', 'Báo cáo hệ thống'), val: 'BC-HT' },
                                ].map((p, i) => (
                                    <div key={i} className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-sm border border-white/20 text-xs text-white font-medium">
                                        <span>{p.label}:</span><span className="font-bold">{p.val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                            <button onClick={exportPDF} disabled={!reportData}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 text-sm font-bold rounded-xl hover:bg-indigo-50 transition-all shadow-lg disabled:opacity-40">
                                <Printer size={15} /> {t('admin.auto.k_d7ab7208', t('admin.auto.k_d7ab7208', 'Xuất PDF'))} </button>
                            <button onClick={exportExcel} disabled={!reportData}
                                className="flex items-center gap-2 px-4 py-2.5 bg-white/20 border border-white/30 text-white text-sm font-bold rounded-xl hover:bg-white/30 transition-all shadow-lg disabled:opacity-40">
                                <Download size={15} /> {t('admin.auto.k_17760def', t('admin.auto.k_17760def', 'Xuất Excel'))} </button>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl w-fit no-print">
                    {TABS.map(tab => {
                        const Icon = tab.icon;
                        return (
                            <button key={tab.key}
                                onClick={() => { setActiveTab(tab.key); setReportData(null); setFilters({ classId: '', startDate: '', endDate: '', studentId: '' }); }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${activeTab === tab.key ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-600 hover:text-slate-800'}`}>
                                <Icon size={14} />{tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Bộ lọc */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 no-print">
                    <h3 className="font-bold text-slate-700 mb-3 flex items-center gap-2 text-sm">
                        <Filter size={14} className="text-violet-500" /> {t('admin.auto.k_19996061', t('admin.auto.k_19996061', 'Bộ lọc báo cáo'))} </h3>
                    <div className="flex flex-wrap gap-3 mb-3">
                        {activeTab === 'students' && (
                            <>
                                <div className="flex-1 min-w-[160px]">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_ee0a050e', t('admin.auto.k_ee0a050e', 'Lớp học'))} </label>
                                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                        value={filters.classId} onChange={e => setFilters({ ...filters, classId: e.target.value })}>
                                        <option value=""> {t('admin.auto.k_5f703d28', t('admin.auto.k_5f703d28', 'Tất cả lớp'))} </option>
                                        {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="flex-1 min-w-[160px]">
                                    <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_1b83df7a', t('admin.auto.k_1b83df7a', 'Học viên'))} </label>
                                    <select className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                        value={filters.studentId} onChange={e => setFilters({ ...filters, studentId: e.target.value })}>
                                        <option value=""> {t('admin.auto.k_78d82c4a', t('admin.auto.k_78d82c4a', 'Tất cả học viên'))} </option>
                                        {students.map(s => <option key={s._id} value={s._id}>{s.fullName}</option>)}
                                    </select>
                                </div>
                            </>
                        )}
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_47ab27a2', t('admin.auto.k_47ab27a2', 'Từ ngày'))} </label>
                            <input type="date" className="w-40 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1"> {t('admin.auto.k_89efbae6', t('admin.auto.k_89efbae6', 'Đến ngày'))} </label>
                            <input type="date" className="w-40 px-3 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30"
                                value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} />
                        </div>
                        <div className="flex items-end">
                            <button onClick={fetchReport} disabled={loading}
                                className="px-6 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 disabled:opacity-50 whitespace-nowrap">
                                {loading ? t('admin.auto.k_d5fe42f6', 'Đang tải...') : t('admin.auto.k_60e167eb', 'Tạo báo cáo')}
                            </button>
                        </div>
                    </div>
                </div>

                {/* View trước báo cáo trên màn hình */}
                {reportData && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                        {/* Header bản xem trước */}
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div className="flex items-center gap-3">
                                <FileText size={18} className="text-violet-500" />
                                <div>
                                    <p className="font-bold text-slate-800 text-sm">
                                        {activeTab === 'students' ? t('admin.auto.k_5c5c18b7', 'BÁO CÁO KẾT QUẢ HỌC TẬP')
                                         : activeTab === 'instructors' ? t('admin.auto.k_c83ee0f5', 'BÁO CÁO HOẠT ĐỘNG GIẢNG DẠY')
                                         : t('admin.auto.k_4dfcb4a9', 'BÁO CÁO TỔNG HỢP HỆ THỐNG')}
                                    </p>
                                    <p className="text-xs text-slate-400">No: {reportCode(activeTab)} · Date: {fmtDate(now())}</p>
                                </div>
                            </div>
                            <span className="text-xs text-slate-400">Exported at: {fmtDateTime(reportData.generatedAt || now())}</span>
                        </div>

                        {/* Thông tin chung */}
                        <div className="px-6 py-3 border-b border-slate-100 bg-violet-50/40 text-xs text-slate-600 flex flex-wrap gap-x-6 gap-y-1">
                            <span><strong> {t('admin.auto.k_97c83cf4', t('admin.auto.k_97c83cf4', 'Kỳ báo cáo:'))} </strong> {filters.startDate ? `${fmtDate(filters.startDate)} – ${fmtDate(filters.endDate || now())}` : t('admin.auto.k_9380e353', 'Toàn bộ thời gian')}</span>
                            {activeTab === 'students' && <span><strong> {t('admin.auto.k_221333d9', t('admin.auto.k_221333d9', 'Lớp:'))} </strong> {classes.find(c => c._id === filters.classId)?.name || t('admin.auto.k_d8586d08', 'Tất cả')}</span>}
                            {activeTab === 'students' && <span><strong> {t('admin.auto.k_7e880e0e', t('admin.auto.k_7e880e0e', 'Học viên:'))} </strong> {students.find(s => s._id === filters.studentId)?.fullName || t('admin.auto.k_d8586d08', 'Tất cả')}</span>}
                            <span><strong> {t('admin.auto.k_253a6d5f', t('admin.auto.k_253a6d5f', 'Tổng records:'))} </strong> {activeTab === 'system' ? t('admin.auto.k_bbb59ffe', '3 chỉ số') : `${(reportData.data || []).length} ${t('admin.auto.k_users_unit', 'records')}`}</span>
                        </div>

                        {/* Bảng học viên */}
                        {activeTab === 'students' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide">
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center w-10">STT</th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-left"> {t('admin.auto.k_623825de', t('admin.auto.k_623825de', 'Họ và tên'))} </th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-left">Email</th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center"> {t('admin.auto.k_74dd5d08', t('admin.auto.k_74dd5d08', 'Điểm TB'))} </th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center"> {t('admin.auto.k_cb1832b2', t('admin.auto.k_cb1832b2', 'Độ chính xác'))} </th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center"> {t('admin.auto.k_970c69b4', t('admin.auto.k_970c69b4', 'Tổng bài'))} </th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center"> {t('admin.auto.k_eb889c21', t('admin.auto.k_eb889c21', 'Hoàn thành'))} </th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center"> {t('admin.auto.k_1e047734', t('admin.auto.k_1e047734', 'Tỷ lệ HT'))} </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(reportData.data || []).length === 0 ? (
                                            <tr><td colSpan={8} className="text-center py-10 text-slate-400"> {t('admin.auto.k_89903ba3', t('admin.auto.k_89903ba3', 'Không có dữ liệu'))} </td></tr>
                                        ) : (reportData.data || []).map((d, i) => {
                                            const rate = d.summary?.totalSubmissions > 0
                                                ? Math.round((d.summary.completed / d.summary.totalSubmissions) * 100) : 0;
                                            return (
                                                <tr key={i} className={`hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                                                    <td className="px-4 py-3 text-center text-slate-400 text-xs">{i + 1}</td>
                                                    <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{d.student?.fullName}</td>
                                                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.student?.email}</td>
                                                    <td className="px-4 py-3 text-center font-black text-violet-700">{(d.summary?.averageScore || 0).toFixed(1)}</td>
                                                    <td className="px-4 py-3 text-center text-slate-600">{(d.summary?.averageAccuracy || 0).toFixed(1)}%</td>
                                                    <td className="px-4 py-3 text-center text-slate-600">{d.summary?.totalSubmissions || 0}</td>
                                                    <td className="px-4 py-3 text-center font-semibold text-emerald-600">{d.summary?.completed || 0}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${rate >= 80 ? 'bg-green-100 text-green-700' : rate >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>{rate}%</span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Bảng giảng viên */}
                        {activeTab === 'instructors' && (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wide">
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center w-10">STT</th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-left"> {t('admin.auto.k_623825de', t('admin.auto.k_623825de', 'Họ và tên'))} </th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-left">Email</th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center"> {t('admin.auto.k_08407bd7', t('admin.auto.k_08407bd7', 'Số lớp'))} </th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center"> {t('admin.auto.k_dd75f11c', t('admin.auto.k_dd75f11c', 'Số học viên'))} </th>
                                            <th className="px-4 py-3 font-semibold text-slate-500 text-center"> {t('admin.auto.k_ff53d01a', t('admin.auto.k_ff53d01a', 'Bài đã giao'))} </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {(reportData.data || []).length === 0 ? (
                                            <tr><td colSpan={6} className="text-center py-10 text-slate-400"> {t('admin.auto.k_89903ba3', t('admin.auto.k_89903ba3', 'Không có dữ liệu'))} </td></tr>
                                        ) : (reportData.data || []).map((d, i) => (
                                            <tr key={i} className={`hover:bg-slate-50 ${i % 2 === 0 ? '' : 'bg-slate-50/50'}`}>
                                                <td className="px-4 py-3 text-center text-slate-400 text-xs">{i + 1}</td>
                                                <td className="px-4 py-3 font-semibold text-slate-800 whitespace-nowrap">{d.instructor?.fullName}</td>
                                                <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{d.instructor?.email}</td>
                                                <td className="px-4 py-3 text-center font-bold text-violet-600">{d.classCount || 0}</td>
                                                <td className="px-4 py-3 text-center font-bold text-blue-600">{d.studentCount || 0}</td>
                                                <td className="px-4 py-3 text-center font-bold text-emerald-600">{d.assignmentCount || 0}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Bảng hệ thống */}
                        {activeTab === 'system' && (
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                    {[
                                        { label: t('admin.auto.k_713969d9', 'Tổng số tài khoản'), value: reportData.totalAccounts ?? 0, sub: t('admin.auto.k_a8801d5e', 'Học viên + GV + Quản trị viên'), color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200' },
                                        { label: t('admin.auto.k_aba9ae02', 'Tổng lượt nộp bài'), value: reportData.totalSubmissions ?? 0, sub: t('admin.auto.k_4a9ae26f', 'Thực hành và kiểm tra'), color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
                                        { label: t('admin.auto.k_3e3d7a99', 'Tổng lượt nhận diện ASL'), value: reportData.totalRecognitions ?? 0, sub: t('admin.auto.k_29d0aa16', 'Lượt dùng camera nhận diện'), color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
                                    ].map((item, i) => (
                                        <div key={i} className={`${item.bg} border ${item.border} rounded-2xl p-5`}>
                                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">{item.label}</p>
                                            <p className={`text-4xl font-black ${item.color}`}>{item.value.toLocaleString()}</p>
                                            <p className="text-xs text-slate-400 mt-1">{item.sub}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="text-xs text-slate-400 border-t border-slate-100 pt-3">
                                    Data as of: {fmtDateTime(reportData.generatedAt || now())}
                                </div>
                            </div>
                        )}

                        {/* Footer xem trước */}
                        <div className="px-6 py-3 border-t border-slate-100 flex justify-between text-xs text-slate-400 bg-slate-50/50">
                            <span>{t('admin.auto.k_56622ac8', 'ASL SIGN LANGUAGE TRAINING SYSTEM')} · {fmtDate(now())}</span>
                            <span>Report No: {reportCode(activeTab)}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* PrintDocument — ẩn trên màn hình, hiện khi in */}
            <PrintDocument
                ref={printRef}
                type={activeTab}
                data={printData}
                filters={filters}
                classes={classes}
                students={students}
                generatedAt={reportData?.generatedAt}
            />
        </AdminLayout>
    );
};

export default AdminReports;
