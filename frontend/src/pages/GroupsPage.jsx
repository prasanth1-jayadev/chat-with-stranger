import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import roomService from '../api/services/roomService';
import GroupsHeader from '../components/groups/GroupsHeader';
import GroupsFilters from '../components/groups/GroupsFilters';
import CreateGroupModal from '../components/CreateGroupModal';
import JoinPrivateRoomModal from '../components/JoinPrivateRoomModal';
import JoinPublicRoomModal from '../components/JoinPublicRoomModal';
import RoomCard from '../components/ui/RoomCard';
import ChatBox from '../components/chat/ChatBox';
import MessageBubble from '../components/chat/MessageBubble';

export default function GroupsPage() {
  const [activeChat, setActiveChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [roomToJoin, setRoomToJoin] = useState(null);
  const [publicRoomToJoin, setPublicRoomToJoin] = useState(null);
  const [groups, setGroups] = useState([]);
  const [filter, setFilter] = useState('joined');
  
  const { user } = useSelector((state) => state.auth);

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
      setActiveChat({ id: room._id, name: room.name, members: room.members?.length || 1, admin: room.admin?._id || room.admin, isPrivate: room.isPrivate });
    }
  };

  const handleJoinSuccess = (room) => {
    setRoomToJoin(null);
    fetchGroups();
    setActiveChat({ id: room._id, name: room.name, members: room.members?.length || 1, admin: room.admin?._id || room.admin, isPrivate: room.isPrivate });
  };

  if (activeChat) {
    return (
      <div className="flex-1 flex flex-col h-full pt-20">
        <ChatBox 
          activeChat={activeChat} 
          onClose={() => setActiveChat(null)} 
          type="group"
        >
        <div className="flex items-center gap-4 my-2">
          <div className="h-px bg-echo-border flex-1"></div>
          <span className="text-xs font-bold text-echo-muted tracking-widest uppercase">Welcome to {activeChat.name}</span>
          <div className="h-px bg-echo-border flex-1"></div>
        </div>
        
        <MessageBubble 
          message="hello everyone! glad to be here."
          isSent={false}
          avatar="U"
          timestamp="12:40pm"
        />
        </ChatBox>
      </div>
    );
  }

  // Block/Grid Setup for discovering rooms
  return (
    <div className="flex-1 flex flex-col bg-echo-bg overflow-hidden relative pt-24">
      
      <GroupsHeader setIsModalOpen={setIsModalOpen} filter={filter} />
      <GroupsFilters filter={filter} setFilter={setFilter} />
      
      {/* Block Grid List */}
      <div className="flex-1 p-10 relative overflow-y-auto">
        {/* Background decorative elements */}
        <div className="absolute top-0 left-10 w-[500px] h-[500px] bg-gradient-to-br from-echo-yellow/20 to-transparent rounded-full blur-[100px] pointer-events-none mix-blend-multiply"></div>
        <div className="absolute bottom-10 right-10 w-[600px] h-[600px] bg-gradient-to-tl from-white/60 to-transparent rounded-full blur-[120px] pointer-events-none"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          {groups
            .filter(group => {
              if (filter === 'joined') return isUserMember(group);
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
