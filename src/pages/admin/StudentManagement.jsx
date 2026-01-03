import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { User, Mail, Calendar, Search, Filter, MoreVertical, X, Edit, Trash2, FileUp } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StudentModal from '../../components/admin/StudentModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import CSVUploader from '../../components/CSVUploader';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'recent'
    const [sort, setSort] = useState('newest'); // 'newest', 'oldest', 'name'
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const filterMenuRef = useRef(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const rowMenuRef = useRef(null);

    const fetchStudents = async () => {
        try {
            const { data } = await api.get('/admin/students');
            setStudents(data);
        } catch (error) {
            console.error('Failed to fetch students', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStudents();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target)) {
                setShowFilterMenu(false);
            }
            if (rowMenuRef.current && !rowMenuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        if (showFilterMenu || openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showFilterMenu, openMenuId]);

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [studentToDelete, setStudentToDelete] = useState(null);

    const handleDeleteClick = (student) => {
        setStudentToDelete(student);
        setDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const confirmDelete = async () => {
        if (!studentToDelete) return;

        try {
            await api.delete(`/admin/students/${studentToDelete.id}`);
            toast.success('Student deleted successfully');
            fetchStudents();
            setDeleteModalOpen(false);
        } catch (error) {
            console.error('Delete failed', error);
            toast.error('Failed to delete student');
        }
    };

    const handleEditStudent = (student) => {
        setSelectedStudent(student);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [userToReset, setUserToReset] = useState(null);

    const handleResetPassword = (student) => {
        setUserToReset(student);
        setResetModalOpen(true);
        setOpenMenuId(null);
    };

    const confirmResetPassword = async () => {
        if (!userToReset) return;

        const loadingToast = toast.loading('Resetting password...');
        try {
            const { data } = await api.post(`/admin/users/${userToReset.id}/reset-password`);
            toast.success('Password reset successfully! New credentials sent to email.', { id: loadingToast, duration: 4000 });
            setResetModalOpen(false);
            setUserToReset(null);
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error(error.response?.data?.message || 'Failed to reset password', { id: loadingToast });
        }
    };

    const handleRegisterClick = () => {
        setSelectedStudent(null);
        setIsModalOpen(true);
    };

    const filteredStudents = students
        .filter(student =>
            student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            student.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .filter(student => {
            if (filter === 'recent') {
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return new Date(student.createdAt) >= sevenDaysAgo;
            }
            return true;
        })
        .sort((a, b) => {
            if (sort === 'newest') return new Date(b.createdAt) - new Date(a.createdAt);
            if (sort === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt);
            if (sort === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

    if (loading) return <div className="p-8 text-center text-gray-500">Loading student directory...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Student Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">View and manage all registered student accounts.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <FileUp size={18} />
                        Import CSV
                    </button>
                    <button
                        onClick={handleRegisterClick}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <User size={18} />
                        Register Student
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-10 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <div className="relative" ref={filterMenuRef}>
                        <button
                            onClick={() => setShowFilterMenu(!showFilterMenu)}
                            className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${filter !== 'all' || sort !== 'newest'
                                ? 'border-blue-200 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:border-blue-800 dark:text-blue-400'
                                : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}>
                            <Filter size={18} />
                            Filter & Sort
                        </button>

                        {showFilterMenu && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-10 py-1">
                                <div className="p-2 border-b border-gray-100">
                                    <p className="text-xs font-semibold text-gray-500 px-2 mb-1">FILTER</p>
                                    <button
                                        onClick={() => { setFilter('all'); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-lg ${filter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                        All Students
                                    </button>
                                    <button
                                        onClick={() => { setFilter('recent'); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-lg ${filter === 'recent' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                        Recent (7 Days)
                                    </button>
                                </div>
                                <div className="p-2">
                                    <p className="text-xs font-semibold text-gray-500 px-2 mb-1">SORT BY</p>
                                    <button
                                        onClick={() => { setSort('newest'); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-lg ${sort === 'newest' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                        Newest First
                                    </button>
                                    <button
                                        onClick={() => { setSort('oldest'); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-lg ${sort === 'oldest' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                        Oldest First
                                    </button>
                                    <button
                                        onClick={() => { setSort('name'); setShowFilterMenu(false); }}
                                        className={`w-full text-left px-2 py-1.5 text-sm rounded-lg ${sort === 'name' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                                        Name (A-Z)
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">Student</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">Email</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">Registered on</th>
                                <th className="px-4 py-3 text-sm font-semibold text-gray-600 dark:text-gray-300 border-b dark:border-gray-700">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-white">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} />
                                                {student.email}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(student.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (openMenuId === student.id) {
                                                            setOpenMenuId(null);
                                                        } else {
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const spaceBelow = window.innerHeight - rect.bottom;
                                                            const menuHeight = 100; // estimated
                                                            const isUpwards = spaceBelow < menuHeight;

                                                            setDropdownPos({
                                                                top: isUpwards ? rect.top - 80 : rect.bottom + 5,
                                                                left: rect.right - 192, // 192px = w-48
                                                            });
                                                            setOpenMenuId(student.id);
                                                        }
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 transition-colors">
                                                    <MoreVertical size={20} />
                                                </button>

                                                {openMenuId === student.id && (
                                                    <div
                                                        ref={rowMenuRef}
                                                        className="fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 animate-in fade-in zoom-in-95 duration-100"
                                                        style={{
                                                            top: dropdownPos.top,
                                                            left: dropdownPos.left,
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => handleEditStudent(student)}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                                                            <Edit size={16} />
                                                            Edit Student
                                                        </button>
                                                        <button
                                                            onClick={() => handleResetPassword(student)}
                                                            className="w-full text-left px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-2"
                                                        >
                                                            <span className="font-bold">Key</span>
                                                            Reset Password
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteClick(student)}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                                                            <Trash2 size={16} />
                                                            Delete Student
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">
                                        No students found matching your search.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>


            <StudentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchStudents}
                student={selectedStudent}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Student"
                message={`Are you sure you want to delete ${studentToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete Student"
                isDanger={true}
            />

            <ConfirmationModal
                isOpen={!!resetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={confirmResetPassword}
                title="Reset Password"
                message={`Are you sure you want to reset the password for ${userToReset?.name}? It will be set to 'Password123!' and emailed to them.`}
                confirmText="Reset Password"
                isDanger={false}
            />

            <CSVUploader
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Students"
                endpoint="/admin/import/students"
                templateHeaders="name, email"
                onSuccess={fetchStudents}
            />
        </div >
    );
};

export default StudentManagement;
