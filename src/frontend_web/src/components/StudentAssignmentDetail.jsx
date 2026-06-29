import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from './Layout';
import ASLQuiz from './ASLQuiz';
import PracticePage from './PracticePage';
import { useLanguage } from '../contexts/LanguageContext';
import { toast } from 'react-hot-toast';
import { useAssignment } from '../contexts/AssignmentContext';
import ErrorBoundary from './ErrorBoundary';

const StudentAssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState(null);
  const [canSubmit, setCanSubmit] = useState(true);
  const [attemptCount, setAttemptCount] = useState(0);
  const [maxAttempts, setMaxAttempts] = useState(null);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [bestScore, setBestScore] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const [hasCheckedAttempts, setHasCheckedAttempts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const assignmentCtx = useAssignment();

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login');
      return;
    }
    fetchAssignment();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchAssignment = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/student/assignments/${id}`, {
        method: 'GET',
        cache: 'no-store',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAssignment(data.assignment || data);
        setCanSubmit(data.canSubmit !== undefined ? data.canSubmit : true);
        setAttemptCount(data.attemptCount || 0);
        setBestScore(data.bestScore ?? null);
        setIsCompleted(data.isCompleted || false);
        setIsFailed(data.isFailed || false);
        setMaxAttempts(data.maxAttempts ?? null);
        setRemainingAttempts(data.remainingAttempts ?? null);
        setHasCheckedAttempts(true);
      } else {
        toast.error(data.message || t('studentAssignments.notFound'));
        navigate('/my-assignments');
      }
    } catch (err) {
      console.error('Fetch assignment error:', err);
      toast.error(t('studentAssignments.serverError'));
      navigate('/my-assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (assignment && assignment.practiceType === 'recognition' && canSubmit) {
      try { if (assignmentCtx && assignmentCtx.lock) assignmentCtx.lock(id); } catch (e) {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment, canSubmit]);

  // Redirect to practice-assignment when assignment is loaded and is realtime
  useEffect(() => {
    if (assignment && assignment.practiceType === 'realtime') {
      navigate(`/practice?assignmentId=${id}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignment]);

  const handleAssignmentComplete = async (result) => {
    // Prevent multiple submissions
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const payload = {
        answers: result.answers || [],
        // Dùng kiểm tra null/undefined thay vì || để tránh bỏ qua score = 0
        score: (result.score !== undefined && result.score !== null) ? result.score : (result.accuracy || 0),
        accuracy: (result.accuracy !== undefined && result.accuracy !== null) ? result.accuracy : 0,
        timeSpent: result.timeSpent || 0,
        total: result.total || 0,
        correctCount: result.correctCount || 0
      };

      const res = await fetch(`http://localhost:5000/api/student/assignments/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      // Parse response body robustly (may not be JSON on 500)
      let data = {};
      try {
        const text = await res.text();
        try { data = JSON.parse(text); } catch { data = { message: text }; }
      } catch (e) { data = {}; }

      if (res.ok) {
        toast.success(t('studentAssignments.resultsSaved'));

        // Cập nhật state trực tiếp từ response — KHÔNG gọi fetchAssignment()
        // vì fetchAssignment() sẽ reset canSubmit → kích hoạt lại quiz auto-start
        if (data.attemptCount !== undefined) setAttemptCount(data.attemptCount);
        if (data.remainingAttempts !== undefined) setRemainingAttempts(data.remainingAttempts);
        if (data.bestScore !== undefined) setBestScore(data.bestScore);
        if (data.isCompleted !== undefined) setIsCompleted(data.isCompleted);
        if (data.isFailed !== undefined) setIsFailed(data.isFailed);
        // canSubmit: false khi hết lượt hoặc hết hạn, true khi còn lượt (vô hạn luôn true)
        if (data.canSubmit !== undefined) setCanSubmit(data.canSubmit);
        // notify assignments list to refresh
        try { window.dispatchEvent(new Event('assignmentsUpdated')); } catch (e) { /* ignore */ }

      } else {
        // Hết lượt — không còn được nộp, nhưng vẫn cho xem kết quả
        if (data.message && (
          data.message.includes('hết số lần') ||
          data.message.includes('hết lần') ||
          data.message.includes('max attempts') ||
          data.message.includes('exceeded')
        )) {
          toast.error(data.message || t('studentAssignments.maxAttemptsReached'));
          setCanSubmit(false);
          try { window.dispatchEvent(new Event('assignmentsUpdated')); } catch (e) {}
        } else {
          toast.error(data.message || t('studentAssignments.saveFailed'));
        }
      }
    } catch (err) {
      console.error('Submit error:', err);
      toast.error(t('studentAssignments.submitError'));
    } finally {
      setIsSubmitting(false);
      // Luôn giải phóng lock, KHÔNG navigate — để user xem kết quả trên trang
      try { if (assignmentCtx && assignmentCtx.release) assignmentCtx.release(); } catch (e) {
        console.warn('release error', e);
      }
    }
  };

  if (loading) return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
      </div>
    </Layout>
  );

  if (!assignment) return null;

  // Decide which UI to render
  if (assignment.practiceType === 'recognition') {
    let presetType = 'letter';
    if (assignment.type === 'word') presetType = 'word';
    if (assignment.type === 'sentence') presetType = 'sentence';
    const questionCount = assignment.settings?.questionCount || 10;

    return (
      <ASLQuiz
        assignmentContext={{
          presetType,
          questionCount,
          assignmentId: id,
          examMode: assignment.mode || 'random',
          examTopic: assignment.topic || null
        }}
        onAssignmentComplete={handleAssignmentComplete}
        canSubmit={canSubmit}
        attemptCount={attemptCount}
        maxAttempts={maxAttempts}
        remainingAttempts={remainingAttempts}
        bestScore={bestScore}
        isCompleted={isCompleted}
      />
    );
  }

  // For realtime practice, redirect handled by useEffect above
  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 text-center">
        <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-blue-700">{t('studentAssignmentDetail.loading')}</p>
      </div>
    </Layout>
  );
};

export default StudentAssignmentDetail;
