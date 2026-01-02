import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { BookOpen, Users, Clock, Plus, Search, MoreVertical, Edit, Trash2, User, FileUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import CourseModal from '../../components/admin/CourseModal';
import EnrollmentModal from '../../components/admin/EnrollmentModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import CSVUploader from '../../components/CSVUploader';

const CourseManagement = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEnrollmentModalOpen, setIsEnrollmentModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const menuRef = useRef(null);

    const fetchCourses = async () => {
        try {
            const { data } = await api.get(`/admin/courses?_t=${new Date().getTime()}`);
            setCourses(data);
        } catch (error) {
            console.error('Failed to fetch courses', error);
            toast.error('Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    const handleCreateClick = () => {
        setSelectedCourse(null);
        setIsModalOpen(true);
    };

    const handleEditClick = (course) => {
        setSelectedCourse(course);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [courseToDelete, setCourseToDelete] = useState(null);

    const handleDeleteClick = (course) => {
        setCourseToDelete(course);
        setDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const confirmDelete = async () => {
        if (!courseToDelete) return;

        try {
            await api.delete(`/admin/courses/${courseToDelete.id}`);
            toast.success('Course deleted successfully');
            fetchCourses();
            setDeleteModalOpen(false);
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to delete course');
        }
    };

    const handleManageEnrollment = (course) => {
        setSelectedCourse(course);
        setIsEnrollmentModalOpen(true);
        setOpenMenuId(null);
    };

    const filteredCourses = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading curriculum...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Course Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage university curriculum and enrollment.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <FileUp size={18} />
                        Import CSV
                    </button>
                    <button
                        onClick={handleCreateClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Plus size={18} />
                        Create New Course
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search courses by name or code..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.length > 0 ? (
                    filteredCourses.map((course) => (
                        <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden group flex flex-col h-full">
                            <div className="p-5 flex-1">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                                        {course.code}
                                    </div>
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setOpenMenuId(openMenuId === course.id ? null : course.id);
                                            }}
                                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <MoreVertical size={20} />
                                        </button>

                                        {openMenuId === course.id && (
                                            <div
                                                ref={menuRef}
                                                className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 z-50 py-1"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <button
                                                    onClick={() => handleManageEnrollment(course)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                                    <Users size={16} />
                                                    Manage Enrollments
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(course)}
                                                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                                    <Edit size={16} />
                                                    Edit Course
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(course)}
                                                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                    <Trash2 size={16} />
                                                    Delete Course
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{course.name}</h3>
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-3">
                                    <User size={14} className="text-gray-400" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{course.instructor?.name || 'No Instructor Assigned'}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 mb-4">{course.description || 'No description provided.'}</p>

                                <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 font-medium mt-auto">
                                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                        <Users size={14} />
                                        <span>{course._count?.enrollments || 0} Enrolled</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                        <Clock size={14} />
                                        <span>{course.credits} Credits</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Actions Footer - Optional, kept for visibility but actions are in menu too */}
                            <div className="px-5 py-3 border-t border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30 flex gap-2">
                                <button
                                    onClick={() => handleEditClick(course)}
                                    className="flex-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 py-1.5 rounded transition-colors text-center border border-transparent hover:border-blue-100 dark:hover:border-blue-800">
                                    Edit Details
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full p-12 text-center text-gray-500 bg-white rounded-xl border border-gray-200 border-dashed">
                        <BookOpen className="mx-auto mb-3 text-gray-300" size={48} />
                        <p>No courses found matching your search.</p>
                        <button
                            onClick={handleCreateClick}
                            className="text-blue-600 hover:underline mt-2 font-medium">
                            Create a new course
                        </button>
                    </div>
                )}
            </div>

            <CourseModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchCourses}
                course={selectedCourse}
            />

            <EnrollmentModal
                isOpen={isEnrollmentModalOpen}
                onClose={() => setIsEnrollmentModalOpen(false)}
                onSuccess={fetchCourses}
                course={selectedCourse}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Course"
                message={`Are you sure you want to delete ${courseToDelete?.code}: ${courseToDelete?.name}? This action cannot be undone and will remove all associated enrollments.`}
                confirmText="Delete Course"
                isDanger={true}
            />

            <CSVUploader
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Courses"
                endpoint="/admin/import/courses"
                templateHeaders="code, name, credits"
                onSuccess={fetchCourses}
            />
        </div>
    );
};

export default CourseManagement;
