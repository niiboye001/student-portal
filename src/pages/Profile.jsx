import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import API service
import { User, Mail, Lock, Save, AlertCircle, FileText, Download } from 'lucide-react';
import { z } from 'zod';
import { generateTranscript } from '../utils/pdfGenerator';

// Zod Schema
const profileSchema = z.object({
    fullName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    currentPassword: z.string().min(1, "Current password is required"), // Still required for UI validation flows often
    newPassword: z.string().min(8, "Password must be at least 8 characters").optional().or(z.literal('')),
});

const Profile = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        email: "",
        currentPassword: "",
        newPassword: ""
    });
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(true);

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data } = await api.get('/student/profile');
                setFormData(prev => ({
                    ...prev,
                    fullName: data.fullName,
                    email: data.email
                }));
            } catch (error) {
                console.error("Failed to load profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Clear error when user types
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSuccess(false);

        // Validate
        // Note: For real API specific validation (like checking current password), we handle server errors too
        // But basics are good here
        const result = profileSchema.safeParse(formData);

        if (!result.success) {
            const fieldErrors = {};
            result.error.issues.forEach(issue => {
                fieldErrors[issue.path[0]] = issue.message;
            });
            setErrors(fieldErrors);
            return;
        }

        try {
            await api.put('/student/profile', formData);
            setErrors({});
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (error) {
            console.error("Update failed", error);
            setErrors({ submit: "Failed to update profile. Please check credentials." });
        }
    };

    const handleDownloadTranscript = async () => {
        try {
            const { data } = await api.get('/student/transcript');
            generateTranscript(data);
        } catch (error) {
            console.error("Failed to download transcript", error);
            setErrors({ submit: "Failed to generate transcript. Please try again." });
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading profile...</div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Profile Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage your personal information and account security</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
                <form onSubmit={handleSubmit} className="space-y-6">

                    {/* Personal Info Section */}
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                            <User size={20} className="text-blue-600 dark:text-blue-400" />
                            Personal Information
                        </h2>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.fullName ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            />
                            {errors.fullName && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.fullName}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-3 top-3 text-gray-400" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.email ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.email}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Security Section */}
                    <div className="space-y-4 pt-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                            <Lock size={20} className="text-blue-600 dark:text-blue-400" />
                            Security
                        </h2>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Current Password</label>
                            <input
                                type="password"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                placeholder="Required to make changes"
                                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.currentPassword ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            />
                            {errors.currentPassword && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.currentPassword}
                                </p>
                            )}
                        </div>

                        <div className="grid gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">New Password (Optional)</label>
                            <input
                                type="password"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                placeholder="Leave blank to keep current"
                                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.newPassword ? 'border-red-300 bg-red-50 dark:bg-red-900/20 dark:border-red-800' : 'border-gray-300 dark:border-gray-600'
                                    }`}
                            />
                            {errors.newPassword && (
                                <p className="text-red-500 text-xs flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.newPassword}
                                </p>
                            )}
                        </div>

                        {/* Documents Section */}
                        <div className="space-y-4 pt-4">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-2">
                                <FileText size={20} className="text-blue-600 dark:text-blue-400" />
                                Documents
                            </h2>

                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex items-center justify-between border border-gray-100 dark:border-gray-600">
                                <div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">Academic Transcript</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Download your official academic record</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleDownloadTranscript}
                                    className="flex items-center gap-2 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 text-gray-700 dark:text-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors shadow-sm"
                                >
                                    <Download size={16} />
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex items-center justify-between">
                        {success && (
                            <p className="text-green-600 text-sm font-medium flex items-center gap-2 animate-fade-in">
                                <div className="w-2 h-2 bg-green-500 rounded-full" />
                                Changes saved successfully!
                            </p>
                        )}
                        <button
                            type="submit"
                            className="ml-auto flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm hover:shadow active:scale-95 transform duration-150"
                        >
                            <Save size={18} />
                            Save Changes
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};

export default Profile;
