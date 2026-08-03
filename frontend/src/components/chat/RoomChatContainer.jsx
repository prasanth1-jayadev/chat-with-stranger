import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import ChatBox from './ChatBox';
import MessageBubble from './MessageBubble';
import UserProfileModal from '../UserProfileModal';
import roomService from '../../api/services/roomService';
import { socket } from '../../socket';


export default function RoomChatContainer({ activeChat, setActiveChat, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [typingUsers, setTypingUsers] = useState(new Set());
  const { user } = useSelector((state) => state.auth);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const currentUserId = user?.id || user?._id;

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

    const handleUserTyping = (data) => {
      setTypingUsers((prev) => new Set(prev).add(data.username));
    };

    const handleUserStoppedTyping = (data) => {
      setTypingUsers((prev) => {
        const next = new Set(prev);
        next.delete(data.username);
        return next;
      });
    };

    const handleReceiveReaction = (data) => {
      setMessages((prev) => prev.map(msg => 
        (msg._id === data.messageId || msg.id === data.messageId) ? { ...msg, reactions: data.reactions } : msg
      ));
    };

    socket.on('user_typing', handleUserTyping);
    socket.on('user_stopped_typing', handleUserStoppedTyping);
    socket.on('receive_reaction', handleReceiveReaction);

    const handleUserRemoved = (data) => {
      if (data.userId === currentUserId && data.roomId === roomId) {
        alert("You have been removed from this room by the admin.");
        onClose();
      }
    };
    socket.on('user_removed', handleUserRemoved);

    const handleUserBanned = (data) => {
      if (data.userId === currentUserId && data.roomId === roomId) {
        alert("You have been banned from this room by the admin.");
        onClose();
      }
    };
    socket.on('user_banned', handleUserBanned);

    const handleRoomDeleted = (data) => {
      if (data.roomId === roomId) {
        alert("This group has been deleted by the admin.");
        onClose();
      }
    };
    socket.on('room_deleted', handleRoomDeleted);

    const handleRoomUpdated = (data) => {
      if (data.roomId === roomId && setActiveChat) {
        setActiveChat(prev => ({
          ...prev,
          name: data.name,
          description: data.description,
          tags: data.tags,
          logoUrl: data.logoUrl,
          isPrivate: data.isPrivate,
          requiresApproval: data.requiresApproval,
          maxCapacity: data.maxCapacity
        }));
      }
    };
    socket.on('room_updated', handleRoomUpdated);

    const handleMessageDeleted = (data) => {
      if (data.roomId === roomId) {
        setMessages((prev) => prev.filter((m) => (m._id || m.id) !== data.messageId));
      }
    };
    socket.on('message_deleted', handleMessageDeleted);

    const handleRoomPinnedUpdated = (data) => {
      if (data.roomId === roomId && setActiveChat) {
        setActiveChat(prev => ({ ...prev, pinnedAnnouncement: data.pinnedAnnouncement }));
      }
    };
    socket.on('room_pinned_updated', handleRoomPinnedUpdated);

    return () => {
      isMounted = false;
      socket.off('receive_message', handleReceiveMessage);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stopped_typing', handleUserStoppedTyping);
      socket.off('receive_reaction', handleReceiveReaction);
      socket.off('user_removed', handleUserRemoved);
      socket.off('user_banned', handleUserBanned);
      socket.off('room_deleted', handleRoomDeleted);
      socket.off('room_updated', handleRoomUpdated);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('room_pinned_updated', handleRoomPinnedUpdated);
      socket.emit('leave_room', roomId);
    };
  }, [activeChat, currentUserId, onClose, setActiveChat]);

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleDeleteMessage = async (messageId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await roomService.deleteMessage(activeChat.id, messageId);
      setMessages(prev => prev.filter(m => (m._id || m.id) !== messageId));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete message');
    }
  };

  const handleSendMessage = (e, fileUrl = null) => {
    e?.preventDefault();
    if ((!newMessage.trim() && !fileUrl) || !activeChat) return;
    
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

  const handleTyping = () => {
    if (!activeChat) return;
    
    // Clear the existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    socket.emit('typing', { roomId: activeChat.id, username: user.username });
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', { roomId: activeChat.id, username: user.username });
    }, 1500);
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  };

  return (
    <ChatBox 
      activeChat={activeChat}
      setActiveChat={setActiveChat}
      onClose={onClose} 
      type={activeChat.type || "group"}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      onSendMessage={handleSendMessage}
      onTyping={handleTyping}
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
          const adminIdStr = (activeChat.admin?._id || activeChat.admin)?.toString();
          const currentUserIdStr = (user?.id || user?._id)?.toString();
          const msgSenderId = (msg.sender?._id || msg.sender)?.toString();
          const isSent = currentUserIdStr === msgSenderId;
          const isCurrentAdmin = Boolean(adminIdStr && currentUserIdStr && adminIdStr === currentUserIdStr);
          const isSenderAdmin = Boolean(adminIdStr && msgSenderId && adminIdStr === msgSenderId);
          const canDelete = isCurrentAdmin || isSent;
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
              reactions={msg.reactions}
              messageId={msg._id || msg.id}
              roomId={activeChat.id}
              isRoomAdmin={isSenderAdmin}
              canDelete={canDelete}
              onDeleteMessage={handleDeleteMessage}
            />
          );
        })
      )}
      
      {typingUsers.size > 0 && (
        <div className="text-xs text-echo-muted italic shrink-0 px-2 animate-pulse">
          {Array.from(typingUsers).join(', ')} {typingUsers.size === 1 ? 'is' : 'are'} typing...
        </div>
      )}
      
      <div ref={messagesEndRef} className="shrink-0" />

      <UserProfileModal 
        isOpen={!!selectedUserId} 
        onClose={() => setSelectedUserId(null)} 
        userId={selectedUserId}
        roomId={activeChat.id}
        isAdmin={currentUserId === activeChat.admin}
      />
    </ChatBox>
  );
}
