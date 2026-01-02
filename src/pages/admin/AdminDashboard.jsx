import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Users, BookOpen, GraduationCap, BarChart } from 'lucide-react';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const { data } = await api.get(`/admin/stats?_t=${new Date().getTime()}`);
                console.log('Admin Stats Response:', data);
                setStats(data.stats);
            } catch (error) {
                console.error('Failed to fetch admin stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading dashboard...</div>;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Overview</h1>
                <p className="text-gray-500 dark:text-gray-400">System-wide statistics and management.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    label="Total Students"
                    value={stats?.totalStudents || 0}
                    icon={Users}
                    color="bg-blue-600"
                />
                <StatCard
                    label="Active Courses"
                    value={stats?.totalCourses || 0}
                    icon={BookOpen}
                    color="bg-green-600"
                />
                <StatCard
                    label="Total Enrollments"
                    value={stats?.totalEnrollments || 0}
                    icon={GraduationCap}
                    color="bg-purple-600"
                />
                <StatCard
                    label="Recent Registrations"
                    value={stats?.recentRegistrations || 0}
                    icon={BarChart}
                    color="bg-orange-600"
                />
                <StatCard
                    label="Avg. Class Size"
                    value={stats?.averageClassSize || 0}
                    icon={Users}
                    color="bg-teal-600"
                />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-6 rounded-xl">
                <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">Welcome to the Command Center</h2>
                <p className="text-blue-700 dark:text-blue-300">Use the sidebar to manage students, courses, and view detailed analytics.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
