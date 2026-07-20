import { ArrowLeft, Phone, Video, Info, Smile, Mic, Send, Hash, Users, Image as ImageIcon, X, Loader2, Bold, Italic } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useSelector } from 'react-redux';
import ManageRequestsModal from './ManageRequestsModal';
import uploadService from '../../api/services/uploadService';

export default function ChatBox({ activeChat, onClose, type = 'group', children, newMessage = '', setNewMessage = () => {}, onSendMessage }) {
  const [showRequests, setShowRequests] = useState(false);
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (newMessage === '' && textInputRef.current) {
      textInputRef.current.innerHTML = '';
    }
  }, [newMessage]);

  if (!activeChat) return null;
  const currentUserId = user?.id || user?._id;
  const isAdmin = activeChat.admin && activeChat.admin === currentUserId;

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setAttachment(file);
    const reader = new FileReader();
    reader.onload = (e) => setAttachmentPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const removeAttachment = () => {
    setAttachment(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;
    if (uploading) return;

    let fileUrl = null;
    if (attachment) {
      setUploading(true);
      try {
         const res = await uploadService.uploadImage(attachment);
         fileUrl = res.imageUrl;
      } catch (err) {
         console.error('Upload failed', err);
         setUploading(false);
         return; // Stop on error
      }
      setUploading(false);
    }

    if (onSendMessage) {
      onSendMessage(e, fileUrl);
    }
    removeAttachment();
  };

  const onEmojiClick = (emojiObject) => {
    if (textInputRef.current) {
      textInputRef.current.innerHTML += emojiObject.emoji;
      setNewMessage(textInputRef.current.innerHTML);
    }
  };

  const checkFormatState = () => {
    if (document.activeElement === textInputRef.current) {
      setIsBold(document.queryCommandState('bold'));
      setIsItalic(document.queryCommandState('italic'));
    }
  };

  const handleFormat = (command) => {
    document.execCommand(command, false, null);
    if (textInputRef.current) {
      textInputRef.current.focus();
      setNewMessage(textInputRef.current.innerHTML);
      checkFormatState();
    }
  };

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
        {attachmentPreview && (
          <div className="mb-4 relative inline-block">
            <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-echo-yellow shadow-md">
              <img src={attachmentPreview} alt="attachment" className="w-full h-full object-cover" />
            </div>
            <button 
              onClick={removeAttachment}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full text-white flex items-center justify-center hover:scale-110 transition-transform shadow-sm"
              type="button"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <form 
          className="flex items-center gap-4"
          onSubmit={handleSubmit}
        >
          <div className="flex-1 border border-echo-border rounded-full bg-transparent flex items-center px-4 py-3">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className="hover:text-echo-text text-echo-muted transition-colors mr-3"
            >
              <ImageIcon size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*"
              className="hidden" 
            />
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); handleFormat('bold'); }}
              className={`transition-colors mr-2 p-1.5 rounded-md ${isBold ? 'text-echo-text bg-echo-border shadow-inner' : 'text-echo-muted hover:text-echo-text hover:bg-black/5'}`}
              title="Bold"
            >
              <Bold size={18} />
            </button>
            <button 
              type="button" 
              onClick={(e) => { e.preventDefault(); handleFormat('italic'); }}
              className={`transition-colors mr-3 p-1.5 rounded-md ${isItalic ? 'text-echo-text bg-echo-border shadow-inner' : 'text-echo-muted hover:text-echo-text hover:bg-black/5'}`}
              title="Italic"
            >
              <Italic size={18} />
            </button>
            <div 
              ref={textInputRef}
              contentEditable={!uploading}
              onInput={(e) => {
                setNewMessage(e.currentTarget.innerHTML);
                checkFormatState();
              }}
              onKeyUp={checkFormatState}
              onMouseUp={checkFormatState}
              className="flex-1 bg-transparent focus:outline-none text-[15px] font-medium min-h-[22px] max-h-32 overflow-y-auto outline-none break-words"
              data-placeholder={type === 'group' ? `message #${activeChat.name}...` : 'type a message...'}
            />
            <div className="flex items-center gap-3 text-echo-muted ml-3 relative" ref={emojiPickerRef}>
              <button 
                type="button" 
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="hover:text-echo-text transition-colors"
              >
                <Smile size={20} />
              </button>
              {showEmojiPicker && (
                <div className="absolute bottom-12 right-0 z-50">
                  <EmojiPicker onEmojiClick={onEmojiClick} theme="light" />
                </div>
              )}
              <button type="button" className="hover:text-echo-text transition-colors"><Mic size={20} /></button>
            </div>
          </div>
          <button 
            type="submit"
            className="w-12 h-12 rounded-full bg-[#1a1a1a] text-echo-yellow flex items-center justify-center shrink-0 hover:bg-black transition-colors shadow-md disabled:opacity-50"
            disabled={(!newMessage.trim() && !attachment) || uploading}
          >
            {uploading ? (
              <Loader2 size={20} className="animate-spin text-echo-yellow" />
            ) : (
              <Send size={20} className="ml-1" fill="currentColor" />
            )}
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
