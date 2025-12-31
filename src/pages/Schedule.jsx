import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Clock, MapPin } from 'lucide-react';

const Schedule = () => {
    const [weeklySchedule, setWeeklySchedule] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSchedule = async () => {
            try {
                const response = await api.get('/student/schedule');
                setWeeklySchedule(response.data);
            } catch (error) {
                console.error('Error fetching schedule', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSchedule();
    }, []);

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });

    if (loading) return <div className="p-8 text-center text-gray-500">Loading schedule...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Weekly Schedule</h1>
                    <p className="text-gray-500">Manage your classes and time effectively</p>
                </div>
                <div className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                    Today is {today}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {weeklySchedule.map((daySchedule) => (
                    <div key={daySchedule.day} className="flex flex-col gap-4">
                        <h3 className="font-semibold text-gray-700 pb-2 border-b border-gray-200">
                            {daySchedule.day}
                        </h3>
                        <div className="space-y-4">
                            {daySchedule.classes.length > 0 ? (
                                daySchedule.classes.map((cls, index) => (
                                    <div
                                        key={index}
                                        className={`p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-shadow ${cls.type === 'Lecture'
                                            ? 'bg-white border-blue-500'
                                            : 'bg-white border-purple-500'
                                            }`}
                                    >
                                        <h4 className="font-bold text-gray-900 text-sm mb-1">{cls.name}</h4>
                                        <div className="flex items-start gap-2 text-xs text-gray-500 mb-1">
                                            <Clock size={12} className="mt-0.5" />
                                            <span>{cls.time}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                            <MapPin size={12} />
                                            <span>{cls.room}</span>
                                        </div>
                                        <div className={`mt-2 inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${cls.type === 'Lecture'
                                            ? 'bg-blue-50 text-blue-600'
                                            : 'bg-purple-50 text-purple-600'
                                            }`}>
                                            {cls.type}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-4 text-center text-sm text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    No classes
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Schedule;
