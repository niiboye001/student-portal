import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <AuthProvider>
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
              <Route path="schedule" element={<Schedule />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="/admin" element={<MainLayout />}>
              <Route index element={<AdminDashboard />} />
              <Route path="students" element={<StudentManagement />} />
              <Route path="courses" element={<CourseManagement />} />
              {/* Add more admin routes here later */}
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

