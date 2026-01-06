import React, { useEffect, useState } from 'react';
import { BookOpen, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../services/api';

const MyCourses = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const { data } = await api.get('/staff/courses');
                setCourses(data);
            } catch (error) {
                console.error('Failed to fetch courses', error);
            } finally {
                setLoading(false);
            }
        };

        fetchCourses();
    }, []);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>

            {loading ? (
                <div className="text-center p-8 text-gray-500">Loading courses...</div>
            ) : courses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                            <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{course.name}</h3>
                            <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-4">{course.code}</p>
                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                    <Users size={16} />
                                    {course._count?.enrollments || 0} Students
                                </span>
                                <Link to={`/staff/courses/${course.id}`} className="text-blue-600 hover:underline flex items-center gap-1 text-sm font-medium">
                                    Manage <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center p-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">You haven't been assigned to any courses yet.</p>
                </div>
            )}
        </div>
    );
};

export default MyCourses;
