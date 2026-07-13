import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LogOut,
  PenSquare,
  PlusCircle,
  BookOpen,
} from 'lucide-react';
import { authService } from '../services/api.js';

export default function InstructorDashboard() {
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
      <div className="w-full max-w-lg rounded-2xl bg-paper-alt border border-line p-8 shadow-sm">

        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            <PenSquare size={28} />
          </div>

          <h1 className="mt-6 font-display text-2xl font-semibold text-ink">
            Instructor Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate">
            Welcome back,{" "}
            <strong className="text-ink">
              {user?.name || "Instructor"}
            </strong>
            !
          </p>
        </div>

        {/* Status Card */}
        <div className="mt-8 rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-center gap-2 text-green-700 font-semibold">
            <BookOpen size={18} />
            Course Creation Available
          </div>

          <p className="mt-3 text-sm text-slate-700 leading-relaxed">
            Your instructor account is active. You can now create, edit,
            and manage courses using the Course Creation page.
          </p>

          <span className="mt-4 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-green-700">
            Instructor Active
          </span>
        </div>

        {/* Actions */}
        <div className="mt-8 space-y-4">

          <button
            onClick={() => navigate('/create-course')}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
          >
            <PlusCircle size={18} />
            Create New Course
          </button>

          <button
            onClick={() => navigate('/my-courses')}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-white py-3 text-sm font-semibold text-ink hover:bg-slate-50 transition-colors"
          >
            <BookOpen size={18} />
            Manage My Courses
          </button>

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 border border-red-100 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>

        </div>
      </div>
    </div>
  );
}