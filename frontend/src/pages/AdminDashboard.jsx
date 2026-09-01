import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  CheckCircle,
  FolderPlus,
  Trash2,
  Edit2,
  Search,
  ShieldCheck,
  UserX,
  LogOut,
  Settings,
  Plus,
  FolderOpen,
  X,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { adminService, authService, courseService, enrollmentService } from '../services/api.js';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('users');
  const [adminUser, setAdminUser] = useState(null);

  // Stats State
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    activeInstructors: 0,
    pendingInstructors: 0,
    totalCategories: 0
  });

  // User Management State
  const [users, setUsers] = useState([]);
  const [userFilters, setUserFilters] = useState({ role: '', status: '', search: '' });
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState('');

  // Category State
  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryError, setCategoryError] = useState('');

  // Course State
  const [courses, setCourses] = useState([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [coursesError, setCoursesError] = useState('');
  const [activeInstructors, setActiveInstructors] = useState([]);
  const [courseForm, setCourseForm] = useState({
    title: '',
    description: '',
    category: '',
    level: 'beginner',
    price: 0,
    thumbnail: '',
    status: 'published',
    instructor: '',
    coInstructors: []
  });
  const [courseSubmitLoading, setCourseSubmitLoading] = useState(false);
  const [courseFormError, setCourseFormError] = useState('');

  // Members Modal State
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [courseEnrollments, setCourseEnrollments] = useState([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false);
  const [membersModalOpen, setMembersModalOpen] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [memberActionLoading, setMemberActionLoading] = useState(false);
  const [modalInstructorsForm, setModalInstructorsForm] = useState({
    instructor: '',
    coInstructors: []
  });
  const [adminPrimaryInstructorSearch, setAdminPrimaryInstructorSearch] = useState('');
  const [adminCoInstructorSearch, setAdminCoInstructorSearch] = useState('');
  const [adminModalCoInstructorSearch, setAdminModalCoInstructorSearch] = useState('');
  const [adminPrimaryDropdownOpen, setAdminPrimaryDropdownOpen] = useState(false);
  const [adminCoDropdownOpen, setAdminCoDropdownOpen] = useState(false);
  const [adminModalCoDropdownOpen, setAdminModalCoDropdownOpen] = useState(false);
  const [adminModalCoInstructorsDropdownOpen, setAdminModalCoInstructorsDropdownOpen] = useState(false);
  
  // Student Enrollment State
  const [activeStudents, setActiveStudents] = useState([]);
  const [adminStudentSearch, setAdminStudentSearch] = useState('');
  const [adminStudentDropdownOpen, setAdminStudentDropdownOpen] = useState(false);
  const [selectedStudentsToEnroll, setSelectedStudentsToEnroll] = useState([]);

  // Authentication Load
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user && user.role === 'admin') {
      setAdminUser(user);
    } else {
      navigate('/login');
    }
  }, [navigate]);

  // Load Data on Tab Switch
  useEffect(() => {
    if (activeTab === 'users' || activeTab === 'approvals') {
      loadUsers();
    } else if (activeTab === 'categories') {
      loadCategories();
    } else if (activeTab === 'courses') {
      loadCourses();
      loadActiveInstructors();
      loadActiveStudents();
      loadCategories();
    }
    loadStats();
  }, [activeTab, userFilters]);

  // Sync Modal Instructors Form when course is selected/updated
  useEffect(() => {
    if (selectedCourse) {
      setModalInstructorsForm({
        instructor: selectedCourse.instructor?._id || selectedCourse.instructor || '',
        coInstructors: selectedCourse.coInstructors?.map(c => c._id || c) || []
      });
    }
  }, [selectedCourse]);

  // Logout Handler
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Load Stats Summary
  const loadStats = async () => {
    try {
      const allUsers = await adminService.getUsers();
      const allCats = await adminService.getCategories();

      const students = allUsers.filter(u => u.role === 'student');
      const instructors = allUsers.filter(u => u.role === 'instructor');
      const pending = instructors.filter(u => u.status === 'pending');
      const activeInst = instructors.filter(u => u.status === 'active');

      setStats({
        totalUsers: allUsers.length,
        totalStudents: students.length,
        activeInstructors: activeInst.length,
        pendingInstructors: pending.length,
        totalCategories: allCats.length
      });
    } catch (err) {
      console.error('Failed to load stats:', err.message);
    }
  };

  // Load Users List
  const loadUsers = async () => {
    setUserLoading(true);
    setUserError('');
    try {
      const filterObj = { ...userFilters };
      // If we are on approvals tab, force filter to pending instructors
      if (activeTab === 'approvals') {
        filterObj.role = 'instructor';
        filterObj.status = 'pending';
      }
      const data = await adminService.getUsers(filterObj);
      setUsers(data);
    } catch (err) {
      setUserError(err.message || 'Failed to retrieve users');
    } finally {
      setUserLoading(false);
    }
  };

  // Update Account Status (Approve/Suspend)
  const handleStatusChange = async (userId, newStatus) => {
    if (userId === adminUser?._id) return;
    try {
      await adminService.updateUserStatus(userId, newStatus);
      loadUsers();
      loadStats();
    } catch (err) {
      alert(err.message || 'Failed to update user status');
    }
  };

  // Delete User
  const handleDeleteUser = async (userId) => {
    if (userId === adminUser?._id) return;
    if (!window.confirm('Are you sure you want to permanently delete this user account? This cannot be undone.')) {
      return;
    }
    try {
      await adminService.deleteUser(userId);
      loadUsers();
      loadStats();
    } catch (err) {
      alert(err.message || 'Failed to delete user');
    }
  };

  // Load Categories
  const loadCategories = async () => {
    setCategoryLoading(true);
    setCategoryError('');
    try {
      const data = await adminService.getCategories();
      setCategories(data);
    } catch (err) {
      setCategoryError(err.message || 'Failed to retrieve categories');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Create or Update Category
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryForm.name || !categoryForm.description) return;
    setCategoryLoading(true);
    setCategoryError('');

    try {
      if (editingCategory) {
        await adminService.updateCategory(editingCategory._id, categoryForm.name, categoryForm.description);
        setEditingCategory(null);
      } else {
        await adminService.createCategory(categoryForm.name, categoryForm.description);
      }
      setCategoryForm({ name: '', description: '' });
      loadCategories();
      loadStats();
    } catch (err) {
      setCategoryError(err.message || 'Failed to save category');
    } finally {
      setCategoryLoading(false);
    }
  };

  // Delete Category
  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Delete this course category? Instructors will no longer be able to select it.')) {
      return;
    }
    try {
      await adminService.deleteCategory(categoryId);
      loadCategories();
      loadStats();
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    }
  };

  // Load Courses
  const loadCourses = async () => {
    setCoursesLoading(true);
    setCoursesError('');
    try {
      const data = await courseService.getCourses();
      setCourses(data);
    } catch (err) {
      setCoursesError(err.message || 'Failed to retrieve courses');
    } finally {
      setCoursesLoading(false);
    }
  };

  // Load Active Instructors
  const loadActiveInstructors = async () => {
    try {
      const data = await courseService.getActiveInstructors();
      setActiveInstructors(data);
    } catch (err) {
      console.error('Failed to load active instructors:', err.message);
    }
  };

  // Load Active Students
  const loadActiveStudents = async () => {
    try {
      const data = await adminService.getUsers({ role: 'student', status: 'active' });
      setActiveStudents(data);
    } catch (err) {
      console.error('Failed to load active students:', err.message);
    }
  };

  // Create Course (Admin)
  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    if (!courseForm.title || !courseForm.description || !courseForm.category || !courseForm.instructor) {
      setCourseFormError('Please fill in all required fields');
      return;
    }
    setCourseSubmitLoading(true);
    setCourseFormError('');

    try {
      await courseService.createCourse(courseForm);
      setCourseForm({
        title: '',
        description: '',
        category: '',
        level: 'beginner',
        price: 0,
        thumbnail: '',
        status: 'published',
        instructor: '',
        coInstructors: []
      });
      setAdminPrimaryInstructorSearch('');
      setAdminCoInstructorSearch('');
      loadCourses();
      loadStats();
    } catch (err) {
      setCourseFormError(err.message || 'Failed to create course');
    } finally {
      setCourseSubmitLoading(false);
    }
  };

  // Open Course Members Management Modal
  const handleOpenMembersModal = async (course) => {
    setSelectedCourse(course);
    setMembersModalOpen(true);
    setMembersError('');
    setEnrollmentsLoading(true);
    try {
      const data = await enrollmentService.getCourseEnrollments(course._id);
      setCourseEnrollments(data);
    } catch (err) {
      setMembersError(err.message || 'Failed to load course enrollments');
    } finally {
      setEnrollmentsLoading(false);
    }
  };

  // Admin removes student from course
  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student from the course?')) return;
    setMemberActionLoading(true);
    try {
      await enrollmentService.removeStudentFromCourse(selectedCourse._id, studentId);
      // Reload enrollments
      const data = await enrollmentService.getCourseEnrollments(selectedCourse._id);
      setCourseEnrollments(data);
      // Reload courses list to update enrolledCount
      loadCourses();
    } catch (err) {
      alert(err.message || 'Failed to remove student');
    } finally {
      setMemberActionLoading(false);
    }
  };

  // Admin enrolls student to course
  const handleEnrollStudent = async (studentId) => {
    setMemberActionLoading(true);
    setMembersError('');
    try {
      await enrollmentService.enrollStudentInCourse(selectedCourse._id, studentId);
      // Reload enrollments
      const data = await enrollmentService.getCourseEnrollments(selectedCourse._id);
      setCourseEnrollments(data);
      // Reload courses list to update enrolledCount
      loadCourses();
    } catch (err) {
      setMembersError(err.message || 'Failed to enroll student');
    } finally {
      setMemberActionLoading(false);
    }
  };

  // Admin enrolls multiple students in bulk
  const handleEnrollStudentsBulk = async () => {
    if (selectedStudentsToEnroll.length === 0) return;
    setMemberActionLoading(true);
    setMembersError('');
    try {
      await enrollmentService.enrollStudentsInCourseBulk(selectedCourse._id, selectedStudentsToEnroll);
      setSelectedStudentsToEnroll([]);
      setAdminStudentDropdownOpen(false);
      // Reload enrollments
      const data = await enrollmentService.getCourseEnrollments(selectedCourse._id);
      setCourseEnrollments(data);
      // Reload courses list to update enrolledCount
      loadCourses();
    } catch (err) {
      setMembersError(err.message || 'Failed to enroll selected students');
    } finally {
      setMemberActionLoading(false);
    }
  };

  // Save Modal Instructors (Primary + Co)
  const handleSaveInstructors = async () => {
    if (!modalInstructorsForm.instructor) {
      alert('Primary instructor is required');
      return;
    }
    setMemberActionLoading(true);
    try {
      const updated = await courseService.updateCourseInstructors(selectedCourse._id, modalInstructorsForm);
      setSelectedCourse(updated);
      loadCourses(); // reload main page list
      alert('Instructors updated successfully!');
    } catch (err) {
      alert(err.message || 'Failed to update instructors');
    } finally {
      setMemberActionLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-paper text-ink font-body">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-line bg-paper-alt flex flex-col justify-between p-6">
        <div>
          {/* Brand Logo */}
          <div className="flex items-center gap-2 mb-10">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-paper-alt">
              <ShieldCheck size={20} className="text-primary-light" />
            </span>
            <span className="font-display text-lg font-semibold tracking-tight">
              Pathway Admin<span className="text-primary">.</span>
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-colors ${
                activeTab === 'users'
                  ? 'bg-primary-light text-primary'
                  : 'text-ink-soft hover:bg-paper hover:text-ink'
              }`}
            >
              <Users size={18} />
              User Directory
            </button>

            <button
              onClick={() => setActiveTab('approvals')}
              className={`flex items-center justify-between px-4 py-3 text-sm font-semibold rounded-xl text-left transition-colors ${
                activeTab === 'approvals'
                  ? 'bg-primary-light text-primary'
                  : 'text-ink-soft hover:bg-paper hover:text-ink'
              }`}
            >
              <div className="flex items-center gap-3">
                <CheckCircle size={18} />
                <span>Approvals</span>
              </div>
              {stats.pendingInstructors > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-amber px-1.5 text-[10px] font-bold text-ink">
                  {stats.pendingInstructors}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-colors ${
                activeTab === 'categories'
                  ? 'bg-primary-light text-primary'
                  : 'text-ink-soft hover:bg-paper hover:text-ink'
              }`}
            >
              <FolderPlus size={18} />
              Course Categories
            </button>

            <button
              onClick={() => setActiveTab('courses')}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left transition-colors ${
                activeTab === 'courses'
                  ? 'bg-primary-light text-primary'
                  : 'text-ink-soft hover:bg-paper hover:text-ink'
              }`}
            >
              <BookOpen size={18} />
              Manage Courses
            </button>
          </nav>
        </div>

        {/* Admin Meta / Logout */}
        <div className="border-t border-line pt-4 flex flex-col gap-3">
          <div className="flex items-center gap-3 px-2">
            <div className="h-8 w-8 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
              AD
            </div>
            <div>
              <p className="text-xs font-semibold text-ink line-clamp-1">{adminUser?.name || 'Admin User'}</p>
              <p className="text-[10px] text-slate line-clamp-1">{adminUser?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-left text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Log Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 border-b border-line bg-paper-alt px-8 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold capitalize text-ink">
            {activeTab === 'users' ? 'User Directory' : activeTab === 'approvals' ? 'Instructor Verification' : activeTab === 'categories' ? 'Course Categories' : 'Manage Courses'}
          </h2>
          <div className="flex items-center gap-3">
            <Link
              to="/admin/analytics"
              className="text-xs font-semibold bg-paper text-ink-soft px-3 py-1.5 rounded-full border border-line hover:border-primary hover:text-primary transition-colors"
            >
              View analytics
            </Link>
            <div className="text-xs font-semibold bg-primary-light text-primary px-3 py-1.5 rounded-full border border-primary/10">
              System Online (MERN)
            </div>
          </div>
        </header>

        {/* Dashboard Content Container */}
        <div className="flex-1 p-8 overflow-y-auto">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-paper-alt border border-line p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate uppercase tracking-wider">Total Users</p>
                <h3 className="text-2xl font-bold mt-1 text-ink">{stats.totalUsers}</h3>
              </div>
              <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                <Users size={24} />
              </div>
            </div>

            <div className="bg-paper-alt border border-line p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate uppercase tracking-wider">Total Students</p>
                <h3 className="text-2xl font-bold mt-1 text-ink">{stats.totalStudents}</h3>
              </div>
              <div className="h-12 w-12 bg-teal/10 text-teal rounded-xl flex items-center justify-center">
                <CheckCircle size={24} />
              </div>
            </div>

            <div className="bg-paper-alt border border-line p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate uppercase tracking-wider">Verified Instructors</p>
                <h3 className="text-2xl font-bold mt-1 text-ink">{stats.activeInstructors}</h3>
              </div>
              <div className="h-12 w-12 bg-primary-light text-primary rounded-xl flex items-center justify-center">
                <ShieldCheck size={24} />
              </div>
            </div>

            <div className="bg-paper-alt border border-line p-5 rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate uppercase tracking-wider">Pending Approvals</p>
                <h3 className={`text-2xl font-bold mt-1 ${stats.pendingInstructors > 0 ? 'text-amber-dark' : 'text-ink'}`}>
                  {stats.pendingInstructors}
                </h3>
              </div>
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${stats.pendingInstructors > 0 ? 'bg-amber/10 text-amber-dark animate-pulse' : 'bg-paper text-slate'}`}>
                <AlertCircle size={24} />
              </div>
            </div>
          </div>

          {/* TAB CONTENT: USER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="bg-paper-alt border border-line rounded-2xl p-6 shadow-sm">
              {/* Search & Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between items-center">
                <div className="relative w-full md:w-96">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate">
                    <Search size={18} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={userFilters.search}
                    onChange={(e) => setUserFilters({ ...userFilters, search: e.target.value })}
                    className="w-full rounded-xl border border-line bg-paper pl-11 pr-4 py-2.5 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                  <select
                    value={userFilters.role}
                    onChange={(e) => setUserFilters({ ...userFilters, role: e.target.value })}
                    className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink-soft focus:outline-none"
                  >
                    <option value="">All Roles</option>
                    <option value="student">Students</option>
                    <option value="instructor">Instructors</option>
                    <option value="admin">Admins</option>
                  </select>

                  <select
                    value={userFilters.status}
                    onChange={(e) => setUserFilters({ ...userFilters, status: e.target.value })}
                    className="rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink-soft focus:outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>

              {/* Users Table */}
              {userError && (
                <div className="mb-4 p-4 rounded-xl bg-red-50 text-sm text-red-600 border border-red-100 flex items-center gap-2">
                  <AlertCircle size={16} /> {userError}
                </div>
              )}

              {userLoading ? (
                <div className="flex flex-col items-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-xs text-slate mt-2">Loading user data...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate text-sm">
                  No users found matching the selected criteria.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-line text-xs font-semibold text-slate uppercase bg-paper/50">
                        <th className="py-4 px-4">User Details</th>
                        <th className="py-4 px-4">Role</th>
                        <th className="py-4 px-4">Status</th>
                        <th className="py-4 px-4">Registered Date</th>
                        <th className="py-4 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line text-sm">
                      {users.map((user) => (
                        <tr key={user._id} className="hover:bg-paper/20">
                          <td className="py-4 px-4">
                            <p className="font-semibold text-ink">{user.name}</p>
                            <p className="text-xs text-slate">{user.email}</p>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                              user.role === 'admin'
                                ? 'bg-red-50 text-red-700 border border-red-100'
                                : user.role === 'instructor'
                                ? 'bg-purple-50 text-purple-700 border border-purple-100'
                                : 'bg-blue-50 text-blue-700 border border-blue-100'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                              user.status === 'active'
                                ? 'text-teal bg-teal/10'
                                : user.status === 'pending'
                                ? 'text-amber-dark bg-amber/10'
                                : 'text-red-600 bg-red-50'
                            }`}>
                              {user.status || 'active'}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-xs text-slate">
                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-4 px-4 text-right">
                            {user._id !== adminUser?._id ? (
                              <div className="flex justify-end gap-2">
                                {/* Suspend / Unsuspend */}
                                {user.status === 'suspended' ? (
                                  <button
                                    onClick={() => handleStatusChange(user._id, 'active')}
                                    className="p-1.5 text-teal hover:bg-teal/10 rounded-lg transition-colors"
                                    title="Unsuspend/Activate Account"
                                  >
                                    <CheckCircle size={16} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStatusChange(user._id, 'suspended')}
                                    className="p-1.5 text-amber-dark hover:bg-amber/10 rounded-lg transition-colors"
                                    title="Suspend Account"
                                  >
                                    <UserX size={16} />
                                  </button>
                                )}

                                {/* Delete User */}
                                <button
                                  onClick={() => handleDeleteUser(user._id)}
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Delete Account"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ) : (
                              <span className="text-xs text-slate italic px-2">You (Current Admin)</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: INSTRUCTOR VERIFICATIONS */}
          {activeTab === 'approvals' && (
            <div className="bg-paper-alt border border-line rounded-2xl p-6 shadow-sm">
              <p className="text-sm text-slate mb-6">
                The following users signed up as **Instructors** and are pending verification. Approve them to grant access to course creation tools.
              </p>

              {userLoading ? (
                <div className="flex flex-col items-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                  <p className="text-xs text-slate mt-2">Loading registrations...</p>
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-12 text-slate text-sm bg-paper/20 rounded-xl border border-dashed border-line">
                  No pending instructor verifications at this time.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {users.map((instructor) => (
                    <div key={instructor._id} className="border border-line rounded-2xl p-5 hover:border-primary/40 transition-all bg-paper/10 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold text-ink text-base">{instructor.name}</h4>
                            <p className="text-xs text-slate mt-0.5">{instructor.email}</p>
                          </div>
                          <span className="bg-amber/10 text-amber-dark text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-amber/15 animate-pulse">
                            Pending Approval
                          </span>
                        </div>
                        <div className="mt-4 text-xs text-slate bg-paper-alt border border-line rounded-xl p-3">
                          <p><strong>Registration Date:</strong> {new Date(instructor.createdAt).toLocaleString()}</p>
                        </div>
                      </div>

                      <div className="flex gap-3 mt-6">
                        <button
                          onClick={() => handleStatusChange(instructor._id, 'active')}
                          className="flex-1 bg-primary text-white text-xs font-semibold py-2.5 px-4 rounded-xl transition-colors hover:bg-primary-dark shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle size={14} /> Approve Instructor
                        </button>
                        <button
                          onClick={() => handleDeleteUser(instructor._id)}
                          className="px-4 py-2.5 border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-1"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB CONTENT: CATEGORY MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Category CRUD Form (1/3 Width) */}
              <div className="bg-paper-alt border border-line rounded-2xl p-6 shadow-sm h-fit">
                <h3 className="font-display text-lg font-semibold mb-4 text-ink flex items-center gap-2">
                  <FolderOpen size={18} className="text-primary" />
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h3>

                {categoryError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-600 border border-red-100 flex items-center gap-2">
                    <AlertCircle size={14} /> {categoryError}
                  </div>
                )}

                <form onSubmit={handleCategorySubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="catName" className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                      Category Name
                    </label>
                    <input
                      id="catName"
                      type="text"
                      placeholder="e.g., Development, Design"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      required
                      className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label htmlFor="catDesc" className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                      Description
                    </label>
                    <textarea
                      id="catDesc"
                      placeholder="Brief description of courses in this category..."
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      required
                      rows={4}
                      className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none resize-none"
                    />
                  </div>

                  <div className="flex gap-2.5 mt-2">
                    <button
                      type="submit"
                      disabled={categoryLoading}
                      className="flex-1 bg-primary text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors hover:bg-primary-dark shadow-sm disabled:opacity-75"
                    >
                      {editingCategory ? 'Update Category' : 'Add Category'}
                    </button>
                    
                    {editingCategory && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCategory(null);
                          setCategoryForm({ name: '', description: '' });
                        }}
                        className="px-3 border border-line text-slate hover:bg-paper rounded-xl transition-colors"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </form>
              </div>

              {/* Categories list (2/3 Width) */}
              <div className="lg:col-span-2 bg-paper-alt border border-line rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold mb-4 text-ink">
                  Existing Categories ({categories.length})
                </h3>

                {categoryLoading && categories.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-xs text-slate mt-2">Retrieving categories...</p>
                  </div>
                ) : categories.length === 0 ? (
                  <div className="text-center py-12 text-slate text-sm border border-dashed border-line rounded-xl">
                    No categories have been created yet. Create one on the left.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categories.map((cat) => (
                      <div key={cat._id} className="border border-line rounded-xl p-4 bg-paper/10 flex flex-col justify-between hover:border-primary/45 transition-colors">
                        <div>
                          <div className="flex justify-between items-start">
                            <h4 className="font-semibold text-ink text-base">{cat.name}</h4>
                            <span className="text-[10px] font-mono text-slate bg-paper px-2 py-0.5 rounded border border-line">
                              {cat.slug}
                            </span>
                          </div>
                          <p className="text-xs text-ink-soft mt-2 line-clamp-3 leading-relaxed">
                            {cat.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-3 border-t border-line/60">
                          <span className="text-[10px] text-slate">
                            Created by: {cat.createdBy?.name || 'Admin'}
                          </span>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setCategoryForm({ name: cat.name, description: cat.description });
                              }}
                              className="p-1 text-primary hover:bg-primary-light rounded transition-colors"
                              title="Edit Category"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(cat._id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Delete Category"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB CONTENT: COURSE MANAGEMENT */}
          {activeTab === 'courses' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Course creation form */}
              <div className="bg-paper-alt border border-line rounded-2xl p-6 shadow-sm h-fit">
                <h3 className="font-display text-lg font-semibold mb-4 text-ink flex items-center gap-2">
                  <Plus size={18} className="text-primary" />
                  Create Course & Invite
                </h3>

                {courseFormError && (
                  <div className="mb-4 p-3 rounded-xl bg-red-50 text-xs text-red-600 border border-red-100 flex items-center gap-2">
                    <AlertCircle size={14} /> {courseFormError}
                  </div>
                )}

                <form onSubmit={handleCourseSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                      Course Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Advanced Machine Learning"
                      value={courseForm.title}
                      onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                      required
                      maxLength={120}
                      className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                      Description *
                    </label>
                    <textarea
                      placeholder="Course description..."
                      value={courseForm.description}
                      onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                      required
                      rows={3}
                      maxLength={2000}
                      className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink placeholder:text-slate focus:border-primary focus:outline-none resize-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                      Category *
                    </label>
                    <select
                      value={courseForm.category}
                      onChange={(e) => setCourseForm({ ...courseForm, category: e.target.value })}
                      required
                      className="w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Searchable Primary Instructor Dropdown */}
                  <div className="relative">
                    <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                      Primary Instructor *
                    </label>
                    <button
                      type="button"
                      onClick={() => setAdminPrimaryDropdownOpen(!adminPrimaryDropdownOpen)}
                      className="w-full flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink text-left focus:border-primary focus:outline-none"
                    >
                      <span className="truncate">
                        {courseForm.instructor
                          ? activeInstructors.find(inst => inst._id === courseForm.instructor)?.name || 'Select Instructor'
                          : 'Select Instructor'}
                      </span>
                      <span className="text-slate text-xs">▼</span>
                    </button>

                    {adminPrimaryDropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setAdminPrimaryDropdownOpen(false)} />
                        <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-line bg-paper-alt shadow-lg p-2 max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-100">
                          <input
                            type="text"
                            value={adminPrimaryInstructorSearch}
                            onChange={(e) => setAdminPrimaryInstructorSearch(e.target.value)}
                            placeholder="Type to search..."
                            className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-slate focus:border-primary focus:outline-none mb-2"
                          />
                          <div className="overflow-y-auto flex flex-col gap-1 max-h-40">
                            {activeInstructors.filter(inst =>
                              inst.name.toLowerCase().includes(adminPrimaryInstructorSearch.toLowerCase()) ||
                              inst.email.toLowerCase().includes(adminPrimaryInstructorSearch.toLowerCase())
                            ).length === 0 ? (
                              <span className="text-xs text-slate p-2">No instructors found</span>
                            ) : (
                              activeInstructors
                                .filter(inst =>
                                  inst.name.toLowerCase().includes(adminPrimaryInstructorSearch.toLowerCase()) ||
                                  inst.email.toLowerCase().includes(adminPrimaryInstructorSearch.toLowerCase())
                                )
                                .map(inst => (
                                  <button
                                    key={inst._id}
                                    type="button"
                                    onClick={() => {
                                      setCourseForm(prev => ({ ...prev, instructor: inst._id, coInstructors: [] }));
                                      setAdminPrimaryDropdownOpen(false);
                                      setAdminPrimaryInstructorSearch('');
                                    }}
                                    className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-primary-light hover:text-primary transition-colors ${
                                      courseForm.instructor === inst._id ? 'bg-primary-light text-primary font-semibold' : 'text-ink-soft'
                                    }`}
                                  >
                                    {inst.name} ({inst.email})
                                  </button>
                                ))
                            )}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Searchable Co-Instructors Dropdown */}
                  {courseForm.instructor && (
                    <div className="relative">
                      <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                        Co-Instructors (Optional)
                      </label>
                      <button
                        type="button"
                        onClick={() => setAdminCoDropdownOpen(!adminCoDropdownOpen)}
                        className="w-full flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink text-left focus:border-primary focus:outline-none"
                      >
                        <span className="truncate">
                          {courseForm.coInstructors.length === 0
                            ? 'Select Co-Instructors'
                            : `${courseForm.coInstructors.length} co-instructor(s) selected`}
                        </span>
                        <span className="text-slate text-xs">▼</span>
                      </button>

                      {adminCoDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setAdminCoDropdownOpen(false)} />
                          <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-line bg-paper-alt shadow-lg p-2 max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-100">
                            <input
                              type="text"
                              value={adminCoInstructorSearch}
                              onChange={(e) => setAdminCoInstructorSearch(e.target.value)}
                              placeholder="Type to search..."
                              className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-slate focus:border-primary focus:outline-none mb-2"
                            />
                            <div className="overflow-y-auto flex flex-col gap-1.5 max-h-40 p-1">
                              {activeInstructors.filter(inst => inst._id !== courseForm.instructor).length === 0 ? (
                                <span className="text-xs text-slate p-2">No other verified instructors available</span>
                              ) : activeInstructors
                                  .filter(inst => inst._id !== courseForm.instructor)
                                  .filter(inst =>
                                    inst.name.toLowerCase().includes(adminCoInstructorSearch.toLowerCase()) ||
                                    inst.email.toLowerCase().includes(adminCoInstructorSearch.toLowerCase())
                                  ).length === 0 ? (
                                <span className="text-xs text-slate p-2">No instructors match your search</span>
                              ) : (
                                activeInstructors
                                  .filter(inst => inst._id !== courseForm.instructor)
                                  .filter(inst =>
                                    inst.name.toLowerCase().includes(adminCoInstructorSearch.toLowerCase()) ||
                                    inst.email.toLowerCase().includes(adminCoInstructorSearch.toLowerCase())
                                  )
                                  .map(inst => (
                                    <label key={inst._id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-ink-soft cursor-pointer hover:bg-paper rounded-lg transition-colors">
                                      <input
                                        type="checkbox"
                                        checked={courseForm.coInstructors.includes(inst._id)}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            setCourseForm(prev => ({
                                              ...prev,
                                              coInstructors: [...prev.coInstructors, inst._id]
                                            }));
                                          } else {
                                            setCourseForm(prev => ({
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
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                        Level
                      </label>
                      <select
                        value={courseForm.level}
                        onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}
                        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                        Price (৳ BDT)
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={courseForm.price}
                        onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                        className="w-full rounded-xl border border-line bg-paper px-3 py-2.5 text-sm text-ink focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={courseSubmitLoading}
                    className="w-full bg-primary text-white text-sm font-semibold py-3 px-4 rounded-xl transition-colors hover:bg-primary-dark shadow-sm disabled:opacity-75 mt-2"
                  >
                    {courseSubmitLoading ? 'Creating...' : 'Create Course & Invite'}
                  </button>
                </form>
              </div>

              {/* Course list */}
              <div className="lg:col-span-2 bg-paper-alt border border-line rounded-2xl p-6 shadow-sm">
                <h3 className="font-display text-lg font-semibold mb-4 text-ink">
                  Published Courses ({courses.length})
                </h3>

                {coursesLoading && courses.length === 0 ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
                    <p className="text-xs text-slate mt-2">Retrieving courses...</p>
                  </div>
                ) : courses.length === 0 ? (
                  <div className="text-center py-12 text-slate text-sm border border-dashed border-line rounded-xl">
                    No courses have been created yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-line text-xs font-semibold text-slate uppercase bg-paper/50">
                          <th className="py-3 px-4">Title</th>
                          <th className="py-3 px-4">Instructors</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Enrolled</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line text-sm">
                        {courses.map((course) => (
                          <tr key={course._id} className="hover:bg-paper/20">
                            <td className="py-3.5 px-4 font-semibold text-ink">
                              {course.title}
                              <span className="block text-[10px] text-slate capitalize font-normal">{course.level}</span>
                            </td>
                            <td className="py-3.5 px-4 text-ink-soft text-xs max-w-[200px] truncate">
                              <p className="font-semibold text-ink">{course.instructor?.name || 'Unknown'}</p>
                              {course.coInstructors && course.coInstructors.length > 0 && (
                                <p className="text-[10px] text-slate line-clamp-1">
                                  Co: {course.coInstructors.map(c => c.name).join(', ')}
                                </p>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-ink-soft text-xs">
                              {course.category?.name || 'General'}
                            </td>
                            <td className="py-3.5 px-4 text-ink-soft">
                              {course.enrolledCount || 0} students
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => handleOpenMembersModal(course)}
                                className="px-3 py-1.5 bg-primary-light text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors"
                              >
                                Manage Members
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ADMIN MEMBERSHIP & INSTRUCTORS MANAGEMENT MODAL */}
      {membersModalOpen && selectedCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-4xl bg-paper-alt rounded-2xl shadow-xl border border-line flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  Manage Course Members
                </h2>
                <p className="text-xs text-slate mt-0.5">
                  Course: <strong className="text-ink-soft">{selectedCourse.title}</strong>
                </p>
              </div>
              <button 
                onClick={() => { 
                  setMembersModalOpen(false); 
                  setSelectedCourse(null); 
                  setAdminModalCoInstructorSearch(''); 
                  setAdminStudentSearch('');
                  setAdminStudentDropdownOpen(false);
                  setSelectedStudentsToEnroll([]);
                }}
                className="p-1 text-slate hover:text-ink rounded-lg hover:bg-paper transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body split in 2 columns: Instructors left, Students right */}
            <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column: Instructors management */}
              <div className="flex flex-col gap-5 border-r border-line/60 pr-0 md:pr-8">
                <div>
                  <h3 className="font-display text-sm font-bold text-ink uppercase tracking-wider mb-3">
                    Course Instructors
                  </h3>
                  <p className="text-xs text-slate mb-4">
                    Modify the primary instructor or add/remove co-instructors from this course.
                  </p>
                </div>

                {/* Primary Instructor Selector */}
                <div className="relative">
                  <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                    Primary Instructor
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdminModalCoDropdownOpen(!adminModalCoDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink text-left focus:border-primary focus:outline-none"
                  >
                    <span className="truncate">
                      {modalInstructorsForm.instructor
                        ? activeInstructors.find(inst => inst._id === modalInstructorsForm.instructor)?.name || 'Select Instructor'
                        : 'Select Instructor'}
                    </span>
                    <span className="text-slate text-xs">▼</span>
                  </button>

                  {adminModalCoDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setAdminModalCoDropdownOpen(false)} />
                      <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-line bg-paper-alt shadow-lg p-2 max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-100">
                        <input
                          type="text"
                          value={adminPrimaryInstructorSearch}
                          onChange={(e) => setAdminPrimaryInstructorSearch(e.target.value)}
                          placeholder="Type to search..."
                          className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-slate focus:border-primary focus:outline-none mb-2"
                        />
                        <div className="overflow-y-auto flex flex-col gap-1 max-h-40">
                          {activeInstructors.filter(inst =>
                            inst.name.toLowerCase().includes(adminPrimaryInstructorSearch.toLowerCase()) ||
                            inst.email.toLowerCase().includes(adminPrimaryInstructorSearch.toLowerCase())
                          ).length === 0 ? (
                            <span className="text-xs text-slate p-2">No instructors found</span>
                          ) : (
                            activeInstructors
                              .filter(inst =>
                                inst.name.toLowerCase().includes(adminPrimaryInstructorSearch.toLowerCase()) ||
                                inst.email.toLowerCase().includes(adminPrimaryInstructorSearch.toLowerCase())
                              )
                              .map(inst => (
                                <button
                                  key={inst._id}
                                  type="button"
                                  onClick={() => {
                                    setModalInstructorsForm(prev => ({
                                      ...prev,
                                      instructor: inst._id,
                                      coInstructors: prev.coInstructors.filter(id => id !== inst._id)
                                    }));
                                    setAdminModalCoDropdownOpen(false);
                                    setAdminPrimaryInstructorSearch('');
                                  }}
                                  className={`w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-primary-light hover:text-primary transition-colors ${
                                    modalInstructorsForm.instructor === inst._id ? 'bg-primary-light text-primary font-semibold' : 'text-ink-soft'
                                  }`}
                                >
                                  {inst.name} ({inst.email})
                                </button>
                              ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Co-Instructors Selector */}
                <div className="relative">
                  <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                    Co-Instructors List
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdminModalCoInstructorsDropdownOpen(!adminModalCoInstructorsDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink text-left focus:border-primary focus:outline-none"
                  >
                    <span className="truncate">
                      {modalInstructorsForm.coInstructors.length === 0
                        ? 'Select Co-Instructors'
                        : `${modalInstructorsForm.coInstructors.length} co-instructor(s) selected`}
                    </span>
                    <span className="text-slate text-xs">▼</span>
                  </button>

                  {adminModalCoInstructorsDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setAdminModalCoInstructorsDropdownOpen(false)} />
                      <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-line bg-paper-alt shadow-lg p-2 max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-100">
                        <input
                          type="text"
                          value={adminModalCoInstructorSearch}
                          onChange={(e) => setAdminModalCoInstructorSearch(e.target.value)}
                          placeholder="Type to search..."
                          className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-slate focus:border-primary focus:outline-none mb-2"
                        />
                        <div className="overflow-y-auto flex flex-col gap-1.5 max-h-40 p-1">
                          {activeInstructors.filter(inst => inst._id !== modalInstructorsForm.instructor).length === 0 ? (
                            <span className="text-xs text-slate p-2">No other verified instructors available</span>
                          ) : activeInstructors
                              .filter(inst => inst._id !== modalInstructorsForm.instructor)
                              .filter(inst =>
                                inst.name.toLowerCase().includes(adminModalCoInstructorSearch.toLowerCase()) ||
                                inst.email.toLowerCase().includes(adminModalCoInstructorSearch.toLowerCase())
                              ).length === 0 ? (
                            <span className="text-xs text-slate p-2">No instructors match your search</span>
                          ) : (
                            activeInstructors
                              .filter(inst => inst._id !== modalInstructorsForm.instructor)
                              .filter(inst =>
                                inst.name.toLowerCase().includes(adminModalCoInstructorSearch.toLowerCase()) ||
                                inst.email.toLowerCase().includes(adminModalCoInstructorSearch.toLowerCase())
                              )
                              .map(inst => (
                                <label key={inst._id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-ink-soft cursor-pointer hover:bg-paper rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={modalInstructorsForm.coInstructors.includes(inst._id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setModalInstructorsForm(prev => ({
                                          ...prev,
                                          coInstructors: [...prev.coInstructors, inst._id]
                                        }));
                                      } else {
                                        setModalInstructorsForm(prev => ({
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

                <button
                  onClick={handleSaveInstructors}
                  disabled={memberActionLoading}
                  className="bg-primary text-white text-xs font-semibold py-2.5 px-4 rounded-xl hover:bg-primary-dark transition-colors mt-2"
                >
                  {memberActionLoading ? 'Saving...' : 'Save Instructors list'}
                </button>
              </div>

              {/* Right Column: Enrolled Students */}
              <div className="flex flex-col">
                <h3 className="font-display text-sm font-bold text-ink uppercase tracking-wider mb-3">
                  Enrolled Students ({courseEnrollments.length})
                </h3>

                {membersError && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-xl border border-red-100 text-xs mb-4">
                    {membersError}
                  </div>
                )}
                           {/* Searchable Student Dropdown to Enroll */}
                <div className="relative mb-4">
                  <label className="text-xs font-semibold text-slate uppercase tracking-wider block mb-1.5">
                    Enroll Students
                  </label>
                  <button
                    type="button"
                    onClick={() => setAdminStudentDropdownOpen(!adminStudentDropdownOpen)}
                    className="w-full flex items-center justify-between rounded-xl border border-line bg-paper px-4 py-2.5 text-sm text-ink text-left focus:border-primary focus:outline-none"
                  >
                    <span className="truncate text-slate">
                      {selectedStudentsToEnroll.length === 0
                        ? 'Select Students to Enroll...'
                        : `${selectedStudentsToEnroll.length} student(s) selected`}
                    </span>
                    <span className="text-slate text-xs">▼</span>
                  </button>

                  {adminStudentDropdownOpen && (
                    <>
                      <div className="fixed inset-0 z-45" onClick={() => setAdminStudentDropdownOpen(false)} />
                      <div className="absolute z-50 left-0 right-0 mt-1 rounded-xl border border-line bg-paper-alt shadow-lg p-2 max-h-60 overflow-hidden flex flex-col animate-in fade-in slide-in-from-top-1 duration-100">
                        <input
                          type="text"
                          value={adminStudentSearch}
                          onChange={(e) => setAdminStudentSearch(e.target.value)}
                          placeholder="Search student by name/email..."
                          className="w-full rounded-lg border border-line bg-paper px-3 py-1.5 text-xs text-ink placeholder:text-slate focus:border-primary focus:outline-none mb-2"
                        />
                        <div className="overflow-y-auto flex flex-col gap-1.5 max-h-40 p-1">
                          {activeStudents
                            .filter(student => !courseEnrollments.some(e => e.student?._id === student._id))
                            .filter(student =>
                              student.name.toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
                              student.email.toLowerCase().includes(adminStudentSearch.toLowerCase())
                            ).length === 0 ? (
                            <span className="text-xs text-slate p-2">No eligible students found</span>
                          ) : (
                            activeStudents
                              .filter(student => !courseEnrollments.some(e => e.student?._id === student._id))
                              .filter(student =>
                                student.name.toLowerCase().includes(adminStudentSearch.toLowerCase()) ||
                                student.email.toLowerCase().includes(adminStudentSearch.toLowerCase())
                              )
                              .map(student => (
                                <label key={student._id} className="flex items-center gap-2 px-2 py-1.5 text-xs text-ink-soft cursor-pointer hover:bg-paper rounded-lg transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={selectedStudentsToEnroll.includes(student._id)}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        setSelectedStudentsToEnroll(prev => [...prev, student._id]);
                                      } else {
                                        setSelectedStudentsToEnroll(prev => prev.filter(id => id !== student._id));
                                      }
                                    }}
                                    className="rounded border-line text-primary focus:ring-primary h-3.5 w-3.5"
                                  />
                                  <span>{student.name} ({student.email})</span>
                                </label>
                              ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {selectedStudentsToEnroll.length > 0 && (
                  <button
                    type="button"
                    onClick={handleEnrollStudentsBulk}
                    disabled={memberActionLoading}
                    className="w-full bg-primary text-white text-xs font-semibold py-2 px-4 rounded-xl hover:bg-primary-dark transition-colors mb-4 disabled:opacity-75"
                  >
                    {memberActionLoading ? 'Enrolling...' : `Enroll Selected (${selectedStudentsToEnroll.length})`}
                  </button>
                )}

                {enrollmentsLoading ? (
                  <div className="flex flex-col items-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
                    <p className="text-[10px] text-slate mt-2">Loading students...</p>
                  </div>
                ) : courseEnrollments.length === 0 ? (
                  <div className="text-center py-12 text-slate text-xs border border-dashed border-line rounded-xl flex-1 flex flex-col items-center justify-center">
                    No students enrolled in this course yet.
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto max-h-[50vh] pr-2 flex flex-col gap-3">
                    {courseEnrollments.map((enrollment) => (
                      <div key={enrollment._id} className="border border-line rounded-xl p-3 bg-paper/20 flex items-center justify-between hover:border-line-dark transition-all">
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-ink truncate">
                            {enrollment.student?.name || 'Unknown Student'}
                          </p>
                          <p className="text-[10px] text-slate truncate">
                            {enrollment.student?.email}
                          </p>
                          <p className="text-[9px] text-slate/80 mt-1">
                            Enrolled: {new Date(enrollment.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(enrollment.student?._id)}
                          disabled={memberActionLoading}
                          className="px-2 py-1 text-[10px] text-red-600 bg-red-50 hover:bg-red-100 rounded-lg font-semibold transition-colors disabled:opacity-50 shrink-0 ml-3"
                          title="Remove Student"
                        >
                          Unenroll
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-line flex justify-end">
              <button
                type="button"
                onClick={() => { 
                  setMembersModalOpen(false); 
                  setSelectedCourse(null); 
                  setAdminModalCoInstructorSearch(''); 
                  setAdminStudentSearch('');
                  setAdminStudentDropdownOpen(false);
                  setSelectedStudentsToEnroll([]);
                }}
                className="px-5 py-2 border border-line text-xs font-semibold rounded-xl text-ink-soft hover:bg-paper transition-colors"
              >
                Close Panel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
