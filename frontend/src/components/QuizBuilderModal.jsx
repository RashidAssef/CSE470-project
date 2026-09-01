import { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  Loader2,
  Award,
  Clock,
  BookOpen,
  Layers,
  Sparkles,
} from 'lucide-react';
import { quizService } from '../services/api.js';

export default function QuizBuilderModal({
  isOpen,
  onClose,
  courseId,
  modules = [],
  existingQuiz = null,
  onSaved,
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    moduleOrder: '',
    timeLimit: 0,
    passingScore: 70,
    maxAttempts: 0,
    shuffleQuestions: false,
    showCorrectAnswersAfterSubmission: true,
  });

  const [questions, setQuestions] = useState([]);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingQuiz) {
      setFormData({
        title: existingQuiz.title || '',
        description: existingQuiz.description || '',
        moduleOrder:
          existingQuiz.moduleOrder !== null && existingQuiz.moduleOrder !== undefined
            ? existingQuiz.moduleOrder
            : '',
        timeLimit: existingQuiz.timeLimit || 0,
        passingScore: existingQuiz.passingScore || 70,
        maxAttempts: existingQuiz.maxAttempts || 0,
        shuffleQuestions: Boolean(existingQuiz.shuffleQuestions),
        showCorrectAnswersAfterSubmission:
          existingQuiz.showCorrectAnswersAfterSubmission !== undefined
            ? existingQuiz.showCorrectAnswersAfterSubmission
            : true,
      });

      setQuestions(
        (existingQuiz.questions || []).map((q) => ({
          _id: q._id,
          questionText: q.questionText || '',
          questionType: q.questionType || 'multiple_choice',
          options:
            q.options && q.options.length > 0
              ? [...q.options]
              : ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswers: q.correctAnswers || [0],
          points: q.points !== undefined ? q.points : 1,
          explanation: q.explanation || '',
        }))
      );
      setActiveQuestionIndex(0);
    } else {
      setFormData({
        title: '',
        description: '',
        moduleOrder: '',
        timeLimit: 0,
        passingScore: 70,
        maxAttempts: 0,
        shuffleQuestions: false,
        showCorrectAnswersAfterSubmission: true,
      });

      setQuestions([
        {
          questionText: '',
          questionType: 'multiple_choice',
          options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
          correctAnswers: [0],
          points: 1,
          explanation: '',
        },
      ]);
      setActiveQuestionIndex(0);
    }
    setError('');
  }, [existingQuiz, isOpen]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    const newQuestion = {
      questionText: '',
      questionType: 'multiple_choice',
      options: ['Option 1', 'Option 2', 'Option 3', 'Option 4'],
      correctAnswers: [0],
      points: 1,
      explanation: '',
    };
    setQuestions([...questions, newQuestion]);
    setActiveQuestionIndex(questions.length);
  };

  const handleRemoveQuestion = (idx) => {
    if (questions.length === 1) {
      alert('A quiz must have at least one question.');
      return;
    }
    const updated = questions.filter((_, i) => i !== idx);
    setQuestions(updated);
    if (activeQuestionIndex >= updated.length) {
      setActiveQuestionIndex(Math.max(0, updated.length - 1));
    }
  };

  const handleQuestionChange = (field, value) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== activeQuestionIndex) return q;

        if (field === 'questionType') {
          let newOptions = q.options;
          let newCorrect = [0];

          if (value === 'true_false') {
            newOptions = ['True', 'False'];
            newCorrect = [0];
          } else if (value === 'short_answer') {
            newOptions = [];
            newCorrect = [''];
          } else if (q.questionType === 'true_false' || q.questionType === 'short_answer') {
            newOptions = ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
            newCorrect = [0];
          }

          return { ...q, questionType: value, options: newOptions, correctAnswers: newCorrect };
        }

        return { ...q, [field]: value };
      })
    );
  };

  const handleOptionTextChange = (optIdx, text) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== activeQuestionIndex) return q;
        const newOpts = [...q.options];
        newOpts[optIdx] = text;
        return { ...q, options: newOpts };
      })
    );
  };

  const handleAddOption = () => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== activeQuestionIndex) return q;
        return { ...q, options: [...q.options, `Option ${q.options.length + 1}`] };
      })
    );
  };

  const handleRemoveOption = (optIdx) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== activeQuestionIndex) return q;
        if (q.options.length <= 2) {
          alert('Multiple choice questions should have at least 2 options.');
          return q;
        }
        const newOpts = q.options.filter((_, i) => i !== optIdx);
        let newCorrect = (q.correctAnswers || [])
          .filter((c) => c !== optIdx)
          .map((c) => (c > optIdx ? c - 1 : c));
        if (newCorrect.length === 0) newCorrect = [0];

        return { ...q, options: newOpts, correctAnswers: newCorrect };
      })
    );
  };

  const handleToggleCorrectOption = (optIdx) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== activeQuestionIndex) return q;

        if (q.questionType === 'multiple_choice' || q.questionType === 'true_false') {
          return { ...q, correctAnswers: [optIdx] };
        } else if (q.questionType === 'multiple_response') {
          const current = q.correctAnswers || [];
          const exists = current.includes(optIdx);
          let updated;
          if (exists) {
            updated = current.filter((i) => i !== optIdx);
            if (updated.length === 0) updated = [optIdx];
          } else {
            updated = [...current, optIdx].sort((a, b) => a - b);
          }
          return { ...q, correctAnswers: updated };
        }
        return q;
      })
    );
  };

  const handleShortAnswerCorrectChange = (text) => {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== activeQuestionIndex) return q;
        return { ...q, correctAnswers: [text] };
      })
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.title.trim()) {
      setError('Please provide a quiz title.');
      return;
    }

    if (questions.length === 0) {
      setError('Please add at least one question.');
      return;
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.questionText.trim()) {
        setError(`Question #${i + 1} is missing question text.`);
        setActiveQuestionIndex(i);
        return;
      }
      if (q.questionType === 'multiple_choice' || q.questionType === 'multiple_response') {
        for (let j = 0; j < q.options.length; j++) {
          if (!q.options[j].trim()) {
            setError(`Question #${i + 1}: Option ${j + 1} cannot be empty.`);
            setActiveQuestionIndex(i);
            return;
          }
        }
        if (!q.correctAnswers || q.correctAnswers.length === 0) {
          setError(`Question #${i + 1}: Please select at least one correct answer.`);
          setActiveQuestionIndex(i);
          return;
        }
      } else if (q.questionType === 'short_answer') {
        if (!q.correctAnswers || !q.correctAnswers[0] || !q.correctAnswers[0].toString().trim()) {
          setError(`Question #${i + 1}: Please enter the correct acceptable answer string.`);
          setActiveQuestionIndex(i);
          return;
        }
      }
    }

    setLoading(true);
    try {
      const payload = {
        courseId,
        title: formData.title.trim(),
        description: formData.description.trim(),
        moduleOrder: formData.moduleOrder !== '' ? Number(formData.moduleOrder) : null,
        timeLimit: Number(formData.timeLimit) || 0,
        passingScore: Number(formData.passingScore) || 70,
        maxAttempts: Number(formData.maxAttempts) || 0,
        shuffleQuestions: Boolean(formData.shuffleQuestions),
        showCorrectAnswersAfterSubmission: Boolean(formData.showCorrectAnswersAfterSubmission),
        questions: questions.map((q) => ({
          questionText: q.questionText.trim(),
          questionType: q.questionType,
          options: q.options,
          correctAnswers: q.correctAnswers,
          points: Number(q.points) || 1,
          explanation: q.explanation.trim(),
        })),
      };

      if (existingQuiz) {
        await quizService.updateQuiz(existingQuiz._id, payload);
      } else {
        await quizService.createQuiz(payload);
      }

      onSaved();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save quiz.');
    } finally {
      setLoading(false);
    }
  };

  const currentQ = questions[activeQuestionIndex] || questions[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto font-body text-ink">
      <div className="bg-paper-alt border border-line rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-paper-alt">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary font-bold">
              <Award size={20} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                {existingQuiz ? 'Edit Quiz & Assessment' : 'Create New Assessment / Quiz'}
              </h3>
              <p className="text-xs text-slate">
                Configure quiz questions, timing, scoring criteria, and grading rules.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate hover:text-ink rounded-xl hover:bg-paper transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: General Settings */}
          <div className="bg-paper border border-line rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-primary" />
              <h4 className="font-display text-sm font-semibold uppercase tracking-wider text-ink-soft">
                General Information & Rules
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Quiz Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Module 1 Knowledge Check: Fundamentals"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-paper-alt border border-line rounded-xl text-ink placeholder:text-slate focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Description / Instructions
                </label>
                <textarea
                  rows="2"
                  placeholder="Briefly explain what topics this assessment covers and any instructions for students..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-paper-alt border border-line rounded-xl text-ink placeholder:text-slate focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Linked Module (Optional)
                </label>
                <select
                  value={formData.moduleOrder}
                  onChange={(e) => setFormData({ ...formData, moduleOrder: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-paper-alt border border-line rounded-xl text-ink focus:border-primary focus:outline-none transition-colors"
                >
                  <option value="">-- General Course Assessment (No Specific Module) --</option>
                  {modules.map((m) => (
                    <option key={m.order} value={m.order}>
                      Module {m.order}: {m.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Time Limit (Minutes)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    placeholder="0 for untimed"
                    value={formData.timeLimit}
                    onChange={(e) => setFormData({ ...formData, timeLimit: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm bg-paper-alt border border-line rounded-xl text-ink focus:border-primary focus:outline-none transition-colors"
                  />
                  <Clock size={16} className="text-slate absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate mt-1">Set to 0 if the quiz has no time limit.</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={formData.passingScore}
                  onChange={(e) => setFormData({ ...formData, passingScore: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-paper-alt border border-line rounded-xl text-ink focus:border-primary focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink-soft mb-1">
                  Maximum Attempts Allowed
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0 for unlimited"
                  value={formData.maxAttempts}
                  onChange={(e) => setFormData({ ...formData, maxAttempts: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-paper-alt border border-line rounded-xl text-ink focus:border-primary focus:outline-none transition-colors"
                />
                <p className="text-[11px] text-slate mt-1">0 allows unlimited retakes.</p>
              </div>
            </div>

            {/* Checkbox Options */}
            <div className="pt-3 flex flex-wrap gap-6 border-t border-line">
              <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.shuffleQuestions}
                  onChange={(e) => setFormData({ ...formData, shuffleQuestions: e.target.checked })}
                  className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                />
                <span>Randomize question order for each student</span>
              </label>

              <label className="flex items-center gap-2 text-xs font-medium text-ink cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.showCorrectAnswersAfterSubmission}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      showCorrectAnswersAfterSubmission: e.target.checked,
                    })
                  }
                  className="h-4 w-4 rounded border-line text-primary focus:ring-primary"
                />
                <span>Show answer explanations after submission review</span>
              </label>
            </div>
          </div>

          {/* Section 2: Questions Editor */}
          <div className="border border-line rounded-2xl overflow-hidden bg-paper-alt">
            <div className="bg-paper px-5 py-3 border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers size={16} className="text-primary" />
                <h4 className="font-display text-sm font-semibold text-ink">
                  Questions ({questions.length})
                </h4>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-sm transition-colors"
              >
                <Plus size={14} />
                <span>Add Question</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 min-h-[380px]">
              {/* Question list sidebar */}
              <div className="p-3 border-r border-line bg-paper/60 space-y-1.5 max-h-[440px] overflow-y-auto">
                {questions.map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveQuestionIndex(idx)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition ${
                      activeQuestionIndex === idx
                        ? 'bg-primary text-white shadow-sm'
                        : 'bg-paper-alt border border-line text-ink-soft hover:border-primary/50'
                    }`}
                  >
                    <div className="truncate flex-1 pr-2">
                      <span className="font-bold mr-1.5">Q{idx + 1}.</span>
                      {q.questionText ? q.questionText : <span className="italic opacity-70">(Empty text)</span>}
                    </div>
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-md ${
                        activeQuestionIndex === idx
                          ? 'bg-primary-dark text-white'
                          : 'bg-paper text-slate border border-line'
                      }`}
                    >
                      {q.points} pt
                    </span>
                  </button>
                ))}
              </div>

              {/* Active question details */}
              {currentQ && (
                <div className="p-5 md:col-span-3 space-y-4 bg-paper-alt">
                  <div className="flex items-center justify-between pb-3 border-b border-line">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold px-2.5 py-1 bg-primary-light text-primary rounded-lg">
                        Question {activeQuestionIndex + 1}
                      </span>

                      <select
                        value={currentQ.questionType}
                        onChange={(e) => handleQuestionChange('questionType', e.target.value)}
                        className="text-xs font-semibold bg-paper border border-line rounded-xl px-3 py-1.5 text-ink focus:border-primary focus:outline-none"
                      >
                        <option value="multiple_choice">Multiple Choice (Single Answer)</option>
                        <option value="multiple_response">Multiple Response (Checkboxes)</option>
                        <option value="true_false">True / False</option>
                        <option value="short_answer">Short Answer (Exact Match)</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <label className="text-xs text-slate font-medium">Points:</label>
                        <input
                          type="number"
                          min="0.5"
                          step="0.5"
                          value={currentQ.points}
                          onChange={(e) => handleQuestionChange('points', e.target.value)}
                          className="w-14 px-2 py-1 text-xs bg-paper border border-line rounded-lg text-center text-ink focus:border-primary focus:outline-none"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(activeQuestionIndex)}
                        title="Delete question"
                        className="p-1.5 text-slate hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Question Text */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1">
                      Question Prompt <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="e.g. Which hook is used to manage local state in React functional components?"
                      value={currentQ.questionText}
                      onChange={(e) => handleQuestionChange('questionText', e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm bg-paper border border-line rounded-xl text-ink focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>

                  {/* Options editor */}
                  {(currentQ.questionType === 'multiple_choice' ||
                    currentQ.questionType === 'multiple_response') && (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-semibold text-ink-soft">
                          Options & Correct Answer(s){' '}
                          <span className="text-slate font-normal">
                            (Click checkbox/circle to mark correct answer)
                          </span>
                        </label>
                        <button
                          type="button"
                          onClick={handleAddOption}
                          className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          <Plus size={14} />
                          <span>Add Option</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {currentQ.options.map((opt, optIdx) => {
                          const isCorrect = (currentQ.correctAnswers || []).includes(optIdx);
                          return (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2.5 p-2 rounded-xl border transition ${
                                isCorrect
                                  ? 'border-teal bg-teal/5 text-ink'
                                  : 'border-line bg-paper text-ink'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleCorrectOption(optIdx)}
                                title={isCorrect ? 'Correct Answer' : 'Click to mark as correct'}
                                className={`w-5 h-5 rounded flex items-center justify-center shrink-0 transition ${
                                  currentQ.questionType === 'multiple_choice' ? 'rounded-full' : 'rounded-md'
                                } ${
                                  isCorrect
                                    ? 'bg-teal text-white'
                                    : 'border-2 border-slate/50 hover:border-teal'
                                }`}
                              >
                                {isCorrect && <CheckCircle2 size={14} />}
                              </button>

                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => handleOptionTextChange(optIdx, e.target.value)}
                                placeholder={`Option ${optIdx + 1}`}
                                className="flex-1 px-3 py-1.5 text-xs bg-paper-alt border border-line rounded-lg text-ink focus:border-primary focus:outline-none"
                              />

                              <button
                                type="button"
                                onClick={() => handleRemoveOption(optIdx)}
                                disabled={currentQ.options.length <= 2}
                                className="p-1 text-slate hover:text-red-600 disabled:opacity-30"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* True / False */}
                  {currentQ.questionType === 'true_false' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-ink-soft">
                        Correct Answer Choice
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {['True', 'False'].map((val, optIdx) => {
                          const isCorrect = (currentQ.correctAnswers || [])[0] === optIdx;
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              onClick={() => handleToggleCorrectOption(optIdx)}
                              className={`py-3 px-4 rounded-xl border text-center font-bold text-sm transition flex items-center justify-center gap-2 ${
                                isCorrect
                                  ? 'bg-teal text-white border-teal shadow-md shadow-teal/20'
                                  : 'bg-paper border-line text-ink hover:border-slate'
                              }`}
                            >
                              <span>{val}</span>
                              {isCorrect && <CheckCircle2 size={16} />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Short Answer */}
                  {currentQ.questionType === 'short_answer' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-semibold text-ink-soft">
                        Accepted Answer (Case-insensitive)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. useState"
                        value={currentQ.correctAnswers ? currentQ.correctAnswers[0] || '' : ''}
                        onChange={(e) => handleShortAnswerCorrectChange(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm bg-paper border border-line rounded-xl text-ink focus:border-primary focus:outline-none"
                      />
                      <p className="text-[11px] text-slate">
                        Student answers will be matched case-insensitively with leading/trailing whitespace stripped.
                      </p>
                    </div>
                  )}

                  {/* Explanation feedback */}
                  <div>
                    <label className="block text-xs font-semibold text-ink-soft mb-1 flex items-center gap-1">
                      <HelpCircle size={14} className="text-primary" />
                      <span>Answer Explanation & Feedback (Shown during review)</span>
                    </label>
                    <textarea
                      rows="2"
                      placeholder="Explain why the answer is correct so students learn from their mistakes..."
                      value={currentQ.explanation}
                      onChange={(e) => handleQuestionChange('explanation', e.target.value)}
                      className="w-full px-3.5 py-2 text-xs bg-paper border border-line rounded-xl text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-ink-soft hover:bg-paper border border-line rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-primary hover:bg-primary-dark disabled:opacity-60 rounded-xl shadow-md shadow-primary/20 flex items-center gap-2 transition-colors"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              <span>{existingQuiz ? 'Save Changes' : 'Create Quiz'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
