import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
    BookOpen, FileText, Bell, ChevronDown, ChevronUp,
    Video, Link, File, AlignLeft, CheckCircle2,
    AlertCircle, Clock, Calendar, X, Download, User, MessageSquare
} from 'lucide-react';
import CourseDiscussion from '../components/CourseDiscussion';

const StudentCourseDetails = () => {
    const { id: courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('modules'); // modules, assignments, announcements, overview

    // Submission State
    const [submissionModalOpen, setSubmissionModalOpen] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState(null);
    const [submissionContent, setSubmissionContent] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Module Accordion State
    const [expandedModules, setExpandedModules] = useState({});

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const response = await api.get(`/student/courses/${courseId}`);
                setCourse(response.data);
                // Initialize expanded modules (first one open by default)
                if (response.data.modules && response.data.modules.length > 0) {
                    setExpandedModules({ [response.data.modules[0].id]: true });
                }
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

    const toggleModule = (moduleId) => {
        setExpandedModules(prev => ({
            ...prev,
            [moduleId]: !prev[moduleId]
        }));
    };

    const handleOpenSubmission = (assignment) => {
        const submission = assignment.submissions?.[0]; // Assuming single submission for now
        setSelectedAssignment({ ...assignment, submission });
        setSubmissionContent(submission?.content || '');
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

            // Refresh details
            const response = await api.get(`/student/courses/${courseId}`);
            setCourse(response.data);

        } catch (err) {
            console.error('Submission error:', err);
            toast.error('Failed to submit. Please try again.', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

    const getAssignmentStatus = (assignment) => {
        const submission = assignment.submissions?.[0];
        const now = new Date();
        const due = new Date(assignment.dueDate);

        if (submission) {
            if (submission.grade) return { label: 'GRADED', color: 'green' };
            if (new Date(submission.submittedAt) > due) return { label: 'LATE SUBMISSION', color: 'amber' };
            return { label: 'SUBMITTED', color: 'green' };
        }

        if (now > due) return { label: 'MISSING', color: 'red' };
        return { label: 'PENDING', color: 'gray' };
    };

    const renderModuleItemIcon = (type) => {
        switch (type) {
            case 'VIDEO': return <Video size={16} className="text-red-500" />;
            case 'PDF': return <FileText size={16} className="text-orange-500" />;
            case 'LINK': return <Link size={16} className="text-blue-500" />;
            default: return <AlignLeft size={16} className="text-gray-500" />;
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (error) return (
        <div className="p-6 text-center text-red-600 flex flex-col items-center gap-3">
            <AlertCircle size={32} />
            <p>{error}</p>
            <button onClick={() => navigate('/courses')} className="text-blue-600 font-medium">Back to Courses</button>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div>
                    <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">{course.code}</div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><User size={14} /> {course.instructor?.name}</span>
                        <span className="flex items-center gap-1"><Clock size={14} /> {course.progress}% Completed</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    {/* Actions if any */}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-t-xl px-4 sticky top-0 z-10">
                {['overview', 'modules', 'assignments', 'announcements', 'discussion'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => {
                            setActiveTab(tab);
                            if (tab === 'discussion' && course?.unreadDiscussionsCount > 0) {
                                setCourse(prev => ({ ...prev, unreadDiscussionsCount: 0 }));
                            }
                        }}
                        className={`py-4 px-6 font-medium text-sm capitalize whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${activeTab === tab
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        {tab === 'overview' && <BookOpen size={16} />}
                        {tab === 'modules' && <AlignLeft size={16} />}
                        {tab === 'assignments' && <FileText size={16} />}
                        {tab === 'announcements' && <Bell size={16} />}
                        {tab === 'discussion' && <MessageSquare size={16} />}
                        {tab === 'discussion' && course._count?.discussions ? (
                            <span className="flex items-center gap-2">
                                {tab} ({course._count.discussions})
                                {course.unreadDiscussionsCount > 0 && (
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                        {course.unreadDiscussionsCount}
                                    </span>
                                )}
                            </span>
                        ) : tab}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-6">

                    {/* MODULES TAB */}
                    {activeTab === 'modules' && (
                        <div className="space-y-4">
                            {course.modules && course.modules.length > 0 ? (
                                course.modules.map(module => (
                                    <div key={module.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        <button
                                            onClick={() => toggleModule(module.id)}
                                            className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <div className="flex flex-col items-start text-left">
                                                <h3 className="font-bold text-gray-900 dark:text-white">{module.title}</h3>
                                                {module.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{module.description}</p>}
                                            </div>
                                            {expandedModules[module.id] ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                        </button>

                                        {expandedModules[module.id] && (
                                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {module.items && module.items.length > 0 ? (
                                                    module.items.map(item => (
                                                        <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex items-center gap-3">
                                                            <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg shrink-0">
                                                                {renderModuleItemIcon(item.type)}
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</h4>
                                                                <p className="text-xs text-gray-500 truncate">{item.type} • {item.content}</p>
                                                            </div>
                                                            {item.type === 'LINK' || item.type === 'VIDEO' || item.type === 'PDF' ? (
                                                                <a href={item.content} target="_blank" rel="noopener noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-full">
                                                                    <Link size={16} />
                                                                </a>
                                                            ) : null}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="p-4 text-sm text-gray-400 text-center italic">No items in this module yet.</div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <AlignLeft size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No modules content available yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ASSIGNMENTS TAB */}
                    {activeTab === 'assignments' && (
                        <div className="space-y-4">
                            {course.assignments && course.assignments.length > 0 ? (
                                course.assignments.map(assignment => {
                                    const status = getAssignmentStatus(assignment);
                                    const submission = assignment.submissions?.[0];

                                    return (
                                        <div key={assignment.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                            <div className="flex justify-between items-start mb-4">
                                                <div>
                                                    <h3 className="font-bold text-gray-900 dark:text-white">{assignment.title}</h3>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{assignment.description || 'No description'}</p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-${status.color}-100 text-${status.color}-700 dark:bg-${status.color}-900/30 dark:text-${status.color}-300`}>
                                                    {status.label}
                                                </span>
                                            </div>

                                            {/* Feedback Section */}
                                            {submission?.grade && (
                                                <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                                                    <div className="flex justify-between items-center mb-1">
                                                        <span className="text-xs font-bold text-green-700 dark:text-green-400 uppercase">Grade</span>
                                                        <span className="text-lg font-bold text-green-800 dark:text-green-300">{submission.grade}</span>
                                                    </div>
                                                    {submission.feedback && (
                                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1"><span className="font-semibold">Feedback:</span> {submission.feedback}</p>
                                                    )}
                                                </div>
                                            )}

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                                <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                    <Calendar size={14} /> Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                                </div>
                                                <button
                                                    onClick={() => handleOpenSubmission(assignment)}
                                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${submission
                                                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                                                        : 'bg-blue-600 text-white hover:bg-blue-700'
                                                        }`}
                                                >
                                                    {submission ? 'View Submission' : 'Submit Work'}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No assignments assigned.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ANNOUNCEMENTS TAB */}
                    {activeTab === 'announcements' && (
                        <div className="space-y-4">
                            {course.announcements && course.announcements.length > 0 ? (
                                course.announcements.map(announcement => (
                                    <div key={announcement.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{announcement.title}</h3>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300">
                                            {announcement.content}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                    <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                    <p className="text-gray-500 dark:text-gray-400">No announcements yet.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* DISCUSSION TAB */}
                    {activeTab === 'discussion' && (
                        <CourseDiscussion courseId={courseId} />
                    )}

                    {/* OVERVIEW TAB */}
                    {activeTab === 'overview' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 space-y-6">
                            <section>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">About this Course</h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                                    {course.description || "No description provided for this course."}
                                </p>
                            </section>

                            <section>
                                <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-lg">Details</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Level</span>
                                        <span className="font-semibold">{course.level}</span>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Semester</span>
                                        <span className="font-semibold">{course.semester}</span>
                                    </div>
                                    <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                        <span className="text-xs text-gray-500 uppercase font-bold block mb-1">Credits</span>
                                        <span className="font-semibold">{course.credits || 3}</span>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Clock size={16} className="text-blue-500" /> Upcoming Due Dates
                        </h3>
                        <div className="space-y-4">
                            {course.assignments && course.assignments.filter(a => new Date(a.dueDate) > new Date()).slice(0, 3).map(a => (
                                <div key={a.id} className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                    <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md p-2 text-center min-w-[50px]">
                                        <div className="text-xs font-bold uppercase">{new Date(a.dueDate).toLocaleString('default', { month: 'short' })}</div>
                                        <div className="text-lg font-bold leading-none">{new Date(a.dueDate).getDate()}</div>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-sm text-gray-900 dark:text-white line-clamp-2">{a.title}</h4>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">Due at 11:59 PM</span>
                                    </div>
                                </div>
                            ))}
                            {(!course.assignments || course.assignments.filter(a => new Date(a.dueDate) > new Date()).length === 0) && (
                                <p className="text-sm text-gray-500 dark:text-gray-400">No upcoming assignments.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Submission Modal */}
            {submissionModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
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
                                    placeholder={selectedAssignment?.submissions?.[0]?.grade ? "This assignment has been graded." : "Paste your Google Doc link, GitHub repo, or type your answer here..."}
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow text-sm disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-500"
                                    value={submissionContent}
                                    onChange={(e) => setSubmissionContent(e.target.value)}
                                    disabled={!!selectedAssignment?.submissions?.[0]?.grade}
                                />
                                {!selectedAssignment?.submissions?.[0]?.grade && (
                                    <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                                        <AlertCircle size={12} />
                                        Links must be accessible publicly or to the instructor.
                                    </p>
                                )}
                            </div>

                            {!selectedAssignment?.submissions?.[0]?.grade && (
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                                >
                                    {submitting ? 'Submitting...' : 'Submit Assignment'}
                                </button>
                            )}
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentCourseDetails;
