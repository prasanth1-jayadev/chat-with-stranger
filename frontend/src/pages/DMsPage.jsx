import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Search, UserPlus, X, MessageSquare } from 'lucide-react';
import RoomChatContainer from '../components/chat/RoomChatContainer';
import FriendRequestsModal from '../components/FriendRequestsModal';
import roomService from '../api/services/roomService';
import userService from '../api/services/userService';

export default function DMsPage() {
  const [activeChat, setActiveChat] = useState(null);
  const [dms, setDms] = useState([]);
  const [friendsData, setFriendsData] = useState({ friends: [], friendRequests: [], sentRequests: [] });
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    fetchDMs();
    fetchFriends();
  }, []);

  const fetchDMs = async () => {
    try {
      const data = await roomService.getDMs();
      setDms(data);
    } catch (err) {
      console.error('Failed to fetch DMs:', err);
    }
  };

  const fetchFriends = async () => {
    try {
      const data = await userService.getFriends();
      setFriendsData(data);
    } catch (err) {
      console.error('Failed to fetch friends:', err);
    }
  };

  const handleFriendAction = async (userId, action) => {
    try {
      if (action === 'accept') {
        await userService.acceptRequest(userId);
      } else if (action === 'reject') {
        await userService.rejectRequest(userId);
      } else if (action === 'cancel') {
        await userService.rejectRequest(userId);
      } else if (action === 'remove') {
        await userService.removeFriend(userId);
      }
      // Refresh friends
      fetchFriends();
    } catch (error) {
      console.error(`Action ${action} failed:`, error);
    }
  };

  const startDM = async (userId) => {
    try {
      const newDM = await roomService.createDM(userId);

      // Mark messages as read when opening the chat
      await roomService.markAsRead(newDM._id);

      // Refresh DM list to update unread counts
      fetchDMs();

      // Set active chat
      const otherUser = getOtherMember(newDM);
      if (otherUser) {
        setActiveChat({ id: newDM._id, name: otherUser.username, avatar: otherUser.avatar });
      }
    } catch (error) {
      console.error('Failed to start DM:', error);
    }
  };

  const getOtherMember = (room) => {
    if (!user) return null;
    const currentUserId = user.id || user._id;
    return room.members.find(member => member._id !== currentUserId);
  };

  const filteredFriends = friendsData.friends.filter(friend => {
    return friend.username.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex overflow-hidden bg-echo-white pt-24">

      {/* Left Sidebar - Conversations List */}
      <div className="w-[360px] border-r border-echo-border flex flex-col shrink-0 bg-echo-white relative z-20 overflow-hidden shadow-sm">

        {/* Decorative Top Blobs */}
        <div className="absolute top-0 right-0 w-64 h-48 bg-echo-yellow rounded-bl-[120px] opacity-40 -z-10 pointer-events-none"></div>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-echo-yellow rounded-full opacity-50 -z-10 pointer-events-none"></div>

        {/* Header & Search */}
        <div className="px-6 pt-10 pb-4 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black tracking-tight text-echo-text">messages</h2>
            <button className="w-11 h-11 bg-echo-white flex items-center justify-center border border-echo-border text-echo-yellow rounded-2xl shadow-sm hover:bg-echo-yellow hover:text-echo-text hover:border-echo-yellow transition-all">
              <span className="text-2xl leading-none font-medium mb-1">+</span>
            </button>
          </div>

          <div className="relative mb-6">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-echo-muted" />
            <input
              type="text"
              placeholder="search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-echo-white border border-echo-border shadow-sm rounded-full text-sm focus:outline-none focus:border-echo-yellow focus:ring-2 focus:ring-echo-yellow/20 transition-all placeholder:text-echo-muted font-medium text-echo-text"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-hide">
            <button className="px-5 py-2 bg-echo-yellow text-echo-text font-extrabold text-[13px] rounded-full shadow-sm shrink-0">
              All
            </button>
            <button className="px-5 py-2 bg-echo-bg border-2 border-echo-border text-echo-muted font-bold text-[13px] rounded-full hover:text-echo-text hover:border-echo-yellow transition-colors shrink-0">
              Unread
            </button>
          </div>
        </div>

        {/* Pending Requests Button */}
        {(friendsData.friendRequests.length > 0 || friendsData.sentRequests.length > 0) && (
          <div className="px-6 py-3 border-b border-echo-border/50 bg-echo-white/50">
            <button
              onClick={() => setShowRequestsModal(true)}
              className="w-full flex items-center justify-between px-4 py-3 bg-echo-yellow/10 border border-echo-yellow rounded-xl hover:bg-echo-yellow/20 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-echo-yellow flex items-center justify-center text-echo-text font-bold shadow-sm">
                  <UserPlus size={16} />
                </div>
                <span className="font-extrabold text-[14px] text-echo-text">Friend Requests</span>
              </div>
              {(friendsData.friendRequests.length > 0) && (
                <span className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:scale-110 transition-transform">
                  {friendsData.friendRequests.length}
                </span>
              )}
            </button>
          </div>
        )}

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filteredFriends.map(friend => {
            const isActive = activeChat?.name === friend.username;
            const avatar = friend.avatar || friend.username.charAt(0).toUpperCase();

            const friendDM = dms.find(room => room.members.some(m => m._id === friend._id));
            const msgCount = friendDM?.messageCount || 0;

            return (
              <button
                key={friend._id}
                onClick={() => startDM(friend._id)}
                className={`w-full flex items-center gap-4 px-6 py-4 border-b border-echo-border/70 transition-colors text-left group ${isActive ? 'bg-echo-bg' : 'hover:bg-echo-bg/50'}`}
              >
                <div className="relative shrink-0">
                  <div className="w-14 h-14 rounded-full bg-echo-border overflow-hidden flex items-center justify-center font-bold text-xl text-echo-text shadow-sm border-[3px] border-echo-white">
                    {avatar.length > 2 ? (
                      <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      avatar
                    )}
                  </div>
                  <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-echo-white transition-colors ${friend.isOnline ? 'bg-green-500' : 'bg-echo-muted'}`}></div>
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-extrabold text-[15px] text-echo-text truncate">{friend.username}</h4>
                    {/* Timestamp placeholder */}
                    <span className="text-xs font-bold text-echo-yellow">1h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] text-echo-muted truncate font-medium">Tap to start chatting</p>
                    {msgCount > 0 && (
                      <span className="w-5 h-5 bg-echo-yellow text-echo-text rounded-full flex items-center justify-center text-[10px] font-black shadow-sm shrink-0 ml-2">
                        {msgCount > 99 ? '99+' : msgCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
          {filteredFriends.length === 0 && (
            <div className="p-8 text-center text-echo-muted text-sm font-medium">
              No friends found.
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <div className="flex-1 flex flex-col relative h-full">
          <RoomChatContainer
            activeChat={activeChat}
            onClose={() => setActiveChat(null)}
          />
        </div>
      ) : (
        <div className="flex-1 flex flex-col bg-echo-bg relative items-center justify-center">
          {/* Decorative Blobs */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-echo-yellow rounded-[40%_60%_70%_30%/40%_50%_60%_50%] opacity-20 pointer-events-none blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-echo-yellow rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-20 pointer-events-none blur-3xl"></div>

          <div className="relative z-10 flex flex-col items-center max-w-sm text-center group cursor-default">
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 bg-echo-yellow rounded-full animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite] opacity-30"></div>
              <div className="absolute inset-0 bg-echo-white rounded-full shadow-xl border-4 border-echo-yellow flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                <MessageSquare size={40} className="text-echo-text group-hover:-translate-y-1 transition-transform duration-500" />
              </div>
            </div>
            <h2 className="text-3xl font-black text-echo-text mb-4">Your Messages</h2>
            <p className="text-echo-muted font-medium text-lg leading-relaxed">
              Select a conversation from the sidebar to start chatting, or add a new friend to start a chat.
            </p>
          </div>
        </div>
      )}

      {/* Friend Requests Modal */}
      <FriendRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        friendsData={friendsData}
        onAction={handleFriendAction}
      />
    </div>
  );
}
