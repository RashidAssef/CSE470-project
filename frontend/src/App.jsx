import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import InstructorDashboard from './pages/InstructorDashboard.jsx';
import InstructorCourseManage from './pages/InstructorCourseManage.jsx';
import BrowseCourses from './pages/BrowseCourses.jsx';
import CourseDetail from './pages/CourseDetail.jsx';
import Notifications from './pages/Notifications.jsx';
import CourseForum from './pages/CourseForum.jsx';
import ThreadDetail from './pages/ThreadDetail.jsx';
import InstructorAnalytics from './pages/InstructorAnalytics.jsx';
import AdminAnalytics from './pages/AdminAnalytics.jsx';
import CourseAnalytics from './pages/CourseAnalytics.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Course Enrollment Routes (public browsing; enroll action requires student login) */}
      <Route path="/courses" element={<BrowseCourses />} />
      <Route path="/courses/:id" element={<CourseDetail />} />

      {/* Discussion Forum (enrolled students, instructor/co-instructor/admin only) */}
      <Route path="/courses/:id/forum" element={<CourseForum />} />
      <Route path="/courses/:id/forum/:threadId" element={<ThreadDetail />} />

      {/* Course-level Analytics (instructor/co-instructor of that course, or admin) */}
      <Route path="/courses/:id/analytics" element={<CourseAnalytics />} />

      {/* Notifications (any logged-in role) */}
      <Route path="/notifications" element={<Notifications />} />

      {/* Protected Admin Routes */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Student Routes */}
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      {/* Protected Instructor Routes */}
      <Route
        path="/instructor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/courses/:courseId/manage"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorCourseManage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/analytics"
        element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <InstructorAnalytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/analytics"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAnalytics />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
