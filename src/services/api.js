import axios from 'axios';

const api = axios.create({
    baseURL: 'http://127.0.0.1:5001/api',
    withCredentials: true, // Important for sending cookies
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response interceptor for handling 401s (token expiry)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        const isAuthRequest = originalRequest.url.includes('/auth/login') ||
            originalRequest.url.includes('/auth/refresh') ||
            originalRequest.url.includes('/auth/logout');

        if (error.response?.status === 401 && !originalRequest._retry && !isAuthRequest) {
            originalRequest._retry = true;
            try {
                await api.post('/auth/refresh');
                return api(originalRequest);
            } catch (refreshError) {
                // Refresh failed - session probably expired
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        return Promise.reject(error);
    }
);

export default api;
