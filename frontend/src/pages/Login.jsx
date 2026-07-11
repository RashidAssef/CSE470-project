import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Route as RouteIcon, Eye, EyeOff } from 'lucide-react';
import { authService } from '../services/api.js';

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await authService.login(form.email, form.password);
      
      // If the user is an instructor in pending state, prevent direct access
      if (userData.role === 'instructor' && userData.status === 'pending') {
        setError('Your instructor profile is pending administrator approval. Please check back later.');
        authService.logout(); // Clear token and local user data
        setLoading(false);
        return;
      }

      // Redirect depending on user role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'instructor') {
        navigate('/instructor/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-16">
        <Link to="/" className="flex items-center gap-2 self-start">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper-alt">
            <RouteIcon size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold text-ink">
            Pathway<span className="text-primary">.</span>
          </span>
        </Link>

        <h1 className="mt-10 font-display text-3xl font-semibold tracking-tight text-ink">
          Welcome back
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          Log in to pick up your learning path where you left off.
        </p>

        {/* Display Alert Messages */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <div>
            <label htmlFor="email" className="text-sm font-medium text-ink">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              placeholder="you@example.com"
              className="mt-1.5 w-full rounded-xl border border-line bg-paper-alt px-4 py-3 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              disabled={loading}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="text-sm font-medium text-ink">
                Password
              </label>
              <a href="#" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </a>
            </div>
            <div className="relative mt-1.5">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="w-full rounded-xl border border-line bg-paper-alt px-4 py-3 pr-11 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                disabled={loading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:opacity-75 disabled:cursor-not-allowed"
          >
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-ink-soft">
          New to Pathway?{' '}
          <Link to="/signup" className="font-semibold text-primary hover:underline">
            Create a free account
          </Link>
        </p>
      </div>

      <div className="relative hidden flex-1 items-center justify-center bg-ink lg:flex">
        <AuthSidePanel />
      </div>
    </div>
  );
}

function AuthSidePanel() {
  return (
    <div className="max-w-sm px-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20">
        <RouteIcon size={28} className="text-primary" strokeWidth={2} />
      </div>
      <h2 className="mt-6 font-display text-2xl font-semibold text-paper-alt">
        Pick up exactly where you left off
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate">
        Your progress, quiz results, and upcoming deadlines are all waiting
        for you on your dashboard.
      </p>
    </div>
  );
}
