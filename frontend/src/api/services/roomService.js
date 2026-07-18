import axiosClient from '../axiosClient';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

const roomService = {
  getAllRooms: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.ROOMS.GET_ALL);
    return response.data;
  },
  createRoom: async (roomData) => {
    const response = await axiosClient.post(API_ENDPOINTS.ROOMS.CREATE, roomData);
    return response.data;
  },
  joinRoom: async (roomId, passwordData = {}) => {
    const response = await axiosClient.post(API_ENDPOINTS.ROOMS.JOIN(roomId), passwordData);
    return response.data;
  },
  getJoinRequests: async (roomId) => {
    const response = await axiosClient.get(API_ENDPOINTS.ROOMS.GET_REQUESTS(roomId));
    return response.data;
  },
  handleRequest: async (roomId, userId, action) => {
    // action is either 'approve' or 'reject'
    const endpoint = action === 'approve' ? API_ENDPOINTS.ROOMS.APPROVE_REQUEST(roomId, userId) : API_ENDPOINTS.ROOMS.REJECT_REQUEST(roomId, userId);
    const response = await axiosClient.post(endpoint, {});
    return response.data;
  }
};

export default roomService;
