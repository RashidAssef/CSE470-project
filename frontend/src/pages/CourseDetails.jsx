import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Globe, Award, DollarSign, Tag, User, BookOpen, AlertCircle } from 'lucide-react';
import courseService from '../services/courseService';
import Loading from '../components/Loading';

export default function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await courseService.getCourse(id);
        if (data) {
          setCourse(data);
        } else {
          setError('Course details not found.');
        }
      } catch (err) {
        console.error('Error fetching course details:', err);
        setError(
          err.response?.data?.message || 
          'Could not retrieve course information. Confirm if the backend server is running.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchDetails();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex-1 py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Loading variant="spinner" />
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex-1 py-12 max-w-lg mx-auto px-4 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-rose-600 mx-auto mb-4 shadow-sm">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 font-heading mb-1">
          Details Unavailable
        </h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          {error || 'The requested course is not available in our database.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md transition-all"
        >
          Return to Catalog
        </button>
      </div>
    );
  }

  const {
    course_title = 'Untitled Course',
    description = '',
    category = 'General',
    difficulty = 'Beginner',
    language = 'English',
    price = 0,
    thumbnail = '',
    tags = [],
    instructor = {}
  } = course;

  // Resolve category name (handles string fallback or nested object reference)
  const categoryName = typeof category === 'object' && category !== null
    ? category.name || 'General'
    : category || 'General';

  // Formatted price representation
  const formattedPrice = price === 0 || price === '0' 
    ? 'Free' 
    : `$${Number(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  // Safe tags resolver
  const resolvedTags = Array.isArray(tags)
    ? tags
    : typeof tags === 'string' && tags.trim() !== ''
      ? tags.split(',').map((t) => t.trim())
      : [];

  const imageSrc = thumbnail && thumbnail.startsWith('http') 
    ? thumbnail 
    : `https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=1000&auto=format&fit=crop&q=80`;

  // Get instructor label safely
  const instructorName = typeof instructor === 'string' 
    ? instructor 
    : instructor?.name || instructor?.username || 'Platform Instructor';

  return (
    <div className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full animate-in fade-in duration-300">
      
      {/* Return back button */}
      <Link 
        to="/"
        className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to course directory
      </Link>

      {/* Grid Layout: Left Details vs Right purchase sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* Left Side: General metadata */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main heading stats */}
          <div className="space-y-4">
            <span className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-100">
              {categoryName}
            </span>
            <h1 className="font-heading text-3xl md:text-5xl font-extrabold text-slate-900 leading-tight">
              {course_title}
            </h1>
            
            {/* Meta horizontal row */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 border-b border-slate-100 pb-4">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <User className="h-4 w-4 text-slate-400" />
                Authored by: <span className="text-blue-600">{instructorName}</span>
              </span>
              <span className="h-4 w-px bg-slate-200 hidden sm:block"></span>
              <span className="flex items-center gap-1.5">
                <Globe className="h-4 w-4 text-slate-400" />
                Taught in: {language}
              </span>
            </div>
          </div>

          {/* Large thumbnail visible on mobile viewports */}
          <div className="aspect-video w-full rounded-2xl overflow-hidden shadow-md border border-slate-100 block lg:hidden bg-slate-100">
            <img 
              src={imageSrc} 
              alt={course_title} 
              className="h-full w-full object-cover" 
            />
          </div>

          {/* Description */}
          <div className="space-y-3 bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
            <h3 className="font-heading text-xl font-bold text-slate-900 flex items-center gap-2 border-b border-slate-50 pb-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Course Syllabus & Description
            </h3>
            <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-line">
              {description || 'Detailed syllabus objectives and descriptions have not been published for this course yet.'}
            </p>
          </div>

          {/* Tag Badges list */}
          {resolvedTags.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" /> Skills covered in this curriculum
              </h4>
              <div className="flex flex-wrap gap-2">
                {resolvedTags.map((tag, idx) => (
                  <span 
                    key={idx} 
                    className="inline-flex items-center rounded-xl bg-slate-100 px-3.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-default transition-colors border border-slate-200/50"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Floating Sticky card summary */}
        <div className="lg:sticky lg:top-24 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-xl overflow-hidden">
            {/* Visual Thumbnail */}
            <div className="aspect-video w-full overflow-hidden bg-slate-100 hidden lg:block border-b border-slate-50">
              <img 
                src={imageSrc} 
                alt={course_title} 
                className="h-full w-full object-cover transition-transform duration-500 hover:scale-102"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=60';
                }}
              />
            </div>

            <div className="p-6 space-y-6">
              {/* Cost indicator */}
              <div className="flex justify-between items-baseline border-b border-slate-50 pb-4">
                <span className="text-sm font-semibold text-slate-500">Course tuition:</span>
                <span className="text-3xl font-extrabold text-blue-600 font-heading">
                  {formattedPrice}
                </span>
              </div>

              {/* Specific attribute metrics */}
              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Award className="h-4.5 w-4.5 text-slate-400" /> Difficulty:
                  </span>
                  <span className="font-semibold text-slate-900 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg text-xs">
                    {difficulty}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Globe className="h-4.5 w-4.5 text-slate-400" /> Language:
                  </span>
                  <span className="font-semibold text-slate-900">
                    {language}
                  </span>
                </div>

                <div className="flex items-center justify-between text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="h-4.5 w-4.5 text-slate-400" /> Pricing Currency:
                  </span>
                  <span className="font-semibold text-slate-900">
                    USD ($)
                  </span>
                </div>
              </div>

              {/* Checkout / Registration Mock Button */}
              <button 
                onClick={() => alert('Enrollment module is not a part of this scope.')}
                className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-100 hover:shadow-lg transition-all focus:outline-none"
              >
                Enroll In Course
              </button>
              
              <p className="text-[10px] text-center text-slate-400 leading-relaxed">
                30-Day Money-Back Guarantee • Lifetime Access to lectures
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
