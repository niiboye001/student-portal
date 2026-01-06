import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import StatCard from '../../components/StatCard';
import { Users, BookOpen, GraduationCap, BarChart } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState('ALL'); // 'ALL' or 0-11

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ];

    useEffect(() => {
        const fetchStats = async () => {
            try {
                let query = `/admin/stats?year=${selectedYear}`;
                if (selectedMonth !== 'ALL') {
                    query += `&month=${parseInt(selectedMonth) + 1}`;
                }

                const { data } = await api.get(query);
                setStats(data.stats);
            } catch (error) {
                console.error('Failed to fetch admin stats', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, [selectedYear, selectedMonth]);

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
                    label="Avg. Class Size"
                    value={stats?.averageClassSize || 0}
                    icon={Users}
                    color="bg-teal-600"
                />
            </div>

            {/* Registration Trend Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Registration Trends</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Student registrations over time.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <select
                            value={selectedMonth}
                            onChange={(e) => setSelectedMonth(e.target.value)}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="ALL">All Months</option>
                            {years.includes(selectedYear) && months.map((m, idx) => (
                                <option key={idx} value={idx}>{m}</option>
                            ))}
                        </select>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            {years.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="h-80 w-full">
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
                                dataKey={selectedMonth === 'ALL' ? "month" : "date"}
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
                                name="Registrations"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-6 rounded-xl">
                <h2 className="text-lg font-bold text-blue-900 dark:text-blue-100 mb-2">Welcome to the Command Center</h2>
                <p className="text-blue-700 dark:text-blue-300">Use the sidebar to manage students, courses, and view detailed analytics.</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
