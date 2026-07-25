import axiosClient from '../axiosClient';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

const adminService = {
  login: async (credentials) => {
    const response = await axiosClient.post(API_ENDPOINTS.ADMIN.LOGIN, credentials);
    return response.data;
  },
  getUsers: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.ADMIN.GET_USERS);
    return response.data;
  },
  getRooms: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.ADMIN.GET_ROOMS);
    return response.data;
  },
  toggleBanUser: async (userId) => {
    const response = await axiosClient.patch(`/api/admin/users/${userId}/ban`);
    return response.data;
  },
  deleteRoom: async (roomId) => {
    const response = await axiosClient.delete(`/api/admin/rooms/${roomId}`);
    return response.data;
  }
};

export default adminService;
