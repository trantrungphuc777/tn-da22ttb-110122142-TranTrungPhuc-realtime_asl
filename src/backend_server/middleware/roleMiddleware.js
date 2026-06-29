import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'signlanguage_secret_key_123';

export const ROLES = {
    USER: 'user',
    INSTRUCTOR: 'instructor',
    ADMIN: 'admin'
};

export const PERMISSIONS = {
    VIEW_DASHBOARD: 'view_dashboard',
    MANAGE_STUDENTS: 'manage_students',
    VIEW_STUDENTS: 'view_students',
    CREATE_ASSIGNMENT: 'create_assignment',
    VIEW_ASSIGNMENTS: 'view_assignments',
    GRADE_ASSIGNMENTS: 'grade_assignments',
    CREATE_EXAM: 'create_exam',
    VIEW_REPORTS: 'view_reports',
    EXPORT_REPORTS: 'export_reports',
    SEND_NOTIFICATIONS: 'send_notifications',
    MANAGE_USERS: 'manage_users',
    MANAGE_SYSTEM: 'manage_system'
};

const ROLE_PERMISSIONS = {
    [ROLES.USER]: [
        PERMISSIONS.VIEW_DASHBOARD
    ],
    [ROLES.INSTRUCTOR]: [
        PERMISSIONS.VIEW_DASHBOARD,
        PERMISSIONS.MANAGE_STUDENTS,
        PERMISSIONS.VIEW_STUDENTS,
        PERMISSIONS.CREATE_ASSIGNMENT,
        PERMISSIONS.VIEW_ASSIGNMENTS,
        PERMISSIONS.GRADE_ASSIGNMENTS,
        PERMISSIONS.CREATE_EXAM,
        PERMISSIONS.VIEW_REPORTS,
        PERMISSIONS.EXPORT_REPORTS,
        PERMISSIONS.SEND_NOTIFICATIONS
    ],
    [ROLES.ADMIN]: Object.values(PERMISSIONS)
};

export { ROLE_PERMISSIONS };

export const hasPermission = (userRole, permission) => {
    const permissions = ROLE_PERMISSIONS[userRole] || [];
    return permissions.includes(permission);
};

export const hasAnyPermission = (userRole, permissions) => {
    return permissions.some(permission => hasPermission(userRole, permission));
};

export const hasAllPermissions = (userRole, permissions) => {
    return permissions.every(permission => hasPermission(userRole, permission));
};

export const getRoleDisplayName = (role) => {
    const displayNames = {
        [ROLES.USER]: 'Học viên',
        [ROLES.INSTRUCTOR]: 'Giảng viên',
        [ROLES.ADMIN]: 'Quản trị viên'
    };
    return displayNames[role] || role;
};

export const getRoleColor = (role) => {
    const colors = {
        [ROLES.USER]: 'blue',
        [ROLES.INSTRUCTOR]: 'emerald',
        [ROLES.ADMIN]: 'purple'
    };
    return colors[role] || 'gray';
};

export const isInstructor = (role) => role === ROLES.INSTRUCTOR;
export const isAdmin = (role) => role === ROLES.ADMIN;
export const isUser = (role) => role === ROLES.USER;

export const canManageStudent = (userRole, instructorId, studentInstructorId) => {
    if (userRole === ROLES.ADMIN) return true;
    if (userRole === ROLES.INSTRUCTOR && instructorId === studentInstructorId) return true;
    return false;
};
