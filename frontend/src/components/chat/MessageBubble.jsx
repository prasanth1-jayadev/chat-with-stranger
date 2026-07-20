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

export default function MessageBubble({ message, isSent, avatar, timestamp, onAvatarClick, fileUrl }) {
  const hasText = message && message.trim().length > 0;
  
  const bubbleClasses = hasText 
    ? `p-4 text-[15px] leading-relaxed font-medium ${
        isSent 
          ? 'bg-echo-yellow border border-[#d4b931] rounded-2xl rounded-br-sm' 
          : 'bg-[#f0ece1] border border-echo-border rounded-2xl rounded-bl-sm'
      }`
    : '';

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
        <div className={bubbleClasses}>
          {fileUrl && (
            <div className={`${hasText ? 'mb-2' : ''} max-w-xs rounded-xl overflow-hidden ${hasText ? 'shadow-sm border border-black/5' : ''}`}>
              <img src={fileUrl} alt="attachment" className="w-full h-auto object-cover" />
            </div>
          )}
          {hasText && formatMessage(message)}
        </div>
        <span className="text-[10px] text-echo-muted font-bold px-1">{timestamp}</span>
      </div>
    </div>
  );
}
