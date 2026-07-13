import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Award, Edit2, Trash2, ArrowRight } from 'lucide-react';

/**
 * Reusable Course Card component
 */
export default function CourseCard({ course, isInstructorView = false, onDeleteClick }) {
  const {
    _id,
    course_title = 'Untitled Course',
    description = '',
    category = 'General',
    difficulty = 'Beginner',
    language = 'English',
    price = 0,
    thumbnail = '',
    tags = []
  } = course || {};

  // Resolve category name (handles string fallback or nested object reference)
  const categoryName = typeof category === 'object' && category !== null
    ? category.name || 'General'
    : category || 'General';

  // Formatted price representation
  const displayPrice = price === 0 || price === '0' 
    ? 'Free' 
    : `$${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Safe difficulty badges
  const difficultyColors = {
    Beginner: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    Intermediate: 'bg-amber-50 text-amber-700 border-emerald-100',
    Advanced: 'bg-rose-50 text-rose-700 border-rose-100'
  };

  const selectedDifficultyColor = difficultyColors[difficulty] || 'bg-slate-50 text-slate-700 border-slate-100';

  // Process tags safely
  const parsedTags = Array.isArray(tags)
    ? tags
    : typeof tags === 'string' && tags.trim() !== ''
      ? tags.split(',').map((t) => t.trim())
      : [];

  // Fallback thumbnail Unsplash image
  const imageSrc = thumbnail && thumbnail.startsWith('http') 
    ? thumbnail 
    : `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60`;

  return (
    <div className="group flex flex-col justify-between overflow-hidden bg-white border border-slate-100 rounded-2xl shadow-sm hover-card-trigger h-[480px]">
      
      {/* Upper content / image */}
      <div>
        <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
          <img
            src={imageSrc}
            alt={course_title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60';
            }}
          />
          {/* Category Badge */}
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-lg bg-slate-900/80 px-2.5 py-1 text-xs font-semibold text-white backdrop-blur-xs">
              {categoryName}
            </span>
          </div>
          {/* Price Label */}
          <div className="absolute bottom-3 right-3">
            <span className="inline-flex items-center rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-bold text-white shadow-md">
              {displayPrice}
            </span>
          </div>
        </div>

        {/* Content body */}
        <div className="p-5">
          {/* Attributes strip */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
            <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 font-medium ${selectedDifficultyColor}`}>
              <Award className="h-3 w-3" />
              {difficulty}
            </span>
            <span className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-slate-400" />
              {language}
            </span>
          </div>

          {/* Title */}
          <h3 className="font-heading text-lg font-bold text-slate-900 line-clamp-1 group-hover:text-blue-600 transition-colors mb-2" title={course_title}>
            {course_title}
          </h3>

          {/* Description */}
          <p className="text-sm text-slate-500 line-clamp-3 mb-4 leading-relaxed">
            {description || 'No description provided for this course. Start learning today!'}
          </p>

          {/* Tags list */}
          {parsedTags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 overflow-hidden max-h-[26px]">
              {parsedTags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="inline-flex items-center rounded bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-600 border border-slate-100">
                  #{tag}
                </span>
              ))}
              {parsedTags.length > 3 && (
                <span className="text-[10px] text-slate-400 font-medium">+{parsedTags.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="border-t border-slate-50 p-5 bg-slate-50/40">
        {isInstructorView ? (
          <div className="flex gap-3">
            <Link
              to={`/edit-course/${_id}`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-100"
            >
              <Edit2 className="h-4 w-4 text-slate-400" />
              Edit
            </Link>
            <button
              onClick={() => onDeleteClick(course)}
              className="inline-flex items-center justify-center p-2.5 rounded-xl border border-rose-100 bg-rose-50/50 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-rose-100"
              title="Delete Course"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <Link
            to={`/courses/${_id}`}
            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-100 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            View Details
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
