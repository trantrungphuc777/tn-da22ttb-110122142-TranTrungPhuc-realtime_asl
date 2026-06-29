import React, { useState, useEffect, useRef, useCallback } from 'react';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';
import InstructorLayout from './InstructorLayout';
import {
    MessageCircle, Send, Search, X, Image, Paperclip, Smile,
    Pin, PinOff, ChevronLeft, MoreVertical, Trash2, Reply,
    GraduationCap, User, Check, CheckCheck, Loader2, Plus,
    Download, File as FileIcon, Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

const API = 'http://localhost:5000/api/messages';

const getRoleLabel = (lang) => ({
    user:       lang === 'en' ? 'Student'    : 'Học viên',
    instructor: lang === 'en' ? 'Instructor' : 'Giảng viên',
    admin:      lang === 'en' ? 'Admin'      : 'Quản trị',
});

const roleColor = {
    user: 'from-blue-500 to-cyan-400',
    instructor: 'from-emerald-500 to-teal-400',
    admin: 'from-purple-500 to-violet-400'
};

function Avatar({ user, size = 'md' }) {
    const sz = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-12 h-12 text-base' : 'w-10 h-10 text-sm';
    const grad = roleColor[user?.role] || 'from-slate-400 to-slate-500';
    if (user?.avatar) {
        return <img src={user.avatar} alt={user.fullName} className={`${sz} rounded-full object-cover shrink-0`} />;
    }
    return (
        <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold shrink-0`}>
            {(user?.fullName || user?.username || '?').charAt(0).toUpperCase()}
        </div>
    );
}

function formatTime(dateStr, lang = 'vi') {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return lang === 'en' ? 'Just now' : 'Vừa xong';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} ${lang === 'en' ? 'min' : 'phút'}`;
    if (diff < 86400000) return d.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) {
        if (lang === 'en') {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            return days[d.getDay()];
        }
        const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        return days[d.getDay()];
    }
    return d.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', { day: '2-digit', month: '2-digit' });
}

function formatMsgTime(dateStr, lang = 'vi') {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatFileSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
}

export default function InstructorMessagesPage() {
    const { lang } = useLanguage();
    const roleLabel = getRoleLabel(lang);
    const me = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const [conversations, setConversations] = useState([]);
    const [activeConv, setActiveConv] = useState(null);
    const [messages, setMessages] = useState([]);
    const [loadingConvs, setLoadingConvs] = useState(true);
    const [loadingMsgs, setLoadingMsgs] = useState(false);
    const [sending, setSending] = useState(false);
    const [input, setInput] = useState('');
    const [showEmoji, setShowEmoji] = useState(false);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQ, setSearchQ] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [replyTo, setReplyTo] = useState(null);
    const [showMsgMenu, setShowMsgMenu] = useState(null);
    const [mobileShowChat, setMobileShowChat] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const chatEndRef = useRef(null);
    const inputRef = useRef(null);
    const fileInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const pollRef = useRef(null);
    const searchDebounce = useRef(null);
    const messagesContainerRef = useRef(null);
    const searchBoxRef = useRef(null);

    const fetchConversations = useCallback(async () => {
        try {
            const res = await axios.get(`${API}/conversations`, { headers });
            setConversations(res.data.conversations || []);
        } catch (_) {} finally {
            setLoadingConvs(false);
        }
    }, [token]);

    useEffect(() => { fetchConversations(); }, []);

    const fetchMessages = useCallback(async (convId, pg = 1, append = false) => {
        if (!convId) return;
        if (pg === 1) setLoadingMsgs(true);
        try {
            const res = await axios.get(`${API}/conversations/${convId}`, {
                headers, params: { page: pg, limit: 50 }
            });
            const newMsgs = res.data.messages || [];
            if (append) setMessages(prev => [...newMsgs, ...prev]);
            else {
                setMessages(newMsgs);
                setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }
            setHasMore(res.data.pagination?.page < res.data.pagination?.pages);
            setConversations(prev => prev.map(c =>
                c._id === convId ? { ...c, unreadCount: 0 } : c
            ));
        } catch (_) {} finally { setLoadingMsgs(false); }
    }, [token]);

    const handleSelectConv = (conv) => {
        setActiveConv(conv);
        setMessages([]);
        setPage(1);
        setReplyTo(null);
        setMobileShowChat(true);
        // Không fetch nếu là preview (chưa có conversation thật)
        if (!conv._isPreview && conv._id && !String(conv._id).startsWith('new_')) {
            fetchMessages(conv._id, 1);
            startPolling(conv._id);
        } else {
            setLoadingMsgs(false);
            if (pollRef.current) clearInterval(pollRef.current);
        }
    };

    const startPolling = (convId) => {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = setInterval(async () => {
            try {
                const res = await axios.get(`${API}/conversations/${convId}`, { headers, params: { page: 1, limit: 50 } });
                setMessages(res.data.messages || []);
            } catch (_) {}
            try {
                const res2 = await axios.get(`${API}/conversations`, { headers });
                // Merge: chỉ update conv đã có, không thêm lại conv đã xóa
                setConversations(prev => {
                    const serverConvs = res2.data.conversations || [];
                    const prevIds = new Set(prev.map(c => c._id?.toString()));
                    // Giữ conv hiện có (update nếu server có), bỏ qua conv server trả về mà client đã xóa
                    return serverConvs.filter(sc => prevIds.has(sc._id?.toString()))
                        .map(sc => {
                            const existing = prev.find(c => c._id?.toString() === sc._id?.toString());
                            return { ...existing, ...sc };
                        })
                        // Thêm conv mới từ server (tin nhắn đến từ người khác)
                        .concat(serverConvs.filter(sc => !prevIds.has(sc._id?.toString())));
                });
            } catch (_) {}
        }, 4000);
    };

    useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

    useEffect(() => {
        if (messages.length > 0) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const handleLoadMore = async () => {
        if (!activeConv || loadingMore || !hasMore) return;
        setLoadingMore(true);
        const newPage = page + 1;
        setPage(newPage);
        const container = messagesContainerRef.current;
        const prevHeight = container?.scrollHeight || 0;
        await fetchMessages(activeConv._id, newPage, true);
        setLoadingMore(false);
        if (container) setTimeout(() => { container.scrollTop = container.scrollHeight - prevHeight; }, 50);
    };

    useEffect(() => {
        if (searchDebounce.current) clearTimeout(searchDebounce.current);
        if (!searchQ.trim()) { setSearchResults([]); return; }
        searchDebounce.current = setTimeout(async () => {
            setSearching(true);
            try {
                const tk = localStorage.getItem('token');
                const res = await axios.get(`${API}/users/search`, {
                    headers: { Authorization: `Bearer ${tk}` },
                    params: { q: searchQ.trim() }
                });
                setSearchResults(res.data.users || []);
            } catch (err) {
                console.error('Search error:', err.response?.data || err.message);
                setSearchResults([]);
            } finally { setSearching(false); }
        }, 400);
    }, [searchQ]);

    const handleStartChat = async (user) => {
        try {
            const res = await axios.post(`${API}/conversations/open/${user._id}`, {}, { headers });
            const conv = res.data.conversation;
            // isNew=true → chỉ hiện bên phải, KHÔNG thêm vào danh sách trái
            const previewConv = conv.isNew
                ? { ...conv, _id: `new_${user._id}`, _isPreview: true }
                : conv;

            if (!conv.isNew) {
                setConversations(prev => prev.find(c => c._id === conv._id) ? prev : [conv, ...prev]);
            }
            setShowSearch(false);
            setSearchQ('');
            setSearchResults([]);
            setActiveConv(previewConv);
            setMessages([]);
            setMobileShowChat(true);
            if (!conv.isNew) {
                fetchMessages(conv._id, 1);
                startPolling(conv._id);
            }
        } catch (err) {
            toast.error(err.response?.data?.message || (lang === 'en' ? 'Cannot open conversation!' : 'Không thể mở hội thoại!'));
        }
    };

    // ── Xóa conversation ──
    const handleDeleteConv = async (conv, e) => {
        e.stopPropagation();
        if (!window.confirm(lang === 'en' ? 'Delete this conversation? Messages remain for the other person.' : 'Xóa hội thoại này? Tin nhắn vẫn còn với người kia.')) return;
        // Xóa khỏi state ngay (optimistic)
        setConversations(prev => prev.filter(c => c._id !== conv._id));
        if (activeConv?._id === conv._id) {
            setActiveConv(null);
            setMessages([]);
            if (pollRef.current) clearInterval(pollRef.current);
        }
        // Gọi API nếu là conversation thật
        if (conv._id && !String(conv._id).startsWith('new_') && !conv._isPreview) {
            try {
                const tk = localStorage.getItem('token');
                await axios.delete(`${API}/conversations/${conv._id}`, {
                    headers: { Authorization: `Bearer ${tk}` }
                });
            } catch (_) {
                // Ignore — đã xóa khỏi UI rồi
            }
        }
    };

    const handleSend = async () => {
        if (!input.trim() || !activeConv || sending) return;
        setSending(true);
        const content = input.trim();
        setInput('');
        setReplyTo(null);

        const tempMsg = {
            _id: `temp-${Date.now()}`,
            senderId: { _id: me._id, fullName: me.fullName, role: me.role, avatar: me.avatar },
            content, type: 'text',
            createdAt: new Date().toISOString(),
            readBy: [{ userId: me._id }],
            replyTo: replyTo, _temp: true
        };
        setMessages(prev => [...prev, tempMsg]);
        setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

        try {
            const res = await axios.post(`${API}/conversations/${activeConv._id}/send`, {
                content, type: 'text', replyTo: replyTo?._id || null
            }, { headers });
            setMessages(prev => prev.map(m => m._id === tempMsg._id ? res.data.message : m));

            const realConvId = res.data.conversationId || activeConv._id;

            if (activeConv._isPreview) {
                const updatedConv = {
                    ...activeConv,
                    _id: realConvId,
                    _isPreview: false,
                    lastMessage: { content, type: 'text', sentAt: new Date() },
                    updatedAt: new Date()
                };
                setActiveConv(updatedConv);
                setConversations(prev => [updatedConv, ...prev.filter(c => c._id !== activeConv._id)]);
                startPolling(realConvId);
            } else {
                setConversations(prev => prev.map(c =>
                    c._id === activeConv._id
                        ? { ...c, lastMessage: { content, type: 'text', sentAt: new Date() }, updatedAt: new Date() }
                        : c
                ));
            }
        } catch (err) {
            setMessages(prev => prev.filter(m => m._id !== tempMsg._id));
            toast.error(err.response?.data?.message || 'Gửi thất bại!');
        } finally {
            setSending(false);
            inputRef.current?.focus();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    };

    const handleUpload = async (file) => {
        if (!activeConv) return;
        if (file.size > 20 * 1024 * 1024) { toast.error(lang === 'en' ? 'File too large! Max 20MB.' : 'File quá lớn! Tối đa 20MB.'); return; }
        const formData = new FormData();
        formData.append('file', file);
        if (replyTo) formData.append('replyTo', replyTo._id);
        setSending(true);
        try {
            const res = await axios.post(`${API}/conversations/${activeConv._id}/upload`, formData, {
                headers: { ...headers, 'Content-Type': 'multipart/form-data' }
            });
            setMessages(prev => [...prev, res.data.message]);
            setReplyTo(null);
            const isImg = res.data.message.type === 'image';
            setConversations(prev => prev.map(c =>
                c._id === activeConv._id
                    ? { ...c, lastMessage: { content: isImg ? (lang === 'en' ? '📷 Image' : '📷 Hình ảnh') : `📎 ${file.name}`, type: res.data.message.type, sentAt: new Date() }, updatedAt: new Date() }
                    : c
            ));
            setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
        } catch (err) {
            toast.error(err.response?.data?.message || (lang === 'en' ? 'Upload failed!' : 'Upload thất bại!'));
        } finally { setSending(false); }
    };

    const handleDrop = (e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleUpload(f); };
    const handleEmojiClick = (ed) => { setInput(prev => prev + ed.emoji); setShowEmoji(false); inputRef.current?.focus(); };

    const handlePin = async (conv, e) => {
        e.stopPropagation();
        try {
            const res = await axios.patch(`${API}/conversations/${conv._id}/pin`, {}, { headers });
            setConversations(prev => prev.map(c => c._id === conv._id ? { ...c, isPinned: res.data.isPinned } : c));
        } catch (_) {}
    };

    const handleDeleteMsg = async (msg) => {
        try {
            await axios.delete(`${API}/conversations/${activeConv._id}/messages/${msg._id}`, { headers });
            setMessages(prev => prev.map(m =>
                m._id === msg._id ? { ...m, content: lang === 'en' ? 'Message recalled' : 'Tin nhắn đã được thu hồi', deletedBySender: true, type: 'text', fileUrl: '' } : m
            ));
            setShowMsgMenu(null);
        } catch (err) { toast.error(err.response?.data?.message || (lang === 'en' ? 'Cannot delete!' : 'Không thể xóa!')); }
    };

    const renderMessage = (msg, idx) => {
        const isMe = msg.senderId?._id === me._id || msg.senderId?._id?.toString() === me._id?.toString();
        const isTemp = msg._temp;
        const isDeleted = msg.deletedBySender;
        const showAvatar = !isMe && (idx === 0 || messages[idx - 1]?.senderId?._id !== msg.senderId?._id);

        return (
            <div key={msg._id} className={`flex gap-2 group ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end`}>
                {!isMe && (
                    <div className="w-7 shrink-0">
                        {showAvatar && <Avatar user={msg.senderId} size="sm" />}
                    </div>
                )}

                <div className={`max-w-[68%] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && showAvatar && (
                        <p className="text-[10px] text-slate-400 font-semibold px-1">{msg.senderId?.fullName || (lang === 'en' ? 'User' : 'Người dùng')}</p>
                    )}

                    {msg.replyTo && !isDeleted && (
                        <div className={`text-xs px-3 py-1.5 rounded-xl mb-0.5 max-w-full border-l-2 ${isMe ? 'bg-emerald-50 border-emerald-300 text-emerald-700' : 'bg-slate-100 border-slate-300 text-slate-600'}`}>
                            <p className="font-semibold text-[10px] mb-0.5">{lang === 'en' ? 'Reply' : 'Trả lời'}</p>
                            <p className="truncate">{msg.replyTo?.content || (msg.replyTo?.type === 'image' ? (lang === 'en' ? '📷 Image' : '📷 Hình ảnh') : '📎 File')}</p>
                        </div>
                    )}

                    <div className="relative flex items-end gap-1">
                        {!isDeleted && (
                            <div className={`flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'order-first' : 'order-last'}`}>
                                <button onClick={() => setReplyTo(msg)}
                                    className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-emerald-500 transition-colors">
                                    <Reply size={11} />
                                </button>
                                {isMe && (
                                    <div className="relative">
                                        <button onClick={() => setShowMsgMenu(showMsgMenu === msg._id ? null : msg._id)}
                                            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors">
                                            <MoreVertical size={11} />
                                        </button>
                                        {showMsgMenu === msg._id && (
                                            <div className="absolute bottom-full right-0 mb-1 w-32 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-20">
                                                <button onClick={() => handleDeleteMsg(msg)}
                                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">
                                                    <Trash2 size={12} /> Thu hồi
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {isDeleted ? (
                            <div className={`px-4 py-2 rounded-2xl text-xs text-slate-400 italic border border-dashed border-slate-300 bg-slate-50 ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                                {lang === 'en' ? 'Message recalled' : 'Tin nhắn đã được thu hồi'}
                            </div>
                        ) : msg.type === 'image' ? (
                            <div className={`rounded-2xl overflow-hidden shadow-sm ${isMe ? 'rounded-tr-none' : 'rounded-tl-none'}`}>
                                <img
                                    src={`http://localhost:5000${msg.fileUrl}`}
                                alt={lang === 'en' ? 'Image' : 'Hình ảnh'}
                                    className="max-w-[240px] max-h-[300px] object-cover cursor-pointer hover:opacity-95 transition-opacity"
                                    onClick={() => window.open(`http://localhost:5000${msg.fileUrl}`, '_blank')}
                                />
                            </div>
                        ) : msg.type === 'file' ? (
                            <a href={`http://localhost:5000${msg.fileUrl}`} download={msg.fileName} target="_blank" rel="noreferrer"
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-sm text-sm transition-all hover:brightness-95 ${isMe ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                                <FileIcon size={18} className={isMe ? 'text-white/80' : 'text-emerald-400'} />
                                <div className="min-w-0">
                                    <p className="font-medium truncate max-w-[160px]">{msg.fileName}</p>
                                    <p className={`text-[10px] ${isMe ? 'text-white/70' : 'text-slate-400'}`}>{formatFileSize(msg.fileSize)}</p>
                                </div>
                                <Download size={14} className={isMe ? 'text-white/80' : 'text-slate-400'} />
                            </a>
                        ) : (
                            <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                isMe
                                    ? 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white rounded-tr-none'
                                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                            } ${isTemp ? 'opacity-70' : ''}`}
                                style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>
                                {msg.content}
                            </div>
                        )}
                    </div>

                    <div className={`flex items-center gap-1 text-[10px] text-slate-400 px-1 ${isMe ? 'flex-row-reverse' : ''}`}>
                        <span>{formatMsgTime(msg.createdAt, lang)}</span>
                        {isMe && !isTemp && (
                            msg.readBy?.length > 1
                                ? <CheckCheck size={11} className="text-emerald-400" />
                                : <Check size={11} className="text-slate-400" />
                        )}
                        {isTemp && <Loader2 size={10} className="animate-spin text-slate-300" />}
                    </div>
                </div>
            </div>
        );
    };

    const totalUnread = conversations.reduce((s, c) => s + (c.unreadCount || 0), 0);

    return (
        <InstructorLayout noPadding>
            <div className="flex h-full overflow-hidden"
                style={{ paddingRight: '72px' }}
                onClick={() => { setShowEmoji(false); setShowMsgMenu(null); }}>

                {/* ══════════════ SIDEBAR ══════════════ */}
                <div className={`${mobileShowChat ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-[300px] xl:w-[340px] shrink-0 border-r border-slate-200/80 bg-white`}>

                    {/* Header sidebar */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 px-4 py-4 shrink-0">
                        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,rgba(255,255,255,.12) 1px,transparent 0)', backgroundSize: '18px 18px' }} />
                        <div className="relative z-10 flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                                    <MessageCircle size={16} className="text-white" />
                                </div>
                                <div>
                                    <h1 className="text-white font-extrabold text-base leading-tight">{lang === 'en' ? 'Messages' : 'Tin nhắn'}</h1>
                                    {totalUnread > 0 && (
                                        <p className="text-emerald-100 text-[10px]">{totalUnread} {lang === 'en' ? 'unread' : 'chưa đọc'}</p>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={(e) => { e.stopPropagation(); setShowSearch(s => !s); setSearchQ(''); setSearchResults([]); }}
                                className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 flex items-center justify-center text-white border border-white/20 transition-all"
                                title={lang === 'en' ? 'Search new user' : 'Tìm người dùng mới'}
                            >
                                <Plus size={16} />
                            </button>
                        </div>

                        {showSearch && (
                            <div className="relative z-10" onClick={e => e.stopPropagation()}>
                                <div ref={searchBoxRef} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-xl px-3 py-2 border border-white/25">
                                    <Search size={14} className="text-white/70 shrink-0" />
                                    <input
                                        autoFocus
                                        value={searchQ}
                                        onChange={e => setSearchQ(e.target.value)}
                                        placeholder={lang === 'en' ? 'Search students, instructors...' : 'Tìm học viên, giảng viên...'}
                                        className="flex-1 bg-transparent text-white placeholder-white/60 text-sm outline-none"
                                    />
                                    {searchQ && (
                                        <button onClick={() => { setSearchQ(''); setSearchResults([]); }} className="text-white/70 hover:text-white">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Dropdown dùng fixed để thoát khỏi overflow:hidden của sidebar */}
                                {(searchResults.length > 0 || searching || searchQ.trim()) && (() => {
                                    const rect = searchBoxRef.current?.getBoundingClientRect();
                                    return (
                                        <div className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 max-h-64 overflow-y-auto"
                                            style={{
                                                zIndex: 9999,
                                                top: rect ? rect.bottom + 4 : 120,
                                                left: rect ? rect.left : 200,
                                                width: rect ? rect.width : 280
                                            }}>
                                            {searching ? (
                                                <div className="flex items-center justify-center py-4 gap-2">
                                                    <Loader2 size={18} className="animate-spin text-emerald-400" />
                                                    <span className="text-sm text-slate-400">{lang === 'en' ? 'Searching...' : 'Đang tìm...'}</span>
                                                </div>
                                            ) : searchResults.length === 0 && searchQ.trim() ? (
                                                <div className="py-5 text-center">
                                                    <p className="text-sm text-slate-400">{lang === 'en' ? 'No results found' : 'Không tìm thấy kết quả'}</p>
                                                    <p className="text-xs text-slate-300 mt-1">{lang === 'en' ? 'Try a different name or username' : 'Thử tên hoặc username khác'}</p>
                                                </div>
                                            ) : searchResults.map(u => (
                                                <button key={u._id} onClick={() => handleStartChat(u)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-emerald-50 transition-colors text-left border-b border-slate-50 last:border-0">
                                                    <Avatar user={u} size="sm" />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-semibold text-slate-800 truncate">{u.fullName}</p>
                                        <p className="text-[10px] text-slate-400">{roleLabel[u.role] || u.role} · @{u.username}</p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </div>
                        )}
                    </div>

                    {/* Danh sách conversations */}
                    <div className="flex-1 overflow-y-auto">
                        {loadingConvs ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 size={24} className="animate-spin text-emerald-400" />
                            </div>
                        ) : conversations.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                                <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mb-3">
                                    <Users size={28} className="text-emerald-300" />
                                </div>
                                <p className="text-slate-500 font-semibold">{lang === 'en' ? 'No conversations yet' : 'Chưa có hội thoại nào'}</p>
                                <p className="text-slate-400 text-xs mt-1">{lang === 'en' ? 'Click + to start messaging students' : 'Nhấn + để bắt đầu nhắn tin với học viên'}</p>
                            </div>
                        ) : (
                            conversations.map(conv => {
                                const isActive = activeConv?._id === conv._id;
                                return (
                                    <div key={conv._id}
                                        onClick={() => handleSelectConv(conv)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 transition-all relative group border-b border-slate-50 cursor-pointer ${isActive ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>

                                        <div className="relative shrink-0">
                                            <Avatar user={conv.other} size="md" />
                                            {conv.unreadCount > 0 && (
                                                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow">
                                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0 text-left">
                                            <div className="flex items-center justify-between">
                                                <p className={`text-sm truncate ${conv.unreadCount > 0 ? 'font-bold text-slate-800' : 'font-semibold text-slate-700'}`}>
                                    {conv.other?.fullName || conv.other?.username || (lang === 'en' ? 'User' : 'Người dùng')}
                                                </p>
                                                <span className="text-[10px] text-slate-400 shrink-0 ml-1">{formatTime(conv.updatedAt, lang)}</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                <span className={`inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-br ${roleColor[conv.other?.role] || 'from-slate-400 to-slate-500'} shrink-0`} />
                                                <p className={`text-xs truncate flex-1 ${conv.unreadCount > 0 ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
                                                    {conv.lastMessage?.content || `${roleLabel[conv.other?.role] || ''}`}
                                                </p>
                                            </div>
                                        </div>

                                        <button onClick={(e) => handlePin(conv, e)}
                                            className="opacity-0 group-hover:opacity-100 shrink-0 w-6 h-6 rounded-lg hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-all"
                                            title={conv.isPinned ? (lang === 'en' ? 'Unpin' : 'Bỏ ghim') : (lang === 'en' ? 'Pin' : 'Ghim')}>
                                            {conv.isPinned ? <PinOff size={11} /> : <Pin size={11} />}
                                        </button>
                                        <button onClick={(e) => handleDeleteConv(conv, e)}
                                            className="opacity-0 group-hover:opacity-100 shrink-0 w-6 h-6 rounded-lg hover:bg-red-100 flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"
                                            title={lang === 'en' ? 'Delete conversation' : 'Xóa hội thoại'}>
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* ══════════════ CHAT AREA ══════════════ */}
                <div className={`${!mobileShowChat ? 'hidden lg:flex' : 'flex'} flex-1 flex-col min-w-0`}>
                    {!activeConv ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-4 shadow-inner">
                                <MessageCircle size={40} className="text-emerald-400" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-600 mb-1">{lang === 'en' ? 'Messages with Students' : 'Tin nhắn với học viên'}</h2>
                            <p className="text-slate-400 text-sm max-w-xs">{lang === 'en' ? 'Select a conversation or click + to start messaging students' : 'Chọn một hội thoại hoặc nhấn + để bắt đầu nhắn tin với học viên'}</p>
                        </div>
                    ) : (
                        <>
                            {/* Chat header */}
                            <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-slate-200/80 shrink-0 shadow-sm">
                                <button
                                    onClick={() => { setMobileShowChat(false); setActiveConv(null); if (pollRef.current) clearInterval(pollRef.current); }}
                                    className="lg:hidden w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors">
                                    <ChevronLeft size={18} />
                                </button>
                                <Avatar user={activeConv.other} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-slate-800 leading-tight truncate">{activeConv.other?.fullName || (lang === 'en' ? 'User' : 'Người dùng')}</p>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className={`inline-block w-2 h-2 rounded-full bg-gradient-to-br ${roleColor[activeConv.other?.role] || 'from-slate-400 to-slate-500'}`} />
                                        <span className="text-[10px] text-slate-400 font-medium">{roleLabel[activeConv.other?.role] || activeConv.other?.role}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Messages area */}
                            <div ref={messagesContainerRef}
                                className="flex-1 overflow-y-auto px-4 py-4 space-y-3"
                                style={{ background: 'linear-gradient(180deg,#f8fff8 0%,#f0fdf4 100%)' }}
                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                onDragLeave={() => setDragOver(false)}
                                onDrop={handleDrop}
                            >
                                {dragOver && (
                                    <div className="fixed inset-0 z-50 bg-emerald-500/20 border-4 border-dashed border-emerald-400 rounded-2xl flex items-center justify-center pointer-events-none">
                                        <div className="bg-white rounded-2xl p-8 text-center shadow-2xl">
                                            <Paperclip size={40} className="text-emerald-400 mx-auto mb-2" />
                                            <p className="text-emerald-600 font-bold">{lang === 'en' ? 'Drop file here' : 'Thả file vào đây'}</p>
                                        </div>
                                    </div>
                                )}

                                {hasMore && (
                                    <div className="flex justify-center">
                                        <button onClick={handleLoadMore} disabled={loadingMore}
                                            className="text-xs text-emerald-500 hover:text-emerald-700 font-semibold px-4 py-1.5 rounded-full bg-white border border-emerald-200 hover:bg-emerald-50 transition-colors disabled:opacity-50">
                                            {loadingMore ? <Loader2 size={12} className="animate-spin inline mr-1" /> : null}
                                            {lang === 'en' ? 'Load older messages' : 'Tải tin nhắn cũ hơn'}
                                        </button>
                                    </div>
                                )}

                                {loadingMsgs ? (
                                    <div className="flex items-center justify-center py-12">
                                        <Loader2 size={24} className="animate-spin text-emerald-400" />
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full py-16 text-center">
                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center mb-3">
                                            <MessageCircle size={28} className="text-emerald-400" />
                                        </div>
                                        <p className="text-slate-500 font-semibold">{lang === 'en' ? 'Start a conversation' : 'Bắt đầu cuộc trò chuyện'}</p>
                                        <p className="text-slate-400 text-xs mt-1">{lang === 'en' ? `Send the first message to ${activeConv.other?.fullName}` : `Gửi tin nhắn đầu tiên cho ${activeConv.other?.fullName}`}</p>
                                    </div>
                                ) : (
                                    messages.map((msg, idx) => renderMessage(msg, idx))
                                )}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Reply preview */}
                            {replyTo && (
                                <div className="flex items-center gap-3 px-4 py-2 bg-emerald-50 border-t border-emerald-100 shrink-0">
                                    <Reply size={14} className="text-emerald-400 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] text-emerald-500 font-bold">{lang === 'en' ? 'Replying to' : 'Trả lời tin nhắn'}</p>
                                        <p className="text-xs text-slate-600 truncate">{replyTo.content || (replyTo.type === 'image' ? (lang === 'en' ? '📷 Image' : '📷 Hình ảnh') : '📎 File')}</p>
                                    </div>
                                    <button onClick={() => setReplyTo(null)} className="text-slate-400 hover:text-red-400 transition-colors">
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            {/* Input area */}
                            <div className="px-4 py-3 bg-white border-t border-slate-200/80 shrink-0" onClick={e => e.stopPropagation()}>
                                {showEmoji && (
                                    <div className="absolute bottom-20 right-4 z-50 shadow-2xl rounded-2xl overflow-hidden">
                                        <EmojiPicker onEmojiClick={handleEmojiClick} height={380} width={320} />
                                    </div>
                                )}

                                <div className="flex items-end gap-2">
                                    <div className="flex items-center gap-1 shrink-0">
                                        <input ref={imageInputRef} type="file" accept="image/*" className="hidden"
                                            onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
                                        <button onClick={() => imageInputRef.current?.click()}
                                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-500 flex items-center justify-center transition-all" title="Gửi hình ảnh">
                                            <Image size={17} />
                                        </button>

                                        <input ref={fileInputRef} type="file" className="hidden"
                                            onChange={e => e.target.files[0] && handleUpload(e.target.files[0])} />
                                        <button onClick={() => fileInputRef.current?.click()}
                                            className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-emerald-100 text-slate-500 hover:text-emerald-500 flex items-center justify-center transition-all" title={lang === 'en' ? 'Attach file' : 'Đính kèm file'}>
                                            <Paperclip size={17} />
                                        </button>

                                        <button onClick={(e) => { e.stopPropagation(); setShowEmoji(s => !s); }}
                                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all ${showEmoji ? 'bg-yellow-100 text-yellow-500' : 'bg-slate-100 hover:bg-yellow-100 text-slate-500 hover:text-yellow-500'}`} title="Emoji">
                                            <Smile size={17} />
                                        </button>
                                    </div>

                                    <div className="flex-1 flex items-end bg-slate-100 rounded-2xl px-4 py-2 min-h-[40px] max-h-[120px] overflow-hidden">
                                        <textarea
                                            ref={inputRef}
                                            value={input}
                                            onChange={e => setInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder={lang === 'en' ? 'Type a message...' : 'Nhập tin nhắn...'}
                                            className="flex-1 bg-transparent text-sm text-slate-800 placeholder-slate-400 outline-none resize-none leading-relaxed max-h-[100px] overflow-y-auto"
                                            rows={1}
                                            onInput={e => {
                                                e.target.style.height = 'auto';
                                                e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
                                            }}
                                        />
                                    </div>

                                    <button
                                        onClick={handleSend}
                                        disabled={!input.trim() || sending}
                                        className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-200 hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed transition-all shrink-0"
                                    >
                                        {sending ? <Loader2 size={17} className="animate-spin" /> : <Send size={17} />}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </InstructorLayout>
    );
}
