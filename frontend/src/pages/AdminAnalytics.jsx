import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  BookOpen,
  GraduationCap,
  Clock,
  Loader2,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
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

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    analyticsService
      .getAdminAnalytics()
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

  const roleChartData = data
    ? [
        { role: 'Students', count: data.usersByRole.student },
        { role: 'Instructors', count: data.usersByRole.instructor },
        { role: 'Admins', count: data.usersByRole.admin },
      ]
    : [];

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <header className="h-16 border-b border-line bg-paper-alt px-6 md:px-12 flex items-center justify-between sticky top-0 z-10">
        <Link
          to="/admin/dashboard"
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
          Platform analytics
        </h1>
        <p className="mt-1 text-sm text-slate">Usage and growth across the whole platform.</p>

        {error && (
          <p className="mt-6 rounded-2xl border border-line bg-paper-alt p-6 text-center text-sm text-red-600">
            {error}
          </p>
        )}

        {!error && data && (
          <>
            <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <StatCard icon={Users} label="Total users" value={data.totalUsers} />
              <StatCard icon={BookOpen} label="Total courses" value={data.totalCourses} />
              <StatCard icon={GraduationCap} label="Total enrollments" value={data.totalEnrollments} />
              <StatCard
                icon={Clock}
                label="Pending instructor approvals"
                value={data.pendingInstructorApprovals}
              />
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-line bg-paper-alt p-6">
                <h2 className="font-display text-base font-semibold text-ink">
                  Signups — last 6 months
                </h2>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.signupTrend}>
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

              <div className="rounded-2xl border border-line bg-paper-alt p-6">
                <h2 className="font-display text-base font-semibold text-ink">Users by role</h2>
                <div className="mt-4 h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={roleChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-line)" />
                      <XAxis dataKey="role" tick={{ fontSize: 11 }} stroke="var(--color-slate)" />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="var(--color-slate)" />
                      <Tooltip />
                      <Bar dataKey="count" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-line bg-paper-alt p-6">
                <h2 className="font-display text-base font-semibold text-ink">Top categories</h2>
                {data.topCategories.length === 0 ? (
                  <p className="mt-4 text-sm text-slate">No course data yet.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {data.topCategories.map((c) => (
                      <li key={c.category} className="flex items-center justify-between text-sm">
                        <span className="text-ink">{c.category}</span>
                        <span className="text-slate">
                          {c.courseCount} course{c.courseCount === 1 ? '' : 's'} ·{' '}
                          {c.totalEnrollments} enrolled
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="rounded-2xl border border-line bg-paper-alt p-6">
                <h2 className="font-display text-base font-semibold text-ink">
                  Top courses by enrollment
                </h2>
                {data.topCourses.length === 0 ? (
                  <p className="mt-4 text-sm text-slate">No course data yet.</p>
                ) : (
                  <ul className="mt-4 flex flex-col gap-3">
                    {data.topCourses.map((c) => (
                      <li key={c.courseId} className="flex items-center justify-between text-sm">
                        <div>
                          <p className="text-ink">{c.title}</p>
                          <p className="text-xs text-slate">{c.instructor}</p>
                        </div>
                        <span className="font-mono text-xs text-slate">
                          {c.enrolledCount} enrolled
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
