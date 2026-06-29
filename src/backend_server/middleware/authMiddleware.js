import jwt from 'jsonwebtoken';
import { ROLES, hasPermission, PERMISSIONS } from './roleMiddleware.js';
import UserSession from '../models/UserSession.js';

const JWT_SECRET = process.env.JWT_SECRET || 'signlanguage_secret_key_123';

export const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Không có token!', code: 'NO_TOKEN' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Nếu token có jti, kiểm tra xem session có bị revoke không
        if (decoded.jti) {
            try {
                const session = await UserSession.findOne({ jti: decoded.jti }).lean();
                if (session && !session.isActive) {
                    return res.status(401).json({ message: 'Phiên đăng nhập đã bị thu hồi!', code: 'SESSION_REVOKED' });
                }
            } catch {
                // DB lỗi — cho pass để không block hệ thống
            }
        }

        req.user = {
            id: decoded.id,
            role: decoded.role,
            jti: decoded.jti
        };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token không hợp lệ!', code: 'INVALID_TOKEN' });
    }
};

export const requireAuth = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Vui lòng đăng nhập!', code: 'NOT_AUTHENTICATED' });
    }
    next();
};

export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập!', code: 'NOT_AUTHENTICATED' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ 
                message: 'Bạn không có quyền thực hiện chức năng này!', 
                code: 'FORBIDDEN',
                requiredRoles: allowedRoles,
                currentRole: req.user.role
            });
        }
        next();
    };
};

export const requireInstructor = requireRole(ROLES.INSTRUCTOR, ROLES.ADMIN);

export const requireAdmin = requireRole(ROLES.ADMIN);

export const requirePermission = (...requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Vui lòng đăng nhập!', code: 'NOT_AUTHENTICATED' });
        }

        const hasRequired = requiredPermissions.some(perm => 
            hasPermission(req.user.role, perm)
        );

        if (!hasRequired) {
            return res.status(403).json({ 
                message: 'Bạn không có quyền thực hiện chức năng này!', 
                code: 'PERMISSION_DENIED',
                requiredPermissions,
                currentRole: req.user.role
            });
        }
        next();
    };
};

export const optionalAuth = (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.id,
                role: decoded.role
            };
        }
        next();
    } catch (error) {
        next();
    }
};
