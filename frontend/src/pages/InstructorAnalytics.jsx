import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Users,
  GraduationCap,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { authService, analyticsService } from '../services/api.js';

const StatCard = ({ icon: Icon, label, value }) => (
  <div className="rounded-2xl border border-line bg-paper-alt p-5">
    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-light text-primary-dark">
      <Icon size={18} />
    </span>
    <p className="mt-3 font-display text-2xl font-semibold text-ink">{value}</p>
    <p className="text-xs text-slate">{label}</p>
  </div>
);

export default function InstructorAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'instructor') {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    analyticsService
      .getInstructorAnalytics()
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <header className="h-16 border-b border-line bg-paper-alt px-6 md:px-12 flex items-center justify-between sticky top-0 z-10">
        <Link
          to="/instructor/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to dashboard
        </Link>
        <span className="font-display text-sm font-semibold text-ink">{user?.name}</span>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-8">
        <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
          <BarChart3 className="text-primary" size={26} />
          Your teaching analytics
        </h1>
        <p className="mt-1 text-sm text-slate">
          Across every course you teach or co-instruct.
        </p>

        {error && (
          <p className="mt-6 rounded-2xl border border-line bg-paper-alt p-6 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {!error && data && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
              <StatCard icon={BookOpen} label="Courses" value={data.totalCourses} />
              <StatCard icon={GraduationCap} label="Unique students" value={data.totalStudents} />
              <StatCard icon={Users} label="Total enrollments" value={data.totalEnrollments} />
            </div>

            <div className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <h2 className="font-display text-base font-semibold text-ink">
                Enrollments — last 6 months
              </h2>
              <div className="mt-4 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.enrollmentTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--color-slate)" />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-slate)" />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--color-primary)"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="mt-8">
              <h2 className="font-display text-base font-semibold text-ink">Per-course breakdown</h2>
              {data.courses.length === 0 ? (
                <p className="mt-4 text-sm text-slate">You don't have any courses yet.</p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-paper-alt">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line text-xs uppercase tracking-wide text-slate">
                        <th className="px-4 py-3 font-medium">Course</th>
                        <th className="px-4 py-3 font-medium">Enrolled</th>
                        <th className="px-4 py-3 font-medium">Avg quiz score</th>
                        <th className="px-4 py-3 font-medium">Quiz pass rate</th>
                        <th className="px-4 py-3 font-medium">Submissions</th>
                        <th className="px-4 py-3 font-medium">Forum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.courses.map((c) => (
                        <tr key={c.courseId} className="border-b border-line last:border-b-0">
                          <td className="px-4 py-3">
                            <Link
                              to={`/instructor/courses/${c.courseId}/manage`}
                              className="font-medium text-ink hover:text-primary"
                            >
                              {c.title}
                            </Link>
                            <p className="text-xs text-slate">{c.category}</p>
                          </td>
                          <td className="px-4 py-3">{c.enrolledCount}</td>
                          <td className="px-4 py-3">
                            {c.quizAttempts > 0 ? `${c.avgQuizScore}%` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {c.quizAttempts > 0 ? `${c.quizPassRate}%` : '—'}
                          </td>
                          <td className="px-4 py-3">
                            {c.assignmentGraded}/{c.assignmentSubmissions} graded
                          </td>
                          <td className="px-4 py-3">
                            {c.forumThreads} threads · {c.forumPosts} posts
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
