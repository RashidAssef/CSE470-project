import { useState, useEffect } from 'react';
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  RotateCcw,
  HelpCircle,
  Loader2,
  AlertCircle,
  Clock,
  Calendar,
  Check,
  BookOpen,
} from 'lucide-react';
import { quizService } from '../services/api.js';

export default function QuizResultModal({
  isOpen,
  onClose,
  attemptId,
  initialResult = null,
  onRetake,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewData, setReviewData] = useState(null);

  useEffect(() => {
    if (isOpen && attemptId) {
      loadReview();
    }
  }, [isOpen, attemptId]);

  const loadReview = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await quizService.getAttemptReview(attemptId);
      setReviewData(data);
    } catch (err) {
      setError(err.message || 'Failed to load attempt review');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const data = reviewData || initialResult;
  const percentage = data?.percentage !== undefined ? data.percentage : 0;
  const passed = data?.passed || false;
  const score = data?.score || 0;
  const totalPoints = data?.totalPoints || 0;
  const questions = reviewData?.questions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto font-body text-ink">
      <div className="bg-paper-alt border border-line rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-paper-alt">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${
                passed
                  ? 'bg-teal/10 text-teal'
                  : 'bg-amber/10 text-amber'
              }`}
            >
              <Award size={20} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                Assessment Results & Detailed Review
              </h3>
              <p className="text-xs text-slate">{data?.quiz?.title || 'Quiz Review'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate hover:text-ink rounded-xl hover:bg-paper transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Banner Score Card */}
          <div
            className={`rounded-2xl p-6 border flex flex-col md:flex-row items-center justify-between gap-6 ${
              passed
                ? 'bg-teal/5 border-teal/30'
                : 'bg-amber/5 border-amber/30'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 ${
                  passed
                    ? 'bg-teal text-white shadow-lg shadow-teal/20'
                    : 'bg-amber text-white shadow-lg shadow-amber/20'
                }`}
              >
                {passed ? <CheckCircle2 size={32} /> : <XCircle size={32} />}
              </div>
              <div>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider mb-1 ${
                    passed
                      ? 'bg-teal/10 text-teal'
                      : 'bg-amber/10 text-amber-dark'
                  }`}
                >
                  {passed ? 'Passed Assessment' : 'Needs Improvement'}
                </span>
                <h4 className="font-display text-xl font-bold text-ink">
                  {passed ? 'Outstanding Work!' : 'Good Effort! Keep practicing.'}
                </h4>
                <p className="text-xs text-slate mt-0.5">
                  Passing mark required: {data?.quiz?.passingScore || 70}%
                </p>
              </div>
            </div>

            {/* Score Pill and Stats */}
            <div className="flex items-center gap-3">
              <div className="text-center px-4 py-2 bg-paper-alt rounded-2xl border border-line shadow-xs">
                <span className="text-[10px] font-bold text-slate uppercase tracking-wider">
                  Score
                </span>
                <p className="font-display text-2xl font-bold text-primary">{percentage}%</p>
              </div>
              <div className="text-center px-4 py-2 bg-paper-alt rounded-2xl border border-line shadow-xs">
                <span className="text-[10px] font-bold text-slate uppercase tracking-wider">
                  Points
                </span>
                <p className="font-display text-2xl font-bold text-ink">
                  {score}/{totalPoints}
                </p>
              </div>
              {data?.timeSpentSeconds !== undefined && (
                <div className="text-center px-4 py-2 bg-paper-alt rounded-2xl border border-line shadow-xs">
                  <span className="text-[10px] font-bold text-slate uppercase tracking-wider">
                    Time
                  </span>
                  <p className="font-display text-sm font-bold text-ink mt-1">
                    {Math.floor(data.timeSpentSeconds / 60)}m {data.timeSpentSeconds % 60}s
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Question-by-Question Breakdown */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate">
              <Loader2 size={32} className="animate-spin text-primary mb-2" />
              <p className="text-xs">Loading question breakdown & explanations...</p>
            </div>
          ) : questions.length > 0 ? (
            <div className="space-y-4">
              <h4 className="font-display text-sm font-bold text-ink flex items-center gap-2">
                <BookOpen size={16} className="text-primary" />
                <span>Question Breakdown & Explanations</span>
              </h4>

              <div className="space-y-4">
                {questions.map((q, idx) => (
                  <div
                    key={idx}
                    className={`p-5 rounded-2xl border transition ${
                      q.isCorrect
                        ? 'bg-teal/5 border-teal/20'
                        : 'bg-red-50/50 border-red-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-start gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                            q.isCorrect ? 'bg-teal text-white' : 'bg-red-500 text-white'
                          }`}
                        >
                          {idx + 1}
                        </span>
                        <h5 className="font-display text-sm font-bold text-ink">
                          {q.questionText}
                        </h5>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                            q.isCorrect
                              ? 'bg-teal/10 text-teal'
                              : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {q.pointsAwarded} / {q.maxPoints} pts
                        </span>
                      </div>
                    </div>

                    {/* Options list */}
                    {(q.questionType === 'multiple_choice' ||
                      q.questionType === 'multiple_response' ||
                      q.questionType === 'true_false') && (
                      <div className="space-y-1.5 ml-8 mt-2">
                        {q.options.map((opt, optIdx) => {
                          const isStudentSelection = (q.selectedOptions || []).includes(optIdx);
                          const isCorrectOption = (q.correctAnswers || []).includes(optIdx);

                          let badgeStyle =
                            'border-line bg-paper-alt text-ink-soft';
                          if (isCorrectOption) {
                            badgeStyle =
                              'border-teal bg-teal/10 text-teal font-semibold';
                          } else if (isStudentSelection && !isCorrectOption) {
                            badgeStyle =
                              'border-red-300 bg-red-50 text-red-700 line-through font-semibold';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${badgeStyle}`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 font-bold">
                                  {String.fromCharCode(65 + optIdx)}
                                </span>
                                <span>{opt}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {isStudentSelection && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-paper border border-line text-ink font-medium">
                                    Your Answer
                                  </span>
                                )}
                                {isCorrectOption && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal text-white font-bold flex items-center gap-1">
                                    <Check size={12} />
                                    <span>Correct Choice</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Short answer review */}
                    {q.questionType === 'short_answer' && (
                      <div className="ml-8 mt-2 space-y-1.5 text-xs">
                        <div className="p-3 bg-paper-alt border border-line rounded-xl">
                          <span className="font-semibold text-slate">Your Answer: </span>
                          <span
                            className={
                              q.isCorrect
                                ? 'text-teal font-bold'
                                : 'text-red-600 font-bold'
                            }
                          >
                            {q.textAnswer || '(Blank)'}
                          </span>
                        </div>
                        {q.correctAnswers && (
                          <div className="p-3 bg-teal/10 border border-teal/20 rounded-xl text-teal">
                            <span className="font-semibold">Correct Answer: </span>
                            <span className="font-bold">{q.correctAnswers[0]}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="ml-8 mt-3 p-3 bg-primary-light/60 border border-primary/20 rounded-xl text-xs text-ink flex items-start gap-2">
                        <HelpCircle size={16} className="text-primary shrink-0 mt-0.5" />
                        <div>
                          <strong className="block mb-0.5 text-primary-dark">
                            Instructor Explanation:
                          </strong>
                          <span>{q.explanation}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-line bg-paper-alt">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-ink-soft border border-line hover:bg-paper rounded-xl transition"
          >
            Close Review
          </button>

          {onRetake && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRetake();
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md shadow-primary/20 transition"
            >
              <RotateCcw size={14} />
              <span>Retake Quiz</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
