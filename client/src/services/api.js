import axios from 'axios';

// Tạo Axios instance với base URL của backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Tự động gắn token vào mọi request
api.interceptors.request.use(
  (config) => {
    // Nếu gửi FormData, xóa Content-Type để trình duyệt tự sinh boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor: Xử lý response lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Nếu token hết hạn, không hợp lệ (401), hoặc tài khoản bị khóa (403 do blocked)
    const isUnauthorized = error.response && error.response.status === 401;
    const isBlocked = error.response && error.response.status === 403 && error.response.data?.message?.includes('khóa');

    if (isUnauthorized || isBlocked) {
      // Chỉ redirect nếu không phải đang ở trang login/register
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
