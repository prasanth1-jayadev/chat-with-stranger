import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import ChatBox from './ChatBox';
import MessageBubble from './MessageBubble';
import UserProfileModal from '../UserProfileModal';
import roomService from '../../api/services/roomService';
import { socket } from '../../socket';

export default function RoomChatContainer({ activeChat, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const { user } = useSelector((state) => state.auth);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    if (!activeChat || !activeChat.id) return;

    const roomId = activeChat.id;
    setLoading(true);

    // Fetch message history
    roomService.getMessages(roomId)
      .then((data) => {
        if (isMounted) {
          setMessages(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch messages:', err);
        if (isMounted) setLoading(false);
      });

    // Join socket room
    socket.emit('join_room', roomId);

    // Listen for new messages
    const handleReceiveMessage = (message) => {
      if (message.room === roomId) {
        setMessages((prev) => [...prev, message]);
        // Since the chat is open, immediately mark as read
        roomService.markAsRead(roomId).catch(console.error);
      }
    };

    socket.on('receive_message', handleReceiveMessage);

    return () => {
      isMounted = false;
      socket.off('receive_message', handleReceiveMessage);
      socket.emit('leave_room', roomId);
    };
  }, [activeChat]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e, fileUrl = null) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !fileUrl) || !activeChat) return;

    const currentUserId = user?.id || user?._id;
    
    const messageData = {
      roomId: activeChat.id,
      senderId: currentUserId,
      content: newMessage,
      fileUrl: fileUrl
    };

    // Emit via socket
    socket.emit('send_message', messageData);
    setNewMessage('');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  };

  return (
    <ChatBox 
      activeChat={activeChat} 
      onClose={onClose} 
      type="group"
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      onSendMessage={handleSendMessage}
    >
      <div className="flex items-center gap-4 my-2 shrink-0">
        <div className="h-px bg-echo-border flex-1"></div>
        <span className="text-xs font-bold text-echo-muted tracking-widest uppercase">
          Welcome to {activeChat.name} • {messages.length} {messages.length === 1 ? 'Message' : 'Messages'}
        </span>
        <div className="h-px bg-echo-border flex-1"></div>
      </div>
      
      {loading ? (
        <div className="flex-1 flex items-center justify-center text-echo-muted">
          Loading messages...
        </div>
      ) : (
        messages.map((msg, idx) => {
          const currentUserId = user?.id || user?._id;
          const msgSenderId = msg.sender?._id || msg.sender;
          const isSent = currentUserId === msgSenderId;
          const avatar = msg.sender?.avatar || msg.sender?.username?.charAt(0).toUpperCase() || 'U';

          return (
            <MessageBubble
              key={msg._id || idx}
              message={msg.content}
              isSent={isSent}
              avatar={avatar}
              timestamp={formatTime(msg.createdAt)}
              onAvatarClick={() => setSelectedUserId(msgSenderId)}
              fileUrl={msg.fileUrl}
            />
          );
        })
      )}
      <div ref={messagesEndRef} className="shrink-0" />

      <UserProfileModal 
        isOpen={!!selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
        userId={selectedUserId} 
      />
    </ChatBox>
  );
}
