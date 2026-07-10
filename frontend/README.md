# Pathway — Interactive Learning Platform (Frontend Scaffold)

Homepage + auth pages for the Interactive Learning Platform (MERN) course project, built with **React (Vite) + Tailwind CSS v4 + react-router-dom**.

## What's included
- `src/pages/Home.jsx` — full homepage (hero, stats, features, how-it-works, featured courses, testimonials, CTA, footer)
- `src/pages/Login.jsx`, `src/pages/Signup.jsx` — auth pages (role toggle on signup: student / instructor)
- `src/components/` — all homepage sections as separate components
- `src/data/courses.js` — mock data to swap out once the Express/MongoDB API is ready

## Design
- Palette: ink navy `#14162B`, indigo-violet primary `#6C5CE7`, amber `#FFB238`, teal `#00B894`, on a cool paper background `#F3F4F8`
- Type: Space Grotesk (display), Inter (body), IBM Plex Mono (labels/data)
- Signature motif: a dotted "learning path" connecting numbered module nodes — ties directly to the Learning Path Management feature, reused in the hero graphic and the How It Works section

## Run it
```bash
npm install
npm run dev
```

## Next steps for the team
- Wire `Login.jsx` / `Signup.jsx` `handleSubmit` to your Express auth routes (`/api/auth/login`, `/api/auth/register`)
- Replace `src/data/courses.js` with real API calls once the Course Enrollment / Course Search modules are ready
- Add a `ProtectedRoute` wrapper once JWT/session auth is in place, and split Student vs Instructor dashboards into their own routes
