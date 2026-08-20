import { useState, useEffect } from 'react';
import {
  X,
  Users,
  Award,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Search,
  Loader2,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { quizService } from '../services/api.js';

export default function QuizSubmissionsModal({ isOpen, onClose, quiz, onViewAttemptReview }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [data, setData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && quiz) {
      loadSubmissions();
    }
  }, [isOpen, quiz]);

  const loadSubmissions = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await quizService.getQuizSubmissions(quiz._id);
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load quiz submissions');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const submissions = data?.submissions || [];
  const analytics = data?.analytics || {
    totalAttempts: 0,
    uniqueStudents: 0,
    passRate: 0,
    averageScore: 0,
  };

  const filteredSubmissions = submissions.filter((s) => {
    const name = s.student?.name?.toLowerCase() || '';
    const email = s.student?.email?.toLowerCase() || '';
    const q = searchQuery.toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4 overflow-y-auto font-body text-ink">
      <div className="bg-paper-alt border border-line rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-line bg-paper-alt">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary font-bold">
              <Users size={20} />
            </span>
            <div>
              <h3 className="font-display text-lg font-bold text-ink">
                Quiz Results & Student Submissions
              </h3>
              <p className="text-xs text-slate">
                {quiz?.title} (Passing Mark: {quiz?.passingScore}%)
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl flex items-center gap-3 text-sm">
              <AlertCircle size={18} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate">
              <Loader2 size={32} className="animate-spin text-primary mb-3" />
              <p className="text-sm">Loading quiz metrics & submissions...</p>
            </div>
          ) : (
            <>
              {/* Analytics KPI Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-paper border border-line p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate uppercase tracking-wider">
                    Total Attempts
                  </span>
                  <p className="font-display text-2xl font-bold text-ink mt-1">
                    {analytics.totalAttempts}
                  </p>
                </div>
                <div className="bg-paper border border-line p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate uppercase tracking-wider">
                    Students
                  </span>
                  <p className="font-display text-2xl font-bold text-ink mt-1">
                    {analytics.uniqueStudents}
                  </p>
                </div>
                <div className="bg-paper border border-line p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate uppercase tracking-wider">
                    Pass Rate
                  </span>
                  <p
                    className={`font-display text-2xl font-bold mt-1 ${
                      analytics.passRate >= 70 ? 'text-teal' : 'text-amber'
                    }`}
                  >
                    {analytics.passRate}%
                  </p>
                </div>
                <div className="bg-paper border border-line p-4 rounded-2xl">
                  <span className="text-[11px] font-bold text-slate uppercase tracking-wider">
                    Avg Score
                  </span>
                  <p className="font-display text-2xl font-bold text-primary mt-1">
                    {analytics.averageScore}%
                  </p>
                </div>
              </div>

              {/* Search filter */}
              <div className="flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                  <Search size={16} className="text-slate absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search student by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-xs bg-paper border border-line rounded-xl outline-none text-ink focus:border-primary"
                  />
                </div>
                <span className="text-xs text-slate">
                  Showing {filteredSubmissions.length} of {submissions.length} attempts
                </span>
              </div>

              {/* Submissions Table */}
              <div className="border border-line rounded-2xl overflow-hidden bg-paper-alt">
                <table className="w-full text-left text-xs">
                  <thead className="bg-paper text-slate font-semibold border-b border-line uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3.5 px-4">Student</th>
                      <th className="py-3.5 px-4">Attempt</th>
                      <th className="py-3.5 px-4">Score</th>
                      <th className="py-3.5 px-4">Result</th>
                      <th className="py-3.5 px-4">Time Spent</th>
                      <th className="py-3.5 px-4">Submitted At</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line text-ink">
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-8 text-center text-slate italic">
                          No student submissions found for this assessment.
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub) => (
                        <tr key={sub._id} className="hover:bg-paper/50 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-ink">
                              {sub.student?.name || 'Unknown Student'}
                            </div>
                            <div className="text-[11px] text-slate">
                              {sub.student?.email || 'N/A'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono">
                            Attempt #{sub.attemptNumber}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-ink">{sub.percentage}%</span>{' '}
                            <span className="text-slate text-[11px]">
                              ({sub.score}/{sub.totalPoints} pts)
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            {sub.passed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-teal/10 text-teal">
                                <CheckCircle size={12} />
                                <span>PASSED</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-50 text-red-600">
                                <XCircle size={12} />
                                <span>NOT PASSED</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-slate">
                            {sub.timeSpentSeconds
                              ? `${Math.floor(sub.timeSpentSeconds / 60)}m ${sub.timeSpentSeconds % 60}s`
                              : '< 1m'}
                          </td>
                          <td className="py-3.5 px-4 text-slate">
                            {new Date(sub.submittedAt).toLocaleDateString()}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => onViewAttemptReview(sub._id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary-light rounded-xl transition-colors"
                            >
                              <Eye size={14} />
                              <span>Review</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-line bg-paper-alt">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-semibold text-ink-soft border border-line hover:bg-paper rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
