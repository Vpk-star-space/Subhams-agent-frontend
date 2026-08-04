import axios from 'axios';

const TRAP_DOOR_KEY = import.meta.env.VITE_UPLOAD_TOKEN;

// 🟢 STEP 1: Define the raw URL. (Uses your .env first, then falls back to Render)
export const BASE_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.DEV ? 'http://localhost:5000' : 'https://subhams-vpk.onrender.com');

// 🟢 STEP 2: Create the custom Axios instance
const api = axios.create({
  baseURL: `${BASE_URL}/api`, // Automatically adds /api to all requests!
  headers: {
    'x-subhams-secure-token': TRAP_DOOR_KEY // Automatically adds the security key!
  }
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
        
        const res = await axios.post(`${BASE_URL}/api/auth/refresh`, 
          { refreshToken },
          { headers: { 'x-subhams-secure-token': TRAP_DOOR_KEY } }
        );

        if (res.data.success) {
          localStorage.setItem('accessToken', res.data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${res.data.accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error("Session expired or refresh failed:", refreshError);
        localStorage.clear();
        window.location.href = '/login?role=business';
      }
    }
    return Promise.reject(error);
  }
);

export default api;