import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, ArrowRight, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import api from '../services/api';

const resetSchema = z.object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const ResetPassword = () => {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('idle'); // idle, loading, success, error

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        if (!token) {
            setStatus('error');
            setErrors({ general: 'Invalid or missing reset token.' });
            return;
        }

        const result = resetSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach(issue => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setStatus('loading');
        try {
            await api.post('/auth/reset-password', {
                token,
                newPassword: formData.password
            });
            setStatus('success');
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setStatus('error');
            setErrors({ general: err.response?.data?.message || 'Failed to reset password. Link may be expired.' });
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
                    <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Invalid Link</h2>
                    <p className="text-gray-500 mb-6">The password reset link is invalid or missing.</p>
                    <Link to="/login" className="text-blue-600 hover:underline font-medium">Back to Login</Link>
                </div>
            </div>
        );
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 text-center animate-fade-in">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                    <p className="text-gray-500 mb-8">
                        Your password has been successfully updated. Redirecting to login...
                    </p>
                    <Link
                        to="/login"
                        className="inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                        Login Now
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                <div className="bg-blue-600 p-8 text-center">
                    <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
                    <p className="text-blue-100">Create a new secure password</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errors.general && (
                            <div className="p-4 bg-red-50 border border-red-100 rounded-lg flex items-center gap-3 text-red-600 text-sm">
                                <AlertCircle size={18} />
                                {errors.general}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">New Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Min. 8 characters"
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-all ${errors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
                                />
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    placeholder="Repeat new password"
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border outline-none transition-all ${errors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'}`}
                                />
                            </div>
                            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={status === 'loading'}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {status === 'loading' ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Updating...
                                </>
                            ) : (
                                <>
                                    Reset Password
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
