import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { SmilePlus, Crown, Trash2, Play, Pause, Pin } from 'lucide-react';
import { socket } from '../../socket';
import { useSelector } from 'react-redux';

function AudioMessagePlayer({ src, isSent }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);
  const requestRef = useRef();

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
    requestRef.current = requestAnimationFrame(updateProgress);
  };

  useEffect(() => {
    if (isPlaying) {
      requestRef.current = requestAnimationFrame(updateProgress);
    } else {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    }
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isPlaying]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(err => console.error('Audio play error:', err));
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const formatAudioTime = (sec) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className={`flex items-center gap-3 py-1 px-1 min-w-[210px] sm:min-w-[250px] max-w-[280px] ${isSent ? 'text-[#1a1a1a]' : 'text-[#1a1a1a]'}`}>
      <audio
        ref={audioRef}
        src={src}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onLoadedMetadata={handleLoadedMetadata}
        preload="metadata"
        className="hidden"
      />

      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-xs transition-transform active:scale-95 cursor-pointer ${
          isSent
            ? 'bg-[#1a1a1a] text-echo-yellow hover:bg-black'
            : 'bg-echo-yellow text-[#1a1a1a] hover:bg-yellow-400'
        }`}
      >
        {isPlaying ? (
          <Pause size={17} fill="currentColor" />
        ) : (
          <Play size={17} fill="currentColor" className="ml-0.5" />
        )}
      </button>

      <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
        <input
          type="range"
          min="0"
          max={duration || 100}
          step="0.01"
          value={currentTime}
          onChange={handleSeek}
          className="w-full h-1.5 bg-black/15 rounded-lg appearance-none cursor-pointer accent-[#1a1a1a]"
        />
        <div className="flex justify-between text-[10px] font-extrabold text-black/60 leading-none">
          <span>{formatAudioTime(currentTime)}</span>
          <span>{formatAudioTime(duration)}</span>
        </div>
      </div>
    </div>
  );
}

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
      if (tag === 'br') {
        return <br key={index} />;
      }
      if (['div', 'p'].includes(tag)) {
        return <div key={index}>{Array.from(node.childNodes).map((child, i) => convertNode(child, i))}</div>;
      }
      // For any other tag (span, script, etc), just render its content safely
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
  isCurrentAdmin,
  canDelete,
  onDeleteMessage,
  onPinMessage
}) {
  const [showPicker, setShowPicker] = useState(false);
  const pickerRef = useRef(null);
  const { user } = useSelector((state) => state.auth);
  
  const hasText = message && message.trim().length > 0;
  const isAudio = fileUrl && (
    fileUrl.match(/\.(webm|mp3|wav|ogg|m4a|aac|opus)($|\?)/i) || 
    fileUrl.includes('/video/upload/') || 
    fileUrl.includes('/raw/upload/') || 
    fileUrl.includes('/audio/upload/') ||
    fileUrl.includes('voice-message')
  );

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
    ? `${isAudio && !hasText ? 'p-2 sm:p-3' : 'p-4'} text-[15px] leading-relaxed font-medium ${isSent
      ? 'bg-echo-yellow border border-[#d4b931] rounded-2xl rounded-br-sm'
      : 'bg-[#f0ece1] border border-echo-border rounded-2xl rounded-bl-sm'
    }`
    : '';

  return (
    <div className={`flex gap-2 sm:gap-4 max-w-[92%] sm:max-w-[85%] relative group ${isSent ? 'self-end flex-row-reverse' : ''}`}>
      <div className="relative shrink-0 mt-auto mb-5 sm:mb-6">
        <button
          type="button"
          onClick={onAvatarClick}
          disabled={!onAvatarClick}
          className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold overflow-hidden ${isSent ? 'bg-echo-bg border border-echo-border' : 'bg-echo-border text-echo-text'} ${onAvatarClick ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
        >
          {avatar && avatar.length > 2 ? (
            <img src={avatar} alt="avatar" className="w-full h-full object-cover" />
          ) : (
            <span>{avatar}</span>
          )}
        </button>
        {isRoomAdmin && (
          <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-0.5 border-2 border-echo-white z-10 shadow-sm pointer-events-none" title="Room Admin">
            <Crown size={10} fill="currentColor" strokeWidth={2} />
          </div>
        )}
      </div>
      
      <div className={`flex flex-col gap-1 relative min-w-0 ${isSent ? 'items-end' : ''}`}>
        <div className={bubbleClasses}>
          {fileUrl && (
            <div className={`${hasText ? 'mb-2' : ''} max-w-xs rounded-xl overflow-hidden ${hasText && !isAudio ? 'shadow-sm border border-black/5' : ''}`}>
              {isAudio ? (
                <AudioMessagePlayer src={fileUrl} isSent={isSent} />
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

          {isCurrentAdmin && hasText && onPinMessage && (
            <button
              onClick={() => onPinMessage(message)}
              className="p-1.5 bg-white border border-echo-border rounded-full text-echo-muted hover:text-amber-700 hover:bg-amber-50 shadow-sm transition-colors"
              title="Pin this message"
            >
              <Pin size={14} className="rotate-45" />
            </button>
          )}

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
