import axios from 'axios';

// Base API configuration, using environment variable or a standard fallback port
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to automatically attach JWT token from localStorage to outgoing requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Decode JWT token to retrieve the logged-in user's ObjectId.
 * Supports standard JWT strings and mock dev tokens.
 */
export const getUserIdFromToken = () => {
  const token = localStorage.getItem('token');
  if (!token) return null;

  if (token.includes('.')) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const decoded = JSON.parse(jsonPayload);
      // Retrieve MongoDB _id or general user id key
      return decoded._id || decoded.id || decoded.userId || decoded.user?._id;
    } catch (e) {
      console.error('Failed to decode JWT token payload:', e);
    }
  }

  // Fallback for mock dev testing tokens
  return token;
};

/**
 * Fetch all available courses from the database.
 * GET /api/courses
 */
export const getCourses = async () => {
  const response = await api.get('/courses');
  return response.data;
};

/**
 * Fetch detailed information for a single course.
 * GET /api/courses/:id
 */
export const getCourse = async (id) => {
  const response = await api.get(`/courses/${id}`);
  return response.data;
};

/**
 * Create a new course. Instructor user ID is assigned automatically by the backend JWT.
 * POST /api/courses
 */
export const createCourse = async (data) => {
  const response = await api.post('/courses', data);
  return response.data;
};

/**
 * Update an existing course.
 * PUT /api/courses/:id
 */
export const updateCourse = async (id, data) => {
  const response = await api.put(`/courses/${id}`, data);
  return response.data;
};

/**
 * Remove/Delete a course from the platform.
 * DELETE /api/courses/:id
 * Accepts categoryId to accommodate category-specific delete rules.
 */
export const deleteCourse = async (id, categoryId) => {
  const config = {
    // Send categoryId in query parameters AND/OR body for maximum backend compatibility
    params: categoryId ? { categoryId } : {},
    data: categoryId ? { categoryId } : {},
  };
  const response = await api.delete(`/courses/${id}`, config);
  return response.data;
};

/**
 * Fetch courses created by the logged-in instructor.
 * Filters the list of all courses by matching course.instructor with the JWT user ID.
 */
export const getMyCourses = async () => {
  const allCourses = await getCourses();
  const currentUserId = getUserIdFromToken();

  console.log('Instructor Course Filtering Debug:', {
    currentUserId,
    allCoursesCount: allCourses.length,
    courseDetails: allCourses.map(c => ({
      course_title: c.course_title,
      instructor: c.instructor,
      resolvedId: typeof c.instructor === 'object' && c.instructor !== null
        ? c.instructor._id || c.instructor.id
        : c.instructor
    }))
  });

  if (!currentUserId) {
    return [];
  }

  return allCourses.filter((course) => {
    const instructorVal = course.instructor;
    const instructorId =
      typeof instructorVal === 'object' && instructorVal !== null
        ? instructorVal._id || instructorVal.id
        : instructorVal;

    return instructorId && String(instructorId) === String(currentUserId);
  });
};

const courseService = {
  getUserIdFromToken,
  getCourses,
  getCourse,
  createCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
};

export default courseService;
