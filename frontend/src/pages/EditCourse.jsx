import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
import courseService from '../services/courseService';
import CourseForm from '../components/CourseForm';
import Loading from '../components/Loading';

export default function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [fetchError, setFetchError] = useState(null);
  const [alertState, setAlertState] = useState({ show: false, type: '', message: '' });

  // Fetch course details on mount
  useEffect(() => {
    const fetchCourseDetails = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const data = await courseService.getCourse(id);
        if (data) {
          setCourse(data);
        } else {
          setFetchError('Course data could not be found.');
        }
      } catch (err) {
        console.error('Error fetching course detail for edit:', err);
        setFetchError(
          err.response?.data?.message || 
          'Failed to retrieve the course records. Check if the backend server is running.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCourseDetails();
    }
  }, [id]);

  const handleUpdateCourse = async (updatedPayload) => {
    setIsSubmitting(true);
    setAlertState({ show: false, type: '', message: '' });

    try {
      await courseService.updateCourse(id, updatedPayload);
      
      setAlertState({
        show: true,
        type: 'success',
        message: 'Course updated successfully! Navigating to dashboard...'
      });

      // Wait 2s to show alert, then redirect
      setTimeout(() => {
        navigate('/my-courses');
      }, 2000);
    } catch (err) {
      console.error('Error updating course:', err);
      
      let errorMsg = 'Failed to update course details. Review your network status.';
      if (err.response?.status === 401) {
        errorMsg = 'You are unauthorized! Please set a valid Developer JWT Token in the navigation bar.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setAlertState({
        show: true,
        type: 'error',
        message: errorMsg
      });
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 py-12 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Loading variant="spinner" />
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="flex-1 py-12 max-w-lg mx-auto px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 mx-auto mb-4 shadow-sm">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-heading mb-1">
          Course Load Failed
        </h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          {fetchError}
        </p>
        <button
          onClick={() => navigate('/my-courses')}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 py-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
          <Edit3 className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight animate-pulse">
          Edit Course
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          Update the metadata, curriculum description, categories, and tags for your published course.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
        {/* Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="p-6 sm:p-8">
          {/* Alerts banner */}
          {alertState.show && (
            <div
              className={`mb-6 p-4 rounded-xl border flex items-start gap-3 animate-in slide-in-from-top-2 duration-200 ${
                alertState.type === 'success'
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}
            >
              {alertState.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div>
                <h4 className="font-semibold text-sm">
                  {alertState.type === 'success' ? 'Success!' : 'Update Failed'}
                </h4>
                <p className="text-xs mt-0.5 leading-relaxed">{alertState.message}</p>
              </div>
            </div>
          )}

          {/* Form populated with course state */}
          <CourseForm
            initialData={course}
            onSubmit={handleUpdateCourse}
            isSubmitting={isSubmitting}
            isEditMode={true}
          />
        </div>
      </div>
    </div>
  );
}
