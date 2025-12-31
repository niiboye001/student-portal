import React, { useEffect, useState } from 'react';
import api from '../services/api';
import StatCard from '../components/StatCard';
import { GraduationCap, Clock, Award, TrendingUp, Calendar, Bell } from 'lucide-react';

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

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
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {student.name}!</h1>
                <p className="text-gray-500">Here's what's happening today.</p>
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
                    label="Attendance"
                    value={stats.attendance}
                    icon={Clock}
                    color="bg-green-600"
                />
                <StatCard
                    label="Credits Earned"
                    value={stats.credits}
                    icon={GraduationCap}
                    color="bg-blue-600"
                />
                <StatCard
                    label="Standing"
                    value={stats.standing}
                    icon={TrendingUp}
                    color="bg-orange-600"
                />
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upcoming Classes */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Calendar size={20} className="text-blue-600" />
                            Upcoming Classes
                        </h2>
                        <button className="text-sm text-blue-600 hover:underline">View Schedule</button>
                    </div>
                    <div className="space-y-4">
                        {upcomingClasses.map((cls) => (
                            <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors">
                                <div className="flex flex-col">
                                    <span className="font-semibold text-gray-900">{cls.name}</span>
                                    <span className="text-sm text-gray-500">{cls.room}</span>
                                </div>
                                <div className="bg-white px-3 py-1 rounded-full border border-gray-200 text-sm font-medium text-gray-700">
                                    {cls.time}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Announcements */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Bell size={20} className="text-orange-600" />
                            Announcements
                        </h2>
                    </div>
                    <div className="space-y-4">
                        {announcements.map((ann) => (
                            <div key={ann.id} className="p-4 border border-gray-100 rounded-lg">
                                <div className="flex items-start justify-between">
                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ann.type === 'academic' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {ann.type.toUpperCase()}
                                    </span>
                                    <span className="text-xs text-gray-400">{ann.date}</span>
                                </div>
                                <h3 className="mt-2 font-medium text-gray-900">{ann.title}</h3>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
