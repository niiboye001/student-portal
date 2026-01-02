import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { Menu } from 'lucide-react';

const MainLayout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Mapping routes to titles for the mobile header
    const getPageTitle = () => {
        const path = location.pathname;
        if (path === '/') return 'Dashboard';
        if (path === '/courses') return 'Courses';
        if (path === '/schedule') return 'Schedule';
        if (path === '/profile') return 'Profile';
        if (path === '/admin') return 'Admin Dashboard';
        if (path === '/admin/students') return 'Student Management';
        if (path === '/admin/courses') return 'Course Management';
        if (path === '/admin/staff') return 'Staff Management';
        if (path === '/admin/analytics') return 'Analytics';
        if (path === '/staff') return 'Staff Dashboard';
        if (path === '/staff/courses') return 'My Courses';
        return 'Student Portal';
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex transition-colors duration-200">

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex items-center gap-4 z-10 h-16 print:hidden">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">{getPageTitle()}</h1>
            </div>

            <div className="print:hidden">
                <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            </div>

            <main className="flex-1 md:ml-64 print:ml-0 p-4 md:p-8 pt-20 md:pt-8 transition-all w-full">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
