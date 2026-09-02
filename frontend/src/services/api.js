const API_BASE_URL = 'http://localhost:5000/api';
export const UPLOADS_BASE_URL = 'http://localhost:5000';

/**
 * Core utility to perform HTTP requests to the backend.
 * Automatically injects the JWT authentication token from localStorage.
 * Handles JSON parsing and error response mapping.
 * 
 * @async
 * @function apiFetch
 * @param {string} endpoint - API path (e.g. '/auth/login')
 * @param {Object} [options={}] - Standard fetch configuration options
 * @returns {Promise<any>} Response data from server
 */
export const apiFetch = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  // 1. Setup headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // 2. Inject JWT token from localStorage if available
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  // 3. Convert body to string if it's an object
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Throw error message returned from backend, or default to statusText
      throw new Error(data.message || response.statusText || 'Something went wrong');
    }

    return data;
  } catch (error) {
    console.error(`[API Error] Request failed for ${url}:`, error.message);
    throw error;
  }
};

// ==========================================
// AUTHENTICATION API SERVICES
// ==========================================
export const authService = {
  /**
   * Log in user
   * @param {string} email 
   * @param {string} password 
   */
  login: async (email, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
    // If successful, store token and user in localStorage
    if (res.data && res.data.token) {
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: res.data._id,
        name: res.data.name,
        email: res.data.email,
        role: res.data.role,
        status: res.data.status
      }));
    }
    return res.data;
  },

  /**
   * Sign up a new account
   * @param {string} name 
   * @param {string} email 
   * @param {string} password 
   * @param {string} role 
   */
  signup: async (name, email, password, role) => {
    return await apiFetch('/auth/signup', {
      method: 'POST',
      body: { name, email, password, role },
    });
  },

  /**
   * Log out and clear local storage auth data
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get currently logged-in user profile
   */
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Verify token status with backend profile lookup
   */
  verifySession: async () => {
    try {
      const res = await apiFetch('/auth/me');
      // Update local storage user data to match backend state (e.g. status changes)
      if (res.data) {
        localStorage.setItem('user', JSON.stringify(res.data));
      }
      return res.data;
    } catch (error) {
      // If verification fails, clear local storage
      authService.logout();
      throw error;
    }
  },

  /**
   * Update profile details
   * @param {Object} profileData
   */
  updateProfile: async (profileData) => {
    const res = await apiFetch('/auth/profile', {
      method: 'PUT',
      body: profileData,
    });
    if (res.data) {
      const current = authService.getCurrentUser();
      localStorage.setItem('user', JSON.stringify({
        ...current,
        name: res.data.name,
        email: res.data.email,
        phone: res.data.phone,
        occupation: res.data.occupation,
      }));
    }
    return res.data;
  },

  /**
   * Get all bookmarked courses in wishlist
   */
  getWishlist: async () => {
    const res = await apiFetch('/auth/wishlist');
    return res.data;
  },

  /**
   * Add course to wishlist
   */
  addToWishlist: async (courseId) => {
    return await apiFetch(`/auth/wishlist/${courseId}`, {
      method: 'POST',
    });
  },

  /**
   * Remove course from wishlist
   */
  removeFromWishlist: async (courseId) => {
    return await apiFetch(`/auth/wishlist/${courseId}`, {
      method: 'DELETE',
    });
  }
};

// ==========================================
// ADMIN PANEL API SERVICES
// ==========================================
export const adminService = {
  /**
   * Retrieve all users, optionally filtered
   * @param {Object} [filters={}] - Optional filters: { role, status, search }
   */
  getUsers: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.role) queryParams.append('role', filters.role);
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    
    const queryString = queryParams.toString();
    const endpoint = `/admin/users${queryString ? `?${queryString}` : ''}`;
    
    const res = await apiFetch(endpoint);
    return res.data;
  },

  /**
   * Update user status (approve instructor, suspend/unsuspend)
   * @param {string} userId 
   * @param {string} status - 'active' | 'suspended' | 'pending'
   */
  updateUserStatus: async (userId, status) => {
    const res = await apiFetch(`/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: { status },
    });
    return res;
  },

  /**
   * Delete user
   * @param {string} userId 
   */
  deleteUser: async (userId) => {
    return await apiFetch(`/admin/users/${userId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get all categories
   */
  getCategories: async () => {
    const res = await apiFetch('/admin/categories');
    return res.data;
  },

  /**
   * Create new category
   * @param {string} name 
   * @param {string} description 
   */
  createCategory: async (name, description) => {
    const res = await apiFetch('/admin/categories', {
      method: 'POST',
      body: { name, description },
    });
    return res.data;
  },

  /**
   * Update category
   * @param {string} categoryId 
   * @param {string} name 
   * @param {string} description 
   */
  updateCategory: async (categoryId, name, description) => {
    const res = await apiFetch(`/admin/categories/${categoryId}`, {
      method: 'PUT',
      body: { name, description },
    });
    return res.data;
  },

  /**
   * Delete category
   * @param {string} categoryId 
   */
  deleteCategory: async (categoryId) => {
    return await apiFetch(`/admin/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }
};

// ==========================================
// COURSE BROWSING API SERVICES
// ==========================================
export const courseService = {
  /**
   * Get all published courses, with optional filters
   * @param {Object} [filters={}] - Optional filters: { category, level, search }
   */
  getCourses: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.category) queryParams.append('category', filters.category);
    if (filters.level) queryParams.append('level', filters.level);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.instructor) queryParams.append('instructor', filters.instructor);

    const queryString = queryParams.toString();
    const endpoint = `/courses${queryString ? `?${queryString}` : ''}`;

    const res = await apiFetch(endpoint);
    return res.data;
  },

  /**
   * Get a single course's details
   * @param {string} courseId
   */
  getCourseById: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}`);
    return res.data;
  },

  /**
   * Create a new course
   * @param {Object} courseData
   */
  createCourse: async (courseData) => {
    const res = await apiFetch('/courses', {
      method: 'POST',
      body: courseData,
    });
    return res.data;
  },

  /**
   * Get all courses created by the logged-in instructor
   */
  getInstructorCourses: async () => {
    const res = await apiFetch('/courses/instructor/my');
    return res.data;
  },

  /**
   * Update a course's primary and co-instructors
   * @param {string} courseId
   * @param {Object} instructorsData - { instructor: string, coInstructors: string[] }
   */
  updateCourseInstructors: async (courseId, instructorsData) => {
    const res = await apiFetch(`/courses/${courseId}/instructors`, {
      method: 'PATCH',
      body: instructorsData,
    });
    return res.data;
  },

  /**
   * Get all active/verified instructors
   */
  getActiveInstructors: async () => {
    const res = await apiFetch('/courses/instructors/active');
    return res.data;
  },

  updateCourseModules: async (courseId, modules) => {
    const res = await apiFetch(`/courses/${courseId}/modules`, {
      method: 'PUT',
      body: { modules },
    });
    return res.data;
  },

  /**
   * Toggle completion status of course (mark course completed / active)
   * @param {string} courseId
   */
  toggleCourseCompletion: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}/completion`, {
      method: 'PATCH',
    });
    return res.data;
  },
};

// ==========================================
// COURSE FILES & SUBMISSIONS
// ==========================================
const uploadFetch = async (endpoint, formData) => {
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || response.statusText || 'Upload failed');
  }
  return data;
};

export const courseFileService = {
  getMaterials: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}/materials`);
    return res.data;
  },

  uploadMaterial: async (courseId, file, moduleOrder = null) => {
    const formData = new FormData();
    formData.append('file', file);
    if (moduleOrder != null) {
      formData.append('moduleOrder', String(moduleOrder));
    }
    const res = await uploadFetch(`/courses/${courseId}/materials`, formData);
    return res.data;
  },

  getMySubmissions: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}/submissions/mine`);
    return res.data;
  },

  getCourseSubmissions: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}/submissions`);
    return res.data;
  },

  uploadSubmission: async (courseId, file, title) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    const res = await uploadFetch(`/courses/${courseId}/submissions`, formData);
    return res.data;
  },
};

// ==========================================
// ENROLLMENT API SERVICES
// ==========================================
export const enrollmentService = {
  /**
   * Enroll the logged-in student in a course
   * @param {string} courseId
   */
  enroll: async (courseId) => {
    const res = await apiFetch(`/enrollments/${courseId}`, {
      method: 'POST',
    });
    return res;
  },

  /**
   * Get all courses the logged-in student is enrolled in
   */
  getMyEnrollments: async () => {
    const res = await apiFetch('/enrollments/my');
    return res.data;
  },

  /**
   * Check whether the logged-in user is enrolled in a specific course
   * @param {string} courseId
   */
  getEnrollmentStatus: async (courseId) => {
    const res = await apiFetch(`/enrollments/status/${courseId}`);
    return res.data;
  },

  /**
   * Unenroll from a course
   * @param {string} enrollmentId
   */
  unenroll: async (enrollmentId) => {
    return await apiFetch(`/enrollments/${enrollmentId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Get all students enrolled in a specific course
   * @param {string} courseId
   */
  getCourseEnrollments: async (courseId) => {
    const res = await apiFetch(`/enrollments/course/${courseId}`);
    return res.data;
  },

  /**
   * Remove a student from a course (Admin force)
   * @param {string} courseId
   * @param {string} studentId
   */
  removeStudentFromCourse: async (courseId, studentId) => {
    return await apiFetch(`/enrollments/course/${courseId}/student/${studentId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Enroll a student in a course (Admin force)
   * @param {string} courseId
   * @param {string} studentId
   */
  enrollStudentInCourse: async (courseId, studentId) => {
    return await apiFetch(`/enrollments/course/${courseId}/student/${studentId}`, {
      method: 'POST',
    });
  },

  /**
   * Enroll multiple students in a course (Admin force bulk)
   * @param {string} courseId
   * @param {string[]} studentIds
   */
  enrollStudentsInCourseBulk: async (courseId, studentIds) => {
    return await apiFetch(`/enrollments/course/${courseId}/students`, {
      method: 'POST',
      body: { studentIds },
    });
  },

  /**
   * Get all active students
   */
  getActiveStudents: async () => {
    const res = await apiFetch('/enrollments/active-students');
    return res.data;
  },
};

// ==========================================
// NOTIFICATION API SERVICES
// ==========================================
export const notificationService = {
  /**
   * Get the logged-in user's notifications (most recent first, max 50)
   */
  getMyNotifications: async () => {
    const res = await apiFetch('/notifications');
    return res; // caller needs both data and unreadCount
  },

  /**
   * Cheap poll target — just the unread count, not the full list
   */
  getUnreadCount: async () => {
    const res = await apiFetch('/notifications/unread-count');
    return res.data.unreadCount;
  },

  /**
   * Mark a single notification as read
   * @param {string} notificationId
   */
  markAsRead: async (notificationId) => {
    return await apiFetch(`/notifications/${notificationId}/read`, {
      method: 'PATCH',
    });
  },

  /**
   * Mark all of the logged-in user's notifications as read
   */
  markAllAsRead: async () => {
    return await apiFetch('/notifications/read-all', {
      method: 'PATCH',
    });
  },

  /**
   * Delete a single notification
   * @param {string} notificationId
   */
  deleteNotification: async (notificationId) => {
    return await apiFetch(`/notifications/${notificationId}`, {
      method: 'DELETE',
    });
  },
};

// ==========================================
// ASSIGNMENT API SERVICES
// ==========================================
export const assignmentService = {
  createAssignment: async (courseId, title, description, deadline, maxMarks, file = null) => {
    if (file) {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('deadline', deadline);
      formData.append('maxMarks', String(maxMarks));
      formData.append('file', file);
      const res = await uploadFetch(`/assignments/course/${courseId}`, formData);
      return res.data;
    } else {
      const res = await apiFetch(`/assignments/course/${courseId}`, {
        method: 'POST',
        body: { title, description, deadline, maxMarks },
      });
      return res.data;
    }
  },

  getCourseAssignments: async (courseId) => {
    const res = await apiFetch(`/assignments/course/${courseId}`);
    return res.data;
  },

  getAssignmentById: async (assignmentId) => {
    const res = await apiFetch(`/assignments/${assignmentId}`);
    return res.data;
  },

  updateAssignment: async (assignmentId, title, description, deadline, maxMarks, file = null) => {
    if (file) {
      const formData = new FormData();
      if (title) formData.append('title', title);
      if (description) formData.append('description', description);
      if (deadline) formData.append('deadline', deadline);
      if (maxMarks) formData.append('maxMarks', String(maxMarks));
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const headers = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const response = await fetch(`${API_BASE_URL}/assignments/${assignmentId}`, {
        method: 'PUT',
        headers,
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Update failed');
      return data.data;
    } else {
      const res = await apiFetch(`/assignments/${assignmentId}`, {
        method: 'PUT',
        body: { title, description, deadline, maxMarks },
      });
      return res.data;
    }
  },

  deleteAssignment: async (assignmentId) => {
    return await apiFetch(`/assignments/${assignmentId}`, {
      method: 'DELETE',
    });
  },

  submitAssignment: async (assignmentId, file = null, submissionText = '') => {
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (submissionText) formData.append('submissionText', submissionText);
    const res = await uploadFetch(`/assignments/${assignmentId}/submit`, formData);
    return res.data;
  },

  getAssignmentSubmissions: async (assignmentId) => {
    const res = await apiFetch(`/assignments/${assignmentId}/submissions`);
    return res.data;
  },

  getMySubmission: async (assignmentId) => {
    const res = await apiFetch(`/assignments/${assignmentId}/my-submission`);
    return res.data;
  },

  gradeSubmission: async (submissionId, marks, feedback) => {
    const res = await apiFetch(`/assignments/submissions/${submissionId}/grade`, {
      method: 'PATCH',
      body: { marks, feedback },
    });
    return res.data;
  },

  getMyAssignmentsOverview: async () => {
    const res = await apiFetch('/assignments/student/my');
    return res.data;
  },
};

// ==========================================
// QUIZ & ASSESSMENT API SERVICES
// ==========================================
export const quizService = {
  /**
   * Create a new quiz for a course
   * @param {Object} quizData
   */
  createQuiz: async (quizData) => {
    const res = await apiFetch('/quizzes', {
      method: 'POST',
      body: quizData,
    });
    return res.data;
  },

  /**
   * Update an existing quiz
   * @param {string} quizId
   * @param {Object} quizData
   */
  updateQuiz: async (quizId, quizData) => {
    const res = await apiFetch(`/quizzes/${quizId}`, {
      method: 'PUT',
      body: quizData,
    });
    return res.data;
  },

  /**
   * Delete a quiz
   * @param {string} quizId
   */
  deleteQuiz: async (quizId) => {
    return await apiFetch(`/quizzes/${quizId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Toggle quiz publish status
   * @param {string} quizId
   */
  togglePublishQuiz: async (quizId) => {
    const res = await apiFetch(`/quizzes/${quizId}/publish`, {
      method: 'PATCH',
    });
    return res.data;
  },

  /**
   * Get all quizzes for a course (instructor gets all with answers, student gets published quizzes)
   * @param {string} courseId
   */
  getCourseQuizzes: async (courseId) => {
    const res = await apiFetch(`/quizzes/course/${courseId}`);
    return res.data;
  },

  /**
   * Get a single quiz by ID
   * @param {string} quizId
   */
  getQuizById: async (quizId) => {
    const res = await apiFetch(`/quizzes/${quizId}`);
    return res.data;
  },

  /**
   * Submit quiz answers for grading
   * @param {string} quizId
   * @param {Object} attemptData { answers: [...], timeSpentSeconds: number }
   */
  submitQuizAttempt: async (quizId, attemptData) => {
    const res = await apiFetch(`/quizzes/${quizId}/attempt`, {
      method: 'POST',
      body: attemptData,
    });
    return res.data;
  },

  /**
   * Get student's previous attempts for a quiz
   * @param {string} quizId
   */
  getMyQuizAttempts: async (quizId) => {
    const res = await apiFetch(`/quizzes/${quizId}/attempts/mine`);
    return res.data;
  },

  /**
   * Get detailed attempt review (with answers and explanations)
   * @param {string} attemptId
   */
  getAttemptReview: async (attemptId) => {
    const res = await apiFetch(`/quizzes/attempts/${attemptId}/review`);
    return res.data;
  },

  /**
   * Get instructor submissions & analytics for a quiz
   * @param {string} quizId
   */
  getQuizSubmissions: async (quizId) => {
    const res = await apiFetch(`/quizzes/${quizId}/submissions`);
    return res.data;
  },

  /**
   * Toggle completed status of a quiz (mark quiz completed / active)
   * @param {string} quizId
   */
  toggleCompleteQuiz: async (quizId) => {
    const res = await apiFetch(`/quizzes/${quizId}/complete`, {
      method: 'PATCH',
    });
    return res.data;
  },
};

// ==========================================
// DISCUSSION FORUM API SERVICES
// ==========================================
export const forumService = {
  /**
   * List threads for a course (pinned first, most recently active first)
   * @param {string} courseId
   */
  getThreads: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}/threads`);
    return res.data;
  },

  /**
   * Get a single thread with all of its posts
   * @param {string} courseId
   * @param {string} threadId
   */
  getThread: async (courseId, threadId) => {
    const res = await apiFetch(`/courses/${courseId}/threads/${threadId}`);
    return res.data;
  },

  /**
   * Start a new thread (with its opening post)
   * @param {string} courseId
   * @param {{title: string, content: string}} payload
   */
  createThread: async (courseId, payload) => {
    const res = await apiFetch(`/courses/${courseId}/threads`, {
      method: 'POST',
      body: payload,
    });
    return res.data;
  },

  /**
   * Reply to a thread
   * @param {string} courseId
   * @param {string} threadId
   * @param {string} content
   */
  createPost: async (courseId, threadId, content) => {
    const res = await apiFetch(`/courses/${courseId}/threads/${threadId}/posts`, {
      method: 'POST',
      body: { content },
    });
    return res.data;
  },

  /**
   * Delete a thread (author, or instructor/co-instructor/admin only)
   * @param {string} courseId
   * @param {string} threadId
   */
  deleteThread: async (courseId, threadId) => {
    return await apiFetch(`/courses/${courseId}/threads/${threadId}`, {
      method: 'DELETE',
    });
  },

  /**
   * Delete a single reply (author, or instructor/co-instructor/admin only)
   * @param {string} courseId
   * @param {string} threadId
   * @param {string} postId
   */
  deletePost: async (courseId, threadId, postId) => {
    return await apiFetch(`/courses/${courseId}/threads/${threadId}/posts/${postId}`, {
      method: 'DELETE',
    });
  },
};

// ==========================================
// ANALYTICS API SERVICES
// ==========================================
export const analyticsService = {
  /**
   * Cross-course analytics for every course the logged-in instructor teaches
   */
  getInstructorAnalytics: async () => {
    const res = await apiFetch('/analytics/instructor');
    return res.data;
  },

  /**
   * Detailed analytics for a single course (instructor/co-instructor/admin only)
   * @param {string} courseId
   */
  getCourseAnalytics: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}/analytics`);
    return res.data;
  },

  /**
   * Platform-wide analytics
   */
  getAdminAnalytics: async () => {
    const res = await apiFetch('/analytics/admin');
    return res.data;
  },
};

// ==========================================
// REVIEW & RATING API SERVICES
// ==========================================
export const reviewService = {
  /**
   * List all reviews for a course (public, most recent first)
   * @param {string} courseId
   */
  getCourseReviews: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}/reviews`);
    return res.data;
  },

  /**
   * Get the logged-in student's own review for a course, if any (null if none)
   * @param {string} courseId
   */
  getMyReview: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}/reviews/my`);
    return res.data;
  },

  /**
   * Create or update the logged-in student's review for this course
   * @param {string} courseId
   * @param {{rating: number, comment?: string}} payload
   */
  submitReview: async (courseId, payload) => {
    const res = await apiFetch(`/courses/${courseId}/reviews`, {
      method: 'POST',
      body: payload,
    });
    return res.data;
  },

  /**
   * Delete a review (author, or instructor/co-instructor/admin of the course)
   * @param {string} courseId
   * @param {string} reviewId
   */
  deleteReview: async (courseId, reviewId) => {
    return await apiFetch(`/courses/${courseId}/reviews/${reviewId}`, {
      method: 'DELETE',
    });
  },
};

// ==========================================
// CERTIFICATE API SERVICES
// ==========================================
export const certificateService = {
  /**
   * Check if current student has passed all quizzes for a course and qualifies for a certificate
   * @param {string} courseId
   */
  getCourseCertificateStatus: async (courseId) => {
    const res = await apiFetch(`/certificates/course/${courseId}/status`);
    return res.data;
  },

  /**
   * Generate or retrieve certificate for student upon passing all course quizzes
   * @param {string} courseId
   */
  generateCertificate: async (courseId) => {
    const res = await apiFetch(`/certificates/course/${courseId}/generate`, {
      method: 'POST',
    });
    return res.data;
  },

  /**
   * Get all earned certificates for the logged-in student
   */
  getMyCertificates: async () => {
    const res = await apiFetch('/certificates/my-certificates');
    return res.data;
  },

  /**
   * Download the official Certificate of Completion as a PDF file
   * @param {string} courseId
   * @param {string} [courseTitle='Certificate']
   */
  downloadCertificatePDF: async (courseId, courseTitle = 'Certificate') => {
    const token = localStorage.getItem('token');
    const response = await fetch(`http://localhost:5000/api/certificates/course/${courseId}/download`, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Download failed' }));
      throw new Error(errorData.message || 'Failed to download certificate PDF');
    }

    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const downloadLink = document.createElement('a');
    const safeTitle = courseTitle.replace(/[^a-z0-9_-]/gi, '_');
    downloadLink.href = blobUrl;
    downloadLink.download = `Certificate_${safeTitle}.pdf`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    window.URL.revokeObjectURL(blobUrl);
    document.body.removeChild(downloadLink);
  },

  /**
   * Public certificate verification by credential ID
   * @param {string} certificateId
   */
  verifyCertificate: async (certificateId) => {
    const res = await apiFetch(`/certificates/verify/${encodeURIComponent(certificateId)}`);
    return res.data;
  },
};
