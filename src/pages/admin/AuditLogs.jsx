import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Shield, Filter, Search, Clock, User, AlertCircle, Printer } from 'lucide-react';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ userId: '', action: '' });
    const [page, setPage] = useState(0);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams({
                limit: 50,
                offset: page * 50
            });
            if (filters.action) params.append('action', filters.action);
            if (filters.status) params.append('status', filters.status);

            const { data } = await api.get(`/admin/audit?${params}`);
            setLogs(data.logs);
        } catch (error) {
            console.error('Failed to fetch audit logs', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [page, filters]);

    const handleFilterChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
        setPage(0);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Shield className="text-blue-600" />
                        System Audit Logs
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Track all sensitive actions performed within the system.</p>
                </div>
                <button
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors print:hidden"
                >
                    <Printer size={18} />
                    Print
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 print:hidden">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    <input
                        type="text"
                        name="action"
                        placeholder="Filter by Action (e.g., LOGIN, DELETE_STUDENT)"
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.action}
                        onChange={handleFilterChange}
                    />
                </div>
                <div className="w-48">
                    <select
                        name="status"
                        className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                        value={filters.status || ''}
                        onChange={handleFilterChange}
                    >
                        <option value="">All Statuses</option>
                        <option value="SUCCESS">Success</option>
                        <option value="FAILURE">Failure</option>
                        <option value="WARNING">Warning</option>
                    </select>
                </div>
            </div>

            {/* Logs Table */}
            <div id="printable-area" className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Timestamp</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">User</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Action</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Status</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">Details</th>
                                <th className="px-4 py-3 font-semibold text-gray-900 dark:text-white">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center gap-2">
                                                <Clock size={14} className="text-gray-400" />
                                                {new Date(log.createdAt).toLocaleString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-300">
                                                    {log.user?.name?.[0] || '?'}
                                                </div>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {log.user?.email || log.userId}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${log.action.includes('DELETE') ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                log.action.includes('CREATE') ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold ${log.status === 'SUCCESS' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                                log.status === 'FAILURE' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                                    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {log.status || 'SUCCESS'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 font-mono">
                                            {log.details ? JSON.stringify(JSON.parse(log.details), null, 1).replace(/{|}|"/g, '') : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                                            {log.ipAddress || 'Unknown'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="p-8 text-center text-gray-500 dark:text-gray-400">
                                        {loading ? 'Loading logs...' : 'No audit logs found matching criteria.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogs;
