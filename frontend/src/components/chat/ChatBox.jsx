import { ArrowLeft, Phone, Video, Info, Smile, Mic, Send, Hash, Users } from 'lucide-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import ManageRequestsModal from './ManageRequestsModal';

export default function ChatBox({ activeChat, onClose, type = 'group', children, newMessage = '', setNewMessage = () => {}, onSendMessage }) {
  const [showRequests, setShowRequests] = useState(false);
  const { user } = useSelector((state) => state.auth);

  if (!activeChat) return null;
  const currentUserId = user?.id || user?._id;
  const isAdmin = activeChat.admin && activeChat.admin === currentUserId;

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
               {type === 'group' 
                 ? (activeChat.isPrivate ? `${activeChat.members || 0} / 50 members online` : `${activeChat.members || 0} members online`) 
                 : type === 'random' ? 'connected' : 'active now'}
            </p>
          </div>
        </div>
        
        {/* Header Actions */}
        <div className="flex items-center gap-6 text-echo-text">
          {type === 'group' && isAdmin && (
            <button 
              onClick={() => setShowRequests(true)}
              className="flex items-center gap-2 px-3 py-1.5 bg-echo-bg rounded-full text-xs font-bold hover:bg-echo-border transition-colors"
            >
              <Users size={16} /> Manage Requests
            </button>
          )}
          {type === 'dm' && (
            <>
              <button className="hover:opacity-70 transition-opacity"><Phone size={20} /></button>
              <button className="hover:opacity-70 transition-opacity"><Video size={22} /></button>
              <button className="hover:opacity-70 transition-opacity"><Info size={20} /></button>
            </>
          )}
        </div>
      </div>
      
      {/* Chat Messages Area (Injected via children) */}
      <div className="flex-1 overflow-y-auto px-6 md:px-12 py-8 flex flex-col gap-6">
        {children}
      </div>

    {/* Input Area */}
      <div className="px-6 md:px-8 pb-8 pt-4 bg-echo-white border-t border-echo-border shrink-0">
        <form 
          className="flex items-center gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (onSendMessage && newMessage.trim()) {
              onSendMessage(e);
            }
          }}
        >
          <div className="flex-1 border border-echo-border rounded-full bg-transparent flex items-center px-4 py-3">
            <input 
              type="text" 
              placeholder={type === 'group' ? `message #${activeChat.name}...` : 'type a message...'} 
              className="flex-1 bg-transparent focus:outline-none text-[15px] font-medium placeholder:text-echo-muted"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
            />
            <div className="flex items-center gap-3 text-echo-muted">
              <button type="button" className="hover:text-echo-text transition-colors"><Smile size={20} /></button>
              <button type="button" className="hover:text-echo-text transition-colors"><Mic size={20} /></button>
            </div>
          </div>
          <button 
            type="submit"
            className="w-12 h-12 rounded-full bg-[#1a1a1a] text-echo-yellow flex items-center justify-center shrink-0 hover:bg-black transition-colors shadow-md disabled:opacity-50"
            disabled={!newMessage.trim()}
          >
            <Send size={20} className="ml-1" fill="currentColor" />
          </button>
        </form>
      </div>

      <ManageRequestsModal 
        isOpen={showRequests} 
        onClose={() => setShowRequests(false)} 
        roomId={activeChat.id} 
      />
    </div>
  );
}
