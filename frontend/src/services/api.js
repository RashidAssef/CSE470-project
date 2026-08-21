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
// ANNOUNCEMENT API SERVICES
// ==========================================
export const announcementService = {
  getAnnouncements: async (courseId) => {
    const res = await apiFetch(`/courses/${courseId}/announcements`);
    return res.data;
  },

  createAnnouncement: async (courseId, title, content) => {
    const res = await apiFetch(`/courses/${courseId}/announcements`, {
      method: 'POST',
      body: { title, content },
    });
    return res.data;
  },

  deleteAnnouncement: async (announcementId) => {
    return await apiFetch(`/announcements/${announcementId}`, {
      method: 'DELETE',
    });
  },
};
