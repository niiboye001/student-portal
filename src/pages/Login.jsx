import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { z } from 'zod';
import { Lock, User, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

const loginSchema = z.object({
    userId: z.string().min(1, 'User ID is required'),
    password: z.string().min(1, 'Password is required')
});

const Login = () => {
    const [formData, setFormData] = useState({ userId: '', password: '' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [authError, setAuthError] = useState('');

    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || "/";

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
        if (authError) setAuthError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setAuthError('');

        // Zod Validation
        const result = loginSchema.safeParse(formData);
        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach(issue => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        setIsLoading(true);
        try {
            const result = await login(formData.userId, formData.password);
            if (result.success) {
                const destination = location.state?.from?.pathname
                    ? location.state.from.pathname
                    : (result.user.role === 'ADMIN' ? '/admin'
                        : (['STAFF', 'TUTOR'].includes(result.user.role) ? '/staff' : '/'));

                navigate(destination, { replace: true });
            } else {
                setAuthError(result.message);
            }
        } catch (err) {
            setAuthError('An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">

                {/* Header */}
                <div className="bg-blue-600 dark:bg-blue-700 p-8 text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Student Portal</h1>
                    <p className="text-blue-100">Sign in to access your dashboard</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {authError && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg flex items-center gap-3 text-red-600 dark:text-red-400 text-sm">
                                <AlertCircle size={18} />
                                {authError}
                            </div>
                        )}

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">User ID</label>
                            <div className="relative">
                                <User className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                                <input
                                    type="text"
                                    name="userId"
                                    value={formData.userId}
                                    onChange={handleChange}
                                    placeholder="e.g. STND-12345"
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${errors.userId ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                />
                            </div>
                            {errors.userId && <p className="text-red-500 text-xs mt-1">{errors.userId}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 text-gray-400 dark:text-gray-500" size={20} />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    placeholder="Enter your password"
                                    className={`w-full pl-10 pr-4 py-2.5 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 ${errors.password ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                />
                            </div>
                            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="animate-spin" size={20} />
                                    Signing In...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Forgot your password? <Link to="/forgot-password" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">Reset here</Link>
                        </p>
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 text-xs text-center text-gray-400 dark:text-gray-500 space-y-1">
                            <div>Admin: admin@university.edu / password123</div>
                            <div>Student: sharp.brain@gmail.com / password123</div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default Login;
