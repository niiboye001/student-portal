import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Megaphone, Plus, Trash2, Calendar, Users, AlertCircle, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';

const Announcements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        targetRole: '', // '' = All, 'STUDENT', 'STAFF'
        expiryDate: '',
        expiryTime: '',
        type: 'academic' // 'academic', 'system', 'event'
    });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);

    const fetchAnnouncements = async () => {
        try {
            const { data } = await api.get('/admin/announcements');
            setAnnouncements(data);
        } catch (error) {
            console.error('Failed to fetch announcements', error);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const handleDelete = (announcement) => {
        setAnnouncementToDelete(announcement);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!announcementToDelete) return;
        try {
            await api.delete(`/admin/announcements/${announcementToDelete.id}`);
            toast.success('Announcement deleted');
            fetchAnnouncements();
            setDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete announcement');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const expiresAt = formData.expiryDate && formData.expiryTime
                ? new Date(`${formData.expiryDate}T${formData.expiryTime}`)
                : formData.expiryDate ? new Date(formData.expiryDate) : null;

            await api.post('/admin/announcements', {
                title: formData.title,
                content: formData.content,
                targetRole: formData.targetRole || null,
                expiresAt: expiresAt,
                type: formData.type
            });
            toast.success('Announcement published');
            setIsModalOpen(false);
            setFormData({ title: '', content: '', targetRole: '', expiryDate: '', expiryTime: '', type: 'academic' });
            fetchAnnouncements();
        } catch (error) {
            toast.error('Failed to publish announcement');
        }
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'academic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'system': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'event': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="text-blue-600" />
                        Announcements
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Broadcast updates to students and staff.</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Plus size={18} />
                    New Announcement
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {announcements.map((announcement) => (
                    <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 relative group">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${getTypeColor(announcement.type)}`}>
                                {announcement.type}
                            </span>
                            <button
                                onClick={() => handleDelete(announcement)}
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{announcement.title}</h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                            {announcement.content}
                        </p>

                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto">
                            <div className="flex items-center gap-1">
                                <Users size={12} />
                                {announcement.targetRole || 'Everyone'}
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(announcement.createdAt).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg p-6 animate-in fade-in zoom-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Announcement</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="academic">Academic</option>
                                        <option value="system">System</option>
                                        <option value="event">Event</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Audience</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.targetRole}
                                        onChange={e => setFormData({ ...formData, targetRole: e.target.value })}
                                    >
                                        <option value="">Everyone</option>
                                        <option value="STUDENT">Students Only</option>
                                        <option value="STAFF">Staff Only</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                                <textarea
                                    required
                                    rows="4"
                                    className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.expiryDate}
                                        onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expiration Time</label>
                                    <input
                                        type="time"
                                        className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                        value={formData.expiryTime}
                                        onChange={e => setFormData({ ...formData, expiryTime: e.target.value })}
                                        disabled={!formData.expiryDate}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                                >
                                    Publish Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Announcement"
                message={`Are you sure you want to delete "${announcementToDelete?.title}"? This action cannot be undone.`}
                confirmText="Delete Announcement"
                isDanger={true}
            />
        </div>
    );
};

export default Announcements;
