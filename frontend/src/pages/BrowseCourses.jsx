import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Users, BookOpen, X, RotateCcw, Star } from 'lucide-react'
import Navbar from '../components/Navbar.jsx'
import Footer from '../components/Footer.jsx'
import { courseService, adminService, authService, enrollmentService } from '../services/api.js'

const levelLabels = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

export default function BrowseCourses() {
  const navigate = useNavigate()
  const [courses, setCourses] = useState([])
  const [categories, setCategories] = useState([])
  const [instructors, setInstructors] = useState([])
  const [enrolledCourseIds, setEnrolledCourseIds] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [instructor, setInstructor] = useState('')
  const [level, setLevel] = useState('')

  const currentUser = authService.getCurrentUser()

  useEffect(() => {
    // Categories and instructors rarely change, fetch once
    adminService.getCategories().then(setCategories).catch(() => {})
    courseService.getActiveInstructors().then(setInstructors).catch(() => {})

    // Fetch enrolled course IDs if logged in as student
    if (currentUser && currentUser.role === 'student') {
      enrollmentService.getMyEnrollments()
        .then((data) => {
          const ids = data.map((e) => e.course?._id || e.course)
          setEnrolledCourseIds(ids)
        })
        .catch(() => {})
    }
  }, [])

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await courseService.getCourses({ search, category, level, instructor })
        setCourses(data)
      } catch (err) {
        setError(err.message || 'Failed to load courses')
      } finally {
        setLoading(false)
      }
    }

    // Small debounce so typing in the search box doesn't fire a request per keystroke
    const timeout = setTimeout(fetchCourses, 300)
    return () => clearTimeout(timeout)
  }, [search, category, level, instructor])

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`)
  }

  const handleClearFilters = () => {
    setSearch('')
    setCategory('')
    setInstructor('')
    setLevel('')
  }

  const hasActiveFilters = Boolean(search || category || instructor || level)

  return (
    <div className="min-h-screen bg-paper font-body text-ink">
      <Navbar />

      <main className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="max-w-2xl">
          <span className="font-mono text-xs uppercase tracking-wide text-primary">
            Course catalog
          </span>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Find your next learning path
          </h1>
          <p className="mt-3 text-ink-soft">
            {currentUser
              ? 'Browse published courses and enroll in a couple of clicks.'
              : 'Browse published courses. Log in as a student to enroll.'}
          </p>
        </div>

        {/* Filters */}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
          <div className="flex flex-1 min-w-[240px] items-center gap-2 rounded-full border border-line bg-paper-alt px-4 py-2.5">
            <Search size={16} className="text-slate" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full bg-transparent text-sm text-ink placeholder:text-slate focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-slate hover:text-ink"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-full border border-line bg-paper-alt px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={instructor}
            onChange={(e) => setInstructor(e.target.value)}
            className="rounded-full border border-line bg-paper-alt px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          >
            <option value="">All instructors</option>
            {instructors.map((inst) => (
              <option key={inst._id} value={inst._id}>
                {inst.name}
              </option>
            ))}
          </select>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            className="rounded-full border border-line bg-paper-alt px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
          >
            <option value="">All difficulty levels</option>
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2.5 text-xs font-semibold text-slate hover:border-red-300 hover:text-red-600 transition-colors"
            >
              <RotateCcw size={14} />
              Clear filters
            </button>
          )}
        </div>

        {/* Results */}
        <div className="mt-10">
          {loading && (
            <p className="py-16 text-center text-sm text-slate">Loading courses...</p>
          )}

          {!loading && error && (
            <div className="rounded-2xl border border-line bg-paper-alt p-8 text-center">
              <p className="text-sm text-red-600">{error}</p>
              <p className="mt-2 text-xs text-slate">
                Make sure the backend server is running on port 5000.
              </p>
            </div>
          )}

          {!loading && !error && courses.length === 0 && (
            <div className="rounded-2xl border border-line bg-paper-alt p-12 text-center">
              <BookOpen className="mx-auto text-slate" size={32} />
              <p className="mt-4 text-sm font-semibold text-ink">
                No courses found matching your search criteria.
              </p>
              <p className="mt-1 text-xs text-slate">
                Try adjusting your search terms or filters.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                  <RotateCcw size={14} /> Reset all filters
                </button>
              )}
            </div>
          )}

          {!loading && !error && courses.length > 0 && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <button
                  key={course._id}
                  onClick={() => handleCourseClick(course._id)}
                  className="flex flex-col rounded-2xl border border-line bg-paper-alt p-6 text-left transition-shadow hover:shadow-lg hover:shadow-ink/5"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-paper px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-slate">
                        {course.category?.name || 'General'}
                      </span>
                      {enrolledCourseIds.includes(course._id) && (
                        <span className="rounded-full bg-teal/10 px-2.5 py-1 font-mono text-[10px] font-bold text-teal uppercase tracking-wider border border-teal/10 animate-fade-in">
                          Enrolled
                        </span>
                      )}
                    </div>
                    <span className="rounded-full bg-primary-light px-2.5 py-1 font-mono text-[11px] text-primary-dark">
                      {levelLabels[course.level]}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-lg font-semibold leading-snug text-ink">
                    {course.title}
                  </h3>
                  
                  {/* Co-instructors */}
                  {course.coInstructors && course.coInstructors.length > 0 ? (
                    <p className="mt-1 text-xs text-slate">
                      {course.instructor?.name || 'Pathway Instructor'} (+ co-authors: {course.coInstructors.map(c => c.name).join(', ')})
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-slate">
                      {course.instructor?.name || 'Pathway Instructor'}
                    </p>
                  )}

                  <p className="mt-3 line-clamp-2 text-sm text-ink-soft leading-relaxed flex-1">
                    {course.description}
                  </p>

                  <div className="mt-4 flex items-center gap-4 text-xs text-slate">
                    <span className="flex items-center gap-1">
                      <Users size={14} />
                      {course.enrolledCount} enrolled
                    </span>
                    {course.reviewCount > 0 && (
                      <span className="flex items-center gap-1">
                        <Star size={14} className="fill-amber text-amber" />
                        {course.averageRating} ({course.reviewCount})
                      </span>
                    )}
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-line pt-4 w-full">
                    <span className="font-display text-base font-semibold text-ink">
                      {course.price > 0 ? `৳${course.price}` : 'Free'}
                    </span>
                    <span className="text-sm font-semibold text-primary">
                      {enrolledCourseIds.includes(course._id) ? 'Resume course →' : 'View course →'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
