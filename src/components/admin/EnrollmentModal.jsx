import React, { useState, useEffect } from 'react';
import { X, UserPlus, Search, Trash2, User, Loader } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const EnrollmentModal = ({ isOpen, onClose, onSuccess, course }) => {
    const [enrollments, setEnrollments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [students, setStudents] = useState([]); // Search results
    const [loading, setLoading] = useState(false);
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        if (isOpen && course) {
            fetchEnrollments();
            setSearchQuery('');
            setStudents([]);
        }
    }, [isOpen, course]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.length >= 2) {
                searchStudents();
            } else {
                setStudents([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const fetchEnrollments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get(`/admin/courses/${course.id}/enrollments`);
            setEnrollments(data);
        } catch (error) {
            console.error('Failed to load enrollments', error);
            toast.error('Could not load enrollments');
        } finally {
            setLoading(false);
        }
    };

    const searchStudents = async () => {
        setSearching(true);
        try {
            // We might need a dedicated search endpoint, but filtering all students works for small scale
            const { data } = await api.get('/admin/students');
            const filtered = data.filter(student =>
                student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                student.email.toLowerCase().includes(searchQuery.toLowerCase())
            );
            // Filter out already enrolled
            const enrolledIds = new Set(enrollments.map(e => e.user.id));
            setStudents(filtered.filter(s => !enrolledIds.has(s.id)));
        } catch (error) {
            console.error('Search failed', error);
        } finally {
            setSearching(false);
        }
    };

    const handleEnroll = async (student) => {
        try {
            await api.post('/admin/enrollments', {
                courseId: course.id,
                userId: student.id
            });
            toast.success(`Enrolled ${student.name}`);
            fetchEnrollments(); // Refresh list
            if (onSuccess) onSuccess(); // Refresh parent list
            setStudents(prev => prev.filter(s => s.id !== student.id)); // Remove from results
        } catch (error) {
            toast.error(error.response?.data?.message || 'Enrollment failed');
        }
    };

    const handleRemove = async (enrollmentId) => {
        if (!window.confirm('Are you sure you want to remove this student from the course?')) return;
        try {
            await api.delete(`/admin/enrollments/${enrollmentId}`);
            toast.success('Student removed from course');
            fetchEnrollments();
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error('Failed to remove student');
        }
    };

    if (!isOpen || !course) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Manage Enrollments</h2>
                        <p className="text-sm text-gray-500">{course.code}: {course.name}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto">
                    {/* Search Section */}
                    <div className="mb-8">
                        <label className="text-sm font-medium text-gray-700 mb-2 block">Enroll New Student</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                            {searching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={18} />}
                        </div>

                        {/* Search Results */}
                        {students.length > 0 && (
                            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-sm max-h-48 overflow-y-auto">
                                {students.map(student => (
                                    <div key={student.id} className="flex items-center justify-between p-3 hover:bg-gray-50 border-b last:border-0 border-gray-50">
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                                            <p className="text-xs text-gray-500">{student.email}</p>
                                        </div>
                                        <button
                                            onClick={() => handleEnroll(student)}
                                            className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold">
                                            <UserPlus size={14} />
                                            Enroll
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        {searchQuery.length > 1 && students.length === 0 && !searching && (
                            <p className="text-xs text-gray-400 mt-2 ml-1">No students found matching "{searchQuery}"</p>
                        )}
                    </div>

                    {/* Current Enrollments List */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-gray-900">Enrolled Students ({enrollments.length})</h3>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8"><Loader className="animate-spin text-gray-400" /></div>
                        ) : enrollments.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                <User className="mx-auto text-gray-300 mb-2" size={24} />
                                <p className="text-gray-500 text-sm">No students currently enrolled.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {enrollments.map((enrollment) => (
                                    <div key={enrollment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-xs">
                                                {enrollment.user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 text-sm">{enrollment.user.name}</p>
                                                <p className="text-xs text-gray-500">{enrollment.user.email}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleRemove(enrollment.id)}
                                            className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                            title="Remove from course">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnrollmentModal;
