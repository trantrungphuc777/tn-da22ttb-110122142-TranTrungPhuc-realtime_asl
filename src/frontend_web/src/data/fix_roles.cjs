const fs = require('fs');
const path = 'd:/CC/Sign-Language-To-Text-and-Speech-Conversion/backend_server/frontend_web/src/data/translations.js';
let content = fs.readFileSync(path, 'utf8');

const marker = '// ── Admin Roles translations (EN) ──────────────────────────────────────────';
const markerIdx = content.indexOf(marker);

if (markerIdx === -1) {
    console.log('ERROR: marker not found');
    process.exit(1);
}

const feedbackIdx = content.indexOf('feedback: {', markerIdx);
if (feedbackIdx === -1) {
    console.log('ERROR: feedback not found');
    process.exit(1);
}

// New EN roles section
const newEnRoles = `    // ── Admin Roles translations (EN) ──────────────────────────────────────────
    roles: {
      title: 'Roles & Permissions',
      subtitle: 'Manage system roles and permissions',
      roles: 'Roles',
      manageUsers: 'Manage Users',
      userManagement: 'User Management',
      roleManagement: 'Role Management',
      permissions: 'Permissions',
      noUsers: 'No users found',
      searchPlaceholder: 'Search users...',
      allRoles: 'All Roles',
      all: 'All',
      student: 'Student',
      instructor: 'Instructor',
      admin: 'Administrator',
      editPermissions: 'Edit Permissions',
      changeRole: 'Change Role',
      confirmRoleChange: 'Change {name} to {role}?',
      operationFailed: 'Operation failed!',
      viewDashboard: 'View Dashboard',
      manageStudents: 'Manage Students',
      viewStudents: 'View Students',
      createAssignment: 'Create Assignment',
      viewAssignments: 'View Assignments',
      gradeAssignments: 'Grade Assignments',
      createExam: 'Create Exam',
      viewReports: 'View Reports',
      exportReports: 'Export Reports',
      sendNotifications: 'Send Notifications',
      manageSystem: 'Manage System',
      role: 'Role',
      rolesAndPermissions: 'Roles & Permissions',
      assignPermissions: 'Assign & Check Permissions',
      permissionsCount: '{count}/{total} enabled',
      selectAll: 'Select All',
      deselectAll: 'Deselect All',
      unsavedChanges: 'Unsaved changes',
      adminHasAllPermissions: 'Admin has all permissions — cannot be changed',
      resetDefaults: 'Reset Defaults',
      close: 'Close',
      saving: 'Saving...',
      savePermissions: 'Save Permissions',
      users: 'users',
      active: 'Active',
      disabled: 'Disabled',
      roleDisabled: 'This role is currently disabled',
      selectRole: 'Select role',
      enterNameOrEmail: 'Enter name or email...',
      email: 'Email',
      search: 'Search',
      loadError: 'Cannot load roles data!',
      loadUsersError: 'Cannot load users list!',
      cannotDeactivateAdmin: 'Cannot deactivate Admin role!',
      cannotChangeAdminPerms: 'Cannot change Admin permissions!',
      roleDeactivated: 'Role deactivated!',
      roleActivated: 'Role activated!',
      confirmChangeRole: 'Change {name} to {role}?',
      confirmReset: 'Reset permissions to role defaults?',
      toggleHint: 'Click on a permission to toggle',
      customPermission: 'Custom Permission',
      fullAccess: 'Full Access',
      noPermissions: 'No permissions',
    },
    feedback: {`;

// Replace from marker to feedback
content = content.substring(0, markerIdx) + newEnRoles + content.substring(feedbackIdx + 'feedback: {'.length);

fs.writeFileSync(path, content, 'utf8');
console.log('SUCCESS: File patched');
console.log('New size:', content.length);
console.log('New lines:', content.split('\n').length);

// Verify
const { translations } = require(path);
console.log('en admin.roles keys:', Object.keys(translations.en.admin.roles).length);
