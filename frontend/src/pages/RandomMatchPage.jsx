import { useState, useEffect } from 'react';
import { Search, Users, Clock, ShieldCheck, Hash, X } from 'lucide-react';
import ChatBox from '../components/chat/ChatBox';

export default function RandomMatchPage() {
  const [isMatching, setIsMatching] = useState(false);
  const [activeChat, setActiveChat] = useState(null);

  // Mock connecting delay
  const findStranger = () => {
    setIsMatching(true);
    setTimeout(() => {
      setIsMatching(false);
      setActiveChat({ id: 'random-1', name: 'stranger' });
    }, 4000); // 4 seconds for maximum drama
  };

  const leaveStrangerQueue = () => {
    setIsMatching(false);
  };

  // Handle escape key to leave chat
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeChat) {
        setActiveChat(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeChat]);

  if (activeChat) {
    return (
      <div className="flex-1 flex flex-col h-full pt-20">
        <ChatBox 
          activeChat={activeChat} 
          onClose={() => setActiveChat(null)} 
          type="random"
        >
          <div className="flex items-center gap-4 my-2">
            <div className="h-px bg-echo-border flex-1"></div>
            <span className="text-xs font-bold text-echo-muted tracking-widest uppercase">Connected</span>
            <div className="h-px bg-echo-border flex-1"></div>
          </div>

          <div className="text-center text-sm font-medium text-echo-muted my-10">
            You are now chatting with a random stranger. Say hi!
          </div>
        </ChatBox>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden bg-echo-bg pt-24">
      
      {/* --- STATS SIDEBAR --- */}
      <div className="hidden lg:flex w-80 bg-[#1a1a1a] text-white flex-col border-r border-[#333] shadow-2xl z-20">
        <div className="p-8 pb-0">
          <h2 className="text-2xl font-extrabold tracking-tight mb-2">Live Network</h2>
          <p className="text-white/50 text-sm font-medium mb-10">Real-time statistics for the random match queue.</p>
        </div>
        
        <div className="px-8 space-y-8 flex-1">
          {/* Stat 1 */}
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
               <Users className="text-echo-yellow" size={20} />
             </div>
             <div>
               <div className="text-2xl font-bold">14,204</div>
               <div className="text-xs font-bold uppercase tracking-widest text-white/50">Online Now</div>
             </div>
          </div>
          
          {/* Stat 2 */}
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
               <Clock className="text-[#b4d4f2]" size={20} />
             </div>
             <div>
               <div className="text-2xl font-bold">1.2s</div>
               <div className="text-xs font-bold uppercase tracking-widest text-white/50">Avg Wait Time</div>
             </div>
          </div>

          {/* Stat 3 */}
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
               <ShieldCheck className="text-[#e1f0b4]" size={20} />
             </div>
             <div>
               <div className="text-2xl font-bold">99.9%</div>
               <div className="text-xs font-bold uppercase tracking-widest text-white/50">Safe Connections</div>
             </div>
          </div>

          <div className="h-px w-full bg-white/10 my-10"></div>

          {/* Trending Tags */}
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-white/50 mb-4">Trending Match Tags</div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold flex items-center gap-1"><Hash size={12}/>tech</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold flex items-center gap-1"><Hash size={12}/>music</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold flex items-center gap-1"><Hash size={12}/>philosophy</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold flex items-center gap-1"><Hash size={12}/>late-night</span>
              <span className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold flex items-center gap-1"><Hash size={12}/>gaming</span>
            </div>
          </div>
        </div>

        <div className="p-8 text-center border-t border-white/10">
          <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold">Encrypted & Anonymous</p>
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
            {isMatching && (
              <>
                <div className="absolute inset-0 border-[4px] border-dashed border-echo-yellow/40 rounded-full animate-[spin_10s_linear_infinite]"></div>
                <div className="absolute inset-[-40px] border-[2px] border-dashed border-echo-border rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
                <div className="absolute inset-[-80px] border-[1px] border-echo-border/50 rounded-full"></div>
                <div className="absolute w-[300%] h-[300%] bg-[conic-gradient(from_0deg,transparent_0deg,transparent_270deg,rgba(238,205,52,0.1)_360deg)] rounded-full animate-[spin_3s_linear_infinite]"></div>
              </>
            )}

            {!isMatching && (
               <div className="absolute inset-0 border-[4px] border-dashed border-echo-border/30 rounded-full"></div>
            )}

            {/* The Main Button */}
            {isMatching ? (
              <div className="w-40 h-40 bg-[#1a1a1a] rounded-full shadow-2xl flex flex-col items-center justify-center text-echo-yellow relative z-20 animate-pulse border-8 border-echo-white">
                <Search size={32} strokeWidth={3} className="mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Searching</span>
              </div>
            ) : (
              <button 
                onClick={findStranger}
                className="w-48 h-48 bg-[#1a1a1a] hover:bg-black rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col items-center justify-center text-echo-yellow transition-transform transform hover:scale-105 active:scale-95 relative z-20 group border-8 border-echo-white"
              >
                <Search size={40} strokeWidth={2.5} className="mb-3 group-hover:rotate-12 transition-transform duration-300" />
                <span className="text-sm font-bold uppercase tracking-widest">Start Match</span>
              </button>
            )}

            {/* Floating Avatars during Match */}
            {isMatching && (
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
            {isMatching && (
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
