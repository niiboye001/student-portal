import React, { useEffect, useState } from 'react';
import { X, BookOpen, User, Clock, CheckCircle2, AlertCircle, FileText, Calendar } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CourseDetails = ({ courseId, onClose }) => {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

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
            setSubmitted(false); // Reset on new course
            fetchDetails();
        }
    }, [courseId]);

    const handleSubmitProject = async () => {
        const loadingToast = toast.loading('Submitting your final project...');
        setSubmitting(true);
        try {
            await api.post(`/student/courses/${courseId}/submit`);
            setSubmitted(true);
            toast.success('Project submitted successfully!', { id: loadingToast });
        } catch (err) {
            console.error('Submission error:', err);
            toast.error('Failed to submit project. Please try again.', { id: loadingToast });
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
        <div className="h-full flex flex-col bg-white">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                <div>
                    <div className="text-sm font-bold text-blue-600 mb-1">{course.code}</div>
                    <h2 className="text-xl font-bold text-gray-900">{course.name}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white rounded-full transition-colors shadow-sm">
                    <X size={20} className="text-gray-500" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* At a Glance */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="flex items-center gap-2 text-blue-600 mb-1">
                            <User size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Instructor</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{course.instructor}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                        <div className="flex items-center gap-2 text-green-600 mb-1">
                            <Clock size={16} />
                            <span className="text-xs font-bold uppercase tracking-wider">Progress</span>
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{course.progress}% Completed</div>
                    </div>
                </div>

                {/* Description */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                        <BookOpen size={18} className="text-blue-600" />
                        <h3>Course Description</h3>
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed">
                        {course.description}
                    </p>
                </section>

                {/* Syllabus */}
                <section className="space-y-3">
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                        <FileText size={18} className="text-blue-600" />
                        <h3>Syllabus</h3>
                    </div>
                    <div className="space-y-2">
                        {course.syllabus.map((item, index) => (
                            <div key={index} className="flex gap-3 text-sm text-gray-600 p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="font-bold text-blue-600">{index + 1}.</span>
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Assignments */}
                <section className="space-y-3 pb-8">
                    <div className="flex items-center gap-2 text-gray-900 font-bold">
                        <Calendar size={18} className="text-blue-600" />
                        <h3>Upcoming Assignments</h3>
                    </div>
                    <div className="space-y-3">
                        {course.upcomingAssignments.map((assignment) => (
                            <div key={assignment.id} className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 transition-colors bg-white shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-semibold text-gray-900 text-sm">{assignment.title}</h4>
                                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                                        {assignment.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar size={14} />
                                    <span>Due: {assignment.dueDate}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            </div>

            {/* Footer Action */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                {submitted ? (
                    <div className="flex items-center justify-center gap-2 py-3 px-4 bg-green-50 text-green-700 font-bold rounded-xl border border-green-100 animate-fade-in">
                        <CheckCircle2 size={20} />
                        Successfully Submitted
                    </div>
                ) : (
                    <button
                        onClick={handleSubmitProject}
                        disabled={submitting}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Submitting...
                            </>
                        ) : (
                            <>
                                <CheckCircle2 size={20} />
                                Submit Final Project
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CourseDetails;
