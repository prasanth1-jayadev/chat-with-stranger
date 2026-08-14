import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Compass } from 'lucide-react';
import roomService from '../api/services/roomService';
import GroupsHeader from '../components/groups/GroupsHeader';
import CreateGroupModal from '../components/CreateGroupModal';
import RoomCard from '../components/ui/RoomCard';
import RoomChatContainer from '../components/chat/RoomChatContainer';

export default function GroupsPage() {
  const [activeChat, setActiveChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' or 'created'

  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();
  const location = useLocation();

  const fetchGroups = async () => {
    try {
      const data = await roomService.getAllRooms();
      setGroups(data.rooms || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  useEffect(() => {
    if (location.state?.openRoomId && groups.length > 0) {
      const targetRoom = groups.find(g => (g._id || g.id)?.toString() === location.state.openRoomId?.toString());
      if (targetRoom) {
        handleRoomClick(targetRoom);
      }
    }
  }, [groups, location.state]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    fetchGroups();
  };

  const isUserMember = (room) => {
    const userId = user?.id || user?._id;
    return room.members.some(member =>
      (member?._id && member._id === userId) || (member && member === userId)
    );
  };

  const handleRoomClick = (room) => {
    setActiveChat({ 
      id: room._id, 
      name: room.name, 
      members: room.members?.length || 1, 
      admin: room.admin?._id || room.admin, 
      isPrivate: room.isPrivate,
      description: room.description,
      tags: room.tags,
      logoUrl: room.logoUrl,
      pinnedAnnouncement: room.pinnedAnnouncement || { text: '' }
    });
  };

  if (activeChat) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-echo-bg overflow-hidden">
        <RoomChatContainer
          activeChat={activeChat}
          setActiveChat={setActiveChat}
          onClose={() => setActiveChat(null)}
        />
      </div>
    );
  }

  const joinedRooms = groups.filter(group => isUserMember(group));
  const currentUserId = user?.id || user?._id;
  const displayedRooms = joinedRooms.filter(group => {
    if (filterType === 'created') {
      return (group.admin?._id === currentUserId || group.admin === currentUserId);
    }
    return true;
  });

  // Block/Grid Setup for discovering rooms
  return (
    <div className="flex-1 flex flex-col bg-echo-bg overflow-hidden relative pt-16 md:pt-24">

      <GroupsHeader
        setIsModalOpen={setIsModalOpen}
        title="My Rooms"
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Tabs */}
      <div className="flex gap-2 sm:gap-4 px-4 sm:px-10 pt-3 sm:pt-4 z-10 relative overflow-x-auto">
        <button
          onClick={() => setFilterType('all')}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0 ${filterType === 'all' ? 'bg-[#1a1a1a] text-[#efcb40]' : 'bg-white text-echo-muted border border-echo-border hover:bg-gray-50'}`}
        >
          All Joined Rooms
        </button>
        <button
          onClick={() => setFilterType('created')}
          className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0 ${filterType === 'created' ? 'bg-[#1a1a1a] text-[#efcb40]' : 'bg-white text-echo-muted border border-echo-border hover:bg-gray-50'}`}
        >
          My Created Rooms
        </button>
      </div>

      {/* Block Grid List */}
      <div className="flex-1 px-4 sm:px-10 pb-6 sm:pb-10 pt-4 sm:pt-6 relative overflow-y-auto">
        <style>
          {`
            @keyframes animate-gradient {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}
        </style>

        {/* Background decorative elements */}
        <div className="absolute top-0 left-10 w-[500px] h-[500px] bg-gradient-to-br from-echo-yellow/20 to-transparent rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-gradient-to-tl from-white/60 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

        {joinedRooms.length > 0 && (
          <div className="w-full max-w-6xl mx-auto pb-6 sm:pb-8 relative z-10">
            <div
              onClick={() => navigate('/groups/discover')}
              className="group relative w-full overflow-hidden rounded-2xl sm:rounded-[2rem] cursor-pointer bg-white/60 backdrop-blur-xl border border-white/80 shadow-[0_4px_15px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,1)] transition-all duration-300 hover:shadow-[0_8px_25px_rgba(239,203,64,0.2)] hover:-translate-y-1 flex flex-col sm:flex-row items-center justify-between p-5 sm:px-8 sm:py-6"
            >
              {/* Subtle Animated Theme Gradient */}
              <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-[#efcb40]/20 to-transparent pointer-events-none group-hover:from-[#efcb40]/40 transition-colors duration-500"></div>

              <div className="flex items-center gap-4 sm:gap-6 relative z-10 w-full sm:w-auto">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#1a1a1a] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-12 transition-all duration-300 shrink-0">
                  <Compass size={24} className="text-[#efcb40] sm:w-7 sm:h-7" />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1a1a1a] tracking-tight mb-1">
                    Explore More Rooms
                  </h3>
                  <p className="text-echo-muted font-medium text-xs sm:text-base max-w-md">
                    Find new public spaces, dive into fresh topics, or join private communities.
                  </p>
                </div>
              </div>

              <div className="mt-4 sm:mt-0 relative z-10 w-full sm:w-auto">
                <div className="px-6 sm:px-8 py-2.5 sm:py-3.5 bg-[#efcb40] text-[#1a1a1a] font-black text-xs sm:text-sm uppercase tracking-wider rounded-full flex items-center justify-center gap-2 shadow-sm group-hover:bg-[#f2d55b] group-hover:shadow-md group-hover:scale-105 transition-all duration-300">
                  Browse Rooms &rarr;
                </div>
              </div>
            </div>
          </div>
        )}

        {displayedRooms.length === 0 ? (
          <div className="w-full max-w-3xl mx-auto h-[50vh] sm:h-[60vh] flex flex-col items-center justify-center relative z-10">
            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.05),inset_0_2px_4px_rgba(255,255,255,0.8)] rounded-3xl sm:rounded-[3rem] p-8 sm:p-16 text-center w-full relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#efcb40]/30 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#efcb40]/50 transition-colors duration-700"></div>

              <div className="w-16 h-16 sm:w-24 sm:h-24 bg-white shadow-xl rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-8 relative z-10 border border-echo-border">
                <Compass size={32} className="text-[#1a1a1a] sm:w-10 sm:h-10" />
              </div>

              <h3 className="text-2xl sm:text-4xl font-extrabold text-[#1a1a1a] mb-2 sm:mb-4 tracking-tight relative z-10">Ready to start chatting?</h3>
              <p className="text-echo-muted text-sm sm:text-lg font-medium mb-6 sm:mb-10 max-w-md mx-auto relative z-10">
                You haven't joined any rooms yet. Discover exciting conversations and communities waiting for you!
              </p>

              <button
                onClick={() => navigate('/groups/discover')}
                className="px-6 sm:px-10 py-3 sm:py-4 bg-[#1a1a1a] text-white font-black text-sm sm:text-lg uppercase tracking-widest rounded-full shadow-[0_10px_30px_rgba(0,0,0,0.2)] hover:bg-[#efcb40] hover:text-[#1a1a1a] hover:shadow-[0_10px_40px_rgba(239,203,64,0.4)] transition-all duration-300 transform hover:-translate-y-1 relative z-10 flex items-center justify-center gap-2 sm:gap-3 mx-auto"
              >
                Explore Rooms
                <span className="text-lg sm:text-xl">&rarr;</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8 max-w-6xl mx-auto relative z-10">
            {displayedRooms
              .filter(group => group.name.toLowerCase().includes(searchQuery.toLowerCase()))
              .map(group => (
                <RoomCard
                  key={group._id}
                  room={{ ...group, id: group._id, members: group.members?.length || 1 }}
                  isJoined={isUserMember(group)}
                  onClick={() => handleRoomClick(group)}
                />
              ))}
          </div>
        )}
      </div>

      <CreateGroupModal isOpen={isModalOpen} onClose={handleModalClose} />
    </div>
  );
}
