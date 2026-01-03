import React, { useEffect, useState, useRef } from 'react';
import api from '../../services/api';
import { User, Search, MoreVertical, Plus, Briefcase, Mail, FileUp, Edit, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import ConfirmationModal from '../../components/ConfirmationModal';
import CSVUploader from '../../components/CSVUploader';

const StaffManagement = () => {
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [staffToDelete, setStaffToDelete] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        fetchStaff();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpenMenuId(null);
            }
        };

        if (openMenuId) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [openMenuId]);

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/admin/staff');
            setStaff(data);
        } catch (error) {
            console.error('Failed to fetch staff', error);
            toast.error('Failed to load staff');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdateStaff = async (formData) => {
        try {
            if (selectedStaff) {
                await api.put(`/admin/staff/${selectedStaff.id}`, formData);
                toast.success('Staff member updated successfully');
            } else {
                const { data } = await api.post('/admin/staff', formData);
                toast.success('Staff member created! Credentials sent to email.', { duration: 4000 });
            }
            setIsModalOpen(false);
            fetchStaff();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Operation failed');
        }
    };

    const confirmDelete = async () => {
        if (!staffToDelete) return;

        try {
            await api.delete(`/admin/staff/${staffToDelete.id}`);
            toast.success('Staff member deleted');
            fetchStaff();
            setDeleteModalOpen(false);
        } catch (error) {
            toast.error('Failed to delete staff member');
        }
    };

    const handleDeleteClick = (member) => {
        setStaffToDelete(member);
        setDeleteModalOpen(true);
        setOpenMenuId(null);
    };

    const openEditModal = (staffMember) => {
        setSelectedStaff(staffMember);
        setIsModalOpen(true);
        setOpenMenuId(null);
    };

    const [resetModalOpen, setResetModalOpen] = useState(false);
    const [staffToReset, setStaffToReset] = useState(null);

    const handleResetPassword = (member) => {
        setStaffToReset(member);
        setResetModalOpen(true);
        setOpenMenuId(null);
    };

    const confirmResetPassword = async () => {
        if (!staffToReset) return;

        const loadingToast = toast.loading('Resetting password...');
        try {
            const { data } = await api.post(`/admin/users/${staffToReset.id}/reset-password`);
            toast.success('Password reset successfully! New credentials sent to email.', { id: loadingToast, duration: 4000 });
            setResetModalOpen(false);
            setStaffToReset(null);
        } catch (error) {
            console.error('Reset password error:', error);
            toast.error(error.response?.data?.message || 'Failed to reset password', { id: loadingToast });
        }
    };

    const openCreateModal = () => {
        setSelectedStaff(null);
        setIsModalOpen(true);
    };

    // Modal Wrapper defined inside to access props
    const StaffModalWrapper = ({ isOpen, onClose, staffToEdit }) => {
        const [formData, setFormData] = useState({ name: '', email: '' });
        const [loading, setLoading] = useState(false);

        useEffect(() => {
            if (staffToEdit) {
                setFormData({ name: staffToEdit.name, email: staffToEdit.email });
            } else {
                setFormData({ name: '', email: '' });
            }
        }, [staffToEdit, isOpen]);

        const handleSubmit = async (e) => {
            e.preventDefault();
            setLoading(true);
            await handleCreateOrUpdateStaff(formData);
            setLoading(false);
        };

        if (!isOpen) return null;

        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                    <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{staffToEdit ? 'Edit Staff' : 'Add New Staff'}</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">×</button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <input
                                type="text"
                                required
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <input
                                type="email"
                                required
                                className="w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="pt-4 flex gap-3">
                            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">Cancel</button>
                            <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                {loading ? 'Saving...' : (staffToEdit ? 'Save Changes' : 'Create Staff')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    const filteredStaff = staff.filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading staff directory...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage tutors and faculty members.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setIsImportModalOpen(true)}
                        className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2">
                        <FileUp size={18} />
                        Import CSV
                    </button>
                    <button
                        onClick={openCreateModal}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2">
                        <Plus size={18} />
                        Add Staff Member
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                                <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredStaff.length > 0 ? (
                                filteredStaff.map((member, index) => (
                                    <tr key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold shrink-0">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">{member.name}</div>
                                                    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                        <Mail size={12} /> {member.email}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                                <Briefcase size={12} className="mr-1" />
                                                TUTOR
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(member.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-right relative">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (openMenuId === member.id) {
                                                        setOpenMenuId(null);
                                                    } else {
                                                        const rect = e.currentTarget.getBoundingClientRect();
                                                        // Calculate best position
                                                        const spaceBelow = window.innerHeight - rect.bottom;
                                                        const menuHeight = 100; // estimated
                                                        const isUpwards = spaceBelow < menuHeight;

                                                        setDropdownPos({
                                                            top: isUpwards ? rect.top - 80 : rect.bottom + 5, // 80 approx height
                                                            left: rect.right - 192, // 192px = w-48
                                                        });
                                                        setOpenMenuId(member.id);
                                                    }
                                                }}
                                                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                            >
                                                <MoreVertical size={18} />
                                            </button>

                                            {openMenuId === member.id && (
                                                <div
                                                    ref={menuRef}
                                                    className="fixed z-50 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-100 dark:border-gray-700 py-1 text-left animate-in fade-in zoom-in-95 duration-100"
                                                    style={{
                                                        top: dropdownPos.top,
                                                        left: dropdownPos.left,
                                                    }}
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => openEditModal(member)}
                                                        className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
                                                    >
                                                        <Edit size={16} />
                                                        Edit Staff
                                                    </button>
                                                    <button
                                                        onClick={() => handleResetPassword(member)}
                                                        className="w-full text-left px-4 py-2 text-sm text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 flex items-center gap-2"
                                                    >
                                                        <span className="font-bold">Key</span>
                                                        Reset Password
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(member)}
                                                        className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={16} />
                                                        Remove Staff
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500">
                                        No staff members found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <StaffModalWrapper
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                staffToEdit={selectedStaff}
            />

            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Delete Staff Member"
                message={`Are you sure you want to delete ${staffToDelete?.name}? This action cannot be undone.`}
                confirmText="Delete Staff"
                isDanger={true}
            />

            <ConfirmationModal
                isOpen={!!resetModalOpen}
                onClose={() => setResetModalOpen(false)}
                onConfirm={confirmResetPassword}
                title="Reset Password"
                message={`Are you sure you want to reset the password for ${staffToReset?.name}? It will be set to 'Password123!' and emailed to them.`}
                confirmText="Reset Password"
                isDanger={false}
            />

            <CSVUploader
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
                title="Staff"
                endpoint="/admin/import/staff"
                templateHeaders="name, email"
                onSuccess={fetchStaff}
            />
        </div>
    );
};

export default StaffManagement;
