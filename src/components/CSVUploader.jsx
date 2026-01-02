import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Check, AlertCircle, Loader } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const CSVUploader = ({ isOpen, onClose, title, endpoint, templateHeaders, onSuccess }) => {
    const [file, setFile] = useState(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const fileInputRef = useRef(null);

    if (!isOpen) return null;

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (file) => {
        if (file && (file.type === 'text/csv' || file.name.endsWith('.csv'))) {
            setFile(file);
            setResult(null);
        } else {
            toast.error('Please upload a valid CSV file');
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const { data } = await api.post(endpoint, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            setResult(data);
            toast.success('Import processed!');
            if (onSuccess) onSuccess();
        } catch (error) {
            console.error('Upload failed', error);
            const msg = error.response?.data?.message || 'Upload failed';
            toast.error(msg);
            setResult({ error: msg });
        } finally {
            setUploading(false);
        }
    };

    const reset = () => {
        setFile(null);
        setResult(null);
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-fade-in">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Import {title}</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {!result ? (
                        <>
                            <div
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => fileInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${dragging
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500'
                                    }`}
                            >
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                />

                                {file ? (
                                    <div className="flex flex-col items-center text-blue-600 dark:text-blue-400">
                                        <FileText size={48} className="mb-2" />
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center text-gray-500 dark:text-gray-400">
                                        <Upload size={48} className="mb-2" />
                                        <p className="font-medium">Drag & Drop CSV here</p>
                                        <p className="text-sm mt-1">or click to browse</p>
                                    </div>
                                )}
                            </div>

                            {templateHeaders && (
                                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                                    <p className="font-semibold text-gray-700 dark:text-gray-300 mb-1">Required Columns:</p>
                                    <code className="text-blue-600 dark:text-blue-400 font-mono break-all">
                                        {templateHeaders}
                                    </code>
                                </div>
                            )}

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleUpload}
                                    disabled={!file || uploading}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {uploading ? (
                                        <>
                                            <Loader size={18} className="animate-spin" />
                                            Importing...
                                        </>
                                    ) : (
                                        'Import CSV'
                                    )}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            {/* Result View */}
                            {result.error ? (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-start gap-3">
                                    <AlertCircle className="mt-0.5 shrink-0" />
                                    <div>
                                        <p className="font-bold">Import Failed</p>
                                        <p className="text-sm">{result.error}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-center gap-3">
                                        <Check className="shrink-0" />
                                        <div>
                                            <p className="font-bold">Import Complete</p>
                                            <p className="text-sm">
                                                Added: {result.summary?.success}, Failed: {result.summary?.fail}
                                            </p>
                                        </div>
                                    </div>

                                    {result.summary?.errors?.length > 0 && (
                                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 font-medium text-sm border-b border-gray-200 dark:border-gray-700">
                                                Errors Details ({result.summary.errors.length})
                                            </div>
                                            <div className="max-h-40 overflow-y-auto p-2 space-y-2">
                                                {result.summary.errors.map((err, i) => (
                                                    <div key={i} className="text-xs text-red-600 dark:text-red-400 flex gap-2">
                                                        <span className="font-mono bg-red-50 dark:bg-red-900/30 px-1 rounded">{Object.values(err)[0]}</span>
                                                        <span>{err.message}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={reset}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-lg"
                                >
                                    Import Another
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CSVUploader;
