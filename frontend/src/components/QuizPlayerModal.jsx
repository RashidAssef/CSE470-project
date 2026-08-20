import { useState, useEffect, useRef } from 'react';
import {
  X,
  Clock,
  Award,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Loader2,
  Send,
} from 'lucide-react';
import { quizService } from '../services/api.js';

export default function QuizPlayerModal({ isOpen, onClose, quizId, onQuizCompleted }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const [answers, setAnswers] = useState({});
  const [secondsRemaining, setSecondsRemaining] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    if (isOpen && quizId) {
      loadQuiz();
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, quizId]);

  const loadQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await quizService.getQuizById(quizId);
      setQuiz(data);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setStartTime(Date.now());

      if (data.timeLimit && data.timeLimit > 0) {
        const totalSeconds = data.timeLimit * 60;
        setSecondsRemaining(totalSeconds);

        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setSecondsRemaining((prev) => {
            if (prev === null) return null;
            if (prev <= 1) {
              clearInterval(timerRef.current);
              handleAutoSubmit();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setSecondsRemaining(null);
      }
    } catch (err) {
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoSubmit = () => {
    alert('Time limit reached! Your quiz is now being submitted automatically.');
    performSubmission();
  };

  const handleSelectOption = (questionId, optionIndex, isMulti) => {
    setAnswers((prev) => {
      const current = prev[questionId] || { selectedOptions: [], textAnswer: '' };
      let updatedOptions = [];

      if (isMulti) {
        const exists = current.selectedOptions.includes(optionIndex);
        if (exists) {
          updatedOptions = current.selectedOptions.filter((i) => i !== optionIndex);
        } else {
          updatedOptions = [...current.selectedOptions, optionIndex].sort((a, b) => a - b);
        }
      } else {
        updatedOptions = [optionIndex];
      }

      return {
        ...prev,
        [questionId]: {
          ...current,
          selectedOptions: updatedOptions,
        },
      };
    });
  };

  const handleTextAnswerChange = (questionId, text) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        selectedOptions: [],
        textAnswer: text,
      },
    }));
  };

  const performSubmission = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError('');

    try {
      const timeSpentSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

      const formattedAnswers = Object.entries(answers).map(([qId, ans]) => ({
        questionId: qId,
        selectedOptions: ans.selectedOptions || [],
        textAnswer: ans.textAnswer || '',
      }));

      const result = await quizService.submitQuizAttempt(quizId, {
        answers: formattedAnswers,
        timeSpentSeconds,
      });

      if (timerRef.current) clearInterval(timerRef.current);
      onClose();
      onQuizCompleted(result);
    } catch (err) {
      setError(err.message || 'Failed to submit quiz attempt.');
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const questions = quiz?.questions || [];
  const currentQ = questions[currentQuestionIndex];

  const formatTimer = (totalSecs) => {
    if (totalSecs === null) return null;
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const answeredCount = Object.values(answers).filter(
    (a) =>
      (a.selectedOptions && a.selectedOptions.length > 0) ||
      (a.textAnswer && a.textAnswer.trim().length > 0)
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto font-body text-ink">
      <div className="bg-paper-alt border border-line rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-paper-alt">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary font-bold">
              <Award size={20} />
            </span>
            <div>
              <h3 className="font-display text-base font-bold text-ink">
                {quiz?.title || 'Assessment'}
              </h3>
              <p className="text-xs text-slate">
                Passing Mark: {quiz?.passingScore}% • Total Points: {quiz?.totalPoints}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {secondsRemaining !== null && (
              <div
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold border transition ${
                  secondsRemaining < 120
                    ? 'bg-red-50 text-red-600 border-red-200 animate-pulse'
                    : 'bg-primary-light text-primary border-primary/20'
                }`}
              >
                <Clock size={16} />
                <span>{formatTimer(secondsRemaining)}</span>
              </div>
            )}

            <button
              onClick={() => {
                if (
                  answeredCount > 0 &&
                  !window.confirm(
                    'Are you sure you want to exit the quiz? Unsaved responses will be lost.'
                  )
                ) {
                  return;
                }
                onClose();
              }}
              className="p-2 text-slate hover:text-ink rounded-xl hover:bg-paper transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate">
              <Loader2 size={32} className="animate-spin text-primary mb-3" />
              <p className="text-sm">Preparing assessment questions...</p>
            </div>
          ) : currentQ ? (
            <div className="space-y-6">
              {/* Question Navigation Bar / Progress Pills */}
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <span className="text-xs font-bold text-slate uppercase tracking-wider">
                  Question {currentQuestionIndex + 1} of {questions.length}
                </span>

                <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%] py-1 no-scrollbar">
                  {questions.map((q, idx) => {
                    const isAnswered =
                      (answers[q._id]?.selectedOptions &&
                        answers[q._id].selectedOptions.length > 0) ||
                      (answers[q._id]?.textAnswer &&
                        answers[q._id].textAnswer.trim().length > 0);
                    const isCurrent = currentQuestionIndex === idx;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setCurrentQuestionIndex(idx)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                          isCurrent
                            ? 'bg-primary text-white shadow-sm'
                            : isAnswered
                            ? 'bg-teal/15 text-teal border border-teal/30'
                            : 'bg-paper text-slate hover:bg-paper/80 border border-line'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Card */}
              <div className="bg-paper border border-line rounded-2xl p-6 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <h4 className="font-display text-lg font-bold text-ink leading-relaxed">
                    {currentQ.questionText}
                  </h4>
                  <span className="text-xs font-bold px-2.5 py-1 bg-paper-alt text-primary border border-line rounded-xl shrink-0">
                    {currentQ.points || 1} {currentQ.points === 1 ? 'pt' : 'pts'}
                  </span>
                </div>

                {/* Multiple Choice / Multiple Response */}
                {(currentQ.questionType === 'multiple_choice' ||
                  currentQ.questionType === 'multiple_response') && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate italic">
                      {currentQ.questionType === 'multiple_response'
                        ? 'Select all applicable options (Multiple answers):'
                        : 'Select the best answer:'}
                    </p>

                    <div className="space-y-2.5">
                      {currentQ.options.map((opt, optIdx) => {
                        const isMulti = currentQ.questionType === 'multiple_response';
                        const isSelected =
                          answers[currentQ._id]?.selectedOptions?.includes(optIdx) || false;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(currentQ._id, optIdx, isMulti)}
                            className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition flex items-center gap-3.5 ${
                              isSelected
                                ? 'bg-primary-light border-primary text-ink shadow-sm'
                                : 'bg-paper-alt border-line hover:border-primary/40 text-ink'
                            }`}
                          >
                            <div
                              className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition ${
                                isMulti ? 'rounded-md' : 'rounded-full'
                              } ${
                                isSelected
                                  ? 'bg-primary text-white'
                                  : 'border-2 border-slate/40'
                              }`}
                            >
                              {isSelected && <CheckCircle2 size={14} />}
                            </div>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* True / False */}
                {currentQ.questionType === 'true_false' && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate italic">Select True or False:</p>
                    <div className="grid grid-cols-2 gap-4">
                      {['True', 'False'].map((val, optIdx) => {
                        const isSelected =
                          answers[currentQ._id]?.selectedOptions?.includes(optIdx) || false;

                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleSelectOption(currentQ._id, optIdx, false)}
                            className={`py-4 px-6 rounded-2xl border text-center font-bold text-base transition flex items-center justify-center gap-2 ${
                              isSelected
                                ? 'bg-primary text-white border-primary shadow-md shadow-primary/25'
                                : 'bg-paper-alt border-line text-ink hover:border-slate'
                            }`}
                          >
                            <span>{val}</span>
                            {isSelected && <CheckCircle2 size={16} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Short Answer */}
                {currentQ.questionType === 'short_answer' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-semibold text-ink-soft">
                      Type your answer below:
                    </label>
                    <input
                      type="text"
                      placeholder="Type your response..."
                      value={answers[currentQ._id]?.textAnswer || ''}
                      onChange={(e) => handleTextAnswerChange(currentQ._id, e.target.value)}
                      className="w-full px-4 py-3 text-sm bg-paper-alt border border-line rounded-xl text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                )}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-ink-soft bg-paper border border-line hover:bg-paper-alt disabled:opacity-40 rounded-xl transition"
                >
                  <ChevronLeft size={16} />
                  <span>Previous</span>
                </button>

                {currentQuestionIndex < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentQuestionIndex((prev) => Math.min(questions.length - 1, prev + 1))
                    }
                    className="inline-flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md shadow-primary/20 transition"
                  >
                    <span>Next Question</span>
                    <ChevronRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowConfirmSubmit(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-teal hover:bg-teal/90 rounded-xl shadow-md shadow-teal/20 transition"
                  >
                    <Send size={16} />
                    <span>Finish & Submit</span>
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer info bar */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-line bg-paper text-xs text-slate">
          <span>
            Answered: <strong className="text-ink">{answeredCount}</strong> of{' '}
            <strong className="text-ink">{questions.length}</strong> questions
          </span>
          {currentQuestionIndex < questions.length - 1 && (
            <button
              type="button"
              onClick={() => setShowConfirmSubmit(true)}
              className="text-xs font-semibold text-primary hover:underline"
            >
              Submit Early
            </button>
          )}
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showConfirmSubmit && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4">
          <div className="bg-paper-alt border border-line rounded-2xl shadow-2xl p-6 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-primary-light text-primary flex items-center justify-center font-bold mx-auto">
              <Send size={24} />
            </div>

            <div className="text-center space-y-1">
              <h4 className="font-display text-lg font-bold text-ink">Submit Assessment?</h4>
              <p className="text-xs text-slate">
                You have answered <strong>{answeredCount}</strong> of{' '}
                <strong>{questions.length}</strong> questions.
                {answeredCount < questions.length && (
                  <span className="text-amber block mt-1 font-semibold">
                    Warning: You still have {questions.length - answeredCount} unanswered questions!
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => setShowConfirmSubmit(false)}
                className="px-4 py-2 text-xs font-semibold text-ink-soft border border-line hover:bg-paper rounded-xl transition"
              >
                Back to Questions
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={performSubmission}
                className="px-5 py-2 text-xs font-bold text-white bg-teal hover:bg-teal/90 disabled:opacity-50 rounded-xl shadow-md shadow-teal/20 flex items-center gap-2 transition"
              >
                {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                <span>Confirm & Submit</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
