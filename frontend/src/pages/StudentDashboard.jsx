import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, GraduationCap } from 'lucide-react';
import { authService } from '../services/api.js';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper text-ink font-body p-6">
      <div className="w-full max-w-md rounded-2xl bg-paper-alt border border-line p-8 shadow-sm text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <GraduationCap size={28} />
        </div>
        <h1 className="mt-6 font-display text-2xl font-semibold text-ink">
          Student Dashboard
        </h1>
        <p className="mt-2 text-sm text-slate">
          Welcome back, <strong className="text-ink">{user?.name || 'Student'}</strong>!
        </p>

        <div className="my-8 rounded-xl bg-paper border border-line p-5 text-sm text-ink-soft leading-relaxed">
          <p>
            Your student portal features (course enrollment, lesson player, quizzes, and certificates) 
            are scheduled for implementation in **Sprints 2 and 3**.
          </p>
          <span className="block mt-3 text-xs font-bold text-primary uppercase tracking-wider">
            Current Role: Student (Active)
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-red-50 text-red-600 border border-red-100 py-3 text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} /> Log Out
        </button>
      </div>
    </div>
  );
}
