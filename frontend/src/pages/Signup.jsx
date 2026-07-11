import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Route as RouteIcon, Eye, EyeOff, GraduationCap, PenSquare } from 'lucide-react';
import { authService } from '../services/api.js';

export default function Signup() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.signup(form.name, form.email, form.password, role);
      setSuccess(true);
      
      // If it's a student, automatically redirect to login page after 3 seconds
      if (role === 'student') {
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      }
    } catch (err) {
      setError(err.message || 'Registration failed. Please check your inputs and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper">
      <div className="relative hidden flex-1 items-center justify-center bg-ink lg:flex">
        <AuthSidePanel />
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-16">
        <Link to="/" className="flex items-center gap-2 self-start">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper-alt">
            <RouteIcon size={18} strokeWidth={2.5} />
          </span>
          <span className="font-display text-lg font-semibold text-ink">
            Pathway<span className="text-primary">.</span>
          </span>
        </Link>

        {success ? (
          <div className="mt-10 rounded-2xl bg-paper-alt p-8 shadow-sm border border-line">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal/15 text-teal">
              <GraduationCap size={24} />
            </div>
            <h2 className="mt-6 font-display text-2xl font-semibold text-ink">
              Registration Successful!
            </h2>
            
            {role === 'instructor' ? (
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Thank you for registering as an instructor. To maintain platform quality, 
                instructor accounts must be verified by an administrator. 
                <strong className="block mt-2 text-primary">
                  Please wait for an administrator to approve your account before attempting to log in.
                </strong>
              </p>
            ) : (
              <p className="mt-4 text-sm leading-relaxed text-ink-soft">
                Your student account has been created successfully. 
                <strong className="block mt-2 text-teal">
                  Redirecting to the login page in 3 seconds...
                </strong>
              </p>
            )}
            
            <div className="mt-8">
              <Link
                to="/login"
                className="inline-flex w-full justify-center rounded-full bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
              >
                Go to Login
              </Link>
            </div>
          </div>
        ) : (
          <>
            <h1 className="mt-10 font-display text-3xl font-semibold tracking-tight text-ink">
              Create your account
            </h1>
            <p className="mt-2 text-sm text-ink-soft">
              Free to join. Choose how you'll use Pathway.
            </p>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <RoleOption
                active={role === 'student'}
                onClick={() => setRole('student')}
                icon={GraduationCap}
                label="I'm a student"
                sub="Enroll & learn"
                disabled={loading}
              />
              <RoleOption
                active={role === 'instructor'}
                onClick={() => setRole('instructor')}
                icon={PenSquare}
                label="I'm an instructor"
                sub="Create & teach"
                disabled={loading}
              />
            </div>

            {/* Display Alert Messages */}
            {error && (
              <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
              <div>
                <label htmlFor="name" className="text-sm font-medium text-ink">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                  className="mt-1.5 w-full rounded-xl border border-line bg-paper-alt px-4 py-3 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  disabled={loading}
                />
              </div>

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
                <label htmlFor="password" className="text-sm font-medium text-ink">
                  Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={form.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
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
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-8 text-center text-sm text-ink-soft">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function RoleOption({ active, onClick, icon: Icon, label, sub, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-start gap-2 rounded-xl border px-4 py-3.5 text-left transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        active
          ? 'border-primary bg-primary-light'
          : 'border-line bg-paper-alt hover:border-primary/50'
      }`}
    >
      <Icon size={20} className={active ? 'text-primary-dark' : 'text-slate'} />
      <span>
        <span className="block text-sm font-semibold text-ink">{label}</span>
        <span className="block text-xs text-slate">{sub}</span>
      </span>
    </button>
  );
}

function AuthSidePanel() {
  return (
    <div className="max-w-sm px-10 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber/20">
        <GraduationCap size={28} className="text-amber" strokeWidth={2} />
      </div>
      <h2 className="mt-6 font-display text-2xl font-semibold text-paper-alt">
        Join 18,000+ learners on structured paths
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-slate">
        Whether you're here to learn or to teach, your dashboard is built
        around one thing: knowing exactly what's next.
      </p>
    </div>
  );
}
