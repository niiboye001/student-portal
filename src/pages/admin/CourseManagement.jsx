import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { BookOpen, Users, Clock, Plus, Search, MoreVertical, Edit, Trash2 } from 'lucide-react';

const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data } = await api.get('/admin/courses');
                // We'll need to implement this endpoint or reuse student/courses and enhance it
                setCourses(data);
            } catch (error) {
                console.error('Failed to fetch courses', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading curriculum...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Course Management</h1>
                    <p className="text-gray-500">Manage university curriculum and enrollment.</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 w-fit">
                    <Plus size={18} />
                    Create New Course
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                    <div key={course.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className="p-5">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                    {course.code}
                                </div>
                                <button className="text-gray-400 hover:text-gray-600">
                                    <MoreVertical size={20} />
                                </button>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-1 group-hover:text-blue-600 transition-colors">{course.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2 mb-4">{course.description || 'No description provided.'}</p>

                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-6 font-medium">
                                <div className="flex items-center gap-1.5">
                                    <Users size={16} />
                                    <span>{course._count?.enrollments || 0} Enrolled</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <Clock size={16} />
                                    <span>{course.credits} Credits</span>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button className="flex-1 flex items-center justify-center gap-2 py-2 px-3 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                                    <Edit size={14} />
                                    Edit
                                </button>
                                <button className="p-2 border border-gray-200 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CourseManagement;
