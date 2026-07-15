import { ArrowLeft, Phone, Video, Info, Smile, Mic, Send, Hash } from 'lucide-react';

export default function ChatBox({ activeChat, onClose, type = 'group', children }) {
  if (!activeChat) return null;

  return (
    <div className="flex-1 flex flex-col bg-echo-white relative h-full">
      {/* Chat Header */}
      <div className="h-20 border-b border-echo-border flex items-center justify-between px-8 bg-echo-white z-10 shrink-0">
        <div className="flex items-center gap-4">
          {onClose && (
            <button 
              onClick={onClose}
              className="mr-2 p-2 rounded-full hover:bg-echo-bg transition-colors"
            >
              <ArrowLeft size={24} className="text-echo-text" />
            </button>
          )}

          <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg ${type === 'group' ? 'bg-echo-border text-echo-muted' : 'bg-echo-border'}`}>
            {type === 'group' ? (
               <Hash size={24} />
            ) : type === 'random' ? (
               <span className="text-2xl">?</span>
            ) : (
               activeChat.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h2 className="font-bold text-lg leading-tight">{activeChat.name}</h2>
            <p className="text-xs font-semibold mt-0.5 text-echo-muted">
               {type === 'group' ? `${activeChat.members || 0} members online` : type === 'random' ? 'connected' : 'active now'}
            </p>
          </div>
        </div>
        
        {/* Header Actions (Only for DMs for now) */}
        {type === 'dm' && (
          <div className="flex items-center gap-6 text-echo-text">
            <button className="hover:opacity-70 transition-opacity"><Phone size={20} /></button>
            <button className="hover:opacity-70 transition-opacity"><Video size={22} /></button>
            <button className="hover:opacity-70 transition-opacity"><Info size={20} /></button>
          </div>
        )}
      </div>
      
      {/* Chat Messages Area (Injected via children) */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 flex flex-col gap-6">
        {children}
      </div>

      {/* Input Area */}
      <div className="px-6 md:px-8 pb-8 pt-4 bg-echo-white border-t border-echo-border shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex-1 border border-echo-border rounded-full bg-transparent flex items-center px-4 py-3">
            <input 
              type="text" 
              placeholder={type === 'group' ? `message #${activeChat.name}...` : 'type a message...'} 
              className="flex-1 bg-transparent focus:outline-none text-[15px] font-medium placeholder:text-echo-muted"
            />
            <div className="flex items-center gap-3 text-echo-muted">
              <button className="hover:text-echo-text transition-colors"><Smile size={20} /></button>
              <button className="hover:text-echo-text transition-colors"><Mic size={20} /></button>
            </div>
          </div>
          <button className="w-12 h-12 rounded-full bg-[#1a1a1a] text-echo-yellow flex items-center justify-center shrink-0 hover:bg-black transition-colors shadow-md">
            <Send size={20} className="ml-1" fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
