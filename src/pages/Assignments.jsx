import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Calendar, CheckCircle2, Circle, Clock, FileText, Filter, X, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
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
            case 'MISSING':
                return <AlertCircle className="text-red-500" size={20} />;
            case 'LATE':
                return <Clock className="text-yellow-600" size={20} />;
            case 'PENDING':
                return <Circle className="text-gray-300" size={20} />;
            default:
                return <Clock className="text-orange-500" size={20} />;
        }
    };

    const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionContent, setSubmissionContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleOpenSubmission = (assignment) => {
        setSelectedAssignment(assignment);
        setSubmissionContent(assignment.submission?.content || '');
        setSubmissionModalOpen(true);
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        if (!submissionContent.trim()) return;

        setSubmitting(true);
        const loadingToast = toast.loading('Submitting assignment...');

        try {
            await api.post(`/student/courses/${selectedAssignment.course.id}/assignments/${selectedAssignment.id}/submit`, {
                content: submissionContent
            });

            toast.success('Assignment submitted successfully!', { id: loadingToast });
            setSubmissionModalOpen(false);
            setSubmissionContent('');

            // Refresh assignments
            const { data } = await api.get('/student/assignments');
            setAssignments(data);

        } catch (error) {
            console.error('Submission error:', error);
            toast.error('Failed to submit. Please try again.', { id: loadingToast });
        } finally {
            setSubmitting(false);
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
                    {['ALL', 'PENDING', 'SUBMITTED', 'MISSING', 'GRADED'].map((f) => (
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
                                        <span className="font-medium text-blue-600 dark:text-blue-400">{assignment.course?.name}</span>
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
                                            assignment.status === 'SUBMITTED' || assignment.status === 'GRADED' ? "text-green-600" :
                                                assignment.status === 'MISSING' ? "text-red-600" :
                                                    assignment.status === 'LATE' ? "text-yellow-600" :
                                                        "text-gray-500"
                                        )}>
                                            {assignment.status}
                                        </span>
                                    </div>
                                    {assignment.submission?.grade && (
                                        <div className="flex flex-col items-end">
                                            <span className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">Grade: {assignment.submission.grade}</span>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleOpenSubmission(assignment)}
                                    className={clsx(
                                        "px-4 py-2 rounded-lg font-medium transition-colors",
                                        assignment.status === 'PENDING' || assignment.status === 'MISSING' || assignment.status === 'LATE'
                                            ? "bg-blue-600 text-white hover:bg-blue-700"
                                            : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                    )}
                                >
                                    {assignment.status === 'PENDING' || assignment.status === 'MISSING' || assignment.status === 'LATE' ? 'Submit' :
                                        assignment.status === 'GRADED' ? 'View Grade' : 'View Submission'}
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

            {/* Submission Modal */}
            {submissionModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-scale-in">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Submit Assignment</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-[250px] truncate">{selectedAssignment?.title}</p>
                            </div>
                            <button onClick={() => setSubmissionModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitAssignment} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Submission Content (Text or URL)</label>
                                <textarea
                                    required
                                    rows="4"
                                    placeholder="Paste your Google Doc link, GitHub repo, or type your answer here..."
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm"
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                />
                                <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                    <AlertCircle size={12} />
                                    Links must be accessible publicly or to the instructor.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting || (selectedAssignment?.submission && selectedAssignment?.status !== 'PENDING' && selectedAssignment?.status !== 'MISSING' && selectedAssignment?.status !== 'LATE')} // Disable if already submitted/graded
                                className={clsx(
                                    "w-full py-2.5 font-bold rounded-lg shadow-md hover:shadow-lg transition-all flex justify-center items-center gap-2",
                                    selectedAssignment?.submission
                                        ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500"
                                        : "bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                                )}
                            >
                                {submitting ? 'Submitting...' : selectedAssignment?.submission ? 'Already Submitted' : 'Submit Assignment'}
                            </button>

                            {/* Show Grade/Feedback in Modal if exists */}
                            {selectedAssignment?.submission?.grade && (
                                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-xs font-bold text-green-700 dark:text-green-300 uppercase">Grade</span>
                                        <span className="text-xl font-extrabold text-green-700 dark:text-green-300">{selectedAssignment.submission.grade}</span>
                                    </div>
                                    <div className="text-sm text-gray-700 dark:text-gray-300">
                                        <span className="font-semibold block text-xs text-gray-500 uppercase mb-1">Feedback from Instructor:</span>
                                        {selectedAssignment.submission.feedback || 'No feedback provided.'}
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Assignments;
