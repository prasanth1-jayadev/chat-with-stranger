export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  ROOMS: {
    GET_ALL: '/api/rooms',
    CREATE: '/api/rooms',
    JOIN: (roomId) => `/api/rooms/${roomId}/join`,
    GET_REQUESTS: (roomId) => `/api/rooms/${roomId}/requests`,
    APPROVE_REQUEST: (roomId, userId) => `/api/rooms/${roomId}/approve/${userId}`,
    REJECT_REQUEST: (roomId, userId) => `/api/rooms/${roomId}/reject/${userId}`,
  },
  USERS: {
    PROFILE: '/api/auth/profile',
  },
  ADMIN: {
    LOGIN: '/api/auth/login',
    DASHBOARD_STATS: '/api/admin/stats',
    GET_USERS: '/api/admin/users',
    GET_ROOMS: '/api/admin/rooms',
  }
};
