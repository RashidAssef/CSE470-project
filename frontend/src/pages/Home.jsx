import React, { useState, useEffect } from 'react';
import courseService from '../services/courseService';
import CourseCard from '../components/CourseCard';
import Loading from '../components/Loading';
import { AlertCircle, RefreshCw, BookOpen, Search, Sparkles } from 'lucide-react';

export default function Home() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourses();
      setCourses(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(
        err.response?.data?.message || 
        'Could not establish a connection to the server. Make sure the backend server is running.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Filter courses based on title, description, category, or tags
  const filteredCourses = courses.filter((course) => {
    const query = searchQuery.toLowerCase();
    const titleMatch = course.course_title?.toLowerCase().includes(query);
    const descMatch = course.description?.toLowerCase().includes(query);
    
    // Safe category search mapping
    const categoryName = typeof course.category === 'object' && course.category !== null
      ? course.category.name || ''
      : course.category || '';
    const catMatch = categoryName.toLowerCase().includes(query);

    const difficultyMatch = course.difficulty?.toLowerCase().includes(query);
    const tagsMatch = Array.isArray(course.tags) 
      ? course.tags.some(tag => tag.toLowerCase().includes(query))
      : typeof course.tags === 'string' && course.tags.toLowerCase().includes(query);
      
    return titleMatch || descMatch || catMatch || difficultyMatch || tagsMatch;
  });

  return (
    <div className="flex-1 py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-12 shadow-xl mb-12">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold backdrop-blur-xs mb-4 text-blue-100 animate-pulse">
            <Sparkles className="h-3.5 w-3.5" />
            Empowering Online Learning
          </div>
          <h1 className="font-heading text-3xl md:text-5xl font-extrabold tracking-tight mb-4">
            Accelerate Your Skills & Future
          </h1>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed mb-6">
            Discover modern, premium courses authored by industry experts, or build your own customized curriculum. Join thousands of creators launching courses today.
          </p>
          
          {/* Internal search filter bar */}
          <div className="relative max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search courses by title, tag, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border-none bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300 shadow-md font-medium text-sm transition-all"
            />
          </div>
        </div>

        {/* Decorative shapes */}
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
          <div className="w-96 h-96 rounded-full bg-white absolute -right-20 -bottom-20"></div>
          <div className="w-64 h-64 rounded-full bg-white absolute -right-10 -top-10"></div>
        </div>
      </div>

      {/* Main Course Listing Grid */}
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-heading text-2xl font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-blue-600" />
              Explore All Courses
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} available
            </p>
          </div>
          <button
            onClick={fetchCourses}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-semibold text-xs transition-all shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-100"
            title="Reload courses catalog"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading Spinner / Skeletons */}
        {loading ? (
          <Loading variant="skeleton" count={6} />
        ) : error ? (
          <div className="bg-red-50/50 rounded-2xl border border-red-100 p-8 flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-4 shadow-sm animate-in fade-in zoom-in-95">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600 shadow-inner">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-950 font-heading">
                Failed to load courses
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm">
                {error}
              </p>
            </div>
            <button
              onClick={fetchCourses}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md shadow-red-100 hover:shadow-lg transition-all focus:outline-none"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-2xl p-12 text-center max-w-md mx-auto shadow-xs">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-50 text-blue-600 mx-auto mb-4">
              <BookOpen className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-heading mb-1">
              No courses found
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {searchQuery 
                ? `We couldn't find matches for "${searchQuery}". Try adjusting your keywords.`
                : 'There are no courses active on the platform. Start building curriculum to create one!'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
              >
                Clear Search Filter
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
            {filteredCourses.map((course) => (
              <CourseCard key={course._id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}