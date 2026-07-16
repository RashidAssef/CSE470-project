import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Plus, 
  BookOpen, 
  Users, 
  DollarSign, 
  Layers, 
  AlertCircle, 
  X, 
  CheckCircle,
  FileText,
  Video
} from 'lucide-react';
import { authService, courseService, adminService } from '../services/api.js';

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [allInstructorsList, setAllInstructorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    totalCourses: 0,
    totalEnrolled: 0,
    activeCourses: 0
  });

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    price: 0,
    thumbnail: '',
    status: 'published',
    coInstructors: []
  });
  const [coInstructorSearch, setCoInstructorSearch] = useState('');
  const [coDropdownOpen, setCoDropdownOpen] = useState(false);

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      setError('');
      
      const currentUser = authService.getCurrentUser();
      if (!currentUser || currentUser.role !== 'instructor') {
        authService.logout();
        navigate('/login');
        return;
      }
      setUser(currentUser);

      try {
        // Fetch categories (instructors need them for course creation)
        const cats = await adminService.getCategories();
        setCategories(cats);

        // Fetch instructor courses if verified/active
        if (currentUser.status === 'active') {
          const instCourses = await courseService.getInstructorCourses();
          setCourses(instCourses);
          
          // Fetch other verified instructors for co-instructor selection
          const allInstructors = await courseService.getActiveInstructors();
          setAllInstructorsList(allInstructors.filter(inst => inst._id !== currentUser._id));

          // Calculate stats
          const total = instCourses.length;
          const enrolled = instCourses.reduce((acc, curr) => acc + (curr.enrolledCount || 0), 0);
          const active = instCourses.filter(c => c.status === 'published').length;
          
          setStats({
            totalCourses: total,
            totalEnrolled: enrolled,
            activeCourses: active
          });
        }
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    initDashboard();
  }, [navigate]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value
    }));
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setFormError('');

    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      setFormError('Please fill in all required fields (Title, Description, Category)');
      setSubmitLoading(false);
      return;
    }

    try {
      const newCourse = await courseService.createCourse(formData);
      setCourses(prev => [newCourse, ...prev]);
      
      // Update stats
      setStats(prev => ({
        totalCourses: prev.totalCourses + 1,
        totalEnrolled: prev.totalEnrolled,
        activeCourses: prev.activeCourses + (newCourse.status === 'published' ? 1 : 0)
      }));

      // Reset form and close modal
      setFormData({
        title: '',
        description: '',
        category: '',
        level: 'beginner',
        price: 0,
        thumbnail: '',
        status: 'published',
        coInstructors: []
      });
      setCoInstructorSearch('');
      setIsModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Failed to create course');
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-paper items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-semibold text-ink-soft">Loading instructor portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper text-ink font-body flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-line bg-paper-alt px-6 md:px-12 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-paper-alt">
            <BookOpen size={20} className="text-white" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">
            Pathway Instructor<span className="text-primary">.</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-semibold text-ink">{user?.name}</span>
            <span className="text-[10px] text-slate uppercase tracking-wider">{user?.status} account</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-red-100 bg-red-50 px-3.5 py-2 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors"
          >
            <LogOut size={14} /> Log Out
          </button>
        </div>
      </header>

      {/* Main Body container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-10 flex flex-col gap-8">
        {/* Welcome Section & Status Alert */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">
              Welcome Back, {user?.name}
            </h1>
            <p className="text-sm text-slate mt-1">
              Manage your courses, view enrollments, and upload new materials.
            </p>
          </div>

          {user?.status === 'active' && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 rounded-xl bg-primary text-white px-5 py-3 text-sm font-semibold hover:bg-primary-dark shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus size={16} /> New Course
            </button>
          )}
        </div>

        {/* Pending Verification Notice */}
        {user?.status !== 'active' ? (
          <div className="bg-amber/10 border border-amber/20 rounded-2xl p-6 flex flex-col md:flex-row items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber/20 text-amber-dark flex items-center justify-center shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold text-amber-dark">
                Account Status: Pending Admin Verification
              </h3>
              <p className="text-sm text-ink-soft mt-1 leading-relaxed">
                Thank you for signing up as an instructor on Pathway! To ensure quality and trust in our platform, all instructor profiles must be approved by an administrator before creating courses.
              </p>
              <div className="mt-4 text-xs font-semibold uppercase tracking-wider text-slate">
                Please wait up to 24 hours. Once verified, all creation tools will unlock automatically.
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-paper-alt border border-line p-6 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-slate uppercase tracking-wider">Total Courses</p>
                  <h3 className="text-3xl font-bold mt-1.5">{stats.totalCourses}</h3>
                </div>
                <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Layers size={24} />
                </div>
              </div>

              <div className="bg-paper-alt border border-line p-6 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-slate uppercase tracking-wider">Active/Published</p>
                  <h3 className="text-3xl font-bold mt-1.5 text-teal">{stats.activeCourses}</h3>
                </div>
                <div className="h-12 w-12 bg-teal/10 text-teal rounded-xl flex items-center justify-center">
                  <CheckCircle size={24} />
                </div>
              </div>

              <div className="bg-paper-alt border border-line p-6 rounded-2xl flex items-center justify-between shadow-sm">
                <div>
                  <p className="text-xs font-bold text-slate uppercase tracking-wider">Enrolled Students</p>
                  <h3 className="text-3xl font-bold mt-1.5 text-purple-700">{stats.totalEnrolled}</h3>
                </div>
                <div className="h-12 w-12 bg-purple-50 text-purple-700 rounded-xl flex items-center justify-center">
                  <Users size={24} />
                </div>
              </div>
            </div>

            {/* Courses Section */}
            <div>
              <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
                My Course Catalog ({courses.length})
              </h2>

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 mb-6">
                  <AlertCircle size={16} /> {error}
                </div>
              )}

              {courses.length === 0 ? (
                <div className="border border-dashed border-line rounded-2xl bg-paper-alt p-12 text-center shadow-sm">
                  <BookOpen className="mx-auto text-slate mb-4" size={40} />
                  <h3 className="font-semibold text-lg">No courses created yet</h3>
                  <p className="text-sm text-slate mt-1 max-w-sm mx-auto">
                    You haven't added any learning materials to the system yet. Click the "New Course" button to start.
                  </p>
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary text-white px-4 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors"
                  >
                    <Plus size={16} /> Create Your First Course
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {courses.map((course) => (
                    <div 
                      key={course._id} 
                      className="bg-paper-alt border border-line rounded-2xl p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] font-bold text-slate uppercase tracking-wider bg-paper px-2.5 py-1 rounded-full border border-line">
                            {course.category?.name || 'Uncategorized'}
                          </span>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                            course.status === 'published'
                              ? 'bg-teal/10 text-teal border-teal/10'
                              : 'bg-slate/10 text-slate border-slate/15'
                          }`}>
                            {course.status}
                          </span>
                        </div>

                        <h3 className="font-display text-lg font-bold mt-4 line-clamp-1 text-ink">
                          {course.title}
                        </h3>
                        <p className="text-xs text-slate mt-1 capitalize">{course.level} Level</p>
                        
                        {/* Display co-instructors */}
                        {course.coInstructors && course.coInstructors.length > 0 && (
                          <p className="text-[10px] text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100 mt-1.5 w-fit">
                            Co-instructors: {course.coInstructors.map(c => c.name).join(', ')}
                          </p>
                        )}

                        <p className="text-sm text-ink-soft mt-3 line-clamp-3 leading-relaxed">
                          {course.description}
                        </p>
                      </div>

                      <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs text-slate">
                        <span className="flex items-center gap-1 font-semibold text-ink">
                          <Users size={14} className="text-primary" />
                          {course.enrolledCount} enrolled
                        </span>
                        <span className="font-display text-sm font-bold text-ink">
                          {course.price > 0 ? `৳${course.price}` : 'Free'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {/* CREATE COURSE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-2xl bg-paper-alt rounded-2xl shadow-xl border border-line flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
                <Plus size={20} className="text-primary" />
                Create New Course
              </h2>
              <button 
                onClick={() => { setIsModalOpen(false); setCoInstructorSearch(''); }}
                className="p-1 text-slate hover:text-ink rounded-lg hover:bg-paper transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body (Scrollable Form) */}
            <form onSubmit={handleCreateCourse} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
              {formError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center gap-2 text-sm">
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Master React in 30 Days"
                  required
                  maxLength={120}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5">
                  Course Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Write a detailed description of what students will learn, course requirements, and curriculum..."
                  required
                  rows={4}
                  maxLength={2000}
                  className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5">
                    Difficulty Level
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>

              {/* Co-Instructors Selection Checkboxes */}
              <div className="relative">
                <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5">
                  Co-Instructors (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setCoDropdownOpen(!coDropdownOpen)}
                  className="w-full flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink text-left focus:border-primary focus:outline-none"
                >
                  <span className="truncate">
                    {formData.coInstructors.length === 0
                      ? 'Select Co-Instructors'
                      : `${formData.coInstructors.length} co-instructor(s) selected`}
                  </span>
                  <span className="text-slate text-xs">▼</span>
                </button>

                {coDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setCoDropdownOpen(false)} />
                    <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-line bg-paper-alt shadow-lg p-2 max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-100">
                      <input
                        type="text"
                        value={coInstructorSearch}
                        onChange={(e) => setCoInstructorSearch(e.target.value)}
                        placeholder="Search co-instructors..."
                        className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-slate focus:border-primary focus:outline-none mb-2"
                      />
                      <div className="overflow-y-auto flex flex-col gap-1.5 max-h-40 p-1">
                        {allInstructorsList.length === 0 ? (
                          <span className="text-xs text-slate p-2">No other verified instructors available</span>
                        ) : allInstructorsList
                            .filter(inst =>
                              inst.name.toLowerCase().includes(coInstructorSearch.toLowerCase()) ||
                              inst.email.toLowerCase().includes(coInstructorSearch.toLowerCase())
                            ).length === 0 ? (
                          <span className="text-xs text-slate p-2">No instructors match your search</span>
                        ) : (
                          allInstructorsList
                            .filter(inst =>
                              inst.name.toLowerCase().includes(coInstructorSearch.toLowerCase()) ||
                              inst.email.toLowerCase().includes(coInstructorSearch.toLowerCase())
                            )
                            .map(inst => (
                              <label key={inst._id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-ink-soft cursor-pointer hover:bg-paper rounded-lg transition-colors">
                                <input
                                  type="checkbox"
                                  checked={formData.coInstructors.includes(inst._id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setFormData(prev => ({
                                        ...prev,
                                        coInstructors: [...prev.coInstructors, inst._id]
                                      }));
                                    } else {
                                      setFormData(prev => ({
                                        ...prev,
                                        coInstructors: prev.coInstructors.filter(id => id !== inst._id)
                                      }));
                                    }
                                  }}
                                  className="rounded border-line text-primary focus:ring-primary h-3.5 w-3.5"
                                />
                                <span>{inst.name} ({inst.email})</span>
                              </label>
                            ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5">
                    Price (৳ BDT)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate text-sm font-semibold">
                      ৳
                    </span>
                    <input
                      type="number"
                      name="price"
                      min={0}
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="0 for Free"
                      className="w-full rounded-xl border border-line bg-paper pl-8 pr-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate uppercase tracking-wider block mb-1.5">
                    Publish Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                  >
                    <option value="published">Publish Immediately</option>
                    <option value="draft">Save as Draft</option>
                  </select>
                </div>
              </div>



              {/* Modal Footer Buttons */}
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setCoInstructorSearch(''); }}
                  className="px-5 py-2.5 border border-line text-sm font-semibold rounded-xl text-ink-soft hover:bg-paper transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-5 py-2.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-all disabled:opacity-70 flex items-center gap-1.5"
                >
                  {submitLoading && <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>}
                  Create Course
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
