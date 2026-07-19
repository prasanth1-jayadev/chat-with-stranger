export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/auth/login',
    REGISTER: '/api/auth/register',
  },
  ROOMS: {
    GET_ALL: '/api/rooms',
    CREATE: '/api/rooms',
    UPLOAD_IMAGE: '/api/upload',
    JOIN: (roomId) => `/api/rooms/${roomId}/join`,
    GET_REQUESTS: (roomId) => `/api/rooms/${roomId}/requests`,
    APPROVE_REQUEST: (roomId, userId) => `/api/rooms/${roomId}/approve/${userId}`,
    REJECT_REQUEST: (roomId, userId) => `/api/rooms/${roomId}/reject/${userId}`,
    GET_MESSAGES: (roomId) => `/api/rooms/${roomId}/messages`,
    GET_DMS: '/api/rooms/dms',
    CREATE_DM: (userId) => `/api/rooms/dms/${userId}`,
  },
  USERS: {
    PROFILE: '/api/auth/profile',
    GET_USER: (id) => `/api/users/${id}`,
    GET_FRIENDS: '/api/users/me/friends',
    SEND_REQUEST: (id) => `/api/users/${id}/request`,
    ACCEPT_REQUEST: (id) => `/api/users/${id}/accept`,
    REJECT_REQUEST: (id) => `/api/users/${id}/reject`,
    REMOVE_FRIEND: (id) => `/api/users/${id}/remove`,
  },
  ADMIN: {
    LOGIN: '/api/auth/login',
    DASHBOARD_STATS: '/api/admin/stats',
    GET_USERS: '/api/admin/users',
    GET_ROOMS: '/api/admin/rooms',
  }
};
