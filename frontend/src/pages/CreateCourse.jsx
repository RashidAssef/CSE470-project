import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import courseService from '../services/courseService';
import CourseForm from '../components/CourseForm';

export default function CreateCourse() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [alertState, setAlertState] = useState({ show: false, type: '', message: '' });

  const handleCreateCourse = async (coursePayload) => {
    setIsSubmitting(true);
    setAlertState({ show: false, type: '', message: '' });

    try {
      await courseService.createCourse(coursePayload);
      
      // Show success alert
      setAlertState({
        show: true,
        type: 'success',
        message: 'Course created successfully! Redirecting to dashboard...'
      });

      // Redirect after a short delay to let the user see the success alert
      setTimeout(() => {
        navigate('/my-courses');
      }, 2000);
    } catch (err) {
      console.error('Error creating course:', err);
      
      let errorMsg = 'Failed to create course. Please review your input and try again.';
      if (err.response?.status === 401) {
        errorMsg = 'You are unauthorized! Please set a valid Developer JWT Token in the navigation bar.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.message) {
        errorMsg = err.message;
      }

      setAlertState({
        show: true,
        type: 'error',
        message: errorMsg
      });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 py-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      
      {/* Header Info */}
      <div className="text-center mb-8">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-3 shadow-inner">
          <Sparkles className="h-6 w-6" />
        </div>
        <h1 className="font-heading text-3xl font-extrabold text-slate-900 tracking-tight">
          Create New Course
        </h1>
        <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
          Design your curriculum, choose specifications, and publish your course to the public catalogue.
        </p>
      </div>

      {/* Main Form Box Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
        {/* Decorative Top Accent line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>

        <div className="p-6 sm:p-8">
          {/* Alerts Banner */}
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
                  {alertState.type === 'success' ? 'Success!' : 'Submission Failed'}
                </h4>
                <p className="text-xs mt-0.5 leading-relaxed">{alertState.message}</p>
              </div>
            </div>
          )}

          {/* Reusable Form */}
          <CourseForm
            onSubmit={handleCreateCourse}
            isSubmitting={isSubmitting}
            isEditMode={false}
          />
        </div>
      </div>
    </div>
  );
}
