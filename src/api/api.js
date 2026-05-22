import axios from 'axios';

const api = axios.create({
  baseURL: 'https://subhams-vpk.onrender.com/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post('https://subhams-vpk.onrender.com/api/auth/refresh', { refreshToken });

        if (res.data.success) {
          localStorage.setItem('accessToken', res.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // ✅ Fixed: Now using the error variable to log the failure
        console.error("Session expired or refresh failed:", refreshError);
        localStorage.clear();
        window.location.href = '/login?role=business';
      }
    }
    return Promise.reject(error);
  }
);

export default api;