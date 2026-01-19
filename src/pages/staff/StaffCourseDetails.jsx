import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Calendar, MapPin, Clock, Mail, BookOpen, Plus, Trash2, X, FileText, CheckCircle, AlignLeft, Video, Link as LinkIcon, Bell, Edit2, ChevronDown, ChevronUp, Table, Save, Search, Printer } from 'lucide-react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import { jsPDF } from 'jspdf';

// Force Rebuild ID: 12345
const StaffCourseDetails = () => {
    const { id } = useParams();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('roster'); // 'roster', 'assignments', 'schedule', 'gradebook'

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
        status: 'PENDING',
        fileUrl: ''
    });

    // Submission Review State
    const [submissionsModalOpen, setSubmissionsModalOpen] = useState(false);
    const [selectedAssignmentForReview, setSelectedAssignmentForReview] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // Search and Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');

    // Grading State
    const [gradingStudent, setGradingStudent] = useState(null); // The student being graded
    const [gradingForm, setGradingForm] = useState({ grade: '', feedback: '' });
    const [submittingGrade, setSubmittingGrade] = useState(false);

    // Gradebook State
    const [gradebookData, setGradebookData] = useState({ students: [], assignments: [], grades: {} });
    const [gradeUpdates, setGradeUpdates] = useState({});
    const [loadingGradebook, setLoadingGradebook] = useState(false);
    const [savingGrades, setSavingGrades] = useState(false);

    // Module States
    const [moduleModalOpen, setModuleModalOpen] = useState(false);
    const [moduleItemModalOpen, setModuleItemModalOpen] = useState(false);
    const [selectedModuleId, setSelectedModuleId] = useState(null);
    const [expandedModules, setExpandedModules] = useState({});
    const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
    const [moduleItemForm, setModuleItemForm] = useState({ title: '', type: 'TEXT', content: '' });

    // New Module Delete State
    const [moduleDeleteConf, setModuleDeleteConf] = useState({ open: false, type: null, id: null });
    const [deletingModule, setDeletingModule] = useState(false);

    // Announcement States
    const [announcementModalOpen, setAnnouncementModalOpen] = useState(false);
    const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
    const [announcementToDelete, setAnnouncementToDelete] = useState(null);

    // Attendance State
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRoster, setAttendanceRoster] = useState([]);

    const fetchAttendance = async () => {
        try {
            const { data } = await api.get(`/courses/${id}/attendance/date?date=${attendanceDate}`);
            setAttendanceRoster(data.roster);
        } catch (error) {
            console.error('Failed to fetch attendance', error);
            toast.error('Failed to load attendance register');
        }
    };

    const fetchGradebook = async () => {
        setLoadingGradebook(true);
        setGradebookData({ students: [], assignments: [], grades: {} }); // Clear previous data immediately
        try {
            const { data } = await api.get(`/courses/${id}/gradebook`);

            // Deduplicate students on frontend as safety net
            const uniqueStudents = [];
            const seenIds = new Set();
            if (data.students) {
                data.students.forEach(student => {
                    if (!seenIds.has(student.id)) {
                        seenIds.add(student.id);
                        uniqueStudents.push(student);
                    }
                });
                data.students = uniqueStudents;
            }

            setGradebookData(data);
            setGradeUpdates({}); // Clear unsaved changes on refresh
        } catch (error) {
            console.error('Failed to fetch gradebook', error);
            toast.error('Failed to load gradebook');
        } finally {
            setLoadingGradebook(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'attendance' && id) {
            fetchAttendance();
        }
        if (activeTab === 'gradebook' && id) {
            fetchGradebook();
        }
    }, [activeTab, attendanceDate, id]);

    const handleGradeCellChange = (studentId, assignmentId, value) => {
        const key = `${studentId}_${assignmentId}`;
        setGradeUpdates(prev => ({ ...prev, [key]: value }));
    };

    const saveGradebookChanges = async () => {
        setSavingGrades(true);
        const loadingToast = toast.loading('Saving grades...');

        // Convert updates map to array payload
        const updates = Object.entries(gradeUpdates).map(([key, grade]) => {
            const [studentId, assignmentId] = key.split('_');
            return { studentId, assignmentId, grade };
        });

        try {
            await api.post(`/courses/${id}/gradebook/bulk`, { updates });
            toast.success('Grades saved successfully', { id: loadingToast });
            fetchGradebook(); // Refresh data
        } catch (error) {
            console.error('Failed to save grades', error);
            toast.error('Failed to save grades', { id: loadingToast });
        } finally {
            setSavingGrades(false);
        }
    };

    const handleStatusChange = (studentId, status) => {
        setAttendanceRoster(prev => prev.map(item =>
            item.student.id === studentId ? { ...item, status } : item
        ));
    };

    const markAllPresent = () => {
        setAttendanceRoster(prev => prev.map(item => ({ ...item, status: 'PRESENT' })));
    };

    const saveAttendance = async () => {
        setSubmitting(true);
        const loadingToast = toast.loading('Saving attendance...');
        try {
            const records = attendanceRoster
                .filter(item => item.status) // Only send marked records
                .map(item => ({
                    studentId: item.student.id,
                    status: item.status
                }));

            await api.post(`/courses/${id}/attendance/bulk`, {
                date: attendanceDate,
                courseId: id,
                records
            });

            toast.success('Attendance saved', { id: loadingToast });
            fetchAttendance(); // Refresh to ensure sync
        } catch (error) {
            console.error('Save attendance error', error);
            toast.error('Failed to save attendance', { id: loadingToast });
        } finally {
            setSubmitting(false);
        }
    };

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
                status: 'PENDING',
                fileUrl: ''
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
        // Reset filters
        setSearchTerm('');
        setStatusFilter('ALL');
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

    const handleDownloadSubmission = (item) => {
        const content = item.submission?.content || '';

        // If content is a URL, open it
        if (content.startsWith('http://') || content.startsWith('https://')) {
            window.open(content, '_blank', 'noopener,noreferrer');
            return;
        }

        // Otherwise generate PDF
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text("Submission Details", 20, 20);

        doc.setFontSize(12);
        doc.text(`Student: ${item.student.name}`, 20, 40);
        doc.text(`Assignment: ${selectedAssignmentForReview?.title}`, 20, 50);
        doc.text(`Submitted: ${new Date(item.submission.submittedAt).toLocaleString()}`, 20, 60);
        doc.text(`Status: ${item.status}`, 20, 70);

        if (item.submission.grade) {
            doc.text(`Grade: ${item.submission.grade}`, 20, 80);
        }

        doc.setFontSize(14);
        doc.text("Content:", 20, 100);

        doc.setFontSize(11);
        const splitContent = doc.splitTextToSize(content, 170);
        doc.text(splitContent, 20, 110);

        doc.save(`${item.student.name.replace(/\s+/g, '_')}_Submission.pdf`);
        toast.success('Submission downloaded');
    };

    const toggleModule = (moduleId) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    const handleCreateModule = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/staff/modules', { ...moduleForm, courseId: id });
            toast.success('Module created');
            setModuleModalOpen(false);
            setModuleForm({ title: '', description: '' });
            fetchDetails();
        } catch (error) {
            toast.error('Failed to create module');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteModule = (moduleId) => {
        setModuleDeleteConf({ open: true, type: 'MODULE', id: moduleId });
    };

    const handleCreateModuleItem = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/staff/modules/items', { ...moduleItemForm, moduleId: selectedModuleId });
            toast.success('Item added');
            setModuleItemModalOpen(false);
            setModuleItemForm({ title: '', type: 'TEXT', content: '' });
            fetchDetails();
        } catch (error) {
            toast.error('Failed to add item');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteModuleItem = (itemId) => {
        setModuleDeleteConf({ open: true, type: 'ITEM', id: itemId });
    };

    const handleConfirmDeleteModuleAction = async () => {
        if (!moduleDeleteConf.id) return;
        setDeletingModule(true);
        try {
            if (moduleDeleteConf.type === 'MODULE') {
                await api.delete(`/staff/modules/${moduleDeleteConf.id}`);
                toast.success('Module deleted');
            } else if (moduleDeleteConf.type === 'ITEM') {
                await api.delete(`/staff/modules/items/${moduleDeleteConf.id}`);
                toast.success('Item deleted');
            } else if (moduleDeleteConf.type === 'ANNOUNCEMENT') {
                await api.delete(`/announcements/${moduleDeleteConf.id}`);
                toast.success('Announcement deleted');
            }
            fetchDetails();
            setModuleDeleteConf({ open: false, type: null, id: null });
        } catch (error) {
            console.error(error);
            toast.error('Failed to delete');
        } finally {
            setDeletingModule(false);
        }
    };

    const handleCreateAnnouncement = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('/announcements', {
                ...announcementForm,
                courseId: id,
                targetRole: 'STUDENT'
            });
            toast.success('Announcement posted');
            setAnnouncementModalOpen(false);
            setAnnouncementForm({ title: '', content: '' });
            fetchDetails();
        } catch (error) {
            toast.error('Failed to post announcement');
        } finally {
            setSubmitting(false);
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
                <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex flex-wrap items-center gap-2">
                            {course.name}
                            <span className="text-sm font-normal px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full border border-blue-200 dark:border-blue-800">
                                {course.code}
                            </span>
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 max-w-2xl">{course.description || 'No description provided.'}</p>
                    </div>
                    <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm w-full md:w-auto justify-center md:justify-start">
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
            <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                <nav className="-mb-px flex space-x-6 md:space-x-8 w-max md:w-auto p-1">
                    <button
                        onClick={() => setActiveTab('roster')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'roster'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <Users size={18} />
                        Class Roster
                    </button>
                    <button
                        onClick={() => setActiveTab('schedule')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'schedule'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <Calendar size={18} />
                        Schedule
                    </button>
                    <button
                        onClick={() => setActiveTab('assignments')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'assignments'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <FileText size={18} />
                        Assignments
                    </button>
                    <button
                        onClick={() => setActiveTab('gradebook')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'gradebook'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <Table size={18} />
                        Gradebook
                    </button>
                    <button
                        onClick={() => setActiveTab('modules')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'modules'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <AlignLeft size={18} />
                        Modules
                    </button>
                    <button
                        onClick={() => setActiveTab('announcements')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'announcements'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <Bell size={18} />
                        Announcements
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 whitespace-nowrap ${activeTab === 'attendance'
                            ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                            }`}
                    >
                        <CheckCircle size={18} />
                        Attendance
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

                {activeTab === 'gradebook' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                <Table size={20} className="text-blue-500" />
                                <span className="flex-1">Digital Gradebook</span>
                                {Object.keys(gradeUpdates).length > 0 && (
                                    <span className="text-xs font-normal px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full border border-yellow-200">
                                        Unsaved Changes
                                    </span>
                                )}
                            </h3>
                            <button
                                onClick={saveGradebookChanges}
                                disabled={Object.keys(gradeUpdates).length === 0 || savingGrades}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${Object.keys(gradeUpdates).length > 0
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-700 dark:text-gray-500'
                                    }`}
                            >
                                <Save size={16} />
                                {savingGrades ? 'Saving...' : 'Save All Grades'}
                            </button>
                        </div>

                        {loadingGradebook ? (
                            <div className="text-center py-12 text-gray-500">Loading gradebook...</div>
                        ) : !gradebookData.students.length ? (
                            <div className="text-center py-12 text-gray-500">No students found.</div>
                        ) : !gradebookData.assignments.length ? (
                            <div className="text-center py-12 text-gray-500">No assignments created yet.</div>
                        ) : (
                            <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 sticky left-0 bg-gray-50 dark:bg-gray-800 z-10 border-b border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                Student Name
                                            </th>
                                            {gradebookData.assignments.map(ass => (
                                                <th key={ass.id} className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 min-w-[150px]">
                                                    <div className="flex flex-col">
                                                        <span className="truncate max-w-[150px]" title={ass.title}>{ass.title}</span>
                                                        <span className="text-[10px] font-normal text-gray-400">{new Date(ass.dueDate).toLocaleDateString()}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {gradebookData.students.map(student => (
                                            <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800 z-10 border-r border-gray-200 dark:border-gray-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                                                    {student.name}
                                                </td>
                                                {gradebookData.assignments.map(ass => {
                                                    // Get current value: Check edits first, then DB data
                                                    const editKey = `${student.id}_${ass.id}`;
                                                    const dbEntry = gradebookData.grades[student.id]?.[ass.id];
                                                    const currentValue = gradeUpdates[editKey] !== undefined
                                                        ? gradeUpdates[editKey]
                                                        : (dbEntry?.grade || '');

                                                    const isGraded = !!dbEntry?.grade;
                                                    const isSubmitted = dbEntry?.submitted && !dbEntry?.grade;

                                                    // Determine border color for visual cue
                                                    let borderColor = 'border-gray-200 dark:border-gray-600';
                                                    if (gradeUpdates[editKey] !== undefined) borderColor = 'border-blue-400 dark:border-blue-500 ring-2 ring-blue-100 dark:ring-blue-900';
                                                    else if (isGraded) borderColor = 'border-green-300 dark:border-green-700';
                                                    else if (isSubmitted) borderColor = 'border-yellow-300 dark:border-yellow-700';

                                                    return (
                                                        <td key={ass.id} className="px-4 py-2">
                                                            <input
                                                                type="text"
                                                                value={currentValue}
                                                                onChange={(e) => handleGradeCellChange(student.id, ass.id, e.target.value)}
                                                                placeholder={isSubmitted ? "Grade now..." : "-"}
                                                                className={`w-full px-2 py-1 text-sm rounded border ${borderColor} focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all`}
                                                            />
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        <div className="mt-4 flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm border border-green-300 bg-white dark:bg-gray-700"></div>
                                <span>Graded</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm border border-yellow-300 bg-white dark:bg-gray-700"></div>
                                <span>Submitted / Pending</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-3 h-3 rounded-sm border border-blue-400 bg-white dark:bg-gray-700"></div>
                                <span>Edited (Unsaved)</span>
                            </div>
                        </div>
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

                {activeTab === 'modules' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Course Modules</h3>
                            <button
                                onClick={() => setModuleModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                New Module
                            </button>
                        </div>

                        <div className="space-y-4">
                            {course.modules && course.modules.length > 0 ? (
                                course.modules.map(module => (
                                    <div key={module.id} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                            <button
                                                onClick={() => toggleModule(module.id)}
                                                className="flex-1 flex flex-col items-start text-left"
                                            >
                                                <h3 className="font-bold text-gray-900 dark:text-white">{module.title}</h3>
                                                {module.description && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{module.description}</p>}
                                            </button>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => { setSelectedModuleId(module.id); setModuleItemModalOpen(true); }}
                                                    className="p-2 text-blue-600 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-lg"
                                                    title="Add Item"
                                                >
                                                    <Plus size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteModule(module.id)}
                                                    className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg"
                                                    title="Delete Module"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                                <button onClick={() => toggleModule(module.id)}>
                                                    {expandedModules[module.id] ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                                </button>
                                            </div>
                                        </div>

                                        {expandedModules[module.id] && (
                                            <div className="divide-y divide-gray-100 dark:divide-gray-700">
                                                {module.items && module.items.length > 0 ? (
                                                    module.items.map(item => (
                                                        <div key={item.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3 min-w-0">
                                                                <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg shrink-0">
                                                                    {item.type === 'VIDEO' && <Video size={16} className="text-red-500" />}
                                                                    {item.type === 'PDF' && <FileText size={16} className="text-orange-500" />}
                                                                    {item.type === 'LINK' && <LinkIcon size={16} className="text-blue-500" />}
                                                                    {item.type === 'TEXT' && <AlignLeft size={16} className="text-gray-500" />}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <h4 className="font-medium text-gray-900 dark:text-white text-sm">{item.title}</h4>
                                                                    <p className="text-xs text-gray-500 truncate">{item.type} • {item.content}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => handleDeleteModuleItem(item.id)}
                                                                className="text-gray-400 hover:text-red-500"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
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
                                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                    <AlignLeft size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                    <p>No modules created yet.</p>
                                    <button
                                        onClick={() => setModuleModalOpen(true)}
                                        className="mt-2 text-blue-600 dark:text-blue-400 font-medium hover:underline"
                                    >
                                        Create your first module
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'announcements' && (
                    <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Course Announcements</h3>
                            <button
                                onClick={() => setAnnouncementModalOpen(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                            >
                                <Plus size={16} />
                                New Announcement
                            </button>
                        </div>

                        <div className="space-y-4">
                            {course.announcements && course.announcements.length > 0 ? (
                                course.announcements.map(announcement => (
                                    <div key={announcement.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">{announcement.title}</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(announcement.createdAt).toLocaleDateString()}</span>
                                                <button
                                                    onClick={() => setModuleDeleteConf({ open: true, type: 'ANNOUNCEMENT', id: announcement.id })}
                                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Delete Announcement"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                        <div className="prose dark:prose-invert max-w-none text-sm text-gray-600 dark:text-gray-300">
                                            {announcement.content}
                                        </div>
                                        <div className="mt-3 text-xs text-gray-400">
                                            Visible to: {announcement.targetRole || 'ALL'}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-gray-500 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                    <Bell size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
                                    <p>No announcements posted yet.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {activeTab === 'attendance' && (
                    <div className="p-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">Attendance Register</h3>
                            <div className="flex items-center gap-4">
                                <input
                                    type="date"
                                    className="rounded-lg border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={attendanceDate}
                                    onChange={(e) => setAttendanceDate(e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                                <button
                                    onClick={saveAttendance}
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {submitting ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                            {/* Toolbar */}
                            <div className="p-4 bg-gray-50 dark:bg-gray-700/30 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                                    {attendanceRoster.length} Students
                                </span>
                                <button
                                    onClick={markAllPresent}
                                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                                >
                                    Mark All Present
                                </button>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                        <tr>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                            <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {attendanceRoster.length > 0 ? (
                                            attendanceRoster.map((item) => (
                                                <tr key={item.student.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold mr-3">
                                                                {item.student.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-sm font-medium text-gray-900 dark:text-white">{item.student.name}</div>
                                                                <div className="text-xs text-gray-500">{item.student.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex gap-2">
                                                            {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map(status => (
                                                                <button
                                                                    key={status}
                                                                    onClick={() => handleStatusChange(item.student.id, status)}
                                                                    className={`px-3 py-1 text-xs font-bold rounded-full transition-all border ${item.status === status
                                                                        ? status === 'PRESENT' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800'
                                                                            : status === 'LATE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800'
                                                                                : status === 'EXCUSED' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                                                                                    : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800'
                                                                        : 'bg-white dark:bg-gray-800 text-gray-500 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                                        }`}
                                                                >
                                                                    {status}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="2" className="px-6 py-12 text-center text-gray-500">
                                                    No students found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">File URL (Optional)</label>
                                <input
                                    type="url"
                                    placeholder="https://"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={assignmentForm.fileUrl}
                                    onChange={(e) => setAssignmentForm({ ...assignmentForm, fileUrl: e.target.value })}
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
                <div id="printable-area" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-7xl overflow-hidden h-[80vh] flex flex-col">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center bg-gray-50 dark:bg-gray-700/50 shrink-0 gap-4 no-print">
                            <div className="flex-1">
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">Submission Review</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedAssignmentForReview?.title}</p>
                            </div>

                            {/* Filters & Actions */}
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <div className="relative flex-1 md:w-64">
                                    <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Search student..."
                                        className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <select
                                    className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                >
                                    <option value="ALL">All Status</option>
                                    <option value="SUBMITTED">Submitted</option>
                                    <option value="GRADED">Graded</option>
                                    <option value="MISSING">Missing/Pending</option>
                                </select>
                                <button
                                    onClick={() => window.print()}
                                    className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
                                    title="Print List"
                                >
                                    <Printer size={18} />
                                </button>
                                <button onClick={() => setSubmissionsModalOpen(false)} className="ml-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                    <X size={20} />
                                </button>
                            </div>
                        </div>



                        <div className="flex-1 overflow-y-auto p-0">
                            {loadingSubmissions ? (
                                <div className="flex items-center justify-center h-full no-print">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                                        <tr>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted At</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider w-1/3 no-print">Content</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Grade</th>
                                            <th className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider no-print">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {submissions.filter(item => {
                                            const matchesSearch = item.student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                                item.student.email.toLowerCase().includes(searchTerm.toLowerCase());
                                            const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter ||
                                                (statusFilter === 'MISSING' && (item.status === 'PENDING' || item.status === 'MISSING'));
                                            return matchesSearch && matchesStatus;
                                        }).map((item) => (
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
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 no-print">
                                                    {item.submission ? (
                                                        <button
                                                            onClick={() => handleDownloadSubmission(item)}
                                                            className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors font-medium hover:underline"
                                                            title="View/Download Submission"
                                                        >
                                                            <FileText size={16} />
                                                            View Content
                                                        </button>
                                                    ) : '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">
                                                    {item.submission?.grade || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm no-print">
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

            {/* Module Modal */}
            {moduleModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setModuleModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Create New Module</h3>
                            <button onClick={() => setModuleModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateModule} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Module Title</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={moduleForm.title}
                                    onChange={(e) => setModuleForm({ ...moduleForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description (Optional)</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows="3"
                                    value={moduleForm.description}
                                    onChange={(e) => setModuleForm({ ...moduleForm, description: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Creating...' : 'Create Module'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Module Item Modal */}
            {moduleItemModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setModuleItemModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Add Module Item</h3>
                            <button onClick={() => setModuleItemModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateModuleItem} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Item Title</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={moduleItemForm.title}
                                    onChange={(e) => setModuleItemForm({ ...moduleItemForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={moduleItemForm.type}
                                    onChange={(e) => setModuleItemForm({ ...moduleItemForm, type: e.target.value })}
                                >
                                    <option value="TEXT">Text / Note</option>
                                    <option value="LINK">External Link</option>
                                    <option value="VIDEO">Video URL</option>
                                    <option value="PDF">PDF URL</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content / URL</label>
                                {moduleItemForm.type === 'TEXT' ? (
                                    <textarea
                                        required
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        rows="4"
                                        placeholder="Enter content here..."
                                        value={moduleItemForm.content}
                                        onChange={(e) => setModuleItemForm({ ...moduleItemForm, content: e.target.value })}
                                    />
                                ) : (
                                    <input
                                        type="url"
                                        required
                                        placeholder="https://example.com/resource"
                                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        value={moduleItemForm.content}
                                        onChange={(e) => setModuleItemForm({ ...moduleItemForm, content: e.target.value })}
                                    />
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Adding...' : 'Add Item'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Announcement Modal */}
            {announcementModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setAnnouncementModalOpen(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">Post Announcement</h3>
                            <button onClick={() => setAnnouncementModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleCreateAnnouncement} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
                                <input
                                    type="text"
                                    autoFocus
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    value={announcementForm.title}
                                    onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Content</label>
                                <textarea
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 p-2.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                    rows="5"
                                    placeholder="Announcement details..."
                                    value={announcementForm.content}
                                    onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-all disabled:opacity-50"
                            >
                                {submitting ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {/* Module Deletion Confirmation */}
            <ConfirmationModal
                isOpen={moduleDeleteConf.open}
                onClose={() => setModuleDeleteConf({ open: false, type: null, id: null })}
                onConfirm={handleConfirmDeleteModuleAction}
                title={moduleDeleteConf.type === 'MODULE' ? 'Delete Module' : 'Delete Item'}
                message={moduleDeleteConf.type === 'MODULE'
                    ? 'Are you sure you want to delete this module? All containing items (videos, PDFs, etc.) will be permanently deleted.'
                    : 'Are you sure you want to delete this item? This action cannot be undone.'}
                confirmText="Delete"
                isDanger={true}
                loading={deletingModule}
            />

            {/* Existing Confirmation Modal for other things (Schedule, etc.) */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setScheduleToDelete(null);
                    setAssignmentToDelete(null);
                }}
                onConfirm={scheduleToDelete ? confirmDeleteSchedule : confirmDeleteAssignment}
                title={scheduleToDelete ? "Remove Class Schedule" : "Delete Assignment"}
                message={scheduleToDelete
                    ? `Are you sure you want to remove the ${scheduleToDelete.type} on ${scheduleToDelete.day}?`
                    : `Are you sure you want to delete "${assignmentToDelete?.title}"? All student submissions for this assignment will also be deleted.`}
                confirmText="Delete"
                isDanger={true}
            />
        </div>
    );
};

export default StaffCourseDetails;
