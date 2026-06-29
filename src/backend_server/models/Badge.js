import mongoose from 'mongoose';

const BadgeSchema = new mongoose.Schema({
    name: {
        vi: { type: String, required: true },
        en: { type: String, required: true }
    },
    description: {
        vi: { type: String, default: '' },
        en: { type: String, default: '' }
    },
    icon: {
        type: String,
        default: 'Award'
    },
    emoji: {
        type: String,
        default: '🏆'
    },
    conditionType: {
        type: String,
        enum: [
            // Submission milestones
            'first_submission',
            'score_100',
            'perfect_streak_5',
            'perfect_streak_10',
            // Streak milestones
            'streak_3',
            'streak_7',
            'streak_14',
            'streak_30',
            'streak_60',
            // Practice count milestones
            'practice_count',
            // Accuracy milestones
            'accuracy_95',
            'accuracy_100_once',
            // Score average milestones
            'average_score_70',
            'average_score_80',
            'average_score_90',
            'average_score_95',
            // Assignment milestones
            'assignments_completed',
            // Exam milestones
            'exams_taken',
            // Speed
            'time_bonus',
            // Custom
            'custom'
        ],
        required: true
    },
    conditionValue: {
        type: Number,
        default: 0
    },
    rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common'
    },
    color: {
        type: String,
        default: '#3B82F6'
    },
    bgColor: {
        type: String,
        default: 'bg-blue-100'
    },
    borderColor: {
        type: String,
        default: 'border-blue-300'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    isSystem: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

BadgeSchema.index({ isActive: 1 });
BadgeSchema.index({ rarity: 1 });
BadgeSchema.index({ conditionType: 1 });

BadgeSchema.statics.createDefaultBadges = async function() {
    // Dùng upsert theo name.vi để tránh duplicate khi server khởi động song song
    // Không dùng countDocuments >= 30 vì có thể bị race condition tạo trùng

    const defaults = [
        // ═══════════════════════════════════════════
        // TIER 1 — CƠ BẢN (COMMON, sortOrder 1-6)
        // ═══════════════════════════════════════════
        {
            name: { vi: 'Bước Khởi Đầu', en: 'First Step' },
            description: { vi: 'Nộp bài lần đầu tiên — khởi đầu hành trình học ngôn ngữ ký hiệu', en: 'Submit your very first assignment — begin your sign language learning journey' },
            icon: 'Star', emoji: '🌱',
            conditionType: 'first_submission', conditionValue: 1,
            rarity: 'common', color: '#84CC16', bgColor: 'bg-lime-100', borderColor: 'border-lime-300',
            isSystem: true, sortOrder: 1
        },
        {
            name: { vi: 'Học Viên Nhập Môn', en: 'Enrolled Learner' },
            description: { vi: 'Hoàn thành 5 bài tập — bước đầu hình thành thói quen học tập có hệ thống', en: 'Complete 5 assignments — beginning to establish a structured learning habit' },
            icon: 'BookOpen', emoji: '📖',
            conditionType: 'assignments_completed', conditionValue: 5,
            rarity: 'common', color: '#6B7280', bgColor: 'bg-gray-100', borderColor: 'border-gray-300',
            isSystem: true, sortOrder: 2
        },
        {
            name: { vi: 'Tính Nhất Quán', en: 'Learning Consistency' },
            description: { vi: 'Duy trì luyện tập 3 ngày liên tiếp — tính nhất quán là yếu tố then chốt trong tiếp thu ngôn ngữ', en: 'Practice 3 consecutive days — consistency is a key factor in language acquisition' },
            icon: 'Calendar', emoji: '📅',
            conditionType: 'streak_3', conditionValue: 3,
            rarity: 'common', color: '#0EA5E9', bgColor: 'bg-sky-100', borderColor: 'border-sky-300',
            isSystem: true, sortOrder: 3
        },
        {
            name: { vi: 'Thực Hành Cơ Bản', en: 'Foundational Practice' },
            description: { vi: 'Tích lũy 10 phiên luyện tập nhận diện ký hiệu — xây dựng nền tảng nhận thức vận động', en: 'Accumulate 10 sign recognition practice sessions — building motor cognition foundations' },
            icon: 'HandMetal', emoji: '🤟',
            conditionType: 'practice_count', conditionValue: 10,
            rarity: 'common', color: '#F59E0B', bgColor: 'bg-amber-100', borderColor: 'border-amber-300',
            isSystem: true, sortOrder: 4
        },
        {
            name: { vi: 'Tham Gia Kiểm Tra', en: 'Assessment Participation' },
            description: { vi: 'Hoàn thành bài kiểm tra đầu tiên — tích cực tham gia đánh giá năng lực', en: 'Complete your first exam — actively participating in competency assessment' },
            icon: 'ClipboardList', emoji: '📝',
            conditionType: 'exams_taken', conditionValue: 1,
            rarity: 'common', color: '#F97316', bgColor: 'bg-orange-100', borderColor: 'border-orange-300',
            isSystem: true, sortOrder: 5
        },
        {
            name: { vi: 'Điểm Khá', en: 'Good Score' },
            description: { vi: 'Duy trì điểm trung bình từ 70 trở lên sau ít nhất 5 bài nộp — đạt ngưỡng năng lực cơ bản', en: 'Maintain average score ≥ 70 across at least 5 submissions — meeting the basic proficiency threshold' },
            icon: 'TrendingUp', emoji: '📈',
            conditionType: 'average_score_70', conditionValue: 70,
            rarity: 'common', color: '#10B981', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300',
            isSystem: true, sortOrder: 6
        },

        // ═══════════════════════════════════════════
        // TIER 2 — TRUNG CẤP (UNCOMMON, sortOrder 7-12)
        // ═══════════════════════════════════════════
        {
            name: { vi: 'Chuyên Cần Học Tập', en: 'Academic Diligence' },
            description: { vi: 'Hoàn thành 15 bài tập — thể hiện thái độ học tập nghiêm túc và có trách nhiệm', en: 'Complete 15 assignments — demonstrating a serious and responsible approach to learning' },
            icon: 'BookOpen', emoji: '📚',
            conditionType: 'assignments_completed', conditionValue: 15,
            rarity: 'uncommon', color: '#10B981', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300',
            isSystem: true, sortOrder: 7
        },
        {
            name: { vi: 'Duy Trì Học Tập', en: 'Sustained Learning' },
            description: { vi: 'Luyện tập 7 ngày liên tiếp — nghiên cứu cho thấy 7 ngày liên tục giúp củng cố trí nhớ dài hạn hiệu quả', en: 'Practice 7 consecutive days — research shows 7 consecutive days effectively consolidates long-term memory' },
            icon: 'Flame', emoji: '🔥',
            conditionType: 'streak_7', conditionValue: 7,
            rarity: 'uncommon', color: '#EF4444', bgColor: 'bg-red-100', borderColor: 'border-red-300',
            isSystem: true, sortOrder: 8
        },
        {
            name: { vi: 'Người Thực Hành Tích Cực', en: 'Active Practitioner' },
            description: { vi: 'Tích lũy 30 phiên luyện tập — mức độ thực hành đủ để hình thành phản xạ nhận diện ký hiệu', en: 'Accumulate 30 practice sessions — sufficient practice to develop sign recognition reflexes' },
            icon: 'Zap', emoji: '💪',
            conditionType: 'practice_count', conditionValue: 30,
            rarity: 'uncommon', color: '#8B5CF6', bgColor: 'bg-violet-100', borderColor: 'border-violet-300',
            isSystem: true, sortOrder: 9
        },
        {
            name: { vi: 'Hoàn Thành Kiểm Tra Cơ Bản', en: 'Basic Assessment Completion' },
            description: { vi: 'Hoàn thành 5 bài kiểm tra — tích cực tham gia đánh giá năng lực theo định kỳ', en: 'Complete 5 exams — actively participating in periodic competency assessments' },
            icon: 'ClipboardList', emoji: '🗒️',
            conditionType: 'exams_taken', conditionValue: 5,
            rarity: 'uncommon', color: '#F97316', bgColor: 'bg-orange-100', borderColor: 'border-orange-300',
            isSystem: true, sortOrder: 10
        },
        {
            name: { vi: 'Điểm Giỏi', en: 'Excellent Score' },
            description: { vi: 'Duy trì điểm trung bình từ 80 trở lên sau ít nhất 10 bài nộp — đạt mức năng lực khá theo thang đánh giá học thuật', en: 'Maintain average score ≥ 80 across at least 10 submissions — achieving a good proficiency level' },
            icon: 'Award', emoji: '🎖️',
            conditionType: 'average_score_80', conditionValue: 80,
            rarity: 'uncommon', color: '#3B82F6', bgColor: 'bg-blue-100', borderColor: 'border-blue-300',
            isSystem: true, sortOrder: 11
        },
        {
            name: { vi: 'Điểm Tuyệt Đối Đầu Tiên', en: 'First Perfect Score' },
            description: { vi: 'Đạt 100 điểm lần đầu tiên — kết quả phản ánh sự chuẩn bị kỹ lưỡng và nắm vững kiến thức', en: 'Score 100 for the first time — a result reflecting thorough preparation and solid knowledge mastery' },
            icon: 'Trophy', emoji: '🥇',
            conditionType: 'score_100', conditionValue: 1,
            rarity: 'uncommon', color: '#FBBF24', bgColor: 'bg-yellow-100', borderColor: 'border-yellow-400',
            isSystem: true, sortOrder: 12
        },

        // ═══════════════════════════════════════════
        // TIER 3 — NÂNG CAO (RARE, sortOrder 13-18)
        // ═══════════════════════════════════════════
        {
            name: { vi: 'Hoàn Thành Chương Trình Cơ Bản', en: 'Core Curriculum Completion' },
            description: { vi: 'Hoàn thành 30 bài tập — đạt mốc hoàn thành chương trình học cơ bản của khóa học', en: 'Complete 30 assignments — reaching the core curriculum completion milestone' },
            icon: 'Medal', emoji: '🎗️',
            conditionType: 'assignments_completed', conditionValue: 30,
            rarity: 'rare', color: '#DC2626', bgColor: 'bg-red-100', borderColor: 'border-red-300',
            isSystem: true, sortOrder: 13
        },
        {
            name: { vi: 'Học Tập Hai Tuần', en: 'Two-Week Study' },
            description: { vi: 'Duy trì luyện tập 14 ngày liên tiếp — hình thành thói quen học tập bền vững theo chu kỳ hai tuần', en: 'Maintain 14 consecutive days of practice — establishing a sustainable two-week learning cycle' },
            icon: 'Shield', emoji: '🛡️',
            conditionType: 'streak_14', conditionValue: 14,
            rarity: 'rare', color: '#0891B2', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-300',
            isSystem: true, sortOrder: 14
        },
        {
            name: { vi: 'Thực Hành Chuyên Sâu', en: 'In-Depth Practice' },
            description: { vi: 'Tích lũy 60 phiên luyện tập — khối lượng thực hành đủ để đạt giai đoạn tự động hóa trong tiếp thu ngôn ngữ', en: 'Accumulate 60 practice sessions — sufficient volume to reach the automaticity stage in language acquisition' },
            icon: 'Sparkles', emoji: '✨',
            conditionType: 'practice_count', conditionValue: 60,
            rarity: 'rare', color: '#A855F7', bgColor: 'bg-purple-100', borderColor: 'border-purple-300',
            isSystem: true, sortOrder: 15
        },
        {
            name: { vi: 'Hoàn Thành Đánh Giá Định Kỳ', en: 'Periodic Assessment Completion' },
            description: { vi: 'Hoàn thành 10 bài kiểm tra — thể hiện cam kết tham gia đầy đủ các hoạt động đánh giá năng lực', en: 'Complete 10 exams — demonstrating full commitment to competency assessment activities' },
            icon: 'Trophy', emoji: '🏅',
            conditionType: 'exams_taken', conditionValue: 10,
            rarity: 'rare', color: '#0EA5E9', bgColor: 'bg-sky-100', borderColor: 'border-sky-300',
            isSystem: true, sortOrder: 16
        },
        {
            name: { vi: 'Độ Chính Xác Cao', en: 'High Accuracy' },
            description: { vi: 'Đạt độ chính xác nhận diện ký hiệu từ 95% trở lên trong một bài — chứng tỏ khả năng phân biệt ký hiệu ở mức độ tinh tế', en: 'Achieve 95% or higher sign recognition accuracy in any submission — demonstrating fine-grained sign discrimination ability' },
            icon: 'Target', emoji: '🎯',
            conditionType: 'accuracy_95', conditionValue: 95,
            rarity: 'rare', color: '#8B5CF6', bgColor: 'bg-violet-100', borderColor: 'border-violet-300',
            isSystem: true, sortOrder: 17
        },
        {
            name: { vi: 'Xử Lý Nhanh', en: 'Rapid Processing' },
            description: { vi: 'Hoàn thành bài kiểm tra trong dưới 50% thời gian quy định — thể hiện tốc độ xử lý thông tin và phản xạ nhận thức vượt trội', en: 'Complete an exam in under 50% of the allotted time — demonstrating superior information processing speed and cognitive reflexes' },
            icon: 'Zap', emoji: '⚡',
            conditionType: 'time_bonus', conditionValue: 50,
            rarity: 'rare', color: '#F97316', bgColor: 'bg-orange-100', borderColor: 'border-orange-300',
            isSystem: true, sortOrder: 18
        },

        // ═══════════════════════════════════════════
        // TIER 4 — CHUYÊN SÂU (EPIC, sortOrder 19-24)
        // ═══════════════════════════════════════════
        {
            name: { vi: 'Hoàn Thành Chương Trình Nâng Cao', en: 'Advanced Curriculum Completion' },
            description: { vi: 'Hoàn thành 50 bài tập — đạt mốc hoàn thành toàn bộ chương trình học nâng cao của khóa học', en: 'Complete 50 assignments — reaching the full advanced curriculum completion milestone' },
            icon: 'Shield', emoji: '⚔️',
            conditionType: 'assignments_completed', conditionValue: 50,
            rarity: 'epic', color: '#B45309', bgColor: 'bg-amber-100', borderColor: 'border-amber-500',
            isSystem: true, sortOrder: 19
        },
        {
            name: { vi: 'Kỷ Luật Một Tháng', en: 'One-Month Discipline' },
            description: { vi: 'Duy trì luyện tập 30 ngày liên tiếp — minh chứng cho kỷ luật tự giác và cam kết học tập dài hạn', en: 'Maintain 30 consecutive days of practice — evidence of self-discipline and long-term learning commitment' },
            icon: 'Flame', emoji: '👑',
            conditionType: 'streak_30', conditionValue: 30,
            rarity: 'epic', color: '#DC2626', bgColor: 'bg-red-100', borderColor: 'border-red-400',
            isSystem: true, sortOrder: 20
        },
        {
            name: { vi: 'Thực Hành Chuyên Nghiệp', en: 'Professional Practice Level' },
            description: { vi: 'Tích lũy 100 phiên luyện tập — đạt ngưỡng thực hành tương đương trình độ ứng dụng chuyên nghiệp', en: 'Accumulate 100 practice sessions — reaching a practice threshold equivalent to professional application level' },
            icon: 'Star', emoji: '💫',
            conditionType: 'practice_count', conditionValue: 100,
            rarity: 'epic', color: '#7C3AED', bgColor: 'bg-violet-100', borderColor: 'border-violet-400',
            isSystem: true, sortOrder: 21
        },
        {
            name: { vi: 'Hoàn Thành Toàn Bộ Đánh Giá', en: 'Full Assessment Completion' },
            description: { vi: 'Hoàn thành 15 bài kiểm tra — tham gia đầy đủ toàn bộ chu trình đánh giá năng lực của chương trình học', en: 'Complete 15 exams — fully participating in the entire competency assessment cycle of the program' },
            icon: 'Trophy', emoji: '🏅',
            conditionType: 'exams_taken', conditionValue: 15,
            rarity: 'epic', color: '#0F766E', bgColor: 'bg-teal-100', borderColor: 'border-teal-400',
            isSystem: true, sortOrder: 22
        },
        {
            name: { vi: 'Thành Tích Xuất Sắc', en: 'Outstanding Achievement' },
            description: { vi: 'Duy trì điểm trung bình từ 90 trở lên sau ít nhất 20 bài nộp — đạt mức năng lực xuất sắc, vượt trội so với chuẩn đầu ra của chương trình', en: 'Maintain average score ≥ 90 across at least 20 submissions — achieving outstanding proficiency, exceeding program learning outcomes' },
            icon: 'GraduationCap', emoji: '🎓',
            conditionType: 'average_score_90', conditionValue: 90,
            rarity: 'epic', color: '#EC4899', bgColor: 'bg-pink-100', borderColor: 'border-pink-300',
            isSystem: true, sortOrder: 23
        },
        {
            name: { vi: 'Thành Thạo Hoàn Toàn', en: 'Full Mastery' },
            description: { vi: 'Đạt 100 điểm trong 5 bài liên tiếp — chứng minh sự thành thạo ổn định, không phải kết quả ngẫu nhiên', en: '5 consecutive 100-point scores — demonstrating stable mastery, not a random outcome' },
            icon: 'Crown', emoji: '💎',
            conditionType: 'perfect_streak_5', conditionValue: 5,
            rarity: 'epic', color: '#06B6D4', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-400',
            isSystem: true, sortOrder: 24
        },

        // ═══════════════════════════════════════════
        // TIER 5 — TINH HOA (LEGENDARY, sortOrder 25-30)
        // ═══════════════════════════════════════════
        {
            name: { vi: 'Hoàn Thành Toàn Bộ Chương Trình', en: 'Full Program Completion' },
            description: { vi: 'Hoàn thành 100 bài tập — đạt mốc hoàn thành toàn bộ chương trình học, thể hiện sự kiên trì và nỗ lực học tập đáng ghi nhận', en: 'Complete 100 assignments — reaching full program completion, demonstrating remarkable perseverance and academic effort' },
            icon: 'Crown', emoji: '👸',
            conditionType: 'assignments_completed', conditionValue: 100,
            rarity: 'legendary', color: '#4F46E5', bgColor: 'bg-indigo-100', borderColor: 'border-indigo-600',
            isSystem: true, sortOrder: 25
        },
        {
            name: { vi: 'Cam Kết Dài Hạn', en: 'Long-Term Commitment' },
            description: { vi: 'Duy trì luyện tập 60 ngày liên tiếp — thể hiện cam kết học tập dài hạn ở mức độ hiếm có', en: 'Maintain 60 consecutive days of practice — demonstrating a rare level of long-term learning commitment' },
            icon: 'Flame', emoji: '🌋',
            conditionType: 'streak_60', conditionValue: 60,
            rarity: 'legendary', color: '#991B1B', bgColor: 'bg-red-100', borderColor: 'border-red-600',
            isSystem: true, sortOrder: 26
        },
        {
            name: { vi: 'Chuyên Gia Ngôn Ngữ Ký Hiệu', en: 'Sign Language Specialist' },
            description: { vi: 'Tích lũy 200 phiên luyện tập — đạt khối lượng thực hành tương đương trình độ chuyên gia trong lĩnh vực ngôn ngữ ký hiệu', en: 'Accumulate 200 practice sessions — reaching a practice volume equivalent to specialist-level proficiency in sign language' },
            icon: 'GraduationCap', emoji: '🏆',
            conditionType: 'practice_count', conditionValue: 200,
            rarity: 'legendary', color: '#B45309', bgColor: 'bg-amber-100', borderColor: 'border-amber-600',
            isSystem: true, sortOrder: 27
        },
        {
            name: { vi: 'Năng Lực Vượt Trội', en: 'Superior Competency' },
            description: { vi: 'Duy trì điểm trung bình từ 95 trở lên sau ít nhất 30 bài nộp — đạt mức năng lực vượt trội, tiệm cận chuẩn thành thạo chuyên sâu', en: 'Maintain average score ≥ 95 across at least 30 submissions — achieving superior competency, approaching advanced mastery standards' },
            icon: 'Target', emoji: '🔮',
            conditionType: 'average_score_95', conditionValue: 95,
            rarity: 'legendary', color: '#0891B2', bgColor: 'bg-cyan-100', borderColor: 'border-cyan-400',
            isSystem: true, sortOrder: 28
        },
        {
            name: { vi: 'Thành Thạo Bền Vững', en: 'Sustained Mastery' },
            description: { vi: 'Đạt 100 điểm trong 10 bài liên tiếp — minh chứng cho năng lực thành thạo bền vững và ổn định theo thời gian', en: '10 consecutive 100-point scores — evidence of sustained and stable mastery over time' },
            icon: 'Zap', emoji: '🌩️',
            conditionType: 'perfect_streak_10', conditionValue: 10,
            rarity: 'legendary', color: '#7C3AED', bgColor: 'bg-violet-100', borderColor: 'border-violet-500',
            isSystem: true, sortOrder: 29
        },
        {
            name: { vi: 'Nhà Nghiên Cứu', en: 'Research Scholar' },
            description: { vi: 'Tích lũy 500 phiên luyện tập — khối lượng thực hành tương đương một nghiên cứu sinh chuyên sâu về ngôn ngữ ký hiệu', en: 'Accumulate 500 practice sessions — a practice volume equivalent to a dedicated sign language research scholar' },
            icon: 'Sparkles', emoji: '🌌',
            conditionType: 'practice_count', conditionValue: 500,
            rarity: 'legendary', color: '#1D4ED8', bgColor: 'bg-blue-100', borderColor: 'border-blue-700',
            isSystem: true, sortOrder: 30
        }
    ];

    for (const badge of defaults) {
        // Upsert theo name.vi — cập nhật nếu đã tồn tại, tạo mới nếu chưa có
        // Dùng findOneAndUpdate với upsert=true để atomic, tránh race condition
        await this.findOneAndUpdate(
            { 'name.vi': badge.name.vi, isSystem: true },
            { $setOnInsert: badge },
            { upsert: true, new: false }
        );
    }
};

export default mongoose.model('Badge', BadgeSchema);
