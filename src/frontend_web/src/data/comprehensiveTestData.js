/**
 * Comprehensive Test Data - Ngân hàng câu hỏi cho bài kiểm tra tổng hợp
 * Kết hợp từ: PracticeFeedback + ASLQuiz + Dữ liệu mới
 */

import { VOCABULARY_QUIZ_DATA, SENTENCE_QUIZ_DATA, VOCABULARY_BY_TOPIC, SENTENCES_BY_TOPIC, getASLLetterImage } from './aslQuizData';

// ========== 1. DỮ LIỆU CHỮ CÁI A-Z ==========
export const ASL_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// ========== 2. PHÂN LOẠI TỪ VỰNG THEO ĐỘ DÀI ==========

// Từ ngắn (1-2 ký hiệu)
export const SHORT_WORDS = VOCABULARY_QUIZ_DATA.filter(v => v.aslSpelling.length <= 2).map(v => ({
  word: v.word,
  meaning: v.meaning,
  aslSpelling: v.aslSpelling,
  type: 'short'
}));

// Từ dài (3+ ký hiệu) 
export const LONG_WORDS = VOCABULARY_QUIZ_DATA.filter(v => v.aslSpelling.length >= 3 && v.aslSpelling.length <= 5).map(v => ({
  word: v.word,
  meaning: v.meaning,
  aslSpelling: v.aslSpelling,
  type: 'long'
}));

// Câu phức tạp (6+ ký hiệu hoặc câu hoàn chỉnh)
export const COMPLEX_SENTENCES = VOCABULARY_QUIZ_DATA.filter(v => v.aslSpelling.length > 5).map(v => ({
  word: v.word,
  meaning: v.meaning,
  aslSpelling: v.aslSpelling,
  type: 'complex'
}));

// Thêm câu giao tiếp từ SENTENCE_QUIZ_DATA
export const COMMUNICATION_SENTENCES = SENTENCE_QUIZ_DATA.map(s => ({
  word: s.sentence,
  meaning: s.meaning,
  aslSpelling: s.aslSpelling,
  type: 'sentence'
}));

// ========== 3. CÁC DẠNG BÀI KIỂM TRA ==========
export const QUESTION_TYPES = {
  LETTER: 'letter',           // Chữ cái A-Z
  SHORT_WORD: 'short_word',   // Từ ngắn (1-2 ký hiệu)
  LONG_WORD: 'long_word',     // Từ dài (3-5 ký hiệu)
  COMPLEX: 'complex',        // Câu phức tạp (6+ ký hiệu)
  QUIZ_IMAGE: 'quiz_image',  // Trắc nghiệm nhận diện ảnh
  CHAIN: 'chain'              // Chuỗi ký hiệu liên tục
};

// ========== 4. THỜI GIAN CHO TỪNG DẠNG BÀI ==========
export const TIME_LIMITS = {
  letter: 60,        // 60 giây - chữ cái
  short_word: 60,    // 60 giây - từ ngắn
  long_word: 90,     // 90 giây - từ dài
  complex: 90,       // 90 giây - câu phức tạp
  quiz_image: 60,    // 60 giây - trắc nghiệm ảnh
  chain: 90          // 90 giây - chuỗi ký hiệu
};

// ========== 5. THỜI GIAN TỐI ĐA CHO CHAIN ==========
export const CHAIN_MAX_TIME = 120; // 120 giây cho chuỗi dài nhất

// ========== 6. ĐIỂM SỐ ==========
// Mỗi câu đều bằng nhau, thang 100 điểm
// Điểm mỗi câu = 100 / tổng số câu (tính động khi kết thúc)
// SCORE_CONFIG chỉ dùng để đánh dấu đúng/sai, không dùng để tính điểm thực tế
export const SCORE_CONFIG = {
  letter: { correct: 1, partial: 0, wrong: 0 },
  short_word: { correct: 1, partial: 0, wrong: 0 },
  long_word: { correct: 1, partial: 0, wrong: 0 },
  complex: { correct: 1, partial: 0, wrong: 0 },
  quiz_image: { correct: 1, partial: 0, wrong: 0 },
  chain: { correct: 1, partial: 0, wrong: 0 }
};

// Điểm thưởng tốc độ — đã bỏ, không dùng nữa
export const SPEED_BONUS = {};

// ========== 7. ĐỘ KHÓ ==========
export const DIFFICULTY_LEVELS = {
  EASY: 'easy',
  MEDIUM: 'medium',
  HARD: 'hard'
};

// ========== 8. XẾP LOẠI ==========
export const getGrade = (percentage) => {
  if (percentage >= 95) return { grade: 'XUẤT SẮC', emoji: '🏆', color: 'from-yellow-400 to-amber-500' };
  if (percentage >= 85) return { grade: 'GIỎI', emoji: '🥇', color: 'from-emerald-400 to-green-500' };
  if (percentage >= 75) return { grade: 'KHÁ', emoji: '🥈', color: 'from-blue-400 to-cyan-500' };
  if (percentage >= 60) return { grade: 'TRUNG BÌNH', emoji: '🥉', color: 'from-amber-400 to-orange-500' };
  if (percentage >= 40) return { grade: 'YẾU', emoji: '📚', color: 'from-red-400 to-rose-500' };
  return { grade: 'CẦN CỐ GẮNG', emoji: '💪', color: 'from-gray-400 to-gray-500' };
};

// ========== 9. HÀM TIỆN ÍCH ==========

// Shuffle array
const shuffleArray = (array) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Lấy ảnh ASL cho chữ cái
export const getLetterImage = (letter) => getASLLetterImage(letter);

// Sinh câu hỏi chữ cái
export const generateLetterQuestion = () => {
  const letter = ASL_LETTERS[Math.floor(Math.random() * ASL_LETTERS.length)];
  return {
    type: QUESTION_TYPES.LETTER,
    displayText: letter,
    target: letter,
    timeLimit: TIME_LIMITS.letter,
    maxScore: SCORE_CONFIG.letter.correct,
    difficulty: DIFFICULTY_LEVELS.EASY
  };
};

// Sinh câu hỏi từ ngắn
export const generateShortWordQuestion = () => {
  const word = SHORT_WORDS[Math.floor(Math.random() * SHORT_WORDS.length)];
  const aslFiltered = (word.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
  return {
    type: QUESTION_TYPES.SHORT_WORD,
    displayText: word.word,
    meaning: word.meaning,
    target: aslFiltered.join(''),
    aslSpelling: aslFiltered,
    timeLimit: TIME_LIMITS.short_word,
    maxScore: SCORE_CONFIG.short_word.correct,
    difficulty: DIFFICULTY_LEVELS.EASY
  };
};

// Sinh câu hỏi từ dài
export const generateLongWordQuestion = () => {
  const word = LONG_WORDS[Math.floor(Math.random() * LONG_WORDS.length)];
  const aslFiltered = (word.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
  return {
    type: QUESTION_TYPES.LONG_WORD,
    displayText: word.word,
    meaning: word.meaning,
    target: aslFiltered.join(''),
    aslSpelling: aslFiltered,
    timeLimit: TIME_LIMITS.long_word,
    maxScore: SCORE_CONFIG.long_word.correct,
    difficulty: DIFFICULTY_LEVELS.MEDIUM
  };
};

// Sinh câu hỏi câu phức tạp
export const generateComplexQuestion = () => {
  // Mix giữa từ dài và câu giao tiếp
  const useSentence = Math.random() > 0.5;
  const source = useSentence ? COMMUNICATION_SENTENCES : COMPLEX_SENTENCES;
  const item = source[Math.floor(Math.random() * source.length)];
  const aslFiltered = (item.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
  return {
    type: QUESTION_TYPES.COMPLEX,
    displayText: item.word,
    meaning: item.meaning,
    target: aslFiltered.join(''),
    aslSpelling: aslFiltered,
    timeLimit: TIME_LIMITS.complex,
    maxScore: SCORE_CONFIG.complex.correct,
    difficulty: DIFFICULTY_LEVELS.HARD
  };
};

// Sinh câu hỏi trắc nghiệm ảnh
export const generateQuizImageQuestion = () => {
  // Random loại: letter, vocabulary, hoặc sentence
  const quizType = Math.random();
  let question;
  let options = [];
  let correctAnswer;

  if (quizType < 0.33) {
    // Chữ cái
    const correctLetter = ASL_LETTERS[Math.floor(Math.random() * ASL_LETTERS.length)];
    const wrongLetters = ASL_LETTERS.filter(l => l !== correctLetter);
    const shuffledWrong = shuffleArray(wrongLetters).slice(0, 3);
    options = shuffleArray([correctLetter, ...shuffledWrong]);
    correctAnswer = correctLetter;
    question = {
      type: QUESTION_TYPES.QUIZ_IMAGE,
      subType: 'letter',
      image: getLetterImage(correctLetter),
      displayText: 'Đây là ký hiệu chữ gì?',
      options: options,
      correctAnswer: correctAnswer,
      timeLimit: TIME_LIMITS.quiz_image,
      maxScore: SCORE_CONFIG.quiz_image.correct,
      difficulty: DIFFICULTY_LEVELS.MEDIUM
    };
  } else if (quizType < 0.66) {
    // Từ vựng - hiển thị chuỗi ảnh
    const vocab = VOCABULARY_QUIZ_DATA[Math.floor(Math.random() * VOCABULARY_QUIZ_DATA.length)];
    const wrongVocab = shuffleArray(VOCABULARY_QUIZ_DATA.filter(v => v.word !== vocab.word)).slice(0, 3);
    options = shuffleArray([vocab.word, ...wrongVocab.map(v => v.word)]);
    correctAnswer = vocab.word;
    const aslFiltered = (vocab.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
    question = {
      type: QUESTION_TYPES.QUIZ_IMAGE,
      subType: 'vocabulary',
      aslSpelling: aslFiltered,
      displayText: 'Từ này có nghĩa là gì?',
      options: options,
      correctAnswer: correctAnswer,
      timeLimit: TIME_LIMITS.quiz_image,
      maxScore: SCORE_CONFIG.quiz_image.correct,
      difficulty: DIFFICULTY_LEVELS.MEDIUM
    };
  } else {
    // Câu giao tiếp
    const sentence = SENTENCE_QUIZ_DATA[Math.floor(Math.random() * SENTENCE_QUIZ_DATA.length)];
    const wrongSentences = shuffleArray(SENTENCE_QUIZ_DATA.filter(s => s.sentence !== sentence.sentence)).slice(0, 3);
    options = shuffleArray([sentence.meaning, ...wrongSentences.map(s => s.meaning)]);
    correctAnswer = sentence.meaning;
    const aslFiltered = (sentence.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
    question = {
      type: QUESTION_TYPES.QUIZ_IMAGE,
      subType: 'sentence',
      aslSpelling: aslFiltered,
      displayText: 'Câu giao tiếp này có nghĩa là gì?',
      options: options,
      correctAnswer: correctAnswer,
      timeLimit: TIME_LIMITS.quiz_image,
      maxScore: SCORE_CONFIG.quiz_image.correct,
      difficulty: DIFFICULTY_LEVELS.HARD
    };
  }

  return question;
};

// Sinh câu hỏi chuỗi ký hiệu liên tục
export const generateChainQuestion = () => {
  // Chọn 3-5 ký hiệu liên tiếp
  const chainLength = Math.floor(Math.random() * 3) + 3; // 3-5 ký hiệu
  const startIndex = Math.floor(Math.random() * (ASL_LETTERS.length - chainLength));
  const chainLetters = ASL_LETTERS.slice(startIndex, startIndex + chainLength);
  
  return {
    type: QUESTION_TYPES.CHAIN,
    displayText: `Thực hiện chuỗi: ${chainLetters.join(' → ')}`,
    target: chainLetters.join(''),
    aslSpelling: chainLetters,
    chainLength: chainLength,
    timeLimit: TIME_LIMITS.chain,
    maxScore: SCORE_CONFIG.chain.correct,
    difficulty: chainLength >= 5 ? DIFFICULTY_LEVELS.HARD : DIFFICULTY_LEVELS.MEDIUM
  };
};

// ========== HELPER: Lấy pool theo topic ==========
// Trả về pool từ ngắn/dài/phức tạp/quiz theo chủ đề (nếu có), fallback về toàn bộ
const getTopicShortWords = (topic) => {
  if (!topic) return SHORT_WORDS;
  const topicVocab = VOCABULARY_BY_TOPIC[topic] || [];
  const filtered = topicVocab.filter(v => (v.aslSpelling || []).length <= 2).map(v => ({
    word: v.word, meaning: v.meaning, aslSpelling: v.aslSpelling, type: 'short'
  }));
  return filtered.length >= 2 ? filtered : SHORT_WORDS;
};

const getTopicLongWords = (topic) => {
  if (!topic) return LONG_WORDS;
  const topicVocab = VOCABULARY_BY_TOPIC[topic] || [];
  const filtered = topicVocab.filter(v => (v.aslSpelling || []).length >= 3 && (v.aslSpelling || []).length <= 5).map(v => ({
    word: v.word, meaning: v.meaning, aslSpelling: v.aslSpelling, type: 'long'
  }));
  return filtered.length >= 2 ? filtered : LONG_WORDS;
};

const getTopicComplexItems = (topic) => {
  if (!topic) return [...COMPLEX_SENTENCES, ...COMMUNICATION_SENTENCES];
  const topicVocab = (VOCABULARY_BY_TOPIC[topic] || []).filter(v => (v.aslSpelling || []).length > 5).map(v => ({
    word: v.word, meaning: v.meaning, aslSpelling: v.aslSpelling, type: 'complex'
  }));
  const topicSentences = (SENTENCES_BY_TOPIC[topic] || []).map(s => ({
    word: s.sentence, meaning: s.meaning, aslSpelling: s.aslSpelling, type: 'sentence'
  }));
  const combined = [...topicVocab, ...topicSentences];
  return combined.length >= 2 ? combined : [...COMPLEX_SENTENCES, ...COMMUNICATION_SENTENCES];
};

const getTopicVocabPool = (topic) => {
  if (!topic) return VOCABULARY_QUIZ_DATA;
  const topicVocab = VOCABULARY_BY_TOPIC[topic] || [];
  return topicVocab.length >= 4 ? topicVocab : VOCABULARY_QUIZ_DATA;
};

const getTopicSentencePool = (topic) => {
  if (!topic) return SENTENCE_QUIZ_DATA;
  const topicSentences = (SENTENCES_BY_TOPIC[topic] || []).map(s => ({
    sentence: s.sentence, meaning: s.meaning, aslSpelling: s.aslSpelling
  }));
  return topicSentences.length >= 4 ? topicSentences : SENTENCE_QUIZ_DATA;
};

// Sinh bài kiểm tra tổng hợp - đảm bảo không trùng lặp
// configOrCount: số (mặc định 20) hoặc object { letterCount, shortWordCount, longWordCount, complexCount, quizCount, chainCount }
// options: { mode: 'random' | 'topic' | 'mixed_topic', topic: string }
//   - 'random': toàn bộ ngẫu nhiên (mặc định)
//   - 'topic': các phần có ngân hàng chủ đề → lấy theo topic (dùng cho word/sentence)
//   - 'mixed_topic': phần cố định (letter, chain) → random; phần có ngân hàng → theo topic (chỉ dành cho comprehensive)
export const generateComprehensiveTest = (configOrCount = 20, options = {}) => {
  const { mode = 'random', topic = null } = options;

  // Xác định pool theo mode
  const useTopicForFlexible = (mode === 'topic' || mode === 'mixed_topic') && !!topic;

  const questions = [];
  
  // Shuffle pool cho từng loại để đảm bảo ngẫu nhiên
  const letterPool = shuffleArray([...ASL_LETTERS]);
  const shortWordPool = shuffleArray(useTopicForFlexible ? getTopicShortWords(topic) : [...SHORT_WORDS]);
  const longWordPool = shuffleArray(useTopicForFlexible ? getTopicLongWords(topic) : [...LONG_WORDS]);
  const complexPool = shuffleArray(useTopicForFlexible ? getTopicComplexItems(topic) : [...COMPLEX_SENTENCES, ...COMMUNICATION_SENTENCES]);
  const vocabPool = shuffleArray(useTopicForFlexible ? getTopicVocabPool(topic) : [...VOCABULARY_QUIZ_DATA]);
  const sentencePool = shuffleArray(useTopicForFlexible ? getTopicSentencePool(topic) : [...SENTENCE_QUIZ_DATA]);
  
  // Chỉ mục hiện tại cho mỗi pool
  let letterIdx = 0;
  let shortIdx = 0;
  let longIdx = 0;
  let complexIdx = 0;
  let vocabIdx = 0;
  let sentenceIdx = 0;
  
  // Xác định phân bổ câu hỏi
  let types;
  if (typeof configOrCount === 'object' && configOrCount !== null) {
    // Nhận config từ giảng viên (bài kiểm tra)
    types = [
      { name: 'letter',    count: Math.max(0, parseInt(configOrCount.letterCount)    || 0) },
      { name: 'short_word',count: Math.max(0, parseInt(configOrCount.shortWordCount) || 0) },
      { name: 'long_word', count: Math.max(0, parseInt(configOrCount.longWordCount)  || 0) },
      { name: 'complex',   count: Math.max(0, parseInt(configOrCount.complexCount)   || 0) },
      { name: 'quiz_image',count: Math.max(0, parseInt(configOrCount.quizCount)      || 0) },
      { name: 'chain',     count: Math.max(0, parseInt(configOrCount.chainCount)     || 0) }
    ].filter(t => t.count > 0);
  } else {
    // Phân bổ mặc định (chức năng Tổng hợp tự do)
    types = [
      { name: 'letter',    count: 4 },
      { name: 'short_word',count: 3 },
      { name: 'long_word', count: 3 },
      { name: 'complex',   count: 3 },
      { name: 'quiz_image',count: 4 },
      { name: 'chain',     count: 3 }
    ];
  }
  
  let index = 0;
  
  types.forEach((type) => {
    for (let i = 0; i < type.count; i++) {
      let question;
      
      switch (type.name) {
        case 'letter': {
          // Lấy chữ cái từ pool đã shuffle, quay vòng nếu hết
          const letter = letterPool[letterIdx % letterPool.length];
          letterIdx++;
          question = {
            type: QUESTION_TYPES.LETTER,
            displayText: letter,
            target: letter,
            timeLimit: TIME_LIMITS.letter,
            maxScore: SCORE_CONFIG.letter.correct,
            difficulty: DIFFICULTY_LEVELS.EASY
          };
          break;
        }
        
        case 'short_word': {
          const word = shortWordPool[shortIdx % shortWordPool.length];
          shortIdx++;
          const aslFiltered = (word.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
          question = {
            type: QUESTION_TYPES.SHORT_WORD,
            displayText: word.word,
            meaning: word.meaning,
            target: aslFiltered.join(''),
            aslSpelling: aslFiltered,
            timeLimit: TIME_LIMITS.short_word,
            maxScore: SCORE_CONFIG.short_word.correct,
            difficulty: DIFFICULTY_LEVELS.EASY
          };
          break;
        }
        
        case 'long_word': {
          const word = longWordPool[longIdx % longWordPool.length];
          longIdx++;
          const aslFiltered = (word.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
          question = {
            type: QUESTION_TYPES.LONG_WORD,
            displayText: word.word,
            meaning: word.meaning,
            target: aslFiltered.join(''),
            aslSpelling: aslFiltered,
            timeLimit: TIME_LIMITS.long_word,
            maxScore: SCORE_CONFIG.long_word.correct,
            difficulty: DIFFICULTY_LEVELS.MEDIUM
          };
          break;
        }
        
        case 'complex': {
          const item = complexPool[complexIdx % complexPool.length];
          complexIdx++;
          const aslFiltered = (item.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
          question = {
            type: QUESTION_TYPES.COMPLEX,
            displayText: item.word,
            meaning: item.meaning,
            target: aslFiltered.join(''),
            aslSpelling: aslFiltered,
            timeLimit: TIME_LIMITS.complex,
            maxScore: SCORE_CONFIG.complex.correct,
            difficulty: DIFFICULTY_LEVELS.HARD
          };
          break;
        }
        
        case 'quiz_image': {
          // Quiz image gồm 3 loại con: letter, vocab, sentence
          const subType = i % 3;
          
          if (subType === 0) {
            // Chữ cái
            const correctLetter = letterPool[(letterIdx + 26) % letterPool.length];
            letterIdx++;
            const wrongLetters = ASL_LETTERS.filter(l => l !== correctLetter);
            const shuffledWrong = shuffleArray(wrongLetters).slice(0, 3);
            const options = shuffleArray([correctLetter, ...shuffledWrong]);
            
            question = {
              type: QUESTION_TYPES.QUIZ_IMAGE,
              subType: 'letter',
              image: getLetterImage(correctLetter),
              displayText: 'Đây là ký hiệu chữ gì?',
              options: options,
              correctAnswer: correctLetter,
              timeLimit: TIME_LIMITS.quiz_image,
              maxScore: SCORE_CONFIG.quiz_image.correct,
              difficulty: DIFFICULTY_LEVELS.MEDIUM
            };
          } else if (subType === 1) {
            // Từ vựng - hiển thị ký hiệu ASL, đoán từ tiếng Anh
            const vocab = vocabPool[vocabIdx % vocabPool.length];
            vocabIdx++;
            const wrongVocab = shuffleArray(VOCABULARY_QUIZ_DATA.filter(v => v.word !== vocab.word)).slice(0, 3);
            // Đáp án là từ tiếng Anh
            const options = shuffleArray([vocab.word, ...wrongVocab.map(v => v.word)]);
            const aslFiltered = (vocab.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
            
            question = {
              type: QUESTION_TYPES.QUIZ_IMAGE,
              subType: 'vocabulary',
              aslSpelling: aslFiltered,
              displayText: vocab.word, // Dùng để kiểm tra đáp án
              questionText: 'Từ này là gì?',
              options: options,
              correctAnswer: vocab.word,
              timeLimit: TIME_LIMITS.quiz_image,
              maxScore: SCORE_CONFIG.quiz_image.correct,
              difficulty: DIFFICULTY_LEVELS.MEDIUM
            };
          } else {
            // Câu giao tiếp - hiển thị ký hiệu ASL, đoán câu tiếng Anh
            const sentence = sentencePool[sentenceIdx % sentencePool.length];
            sentenceIdx++;
            const wrongSentences = shuffleArray(SENTENCE_QUIZ_DATA.filter(s => s.sentence !== sentence.sentence)).slice(0, 3);
            // Đáp án là câu tiếng Anh
            const options = shuffleArray([sentence.sentence, ...wrongSentences.map(s => s.sentence)]);
            const aslFiltered = (sentence.aslSpelling || []).filter(ch => ch !== null && ch !== undefined && String(ch).trim() !== '');
            
            question = {
              type: QUESTION_TYPES.QUIZ_IMAGE,
              subType: 'sentence',
              aslSpelling: aslFiltered,
              displayText: sentence.sentence,
              questionText: 'Câu này là gì?',
              options: options,
              correctAnswer: sentence.sentence,
              timeLimit: TIME_LIMITS.quiz_image,
              maxScore: SCORE_CONFIG.quiz_image.correct,
              difficulty: DIFFICULTY_LEVELS.HARD
            };
          }
          break;
        }
        
        case 'chain': {
          // Chuỗi ký hiệu liên tục 3-5 ký tự
          const chainLength = 3 + (i % 3); // 3, 4, hoặc 5
          const maxStart = ASL_LETTERS.length - chainLength;
          const startIndex = Math.floor(Math.random() * maxStart);
          const chainLetters = ASL_LETTERS.slice(startIndex, startIndex + chainLength);
          
          question = {
            type: QUESTION_TYPES.CHAIN,
            displayText: `Thực hiện chuỗi: ${chainLetters.join(' → ')}`,
            target: chainLetters.join(''),
            aslSpelling: chainLetters,
            chainLength: chainLength,
            timeLimit: TIME_LIMITS.chain,
            maxScore: SCORE_CONFIG.chain.correct,
            difficulty: chainLength >= 5 ? DIFFICULTY_LEVELS.HARD : DIFFICULTY_LEVELS.MEDIUM
          };
          break;
        }
      }
      
      question.id = index + 1;
      questions.push(question);
      index++;
    }
  });

  // Shuffle toàn bộ câu hỏi để random thứ tự
  return shuffleArray(questions);
};

// Tính điểm cho câu trả lời thực hiện ký hiệu
export const calculateSignScore = (question, detectedLetters, timeSpent) => {
  const target = question.target.split('');
  const detected = (detectedLetters || []).map(item => {
    if (typeof item === 'string') return item?.toString().trim().toUpperCase();
    return item?.letter?.toString().trim().toUpperCase() || '';
  });
  
  let correctPositions = 0;
  
  target.forEach((char, index) => {
    if (detected[index] === char) {
      correctPositions++;
    }
  });

  const totalSigns = target.length;
  const accuracy = totalSigns > 0 ? (correctPositions / totalSigns) * 100 : 0;
  const isCorrect = accuracy >= 100;

  // Điểm: đúng = 1, sai = 0 (điểm thực tế tính theo thang 100 ở calculateFinalResult)
  const baseScore = isCorrect ? 1 : 0;
  const totalScore = baseScore;

  return {
    correctCount: correctPositions,
    totalSigns,
    accuracy: Math.round(accuracy),
    baseScore,
    timeBonus: 0,
    totalScore,
    status: isCorrect ? 'correct' : 'wrong',
    isCorrect,
    timeSpent: Math.round(timeSpent * 10) / 10
  };
};

// Tính điểm cho câu trắc nghiệm
export const calculateQuizScore = (question, selectedAnswer, timeSpent) => {
  const isCorrect = selectedAnswer === question.correctAnswer;

  // Điểm: đúng = 1, sai = 0 (điểm thực tế tính theo thang 100 ở calculateFinalResult)
  const baseScore = isCorrect ? 1 : 0;

  return {
    isCorrect,
    selectedAnswer,
    correctAnswer: question.correctAnswer,
    baseScore,
    timeBonus: 0,
    totalScore: baseScore,
    status: isCorrect ? 'correct' : 'wrong',
    timeSpent: Math.round(timeSpent * 10) / 10
  };
};

// Tính kết quả tổng kết bài kiểm tra
export const calculateFinalResult = (answers) => {
  const totalQuestions = answers.length;
  
  // Đếm số câu đúng
  const correctAnswers = answers.filter(a => a.result?.isCorrect === true).length;
  const wrongAnswers = totalQuestions - correctAnswers;
  
  // Thang 100 điểm: mỗi câu đều bằng nhau
  const scorePerQuestion = totalQuestions > 0 ? 100 / totalQuestions : 0;
  const totalScore = Math.round(correctAnswers * scorePerQuestion);
  const percentage = totalScore; // = % câu đúng * 100 / tổng = totalScore
  
  // Thời gian trung bình
  const avgTime = totalQuestions > 0
    ? answers.reduce((sum, a) => sum + (a.result?.timeSpent || 0), 0) / totalQuestions
    : 0;
  
  // Chuỗi ký hiệu hoàn thành
  const chainsCompleted = answers.filter(a => a.question?.type === QUESTION_TYPES.CHAIN && a.result?.isCorrect === true).length;
  const totalChains = answers.filter(a => a.question?.type === QUESTION_TYPES.CHAIN).length;
  
  const gradeInfo = getGrade(percentage);

  return {
    totalQuestions,
    correctAnswers,
    wrongAnswers,
    totalScore,           // điểm /100
    maxBaseScore: 100,    // luôn là 100
    correctPercentage: percentage,
    scorePercentage: percentage,
    percentage,           // dùng để xếp loại
    avgAccuracy: percentage,
    avgResponseTime: Math.round(avgTime * 10) / 10,
    chainsCompleted,
    totalChains,
    grade: gradeInfo.grade,
    gradeEmoji: gradeInfo.emoji,
    gradeColor: gradeInfo.color,
    answers: answers
  };
};

// ========== 10. MESSAGES ==========
export const QUESTION_MESSAGES = {
  [QUESTION_TYPES.LETTER]: (target) => `Hãy thực hiện ký hiệu: ${target}`,
  [QUESTION_TYPES.SHORT_WORD]: (word) => `Hãy thực hiện ký hiệu: ${word}`,
  [QUESTION_TYPES.LONG_WORD]: (word) => `Hãy thực hiện ký hiệu: ${word}`,
  [QUESTION_TYPES.COMPLEX]: (word) => `Hãy thực hiện chuỗi ký hiệu: ${word}`,
  [QUESTION_TYPES.QUIZ_IMAGE]: 'Hãy chọn đáp án đúng',
  [QUESTION_TYPES.CHAIN]: (letters) => `Thực hiện liên tục: ${letters.join(' → ')}`
};

export const FEEDBACK_MESSAGES = {
  perfect: 'Xuất sắc! Hoàn hảo!',
  excellent: 'Rất tốt! Gần như hoàn hảo!',
  good: 'Tốt lắm! Tiếp tục phát huy!',
  fair: 'Khá tốt! Cần cải thiện thêm!',
  poor: 'Chưa đúng lắm. Hãy thử lại!',
  wrong: 'Sai rồi. Hãy xem hướng dẫn!'
};

export default {
  ASL_LETTERS,
  QUESTION_TYPES,
  TIME_LIMITS,
  SCORE_CONFIG,
  generateLetterQuestion,
  generateShortWordQuestion,
  generateLongWordQuestion,
  generateComplexQuestion,
  generateQuizImageQuestion,
  generateChainQuestion,
  generateComprehensiveTest,
  calculateSignScore,
  calculateQuizScore,
  calculateFinalResult,
  getGrade
};
