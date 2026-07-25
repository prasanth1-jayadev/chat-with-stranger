import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  rooms: [],
  activeRoom: null, // The currently selected room object
  messages: {}, // Map of roomId -> array of messages
  onlineUsers: [],
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setRooms: (state, action) => {
      state.rooms = action.payload;
    },
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload;
    },
    setMessages: (state, action) => {
      const { roomId, messages } = action.payload;
      state.messages[roomId] = messages;
    },
    addMessage: (state, action) => {
      const { room } = action.payload; // Room ID is in `room` field of the message
      const roomId = room;
      if (!state.messages[roomId]) {
        state.messages[roomId] = [];
      }
      state.messages[roomId].push(action.payload);
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload;
    },
    addOnlineUser: (state, action) => {
      if (!state.onlineUsers.includes(action.payload)) {
        state.onlineUsers.push(action.payload);
      }
    },
    removeOnlineUser: (state, action) => {
      state.onlineUsers = state.onlineUsers.filter(id => id !== action.payload);
    },
  },
});

export const { setRooms, setActiveRoom, setMessages, addMessage, setOnlineUsers, addOnlineUser, removeOnlineUser } = chatSlice.actions;
export default chatSlice.reducer;
