import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { MessageSquare, Send, User, Reply, Trash2, Clock, Image as ImageIcon, X } from 'lucide-react';

const CourseDiscussion = ({ courseId }) => {
    const [discussions, setDiscussions] = useState([]);
    const [newPost, setNewPost] = useState("");
    const [selectedImage, setSelectedImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [replyContent, setReplyContent] = useState({}); // Map of parentId -> content
    const [activeReplyId, setActiveReplyId] = useState(null); // Which post is being replied to
    const [loading, setLoading] = useState(true);
    const fileInputRef = useRef(null);

    const fetchDiscussions = async () => {
        try {
            const { data } = await api.get(`/courses/${courseId}/discussions`);
            setDiscussions(data);
        } catch (error) {
            console.error("Failed to fetch discussions", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDiscussions();
        // Optional: Polling or WebSocket could be added here
    }, [courseId]);

    const handleImageSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedImage(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePaste = (e) => {
        if (e.clipboardData && e.clipboardData.items) {
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    setSelectedImage(file);
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreview(reader.result);
                    };
                    reader.readAsDataURL(file);
                    e.preventDefault(); // Prevent default paste if it's an image
                    break;
                }
            }
        }
    };

    const removeImage = () => {
        setSelectedImage(null);
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handlePostSubmit = async (e) => {
        e.preventDefault();
        if (!newPost.trim() && !selectedImage) return;

        try {
            const formData = new FormData();
            if (newPost.trim()) formData.append('content', newPost);
            if (selectedImage) formData.append('image', selectedImage);

            await api.post(`/courses/${courseId}/discussions`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewPost("");
            removeImage();
            fetchDiscussions(); // Refresh
        } catch (error) {
            console.error("Failed to post message", error);
        }
    };

    const handleReplySubmit = async (parentId) => {
        const content = replyContent[parentId];
        if (!content?.trim()) return;

        try {
            await api.post(`/courses/${courseId}/discussions`, {
                content,
                parentId
            });
            setReplyContent(prev => ({ ...prev, [parentId]: "" }));
            setActiveReplyId(null);
            fetchDiscussions();
        } catch (error) {
            console.error("Failed to post reply", error);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading discussion...</div>;

    return (
        <div className="space-y-6">
            {/* New Post Input */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2 text-gray-900 dark:text-white">
                    <MessageSquare size={20} className="text-blue-600" />
                    Class Discussion
                </h3>
                {imagePreview && (
                    <div className="relative mb-3 inline-block">
                        <img src={imagePreview} alt="Preview" className="h-32 w-auto rounded-lg border border-gray-200" />
                        <button
                            onClick={removeImage}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                        >
                            <X size={14} />
                        </button>
                    </div>
                )}
                <form onSubmit={handlePostSubmit} className="flex gap-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                        title="Upload image"
                    >
                        <ImageIcon size={20} />
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                    />
                    <input
                        type="text"
                        value={newPost}
                        onChange={(e) => setNewPost(e.target.value)}
                        onPaste={handlePaste}
                        placeholder="Start a new topic..."
                        className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                    />
                    <button
                        type="submit"
                        disabled={!newPost.trim() && !selectedImage}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Send size={18} />
                        Post
                    </button>
                </form>
            </div>

            {/* Discussion List */}
            <div className="space-y-4">
                {discussions.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                        No conversations yet. Be the first to start one!
                    </div>
                ) : (
                    discussions.map(post => (
                        <div key={post.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                            {/* Post Header */}
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold">
                                        {post.user.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900 dark:text-white">{post.user.name}</h4>
                                        <span className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full">
                                            {post.user.role}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatDate(post.createdAt)}
                                </div>
                            </div>

                            {/* Post Content */}
                            <div className="ml-13 mb-4 pl-13">
                                {post.attachmentUrl && (
                                    <div className="mb-2">
                                        <img
                                            src={post.attachmentUrl}
                                            alt="Attachment"
                                            className="max-h-60 rounded-lg border border-gray-200 cursor-pointer hover:opacity-95"
                                            onClick={() => window.open(post.attachmentUrl, '_blank')}
                                        />
                                    </div>
                                )}
                                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                    {post.content}
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-4 ml-13">
                                <button
                                    onClick={() => setActiveReplyId(activeReplyId === post.id ? null : post.id)}
                                    className="text-sm text-gray-500 hover:text-blue-600 flex items-center gap-1 transition-colors"
                                >
                                    <Reply size={16} />
                                    Reply
                                </button>
                            </div>

                            {/* Replies */}
                            {post.replies && post.replies.length > 0 && (
                                <div className="mt-4 ml-8 space-y-3 border-l-2 border-gray-100 dark:border-gray-700 pl-4">
                                    {post.replies.map(reply => (
                                        <div key={reply.id} className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                                                    {reply.user.name} <span className="text-xs font-normal text-gray-500">· {formatDate(reply.createdAt)}</span>
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{reply.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Reply Input */}
                            {activeReplyId === post.id && (
                                <div className="mt-4 ml-8 flex gap-2 animate-fade-in">
                                    <input
                                        type="text"
                                        value={replyContent[post.id] || ""}
                                        onChange={(e) => setReplyContent(prev => ({ ...prev, [post.id]: e.target.value }))}
                                        placeholder="Write a reply..."
                                        className="flex-1 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-900 dark:text-white"
                                        onKeyDown={(e) => e.key === 'Enter' && handleReplySubmit(post.id)}
                                    />
                                    <button
                                        onClick={() => handleReplySubmit(post.id)}
                                        className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <Send size={16} />
                                    </button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default CourseDiscussion;
