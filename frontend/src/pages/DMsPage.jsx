import { useState } from 'react';
import { Search, Play, Download } from 'lucide-react';
import ChatBox from '../components/chat/ChatBox';
import MessageBubble from '../components/chat/MessageBubble';

export default function DMsPage() {
  const [activeChat, setActiveChat] = useState({ id: 'alex', name: 'alex riviera' });

  // Mock data matching the screenshot
  const dms = [
    { id: 'alex', name: 'alex riviera', time: '12:45pm', preview: 'the new acoustic session sounds in...', hasUnread: true, isOnline: true },
    { id: 'audio', name: 'audio collective', time: '2h ago', preview: 'mira: did everyone see the new g...', badge: 3 },
    { id: 'jordan', name: 'jordan p.', time: 'yesterday', preview: "let's record that intro again tomorr..." },
    { id: 'samuel', name: 'samuel chen', time: 'mon', preview: 'can you send the lossless file?' }
  ];

  return (
    <div className="flex-1 flex overflow-hidden bg-echo-white pt-24">
      
      {/* Left Sidebar - Conversations List */}
      <div className="w-80 border-r border-echo-border flex flex-col shrink-0 bg-echo-white relative z-20">
        
        {/* Header & Search */}
        <div className="px-6 py-6 border-b border-echo-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">messages</h2>
            <button className="w-8 h-8 flex items-center justify-center border border-echo-border rounded-md hover:bg-black/5 transition-colors">
              <span className="text-xl leading-none">+</span>
            </button>
          </div>
          
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-echo-muted" />
            <input 
              type="text" 
              placeholder="search conversations..." 
              className="w-full pl-11 pr-4 py-2.5 bg-transparent border border-echo-border rounded-full text-sm focus:outline-none focus:border-echo-text transition-colors placeholder:text-echo-muted font-medium"
            />
          </div>
        </div>
        
        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {dms.map(user => {
            const isActive = activeChat?.id === user.id;
            return (
              <button 
                key={user.id}
                onClick={() => setActiveChat({ id: user.id, name: user.name })}
                className={`w-full flex items-start gap-4 p-5 border-b border-echo-border transition-colors text-left ${isActive ? 'bg-echo-bg' : 'hover:bg-echo-bg/50'}`}
              >
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-full bg-echo-border overflow-hidden border border-echo-border flex items-center justify-center font-bold text-lg">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  {user.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-echo-white"></div>
                  )}
                  {user.badge && (
                    <div className="absolute -bottom-1 -right-1 min-w-[20px] h-[20px] bg-echo-yellow text-echo-text rounded-full flex items-center justify-center text-xs font-bold border-2 border-echo-white">
                      {user.badge}
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0 pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-bold text-sm truncate">{user.name}</h4>
                    <span className="text-xs text-echo-muted font-medium shrink-0 ml-2">{user.time}</span>
                  </div>
                  <p className={`text-sm truncate ${user.hasUnread ? 'text-echo-text font-semibold' : 'text-echo-muted font-medium'}`}>
                    {user.preview}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Chat Area */}
      {activeChat ? (
        <ChatBox activeChat={activeChat} type="dm">
          {/* Divider */}
          <div className="flex items-center gap-4 my-2">
            <div className="h-px bg-echo-border flex-1"></div>
            <span className="text-xs font-bold text-echo-muted tracking-widest uppercase">Today</span>
            <div className="h-px bg-echo-border flex-1"></div>
          </div>

          <MessageBubble 
            message="hey! i just finished reviewing the master for the echo podcast. the new acoustic session sounds incredible in the mix."
            isSent={false}
            avatar={activeChat.name.charAt(0).toUpperCase()}
            timestamp="12:40pm"
          />

          <MessageBubble 
            message="that's awesome to hear! did we manage to clean up the hum in the intro?"
            isSent={true}
            avatar="Y"
            timestamp="12:42pm"
          />

          <MessageBubble 
            message="yeah, i used a narrow notch filter. it's crystal clear now. ready to ship whenever you are!"
            isSent={false}
            avatar={activeChat.name.charAt(0).toUpperCase()}
            timestamp="12:45pm"
          />

          {/* Received Audio File Component (Custom for this page) */}
          <div className="flex gap-4 max-w-[85%] ml-14">
            <div className="bg-[#1a1a1a] text-white p-5 rounded-xl w-[400px] shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <button className="w-12 h-12 bg-echo-yellow text-black rounded-full flex items-center justify-center shrink-0 hover:scale-105 transition-transform">
                  <Play size={20} className="ml-1" fill="currentColor" />
                </button>
                <div className="flex-1 flex flex-col justify-center">
                   <div className="flex justify-between text-xs font-bold font-mono mb-2">
                     <span>01:24</span>
                     <span>03:45</span>
                   </div>
                   <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden relative">
                     <div className="absolute top-0 left-0 h-full bg-echo-yellow w-1/3"></div>
                   </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold font-mono tracking-wide">episode_04_master_v2.wav</span>
                <button className="text-echo-yellow hover:opacity-80"><Download size={18} /></button>
              </div>
            </div>
          </div>
        </ChatBox>
      ) : (
        <div className="flex-1 flex items-center justify-center text-echo-muted font-medium bg-echo-bg">
          Select a conversation to start messaging.
        </div>
      )}
    </div>
  );
}
