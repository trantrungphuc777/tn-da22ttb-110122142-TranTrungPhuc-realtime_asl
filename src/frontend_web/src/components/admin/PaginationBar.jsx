import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * PaginationBar — thanh chuyển trang dùng chung cho admin
 * Props:
 *   page       : trang hiện tại
 *   pages      : tổng số trang
 *   total      : tổng số records
 *   label      : nhãn đơn vị (vd: "học viên", "ticket")
 *   onPage     : callback(pageNumber)
 *   position   : "top" | "bottom" (ảnh hưởng border)
 */
const PaginationBar = ({ page = 1, pages = 1, total = 0, label, onPage, position = 'bottom' }) => {
    const { t } = useLanguage();
    const finalLabel = label || t('admin.auto.k_da595a8c', 'mục');
    // Luôn hiển thị — không ẩn khi 1 trang, chỉ disable nút khi không dùng được
    const safePage  = page  || 1;
    const safePages = pages || 1;

    // Tính tối đa 5 số trang xung quanh trang hiện tại
    const windowSize = 5;
    const half  = Math.floor(windowSize / 2);
    const start = Math.max(1, Math.min(safePage - half, safePages - windowSize + 1));
    const end   = Math.min(safePages, start + windowSize - 1);
    const pageNums = [];
    for (let p = start; p <= end; p++) pageNums.push(p);

    const borderClass = position === 'top' ? 'border-b' : 'border-t';
    const multiPage   = safePages > 1;

    return (
        <div className={`flex items-center justify-between px-4 py-2.5 ${borderClass} border-blue-100 bg-gradient-to-r from-blue-50/70 to-sky-50/50`}>

            {/* Thông tin trang */}
            <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full shadow-sm shadow-blue-300/50">
                    {t('admin.auto.k_trang', 'Trang')} {safePage}/{safePages}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                    — <span className="font-bold text-blue-700">{total}</span> {finalLabel}
                </span>
            </div>

            {/* Nút điều hướng — chỉ render khi có nhiều hơn 1 trang */}
            {multiPage && (
                <div className="flex items-center gap-1">

                    {/* Trang đầu */}
                    <button
                        disabled={safePage <= 1}
                        onClick={() => onPage(1)}
                        title={t('admin.auto.k_7f8e9121', 'Trang đầu')}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500
                                   hover:bg-blue-600 hover:border-blue-600 hover:text-white
                                   disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
                    >
                        <ChevronsLeft size={14} />
                    </button>

                    {/* Trang trước */}
                    <button
                        disabled={safePage <= 1}
                        onClick={() => onPage(safePage - 1)}
                        title={t('admin.auto.k_97f0deb3', 'Trang trước')}
                        className="flex items-center justify-center gap-1 px-3 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold
                                   hover:bg-blue-600 hover:border-blue-600 hover:text-white
                                   disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
                    >
                        <ChevronLeft size={13} />
                        <span> {t('admin.auto.k_8b31948d', 'Trước')} </span>
                    </button>

                    {/* Số trang */}
                    <div className="flex items-center gap-1 mx-0.5">
                        {start > 1 && (
                            <>
                                <button onClick={() => onPage(1)}
                                    className="w-8 h-8 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600
                                               hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-150 shadow-sm">
                                    1
                                </button>
                                {start > 2 && <span className="text-slate-400 text-xs px-0.5">…</span>}
                            </>
                        )}

                        {pageNums.map(p => (
                            p === safePage ? (
                                <button key={p} onClick={() => onPage(p)}
                                    className="w-8 h-8 rounded-lg text-xs font-black transition-all duration-150
                                               bg-blue-600 text-white shadow-md shadow-blue-400/40 scale-105 ring-2 ring-blue-300">
                                    {p}
                                </button>
                            ) : (
                                <button key={p} onClick={() => onPage(p)}
                                    className="w-8 h-8 rounded-lg text-xs font-bold transition-all duration-150
                                               border border-slate-200 bg-white text-slate-600 shadow-sm
                                               hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700">
                                    {p}
                                </button>
                            )
                        ))}

                        {end < safePages && (
                            <>
                                {end < safePages - 1 && <span className="text-slate-400 text-xs px-0.5">…</span>}
                                <button onClick={() => onPage(safePages)}
                                    className="w-8 h-8 rounded-lg text-xs font-bold border border-slate-200 bg-white text-slate-600
                                               hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-all duration-150 shadow-sm">
                                    {safePages}
                                </button>
                            </>
                        )}
                    </div>

                    {/* Trang sau */}
                    <button
                        disabled={safePage >= safePages}
                        onClick={() => onPage(safePage + 1)}
                        title={t('admin.auto.k_trang_sau', 'Trang sau')}
                        className="flex items-center justify-center gap-1 px-3 h-8 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-semibold
                                   hover:bg-blue-600 hover:border-blue-600 hover:text-white
                                   disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
                    >
                        <span>{t('admin.auto.k_sau', 'Sau')}</span>
                        <ChevronRight size={13} />
                    </button>

                    {/* Trang cuối */}
                    <button
                        disabled={safePage >= safePages}
                        onClick={() => onPage(safePages)}
                        title={t('admin.auto.k_bd453018', 'Trang cuối')}
                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 bg-white text-slate-500
                                   hover:bg-blue-600 hover:border-blue-600 hover:text-white
                                   disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
                    >
                        <ChevronsRight size={14} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default PaginationBar;
