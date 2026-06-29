import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import ASLQuiz from './ASLQuiz';
import PracticePage from './PracticePage';
import ExamComprehensivePage from './ExamComprehensivePage';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import ErrorBoundary from './ErrorBoundary';

const StudentExamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [exam, setExam] = useState(null);
  const [canSubmit, setCanSubmit] = useState(false);
  const [attemptCount, setAttemptCount] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(1);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [bestScore, setBestScore] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOverdue, setIsOverdue] = useState(false);
  const [notStarted, setNotStarted] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem('token')) { navigate('/login'); return; }
    fetchExam();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/student/exams/${id}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setExam(data.exam || data);
        setCanSubmit(data.canSubmit !== undefined ? data.canSubmit : false);
        setAttemptCount(data.attemptCount || 0);
        setBestScore(data.bestScore ?? null);
        setIsCompleted(data.isCompleted || false);
        setMaxAttempts(data.maxAttempts ?? 1);
        setRemainingAttempts(data.remainingAttempts ?? null);
        setIsOverdue(data.isOverdue || false);
        setNotStarted(data.notStarted || false);
      } else {
        toast.error(data.message || t('studentExamDetail.examNotFound'));
        navigate('/student/exams');
      }
    } catch (err) {
      console.error('Fetch exam error:', err);
      toast.error(t('studentExamDetail.serverError'));
      navigate('/student/exams');
    } finally {
      setLoading(false);
    }
  };

  // Redirect realtime sang PracticePage
  useEffect(() => {
    if (exam && exam.practiceType === 'realtime') {
      navigate(`/practice?examId=${id}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exam]);

  const handleExamComplete = async (result) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        answers: result.answers || [],
        score: result.score !== undefined && result.score !== null ? result.score : (result.accuracy || 0),
        accuracy: result.accuracy !== undefined && result.accuracy !== null ? result.accuracy : 0,
        timeSpent: result.timeSpent || 0,
        total: result.total || 0,
        correctCount: result.correctCount || 0
      };

      const res = await fetch(`http://localhost:5000/api/student/exams/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      let data = {};
      try {
        const text = await res.text();
        try { data = JSON.parse(text); } catch { data = { message: text }; }
      } catch (e) { data = {}; }

      if (res.ok) {
        toast.success(t('studentExamDetail.resultsSaved'));
        if (data.attemptCount !== undefined) setAttemptCount(data.attemptCount);
        if (data.remainingAttempts !== undefined) setRemainingAttempts(data.remainingAttempts);
        if (data.bestScore !== undefined) setBestScore(data.bestScore);
        if (data.isCompleted !== undefined) setIsCompleted(data.isCompleted);
        if (data.canSubmit !== undefined) setCanSubmit(data.canSubmit);
        try { window.dispatchEvent(new Event('examsUpdated')); } catch (e) {}
      } else {
        if (data.message && (data.message.includes('hết số lần') || data.message.includes('max attempts'))) {
          toast.error(data.message);
          setCanSubmit(false);
        } else {
          toast.error(data.message || t('studentExamDetail.saveFailed'));
        }
      }
    } catch (err) {
      console.error('Submit exam error:', err);
      toast.error(t('studentExamDetail.submitError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 flex items-center justify-center min-h-[300px]">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    </Layout>
  );

  if (!exam) return null;

  // Hình thức: recognition → ASLQuiz
  if (exam.practiceType === 'recognition') {
    let presetType = 'letter';
    if (exam.type === 'word') presetType = 'word';
    if (exam.type === 'sentence') presetType = 'sentence';
    const questionCount = exam.settings?.questionCount || 10;

    return (
      <ErrorBoundary>
        <ASLQuiz
          assignmentContext={{
            presetType,
            questionCount,
            assignmentId: id,
            isExam: true,
            examMode: exam.mode || 'random',
            examTopic: exam.topic || null
          }}
          onAssignmentComplete={handleExamComplete}
          canSubmit={canSubmit}
          attemptCount={attemptCount}
          maxAttempts={maxAttempts}
          remainingAttempts={remainingAttempts}
          bestScore={bestScore}
          isCompleted={isCompleted}
        />
      </ErrorBoundary>
    );
  }

  // Hình thức: comprehensive → ExamComprehensivePage (fullscreen, không Layout)
  if (exam.practiceType === 'comprehensive') {
    return (
      <ErrorBoundary>
        <ExamComprehensivePage
          examConfig={exam.examConfig}
          examMode={exam.mode || 'random'}
          examTopic={exam.topic || ''}
          examId={id}
          onComplete={handleExamComplete}
          canSubmit={canSubmit}
          bestScore={bestScore}
          attemptCount={attemptCount}
          maxAttempts={maxAttempts}
          remainingAttempts={remainingAttempts}
        />
      </ErrorBoundary>
    );
  }

  // Realtime: redirect handled by useEffect
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-purple-700">{t('studentExamDetail.loading')}</p>
      </div>
    </Layout>
  );
};

export default StudentExamDetail;
