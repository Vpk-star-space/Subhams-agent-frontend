import axios from 'axios';

// 🟢 Define your Trap Door Key once here
const TRAP_DOOR_KEY = 'subhams_front_auth_998877';

const api = axios.create({
  baseURL: 'https://subhams-vpk.onrender.com/api',
  // 🟢 FIX 1: Automatically attach the key to EVERY standard API request
  headers: {
    'x-subhams-secure-token': TRAP_DOOR_KEY
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
        
        // 🟢 FIX 2: Attach the key to the raw Axios refresh request so the Trap Door lets it in!
        const res = await axios.post('https://subhams-vpk.onrender.com/api/auth/refresh', 
          { refreshToken },
          { 
            headers: { 'x-subhams-secure-token': TRAP_DOOR_KEY } 
          }
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