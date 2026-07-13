import React, { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';

/**
 * Reusable modal for verifying destructive actions (e.g. course deletion)
 */
export default function DeleteModal({ isOpen, onClose, onConfirm, courseTitle, isDeleting = false }) {
  // Listen for Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal box */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl transition-all duration-300 scale-100 border border-slate-100">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-slate-50 transition-colors"
          aria-label="Close modal"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex flex-col items-center text-center mt-2">
          {/* Warning Icon Badge */}
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-600 mb-4 animate-bounce">
            <AlertTriangle className="h-7 w-7" />
          </div>

          <h3 className="text-xl font-semibold text-slate-900 font-heading">
            Delete Course?
          </h3>
          
          <p className="mt-2 text-sm text-slate-500 px-2 leading-relaxed">
            Are you sure you want to delete <strong className="text-slate-800">"{courseTitle || 'this course'}"</strong>? This action cannot be undone and will permanently remove the course records.
          </p>
        </div>

        {/* Buttons footer */}
        <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-slate-50 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 bg-white hover:bg-slate-50 font-medium text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
          >
            Cancel
          </button>
          
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm transition-all shadow-md shadow-red-100 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-red-400 flex items-center justify-center min-w-[90px]"
          >
            {isDeleting ? (
              <span className="flex items-center gap-1.5">
                <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Deleting...
              </span>
            ) : (
              'Delete'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
