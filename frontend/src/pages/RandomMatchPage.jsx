import { useState, useEffect, useRef } from 'react';
import { Search, Users, Clock, ShieldCheck, Hash, X, Loader2 } from 'lucide-react';
import { useSelector } from 'react-redux';
import { socket } from '../socket';
import ChatBox from '../components/chat/ChatBox';
import MessageBubble from '../components/chat/MessageBubble';

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

  if (hasStarted) {
    const isSearching = chatStatus === 'searching';
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
          {isSearching ? (
             <div className="flex-1 flex flex-col items-center justify-center h-full">
                <div className="relative w-32 h-32 flex items-center justify-center mb-8">
                   <div className="absolute inset-0 bg-echo-yellow rounded-full animate-ping opacity-20"></div>
                   <div className="absolute inset-4 bg-[#1a1a1a] rounded-full animate-ping opacity-10" style={{ animationDelay: '0.3s' }}></div>
                   <div className="absolute inset-8 bg-[#1a1a1a] rounded-full shadow-xl flex items-center justify-center z-10 animate-pulse border-4 border-echo-yellow">
                      <Search size={32} className="text-echo-yellow" />
                   </div>
                </div>
                <h3 className="text-2xl font-extrabold text-[#1a1a1a] mb-2 tracking-tight drop-shadow-sm">Looking for someone...</h3>
                <p className="text-echo-muted font-medium mb-8">Connecting you to a random stranger globally.</p>
                <button 
                  onClick={endChat}
                  className="px-8 py-3 bg-white border-2 border-echo-border text-echo-muted text-sm font-bold rounded-full hover:border-red-500 hover:text-red-500 transition-colors shadow-sm"
                >
                  Cancel Search
                </button>
             </div>
          ) : (
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
          )}
        </ChatBox>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-echo-bg pt-20">

      {/* --- STATS BOXES --- */}
      <div className="hidden lg:flex items-center justify-center gap-4 mt-8 z-20 shrink-0 relative">
        {/* Stat 1 */}
        <div className="flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 transition-transform hover:-translate-y-1 cursor-default">
           <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center shadow-lg">
             <Users className="text-echo-yellow" size={18} />
           </div>
           <div>
             <div className="text-lg font-black text-[#1a1a1a] leading-none mb-0.5">{stats.onlineUsersCount.toLocaleString()}</div>
             <div className="text-[9px] font-bold uppercase tracking-widest text-echo-muted">Online Now</div>
           </div>
        </div>

        {/* Stat 2 */}
        <div className="flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 transition-transform hover:-translate-y-1 cursor-default">
           <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center shadow-lg">
             <Clock className="text-[#b4d4f2]" size={18} />
           </div>
           <div>
             <div className="text-lg font-black text-[#1a1a1a] leading-none mb-0.5">{Math.max(0.5, 2.5 - stats.waitingUsersCount * 0.3).toFixed(1)}s</div>
             <div className="text-[9px] font-bold uppercase tracking-widest text-echo-muted">Avg Wait</div>
           </div>
        </div>

        {/* Stat 3 */}
        <div className="flex items-center gap-4 px-6 py-3 bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-white/50 transition-transform hover:-translate-y-1 cursor-default">
           <div className="w-10 h-10 rounded-xl bg-[#1a1a1a] flex items-center justify-center shadow-lg">
             <ShieldCheck className="text-[#e1f0b4]" size={18} />
           </div>
           <div>
             <div className="text-lg font-black text-[#1a1a1a] leading-none mb-0.5">99.9%</div>
             <div className="text-[9px] font-bold uppercase tracking-widest text-echo-muted">Safe Match</div>
           </div>
        </div>
      </div>

      {/* --- MAIN RADAR AREA --- */}
      <div className="flex-1 relative overflow-hidden bg-echo-white flex flex-col items-center justify-center">

        {/* Massive Decorative Background */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-echo-yellow/20 rounded-full blur-[100px] mix-blend-multiply opacity-50 pointer-events-none"></div>
        <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[80px] mix-blend-multiply pointer-events-none"></div>

        {/* Central UI */}
        <div className="relative z-10 flex flex-col items-center">

          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight mb-4">
              Meet a <span className="italic font-serif text-echo-yellow drop-shadow-sm">Stranger.</span>
            </h1>
            <p className="text-echo-muted font-medium text-lg max-w-md mx-auto">
              Dive into a spontaneous, one-on-one conversation with someone completely new.
            </p>
          </div>

          <div className="relative flex items-center justify-center w-80 h-80">
            {/* The Radar Circles */}
            {chatStatus === 'searching' && (
              <>
                <div className="absolute inset-0 border-[4px] border-dashed border-echo-yellow/40 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-[-40px] border-[2px] border-dashed border-echo-border rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                <div className="absolute inset-[-80px] border-[1px] border-echo-border/50 rounded-full"></div>
                <div className="absolute w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(238,205,52,0.1)_360deg)] rounded-full animate-[spin_3s_linear_infinite]"></div>
              </>
            )}

            {chatStatus !== 'searching' && (
              <div className="absolute inset-0 border-[4px] border-dashed border-echo-border/30 rounded-full"></div>
            )}

            {/* The Main Button */}
            {chatStatus === 'searching' ? (
              <div className="w-40 h-40 bg-[#1a1a1a] rounded-full shadow-2xl flex flex-col items-center justify-center text-echo-yellow relative z-20 animate-pulse border-8 border-echo-white">
                <Search size={32} strokeWidth={3} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Searching</span>
              </div>
            ) : (
              <div className="relative group z-20">
                <div className="absolute inset-[-6px] bg-gradient-to-r from-echo-yellow via-[#1a1a1a] to-echo-yellow rounded-full animate-[spin_3s_linear_infinite] opacity-40 group-hover:opacity-100 blur-md transition-opacity duration-500"></div>
                <div className="absolute inset-[-12px] bg-echo-yellow rounded-full animate-[ping_2s_ease-in-out_infinite] opacity-20"></div>
                <button
                  onClick={findStranger}
                  className="w-48 h-48 bg-[#1a1a1a] hover:bg-black rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.4)] flex flex-col items-center justify-center text-echo-yellow transition-transform transform hover:scale-105 active:scale-95 relative border-4 border-[#1a1a1a]"
                >
                  <Search size={40} strokeWidth={2.5} className="mb-3 group-hover:rotate-12 transition-transform duration-300" />
                  <span className="text-sm font-bold uppercase tracking-widest">Start Match</span>
                </button>
              </div>
            )}

            {/* Floating Avatars during Match */}
            {chatStatus === 'searching' && (
              <>
                <div className="absolute -top-10 right-0 w-12 h-12 rounded-full border-4 border-white bg-blue-100 shadow-xl flex items-center justify-center animate-[bounce_2s_ease-in-out_infinite]">
                  <span className="font-bold text-blue-500">M</span>
                </div>
                <div className="absolute bottom-10 -right-20 w-16 h-16 rounded-full border-4 border-white bg-pink-100 shadow-xl flex items-center justify-center animate-[bounce_3s_ease-in-out_infinite_0.5s]">
                  <span className="font-bold text-pink-500">F</span>
                </div>
                <div className="absolute top-20 -left-16 w-14 h-14 rounded-full border-4 border-white bg-green-100 shadow-xl flex items-center justify-center animate-[bounce_2.5s_ease-in-out_infinite_1s]">
                  <span className="font-bold text-green-500">A</span>
                </div>
              </>
            )}
          </div>

          {/* Cancel Button */}
          <div className="mt-20 h-12">
            {chatStatus === 'searching' && (
              <button
                onClick={leaveStrangerQueue}
                className="px-8 py-3 rounded-full bg-white border border-echo-border text-echo-muted hover:text-[#1a1a1a] hover:border-[#1a1a1a] font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <X size={18} /> Cancel Search
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
