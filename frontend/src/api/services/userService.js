import axiosClient from '../axiosClient';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

const userService = {
  updateProfile: async (profileData) => {
    const response = await axiosClient.put(API_ENDPOINTS.USERS.PROFILE, profileData);
    return response.data;
  }
};

export default userService;
