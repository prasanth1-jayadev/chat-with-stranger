import { ArrowLeft, Phone, Video, Info, Smile, Mic, Send, Hash, Users, Image as ImageIcon, X, Loader2, Bold, Italic, SkipForward, AlertTriangle, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useSelector } from 'react-redux';
import ManageRequestsModal from './ManageRequestsModal';
import EditGroupModal from '../EditGroupModal';
import uploadService from '../../api/services/uploadService';

export default function ChatBox({ activeChat, setActiveChat, onClose, type = 'group', children, newMessage = '', setNewMessage = () => { }, onSendMessage, onTyping, onSkip, onStop, onSave, hasSaved, onReport, strangerLeft, isSearching }) {
  const [showRequests, setShowRequests] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const fileInputRef = useRef(null);
  const textInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
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

  // Cleanup timers and streams on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
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

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        audioChunksRef.current = [];
        stream.getTracks().forEach(track => track.stop());
        
        setUploading(true);
        try {
          const res = await uploadService.uploadAudio(audioBlob);
          if (onSendMessage) {
            onSendMessage(null, res.audioUrl);
          }
        } catch (err) {
          console.error('Audio upload failed', err);
        }
        setUploading(false);
      };

      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingDuration(0);
      
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
    } catch (err) {
      console.error('Error accessing microphone', err);
      alert('Could not access microphone');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      clearInterval(timerRef.current);
    }
  };

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
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

          {type !== 'random' && (
            <div className={`w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg ${type === 'group' ? 'bg-echo-border text-echo-muted' : 'bg-echo-border'}`}>
              {type === 'group' ? (
                <Hash size={24} />
              ) : (
                activeChat.name.charAt(0).toUpperCase()
              )}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-lg leading-tight">
                {type === 'random' ? 'Stranger' : activeChat.name}
              </h2>
              {type === 'random' && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
              )}
            </div>
            <p className="text-xs font-semibold mt-0.5 text-echo-muted">
              {type === 'group'
                ? (activeChat.isPrivate ? `${activeChat.members || 0} / 50 members online` : `${activeChat.members || 0} members online`)
                : type === 'random' ? 'Connected securely' : (activeChat.isOnline ? 'Online' : 'Offline')}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-6 text-echo-text">
          {type === 'random' && (
            <div className="flex items-center gap-3">
              {onReport && (
                <button
                  onClick={onReport}
                  className="flex items-center gap-2 px-4 py-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-full transition-colors"
                >
                  <AlertTriangle size={16} /> Report
                </button>
              )}
            </div>
          )}
          {type === 'group' && isAdmin && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-echo-bg rounded-full text-xs font-bold hover:bg-echo-border transition-colors"
                title="Edit Room Settings"
              >
                <Settings size={16} /> Edit Room
              </button>
              <button
                onClick={() => setShowRequests(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-echo-bg rounded-full text-xs font-bold hover:bg-echo-border transition-colors"
              >
                <Users size={16} /> Manage Requests
              </button>
            </>
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
              contentEditable={!uploading && !isSearching}
              onInput={(e) => {
                setNewMessage(e.currentTarget.innerHTML);
                checkFormatState();
                if (onTyping) onTyping();
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
              {isRecording ? (
                <div className="flex items-center gap-2 text-red-500 font-bold bg-red-50 px-2 py-1 rounded-full animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {formatDuration(recordingDuration)}
                </div>
              ) : null}
              <button 
                type="button" 
                onClick={isRecording ? stopRecording : startRecording}
                className={`transition-colors ${isRecording ? 'text-red-500 hover:text-red-600' : 'hover:text-echo-text'}`}
                title={isRecording ? "Stop & Send Audio" : "Record Audio"}
              >
                <Mic size={20} />
              </button>
            </div>
          </div>
          
          {/* Random Match Actions */}
          {type === 'random' && !isSearching && !strangerLeft && (
            <div className="flex items-center gap-2 shrink-0">
              {onSave && (
                <button
                  type="button"
                  onClick={onSave}
                  disabled={hasSaved}
                  className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all shadow-sm ${hasSaved ? 'bg-pink-500 border-pink-500 text-white' : 'bg-transparent border-pink-200 text-pink-500 hover:bg-pink-50 hover:border-pink-300'}`}
                  title={hasSaved ? "Save Request Sent" : "Save Chat (Add Friend)"}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={hasSaved ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
              )}
              {onStop && (
                <button
                  type="button"
                  onClick={onStop}
                  className="w-12 h-12 rounded-full border-2 border-red-100 text-red-500 flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition-colors bg-transparent shadow-sm"
                  title="Stop Match"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              )}
              {onSkip && (
                <button
                  type="button"
                  onClick={onSkip}
                  className="w-12 h-12 rounded-full bg-echo-yellow text-[#1a1a1a] flex items-center justify-center hover:brightness-95 transition-all shadow-sm font-bold"
                  title="Next Stranger"
                >
                  <SkipForward size={18} strokeWidth={2.5} />
                </button>
              )}
            </div>
          )}

          <button
            type="submit"
            className="w-12 h-12 rounded-full bg-[#1a1a1a] text-echo-yellow flex items-center justify-center shrink-0 hover:bg-black transition-colors shadow-md disabled:opacity-50"
            disabled={(!newMessage.trim() && !attachment) || uploading || isSearching}
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
      <EditGroupModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        activeChat={activeChat}
        onUpdateSuccess={(updatedRoom) => {
          if (setActiveChat && updatedRoom) {
            setActiveChat(prev => ({
              ...prev,
              name: updatedRoom.name,
              description: updatedRoom.description,
              logoUrl: updatedRoom.logoUrl,
              tags: updatedRoom.tags
            }));
          }
          setToastMsg('Room updated successfully!');
          setTimeout(() => setToastMsg(''), 4000);
        }}
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-6 py-3.5 bg-gray-900 text-white rounded-full shadow-2xl animate-[bounceIn_0.5s_cubic-bezier(0.175,0.885,0.32,1.275)] transition-all">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
          <span className="font-semibold text-sm tracking-wide">{toastMsg}</span>
        </div>
      )}

      <style>
        {`
          @keyframes bounceIn {
            0% { transform: translate(-50%, -20px); opacity: 0; }
            60% { transform: translate(-50%, 10px); opacity: 1; }
            100% { transform: translate(-50%, 0); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
}
