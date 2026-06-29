import express from 'express';
import mongoose from 'mongoose';
import XLSX from 'xlsx';
import PDFDocument from 'pdfkit';
import User from '../../models/User.js';
import Class from '../../models/Class.js';
import Submission from '../../models/Submission.js';
import Assignment from '../../models/Assignment.js';
import Feedback from '../../models/Feedback.js';
import { authMiddleware, requireInstructor } from '../../middleware/authMiddleware.js';

const router = express.Router();
router.use(authMiddleware);
router.use(requireInstructor);

// ─── helpers ────────────────────────────────────────────────────────────────

async function getStudentIdsForInstructor(instructorId) {
    const classes = await Class.find({ instructorId, status: { $ne: 'deleted' } })
        .select('studentIds').lean();
    const fromClasses = classes.flatMap(c => c.studentIds || []);
    const legacy = await User.find({ instructorId, role: 'user' }).select('_id').lean();
    const allIds = [...fromClasses, ...legacy.map(s => s._id)];
    return [...new Map(allIds.map(id => [id.toString(), id])).values()];
}

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
const fmtScore = (v) => (v != null && v !== '' ? Number(v).toFixed(1) : '0.0');
const gradeLabel = (score) => {
    if (score >= 90) return 'Xuất sắc';
    if (score >= 80) return 'Giỏi';
    if (score >= 70) return 'Khá';
    if (score >= 60) return 'Trung bình';
    return 'Yếu';
};

// ─── Excel builder ───────────────────────────────────────────────────────────

function applyHeaderStyle(ws, range, bgColor = '1E3A5F') {
    for (let C = range.s.c; C <= range.e.c; C++) {
        const cell = XLSX.utils.encode_cell({ r: range.s.r, c: C });
        if (!ws[cell]) ws[cell] = { v: '', t: 's' };
        ws[cell].s = {
            fill: { fgColor: { rgb: bgColor } },
            font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 11 },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
            border: {
                top: { style: 'medium', color: { rgb: 'FFFFFF' } },
                bottom: { style: 'medium', color: { rgb: 'FFFFFF' } },
                left: { style: 'thin', color: { rgb: '2D5A8E' } },
                right: { style: 'thin', color: { rgb: '2D5A8E' } },
            }
        };
    }
}

function applyDataStyle(ws, rowIdx, colCount, isAlt) {
    const bg = isAlt ? 'EBF3FB' : 'FFFFFF';
    for (let C = 0; C < colCount; C++) {
        const cell = XLSX.utils.encode_cell({ r: rowIdx, c: C });
        if (!ws[cell]) ws[cell] = { v: '', t: 's' };
        if (!ws[cell].s) ws[cell].s = {};
        ws[cell].s = {
            fill: { fgColor: { rgb: bg } },
            font: { sz: 10, color: { rgb: '1A1A2E' } },
            alignment: { horizontal: C === 1 ? 'left' : 'center', vertical: 'center' },
            border: {
                top: { style: 'thin', color: { rgb: 'D0E4F7' } },
                bottom: { style: 'thin', color: { rgb: 'D0E4F7' } },
                left: { style: 'thin', color: { rgb: 'D0E4F7' } },
                right: { style: 'thin', color: { rgb: 'D0E4F7' } },
            }
        };
    }
}

function scoreStyle(score) {
    const s = Number(score);
    if (s >= 80) return { rgb: '0A6640' };  // green
    if (s >= 60) return { rgb: 'B45309' };  // amber
    return { rgb: 'B91C1C' };               // red
}

function buildStudentsExcel(students, instructor) {
    const wb = XLSX.utils.book_new();

    // ── Sheet 1: Danh sách học viên ──────────────────────────────────────────
    const wsData = [];

    // Title rows (will be merged)
    wsData.push(['BÁO CÁO DANH SÁCH HỌC VIÊN', '', '', '', '', '', '', '']);
    wsData.push([`Giảng viên: ${instructor?.fullName || ''}`, '', `Ngày xuất: ${fmtDate(new Date())}`, '', '', '', '', '']);
    wsData.push(['', '', '', '', '', '', '', '']);

    // Header row
    wsData.push([
        'STT', 'Họ và Tên', 'Email', 'Trạng thái',
        'Số bài nộp', 'Hoàn thành', 'Điểm TB', 'Xếp loại'
    ]);

    // Data rows
    students.forEach((s, i) => {
        const avg = s.studentStats?.averageScore ?? 0;
        wsData.push([
            i + 1,
            s.fullName || '',
            s.email || '',
            s.isActive ? 'Hoạt động' : 'Không hoạt động',
            s._uniqueTaskCount ?? s.totalSubmissions ?? 0,
            s.completedSubmissions || 0,
            Number(fmtScore(avg)),
            gradeLabel(avg)
        ]);
    });

    // Summary row
    const avgAll = students.length > 0
        ? students.reduce((a, s) => a + (s.studentStats?.averageScore ?? 0), 0) / students.length
        : 0;
    wsData.push(['', '', '', `Tổng: ${students.length} học viên`, '', '',
        Number(fmtScore(avgAll)), '']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const colCount = 8;

    // Column widths
    ws['!cols'] = [
        { wch: 5 }, { wch: 28 }, { wch: 32 }, { wch: 18 },
        { wch: 12 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
    ];

    // Row heights
    ws['!rows'] = [{ hpt: 30 }, { hpt: 18 }, { hpt: 8 }, { hpt: 22 }];

    // Merges: title
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
        { s: { r: 1, c: 2 }, e: { r: 1, c: colCount - 1 } },
    ];

    // Style title
    if (ws['A1']) ws['A1'].s = {
        fill: { fgColor: { rgb: '1E3A5F' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
    };
    if (ws['A2']) ws['A2'].s = {
        font: { bold: true, italic: true, sz: 10, color: { rgb: '1E3A5F' } },
        alignment: { horizontal: 'left', vertical: 'center' }
    };

    // Style header row (row index 3)
    applyHeaderStyle(ws, { s: { r: 3, c: 0 }, e: { r: 3, c: colCount - 1 } });

    // Style data rows
    for (let r = 4; r < wsData.length - 1; r++) {
        applyDataStyle(ws, r, colCount, r % 2 === 0);
        // Color score cell
        const scoreCell = XLSX.utils.encode_cell({ r, c: 6 });
        if (ws[scoreCell]) {
            const sc = ws[scoreCell].v || 0;
            ws[scoreCell].s = {
                ...ws[scoreCell].s,
                font: { bold: true, sz: 10, color: scoreStyle(sc) },
                alignment: { horizontal: 'center', vertical: 'center' }
            };
        }
    }

    // Summary row style
    const sumRow = wsData.length - 1;
    const sumCell = XLSX.utils.encode_cell({ r: sumRow, c: 3 });
    if (ws[sumCell]) ws[sumCell].s = {
        fill: { fgColor: { rgb: 'DBEAFE' } },
        font: { bold: true, sz: 10, color: { rgb: '1E3A5F' } },
        alignment: { horizontal: 'center', vertical: 'center' }
    };

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: wsData.length - 1, c: colCount - 1 } });
    XLSX.utils.book_append_sheet(wb, ws, 'Danh Sách Học Viên');
    return wb;
}

function buildAssignmentsExcel(assignments, instructor) {
    const wb = XLSX.utils.book_new();
    const wsData = [];

    wsData.push(['BÁO CÁO BÀI TẬP', '', '', '', '', '', '']);
    wsData.push([`Giảng viên: ${instructor?.fullName || ''}`, '', `Ngày xuất: ${fmtDate(new Date())}`, '', '', '', '']);
    wsData.push(['', '', '', '', '', '', '']);
    wsData.push(['STT', 'Tên bài tập', 'Loại', 'Trạng thái', 'Tổng nộp', 'Hoàn thành', 'Điểm TB']);

    assignments.forEach((a, i) => {
        const pct = a.totalSubmissions > 0
            ? Math.round((a.completedSubmissions / a.totalSubmissions) * 100)
            : 0;
        wsData.push([
            i + 1,
            a.title || '',
            a.type === 'quiz' ? 'Trắc nghiệm' : a.type === 'practice' ? 'Thực hành' : (a.type || ''),
            a.status === 'published' ? 'Đã phát hành' : 'Nháp',
            a.totalSubmissions || 0,
            `${a.completedSubmissions || 0} (${pct}%)`,
            Number(fmtScore(a.averageScore))
        ]);
    });

    wsData.push(['', `Tổng: ${assignments.length} bài tập`, '', '', '', '', '']);

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const colCount = 7;
    ws['!cols'] = [{ wch: 5 }, { wch: 35 }, { wch: 14 }, { wch: 16 }, { wch: 11 }, { wch: 16 }, { wch: 10 }];
    ws['!rows'] = [{ hpt: 30 }, { hpt: 18 }, { hpt: 8 }, { hpt: 22 }];
    ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: colCount - 1 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 1 } },
        { s: { r: 1, c: 2 }, e: { r: 1, c: colCount - 1 } },
    ];

    if (ws['A1']) ws['A1'].s = {
        fill: { fgColor: { rgb: '064E3B' } },
        font: { bold: true, color: { rgb: 'FFFFFF' }, sz: 14 },
        alignment: { horizontal: 'center', vertical: 'center' }
    };
    if (ws['A2']) ws['A2'].s = {
        font: { bold: true, italic: true, sz: 10, color: { rgb: '064E3B' } },
        alignment: { horizontal: 'left', vertical: 'center' }
    };

    applyHeaderStyle(ws, { s: { r: 3, c: 0 }, e: { r: 3, c: colCount - 1 } }, '064E3B');
    for (let r = 4; r < wsData.length - 1; r++) {
        applyDataStyle(ws, r, colCount, r % 2 === 0);
        const scoreCell = XLSX.utils.encode_cell({ r, c: 6 });
        if (ws[scoreCell]) {
            ws[scoreCell].s = { ...ws[scoreCell].s, font: { bold: true, sz: 10, color: scoreStyle(ws[scoreCell].v || 0) }, alignment: { horizontal: 'center', vertical: 'center' } };
        }
    }

    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: wsData.length - 1, c: colCount - 1 } });
    XLSX.utils.book_append_sheet(wb, ws, 'Bài Tập');
    return wb;
}

// ─── PDF builder ─────────────────────────────────────────────────────────────

const FONT_NORMAL = 'C:/Windows/Fonts/arial.ttf';
const FONT_BOLD   = 'C:/Windows/Fonts/arialbd.ttf';

const reportCode = (type) => {
    const map = { students: 'BC-HV', assignments: 'BC-BT' };
    const d = new Date();
    return `${map[type] || 'BC-GV'}-${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`;
};

function makePDFDoc(res, filename) {
    const doc = new PDFDocument({ margin: 40, size: 'A4', autoFirstPage: true });
    doc.registerFont('Normal', FONT_NORMAL);
    doc.registerFont('Bold',   FONT_BOLD);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);
    return doc;
}

// ── Vẽ header trang mới (tái sử dụng khi xuống trang) ──
function drawPageHeader(doc, title, code, W = 515) {
    const M = 40;
    // Dải màu tiêu đề nhỏ
    doc.rect(M, 40, W, 26).fill('#1E3A5F');
    doc.font('Bold').fontSize(9).fillColor('#FFFFFF')
        .text(title, M + 4, 48, { width: W - 8, align: 'center', lineBreak: false });
    // Mã báo cáo bên phải
    doc.font('Normal').fontSize(7).fillColor('#A0B4CC')
        .text(`Số: ${code}  |  Trang tiếp theo`, M + 4, 49, { width: W - 8, align: 'right', lineBreak: false });
    return 74; // y sau header
}

function drawPDFTable(doc, { y, headers, colWidths, rows, headerBg, altBg = '#F1F5F9', W = 515, pageTitle, pageCode }) {
    const rowH = 22;
    const borderColor = '#CBD5E1';
    const M = 40;

    // Header row
    doc.rect(M, y, W, rowH).fill(headerBg);
    let x = M;
    headers.forEach((h, i) => {
        doc.font('Bold').fontSize(8).fillColor('#FFFFFF')
            .text(h, x + 3, y + 7, { width: colWidths[i] - 5, align: 'center', lineBreak: false });
        x += colWidths[i];
    });
    y += rowH;

    // Data rows
    rows.forEach((row, idx) => {
        if (y > doc.page.height - 80) {
            doc.addPage();
            doc.registerFont('Normal', FONT_NORMAL);
            doc.registerFont('Bold',   FONT_BOLD);
            y = drawPageHeader(doc, pageTitle || '', pageCode || '', W);
            // Re-draw column headers
            doc.rect(M, y, W, rowH).fill(headerBg);
            let hx = M;
            headers.forEach((h, i) => {
                doc.font('Bold').fontSize(8).fillColor('#FFFFFF')
                    .text(h, hx + 3, y + 7, { width: colWidths[i] - 5, align: 'center', lineBreak: false });
                hx += colWidths[i];
            });
            y += rowH;
        }

        const bg = idx % 2 === 0 ? '#FFFFFF' : altBg;
        doc.rect(M, y, W, rowH).fill(bg);
        doc.moveTo(M, y + rowH).lineTo(M + W, y + rowH)
            .strokeColor(borderColor).lineWidth(0.3).stroke();

        x = M;
        row.cells.forEach((cell, i) => {
            doc.font(cell.bold ? 'Bold' : 'Normal')
                .fontSize(8)
                .fillColor(cell.color || '#1E293B')
                .text(String(cell.v ?? ''), x + 3, y + 7,
                    { width: colWidths[i] - 5, align: cell.align || 'center', lineBreak: false });
            x += colWidths[i];
        });
        y += rowH;
    });

    return y;
}

function buildStudentsPDF(res, students, instructor) {
    const doc  = makePDFDoc(res, 'bao-cao-hoc-vien.pdf');
    const W    = 515;
    const M    = 40;
    const code = reportCode('students');
    const now  = new Date();

    // ══════════════════════════════════════════════════════
    // HEADER CÔNG VĂN
    // ══════════════════════════════════════════════════════

    // Dải xanh đậm trên cùng
    doc.rect(M, 36, W, 4).fill('#1E3A5F');

    // Tiêu đề đơn vị — căn giữa
    doc.font('Bold').fontSize(9).fillColor('#1E293B')
        .text('HỆ THỐNG ĐÀO TẠO NGÔN NGỮ KÝ HIỆU ASL', M, 47, { width: W, align: 'center', lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#475569')
        .text('Địa chỉ: TP. Hồ Chí Minh, Việt Nam  |  Email: admin@asl-edu.vn', M, 60, { width: W, align: 'center', lineBreak: false });

    // Đường kẻ phân cách mỏng
    doc.moveTo(M, 74).lineTo(M + W, 74).strokeColor('#CBD5E1').lineWidth(0.5).stroke();

    // Mã số & ngày — bên phải
    doc.font('Normal').fontSize(8).fillColor('#64748B')
        .text(`Số: ${code}`, M, 80, { width: W - 0, align: 'right', lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#64748B')
        .text(`Ngày lập: ${fmtDate(now)}`, M, 91, { width: W - 0, align: 'right', lineBreak: false });

    // ══════════════════════════════════════════════════════
    // TÊN BÁO CÁO
    // ══════════════════════════════════════════════════════
    doc.rect(M, 108, W, 44).fill('#1E3A5F');
    // Accent line trên
    doc.rect(M, 108, W, 3).fill('#3B82F6');
    doc.font('Bold').fontSize(14).fillColor('#FFFFFF')
        .text('BÁO CÁO KẾT QUẢ HỌC TẬP HỌC VIÊN', M, 117, { width: W, align: 'center', lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#93C5FD')
        .text('Hệ thống thực hành, kiểm tra và đánh giá thủ ngữ ASL', M, 133, { width: W, align: 'center', lineBreak: false });

    // ══════════════════════════════════════════════════════
    // THÔNG TIN CHUNG (ô viền nhẹ)
    // ══════════════════════════════════════════════════════
    doc.rect(M, 160, W, 52).fill('#F8FAFC').stroke('#E2E8F0');
    doc.font('Bold').fontSize(8.5).fillColor('#1E3A5F')
        .text('THÔNG TIN BÁO CÁO', M + 10, 168, { lineBreak: false });

    const infoY = 180;
    const col1  = M + 10;
    const col2  = M + 270;
    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text(`Giảng viên phụ trách:`, col1, infoY, { lineBreak: false });
    doc.font('Bold').fontSize(8).fillColor('#1E3A5F')
        .text(`  ${instructor?.fullName || '—'}`, col1 + 110, infoY, { lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text(`Tổng số học viên:`, col2, infoY, { lineBreak: false });
    doc.font('Bold').fontSize(8).fillColor('#1E3A5F')
        .text(`  ${students.length} người`, col2 + 100, infoY, { lineBreak: false });

    const infoY2 = infoY + 12;
    const active = students.filter(s => s.isActive).length;
    const avgAll = students.length > 0
        ? students.reduce((a, s) => a + (s.studentStats?.averageScore ?? 0), 0) / students.length : 0;
    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text(`Thời gian xuất:`, col1, infoY2, { lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text(`  ${now.toLocaleString('vi-VN')}`, col1 + 110, infoY2, { lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text(`Đang hoạt động:`, col2, infoY2, { lineBreak: false });
    doc.font('Bold').fontSize(8).fillColor('#0A6640')
        .text(`  ${active} người`, col2 + 100, infoY2, { lineBreak: false });

    // ══════════════════════════════════════════════════════
    // NHÃN MỤC
    // ══════════════════════════════════════════════════════
    doc.font('Bold').fontSize(9).fillColor('#1E3A5F')
        .text('I. DANH SÁCH KẾT QUẢ HỌC TẬP', M, 222, { lineBreak: false });
    doc.moveTo(M, 233).lineTo(M + 220, 233).strokeColor('#3B82F6').lineWidth(1.5).stroke();

    // ══════════════════════════════════════════════════════
    // BẢNG DỮ LIỆU
    // ══════════════════════════════════════════════════════
    const colWidths = [28, 130, 148, 65, 50, 52, 42]; // sum = 515
    const headers   = ['STT', 'Họ và Tên', 'Email', 'Trạng thái', 'Bài tập', 'Điểm TB', 'Xếp loại'];

    const rows = students.map((s, idx) => {
        const avg = s.studentStats?.averageScore ?? 0;
        const sc  = avg >= 80 ? '#0A6640' : avg >= 60 ? '#B45309' : '#B91C1C';
        // Đếm bài riêng biệt (unique), không đếm lượt nộp thô
        const uniqueBai = s._uniqueTaskCount ?? s.totalSubmissions ?? 0;
        return { cells: [
            { v: idx + 1,                        align: 'center' },
            { v: s.fullName || '',               align: 'left' },
            { v: s.email || '',                  align: 'left' },
            { v: s.isActive ? 'Hoạt động' : 'Không HĐ', align: 'center',
              color: s.isActive ? '#0A6640' : '#64748B' },
            { v: uniqueBai,                      align: 'center' },
            { v: fmtScore(avg),                  align: 'center', bold: true, color: sc },
            { v: gradeLabel(avg),                align: 'center', bold: true, color: sc },
        ]};
    });

    const endY = drawPDFTable(doc, {
        y: 238, headers, colWidths, rows,
        headerBg: '#1E3A5F', altBg: '#F1F7FF', W,
        pageTitle: 'BÁO CÁO KẾT QUẢ HỌC TẬP (tiếp)',
        pageCode: code
    });

    // ══════════════════════════════════════════════════════
    // TỔNG KẾT
    // ══════════════════════════════════════════════════════
    const sumY = endY + 4;
    doc.rect(M, sumY, W, 24).fill('#DBEAFE');
    doc.rect(M, sumY, 3, 24).fill('#3B82F6');
    doc.font('Bold').fontSize(8.5).fillColor('#1E3A5F')
        .text(
            `Tổng cộng: ${students.length} học viên   |   Đang hoạt động: ${active}   |   Điểm trung bình toàn lớp: ${fmtScore(avgAll)}`,
            M + 8, sumY + 8, { width: W - 12, align: 'left', lineBreak: false }
        );

    // ══════════════════════════════════════════════════════
    // CHỮ KÝ
    // ══════════════════════════════════════════════════════
    const sigY = sumY + 40;
    if (sigY + 80 > doc.page.height - 40) doc.addPage();
    const sigActY = sigY + 80 > doc.page.height - 40 ? 40 : sigY;

    const lCol = M + 20;
    const rCol = M + 310;
    const sigTY = sigActY + 14;

    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text(`TP. Hồ Chí Minh, ngày ${now.getDate()} tháng ${now.getMonth()+1} năm ${now.getFullYear()}`,
            rCol, sigActY, { width: 160, align: 'center', lineBreak: false });

    doc.font('Bold').fontSize(8.5).fillColor('#1E293B')
        .text('NGƯỜI LẬP BÁO CÁO', lCol, sigTY, { width: 160, align: 'center', lineBreak: false });
    doc.font('Normal').fontSize(7.5).fillColor('#64748B')
        .text('(Ký, ghi rõ họ tên)', lCol, sigTY + 12, { width: 160, align: 'center', lineBreak: false });

    doc.font('Bold').fontSize(8.5).fillColor('#1E293B')
        .text('NGƯỜI PHÊ DUYỆT', rCol, sigTY, { width: 160, align: 'center', lineBreak: false });
    doc.font('Normal').fontSize(7.5).fillColor('#64748B')
        .text('(Ký, đóng dấu)', rCol, sigTY + 12, { width: 160, align: 'center', lineBreak: false });

    const nameLineY = sigTY + 58;
    doc.font('Bold').fontSize(8.5).fillColor('#1E293B')
        .text(instructor?.fullName || 'Giảng viên', lCol, nameLineY, { width: 160, align: 'center', lineBreak: false });
    doc.font('Bold').fontSize(8.5).fillColor('#1E293B')
        .text('Trưởng bộ phận quản lý', rCol, nameLineY, { width: 160, align: 'center', lineBreak: false });
    doc.moveTo(lCol + 10, nameLineY - 2).lineTo(lCol + 150, nameLineY - 2).strokeColor('#94A3B8').lineWidth(0.5).stroke();
    doc.moveTo(rCol + 10, nameLineY - 2).lineTo(rCol + 150, nameLineY - 2).strokeColor('#94A3B8').lineWidth(0.5).stroke();

    // Dải màu đáy
    doc.rect(M, doc.page.height - 36, W, 4).fill('#1E3A5F');
    doc.font('Normal').fontSize(7).fillColor('#94A3B8')
        .text(`Báo cáo được tạo tự động bởi Hệ thống ASL  —  ${now.toLocaleString('vi-VN')}`,
            M, doc.page.height - 28, { width: W, align: 'center', lineBreak: false });

    doc.end();
}

function buildAssignmentsPDF(res, assignments, instructor) {
    const doc  = makePDFDoc(res, 'bao-cao-bai-tap.pdf');
    const W    = 515;
    const M    = 40;
    const code = reportCode('assignments');
    const now  = new Date();

    // ══════════════════════════════════════════════════════
    // HEADER CÔNG VĂN
    // ══════════════════════════════════════════════════════
    doc.rect(M, 36, W, 4).fill('#064E3B');

    doc.font('Bold').fontSize(9).fillColor('#1E293B')
        .text('HỆ THỐNG ĐÀO TẠO NGÔN NGỮ KÝ HIỆU ASL', M, 47, { width: W, align: 'center', lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#475569')
        .text('Địa chỉ: TP. Hồ Chí Minh, Việt Nam  |  Email: admin@asl-edu.vn', M, 60, { width: W, align: 'center', lineBreak: false });

    doc.moveTo(M, 74).lineTo(M + W, 74).strokeColor('#CBD5E1').lineWidth(0.5).stroke();

    doc.font('Normal').fontSize(8).fillColor('#64748B')
        .text(`Số: ${code}`, M, 80, { width: W, align: 'right', lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#64748B')
        .text(`Ngày lập: ${fmtDate(now)}`, M, 91, { width: W, align: 'right', lineBreak: false });

    // ══════════════════════════════════════════════════════
    // TÊN BÁO CÁO
    // ══════════════════════════════════════════════════════
    doc.rect(M, 108, W, 44).fill('#064E3B');
    doc.rect(M, 108, W, 3).fill('#10B981');
    doc.font('Bold').fontSize(14).fillColor('#FFFFFF')
        .text('BÁO CÁO QUẢN LÝ BÀI TẬP', M, 117, { width: W, align: 'center', lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#6EE7B7')
        .text('Thống kê bài tập, lượt nộp và kết quả đánh giá', M, 133, { width: W, align: 'center', lineBreak: false });

    // ══════════════════════════════════════════════════════
    // THÔNG TIN CHUNG
    // ══════════════════════════════════════════════════════
    doc.rect(M, 160, W, 52).fill('#F0FDF4').stroke('#BBF7D0');
    doc.font('Bold').fontSize(8.5).fillColor('#064E3B')
        .text('THÔNG TIN BÁO CÁO', M + 10, 168, { lineBreak: false });

    const col1 = M + 10, col2 = M + 270;
    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text('Giảng viên phụ trách:', col1, 180, { lineBreak: false });
    doc.font('Bold').fontSize(8).fillColor('#064E3B')
        .text(`  ${instructor?.fullName || '—'}`, col1 + 110, 180, { lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text('Tổng bài tập:', col2, 180, { lineBreak: false });
    doc.font('Bold').fontSize(8).fillColor('#064E3B')
        .text(`  ${assignments.length} bài`, col2 + 80, 180, { lineBreak: false });

    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text('Thời gian xuất:', col1, 192, { lineBreak: false });
    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text(`  ${now.toLocaleString('vi-VN')}`, col1 + 110, 192, { lineBreak: false });
    const published = assignments.filter(a => a.status === 'published').length;
    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text('Đã phát hành:', col2, 192, { lineBreak: false });
    doc.font('Bold').fontSize(8).fillColor('#0A6640')
        .text(`  ${published} bài`, col2 + 80, 192, { lineBreak: false });

    // ══════════════════════════════════════════════════════
    // NHÃN MỤC
    // ══════════════════════════════════════════════════════
    doc.font('Bold').fontSize(9).fillColor('#064E3B')
        .text('I. DANH SÁCH BÀI TẬP', M, 222, { lineBreak: false });
    doc.moveTo(M, 233).lineTo(M + 170, 233).strokeColor('#10B981').lineWidth(1.5).stroke();

    // ══════════════════════════════════════════════════════
    // BẢNG DỮ LIỆU
    // ══════════════════════════════════════════════════════
    const colWidths = [28, 178, 68, 80, 52, 65, 44]; // sum = 515
    const headers   = ['STT', 'Tên bài tập', 'Loại', 'Trạng thái', 'Tổng nộp', 'Hoàn thành', 'Điểm TB'];

    const rows = assignments.map((a, idx) => {
        const pct = a.totalSubmissions > 0
            ? Math.round((a.completedSubmissions / a.totalSubmissions) * 100) : 0;
        const typeLabel = a.type === 'quiz' ? 'Trắc nghiệm'
            : a.type === 'practice' ? 'Thực hành' : (a.type || '—');
        const sc = Number(a.averageScore || 0);
        const scoreColor = sc >= 80 ? '#0A6640' : sc >= 60 ? '#B45309' : '#B91C1C';
        return { cells: [
            { v: idx + 1,                                        align: 'center' },
            { v: a.title || '',                                  align: 'left' },
            { v: typeLabel,                                      align: 'center' },
            { v: a.status === 'published' ? 'Đã phát hành' : 'Nháp', align: 'center',
              color: a.status === 'published' ? '#0A6640' : '#64748B' },
            { v: a.totalSubmissions || 0,                        align: 'center' },
            { v: `${a.completedSubmissions || 0} (${pct}%)`,    align: 'center' },
            { v: fmtScore(a.averageScore), align: 'center', bold: true, color: scoreColor },
        ]};
    });

    const endY = drawPDFTable(doc, {
        y: 238, headers, colWidths, rows,
        headerBg: '#064E3B', altBg: '#F0FDF4', W,
        pageTitle: 'BÁO CÁO QUẢN LÝ BÀI TẬP (tiếp)',
        pageCode: code
    });

    // ══════════════════════════════════════════════════════
    // TỔNG KẾT
    // ══════════════════════════════════════════════════════
    const sumY = endY + 4;
    doc.rect(M, sumY, W, 24).fill('#D1FAE5');
    doc.rect(M, sumY, 3, 24).fill('#10B981');
    const avgScore = assignments.length > 0
        ? assignments.reduce((a, x) => a + (Number(x.averageScore) || 0), 0) / assignments.length : 0;
    doc.font('Bold').fontSize(8.5).fillColor('#064E3B')
        .text(
            `Tổng cộng: ${assignments.length} bài tập   |   Đã phát hành: ${published}   |   Điểm trung bình: ${fmtScore(avgScore)}`,
            M + 8, sumY + 8, { width: W - 12, align: 'left', lineBreak: false }
        );

    // ══════════════════════════════════════════════════════
    // CHỮ KÝ
    // ══════════════════════════════════════════════════════
    const sigY    = sumY + 40;
    const sigActY = sigY + 80 > doc.page.height - 40 ? 40 : sigY;
    if (sigY + 80 > doc.page.height - 40) doc.addPage();

    const lCol = M + 20, rCol = M + 310;
    const sigTY = sigActY + 14;

    doc.font('Normal').fontSize(8).fillColor('#334155')
        .text(`TP. Hồ Chí Minh, ngày ${now.getDate()} tháng ${now.getMonth()+1} năm ${now.getFullYear()}`,
            rCol, sigActY, { width: 160, align: 'center', lineBreak: false });
    doc.font('Bold').fontSize(8.5).fillColor('#1E293B')
        .text('NGƯỜI LẬP BÁO CÁO', lCol, sigTY, { width: 160, align: 'center', lineBreak: false });
    doc.font('Normal').fontSize(7.5).fillColor('#64748B')
        .text('(Ký, ghi rõ họ tên)', lCol, sigTY + 12, { width: 160, align: 'center', lineBreak: false });
    doc.font('Bold').fontSize(8.5).fillColor('#1E293B')
        .text('NGƯỜI PHÊ DUYỆT', rCol, sigTY, { width: 160, align: 'center', lineBreak: false });
    doc.font('Normal').fontSize(7.5).fillColor('#64748B')
        .text('(Ký, đóng dấu)', rCol, sigTY + 12, { width: 160, align: 'center', lineBreak: false });

    const nameLineY = sigTY + 58;
    doc.font('Bold').fontSize(8.5).fillColor('#1E293B')
        .text(instructor?.fullName || 'Giảng viên', lCol, nameLineY, { width: 160, align: 'center', lineBreak: false });
    doc.font('Bold').fontSize(8.5).fillColor('#1E293B')
        .text('Trưởng bộ phận quản lý', rCol, nameLineY, { width: 160, align: 'center', lineBreak: false });
    doc.moveTo(lCol + 10, nameLineY - 2).lineTo(lCol + 150, nameLineY - 2).strokeColor('#94A3B8').lineWidth(0.5).stroke();
    doc.moveTo(rCol + 10, nameLineY - 2).lineTo(rCol + 150, nameLineY - 2).strokeColor('#94A3B8').lineWidth(0.5).stroke();

    doc.rect(M, doc.page.height - 36, W, 4).fill('#064E3B');
    doc.font('Normal').fontSize(7).fillColor('#94A3B8')
        .text(`Báo cáo được tạo tự động bởi Hệ thống ASL  —  ${now.toLocaleString('vi-VN')}`,
            M, doc.page.height - 28, { width: W, align: 'center', lineBreak: false });

    doc.end();
}

// ─── Routes ──────────────────────────────────────────────────────────────────

router.get('/class-stats', async (req, res) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(200).json({
            classStats: [], assignmentStats: [],
            studentProgress: { totalStudents: 0, avgScore: 0, avgAccuracy: 0, avgPracticeCount: 0, activeStudents: 0 },
            recentPerformance: [], _warning: 'Database đang offline'
        });
    }
    try {
        const studentIds = await getStudentIdsForInstructor(req.user.id);
        const totalStudents = studentIds.length;

        const scoreAgg = await Submission.aggregate([
            { $match: { studentId: { $in: studentIds }, score: { $ne: null } } },
            { $group: { _id: null, avgScore: { $avg: '$score' }, avgAccuracy: { $avg: '$accuracy' } } }
        ]);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const activeAgg = await Submission.aggregate([
            { $match: { studentId: { $in: studentIds }, createdAt: { $gte: sevenDaysAgo } } },
            { $group: { _id: '$studentId' } }, { $count: 'count' }
        ]);

        const classStats = await Submission.aggregate([
            { $match: { studentId: { $in: studentIds } } },
            { $group: { _id: '$assignmentId', avgScore: { $avg: '$score' }, avgAccuracy: { $avg: '$accuracy' },
                totalSubmissions: { $sum: 1 },
                completedSubmissions: { $sum: { $cond: [{ $in: ['$status', ['completed', 'graded']] }, 1, 0] } } } }
        ]);
        const assignmentStats = await Assignment.aggregate([
            { $match: { instructorId: req.user.id } },
            { $group: { _id: '$type', count: { $sum: 1 }, published: { $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] } } } }
        ]);
        const recentPerformance = await Submission.aggregate([
            { $match: { studentId: { $in: studentIds }, createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } },
            { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, avgScore: { $avg: '$score' }, count: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            classStats, assignmentStats, recentPerformance,
            studentProgress: {
                totalStudents,
                avgScore:      scoreAgg[0] ? Math.round((scoreAgg[0].avgScore    || 0) * 10) / 10 : 0,
                avgAccuracy:   scoreAgg[0] ? Math.round((scoreAgg[0].avgAccuracy || 0) * 10) / 10 : 0,
                avgPracticeCount: 0,
                activeStudents: activeAgg[0]?.count || 0
            }
        });
    } catch (error) {
        console.error('Class stats error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/export/students', async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const instructorId = req.user.id;
        const instructor = await User.findById(instructorId).select('fullName').lean();
        const studentIds = await getStudentIdsForInstructor(instructorId);

        const students = await User.find({ _id: { $in: studentIds }, role: 'user' })
            .select('-password').lean();

        const studentsWithData = await Promise.all(students.map(async (student) => {
            const submissions = await Submission.find({ studentId: student._id });
            const feedback    = await Feedback.find({ studentId: student._id, instructorId });
            const scoredSubs   = submissions.filter(s => s.score    != null);
            const accuracySubs = submissions.filter(s => s.accuracy != null && s.accuracy > 0);
            const avgScore    = scoredSubs.length   > 0 ? Math.round(scoredSubs.reduce((a,s) => a + s.score, 0)    / scoredSubs.length    * 10) / 10 : 0;
            const avgAccuracy = accuracySubs.length > 0 ? Math.round(accuracySubs.reduce((a,s) => a + s.accuracy, 0) / accuracySubs.length * 10) / 10 : 0;
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            const isActive = submissions.some(s => new Date(s.submittedAt || s.createdAt) >= sevenDaysAgo);

            // Đếm số bài RIÊNG BIỆT (unique assignment), không đếm lượt nộp thô
            const uniqueAssignmentIds = new Set(
                submissions.filter(s => s.assignmentId)
                    .map(s => (s.assignmentId?._id || s.assignmentId).toString())
            );
            const uniqueExamIds = new Set(
                submissions.filter(s => s.examId).map(s => s.examId.toString())
            );
            const uniqueTaskCount = uniqueAssignmentIds.size + uniqueExamIds.size;
            const completedUniqueIds = new Set(
                submissions.filter(s => s.assignmentId && ['completed','graded'].includes(s.status))
                    .map(s => (s.assignmentId?._id || s.assignmentId).toString())
            );

            return {
                ...student,
                totalSubmissions: submissions.length,
                completedSubmissions: completedUniqueIds.size,
                _uniqueTaskCount: uniqueTaskCount,
                isActive,
                studentStats: { ...(student.studentStats || {}), averageScore: avgScore, averageAccuracy: avgAccuracy },
                averageScore: avgScore,
                totalPracticeTime: student.studentStats?.totalPracticeTime ?? 0,
                lastPractice: student.studentStats?.lastPracticeDate ?? null,
                feedbackCount: feedback.length
            };
        }));

        if (format === 'excel') {
            const wb = buildStudentsExcel(studentsWithData, instructor);
            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=bao-cao-hoc-vien.xlsx');
            return res.send(buf);
        }
        if (format === 'pdf') return buildStudentsPDF(res, studentsWithData, instructor);
        if (format === 'csv') {
            const csv = convertToCSV(studentsWithData);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=students_report.csv');
            return res.send(csv);
        }
        res.status(200).json({ reportDate: new Date(), totalStudents: studentsWithData.length, students: studentsWithData });
    } catch (error) {
        console.error('Export students error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/export/assignments', async (req, res) => {
    try {
        const { format = 'json' } = req.query;
        const instructorId = req.user.id;
        const instructor = await User.findById(instructorId).select('fullName').lean();

        const assignments = await Assignment.find({ instructorId })
            .populate('assignedTo', 'fullName email').lean();

        const assignmentsWithStats = await Promise.all(assignments.map(async (a) => {
            const submissions = await Submission.find({ assignmentId: a._id });
            return {
                ...a,
                totalSubmissions: submissions.length,
                completedSubmissions: submissions.filter(s => ['completed','graded'].includes(s.status)).length,
                averageScore: submissions.length > 0
                    ? submissions.reduce((sum, s) => sum + (s.score || 0), 0) / submissions.length : 0
            };
        }));

        if (format === 'excel') {
            const wb = buildAssignmentsExcel(assignmentsWithStats, instructor);
            const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename=bao-cao-bai-tap.xlsx');
            return res.send(buf);
        }
        if (format === 'pdf') return buildAssignmentsPDF(res, assignmentsWithStats, instructor);
        if (format === 'csv') {
            const csv = convertToCSV(assignmentsWithStats);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=assignments_report.csv');
            return res.send(csv);
        }
        res.status(200).json({ reportDate: new Date(), totalAssignments: assignmentsWithStats.length, assignments: assignmentsWithStats });
    } catch (error) {
        console.error('Export assignments error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

router.get('/export/progress', async (req, res) => {
    try {
        const { studentId, startDate, endDate, format = 'json' } = req.query;
        const instructorId = req.user.id;
        const studentIds = await getStudentIdsForInstructor(instructorId);

        const query = { studentId: { $in: studentIds } };
        if (studentId) query.studentId = studentId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate)   query.createdAt.$lte = new Date(endDate);
        }
        const submissions = await Submission.find(query)
            .populate('studentId', 'fullName email')
            .populate('assignmentId', 'title type')
            .sort({ createdAt: -1 }).lean();
        const student = studentId ? await User.findById(studentId).select('fullName email') : null;

        if (format === 'csv') {
            const csv = convertToCSV(submissions);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=progress_report.csv');
            return res.send(csv);
        }
        res.status(200).json({ reportDate: new Date(), student, dateRange: { startDate, endDate }, totalSubmissions: submissions.length, submissions });
    } catch (error) {
        console.error('Export progress error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;

function convertToCSV(data) {
    if (!data.length) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    for (const row of data) {
        const values = headers.map(h => {
            const v = row[h];
            if (v == null) return '';
            if (typeof v === 'object') return '"' + JSON.stringify(v).replace(/"/g, '""') + '"';
            return '"' + String(v).replace(/"/g, '""') + '"';
        });
        csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
}
