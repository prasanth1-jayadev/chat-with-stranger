export default function MessageBubble({ message, isSent, avatar, timestamp, onAvatarClick }) {
  return (
    <div className={`flex gap-4 max-w-[85%] ${isSent ? 'self-end flex-row-reverse' : ''}`}>
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
      </button>
      <div className={`flex flex-col gap-1 ${isSent ? 'items-end' : ''}`}>
        <div className={`p-4 text-[15px] leading-relaxed font-medium ${
          isSent 
            ? 'bg-echo-yellow border border-[#d4b931] rounded-2xl rounded-br-sm' 
            : 'bg-[#f0ece1] border border-echo-border rounded-2xl rounded-bl-sm'
        }`}>
          {message}
        </div>
        <span className="text-[10px] text-echo-muted font-bold px-1">{timestamp}</span>
      </div>
    </div>
  );
}
