import React, { useState, useEffect } from 'react';
import { X, BookOpen, Hash, AlignLeft, Clock, Loader, User } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const CourseModal = ({ isOpen, onClose, onSuccess, course = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        instructorId: '',
        level: 100,
        semester: 1,
        credits: 3
    });
    const [loading, setLoading] = useState(false);
    const [staff, setStaff] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchStaff();
        }
    }, [isOpen]);

    const fetchStaff = async () => {
        try {
            const { data } = await api.get('/admin/staff');
            setStaff(data);
        } catch (error) {
            console.error('Failed to load staff', error);
        }
    };

    useEffect(() => {
        if (course) {
            setFormData({
                name: course.name,
                code: course.code,
                description: course.description || '',
                instructorId: course.instructor?.id || '',
                level: course.level || 100,
                semester: course.semester || 1,
                credits: course.credits || 3
            });
        } else {
            setFormData({ name: '', code: '', description: '', instructorId: '', level: 100, semester: 1, credits: 3 });
        }
    }, [course, isOpen]);

    if (!isOpen) return null;

    const isEdit = !!course;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.code) {
            toast.error('Name and Course Code are required');
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/admin/courses/${course.id}`, formData);
                toast.success('Course updated successfully');
            } else {
                await api.post('/admin/courses', formData);
                toast.success('Course created successfully');
            }
            await onSuccess();
            onClose();
        } catch (error) {
            console.error('Operation failed', error);
            toast.error(error.response?.data?.message || 'Operation failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit Course' : 'Create New Course'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Course Code</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all uppercase"
                                    placeholder="e.g. CS101"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    disabled={isEdit}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Credits</label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="number"
                                    min="1"
                                    max="10"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={formData.credits}
                                    onChange={(e) => setFormData({ ...formData, credits: parseInt(e.target.value) || 0 })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Level</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                value={formData.level}
                                onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                            >
                                <option value={100}>100</option>
                                <option value={200}>200</option>
                                <option value={300}>300</option>
                                <option value={400}>400</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Semester</label>
                            <select
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                value={formData.semester}
                                onChange={(e) => setFormData({ ...formData, semester: parseInt(e.target.value) })}
                            >
                                <option value={1}>1</option>
                                <option value={2}>2</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Course Name</label>
                        <div className="relative">
                            <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. Introduction to Computer Science"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Description</label>
                        <div className="relative">
                            <AlignLeft className="absolute left-3 top-3 text-gray-400" size={18} />
                            <textarea
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all min-h-[100px]"
                                placeholder="Brief summary of the course content..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Assigned Instructor</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all appearance-none bg-white"
                                value={formData.instructorId || ''}
                                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                            >
                                <option value="">Select an instructor...</option>
                                {staff.map(member => (
                                    <option key={member.id} value={member.id}>
                                        {member.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader className="animate-spin" size={18} /> : (isEdit ? 'Save Changes' : 'Create Course')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CourseModal;
