/**
 * Finger Corrections - Chi tiết sửa lỗi từng ngón tay
 * Dùng khi backend chưa gửi corrections hoặc làm fallback
 */

export const FINGER_CORRECTION_TEMPLATES = {
  'GẬP': { emoji: '✊', color: 'red', priority: 'high' },
  'DUỖI': { emoji: '☝️', color: 'blue', priority: 'medium' },
  'CAO QUÁ': { emoji: '⬆️', color: 'orange', priority: 'medium' },
  'THẤP QUÁ': { emoji: '⬇️', color: 'purple', priority: 'medium' },
  'NGANG NHAU': { emoji: '👆', color: 'cyan', priority: 'low' },
  'CỔ TAY': { emoji: '🤚', color: 'amber', priority: 'low' }
};

// Chi tiết sửa lỗi cho từng cặp chữ
export const LETTER_PAIR_CORRECTIONS = {
  // GH: Target=G, Detected=H - User đang làm H nhưng cần làm G
  // G khác H: cái DUỖI ngang, giữa GẬP
  'GH': [
    { finger: 'middle', issue: 'DUỖI', fix: 'Ngón giữa đang duỗi - cần GẬP hoàn toàn vào lòng bàn tay!' },
    { finger: 'thumb', issue: 'GẬP', fix: 'Ngón cái đang gập - cần DUỖI ngang song song với ngón trỏ!' },
    { finger: 'ring', issue: 'DUỖI', fix: 'Ngón áp út đang duỗi - cần GẬP hoàn toàn vào lòng bàn tay!' },
    { finger: 'pinky', issue: 'DUỖI', fix: 'Ngón út đang duỗi - cần GẬP hoàn toàn vào lòng bàn tay!' }
  ],
  
  // HG: Target=H, Detected=G - User đang làm G nhưng cần làm H
  // H khác G: giữa DUỖI ngang, cái GẬP
  'HG': [
    { finger: 'middle', issue: 'GẬP', fix: 'Ngón giữa đang gập - cần DUỖI thẳng sang ngang, song song với ngón trỏ!' },
    { finger: 'thumb', issue: 'DUỖI', fix: 'Ngón cái đang duỗi ngang - cần GẬP vào bên dưới!' },
    { finger: 'ring', issue: 'GẬP', fix: 'Ngón áp út đang gập - cần GẬP hoàn toàn vào lòng bàn tay!' },
    { finger: 'pinky', issue: 'GẬP', fix: 'Ngón út đang gập - cần GẬP hoàn toàn vào lòng bàn tay!' }
  ],
  'AD': [
    { finger: 'index', issue: 'DUỖI', fix: 'Ngón trỏ đang duỗi lên - cần GẬP lại thành nắm đấm' },
    { finger: 'middle', issue: 'DUỖI', fix: 'Ngón giữa đang duỗi - cần GẬP xuống' },
    { finger: 'ring', issue: 'DUỖI', fix: 'Ngón nhẫn đang duỗi - cần GẬP xuống' },
    { finger: 'pinky', issue: 'DUỖI', fix: 'Ngón út đang duỗi - cần GẬP xuống' },
    { finger: 'thumb', issue: 'CAO QUÁ', fix: 'Ngón cái cao quá - cần hạ xuống bên hông nắm đấm' }
  ],
  'AB': [
    { finger: 'thumb', issue: 'GẬP', fix: 'Ngón cái bị gập - cần GẬP vào lòng bàn tay phẳng' },
    { finger: 'index', issue: 'GẬP', fix: '4 ngón trỏ đang bị gập - cần DUỖI thẳng ra phía trước' },
    { finger: 'middle', issue: 'GẬP', fix: 'Ngón giữa đang bị gập - cần DUỖI thẳng ra phía trước' },
    { finger: 'ring', issue: 'GẬP', fix: 'Ngón nhẫn đang bị gập - cần DUỖI thẳng ra phía trước' },
    { finger: 'pinky', issue: 'GẬP', fix: 'Ngón út đang bị gập - cần DUỖI thẳng ra phía trước' }
  ],
  'AE': [
    { finger: 'index', issue: 'GẬP', fix: '4 ngón trỏ cần GẬP xuống - đầu ngón chạm lòng bàn tay' },
    { finger: 'middle', issue: 'GẬP', fix: 'Ngón giữa cần GẬP xuống - đầu ngón chạm lòng bàn tay' },
    { finger: 'ring', issue: 'GẬP', fix: 'Ngón nhẫn cần GẬP xuống - đầu ngón chạm lòng bàn tay' },
    { finger: 'pinky', issue: 'GẬP', fix: 'Ngón út cần GẬP xuống - đầu ngón chạm lòng bàn tay' },
    { finger: 'thumb', issue: 'CAO QUÁ', fix: 'Ngón cái cao quá - cần hạ xuống ngang lòng bàn tay' }
  ],
  'BD': [
    { finger: 'index', issue: 'GẬP', fix: 'Ngón trỏ đang BỊ GẬP - cần DUỖI THẲNG LÊN' },
    { finger: 'thumb', issue: 'GẬP', fix: 'Ngón cái đang GẬP - cần GẬP VÀO lòng bàn tay' }
  ],
  'AC': [
    { finger: 'index', issue: 'DUỖI', fix: 'Ngón trỏ duỗi - cần GẬP cong tạo hình C' },
    { finger: 'middle', issue: 'DUỖI', fix: 'Ngón giữa duỗi - cần GẬP cong tạo hình C' },
    { finger: 'ring', issue: 'DUỖI', fix: 'Ngón nhẫn duỗi - cần GẬP cong tạo hình C' },
    { finger: 'pinky', issue: 'DUỖI', fix: 'Ngón út duỗi - cần GẬP cong tạo hình C' }
  ]
};

/**
 * Hàm so sánh hai chữ và tạo corrections
 * @param {string} detectedLetter - Chữ được phát hiện
 * @param {string} targetLetter - Chữ cần làm
 * @returns {array} - Mảng corrections
 */
export const generateLetterPairCorrections = (detectedLetter, targetLetter) => {
  const corrections = [];
  
  const detected = detectedLetter?.toUpperCase() || '';
  const target = targetLetter?.toUpperCase() || '';
  
  // Xử lý riêng cặp GH và HG - không dùng sort() vì thứ tự quan trọng!
  if ((detected === 'G' && target === 'H') || (detected === 'H' && target === 'G')) {
    const pairKey = detected + target; // Giữ nguyên thứ tự: detected trước, target sau
    
    if (LETTER_PAIR_CORRECTIONS[pairKey]) {
      LETTER_PAIR_CORRECTIONS[pairKey].forEach(corr => {
        const template = FINGER_CORRECTION_TEMPLATES[corr.issue] || { emoji: '💡', color: 'gray', priority: 'medium' };
        corrections.push({
          finger: corr.finger,
          emoji: template.emoji,
          issue: corr.issue,
          fix: corr.fix,
          priority: corr.priority || template.priority,
          color: template.color
        });
      });
      return corrections;
    }
  }
  
  // Các cặp khác dùng sort() như bình thường
  const pairKey = [detected, target].sort().join('');
  
  if (LETTER_PAIR_CORRECTIONS[pairKey]) {
    LETTER_PAIR_CORRECTIONS[pairKey].forEach(corr => {
      const template = FINGER_CORRECTION_TEMPLATES[corr.issue] || { emoji: '💡', color: 'gray', priority: 'medium' };
      corrections.push({
        finger: corr.finger,
        emoji: template.emoji,
        issue: corr.issue,
        fix: corr.fix,
        priority: template.priority,
        color: template.color
      });
    });
  }
  
  return corrections;
};

/**
 * Sắp xếp corrections theo priority
 * @param {array} corrections - Mảng corrections
 * @returns {array} - Mảng đã sắp xếp
 */
export const sortCorrectionsByPriority = (corrections) => {
  const priorityMap = { high: 0, medium: 1, low: 2, info: 3 };
  return corrections.sort((a, b) => {
    return (priorityMap[a.priority] || 2) - (priorityMap[b.priority] || 2);
  });
};

/**
 * Lấy màu CSS dựa trên priority
 * @param {string} priority - Priority level
 * @returns {object} - { borderColor, bgGradient }
 */
export const getPriorityColors = (priority) => {
  switch (priority) {
    case 'high':
      return { borderColor: 'border-red-200', bgGradient: 'from-red-50 to-orange-50' };
    case 'medium':
      return { borderColor: 'border-orange-200', bgGradient: 'from-orange-50 to-amber-50' };
    case 'low':
      return { borderColor: 'border-amber-200', bgGradient: 'from-amber-50 to-orange-50' };
    case 'info':
      return { borderColor: 'border-green-200', bgGradient: 'from-green-50 to-emerald-50' };
    default:
      return { borderColor: 'border-gray-200', bgGradient: 'from-gray-50 to-gray-100' };
  }
};

/**
 * Lấy màu nền cho overlay
 * @param {object} correction - Correction object
 * @returns {string} - Tailwind color class
 */
export const getOverlayBgColor = (correction) => {
  if (correction.issue?.includes('GẬP')) return 'bg-red-500/90';
  if (correction.issue?.includes('DUỖI')) return 'bg-blue-500/90';
  if (correction.issue?.includes('CAO')) return 'bg-orange-500/90';
  if (correction.issue?.includes('THẤP')) return 'bg-purple-500/90';
  if (correction.priority === 'high') return 'bg-red-500/90';
  if (correction.priority === 'medium') return 'bg-amber-500/90';
  if (correction.priority === 'info') return 'bg-green-500/90';
  return 'bg-indigo-500/90';
};

/**
 * Format correction message thân thiện
 * @param {object} correction - Correction object
 * @returns {string} - Formatted message
 */
export const formatCorrectionMessage = (correction) => {
  if (!correction) return '';
  return `${correction.emoji || '💡'} ${(correction.finger || '').toUpperCase()} - ${correction.issue || ''}: ${correction.fix || ''}`;
};
