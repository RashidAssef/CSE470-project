import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Sliders, AlertCircle, Sparkles } from 'lucide-react';
import courseService from '../services/courseService';
import CourseCard from '../components/CourseCard';
import DeleteModal from '../components/DeleteModal';
import Loading from '../components/Loading';

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Deletion state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Success/error toasts
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });

  const fetchMyCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getMyCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching instructor courses:', err);
      setError(
        err.response?.data?.message || 
        'Could not fetch your courses. Ensure you have set a valid Developer JWT Token and the backend is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  // Trigger modal
  const handleDeleteClick = (course) => {
    setSelectedCourse(course);
    setDeleteModalOpen(true);
  };

  // Perform delete request
  const handleConfirmDelete = async () => {
    if (!selectedCourse) return;
    setIsDeleting(true);
    setNotification({ show: false, type: '', message: '' });
    
    try {
      // Extract Category ID for category-specific deletions
      const categoryId = typeof selectedCourse.category === 'object' && selectedCourse.category !== null
        ? selectedCourse.category._id || selectedCourse.category.id
        : selectedCourse.category;

      await courseService.deleteCourse(selectedCourse._id, categoryId);
      
      // Flash success toast
      setNotification({
        show: true,
        type: 'success',
        message: `"${selectedCourse.course_title}" has been deleted successfully.`
      });

      // Close modal
      setDeleteModalOpen(false);
      setSelectedCourse(null);

      // Refresh list
      await fetchMyCourses();
    } catch (err) {
      console.error('Error deleting course:', err);
      setNotification({
        show: true,
        type: 'error',
        message: err.response?.data?.message || 'Could not delete the course. Try again.'
      });
      setDeleteModalOpen(false);
    } finally {
      setIsDeleting(false);
      
      // Auto dismiss success alerts
      setTimeout(() => {
        setNotification((prev) => ({ ...prev, show: false }));
      }, 4000);
    }
  };

  return (
    <div className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Page Header */}
      <div className="md:flex md:items-center md:justify-between border-b border-slate-100 pb-6 mb-8 gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
              Instructor Dashboard
            </span>
          </div>
          <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight sm:truncate">
            My Created Courses
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Publish, edit settings, track content, or remove courses you teach.
          </p>
        </div>

        <div className="mt-4 flex shrink-0 md:mt-0 md:ml-4">
          <Link
            to="/create-course"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-100 hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <PlusCircle className="h-4.5 w-4.5" />
            Create New Course
          </Link>
        </div>
      </div>

      {/* Deletion Toast notification banner */}
      {notification.show && (
        <div
          className={`mb-6 p-4 rounded-xl border flex items-center gap-3 animate-in slide-in-from-top-4 duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
              : 'bg-rose-50 border-rose-100 text-rose-800'
          }`}
        >
          <AlertCircle className={`h-5 w-5 shrink-0 ${notification.type === 'success' ? 'text-emerald-600' : 'text-rose-600'}`} />
          <p className="text-xs font-semibold leading-relaxed">{notification.message}</p>
        </div>
      )}

      {/* Instructor course list */}
      {loading ? (
        <Loading variant="skeleton" count={3} />
      ) : error ? (
        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-4 shadow-xs">
          <div className="h-12 w-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 font-heading">
              Failed to load dashboard courses
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
              {error}
            </p>
          </div>
          <button
            onClick={fetchMyCourses}
            className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
          <div className="h-14 w-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sliders className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 font-heading mb-1">
            No courses published yet
          </h3>
          <p className="text-xs text-slate-500 mb-6 leading-relaxed">
            You haven't uploaded any courses. Build and publish your first lesson to see it here!
          </p>
          <Link
            to="/create-course"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-100 transition-all"
          >
            <PlusCircle className="h-4 w-4" />
            Build Your First Course
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
          {courses.map((course) => (
            <CourseCard
              key={course._id}
              course={course}
              isInstructorView={true}
              onDeleteClick={handleDeleteClick}
            />
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      <DeleteModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setSelectedCourse(null);
        }}
        onConfirm={handleConfirmDelete}
        courseTitle={selectedCourse?.course_title}
        isDeleting={isDeleting}
      />
    </div>
  );
}
