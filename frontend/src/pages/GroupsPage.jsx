import { useState } from 'react';
import { Search, Plus } from 'lucide-react';
import CreateGroupModal from '../components/CreateGroupModal';
import RoomCard from '../components/ui/RoomCard';
import ChatBox from '../components/chat/ChatBox';
import MessageBubble from '../components/chat/MessageBubble';

export default function GroupsPage() {
  const [activeChat, setActiveChat] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Mock data for groups
  const groups = [
    { id: 'general', name: 'general chat', members: 124, description: 'welcome to the hub! talk about anything.', badge: 'popular' },
    { id: 'tech', name: 'tech talk', members: 89, description: 'did anyone check out that new framework?', badge: 'active' },
    { id: 'music', name: 'music lounge', members: 42, description: 'sharing playlists and new releases.' },
    { id: 'gaming', name: 'gaming squad', members: 215, description: 'looking for group? join here.', badge: 'popular' },
    { id: 'random', name: 'random thoughts', members: 12, description: 'shower thoughts and memes.' },
    { id: 'design', name: 'ui/ux design', members: 56, description: 'feedback and inspiration sharing.' }
  ];

  if (activeChat) {
    return (
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
    );
  }

  // Block/Grid Setup for discovering rooms
  return (
    <div className="flex-1 flex flex-col bg-echo-bg overflow-hidden relative pt-24">
      
      {/* Header & Search */}
      <div className="px-10 py-8 border-b border-echo-border bg-echo-white shrink-0 flex items-center justify-between relative z-10">
        <div>
          <h2 className="text-3xl font-bold mb-2">discover rooms</h2>
          <p className="text-echo-muted font-medium">join a conversation or create your own space.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-64">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-echo-muted" />
            <input 
              type="text" 
              placeholder="search rooms..." 
              className="w-full pl-11 pr-4 py-2.5 bg-echo-bg border border-echo-border rounded-full text-sm focus:outline-none focus:border-echo-text transition-colors placeholder:text-echo-muted font-medium"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-5 py-2.5 bg-[#1a1a1a] text-echo-yellow font-bold rounded-full flex items-center gap-2 hover:bg-black transition-colors shadow-lg"
          >
            <Plus size={18} />
            create room
          </button>
        </div>
      </div>
      
      {/* Block Grid List */}
      <div className="flex-1 p-10 relative">
        {/* Background decorative elements */}
        <div className="absolute top-20 left-20 w-96 h-96 bg-white rounded-full blur-[100px] opacity-60 mix-blend-overlay"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-echo-yellow/10 rounded-full blur-[100px]"></div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto relative z-10">
          {groups.map(group => (
            <RoomCard 
              key={group.id} 
              room={group} 
              onClick={() => setActiveChat({ id: group.id, name: group.name, members: group.members })}
            />
          ))}
        </div>
      </div>
      
      <CreateGroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}
