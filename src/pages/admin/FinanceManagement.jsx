import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { DollarSign, Plus, Search, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const FinanceManagement = () => {
    const [activeTab, setActiveTab] = useState('fees');
    const [fees, setFees] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Fee Form State
    const [isFeeModalOpen, setIsFeeModalOpen] = useState(false);
    const [feeForm, setFeeForm] = useState({ name: '', amount: '', type: 'TUITION', description: '' });

    const [students, setStudents] = useState([]);
    const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
    const [invoiceForm, setInvoiceForm] = useState({ studentId: '', feeId: '', dueDate: '' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [feesRes, invoicesRes, studentsRes] = await Promise.all([
                api.get('/finance/fees'),
                api.get('/finance/invoices'),
                api.get('/admin/students')
            ]);
            setFees(feesRes.data);
            setInvoices(invoicesRes.data);
            setStudents(studentsRes.data);
        } catch (error) {
            console.error('Failed to fetch finance data', error);
            toast.error('Failed to load finance data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreateFee = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/fees', {
                ...feeForm,
                amount: parseFloat(feeForm.amount)
            });
            toast.success('Fee structure created');
            setIsFeeModalOpen(false);
            setFeeForm({ name: '', amount: '', type: 'TUITION', description: '' });
            fetchData();
        } catch (error) {
            toast.error('Failed to create fee');
        }
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        try {
            await api.post('/finance/invoices', invoiceForm);
            toast.success('Invoice assigned successfully');
            setInvoiceModalOpen(false);
            setInvoiceForm({ studentId: '', feeId: '', dueDate: '' });
            fetchData();
        } catch (error) {
            console.error(error);
            toast.error('Failed to assign invoice');
        }
    };

    const filteredInvoices = invoices.filter(inv =>
        inv.student?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.student?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.status?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center text-gray-500">Loading finance data...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Finance Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage fees and track student invoices.</p>
                </div>
                {activeTab === 'fees' && (
                    <button
                        onClick={() => setIsFeeModalOpen(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Add New Fee
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('fees')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'fees'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    Fee Structure
                </button>
                <button
                    onClick={() => setActiveTab('invoices')}
                    className={`px-6 py-3 font-medium text-sm transition-colors border-b-2 ${activeTab === 'invoices'
                        ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                >
                    Student Invoices
                </button>
            </div>

            {/* Content */}
            {activeTab === 'fees' ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Fee Name</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Type</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                                <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {fees.map(fee => (
                                <tr key={fee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{fee.name}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                            {fee.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-white">${fee.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{fee.description || '-'}</td>
                                </tr>
                            ))}
                            {fees.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No fees defined yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="flex justify-between items-center gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by student, email, or status (e.g. Paid)..."
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={() => setInvoiceModalOpen(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center gap-2 whitespace-nowrap"
                        >
                            <FileText size={18} />
                            Invoice Student
                        </button>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Student</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Fee Detail</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                    <th className="px-6 py-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Due Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredInvoices.map(inv => (
                                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="font-medium text-gray-900 dark:text-white">{inv.student?.name || 'Unknown'}</div>
                                                <div className="text-xs text-gray-500">{inv.student?.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{inv.fee?.name || 'Custom Fee'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">${inv.amount.toLocaleString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-xs font-medium ${inv.status === 'PAID'
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : inv.status === 'PARTIAL'
                                                    ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                }`}>
                                                {inv.status === 'PAID' ? <CheckCircle size={12} /> : inv.status === 'PENDING' ? <AlertCircle size={12} /> : <Clock size={12} />}
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(inv.dueDate).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                                {filteredInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-8 text-center text-gray-500">No invoices found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Create Fee Modal */}
            {isFeeModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Fee</h2>
                        <form onSubmit={handleCreateFee} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Name</label>
                                <input
                                    type="text"
                                    required
                                    value={feeForm.name}
                                    onChange={e => setFeeForm({ ...feeForm, name: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="e.g. Fall Tuition 2025"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                                <select
                                    value={feeForm.type}
                                    onChange={e => setFeeForm({ ...feeForm, type: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="TUITION">Tuition</option>
                                    <option value="EXAM">Exam Fee</option>
                                    <option value="LIBRARY">Library</option>
                                    <option value="OTHER">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Amount ($)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    value={feeForm.amount}
                                    onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                                <textarea
                                    value={feeForm.description}
                                    onChange={e => setFeeForm({ ...feeForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                    rows="3"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsFeeModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Create Fee
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Invoice Student Modal */}
            {invoiceModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Invoice Student</h2>
                        <form onSubmit={handleCreateInvoice} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Student</label>
                                <select
                                    required
                                    value={invoiceForm.studentId}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, studentId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">-- Choose Student --</option>
                                    {students.map(std => (
                                        <option key={std.id} value={std.id}>{std.name} ({std.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Fee</label>
                                <select
                                    required
                                    value={invoiceForm.feeId}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, feeId: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                >
                                    <option value="">-- Choose Fee Type --</option>
                                    {fees.map(f => (
                                        <option key={f.id} value={f.id}>{f.name} - ${f.amount}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
                                <input
                                    type="date"
                                    required
                                    value={invoiceForm.dueDate}
                                    onChange={e => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setInvoiceModalOpen(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-400 dark:hover:bg-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Assign Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceManagement;
