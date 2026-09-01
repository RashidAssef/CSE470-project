import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Users, Activity, Loader2, BarChart3 } from 'lucide-react';
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

export default function CourseAnalytics() {
  const { id: courseId } = useParams();
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    analyticsService
      .getCourseAnalytics(courseId)
      .then(setData)
      .catch((err) => setError(err.message || 'Failed to load analytics'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

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
          to={`/courses/${courseId}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate hover:text-primary"
        >
          <ArrowLeft size={16} />
          Back to course
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10 lg:px-8">
        {error && (
          <p className="mt-6 rounded-2xl border border-line bg-paper-alt p-6 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {!error && data && (
          <>
            <h1 className="flex items-center gap-2 font-display text-2xl font-semibold text-ink sm:text-3xl">
              <BarChart3 className="text-primary" size={24} />
              {data.title}
            </h1>
            <p className="mt-1 text-sm text-slate">Course performance & engagement</p>

            <div className="mt-8 grid grid-cols-3 gap-4">
              <StatCard icon={Users} label="Enrolled" value={data.enrolledCount} />
              <StatCard icon={Activity} label="Engaged students" value={data.engagedStudents} />
              <StatCard icon={BarChart3} label="Engagement rate" value={`${data.engagementRate}%`} />
            </div>

            <div className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <h2 className="font-display text-base font-semibold text-ink">
                Enrollments — last 6 months
              </h2>
              <div className="mt-4 h-56">
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

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-line bg-paper-alt p-6">
                <h2 className="font-display text-base font-semibold text-ink">Quiz performance</h2>
                {data.quizzes.length === 0 ? (
                  <p className="mt-4 text-sm text-slate">No quizzes yet.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {data.quizzes.map((q) => (
                      <li key={q.quizId} className="rounded-xl border border-line p-3 text-sm">
                        <p className="font-medium text-ink">{q.title}</p>
                        <p className="mt-1 text-xs text-slate">
                          {q.attempts} attempt{q.attempts === 1 ? '' : 's'} · avg {q.avgScore}% ·{' '}
                          {q.passRate}% pass rate
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-line bg-paper-alt p-6">
                <h2 className="font-display text-base font-semibold text-ink">
                  Assignment performance
                </h2>
                {data.assignments.length === 0 ? (
                  <p className="mt-4 text-sm text-slate">No assignments yet.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {data.assignments.map((a) => (
                      <li key={a.assignmentId} className="rounded-xl border border-line p-3 text-sm">
                        <p className="font-medium text-ink">{a.title}</p>
                        <p className="mt-1 text-xs text-slate">
                          {a.submissions} submission{a.submissions === 1 ? '' : 's'} · {a.graded}{' '}
                          graded · avg {a.avgMarks}/{a.maxMarks}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="mt-8 rounded-2xl border border-line bg-paper-alt p-6">
              <h2 className="font-display text-base font-semibold text-ink">Forum activity</h2>
              <p className="mt-2 text-sm text-slate">
                {data.forum.threads} thread{data.forum.threads === 1 ? '' : 's'} ·{' '}
                {data.forum.posts} post{data.forum.posts === 1 ? '' : 's'}
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
