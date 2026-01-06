import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { CreditCard, DollarSign, Clock, CheckCircle, AlertCircle, Calendar } from 'lucide-react';

const StudentFinance = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paymentProcessing, setPaymentProcessing] = useState(null);
    const [notification, setNotification] = useState(null);

    // Mock Card Details State (just for visual)
    const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '' });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const res = await api.get('/finance/student/invoices');
            setInvoices(res.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePay = async (invoiceId, amount) => {
        if (!cardDetails.number || !cardDetails.cvc) {
            setNotification({ type: 'error', message: 'Please enter card details (mock)' });
            setTimeout(() => setNotification(null), 3000);
            return;
        }

        setPaymentProcessing(invoiceId);
        try {
            // Mock API call
            await api.post('/finance/student/pay', {
                invoiceId,
                amount,
                method: 'CARD'
            });

            setNotification({ type: 'success', message: 'Payment successful!' });
            fetchInvoices(); // Refresh
            setCardDetails({ number: '', expiry: '', cvc: '' }); // Reset form
        } catch (error) {
            setNotification({ type: 'error', message: error.response?.data?.message || 'Payment failed' });
        } finally {
            setPaymentProcessing(null);
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const totalDue = invoices.reduce((acc, inv) => {
        if (inv.status === 'PENDING' || inv.status === 'PARTIAL') {
            const paid = inv.payments?.reduce((pAcc, p) => pAcc + p.amount, 0) || 0;
            return acc + (inv.amount - paid);
        }
        return acc;
    }, 0);

    if (loading) return <div className="p-8 text-center text-gray-500">Loading finance details...</div>;

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Student Finance</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Manage your tuition and fees</p>

            {notification && (
                <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                    <p>{notification.message}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Outstanding Balance Card */}
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-lg">
                    <p className="text-blue-100 mb-1">Total Outstanding Balance</p>
                    <h2 className="text-4xl font-bold mb-4">${totalDue.toFixed(2)}</h2>
                    <div className="flex items-center gap-2 text-sm text-blue-200">
                        <DollarSign size={16} />
                        <span>Due immediately</span>
                    </div>
                </div>

                {/* Invoices List */}
                <div className="md:col-span-2 space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Active Invoices</h3>

                    {invoices.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <CheckCircle size={48} className="mx-auto text-green-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No Invoices Due</h3>
                            <p className="text-gray-500">You are all caught up!</p>
                        </div>
                    ) : (
                        invoices.map(invoice => {
                            const paidAmount = invoice.payments?.reduce((acc, p) => acc + p.amount, 0) || 0;
                            const remaining = invoice.amount - paidAmount;
                            const isPaid = invoice.status === 'PAID';

                            return (
                                <div key={invoice.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-900 dark:text-white">{invoice.fee?.name || 'Tuition Fee'}</h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">{invoice.fee?.type}</p>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isPaid
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            }`}>
                                            {invoice.status}
                                        </div>
                                    </div>

                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                                        <div className="space-y-1">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                                <Calendar size={14} /> Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                            </p>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                Amount: ${invoice.amount.toFixed(2)}
                                            </p>
                                            {paidAmount > 0 && (
                                                <p className="text-sm text-green-600 dark:text-green-400">
                                                    Paid: ${paidAmount.toFixed(2)}
                                                </p>
                                            )}
                                        </div>

                                        {!isPaid && (
                                            <div className="flex-1 max-w-sm ml-auto">
                                                <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg space-y-3">
                                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Quick Pay (Mock)</p>
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Card Number"
                                                            className="flex-1 px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            value={cardDetails.number}
                                                            onChange={e => setCardDetails({ ...cardDetails, number: e.target.value })}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="123"
                                                            maxLength={3}
                                                            className="w-16 px-3 py-2 text-sm border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                                            value={cardDetails.cvc}
                                                            onChange={e => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                                                        />
                                                    </div>
                                                    <button
                                                        onClick={() => handlePay(invoice.id, remaining)}
                                                        disabled={paymentProcessing === invoice.id}
                                                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2 rounded-md text-sm font-medium flex items-center justify-center gap-2"
                                                    >
                                                        {paymentProcessing === invoice.id ? 'Processing...' : `Pay $${remaining.toFixed(2)}`}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentFinance;
