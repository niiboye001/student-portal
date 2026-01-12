import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateTranscript = (studentData) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // --- Header ---
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text("UNIVERSITY PORTAL", pageWidth / 2, 20, { align: 'center' });

    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text("OFFICIAL ACADEMIC TRANSCRIPT", pageWidth / 2, 30, { align: 'center' });

    // Line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(10, 35, pageWidth - 10, 35);

    // --- Student Info Block ---
    const startY = 50;
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);

    // Left Column
    doc.text(`Name:`, 14, startY);
    doc.text(`Student ID:`, 14, startY + 7);
    doc.text(`Email:`, 14, startY + 14);

    doc.setFont("helvetica", "bold");
    doc.text(studentData.fullName, 40, startY);
    doc.text(studentData.studentId, 40, startY + 7);
    doc.text(studentData.email, 40, startY + 14);

    // Right Column
    doc.setFont("helvetica", "normal");
    doc.text(`Program:`, 120, startY);
    doc.text(`Department:`, 120, startY + 7);
    doc.text(`Date Issued:`, 120, startY + 14);

    doc.setFont("helvetica", "bold");
    doc.text(studentData.program, 150, startY);
    doc.text(studentData.department, 150, startY + 7);
    doc.text(new Date().toLocaleDateString(), 150, startY + 14);

    // --- Academic Table ---
    const tableColumn = ["Course Code", "Course Title", "Semester", "Credits", "Grade", "Points"];
    const tableRows = [];

    studentData.courses.forEach(course => {
        const courseData = [
            course.code,
            course.name,
            course.semester || 'N/A',
            course.credits,
            course.grade,
            course.points.toFixed(1)
        ];
        tableRows.push(courseData);
    });

    autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 80,
        theme: 'striped',
        headStyles: { fillColor: [66, 139, 202] },
        styles: { fontSize: 10, cellPadding: 3 },
    });

    // --- Summary Section ---
    const finalY = doc.lastAutoTable.finalY + 15;

    doc.setDrawColor(0, 0, 0);
    doc.rect(14, finalY, pageWidth - 28, 25);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ACADEMIC SUMMARY", 20, finalY + 8);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Cumulative GPA (CGPA):`, 20, finalY + 18);
    // doc.text(`Total Credits Earned:`, 100, finalY + 18);

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(studentData.cgpa, 70, finalY + 18);

    // --- Footer ---
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("This document is system generated and is valid without a signature.", pageWidth / 2, 280, { align: 'center' });
    doc.text("University Portal System © 2026", pageWidth / 2, 285, { align: 'center' });

    // Save
    doc.save(`${studentData.studentId}_Transcript.pdf`);
};
