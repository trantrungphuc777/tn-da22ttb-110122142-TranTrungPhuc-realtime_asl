import React, { useState, useEffect } from 'react';
import { 
  ThumbsUp, ThumbsDown, AlertCircle, CheckCircle, 
  ChevronDown, ChevronUp, Lightbulb, Target, 
  RefreshCw, Award, TrendingUp, Clock, Sparkles,
  Hand, Fingerprint, RotateCcw, MessageCircle
} from 'lucide-react';
import { 
  ASL_LETTER_FEEDBACK, 
  generateFeedback, 
  FEEDBACK_CATEGORIES,
  FEEDBACK_PHRASES 
} from '../data/practiceFeedback';
import { useLanguage } from '../contexts/LanguageContext';

// Main Practice Feedback Component
const PracticeFeedback = ({ 
  targetLetter, 
  detectedLetter, 
  accuracy, 
  isVisible = true,
  onClose,
  compact = false 
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedSection, setExpandedSection] = useState(null);
  const [animationKey, setAnimationKey] = useState(0);

  // Regenerate animation key when feedback changes
  useEffect(() => {
    setAnimationKey(prev => prev + 1);
  }, [targetLetter, detectedLetter, accuracy]);

  const feedback = generateFeedback(targetLetter, detectedLetter, accuracy);

  if (!isVisible || !feedback) return null;

  const getPerformanceColor = (level) => {
    const colors = {
      excellent: 'from-emerald-400 to-green-500',
      good: 'from-blue-400 to-cyan-500',
      fair: 'from-amber-400 to-orange-500',
      needsImprovement: 'from-red-400 to-rose-500'
    };
    return colors[level] || colors.fair;
  };

  const getPerformanceBgColor = (level) => {
    const colors = {
      excellent: 'bg-emerald-50 border-emerald-200',
      good: 'bg-blue-50 border-blue-200',
      fair: 'bg-amber-50 border-amber-200',
      needsImprovement: 'bg-red-50 border-red-200'
    };
    return colors[level] || colors.fair;
  };

  const getStatusColor = (status) => {
    const colors = {
      success: 'text-emerald-600 bg-emerald-100',
      warning: 'text-amber-600 bg-amber-100',
      critical: 'text-red-600 bg-red-100',
      important: 'text-blue-600 bg-blue-100',
      minor: 'text-gray-600 bg-gray-100'
    };
    return colors[status] || colors.minor;
  };

  const getStatusIcon = (status) => {
    const icons = {
      success: <CheckCircle className="w-4 h-4" />,
      warning: <AlertCircle className="w-4 h-4" />,
      critical: <AlertCircle className="w-4 h-4" />,
      important: <Target className="w-4 h-4" />,
      minor: <CheckCircle className="w-4 h-4" />
    };
    return icons[status] || icons.minor;
  };

  if (compact) {
    return (
      <CompactFeedback 
        feedback={feedback} 
        onClose={onClose}
        getPerformanceColor={getPerformanceColor}
        getPerformanceBgColor={getPerformanceBgColor}
        t={t}
      />
    );
  }

  return (
    <div className={`bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl shadow-blue-300/30 border border-blue-200/50 overflow-hidden animate-fadeIn preserve-3d`} key={animationKey}>
      {/* Header */}
      <div className={`bg-gradient-to-r ${getPerformanceColor(feedback.performanceLevel)} p-2 text-white`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              {feedback.isCorrect ? (
                <ThumbsUp className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-bold text-base">
                {t('practiceFeedback.feedbackLetter')} {feedback.letter}
              </h3>
              <p className="text-white/80 text-sm">
                {feedback.isCorrect ? t('practiceFeedback.accuracyExclamation') : `${t('practiceFeedback.youPerformed')} "${detectedLetter || '?'}"`}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-black">{accuracy}%</div>
            <div className="text-white/80 text-xs">{t('practiceFeedback.accuracyLabel')}</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex">
          {[
            { id: 'overview', label: t('practiceFeedback.overviewTab'), icon: <Sparkles className="w-4 h-4" /> },
            { id: 'details', label: t('practiceFeedback.detailsTab'), icon: <Fingerprint className="w-4 h-4" /> },
            { id: 'tips', label: t('practiceFeedback.tipsTab'), icon: <Lightbulb className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 flex items-center justify-center gap-2 text-sm font-bold transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-gradient-to-t from-blue-50 to-transparent'
                  : 'text-gray-500 hover:text-blue-500 hover:bg-blue-50/50 border-b-2 border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-3 max-h-80 overflow-y-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className={`p-3 rounded-lg ${getPerformanceBgColor(feedback.performanceLevel)} border`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{feedback.summary.emoji}</span>
                <div>
                    <h4 className="font-bold">{feedback.summary.title}</h4>
                      <p className="text-sm text-gray-600">{feedback.summary.message}</p>
                </div>
              </div>
            </div>

            {/* Letter Description */}
            <div className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-xl p-4 border border-blue-100 shadow-inner">
              <h4 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                <Hand className="w-4 h-4 text-blue-500" />
                {t('practiceFeedback.signDescription')}
              </h4>
              <p className="text-blue-800/80 text-sm font-medium">{feedback.letterData.description}</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-2 text-center border border-blue-200 shadow-sm">
                <div className="text-xl font-black text-blue-600 drop-shadow-sm">
                  {feedback.isCorrect ? '✓' : '✗'}
                </div>
                <div className="text-xs font-bold text-blue-800 uppercase tracking-wide">
                  {feedback.isCorrect ? t('practiceFeedback.correct') : t('practiceFeedback.incorrect')}
                </div>
              </div>
              <div className="bg-gradient-to-br from-amber-100 to-orange-100 rounded-lg p-2 text-center border border-amber-200 shadow-sm">
                <div className="text-xl font-black text-amber-600 drop-shadow-sm">
                  {feedback.detailedFeedback.filter(f => f.status === 'critical').length}
                </div>
                <div className="text-xs font-bold text-amber-800 uppercase tracking-wide">{t('practiceFeedback.importantPoints')}</div>
              </div>
            </div>
          </div>
        )}

        {/* Details Tab */}
        {activeTab === 'details' && (
          <div className="space-y-4">
            <h4 className="font-bold text-blue-900 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-500" />
              {t('practiceFeedback.detailedGuide')}
            </h4>
            
            {feedback.detailedFeedback.map((item, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                  expandedSection === index 
                    ? 'border-blue-400 bg-gradient-to-r from-blue-50 to-sky-50 shadow-md' 
                    : 'border-blue-100 bg-white hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <button
                  onClick={() => setExpandedSection(expandedSection === index ? null : index)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-lg text-sm font-medium ${
                      item.priority === 'high' 
                        ? 'bg-red-100 text-red-600' 
                        : item.priority === 'medium' 
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-green-100 text-green-600'
                    }`}>
                      {item.priority === 'high' ? '⚠️' : item.priority === 'medium' ? '📌' : '✓'}
                    </span>
                    <span className="font-medium text-gray-700">
                      {t(`practice.${item.finger}`)}
                    </span>
                  </div>
                  {expandedSection === index ? (
                    <ChevronUp className="w-5 h-5 text-blue-500" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-blue-400" />
                  )}
                </button>
                
                {expandedSection === index && (
                  <div className="mt-3 pl-11 text-sm text-gray-700 animate-slideDown">
                    <p className="font-semibold text-rose-600 mb-2 bg-rose-50 p-2 rounded-lg border border-rose-100">{t('practiceFeedback.issue')}: {item.issue}</p>
                    <p className="font-semibold text-emerald-600 bg-emerald-50 p-2 rounded-lg border border-emerald-100">{t('practiceFeedback.fix')}: {item.fix}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Common Mistakes */}
            {!feedback.isCorrect && feedback.letterData.commonMistakes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <h5 className="font-semibold text-red-600 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {t('practiceFeedback.commonMistakes')}
                </h5>
                <ul className="space-y-2">
                  {feedback.letterData.commonMistakes.map((mistake, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="text-red-400 mt-1">•</span>
                      {mistake}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Tips Tab */}
        {activeTab === 'tips' && (
          <div className="space-y-4">
            <h4 className="font-bold text-blue-900 flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              {t('practiceFeedback.errorFixGuide')}
            </h4>

            {feedback.tips.map((tip, index) => (
              <div 
                key={index}
                className={`p-4 rounded-xl border-2 shadow-sm transition-transform hover:-translate-y-1 ${
                  tip.type === 'encouragement' 
                    ? 'bg-emerald-50 border-emerald-200'
                    : tip.type === 'correction'
                    ? 'bg-amber-50 border-amber-200'
                    : tip.type === 'warning'
                    ? 'bg-red-50 border-red-200'
                    : tip.type === 'general'
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">
                    {tip.type === 'encouragement' ? '🎉' : 
                     tip.type === 'correction' ? '📝' : 
                     tip.type === 'warning' ? '⚠️' : 
                     tip.type === 'general' ? '💡' : '✨'}
                  </span>
                  <p className="text-sm text-gray-700 font-medium">{tip.text}</p>
                </div>
              </div>
            ))}

            {/* Quick Practice Button */}
            <button
              onClick={() => {
                if (onClose) onClose();
              }}
              className="w-full py-4 mt-4 bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-400 text-white rounded-xl font-bold hover:shadow-xl hover:shadow-blue-500/30 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 neon-btn"
            >
              <RotateCcw className="w-5 h-5" />
              {t('practiceFeedback.practiceAgainLetter')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Compact Feedback Component for inline display
const CompactFeedback = ({ feedback, onClose, getPerformanceColor, getPerformanceBgColor, t }) => {
  return (
    <div className={`p-3 rounded-xl border ${getPerformanceBgColor(feedback.performanceLevel)} animate-slideDown`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">{feedback.summary.emoji}</span>
          <div>
            <div className="font-semibold text-gray-800">
              {feedback.isCorrect ? t('practiceFeedback.correct') : t('practiceFeedback.needsImprovement')}
            </div>
            <div className="text-sm text-gray-500">
              {feedback.isCorrect 
                ? feedback.summary.message 
                : t('practiceFeedback.performedInstead', { detected: feedback.letter, target: feedback.letter })
              }
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getPerformanceColor(feedback.performanceLevel)} text-white text-sm font-bold`}>
            {feedback.accuracy}%
          </div>
          {onClose && (
            <button 
              onClick={onClose}
              className="p-1 hover:bg-white/50 rounded-lg transition"
            >
              <ChevronUp className="w-4 h-4 text-gray-500" />
            </button>
          )}
        </div>
      </div>
      
      {/* Quick tips */}
      {!feedback.isCorrect && (
        <div className="mt-3 pt-3 border-t border-gray-200/50">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Lightbulb className="w-4 h-4 text-amber-500" />
            <span>{feedback.tips[0]?.text || t('practiceFeedback.attentionTip')}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Detailed Feedback Modal Component
const FeedbackModal = ({ isOpen, onClose, feedback, onRetry }) => {
  if (!isOpen || !feedback) return null;

  return (
    <div className="fixed inset-0 bg-blue-950/30 backdrop-blur-sm flex items-center justify-center z-50 p-3">
      <div className="bg-white/90 backdrop-blur-2xl rounded-3xl shadow-2xl shadow-blue-500/20 max-w-md w-full max-h-[80vh] overflow-hidden animate-scaleIn border border-blue-200/50">
        <PracticeFeedback
          targetLetter={feedback.targetLetter}
          detectedLetter={feedback.detectedLetter}
          accuracy={feedback.accuracy}
          isVisible={true}
          onClose={() => {
            if (onRetry) onRetry();
            if (onClose) onClose();
          }}
        />
      </div>
    </div>
  );
};

// Real-time Feedback Toast Component
const FeedbackToast = ({ feedback, onDismiss, t }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  if (!visible || !feedback) return null;

  return (
    <div className={`fixed bottom-4 right-4 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-slideUp z-50 ${
      feedback.isCorrect ? 'ring-2 ring-emerald-400' : 'ring-2 ring-amber-400'
    }`}>
      <div className={`p-3 ${feedback.isCorrect ? 'bg-emerald-50' : 'bg-amber-50'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{feedback.summary.emoji}</span>
            <div>
              <div className="font-semibold text-gray-800">
                {feedback.isCorrect ? t('practiceFeedback.correct') : t('practiceFeedback.needsImprovement')}
              </div>
              <div className="text-sm text-gray-500">
                {t('practiceFeedback.letterAccuracy', { letter: feedback.letter, accuracy: feedback.accuracy })}
              </div>
            </div>
          </div>
          <button 
            onClick={() => setVisible(false)}
            className="p-1 hover:bg-white/50 rounded-lg transition"
          >
            <ChevronDown className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>
      {!feedback.isCorrect && feedback.tips.length > 0 && (
        <div className="p-3 bg-white">
          <div className="flex items-start gap-2 text-sm text-gray-600">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>{feedback.tips[0].text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Progress Tracker Component
const FeedbackProgressTracker = ({ history = [], t }) => {
  const getStats = () => {
    if (history.length === 0) return { correct: 0, incorrect: 0, accuracy: 0 };
    const correct = history.filter(h => h.isCorrect).length;
    return {
      correct,
      incorrect: history.length - correct,
      accuracy: Math.round((correct / history.length) * 100)
    };
  };

  const stats = getStats();

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg shadow-blue-200/30 border border-blue-200/50 p-5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl"></div>
      <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2 relative z-10">
        <TrendingUp className="w-5 h-5 text-blue-500" />
        {t('practiceFeedback.feedbackProgress')}
      </h4>
      
      <div className="grid grid-cols-3 gap-3 mb-5 relative z-10">
        <div className="text-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
          <div className="text-3xl font-black text-emerald-600 drop-shadow-sm">{stats.correct}</div>
          <div className="text-xs font-bold text-emerald-800 uppercase mt-1">{t('practiceFeedback.correct')}</div>
        </div>
        <div className="text-center bg-rose-50/50 p-3 rounded-xl border border-rose-100">
          <div className="text-3xl font-black text-rose-500 drop-shadow-sm">{stats.incorrect}</div>
          <div className="text-xs font-bold text-rose-800 uppercase mt-1">{t('practiceFeedback.incorrect')}</div>
        </div>
        <div className="text-center bg-blue-50/50 p-3 rounded-xl border border-blue-100">
          <div className="text-3xl font-black text-blue-600 drop-shadow-sm">{stats.accuracy}%</div>
          <div className="text-xs font-bold text-blue-800 uppercase mt-1">{t('practiceFeedback.accuracy')}</div>
        </div>
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="flex gap-2 justify-center relative z-10 flex-wrap">
          {history.slice(-10).map((item, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full shadow-sm hover:scale-125 transition-transform ${
                item.isCorrect ? 'bg-gradient-to-br from-emerald-400 to-green-500 shadow-emerald-500/40' : 'bg-gradient-to-br from-rose-400 to-red-500 shadow-red-500/40'
              }`}
              title={t('practiceFeedback.letterResult', { letter: item.target, result: item.isCorrect ? '✓' : '✗' })}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// Letter Guide Card Component
const LetterGuideCard = ({ letter, t }) => {
  const [expanded, setExpanded] = useState(false);
  const letterData = ASL_LETTER_FEEDBACK[letter.toUpperCase()];

  if (!letterData) return null;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-blue-200/50 overflow-hidden hover:shadow-md transition-shadow">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-4 flex items-center justify-between hover:bg-blue-50/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 via-sky-400 to-cyan-400 rounded-xl flex items-center justify-center text-white font-black text-2xl shadow-inner-lg">
            {letter}
          </div>
          <div className="text-left">
            <div className="font-bold text-blue-950 text-lg">{letterData.name}</div>
            <div className="text-sm font-medium text-blue-600/80">{t('practiceFeedback.clickForDetails')}</div>
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 animate-slideDown">
          {/* Description */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600">{letterData.description}</p>
          </div>

          {/* Key Points */}
          <div>
            <h5 className="font-semibold text-gray-700 mb-2 text-sm">{t('practiceFeedback.importantPoints')}:</h5>
            <ul className="space-y-1">
              {letterData.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  {point.feedback}
                </li>
              ))}
            </ul>
          </div>

          {/* Common Mistakes */}
          <div>
            <h5 className="font-semibold text-red-600 mb-2 text-sm">{t('practiceFeedback.commonMistakes')}:</h5>
            <ul className="space-y-1">
              {letterData.commonMistakes.map((mistake, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className="text-red-400">•</span>
                  {mistake}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// Letter Guide Panel Component
const LetterGuidePanel = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const filteredLetters = letters.filter(letter => {
    const matchesSearch = letter.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl shadow-blue-200/30 border border-blue-200/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 p-6 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
        <h3 className="font-bold text-xl flex items-center gap-3 relative z-10 drop-shadow-sm">
          <MessageCircle className="w-6 h-6" />
          {t('practiceFeedback.aslGuide')}
        </h3>
        <p className="text-white/90 font-medium text-sm mt-2 relative z-10">
          {t('practiceFeedback.viewLetterDetails')}
        </p>
      </div>

      {/* Search */}
      <div className="p-5 border-b border-blue-100 bg-blue-50/30">
        <input
          type="text"
          placeholder={t('practiceFeedback.searchLetter')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-5 py-3 bg-white border border-blue-200/70 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-medium text-blue-900 shadow-sm"
        />
      </div>

      {/* Letter Grid */}
      <div className="p-4 max-h-96 overflow-y-auto">
        <div className="grid grid-cols-4 gap-2">
          {filteredLetters.map(letter => (
            <LetterGuideCard key={letter} letter={letter} t={t} />
          ))}
        </div>
      </div>
    </div>
  );
};

// Helper function to get aspect name (requires t function to be passed)
const getAspectName = (aspect, t) => {
  const names = {
    fingers: t('practiceFeedback.fingers'),
    thumb: t('practiceFeedback.thumb'),
    wrist: t('practiceFeedback.wrist'),
    palm: t('practiceFeedback.palm'),
    orientation: t('practiceFeedback.orientation'),
    indexFinger: t('practiceFeedback.indexFinger'),
    otherFingers: t('practiceFeedback.otherFingers'),
    index: t('practiceFeedback.index'),
    indexThumb: t('practiceFeedback.indexThumb'),
    indexMiddle: t('practiceFeedback.indexMiddle'),
    middleFingers: t('practiceFeedback.middleFingers'),
    threeFingers: t('practiceFeedback.threeFingers'),
    tealy: t('practiceFeedback.pinky'),
    crossedFingers: t('practiceFeedback.crossedFingers'),
    fist: t('practiceFeedback.fist'),
    cross: t('practiceFeedback.cross'),
    movement: t('practiceFeedback.movement'),
    position: t('practiceFeedback.position'),
    shape: t('practiceFeedback.shape'),
    angle: t('practiceFeedback.angle')
  };
  return names[aspect] || aspect;
};

// Export all components
export {
  PracticeFeedback,
  CompactFeedback,
  FeedbackModal,
  FeedbackToast,
  FeedbackProgressTracker,
  LetterGuideCard,
  LetterGuidePanel
};

export default PracticeFeedback;
