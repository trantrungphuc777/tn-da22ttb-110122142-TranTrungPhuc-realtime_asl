/**
 * axiosSetup.js — Global interceptor cho cả axios lẫn fetch
 * Bắt mọi response 401 SESSION_REVOKED và tự động đăng xuất + redirect về login
 */
import axios from 'axios';

let _isLoggingOut = false;

function handleRevoked() {
    if (_isLoggingOut) return;
    _isLoggingOut = true;

    localStorage.removeItem('token');
    localStorage.removeItem('user');

    import('react-hot-toast').then(({ default: toast }) => {
        toast.error('Phiên đăng nhập đã hết hạn hoặc bị thu hồi. Vui lòng đăng nhập lại.', {
            duration: 4000,
            id: 'session-revoked'
        });
    });

    setTimeout(() => {
        _isLoggingOut = false;
        window.location.href = '/login';
    }, 1200);
}

// ── Axios interceptor ─────────────────────────────────────────────────────────
axios.interceptors.response.use(
    response => response,
    error => {
        const status = error.response?.status;
        const code   = error.response?.data?.code;
        if (status === 401 && (code === 'SESSION_REVOKED' || code === 'INVALID_TOKEN' || code === 'NO_TOKEN')) {
            handleRevoked();
        }
        return Promise.reject(error);
    }
);

// ── Fetch interceptor (patch window.fetch) ───────────────────────────────────
const _originalFetch = window.fetch.bind(window);
window.fetch = async (...args) => {
    const response = await _originalFetch(...args);

    // Clone để đọc body mà không consume stream gốc
    if (response.status === 401) {
        try {
            const clone = response.clone();
            const data = await clone.json();
            if (data?.code === 'SESSION_REVOKED' || data?.code === 'INVALID_TOKEN' || data?.code === 'NO_TOKEN') {
                handleRevoked();
            }
        } catch {
            // JSON parse lỗi — bỏ qua
        }
    }

    return response;
};
