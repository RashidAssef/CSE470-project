import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, ArrowLeft, Image as ImageIcon, AlertCircle } from 'lucide-react';
import courseService from '../services/courseService';

// Fallback preset categories formatted as ObjectId mappings
const PRESET_CATEGORIES = [
  { _id: '60d5ec49f1b2c51f4c8b4561', name: 'Web Development' },
  { _id: '60d5ec49f1b2c51f4c8b4562', name: 'Data Science' },
  { _id: '60d5ec49f1b2c51f4c8b4563', name: 'Mobile Apps' },
  { _id: '60d5ec49f1b2c51f4c8b4564', name: 'Design & UX' },
  { _id: '60d5ec49f1b2c51f4c8b4565', name: 'Marketing' },
  { _id: '60d5ec49f1b2c51f4c8b4566', name: 'Business & Finance' },
  { _id: '60d5ec49f1b2c51f4c8b4567', name: 'Personal Development' }
];

/**
 * Reusable Course Form Component for Create and Edit pages
 */
export default function CourseForm({ initialData = null, isEditMode = false, onSubmit, isSubmitting = false }) {
  const navigate = useNavigate();

  // Form Fields State
  const [formData, setFormData] = useState({
    course_title: '',
    description: '',
    category: '',
    difficulty: 'Beginner',
    language: 'English',
    thumbnail: '',
    price: '',
    tags: '',
    status: 'Published' // Default to 'published' so it immediately shows up on Home and My Courses
  });

  // State to hold manual custom Category ID input
  const [useCustomCategory, setUseCustomCategory] = useState(false);
  const [customCategoryId, setCustomCategoryId] = useState('');

  const [categories, setCategories] = useState(PRESET_CATEGORIES);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Load categories by extracting them from existing courses in the backend
  useEffect(() => {
    const fetchCategoriesFromCourses = async () => {
      setLoadingCategories(true);
      try {
        const courses = await courseService.getCourses();
        if (Array.isArray(courses)) {
          const uniqueCategories = [];
          const seenIds = new Set();
          
          courses.forEach(c => {
            if (c.category) {
              const catId = typeof c.category === 'object' ? c.category._id || c.category.id : c.category;
              const catName = typeof c.category === 'object' ? c.category.name : c.category;
              
              if (catId && !seenIds.has(String(catId))) {
                seenIds.add(String(catId));
                uniqueCategories.push({ _id: catId, name: catName || catId });
              }
            }
          });

          // Merge unique categories with default presets
          const merged = [...PRESET_CATEGORIES];
          uniqueCategories.forEach(uc => {
            if (!merged.some(m => String(m._id) === String(uc._id))) {
              merged.push(uc);
            }
          });
          setCategories(merged);
        }
      } catch (err) {
        console.warn("Could not load dynamic categories from courses list:", err);
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategoriesFromCourses();
  }, []);

  // Prepopulate form if editing
  useEffect(() => {
    if (initialData) {
      const selectedCat = typeof initialData.category === 'object' && initialData.category !== null
        ? initialData.category._id || initialData.category.id || ''
        : initialData.category || '';

      // Check if the selected category is in the known list; if not, treat as custom
      const isKnown = categories.some(c => String(c._id) === String(selectedCat));

      setFormData({
        course_title: initialData.course_title || '',
        description: initialData.description || '',
        category: isKnown ? selectedCat : (selectedCat ? 'custom' : ''),
        difficulty: initialData.difficulty || 'Beginner',
        language: initialData.language || 'English',
        thumbnail: initialData.thumbnail || '',
        price: initialData.price !== undefined ? String(initialData.price) : '',
        tags: Array.isArray(initialData.tags) 
          ? initialData.tags.join(', ') 
          : typeof initialData.tags === 'string' 
            ? initialData.tags 
            : '',
        status: initialData.status || 'Published'
      });

      if (!isKnown && selectedCat) {
        setUseCustomCategory(true);
        setCustomCategoryId(selectedCat);
      }
    }
  }, [initialData, categories]);

  // Handle Input Changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'category') {
      if (value === 'custom') {
        setUseCustomCategory(true);
        setFormData((prev) => ({ ...prev, category: 'custom' }));
      } else {
        setUseCustomCategory(false);
        setFormData((prev) => ({ ...prev, category: value }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear validation error on change
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null
      }));
    }
  };

  // Client-Side Validation
  const validateForm = () => {
    const errors = {};
    if (!formData.course_title.trim()) errors.course_title = 'Course title is required';
    if (!formData.description.trim()) errors.description = 'Course description is required';
    
    if (useCustomCategory) {
      if (!customCategoryId.trim()) {
        errors.category = 'Please enter a valid Custom Category ObjectId';
      } else if (!/^[0-9a-fA-F]{24}$/.test(customCategoryId.trim())) {
        errors.category = 'Category ID must be a 24-character hexadecimal MongoDB ObjectId';
      }
    } else {
      if (!formData.category) errors.category = 'Please select a category';
    }

    if (!formData.difficulty) errors.difficulty = 'Please select a difficulty level';
    if (!formData.language.trim()) errors.language = 'Course language is required';
    
    if (formData.price === '' || formData.price === null) {
      errors.price = 'Price is required';
    } else {
      const numPrice = Number(formData.price);
      if (isNaN(numPrice) || numPrice < 0) {
        errors.price = 'Price must be a valid non-negative number';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Form Submit Handler
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Format Tags to array of strings
    const processedTags = formData.tags
      ? formData.tags.split(',').map((t) => t.trim()).filter((t) => t !== '')
      : [];

    const finalCategory = useCustomCategory ? customCategoryId.trim() : formData.category;

    const submitPayload = {
      ...formData,
      category: finalCategory,
      price: Number(formData.price),
      tags: processedTags
    };

    onSubmit(submitPayload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Title */}
        <div className="md:col-span-2">
          <label htmlFor="course_title" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Course Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="course_title"
            name="course_title"
            value={formData.course_title}
            onChange={handleChange}
            placeholder="e.g. Complete React Bootcamp: Beginner to Professional"
            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${
              validationErrors.course_title ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
            }`}
          />
          {validationErrors.course_title && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {validationErrors.course_title}
            </p>
          )}
        </div>

        {/* Short & Long Description */}
        <div className="md:col-span-2">
          <label htmlFor="description" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Course Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={5}
            placeholder="Write a compelling description that outlines what students will learn, project details, and syllabus objectives..."
            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${
              validationErrors.description ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
            }`}
          />
          {validationErrors.description && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {validationErrors.description}
            </p>
          )}
        </div>

        {/* Category Dropdown */}
        <div className={useCustomCategory ? 'md:col-span-2' : ''}>
          <label htmlFor="category" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Category <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loadingCategories}
                className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all appearance-none cursor-pointer ${
                  validationErrors.category ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              >
                <option value="" disabled>-- Select Category --</option>
                {categories.map((cat, idx) => {
                  const isObj = typeof cat === 'object' && cat !== null;
                  const value = isObj ? cat._id || cat.id : cat;
                  const name = isObj ? cat.name : cat;
                  return (
                    <option key={idx} value={value}>
                      {name}
                    </option>
                  );
                })}
                <option value="custom">-- Enter Custom Category ID --</option>
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                </svg>
              </div>
            </div>

            {/* Custom Category ID Input Field */}
            {useCustomCategory && (
              <input
                type="text"
                value={customCategoryId}
                onChange={(e) => {
                  setCustomCategoryId(e.target.value);
                  if (validationErrors.category) {
                    setValidationErrors((prev) => ({ ...prev, category: null }));
                  }
                }}
                placeholder="Paste 24-character Category ObjectId (created by admin)"
                className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${
                  validationErrors.category ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
                }`}
              />
            )}
          </div>
          
          {validationErrors.category && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {validationErrors.category}
            </p>
          )}
        </div>

        {/* Difficulty Dropdown */}
        <div>
          <label htmlFor="difficulty" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Difficulty Level <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="difficulty"
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Language */}
        <div>
          <label htmlFor="language" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Language <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="language"
            name="language"
            value={formData.language}
            onChange={handleChange}
            placeholder="e.g. English, Spanish, Japanese"
            className={`w-full px-4 py-3 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${
              validationErrors.language ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
            }`}
          />
          {validationErrors.language && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {validationErrors.language}
            </p>
          )}
        </div>

        {/* Price */}
        <div>
          <label htmlFor="price" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Price (USD) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-semibold">$</span>
            <input
              type="number"
              step="0.01"
              min="0"
              id="price"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              className={`w-full pl-8 pr-4 py-3 rounded-xl border bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all ${
                validationErrors.price ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'
              }`}
            />
          </div>
          {validationErrors.price && (
            <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1 font-medium">
              <AlertCircle className="h-3.5 w-3.5" />
              {validationErrors.price}
            </p>
          )}
        </div>

        {/* Thumbnail URL */}
        <div className="md:col-span-2">
          <label htmlFor="thumbnail" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Thumbnail Image URL
          </label>
          <input
            type="url"
            id="thumbnail"
            name="thumbnail"
            value={formData.thumbnail}
            onChange={handleChange}
            placeholder="https://example.com/image.jpg"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
          
          {/* Live Thumbnail Preview */}
          {formData.thumbnail && formData.thumbnail.startsWith('http') && (
            <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4">
              <img
                src={formData.thumbnail}
                alt="Form Preview"
                className="h-16 w-24 object-cover rounded-lg border border-slate-200"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
              <div>
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <ImageIcon className="h-3.5 w-3.5" /> Image Linked
                </span>
                <span className="text-[11px] text-slate-400 block break-all truncate max-w-sm">{formData.thumbnail}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="md:col-span-2">
          <label htmlFor="tags" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Tags (comma-separated)
          </label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={formData.tags}
            onChange={handleChange}
            placeholder="javascript, react, frontend, webdev"
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Course Status Dropdown */}
        <div>
          <label htmlFor="status" className="block text-sm font-semibold text-slate-700 mb-1.5">
            Publish Status
          </label>
          <div className="relative">
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all appearance-none cursor-pointer"
            >
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Button Row */}
      <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 border-t border-slate-100">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-800 font-semibold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-slate-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md shadow-blue-100 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-75 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              Saving Course...
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEditMode ? 'Save Changes' : 'Create Course'}
            </>
          )}
        </button>
      </div>
    </form>
  );
}
