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
        return 'Student Portal';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">

            {/* Mobile Header */}
            <div className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 p-4 flex items-center gap-4 z-10 h-16">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                    <Menu size={24} />
                </button>
                <h1 className="text-lg font-bold text-gray-900">{getPageTitle()}</h1>
            </div>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="flex-1 md:ml-64 p-4 md:p-8 pt-20 md:pt-8 transition-all w-full">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
