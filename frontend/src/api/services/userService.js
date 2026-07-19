import axiosClient from '../axiosClient';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

const userService = {
  updateProfile: async (profileData) => {
    const response = await axiosClient.put(API_ENDPOINTS.USERS.PROFILE, profileData);
    return response.data;
  },
  getUser: async (userId) => {
    const response = await axiosClient.get(API_ENDPOINTS.USERS.GET_USER(userId));
    return response.data;
  },
  getFriends: async () => {
    const response = await axiosClient.get(API_ENDPOINTS.USERS.GET_FRIENDS);
    return response.data;
  },
  sendRequest: async (userId) => {
    const response = await axiosClient.post(API_ENDPOINTS.USERS.SEND_REQUEST(userId));
    return response.data;
  },
  acceptRequest: async (userId) => {
    const response = await axiosClient.post(API_ENDPOINTS.USERS.ACCEPT_REQUEST(userId));
    return response.data;
  },
  rejectRequest: async (userId) => {
    const response = await axiosClient.post(API_ENDPOINTS.USERS.REJECT_REQUEST(userId));
    return response.data;
  },
  removeFriend: async (userId) => {
    const response = await axiosClient.post(API_ENDPOINTS.USERS.REMOVE_FRIEND(userId));
    return response.data;
  }
};

export default userService;
