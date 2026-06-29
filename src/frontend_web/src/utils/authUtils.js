/**
 * authUtils.js — Helper đăng xuất dùng chung toàn app
 * Gọi API logout để revoke session trong DB trước khi xóa localStorage
 */

const API_URL = 'http://localhost:5000/api';

/**
 * Đăng xuất: revoke session trên server + xóa localStorage
 * @param {Function} navigate - react-router navigate function
 * @param {string} redirectTo - đường dẫn sau khi logout (mặc định '/login')
 */
export async function logout(navigate, redirectTo = '/login') {
    try {
        const token = localStorage.getItem('token');
        if (token) {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` }
            }).catch(() => {}); // Không block nếu server lỗi
        }
    } finally {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (navigate) {
            navigate(redirectTo, { replace: true });
        } else {
            window.location.href = redirectTo;
        }
    }
}
