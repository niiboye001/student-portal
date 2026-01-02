import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Users, BookOpen, GraduationCap, BarChart, TrendingUp, Calendar } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Cache busting to ensure fresh data
                const { data } = await api.get(`/admin/stats?_t=${new Date().getTime()}`);
                setStats(data.stats);
            } catch (error) {
                console.error('Failed to fetch analytics', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading analytics...</div>;

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">System Analytics</h1>
                <p className="text-gray-500 dark:text-gray-400">Detailed insights into university performance.</p>
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
                    label="Avg. Class Size"
                    value={stats?.averageClassSize || 0}
                    icon={Users}
                    color="bg-teal-600"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Registration Trends</h2>
                        <BarChart className="text-gray-400" size={20} />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-100/50 dark:bg-orange-900/20 rounded-lg">
                            <TrendingUp className="text-orange-600 dark:text-orange-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">New Students (Last 7 Days)</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.recentRegistrations || 0}</p>
                        </div>
                    </div>

                    <div className="h-64 mt-6 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.registrationTrend || []}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" opacity={0.3} />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fontSize: 12, fill: '#9CA3AF' }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'var(--tooltip-bg, #fff)',
                                        borderRadius: '8px',
                                        border: '1px solid #E5E7EB',
                                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="count"
                                    stroke="#3b82f6"
                                    fillOpacity={1}
                                    fill="url(#colorCount)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Growth in student registrations over the last 6 months.
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                        <Calendar className="text-gray-400" size={20} />
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                            More verification tools and detailed reports will be available here.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;
