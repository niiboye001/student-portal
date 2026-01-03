import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, MapPin, Clock, Mail, BookOpen, Plus, Trash2, X, FileText, CheckCircle } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';

const StaffCourseDetails = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('roster'); // 'roster', 'assignments', 'schedule'

    // Schedule Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [scheduleForm, setScheduleForm] = useState({
        day: 'Monday',
        startTime: '',
        endTime: '',
        room: '',
        type: 'Lecture'
    });

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [scheduleToDelete, setScheduleToDelete] = useState(null);

    // Assignment States
    const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
    const [assignmentToDelete, setAssignmentToDelete] = useState(null);
    const [assignmentForm, setAssignmentForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        status: 'PENDING'
    });

    // Submission Review State
    const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
    const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Grading State
    const [gradingStudent, setGradingStudent] = useState(null); // The student being graded
    const [gradingForm, setGradingForm] = useState({ grade: '', feedback: '' });
    const [submittingGrade, setSubmittingGrade] = useState(false);

    const fetchDetails = async () => {
        try {
            const { data } = await api.get(`/staff/courses/${id}`);
            setCourse(data);
        } catch (error) {
            console.error('Failed to fetch course details', error);
            toast.error('Failed to load course details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchDetails();
    }, [id]);

    const handleAddSchedule = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/staff/courses/${id}/schedule`, scheduleForm);
            toast.success('Class schedule added successfully');
            setIsModalOpen(false);
            setScheduleForm({
                day: 'Monday',
                startTime: '',
                endTime: '',
                room: '',
                type: 'Lecture'
            });
            fetchDetails(); // Refresh data
        } catch (error) {
            console.error('Add schedule error', error);
            toast.error('Failed to add class schedule');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeleteSchedule = async () => {
        if (!scheduleToDelete) return;
        try {
            await api.delete(`/staff/courses/${id}/schedule/${scheduleToDelete.id}`);
            toast.success('Class removed');
            fetchDetails();
            setDeleteModalOpen(false);
        } catch (error) {
            console.error('Delete schedule error', error);
            toast.error('Failed to remove class');
        }
    };

    const handleDeleteClick = (schedule) => {
        setScheduleToDelete(schedule);
        setDeleteModalOpen(true);
    };

    const handleAddAssignment = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/staff/courses/${id}/assignments`, assignmentForm);
            toast.success('Assignment created successfully');
            setAssignmentModalOpen(false);
            setAssignmentForm({
                title: '',
                description: '',
                dueDate: '',
                status: 'PENDING'
            });
            fetchDetails();
        } catch (error) {
            console.error('Add assignment error', error);
            toast.error('Failed to create assignment');
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDeleteAssignment = async () => {
        if (!assignmentToDelete) return;
        try {
            await api.delete(`/staff/courses/${id}/assignments/${assignmentToDelete.id}`);
            toast.success('Assignment deleted');
            fetchDetails();
            setDeleteModalOpen(false);
            setAssignmentToDelete(null);
        } catch (error) {
            console.error('Delete assignment error', error);
            toast.error('Failed to delete assignment');
        }
    };

    const handleDeleteAssignmentClick = (assignment) => {
        setAssignmentToDelete(assignment);
        setDeleteModalOpen(true);
    };

    const handleOpenGrading = (studentItem) => {
        setGradingStudent(studentItem);
        setGradingForm({
            grade: studentItem.submission?.grade || '',
            feedback: studentItem.submission?.feedback || ''
        });
    };

    const handleSubmitGrade = async (e) => {
        e.preventDefault();
        setSubmittingGrade(true);
        const loadingToast = toast.loading('Saving grade...');

        try {
            await api.post(`/staff/courses/${id}/assignments/${selectedAssignmentForReview.id}/submissions/${gradingStudent.student.id}/grade`, gradingForm);

            toast.success('Grade saved successfully', { id: loadingToast });

            // Refresh submissions list
            const { data } = await api.get(`/staff/courses/${id}/assignments/${selectedAssignmentForReview.id}/submissions`);
            setSubmissions(data); // Refresh list
            setGradingStudent(null); // Close grading form

        } catch (error) {
            console.error('Error saving grade:', error);
            toast.error('Failed to save grade', { id: loadingToast });
        } finally {
            setSubmittingGrade(false);
        }
    };

    const handleViewSubmissions = async (assignment) => {
        setSelectedAssignmentForReview(assignment);
        setSubmissionsModalOpen(true);
        setLoadingSubmissions(true);
        try {
            const { data } = await api.get(`/staff/courses/${id}/assignments/${assignment.id}/submissions`);
            setSubmissions(data);
        } catch (error) {
            console.error('Error fetching submissions:', error);
            toast.error('Failed to load submissions');
        } finally {
            setLoadingSubmissions(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading course details...</div>;
    if (!course) return <div className="p-8 text-center text-gray-500">Course not found.</div>;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <Link to="/staff/courses" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-4 transition-colors">
                    <ArrowLeft size={16} className="mr-1" /> Back to My Courses
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            {course.name}
                            <span className="text-sm font-normal px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                                {course.code}
                            </span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 max-w-2xl">{course.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-gray-400" />
                            <span>{course.credits} Credits</span>
                        </div>
                        <div className="w-px h-4 bg-gray-200 dark:bg-gray-700"></div>
                        <div className="flex items-center gap-2">
                            <Users size={16} className="text-gray-400" />
                            <span>{course._count?.enrollments || 0} Students</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('roster')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'roster'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <Users size={18} />
                        Class Roster
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'schedule'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <Calendar size={18} />
                        Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${activeTab === 'assignments'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <FileText size={18} />
                        Assignments
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px]">
                {activeTab === 'roster' && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student Name</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                    <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Enrolled On</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {course.enrollments && course.enrollments.length > 0 ? (
                                    course.enrollments.map((enrollment, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mr-3">
                                                        {enrollment.user.name.charAt(0)}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{enrollment.user.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {enrollment.user.email}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="px-6 py-12 text-center text-gray-500">
                                            No students enrolled yet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Weekly Class Schedule</h3>
                            <button
                                onClick={() => setIsModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                Add Class
                            </button>
                        </div>

                        {course.schedule && course.schedule.length > 0 ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {course.schedule.map((sch) => (
                                    <div key={sch.id} className="group relative border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-700/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                        <button
                                            onClick={() => handleDeleteClick(sch)}
                                            className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                            title="Remove class"
                                        >
                                            <Trash2 size={16} />
                                        </button>

                                        <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white mb-2">
                                            <Calendar size={18} className="text-blue-500" />
                                            {sch.day}
                                        </div>
                                        <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} />
                                                {sch.startTime} - {sch.endTime}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <MapPin size={14} />
                                                {sch.room}
                                            </div>
                                            <div className="inline-block px-2 py-0.5 mt-2 text-xs font-medium bg-gray-200 dark:bg-gray-600 rounded text-gray-700 dark:text-gray-300">
                                                {sch.type}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                <Calendar size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                <p>No classes scheduled yet.</p>
                                <button
                                    onClick={() => setIsModalOpen(true)}
                                    className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                >
                                    Add your first class time
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'assignments' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Course Assignments</h3>
                            <button
                                onClick={() => setAssignmentModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                New Assignment
                            </button>
                        </div>

                        {course.assignments && course.assignments.length > 0 ? (
                            <div className="space-y-4">
                                {course.assignments.map((assignment) => (
                                    <div key={assignment.id} className="group flex justify-between items-start p-5 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-700/30 hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 dark:text-white">{assignment.title}</h4>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${assignment.status === 'PUBLISHED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300'
                                                    }`}>
                                                    {assignment.status}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{assignment.description || 'No description'}</p>
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
                                                <Calendar size={14} />
                                                Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleViewSubmissions(assignment)}
                                                className="px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 rounded-lg transition-colors border border-blue-200 dark:border-blue-800"
                                            >
                                                View Submissions
                                            </button>
                                            <button
                                                onClick={() => handleDeleteAssignmentClick(assignment)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                title="Delete assignment"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                <FileText size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                <p>No assignments created yet.</p>
                                <button
                                    onClick={() => setAssignmentModalOpen(true)}
                                    className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                >
                                    Create your first assignment
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Add Schedule Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add Class Schedule</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddSchedule} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Week</label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={scheduleForm.day}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })}
                                >
                                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                        <option key={day} value={day}>{day}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={scheduleForm.startTime}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={scheduleForm.endTime}
                                        onChange={(e) => setScheduleForm({ ...scheduleForm, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Room / Location</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Room 304, Lab B"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={scheduleForm.room}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, room: e.target.value })}
                                    maxLength={20}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Type</label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={scheduleForm.type}
                                    onChange={(e) => setScheduleForm({ ...scheduleForm, type: e.target.value })}
                                >
                                    <option value="Lecture">Lecture</option>
                                    <option value="Lab">Lab</option>
                                    <option value="Seminar">Seminar</option>
                                    <option value="Tutorial">Tutorial</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Add Class'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Assignment Modal */}
            {assignmentModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create Assignment</h3>
                            <button onClick={() => setAssignmentModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleAddAssignment} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={assignmentForm.title}
                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={assignmentForm.description}
                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={assignmentForm.dueDate}
                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-sm transition-colors disabled:opacity-50"
                            >
                                {submitting ? 'Creating...' : 'Create Assignment'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Submissions Review Modal */}
            {submissionsModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-7xl overflow-hidden h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-700/50 shrink-0">
                            <div>
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Submission Review</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAssignmentForReview?.title}</p>
                            </div>
                            <button onClick={() => setSubmissionsModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-0">
                            {loadingSubmissions ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                        <tr>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted At</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3">Content</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {submissions.map((item) => (
                                            <tr key={item.student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <div className="font-medium text-gray-900 dark:text-white">{item.student.name}</div>
                                                    <div className="text-xs text-gray-500">{item.student.email}</div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className={`px-2 py-1 text-xs font-bold rounded-full uppercase tracking-wider ${item.status === 'GRADED' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                                        item.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                            'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                                                        }`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                    {item.submission?.submittedAt ? new Date(item.submission.submittedAt).toLocaleString() : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 break-words whitespace-pre-wrap min-w-[300px]">
                                                    {item.submission?.content || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                    {item.submission?.grade || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                                    <button
                                                        onClick={() => handleOpenGrading(item)}
                                                        disabled={!item.submission}
                                                        className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                                                    >
                                                        {item.submission?.grade ? 'Edit Grade' : 'Grade'}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Grading Form Drawer/Footer */}
                        {gradingStudent && (
                            <div className="border-t border-gray-200 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-700/50 animate-slide-up">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-gray-900 dark:text-white">
                                        Grading: <span className="text-blue-600 dark:text-blue-400">{gradingStudent.student.name}</span>
                                    </h4>
                                    <button onClick={() => setGradingStudent(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                        Cancel
                                    </button>
                                </div>
                                <form onSubmit={handleSubmitGrade} className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Grade</label>
                                        <select
                                            required
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={gradingForm.grade}
                                            onChange={(e) => setGradingForm({ ...gradingForm, grade: e.target.value })}
                                        >
                                            <option value="">Select Grade</option>
                                            {['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'].map(g => (
                                                <option key={g} value={g}>{g}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1 uppercase">Feedback</label>
                                        <input
                                            type="text"
                                            placeholder="Great work! Maybe consider..."
                                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            value={gradingForm.feedback}
                                            onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex items-end">
                                        <button
                                            type="submit"
                                            disabled={submittingGrade}
                                            className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm shadow-sm transition-colors disabled:opacity-50"
                                        >
                                            {submittingGrade ? 'Saving...' : 'Save Grade'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setScheduleToDelete(null);
                    setAssignmentToDelete(null);
                }}
                onConfirm={scheduleToDelete ? confirmDeleteSchedule : confirmDeleteAssignment}
                title={scheduleToDelete ? "Delete Class Schedule" : "Delete Assignment"}
                message={scheduleToDelete
                    ? `Are you sure you want to remove the ${scheduleToDelete?.type} on ${scheduleToDelete?.day}?`
                    : `Are you sure you want to delete "${assignmentToDelete?.title}"?`
                }
                confirmText={scheduleToDelete ? "Remove Class" : "Delete Assignment"}
                isDanger={true}
            />
        </div>
    );
};

export default StaffCourseDetails;
