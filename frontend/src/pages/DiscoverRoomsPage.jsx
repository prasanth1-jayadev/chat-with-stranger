import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import roomService from '../api/services/roomService';
import GroupsHeader from '../components/groups/GroupsHeader';
import GroupsFilters from '../components/groups/GroupsFilters';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinPrivateRoomModal from '../components/JoinPrivateRoomModal';
import JoinPublicRoomModal from '../components/JoinPublicRoomModal';
import RoomCard from '../components/ui/RoomCard';

export default function DiscoverRoomsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomToJoin, setRoomToJoin] = useState(null);
  const [publicRoomToJoin, setPublicRoomToJoin] = useState(null);
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const { user } = useSelector((state) => state.auth);
  const navigate = useNavigate();

  const fetchGroups = async () => {
    try {
      const data = await roomService.getAllRooms();
      setGroups(data);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

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
    const isMember = isUserMember(room);
    
    if (!isMember) {
      if (room.isPrivate) {
        setRoomToJoin(room);
      } else {
        setPublicRoomToJoin(room);
      }
    } else {
      // If already a member, just navigate back to groups where they can chat
      navigate('/groups');
    }
  };

  const handleJoinSuccess = (room) => {
    setRoomToJoin(null);
    fetchGroups();
    navigate('/groups');
  };

  const getTitle = () => {
    switch (filter) {
      case 'public': return 'Public Rooms';
      case 'private': return 'Private Rooms';
      case 'all': default: return 'Explore Rooms';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-echo-bg overflow-hidden relative pt-24">
      <style>
        {`
          .discover-blob-1 {
            animation: blob-morph-1 12s ease-in-out infinite alternate, blob-spin 30s linear infinite;
          }
          .discover-blob-2 {
            animation: blob-morph-2 15s ease-in-out infinite alternate-reverse, blob-spin-reverse 35s linear infinite;
          }
        `}
      </style>
      
      <GroupsHeader 
        setIsModalOpen={setIsModalOpen} 
        title={getTitle()}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        actionButton={
          <button 
            onClick={() => navigate('/groups')}
            className="px-6 py-2.5 bg-white/50 text-[#1a1a1a] font-bold rounded-full flex items-center gap-2 hover:bg-white/80 transition-all shadow-sm border border-white/60 transform active:scale-95"
          >
            <ArrowLeft size={18} />
            Back to My Rooms
          </button>
        }
      />
      
      <GroupsFilters filter={filter} setFilter={setFilter} />
      
      {/* Block Grid List */}
      <div className="flex-1 p-10 relative overflow-y-auto">
        {/* Background Blobs */}
        <div className="absolute top-0 left-10 w-[500px] h-[500px] bg-gradient-to-br from-[#efcb40]/20 to-transparent rounded-full blur-[100px] pointer-events-none mix-blend-multiply discover-blob-1"></div>
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-gradient-to-tl from-white/60 to-[#efcb40]/10 rounded-full blur-[120px] pointer-events-none discover-blob-2"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          {groups
            .filter(group => !isUserMember(group)) // EXCLUDE joined rooms
            .filter(group => group.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(group => {
              if (filter === 'public') return !group.isPrivate;
              if (filter === 'private') return group.isPrivate;
              return true; // 'all'
            })
            .map(group => (
              <RoomCard 
                key={group._id} 
                room={{...group, id: group._id, members: group.members?.length || 1}} 
                isJoined={isUserMember(group)}
                onClick={() => handleRoomClick(group)}
              />
          ))}
        </div>
      </div>
      
      <CreateGroupModal isOpen={isModalOpen} onClose={handleModalClose} />
      
      <JoinPrivateRoomModal 
        isOpen={!!roomToJoin} 
        onClose={() => setRoomToJoin(null)} 
        room={roomToJoin} 
        onSuccess={handleJoinSuccess}
      />
      
      <JoinPublicRoomModal 
        isOpen={!!publicRoomToJoin} 
        onClose={() => setPublicRoomToJoin(null)} 
        room={publicRoomToJoin} 
        onSuccess={(room) => {
          setPublicRoomToJoin(null);
          handleJoinSuccess(room);
        }}
      />
    </div>
  );
}
