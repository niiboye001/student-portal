import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { GraduationCap, Clock, Award, TrendingUp, Calendar, Bell, BookOpen } from 'lucide-react';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const response = await api.get('/student/dashboard');
                setData(response.data);
            } catch (error) {
                console.error('Error fetching dashboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading dashboard...</div>;
    if (!data) return <div className="p-8 text-center text-red-500">Failed to load data</div>;

    const { student, stats, upcomingClasses, announcements } = data;

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome back, {student.name}!</h1>
                <p className="text-gray-500 dark:text-gray-400">Here's what's happening today.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="GPA"
                    value={stats.gpa}
                    icon={Award}
                    color="bg-purple-600"
                />
                <StatCard
                    label="Active Courses"
                    value={stats.activeCourses}
                    icon={BookOpen}
                    color="bg-blue-600"
                />
                <StatCard
                    label="Avg. Progress"
                    value={`${stats.avgProgress}%`}
                    icon={TrendingUp}
                    color="bg-green-600"
                />
                <StatCard
                    label="Assignments Due"
                    value={stats.upcomingAssignments}
                    icon={Clock}
                    color="bg-orange-600"
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Upcoming Classes */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600 dark:text-blue-400" />
                            Upcoming Classes
                        </h2>
                        <button className="text-sm text-blue-600 dark:text-blue-400 hover:underline">View Schedule</button>
                    </div>
                    <div className="space-y-4">
                        {upcomingClasses.map((cls) => (
                            <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-900 dark:text-white">{cls.name}</span>
                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                        <span className={`font-medium ${cls.isToday ? 'text-green-600 dark:text-green-400' : 'text-blue-600 dark:text-blue-400'}`}>
                                            {cls.isToday ? 'Today' : cls.day}
                                        </span>
                                        <span>•</span>
                                        <span>{cls.room}</span>
                                    </div>
                                </div>
                                <div className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full border border-gray-200 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {cls.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Bell size={20} className="text-orange-600 dark:text-orange-400" />
                            Announcements
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {announcements.map((ann) => (
                            <div
                                key={ann.id}
                                onClick={() => setSelectedAnnouncement(ann)}
                                className="p-4 border border-gray-100 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                                <div className="flex items-start justify-between">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ann.type === 'academic' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                                        }`}>
                                        {ann.type.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-400">{ann.date}</span>
                                </div>
                                <h3 className="mt-2 font-medium text-gray-900 dark:text-white">{ann.title}</h3>
                                <p className="text-sm text-gray-500 mt-1 truncate">{ann.content}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Announcement Details Modal */}
            {selectedAnnouncement && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${selectedAnnouncement.type === 'academic'
                                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                                    }`}>
                                    {selectedAnnouncement.type}
                                </span>
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

export default Dashboard;
