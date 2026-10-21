import api from './api';

// Xác minh mã OTP
export const verifyOtp = async (email, otp) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

// Gửi lại mã OTP
export const resendOtp = async (email) => {
  const response = await api.post('/auth/resend-otp', { email });
  return response.data;
};
