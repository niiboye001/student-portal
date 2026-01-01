import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { User, Mail, Calendar, Search, Filter, MoreVertical, X, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import StudentModal from '../../components/admin/StudentModal';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all', 'recent'
    const [sort, setSort] = useState('newest'); // 'newest', 'oldest', 'name'
    const [showFilterMenu, setShowFilterMenu] = useState(false);
    const filterMenuRef = useRef(null);
    const [openMenuId, setOpenMenuId] = useState(null);
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

    const handleDeleteStudent = async (student) => {
        setOpenMenuId(null);
        if (!window.confirm(`Are you sure you want to delete ${student.name}? This action cannot be undone.`)) {
            return;
        }

        try {
            await api.delete(`/admin/students/${student.id}`);
            toast.success('Student deleted successfully');
            fetchStudents();
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
                    <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                    <p className="text-gray-500">View and manage all registered student accounts.</p>
                </div>
                <button
                    onClick={handleRegisterClick}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 w-fit">
                    <User size={18} />
                    Register Student
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name or email..."
                            className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
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
                                    ? 'border-blue-200 bg-blue-50 text-blue-700'
                                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
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
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 border-b">Student</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 border-b">Email</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 border-b">Registered on</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 border-b">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredStudents.length > 0 ? (
                                filteredStudents.map((student) => (
                                    <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                                                    {student.name.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900">{student.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Mail size={14} />
                                                {student.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} />
                                                {new Date(student.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="relative">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(openMenuId === student.id ? null : student.id);
                                                    }}
                                                    className="text-gray-400 hover:text-gray-600 transition-colors">
                                                    <MoreVertical size={20} />
                                                </button>

                                                {openMenuId === student.id && (
                                                    <div
                                                        ref={rowMenuRef}
                                                        className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 z-50 py-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <button
                                                            onClick={() => handleEditStudent(student)}
                                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                                                            <Edit size={16} />
                                                            Edit Student
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteStudent(student)}
                                                            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
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
        </div >
    );
};

export default StudentManagement;
