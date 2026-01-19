
import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Bell, BookOpen, Calendar, CheckCircle, Clock, Users, X, Archive } from 'lucide-react';

import api from '../../services/api';

const StaffDashboard = () => {
    const { user } = useAuth();
    const [stats, setStats] = React.useState({ courses: 0, students: 0, upcomingClasses: 0, announcements: [] });
    const [loading, setLoading] = React.useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = React.useState(null);

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
            return `${parts[0]} ${parts[1]} `;
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Announcements Section */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bell size={20} className="text-orange-600 dark:text-orange-400" />
                            Announcements
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {stats.announcements && stats.announcements.length > 0 ? (
                            stats.announcements.map((ann) => (
                                <div
                                    key={ann.id}
                                    onClick={() => setSelectedAnnouncement(ann)}
                                    className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="flex items-start justify-between">
                                        <span className={`text - xs font - semibold px - 2 py - 0.5 rounded - full ${ann.type === 'academic' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                            } `}>
                                            {ann.type.toUpperCase()}
                                        </span>
                                        <span className="text-xs text-gray-400">{ann.date}</span>
                                    </div>
                                    <h3 className="mt-2 font-medium text-gray-900 dark:text-white">{ann.title}</h3>
                                    <div className="flex items-center gap-1 mt-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
                                        <BookOpen size={12} />
                                        {ann.courseName}
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-sm text-gray-500 truncate flex-1">{ann.content}</p>
                                        {ann.expiresAt && new Date(ann.expiresAt) < new Date() && (
                                            <button
                                                onClick={(e) => handleArchiveAnnouncement(e, ann.id)}
                                                className="ml-2 p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                                title="Archive Announcement"
                                            >
                                                <Archive size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500 dark:text-gray-400 italic">No announcements found.</p>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                    <p className="text-gray-500 dark:text-gray-400">Select a course from "My Courses" to manage grades and assignments.</p>
                </div>
            </div>

            {/* Announcement Details Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text - xs font - bold uppercase px - 2 py - 1 rounded ${selectedAnnouncement.type === 'academic'
                                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                        } `}>
                                        {selectedAnnouncement.type}
                                    </span>
                                    <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded flex items-center gap-1">
                                        <BookOpen size={12} />
                                        {selectedAnnouncement.courseName}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white mt-2">
                                    {selectedAnnouncement.title}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Posted on {selectedAnnouncement.date}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="prose dark:prose-invert max-w-none">
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">
                                {selectedAnnouncement.content}
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                onClick={() => setSelectedAnnouncement(null)}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffDashboard;
