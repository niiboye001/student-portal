import React, { useEffect, useState } from 'react';
import { X, BookOpen, User, Clock, CheckCircle2, AlertCircle, FileText, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CourseDetails = ({ courseId, onClose }) => {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'assignments'

    // Submission State
    const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionContent, setSubmissionContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/student/courses/${courseId}`);
                setCourse(response.data);
            } catch (err) {
                console.error('Error fetching course details:', err);
                setError('Failed to load course details.');
            } finally {
                setLoading(false);
            }
        };

        if (courseId) {

            fetchDetails();
        }
    }, [courseId]);

    const handleOpenSubmission = (assignment) => {
        setSelectedAssignment(assignment);
        setSubmissionContent(assignment.submission?.content || ''); // Pre-fill if exists
        setSubmissionModalOpen(true);
    };

    const handleSubmitAssignment = async (e) => {
        e.preventDefault();
        if (!submissionContent.trim()) return;

        setSubmitting(true);
        const loadingToast = toast.loading('Submitting assignment...');

        try {
            await api.post(`/student/courses/${courseId}/assignments/${selectedAssignment.id}/submit`, {
                content: submissionContent
            });

            toast.success('Assignment submitted successfully!', { id: loadingToast });
            setSubmissionModalOpen(false);
            setSubmissionContent('');

            // Refresh details to show status
            const response = await api.get(`/student/courses/${courseId}`);
            setCourse(response.data);

        } catch (err) {
            console.error('Submission error:', err);
            toast.error('Failed to submit. Please try again.', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="p-6 text-center text-red-600 flex flex-col items-center gap-3">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button onClick={onClose} className="text-blue-600 font-medium">Close</button>
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-white dark:bg-gray-800">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/30">
                <div>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">{course.code}</div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{course.name}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-gray-700 rounded-full transition-colors shadow-sm">
                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                </button>
            </div>

            {/* Content */}
            {/* Tabs */}
            <div className="px-6 border-b border-gray-100 dark:border-gray-700">
                <nav className="-mb-px flex space-x-6">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'overview'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <BookOpen size={16} />
                        Overview
                    </button>
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`py-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'assignments'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <FileText size={16} />
                        Assignments
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'overview' && (
                    <div className="space-y-8">
                        {/* At a Glance */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
                                    <User size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Instructor</span>
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.instructor?.name || 'Staff'}</div>
                            </div>
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                                <div className="flex items-center gap-2 text-green-600 dark:text-green-400 mb-1">
                                    <Clock size={16} />
                                    <span className="text-xs font-bold uppercase tracking-wider">Progress</span>
                                </div>
                                <div className="text-sm font-semibold text-gray-900 dark:text-white">{course.progress}% Completed</div>
                            </div>
                        </div>

                        {/* Description */}
                        <section className="space-y-3">
                            <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                <BookOpen size={18} className="text-blue-600 dark:text-blue-400" />
                                Course Description
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                                {course.description}
                            </p>
                        </section>

                        {/* Syllabus */}
                        <section className="space-y-3">
                            <h3 className="flex items-center gap-2 font-bold text-gray-900 dark:text-white">
                                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                                Syllabus
                            </h3>
                            <div className="space-y-2">
                                {course.syllabus.map((item, index) => (
                                    <div key={index} className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-700">
                                        <span className="font-bold text-blue-600 dark:text-blue-400">{index + 1}.</span>
                                        <span>{item}</span>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <FileText size={18} className="text-blue-600" />
                                Your Assignments
                            </h3>
                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full font-medium">
                                {course.upcomingAssignments?.length || 0} Total
                            </span>
                        </div>

                        {course.upcomingAssignments && course.upcomingAssignments.length > 0 ? (
                            <div className="space-y-4">
                                {course.upcomingAssignments.map((assignment) => (
                                    <div key={assignment.id} className="p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all">
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h4 className="font-bold text-gray-900 dark:text-white text-base">{assignment.title}</h4>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{assignment.description || 'No description provided.'}</p>
                                            </div>
                                            {assignment.status === 'GRADED' ? (
                                                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full shrink-0">
                                                    <CheckCircle2 size={12} />
                                                    Graded
                                                </span>
                                            ) : assignment.status === 'SUBMITTED' ? (
                                                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900/30 px-3 py-1 rounded-full shrink-0">
                                                    <CheckCircle2 size={12} />
                                                    Submitted
                                                </span>
                                            ) : assignment.status === 'MISSING' ? (
                                                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 px-3 py-1 rounded-full shrink-0">
                                                    <AlertCircle size={12} />
                                                    Missing
                                                </span>
                                            ) : assignment.status === 'LATE' ? (
                                                <span className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full shrink-0">
                                                    <Clock size={12} />
                                                    Late Submission
                                                </span>
                                            ) : (
                                                <span className="text-[10px] uppercase font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full shrink-0">
                                                    Pending
                                                </span>
                                            )}
                                        </div>

                                        {/* Grade & Feedback Display */}
                                        {assignment.status === 'GRADED' && assignment.submission && (
                                            <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-lg">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-green-700 dark:text-green-300 uppercase tracking-wide">Grade</span>
                                                    <span className="text-lg font-extrabold text-green-700 dark:text-green-300">{assignment.submission.grade}</span>
                                                </div>
                                                {assignment.submission.feedback && (
                                                    <div className="text-sm text-gray-700 dark:text-gray-300 mt-1">
                                                        <span className="font-semibold text-xs text-gray-500 uppercase mr-2">Feedback:</span>
                                                        {assignment.submission.feedback}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between mt-4 text-sm">
                                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 font-medium">
                                                <Calendar size={14} />
                                                Due: {assignment.dueDate}
                                            </div>

                                            <button
                                                onClick={() => handleOpenSubmission(assignment)}
                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors shadow-sm ${assignment.submission
                                                    ? 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                                                    }`}
                                            >
                                                {assignment.submission ? "Edit Submission" : "Submit Work"}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                <p>No assignments posted yet.</p>
                            </div>
                        )}
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
                                disabled={submitting}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                            >
                                {submitting ? 'Submitting...' : 'Submit Assignment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}


        </div>
    );
};

export default CourseDetails;
