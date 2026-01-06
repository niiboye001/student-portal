import React, { useEffect, useState } from 'react';
import api from '../services/api';
import { Search, Filter, Download, MoreVertical, BookOpen, ChevronRight, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useNavigate } from 'react-router-dom';

const Courses = () => {
    const { user: profile } = useAuth();
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const response = await api.get('/student/courses');
                setCourses(response.data);
            } catch (error) {
                console.error('Error fetching courses', error);
            } finally {
                setLoading(false);
            }
        };
        fetchCourses();
    }, []);

    const handleDownloadTranscript = () => {
        try {
            const doc = new jsPDF();

            // Header
            doc.setFontSize(22);
            doc.text('OFFICIAL TRANSCRIPT', 105, 20, { align: 'center' });

            // Student Info - handle nested user object in profile
            const studentName = profile?.user?.name || profile?.fullName || 'Sharp Brain';
            const studentEmail = profile?.user?.email || profile?.email || 'sharp.brain@gmail.com';

            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Student Name:', 14, 40);
            doc.setFont('helvetica', 'normal');
            doc.text(studentName, 50, 40);

            doc.setFont('helvetica', 'bold');
            doc.text('Student Email:', 14, 48);
            doc.setFont('helvetica', 'normal');
            doc.text(studentEmail, 50, 48);

            doc.setFont('helvetica', 'bold');
            doc.text('Date of Issue:', 14, 56);
            doc.setFont('helvetica', 'normal');
            doc.text(new Date().toLocaleDateString(), 50, 56);

            // Line separator
            doc.setLineWidth(0.5);
            doc.line(14, 65, 196, 65);

            // Group courses by Level and Semester
            const groupedCourses = {};
            courses.forEach(course => {
                const key = `Level ${course.level || 100} - Semester ${course.semester || 1}`;
                if (!groupedCourses[key]) {
                    groupedCourses[key] = [];
                }
                groupedCourses[key].push([
                    course.name,
                    course.code,
                    `${course.progress}%`,
                    course.grade || 'N/A'
                ]);
            });

            // Sort keys to ensure order (100-1, 100-2, 200-1, etc.)
            const sortedKeys = Object.keys(groupedCourses).sort();

            let currentY = 75;

            sortedKeys.forEach(group => {
                // Add Group Header
                if (currentY > 270) {
                    doc.addPage();
                    currentY = 20;
                }

                doc.setFontSize(14);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(37, 99, 235); // Blue
                doc.text(group, 14, currentY);

                // Add Table for this group
                autoTable(doc, {
                    startY: currentY + 5,
                    head: [["Course Name", "Code", "Progress", "Grade"]],
                    body: groupedCourses[group],
                    theme: 'grid',
                    headStyles: { fillColor: [240, 240, 240], textColor: 80, fontStyle: 'bold' }, // Light gray header
                    styles: { fontSize: 10, cellPadding: 5 },
                    margin: { left: 14, right: 14 }
                });

                currentY = (doc).lastAutoTable.finalY + 15;
            });

            // Footer
            const finalY = (doc).lastAutoTable.finalY + 20;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.text('This is an electronically generated official transcript.', 105, finalY, { align: 'center' });

            // Download PDF
            // Download PDF
            doc.save(`${studentName.replace(/\s+/g, '_')}_Transcript.pdf`);
        } catch (error) {
            console.error('Failed to generate PDF:', error);
            alert('Could not generate transcript. Please try again.');
        }
    };

    const getGradeColor = (grade) => {
        if (!grade) return 'text-gray-600 bg-gray-50 border-gray-200';
        if (grade.startsWith('A')) return 'text-green-600 bg-green-50 border-green-200';
        if (grade.startsWith('B')) return 'text-blue-600 bg-blue-50 border-blue-200';
        if (grade.startsWith('C')) return 'text-orange-600 bg-orange-50 border-orange-200';
        return 'text-red-600 bg-red-50 border-red-200';
    };

    const handleViewDetails = (courseId) => {
        navigate(`/courses/${courseId}`);
    };

    if (loading) return (
        <div className="flex items-center justify-center p-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <div className="space-y-6 relative overflow-x-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Courses</h1>
                    <p className="text-gray-500 dark:text-gray-400">View your current enrollment and grades</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <Filter size={18} />
                        <span className="hidden xs:inline">Filter</span>
                    </button>
                    <button
                        onClick={handleDownloadTranscript}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                    >
                        <Download size={18} />
                        <span>Transcript</span>
                    </button>
                </div>
            </div>

            {/* Desktop Table View (Hidden on Mobile) */}
            <div className="hidden lg:block bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Course Name</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Code</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Progress</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Grade</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {courses.map((course) => (
                                <tr key={course.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-gray-900 dark:text-white">{course.name}</div>
                                        <div className="text-sm text-gray-500 dark:text-gray-400">{course.instructor || 'Staff'}</div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-xs font-bold font-mono">
                                            {course.code}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 w-1/4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                                    style={{ width: `${course.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{course.progress}%</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getGradeColor(course.grade)}`}>
                                            {course.grade}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button
                                            onClick={() => handleViewDetails(course.id)}
                                            className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center gap-1 group"
                                        >
                                            View Details
                                            <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Mobile/Tablet Card View (Shown on Mobile/Tablet) */}
            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((course) => (
                    <div
                        key={course.id}
                        className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600"></div>
                        <div className="flex justify-between items-start mb-4 pl-2">
                            <div>
                                <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">{course.code}</div>
                                <h3 className="font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">{course.name}</h3>
                            </div>
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${getGradeColor(course.grade)}`}>
                                {course.grade}
                            </span>
                        </div>

                        <div className="space-y-4 pl-2">
                            <div>
                                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium">
                                    <span>Course Progress</span>
                                    <span>{course.progress}%</span>
                                </div>
                                <div className="h-2 bg-gray-50 dark:bg-gray-700/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600 rounded-full"
                                        style={{ width: `${course.progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <button
                                onClick={() => handleViewDetails(course.id)}
                                className="w-full py-2.5 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                            >
                                <BookOpen size={14} />
                                View Details
                            </button>
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default Courses;
