import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { SmilePlus, Crown, Trash2 } from 'lucide-react';
import { socket } from '../../socket';
import { useSelector } from 'react-redux';

const formatMessage = (htmlString) => {
  if (!htmlString) return null;
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlString;

  const convertNode = (node, index) => {
    if (node.nodeType === 3) return node.textContent; // Text node
    if (node.nodeType === 1) { // Element node
      const tag = node.tagName.toLowerCase();
      if (['b', 'strong'].includes(tag)) {
        return <strong key={index}>{Array.from(node.childNodes).map((child, i) => convertNode(child, i))}</strong>;
      }
      if (['i', 'em'].includes(tag)) {
        return <em key={index}>{Array.from(node.childNodes).map((child, i) => convertNode(child, i))}</em>;
      }
      // For any other tag (div, span, script, etc), just render its content safely
      return <span key={index}>{Array.from(node.childNodes).map((child, i) => convertNode(child, i))}</span>;
    }
    return null;
  };

  return Array.from(tempDiv.childNodes).map((child, i) => convertNode(child, i));
};

export default function MessageBubble({ 
  message, 
  isSent, 
  avatar, 
  timestamp, 
  onAvatarClick, 
  fileUrl, 
  reactions = [], 
  messageId, 
  roomId, 
  isRoomAdmin,
  canDelete,
  onDeleteMessage
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  
  const hasText = message && message.trim().length > 0;
  const isAudio = fileUrl && (fileUrl.match(/\.(webm|mp3|wav|ogg)$/i) || fileUrl.includes('/video/upload/'));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReact = (emojiObject) => {
    if (!messageId || !roomId || !user) return;
    
    socket.emit('add_reaction', {
      messageId,
      roomId,
      userId: user.id || user._id,
      emoji: emojiObject.emoji
    });
    setShowPicker(false);
  };

  const groupedReactions = reactions?.reduce((acc, curr) => {
    if (!acc[curr.emoji]) acc[curr.emoji] = { count: 0, users: [] };
    acc[curr.emoji].count += 1;
    acc[curr.emoji].users.push(curr.user);
    return acc;
  }, {}) || {};

  const bubbleClasses = hasText || isAudio
    ? `p-4 text-[15px] leading-relaxed font-medium ${isSent
      ? 'bg-echo-yellow border border-[#d4b931] rounded-2xl rounded-br-sm'
      : 'bg-[#f0ece1] border border-echo-border rounded-2xl rounded-bl-sm'
    }`
    : '';

  return (
    <div className={`flex gap-4 max-w-[85%] relative group ${isSent ? 'self-end flex-row-reverse' : ''}`}>
      <button
        onClick={onAvatarClick}
        disabled={!onAvatarClick}
        className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center font-bold mt-auto mb-6 overflow-hidden ${isSent ? 'bg-echo-bg border border-echo-border' : 'bg-echo-border relative'} ${onAvatarClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
      >
        {avatar && avatar.length > 2 ? (
          <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          avatar
        )}
        {!isSent && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-0.5 border-2 border-echo-white z-10">
            <div className="w-2 h-2 bg-white rounded-full mix-blend-overlay"></div>
          </div>
        )}
        {isRoomAdmin && (
          <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 border-2 border-echo-white z-10 shadow-sm" title="Room Admin">
            <Crown size={10} fill="currentColor" strokeWidth={2} />
          </div>
        )}
      </button>
      
      <div className={`flex flex-col gap-1 relative ${isSent ? 'items-end' : ''}`}>
        <div className={bubbleClasses}>
          {fileUrl && (
            <div className={`${hasText ? 'mb-2' : ''} max-w-xs rounded-xl overflow-hidden ${hasText && !isAudio ? 'shadow-sm border border-black/5' : ''}`}>
              {isAudio ? (
                <div className="bg-white/50 rounded-full overflow-hidden w-[260px]">
                  <audio controls controlsList="nodownload noplaybackrate" src={fileUrl} className="w-full h-[44px] outline-none" />
                </div>
              ) : (
                <img src={fileUrl} alt="attachment" className="w-full h-auto object-cover" />
              )}
            </div>
          )}
          {hasText && formatMessage(message)}
        </div>
        
        {/* Reactions Display */}
        {Object.keys(groupedReactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isSent ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(groupedReactions).map(([emoji, data]) => {
              const currentUserId = user?.id || user?._id;
              const hasReacted = data.users.includes(currentUserId) || data.users.some(u => u._id === currentUserId);
              
              return (
                <button
                  key={emoji}
                  onClick={() => handleReact({ emoji })}
                  className={`px-2 py-0.5 text-xs rounded-full border flex items-center gap-1 transition-colors ${hasReacted ? 'bg-echo-yellow/30 border-echo-yellow' : 'bg-white border-echo-border hover:bg-gray-50'}`}
                >
                  <span>{emoji}</span>
                  <span className="font-bold text-echo-muted">{data.count}</span>
                </button>
              );
            })}
          </div>
        )}
        
        <span className="text-[10px] text-echo-muted font-bold px-1">{timestamp}</span>
      </div>

      {/* Action Buttons (Visible on Hover) */}
      {messageId && (
        <div className={`absolute -top-3 opacity-0 group-hover:opacity-100 transition-opacity z-10 flex items-center gap-1 ${isSent ? 'left-2' : 'right-2'}`}>
          <div className="relative">
            <button 
              onClick={() => setShowPicker(!showPicker)}
              className="p-1.5 bg-white border border-echo-border rounded-full text-echo-muted hover:text-echo-text shadow-sm"
              title="Add reaction"
            >
              <SmilePlus size={15} />
            </button>
            {showPicker && (
              <div ref={pickerRef} className={`absolute z-50 bottom-full mb-2 ${isSent ? 'left-0' : 'right-0'}`}>
                <EmojiPicker onEmojiClick={handleReact} theme="light" width={280} height={350} />
              </div>
            )}
          </div>

          {canDelete && onDeleteMessage && (
            <button
              onClick={() => onDeleteMessage(messageId)}
              className="p-1.5 bg-white border border-echo-border rounded-full text-echo-muted hover:text-red-600 hover:bg-red-50 shadow-sm transition-colors"
              title="Delete message"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
