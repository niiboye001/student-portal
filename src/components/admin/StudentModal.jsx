import React, { useState, useEffect } from 'react';
import { X, User, Mail, Loader } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';

const StudentModal = ({ isOpen, onClose, onSuccess, student = null }) => {
    const [formData, setFormData] = useState({ name: '', email: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (student) {
            setFormData({ name: student.name, email: student.email });
        } else {
            setFormData({ name: '', email: '' });
        }
    }, [student, isOpen]);

    if (!isOpen) return null;

    const isEdit = !!student;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.email) {
            toast.error('Please fill in all fields');
            return;
        }

        setLoading(true);
        try {
            if (isEdit) {
                await api.put(`/admin/students/${student.id}`, formData);
                toast.success('Student updated successfully');
            } else {
                const { data } = await api.post('/admin/students', formData);
                toast.success('Student registered successfully! Credentials sent to email.', { duration: 4000 });
            }
            onSuccess();
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
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Edit Student' : 'Register New Student'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Full Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                placeholder="e.g. john@university.edu"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        {!isEdit && (
                            <p className="text-xs text-gray-500 ml-1">Default password will be set to: <span className="font-mono bg-gray-100 px-1 rounded">Student123!</span></p>
                        )}
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
                            {loading ? <Loader className="animate-spin" size={18} /> : (isEdit ? 'Save Changes' : 'Register Student')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StudentModal;
