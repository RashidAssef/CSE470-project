import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import StudentDashboard from './pages/StudentDashboard.jsx';
import InstructorDashboard from './pages/InstructorDashboard.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import CourseDetails from './pages/CourseDetails.jsx';
import CreateCourse from './pages/CreateCourse.jsx';
import EditCourse from './pages/EditCourse.jsx';
import MyCourses from './pages/MyCourses.jsx';
import NotFound from './pages/NotFound.jsx';

function App() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      <Navbar />

      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          <Route path="/courses/:id" element={<CourseDetails />} />

          {/* Instructor Routes */}
          <Route
            path="/create-course"
            element={
              <ProtectedRoute allowedRoles={["instructor"]}>
                <CreateCourse />
              </ProtectedRoute>
            }
          />

          <Route
            path="/edit-course/:id"
            element={
              <ProtectedRoute allowedRoles={["instructor"]}>
                <EditCourse />
              </ProtectedRoute>
            }
          />

          <Route
            path="/my-courses"
            element={
              <ProtectedRoute allowedRoles={["instructor"]}>
                <MyCourses />
              </ProtectedRoute>
            }
          />

          <Route
            path="/instructor/dashboard"
            element={
              <ProtectedRoute allowedRoles={["instructor"]}>
                <InstructorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Student Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      <footer className="bg-white border-t border-slate-100 py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 space-y-1">
          <p>
            &copy; {new Date().getFullYear()} Interactive Learning Platform. All
            rights reserved.
          </p>
          <p>Admin Portal • Course Creation & Publishing Panel</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
