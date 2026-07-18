import axiosClient from '../axiosClient';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

const authService = {
  login: async (credentials) => {
    const response = await axiosClient.post(API_ENDPOINTS.AUTH.LOGIN, credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await axiosClient.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return response.data;
  }
};

export default authService;
