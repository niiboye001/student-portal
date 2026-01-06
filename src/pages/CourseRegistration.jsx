import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { BookOpen, Search, CheckCircle, AlertCircle, Clock } from 'lucide-react';

const CourseRegistration = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [enrollLoading, setEnrollLoading] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [notification, setNotification] = useState(null);

    const [confirmModal, setConfirmModal] = useState({ show: false, courseId: null, courseName: '' });

    useEffect(() => {
        fetchAvailableCourses();
    }, []);

    const fetchAvailableCourses = async () => {
        try {
            setLoading(true);
            const res = await api.get('/student/courses/available');
            setCourses(res.data);
        } catch (error) {
            console.error('Error fetching courses:', error);
            setNotification({
                type: 'error',
                message: error.response?.data?.message || 'Failed to load courses. Please contact admin.'
            });
        } finally {
            setLoading(false);
        }
    };

    const initiateEnrollment = (course) => {
        setConfirmModal({ show: true, courseId: course.id, courseName: course.name });
    };

    const confirmEnrollment = async () => {
        const { courseId } = confirmModal;
        setConfirmModal({ ...confirmModal, show: false });

        setEnrollLoading(courseId);
        try {
            await api.post('/student/courses/enroll', { courseId });
            setNotification({ type: 'success', message: 'Successfully enrolled!' });
            // Remove the enrolled course from the list locally
            setCourses(prev => prev.filter(c => c.id !== courseId));
        } catch (error) {
            setNotification({ type: 'error', message: error.response?.data?.message || 'Enrollment failed' });
        } finally {
            setEnrollLoading(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading available courses...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto relative">
            {/* Confirmation Modal */}
            {confirmModal.show && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-opacity">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100 p-6 border border-gray-100 dark:border-gray-700">
                        <div className="mb-6 text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                                <BookOpen size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Confirm Enrollment</h3>
                            <p className="text-gray-500 dark:text-gray-400">
                                Are you sure you want to enroll in the course <br />
                                <span className="font-semibold text-gray-800 dark:text-white">"{confirmModal.courseName}"</span>?
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmModal({ ...confirmModal, show: false })}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmEnrollment}
                                className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-blue-600/20"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Registration</h1>
                    <p className="text-gray-500 dark:text-gray-400">Browse and enroll in new courses</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search courses..."
                        className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-700 dark:text-white w-full md:w-64"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {notification && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <p>{notification.message}</p>
                </div>
            )}

            {filteredCourses.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <BookOpen size={48} className="mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Courses Available</h3>
                    <p className="text-gray-500">
                        {searchQuery ? "No courses match your search." : "You are enrolled in all available courses!"}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => (
                        <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                            <div className="p-6 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-full">
                                        {course.code}
                                    </span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                        <Clock size={14} /> Level {course.level}
                                    </span>
                                </div>

                                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{course.name}</h3>

                                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3 mb-4">
                                    {course.description || "No description provided."}
                                </p>

                                <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                                    <p className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Instructor:</span>
                                        {course.instructor?.name || 'Unixsigned'}
                                    </p>
                                    {course.department && (
                                        <p className="flex items-center gap-2">
                                            <span className="font-medium text-gray-700 dark:text-gray-300">Dept:</span>
                                            {course.department.name}
                                        </p>
                                    )}
                                    <p className="flex items-center gap-2">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Credits:</span>
                                        {course.credits || 3}
                                    </p>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 text-right">
                                <button
                                    onClick={() => initiateEnrollment(course)}
                                    disabled={enrollLoading === course.id}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 w-full md:w-auto ml-auto"
                                >
                                    {enrollLoading === course.id ? 'Enrolling...' : 'Enroll Now'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default CourseRegistration;
