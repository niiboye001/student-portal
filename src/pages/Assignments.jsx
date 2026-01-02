import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar, CheckCircle2, Circle, Clock, FileText, Filter } from 'lucide-react';
import clsx from 'clsx';

const Assignments = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL'); // ALL, PENDING, SUBMITTED

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const { data } = await api.get('/student/assignments');
                setAssignments(data);
            } catch (error) {
                console.error('Failed to fetch assignments', error);
            } finally {
                setLoading(false);
            }
        };
        fetchAssignments();
    }, []);

    const filteredAssignments = assignments.filter(as =>
        filter === 'ALL' || as.status === filter
    );

    const getStatusIcon = (status) => {
        switch (status) {
            case 'SUBMITTED':
            case 'GRADED':
                return <CheckCircle2 className="text-green-500" size={20} />;
            case 'PENDING':
                return <Circle className="text-gray-300" size={20} />;
            default:
                return <Clock className="text-orange-500" size={20} />;
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading assignments...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Assignments</h1>
                    <p className="text-gray-500 dark:text-gray-400">Track your coursework and upcoming deadlines.</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    {['ALL', 'PENDING', 'SUBMITTED', 'GRADED'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={clsx(
                                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                filter === f
                                    ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-300 shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            )}
                        >
                            {f.charAt(0) + f.slice(1).toLowerCase()}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {filteredAssignments.length > 0 ? (
                    filteredAssignments.map((assignment) => (
                        <div
                            key={assignment.id}
                            className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:border-blue-300 dark:hover:border-blue-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg flex items-center justify-center shrink-0">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white">{assignment.title}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                                        <span className="font-medium text-blue-600 dark:text-blue-400">{assignment.course.name}</span>
                                        <span className="text-gray-300 dark:text-gray-600">•</span>
                                        <Calendar size={14} />
                                        Due {new Date(assignment.dueDate).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-0 pt-4 md:pt-0">
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-2">
                                        {getStatusIcon(assignment.status)}
                                        <span className={clsx(
                                            "text-sm font-semibold",
                                            assignment.status === 'SUBMITTED' || assignment.status === 'GRADED' ? "text-green-600" : "text-gray-500"
                                        )}>
                                            {assignment.status}
                                        </span>
                                    </div>
                                    {assignment.grade && (
                                        <span className="text-xs text-blue-600 font-bold mt-1">Grade: {assignment.grade}</span>
                                    )}
                                </div>
                                <button
                                    disabled={assignment.status === 'SUBMITTED' || assignment.status === 'GRADED'}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg font-medium transition-colors",
                                        assignment.status === 'PENDING'
                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                            : "bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
                                    )}
                                >
                                    {assignment.status === 'PENDING' ? 'Submit' : 'View Submission'}
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="bg-gray-50 dark:bg-gray-800 border border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
                        <p className="text-gray-500 dark:text-gray-400">No assignments found for this filter.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Assignments;
