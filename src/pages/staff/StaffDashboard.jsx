import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { BookOpen, Users, Clock } from 'lucide-react';

import api from '../../services/api';

const StaffDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = React.useState({ courses: 0, students: 0, upcomingClasses: 0 });
    const [loading, setLoading] = React.useState(true);

    React.useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get('/staff/stats');
                setStats(data);
            } catch (error) {
                console.error('Failed to fetch stats', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    // Logic: If name starts with a title (Mr., Ms., Dr., Prof.), use the first two words (e.g. "Ms. Connor"). 
    // Otherwise just use the first name (e.g. "Alex").
    const getDisplayName = (fullName) => {
        if (!fullName) return 'Staff';
        const parts = fullName.split(' ');
        const honorifics = ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Prof.'];
        if (honorifics.some(h => parts[0].startsWith(h)) && parts.length > 1) {
            return `${parts[0]} ${parts[1]}`;
        }
        return parts[0];
    };

    const displayName = getDisplayName(user?.name);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome back, {displayName}
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">My Courses</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.courses}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Total Students</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.students}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Clock size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Upcoming Classes</p>
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{loading ? '...' : stats.upcomingClasses}</h3>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <p className="text-gray-500 dark:text-gray-400">Select a course from "My Courses" to manage grades and assignments.</p>
            </div>
        </div>
    );
};

export default StaffDashboard;
