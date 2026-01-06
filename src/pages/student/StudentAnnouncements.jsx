import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Megaphone, Calendar, Users, BookOpen, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

const StudentAnnouncements = () => {
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('active'); // 'active' | 'archived'

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/announcements?status=${filter}`);
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
    }, [filter]);

    const getTypeColor = (type) => {
        switch (type) {
            case 'academic': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'system': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'event': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Megaphone className="text-blue-600" />
                    Announcements
                </h1>
                <p className="text-gray-500 dark:text-gray-400">Updates from your courses and administration.</p>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${filter === 'active'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    Active
                </button>
                <button
                    onClick={() => setFilter('archived')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${filter === 'archived'
                            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                        }`}
                >
                    History
                </button>
            </div>

            {loading ? (
                <div className="text-center py-12 text-gray-500">Loading announcements...</div>
            ) : (
                <div className="space-y-4">
                    {announcements.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                            {filter === 'active' ? 'No active announcements' : 'No archived announcements'}
                        </div>
                    ) : (
                        announcements.map((announcement) => (
                            <div key={announcement.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${getTypeColor(announcement.type)}`}>
                                            {announcement.type}
                                        </span>
                                        <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded flex items-center gap-1">
                                            <BookOpen size={12} />
                                            {announcement.courseName}
                                        </span>
                                    </div>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(announcement.createdAt).toLocaleDateString()}
                                    </span>
                                </div>

                                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">{announcement.title}</h3>

                                <div className="prose dark:prose-invert max-w-none mb-4">
                                    <p className="text-gray-600 dark:text-gray-300 text-sm whitespace-pre-wrap">
                                        {announcement.content}
                                    </p>
                                </div>

                                {announcement.expiresAt && (
                                    <div className={`text-xs flex items-center gap-1 pt-3 border-t border-gray-100 dark:border-gray-700 ${new Date(announcement.expiresAt) < new Date() ? 'text-red-500' : 'text-green-500'}`}>
                                        <Clock size={12} />
                                        {new Date(announcement.expiresAt) < new Date() ? 'Expired on ' : 'Expires: '}
                                        {new Date(announcement.expiresAt).toLocaleDateString()}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default StudentAnnouncements;
