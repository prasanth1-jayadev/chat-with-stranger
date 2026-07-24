import { useState, useEffect, useRef } from 'react';
import { Search, Users, Clock, ShieldCheck, Hash, X, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { socket } from '../socket';
import ChatBox from '../components/chat/ChatBox';
import MessageBubble from '../components/chat/MessageBubble';
import RandomMatchAnimation from '../components/chat/RandomMatchAnimation';

export default function RandomMatchPage() {
  const [chatStatus, setChatStatus] = useState('idle'); // idle, searching, connected, disconnected
  const [hasStarted, setHasStarted] = useState(false);
  const [activeChat, setActiveChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [stats, setStats] = useState({ onlineUsersCount: 0, waitingUsersCount: 0 });
  const { user } = useSelector((state) => state.auth);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Listen for match
    const handleMatch = (data) => {
      setChatStatus('connected');
      setMessages([{ type: 'system', content: 'You are now chatting with a random stranger. Say hi!' }]);
      setActiveChat({ id: data.roomId, name: 'Stranger' });
    };

    // Listen for incoming messages
    const handleMessage = (message) => {
      setMessages((prev) => [...prev, { type: 'chat', ...message }]);
    };

    // Listen for stranger disconnecting
    const handleDisconnect = () => {
      setChatStatus('disconnected');
      setMessages((prev) => [
        ...prev.filter(m => m.content !== 'You are now chatting with a random stranger. Say hi!'), 
        { type: 'system', content: 'Stranger has disconnected.' }
      ]);
    };

    // Listen for stats
    const handleStats = (newStats) => {
      setStats(newStats);
    };

    socket.on('stranger_matched', handleMatch);
    socket.on('receive_message', handleMessage);
    socket.on('stranger_disconnected', handleDisconnect);
    socket.on('stranger_stats', handleStats);

    return () => {
      socket.off('stranger_matched', handleMatch);
      socket.off('receive_message', handleMessage);
      socket.off('stranger_disconnected', handleDisconnect);
      socket.off('stranger_stats', handleStats);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, chatStatus]);

  const findStranger = () => {
    setHasStarted(true);
    setChatStatus('searching');
    setActiveChat(null);
    setMessages([]);
    socket.emit('find_stranger');
  };

  const leaveStrangerQueue = () => {
    setChatStatus('idle');
    setHasStarted(false);
    socket.emit('leave_stranger_queue');
  };

  const leaveCurrentChat = () => {
    if (activeChat || chatStatus !== 'idle') {
      if (activeChat) {
        socket.emit('leave_stranger', activeChat.id);
      } else {
        socket.emit('leave_stranger_queue');
      }
      setActiveChat(null);
      setMessages([]);
      setChatStatus('idle');
      setHasStarted(false);
    }
  };

  const handleSendMessage = (e, fileUrl) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !fileUrl) || !activeChat || chatStatus !== 'connected') return;

    const currentUserId = user?.id || user?._id || 'anonymous';
    const messageData = {
      roomId: activeChat.id,
      senderId: currentUserId,
      content: newMessage,
      fileUrl: fileUrl
    };

    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  // Handle escape key to leave chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && hasStarted) {
        leaveCurrentChat();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasStarted, activeChat]);

  const nextStranger = () => {
    if (activeChat) {
      socket.emit('leave_stranger', activeChat.id);
    } else {
      socket.emit('leave_stranger_queue');
    }
    findStranger();
  };

  const endChat = () => {
    leaveCurrentChat();
  };

  const reportStranger = () => {
    alert("Stranger reported. They have been flagged for review.");
    leaveCurrentChat();
  };

  const isSearching = chatStatus === 'searching';
  const isIdle = chatStatus === 'idle';

  if (isSearching || (isIdle && !hasStarted)) {
    return (
      <div className="flex-1 flex flex-col h-full pt-20 relative bg-[#FAF6EC]">
        <RandomMatchAnimation 
          isSearching={isSearching} 
          onStart={findStranger} 
          onCancel={leaveStrangerQueue} 
        />
      </div>
    );
  }

  if (hasStarted) {
    const strangerLeft = chatStatus === 'disconnected';
    
    // Pseudo active chat for ChatBox header when not actually matched yet
    const displayChat = activeChat || { id: 'searching', name: 'Stranger' };

    return (
      <div className="flex-1 flex flex-col h-full pt-20 bg-echo-white relative">
        <ChatBox
          activeChat={displayChat}
          onClose={leaveCurrentChat}
          type="random"
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          onSendMessage={handleSendMessage}
          onSkip={nextStranger}
          onStop={endChat}
          onReport={!isSearching ? reportStranger : null}
          strangerLeft={strangerLeft}
          isSearching={isSearching}
        >
          <div className="flex flex-col flex-1 gap-2">
            <div className="flex items-center gap-4 my-2 shrink-0">
              <div className="h-px bg-echo-border flex-1"></div>
              <span className="text-xs font-bold text-echo-muted tracking-widest uppercase">Secured by Echo</span>
              <div className="h-px bg-echo-border flex-1"></div>
            </div>

            {messages.map((msg, idx) => {
              if (msg.type === 'system') {
                 return (
                    <div key={idx} className="text-center my-4 shrink-0 flex justify-center">
                       <span className={`inline-block px-4 py-2 rounded-full text-xs font-bold shadow-sm backdrop-blur-sm ${msg.content.includes('disconnected') ? 'bg-red-50/80 text-red-600 border border-red-200' : 'bg-[#1a1a1a]/5 text-[#1a1a1a] border border-echo-border'}`}>
                          {msg.content}
                       </span>
                    </div>
                 )
              }

              const currentUserId = user?.id || user?._id || 'anonymous';
              const msgSenderId = msg.sender?._id || msg.sender;
              const isSent = currentUserId === msgSenderId;
              const avatar = isSent ? (user?.avatar || user?.username?.charAt(0).toUpperCase() || 'U') : 'S';

              return (
                <MessageBubble
                  key={msg._id || idx}
                  message={msg.content}
                  isSent={isSent}
                  avatar={avatar}
                  timestamp={msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase() : ''}
                  fileUrl={msg.fileUrl}
                />
              );
            })}

            {strangerLeft && (
              <div className="flex flex-col items-center gap-4 my-8 shrink-0">
                <button
                  onClick={nextStranger}
                  className="px-8 py-3 bg-[#1a1a1a] text-echo-yellow rounded-full font-bold shadow-xl hover:bg-black transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <Search size={18} /> Find New Stranger
                </button>
              </div>
            )}

            <div ref={messagesEndRef} className="shrink-0" />
          </div>
        </ChatBox>
      </div>
    );
  }

  return null;
}
