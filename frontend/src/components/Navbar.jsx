import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, BookOpen, Key, LogOut, Info } from 'lucide-react';

const landingLinks = [
  { label: 'Explore Courses', href: '#courses' },
  { label: 'Learning Paths', href: '#how-it-works' },
  { label: 'For Instructors', href: '#features' },
  { label: 'Reviews', href: '#testimonials' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [showDevModal, setShowDevModal] = useState(false);
  const [modalTokenInput, setModalTokenInput] = useState('');

  // Synchronize internal state with localStorage changes
  useEffect(() => {
    const handleStorageChange = () => {
      setToken(localStorage.getItem('token') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    // Dispatch a storage event so all components update auth state
    window.dispatchEvent(new Event('storage'));
    navigate('/');
    setIsOpen(false);
  };

  const handleSaveToken = (e) => {
    e.preventDefault();
    if (modalTokenInput.trim()) {
      localStorage.setItem('token', modalTokenInput.trim());
      setToken(modalTokenInput.trim());
      window.dispatchEvent(new Event('storage'));
    } else {
      localStorage.removeItem('token');
      setToken('');
      window.dispatchEvent(new Event('storage'));
    }
    setShowDevModal(false);
    setModalTokenInput('');
  };

  const activeStyle = ({ isActive }) =>
    `px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
      isActive
        ? 'bg-blue-50 text-blue-600 font-bold'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  const activeMobileStyle = ({ isActive }) =>
    `block px-4 py-3 rounded-xl text-base font-semibold transition-all ${
      isActive
        ? 'bg-blue-50 text-blue-600 font-bold border-l-4 border-blue-500'
        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
    }`;

  return (
    <>
    <nav className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">

          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md shadow-blue-100 group-hover:scale-105 transition-transform">
                <BookOpen className="h-5.5 w-5.5" />
              </div>

              <span className="font-heading text-lg font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent sm:text-xl">
                Interactive Learning
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">

            <NavLink to="/" className={activeStyle}>
              Home
            </NavLink>

            {landingLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all"
              >
                {link.label}
              </a>
            ))}

            {token && (
              <>
                <NavLink to="/my-courses" className={activeStyle}>
                  My Courses
                </NavLink>

                <NavLink to="/create-course" className={activeStyle}>
                  Create Course
                </NavLink>
              </>
            )}

            <button
              onClick={() => {
                setModalTokenInput(token);
                setShowDevModal(true);
              }}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                token
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100/80'
                  : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100/80'
              }`}
            >
              <Key className="h-3.5 w-3.5" />
              {token ? 'JWT Active' : 'Inject JWT'}
            </button>

            {token ? (
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600"
                >
                  Log in
                </Link>

                <Link
                  to="/signup"
                  className="rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Buttons */}
          <div className="flex items-center md:hidden gap-2">

            <button
              onClick={() => {
                setModalTokenInput(token);
                setShowDevModal(true);
              }}
              className={`p-2 rounded-xl border ${
                token
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600'
                  : 'border-amber-100 bg-amber-50 text-amber-600'
              }`}
            >
              <Key className="h-4 w-4" />
            </button>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white shadow-inner">
          <div className="px-2 pt-2 pb-3 space-y-1">

            <NavLink
              to="/"
              onClick={() => setIsOpen(false)}
              className={activeMobileStyle}
            >
              Home
            </NavLink>

            {landingLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block px-4 py-3 rounded-xl text-base font-semibold text-slate-600 hover:bg-slate-50"
              >
                {link.label}
              </a>
            ))}

            {token && (
              <>
                <NavLink
                  to="/my-courses"
                  onClick={() => setIsOpen(false)}
                  className={activeMobileStyle}
                >
                  My Courses
                </NavLink>

                <NavLink
                  to="/create-course"
                  onClick={() => setIsOpen(false)}
                  className={activeMobileStyle}
                >
                  Create Course
                </NavLink>

                <button
                  onClick={handleLogout}
                  className="w-full text-left flex items-center gap-2 px-4 py-3 rounded-xl text-base font-semibold text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </>
            )}

            {!token && (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl border px-4 py-3 text-center font-semibold"
                >
                  Log in
                </Link>

                <Link
                  to="/signup"
                  onClick={() => setIsOpen(false)}
                  className="block rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white"
                >
                  Get Started
                </Link>
              </>
            )}

          </div>
        </div>
      )}
    </nav>

      {/* Developer Token Injector Modal */}
      {showDevModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowDevModal(false)}></div>
          <div className="relative w-full max-w-lg transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all border border-slate-100">
            
            <button 
              onClick={() => setShowDevModal(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-start gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
                <Key className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-heading">
                  Developer Token Manager
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  Authenticated courses APIs require a valid Bearer JWT. Paste a token below to authenticate requests.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveToken} className="space-y-4">
              <div>
                <label htmlFor="dev-token" className="block text-xs font-semibold text-slate-700 mb-1">
                  JWT Authorization Bearer Token
                </label>
                <textarea
                  id="dev-token"
                  value={modalTokenInput}
                  onChange={(e) => setModalTokenInput(e.target.value)}
                  placeholder="Paste JWT string here..."
                  rows={4}
                  className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 bg-slate-50"
                />
              </div>

              <div className="bg-blue-50/50 rounded-xl p-3 border border-blue-100/50 flex gap-2">
                <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  If you don't have a token, you can input a mock user ID or string (e.g. <code>mock-token-instructor123</code>). Note: Ensure the backend allows validation for mock headers or verify local auth configuration.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('token');
                    setToken('');
                    window.dispatchEvent(new Event('storage'));
                    setShowDevModal(false);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-rose-100 bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
                >
                  Clear Token
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-100 transition-colors"
                >
                  Save & Apply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
