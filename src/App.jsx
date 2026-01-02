import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Schedule from './pages/Schedule';
import Profile from './pages/Profile';
import Assignments from './pages/Assignments';
import Login from './pages/Login';

import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import AdminDashboard from './pages/admin/AdminDashboard';
import StudentManagement from './pages/admin/StudentManagement';
import CourseManagement from './pages/admin/CourseManagement';
import StaffManagement from './pages/admin/StaffManagement';
import Analytics from './pages/admin/Analytics';
import AuditLogs from './pages/admin/AuditLogs';
import Announcements from './pages/admin/Announcements';
import StaffDashboard from './pages/staff/StaffDashboard';
import MyCourses from './pages/staff/MyCourses';
import StaffCourseDetails from './pages/staff/StaffCourseDetails';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <BrowserRouter>
          <Toaster position="top-right" reverseOrder={false} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Student Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']} />}>
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="courses" element={<Courses />} />
                <Route path="assignments" element={<Assignments />} />

                <Route path="profile" element={<Profile />} />
              </Route>
            </Route>

            {/* Shared Routes (Student & Staff) */}
            <Route element={<ProtectedRoute allowedRoles={['STUDENT', 'STAFF', 'TUTOR', 'ADMIN']} />}>
              <Route element={<MainLayout />}>
                <Route path="/schedule" element={<Schedule />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin" element={<MainLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="students" element={<StudentManagement />} />
                <Route path="courses" element={<CourseManagement />} />
                <Route path="staff" element={<StaffManagement />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="audit-logs" element={<AuditLogs />} />
                <Route path="announcements" element={<Announcements />} />
              </Route>
            </Route>

            {/* Staff Routes */}
            <Route element={<ProtectedRoute allowedRoles={['STAFF', 'TUTOR', 'ADMIN']} />}>
              <Route path="/staff" element={<MainLayout />}>
                <Route index element={<StaffDashboard />} />
                <Route path="courses" element={<MyCourses />} />
                <Route path="courses/:id" element={<StaffCourseDetails />} />
              </Route>
            </Route>
          </Routes>
        </BrowserRouter>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
