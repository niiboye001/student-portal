import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { User, Mail, Calendar, Search, Filter, MoreVertical } from 'lucide-react';

const StudentManagement = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
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
        fetchStudents();
    }, []);

    const filteredStudents = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading student directory...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Student Management</h1>
                    <p className="text-gray-500">View and manage all registered student accounts.</p>
                </div>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 w-fit">
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
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
                        <Filter size={18} />
                        Filter
                    </button>
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
                                            <button className="text-gray-400 hover:text-gray-600">
                                                <MoreVertical size={20} />
                                            </button>
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
        </div>
    );
};

export default StudentManagement;
