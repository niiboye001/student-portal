import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, School, BookOpen } from 'lucide-react';

const AcademicManagement = () => {
    const [departments, setDepartments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showDeptModal, setShowDeptModal] = useState(false);
    const [showProgModal, setShowProgModal] = useState(false);
    const [expandedDepts, setExpandedDepts] = useState({});

    // Form States
    const [deptForm, setDeptForm] = useState({ name: '', code: '' });
    const [progForm, setProgForm] = useState({ name: '', code: '', departmentId: '' });

    const [confirmAction, setConfirmAction] = useState({ isOpen: false, type: null, id: null, title: '', message: '' });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await api.get('/academic/departments');
            setDepartments(res.data);
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    // Unified Create/Update Handlers
    const handleDeptSubmit = async (e) => {
        e.preventDefault();
        try {
            if (deptForm.id) {
                await api.put(`/academic/departments/${deptForm.id}`, deptForm);
            } else {
                await api.post('/academic/departments', deptForm);
            }
            setShowDeptModal(false);
            setDeptForm({ name: '', code: '' });
            fetchDepartments();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving department');
        }
    };

    const handleProgSubmit = async (e) => {
        e.preventDefault();
        try {
            if (progForm.id) {
                await api.put(`/academic/programs/${progForm.id}`, progForm);
            } else {
                await api.post('/academic/programs', progForm);
            }
            setShowProgModal(false);
            setProgForm({ name: '', code: '', departmentId: '' });
            fetchDepartments();
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving program');
        }
    };

    const confirmDelete = (type, id, title, message) => {
        setConfirmAction({ isOpen: true, type, id, title, message });
    };

    const executeDelete = async () => {
        const { type, id } = confirmAction;
        try {
            if (type === 'DEPT') {
                await api.delete(`/academic/departments/${id}`);
            } else if (type === 'PROG') {
                await api.delete(`/academic/programs/${id}`);
            }
            fetchDepartments();
            setConfirmAction({ isOpen: false, type: null, id: null, title: '', message: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Error performing deletion');
        }
    };

    const toggleDept = (id) => {
        setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const openEditDept = (e, dept) => {
        e.stopPropagation();
        setDeptForm({ id: dept.id, name: dept.name, code: dept.code });
        setShowDeptModal(true);
    };

    const openEditProg = (prog, deptId) => {
        setProgForm({ id: prog.id, name: prog.name, code: prog.code, departmentId: deptId });
        setShowProgModal(true);
    };

    if (loading) return <div className="p-8 text-center">Loading academic structure...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Academic Structure</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage departments and programs</p>
                </div>
                <button
                    onClick={() => {
                        setDeptForm({ name: '', code: '' });
                        setShowDeptModal(true);
                    }}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                    <Plus size={20} />
                    New Department
                </button>
            </div>

            <div className="space-y-4">
                {departments.map((dept) => (
                    <div key={dept.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <div
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            onClick={() => toggleDept(dept.id)}
                        >
                            <div className="flex items-center gap-4">
                                {expandedDepts[dept.id] ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                    <School size={20} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{dept.code} • {dept.programs?.length || 0} Programs • {dept._count?.courses || 0} Courses</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => executeDelete ? openEditDept(e, dept) : null /* Just to silence lint if any, actually I'll use openEditDept directly */}
                                    className="p-2 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg text-yellow-600 dark:text-yellow-400"
                                    onClickCapture={(e) => openEditDept(e, dept)}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setProgForm({ name: '', code: '', departmentId: dept.id });
                                        setShowProgModal(true);
                                    }}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-green-600 dark:text-green-400 flex items-center gap-1 text-sm font-medium"
                                >
                                    <Plus size={16} /> Add Program
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        confirmDelete('DEPT', dept.id, 'Delete Department?', `Are you sure you want to delete "${dept.name}"? This will delete ALL associated programs and courses.`);
                                    }}
                                    className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-red-600 dark:text-red-400"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>

                        {expandedDepts[dept.id] && (
                            <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/30 p-4">
                                {dept.programs && dept.programs.length > 0 ? (
                                    <div className="grid gap-3 pl-12">
                                        {dept.programs.map(prog => (
                                            <div key={prog.id} className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                                                <div className="flex items-center gap-3">
                                                    <BookOpen size={16} className="text-purple-500" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 dark:text-white">{prog.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {prog.code} • {prog._count?.students || 0} Students • {prog._count?.courses || 0} Courses
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <button
                                                        onClick={() => openEditProg(prog, dept.id)}
                                                        className="text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 p-1 mr-2"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => confirmDelete('PROG', prog.id, 'Delete Program?', `Are you sure you want to delete "${prog.name}"?`)}
                                                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500 italic pl-12">No programs added yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                ))}

                {departments.length === 0 && (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <School size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Departments Yet</h3>
                        <p className="text-gray-500 mb-4">Create your first department to get started.</p>
                        <button
                            onClick={() => {
                                setDeptForm({ name: '', code: '' });
                                setShowDeptModal(true);
                            }}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                        >
                            Create Department
                        </button>
                    </div>
                )}
            </div>

            {/* Confirmation Alert Modal (re-used) */}
            {confirmAction.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 dark:text-red-400">
                                <Trash2 size={32} />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{confirmAction.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 leading-relaxed">
                                {confirmAction.message}
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmAction({ ...confirmAction, isOpen: false })}
                                className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-xl font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={executeDelete}
                                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors shadow-lg shadow-red-600/20"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Department Modal */}
            {showDeptModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">{deptForm.id ? 'Edit Department' : 'New Department'}</h2>
                        <form onSubmit={handleDeptSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={deptForm.name}
                                        onChange={e => setDeptForm({ ...deptForm, name: e.target.value })}
                                        placeholder="e.g. Computer Science"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={deptForm.code}
                                        onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. CS"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeptModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    {deptForm.id ? 'Save Changes' : 'Create Department'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Program Modal */}
            {showProgModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">{progForm.id ? 'Edit Program' : 'New Program'}</h2>
                        <form onSubmit={handleProgSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Program Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={progForm.name}
                                        onChange={e => setProgForm({ ...progForm, name: e.target.value })}
                                        placeholder="e.g. B.Sc. Computer Science"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Code</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={progForm.code}
                                        onChange={e => setProgForm({ ...progForm, code: e.target.value.toUpperCase() })}
                                        placeholder="e.g. BSCS"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowProgModal(false)}
                                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    {progForm.id ? 'Save Changes' : 'Create Program'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcademicManagement;
