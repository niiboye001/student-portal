import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, Calendar, User, LogOut, X, FileText, Briefcase, BarChart2, Moon, Sun, Shield, Megaphone } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import clsx from 'clsx';

const Sidebar = ({ isOpen, onClose }) => {
    const { logout, user } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const studentItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: BookOpen, label: 'Courses', path: '/courses' },
        { icon: FileText, label: 'Assignments', path: '/assignments' },
        { icon: Calendar, label: 'Schedule', path: '/schedule' },
        { icon: User, label: 'Profile', path: '/profile' },
    ];

    const adminItems = [
        { icon: LayoutDashboard, label: 'Admin Dashboard', path: '/admin' },
        { icon: User, label: 'Student Management', path: '/admin/students' },
        { icon: BookOpen, label: 'Course Management', path: '/admin/courses' },
        { icon: Briefcase, label: 'Staff Management', path: '/admin/staff' },
        { icon: BarChart2, label: 'Analytics', path: '/admin/analytics' },
        { icon: FileText, label: 'Audit Logs', path: '/admin/audit-logs' },
        { icon: Megaphone, label: 'Announcements', path: '/admin/announcements' },
    ];

    const staffItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/staff' },
        { icon: BookOpen, label: 'My Courses', path: '/staff/courses' },
        { icon: Calendar, label: 'Schedule', path: '/schedule' }, // Using common schedule for now
    ];

    const navItems = user?.role === 'ADMIN' ? adminItems :
        user?.role === 'STAFF' || user?.role === 'TUTOR' ? staffItems : studentItems;

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={onClose}
                />
            )}

            <aside className={clsx(
                "fixed top-0 left-0 z-30 h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ease-in-out md:translate-x-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">SP</div>
                        <span className="text-xl font-bold text-gray-800 dark:text-white">Student Portal</span>
                    </div>
                    <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-700">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            onClick={() => onClose()} // Close sidebar on mobile when link is clicked
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) =>
                                clsx(
                                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium',
                                    isActive
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
                                )
                            }
                        >
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-col gap-2">
                    <button
                        onClick={toggleTheme}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                        <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors font-medium"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
