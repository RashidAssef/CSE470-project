import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Route as RouteIcon, Eye, EyeOff } from 'lucide-react'

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ email: '', password: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    // TODO: wire up to the Express/MongoDB auth endpoint
    console.log('Login submitted:', form)
  }

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
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="mt-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            Log in
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
  )
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
  )
}
