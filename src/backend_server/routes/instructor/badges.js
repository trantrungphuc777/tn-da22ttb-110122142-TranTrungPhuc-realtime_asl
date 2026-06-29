import express from 'express';
import Badge from '../../models/Badge.js';
import StudentBadge from '../../models/StudentBadge.js';
import User from '../../models/User.js';
import { authMiddleware, requireInstructor } from '../../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);
router.use(requireInstructor);

// Initialize default badges
Badge.createDefaultBadges().catch(console.error);

// ===================== BADGE MANAGEMENT =====================

// GET /api/instructor/badges - Get all badges
router.get('/', async (req, res) => {
    try {
        const badges = await Badge.find().sort({ sortOrder: 1, createdAt: -1 });
        res.status(200).json({ badges });
    } catch (error) {
        console.error('Get badges error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// GET /api/instructor/badges/system - Get system badges only
router.get('/system', async (req, res) => {
    try {
        const badges = await Badge.find({ isSystem: true }).sort({ sortOrder: 1 });
        res.status(200).json({ badges });
    } catch (error) {
        console.error('Get system badges error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// POST /api/instructor/badges - Create new badge
router.post('/', async (req, res) => {
    try {
        const { name, description, icon, emoji, rarity, color, bgColor, borderColor, conditionType, conditionValue } = req.body;

        if (!name?.vi || !name?.en) {
            return res.status(400).json({ message: 'Tên huy hiệu là bắt buộc (VI & EN)!' });
        }

        if (!conditionType) {
            return res.status(400).json({ message: 'Loại điều kiện là bắt buộc!' });
        }

        const badge = new Badge({
            name,
            description: description || { vi: '', en: '' },
            icon: icon || 'Award',
            emoji: emoji || '🏆',
            conditionType,
            conditionValue: conditionValue || 0,
            rarity: rarity || 'common',
            color: color || '#3B82F6',
            bgColor: bgColor || 'bg-blue-100',
            borderColor: borderColor || 'border-blue-300',
            isSystem: false,
            isActive: true,
            createdBy: req.user.id
        });

        await badge.save();
        res.status(201).json({ message: 'Tạo huy hiệu thành công!', badge });
    } catch (error) {
        console.error('Create badge error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// PUT /api/instructor/badges/:id - Update badge
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const badge = await Badge.findById(id);

        if (!badge) {
            return res.status(404).json({ message: 'Không tìm thấy huy hiệu!' });
        }

        if (badge.isSystem && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Không thể chỉnh sửa huy hiệu hệ thống!' });
        }

        const { name, description, icon, emoji, rarity, color, bgColor, borderColor, conditionType, conditionValue, isActive } = req.body;

        if (name) badge.name = name;
        if (description) badge.description = description;
        if (icon) badge.icon = icon;
        if (emoji) badge.emoji = emoji;
        if (rarity) badge.rarity = rarity;
        if (color) badge.color = color;
        if (bgColor) badge.bgColor = bgColor;
        if (borderColor) badge.borderColor = borderColor;
        if (conditionType) badge.conditionType = conditionType;
        if (conditionValue !== undefined) badge.conditionValue = conditionValue;
        if (isActive !== undefined) badge.isActive = isActive;

        await badge.save();
        res.status(200).json({ message: 'Cập nhật huy hiệu thành công!', badge });
    } catch (error) {
        console.error('Update badge error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// DELETE /api/instructor/badges/:id - Delete badge
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const badge = await Badge.findById(id);

        if (!badge) {
            return res.status(404).json({ message: 'Không tìm thấy huy hiệu!' });
        }

        if (badge.isSystem) {
            return res.status(403).json({ message: 'Không thể xóa huy hiệu hệ thống!' });
        }

        // Delete all student badges with this badge
        await StudentBadge.deleteMany({ badgeId: id });

        // Delete the badge
        await Badge.findByIdAndDelete(id);

        res.status(200).json({ message: 'Xóa huy hiệu thành công!' });
    } catch (error) {
        console.error('Delete badge error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// ===================== STUDENT BADGE MANAGEMENT =====================

// GET /api/instructor/students/:studentId/badges - Get badges for a student
router.get('/students/:studentId/badges', async (req, res) => {
    try {
        const { studentId } = req.params;
        const student = await User.findOne({ _id: studentId, instructorId: req.user.id });

        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        }

        const studentBadges = await StudentBadge.find({ studentId })
            .populate('badgeId', 'name description icon emoji rarity color bgColor borderColor')
            .populate('awardedBy', 'fullName')
            .sort({ earnedAt: -1 });

        // Get all badges with earned status for this student
        const allBadges = await Badge.find().sort({ sortOrder: 1 });
        const earnedBadgeIds = studentBadges
            .filter(sb => !sb.isHonorary)
            .map(sb => sb.badgeId._id.toString());

        const badgesWithStatus = allBadges.map(badge => {
            const sbRecord = studentBadges.find(sb => sb.badgeId._id.toString() === badge._id.toString());
            if (!sbRecord) {
                return { badge, earned: false };
            }
            if (sbRecord.isHonorary) {
                // Danh dự: KHÔNG tính là earned chính thức
                return {
                    badge,
                    earned: false,
                    isHonorary: true,
                    honoraryNote: sbRecord.honoraryNote || sbRecord.note || '',
                    awardedAt: sbRecord.earnedAt,
                    awardedBy: sbRecord.awardedBy
                };
            }
            return {
                badge,
                earned: true,
                earnedAt: sbRecord.earnedAt,
                awardedBy: sbRecord.awardedBy,
                source: sbRecord.source
            };
        });

        res.status(200).json({
            studentBadges,
            allBadges: badgesWithStatus,
            totalEarned: earnedBadgeIds.length,
            totalHonorary: studentBadges.filter(sb => sb.isHonorary).length,
            totalBadges: allBadges.length
        });
    } catch (error) {
        console.error('Get student badges error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// POST /api/instructor/students/:studentId/badges - Award badge to student manually
router.post('/students/:studentId/badges', async (req, res) => {
    try {
        const { studentId } = req.params;
        const { badgeId, note, forceHonorary } = req.body;

        const student = await User.findOne({ _id: studentId, instructorId: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        }

        if (!badgeId) {
            return res.status(400).json({ message: 'ID huy hiệu là bắt buộc!' });
        }

        const badge = await Badge.findById(badgeId);
        if (!badge) {
            return res.status(404).json({ message: 'Không tìm thấy huy hiệu!' });
        }

        if (!badge.isActive) {
            return res.status(400).json({ message: 'Huy hiệu đã bị vô hiệu hóa!' });
        }

        // Kiểm tra học viên đã có huy hiệu này chưa (cả danh dự lẫn chính thức)
        const existing = await StudentBadge.findOne({ studentId, badgeId });
        if (existing) {
            return res.status(400).json({
                message: existing.isHonorary
                    ? 'Học viên đã có huy hiệu danh dự này!'
                    : 'Học viên đã có huy hiệu này!'
            });
        }

        // Giảng viên quyết định trao chính thức hay danh dự (forceHonorary=true)
        const isHonorary = forceHonorary === true;

        const result = await StudentBadge.awardBadge(studentId, badgeId, {
            awardedBy: req.user.id,
            note: note || '',
            source: 'manual',
            isHonorary,
            honoraryNote: isHonorary ? (note || '') : ''
        });

        if (!result.success) {
            return res.status(400).json({ message: 'Học viên đã có huy hiệu này!' });
        }

        res.status(201).json({
            message: isHonorary ? 'Trao huy hiệu danh dự thành công!' : 'Trao huy hiệu thành công!',
            studentBadge: result.studentBadge,
            badge,
            isHonorary
        });
    } catch (error) {
        console.error('Award badge error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// DELETE /api/instructor/students/:studentId/badges/:badgeId - Revoke badge from student
router.delete('/students/:studentId/badges/:badgeId', async (req, res) => {
    try {
        const { studentId, badgeId } = req.params;

        const student = await User.findOne({ _id: studentId, instructorId: req.user.id });
        if (!student) {
            return res.status(404).json({ message: 'Không tìm thấy học viên!' });
        }

        const result = await StudentBadge.findOneAndDelete({ studentId, badgeId });

        if (!result) {
            return res.status(404).json({ message: 'Học viên không có huy hiệu này!' });
        }

        res.status(200).json({ message: 'Thu hồi huy hiệu thành công!' });
    } catch (error) {
        console.error('Revoke badge error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// GET /api/instructor/badges/students - Get all students with their badges
router.get('/students', async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const instructorId = req.user.id;

        const students = await User.find({ instructorId, role: 'user' })
            .select('fullName email avatar studentStats')
            .skip((page - 1) * limit)
            .limit(parseInt(limit));

        const total = await User.countDocuments({ instructorId, role: 'user' });

        // Get badge counts for each student
        const studentsWithBadges = await Promise.all(students.map(async (student) => {
            const badgeCount = await StudentBadge.countDocuments({ studentId: student._id, isHonorary: { $ne: true } });
            const honoraryCount = await StudentBadge.countDocuments({ studentId: student._id, isHonorary: true });
            return {
                ...student.toObject(),
                badgeCount,
                honoraryBadgeCount: honoraryCount
            };
        }));

        res.status(200).json({
            students: studentsWithBadges,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Get students with badges error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

// POST /api/instructor/badges/bulk-award - Award badge to multiple students
router.post('/bulk-award', async (req, res) => {
    try {
        const { badgeId, studentIds, note } = req.body;

        if (!badgeId) {
            return res.status(400).json({ message: 'ID huy hiệu là bắt buộc!' });
        }

        if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ message: 'Danh sách học viên là bắt buộc!' });
        }

        const badge = await Badge.findById(badgeId);
        if (!badge) {
            return res.status(404).json({ message: 'Không tìm thấy huy hiệu!' });
        }

        // Verify all students belong to instructor
        const validStudents = await User.find({
            _id: { $in: studentIds },
            instructorId: req.user.id
        });

        let awardedCount = 0;
        const errors = [];

        for (const studentId of studentIds) {
            try {
                const result = await StudentBadge.awardBadge(studentId, badgeId, {
                    awardedBy: req.user.id,
                    note: note || '',
                    source: 'manual'
                });
                if (result.success) awardedCount++;
            } catch (error) {
                errors.push({ studentId, error: error.message });
            }
        }

        res.status(200).json({
            message: `Đã trao huy hiệu cho ${awardedCount} học viên!`,
            awardedCount,
            totalStudents: validStudents.length,
            errors: errors.length > 0 ? errors : undefined
        });
    } catch (error) {
        console.error('Bulk award badge error:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
});

export default router;
