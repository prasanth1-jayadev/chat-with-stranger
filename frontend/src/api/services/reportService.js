import axiosClient from '../axiosClient';
import { API_ENDPOINTS } from '../../constants/apiEndpoints';

const reportService = {
  createReport: async (data) => {
    const res = await axiosClient.post(API_ENDPOINTS.REPORTS.CREATE, data);
    return res.data;
  },

  getReports: async (page = 1, limit = 10, status = 'all', type = 'all') => {
    const res = await axiosClient.get(API_ENDPOINTS.REPORTS.GET_ALL, {
      params: { page, limit, status, type }
    });
    return res.data;
  },

  resolveReport: async (reportId, action) => {
    const res = await axiosClient.patch(API_ENDPOINTS.REPORTS.RESOLVE(reportId), { action });
    return res.data;
  }
};

export default reportService;
