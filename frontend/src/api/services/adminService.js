import axiosClient from '../axiosClient';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

const adminService = {
  login: async (credentials) => {
    const response = await axiosClient.post(API_ENDPOINTS.ADMIN.LOGIN, credentials);
    return response.data;
  },
  getUsers: async (page = 1, limit = 10, search = '', filter = 'all') => {
    const params = new URLSearchParams({
      page,
      limit,
      search,
      filter
    });
    const response = await axiosClient.get(`/api/admin/users?${params.toString()}`);
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
  toggleAdminRole: async (userId) => {
    const response = await axiosClient.patch(API_ENDPOINTS.ADMIN.TOGGLE_ROLE(userId));
    return response.data;
  },
  deleteRoom: async (roomId) => {
    const response = await axiosClient.delete(`/api/admin/rooms/${roomId}`);
    return response.data;
  },
  getStats: async () => {
    const response = await axiosClient.get('/api/admin/stats');
    return response.data;
  }
};

export default adminService;
