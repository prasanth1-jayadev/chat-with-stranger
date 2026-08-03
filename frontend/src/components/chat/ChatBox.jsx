import { ArrowLeft, Phone, Video, Info, Smile, Mic, Send, Hash, Users, Image as ImageIcon, X, Loader2, Bold, Italic, SkipForward, AlertTriangle, Settings, LogOut, Pin } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import EmojiPicker from 'emoji-picker-react';
import { useSelector } from 'react-redux';
import ManageRequestsModal from './ManageRequestsModal';
import EditGroupModal from '../EditGroupModal';
import uploadService from '../../api/services/uploadService';
import roomService from '../../api/services/roomService';

export default function ChatBox({ activeChat, setActiveChat, onClose, type = 'group', children, newMessage = '', setNewMessage = () => { }, onSendMessage, onTyping, onSkip, onStop, onSave, hasSaved, onReport, strangerLeft, isSearching }) {
  const [showRequests, setShowRequests] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [savingPin, setSavingPin] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [attachmentPreview, setAttachmentPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);

  const handleOpenPinModal = () => {
    setPinInput(activeChat?.pinnedAnnouncement?.text || '');
    setShowPinModal(true);
  };

  const handleSavePin = async (e) => {
    e.preventDefault();
    setSavingPin(true);
    try {
      const updated = await roomService.updatePinnedAnnouncement(activeChat.id, pinInput);
      if (setActiveChat) {
        setActiveChat(prev => ({ ...prev, pinnedAnnouncement: updated }));
      }
      setShowPinModal(false);
      setToastMsg(pinInput ? 'Pinned announcement saved!' : 'Pinned announcement removed!');
      setTimeout(() => setToastMsg(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update pinned announcement');
    } finally {
      setSavingPin(false);
    }
  };
  
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
  const currentUserId = (user?.id || user?._id)?.toString();
  const roomAdminId = (activeChat.admin?._id || activeChat.admin)?.toString();
  const isAdmin = Boolean(roomAdminId && currentUserId && roomAdminId === currentUserId);

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

          {type === 'dm' && activeChat?.avatar && (
            <div className="w-10 h-10 rounded-full overflow-hidden border border-echo-border shrink-0">
              <img src={activeChat.avatar} alt="User Avatar" className="w-full h-full object-cover" />
            </div>
          )}
          {type === 'group' && (
            <div className="w-10 h-10 rounded-full bg-echo-bg border border-echo-border flex items-center justify-center shrink-0 overflow-hidden">
              {activeChat.logoUrl ? (
                <img src={activeChat.logoUrl} alt="Group Logo" className="w-full h-full object-cover" />
              ) : (
                <Hash size={20} className="text-echo-muted" />
              )}
            </div>
          )}
          {type === 'random' && (
            <div className="w-10 h-10 rounded-full bg-echo-border flex items-center justify-center font-bold text-echo-text">
              S
            </div>
          )}

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-extrabold text-echo-text text-base md:text-lg">
                {type === 'random' ? 'Stranger' : activeChat.name}
              </h2>
              {type === 'random' && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                </span>
              )}
              {type === 'group' && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${activeChat.isPrivate ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                  {activeChat.isPrivate ? 'Private' : 'Public'}
                </span>
              )}
            </div>
            {type === 'group' && activeChat.description && (
              <p className="text-xs text-echo-muted line-clamp-1 max-w-[200px] md:max-w-xs">{activeChat.description}</p>
            )}
            {type === 'group' && !activeChat.description && (
              <span className="text-xs text-echo-muted font-medium flex items-center gap-1">
                <Users size={12} /> {activeChat.members?.length || 0} / {activeChat.maxCapacity || 50} Members
              </span>
            )}
            {type === 'dm' && (
              <span className="text-xs text-echo-muted font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
              </span>
            )}
            {type === 'random' && (
              <span className="text-xs font-semibold text-echo-muted">Connected securely</span>
            )}
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 text-echo-muted">
          {type === 'random' && (
            <div className="flex items-center gap-2">
              <button
                onClick={onSave}
                disabled={hasSaved}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all shadow-xs ${hasSaved
                  ? 'bg-green-100 text-green-700 cursor-default border border-green-200'
                  : 'bg-echo-bg hover:bg-echo-yellow/20 hover:text-echo-text text-echo-muted border border-echo-border'
                  }`}
                title="Add as Friend"
              >
                <Users size={14} />
                {hasSaved ? 'Added' : 'Save Friend'}
              </button>

              <button
                onClick={onReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-echo-bg hover:bg-red-50 hover:text-red-600 text-echo-muted border border-echo-border transition-all shadow-xs"
                title="Report Stranger"
              >
                <AlertTriangle size={14} />
                Report
              </button>

              {strangerLeft ? (
                <button
                  onClick={onSkip}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-echo-yellow text-echo-text hover:bg-[#ffe14d] transition-all shadow-sm animate-pulse"
                >
                  <SkipForward size={14} />
                  New Chat
                </button>
              ) : (
                <button
                  onClick={onStop}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-all shadow-xs"
                  title="Disconnect Chat"
                >
                  <LogOut size={14} />
                  Stop
                </button>
              )}
            </div>
          )}
          {type === 'group' && (
            <>
              {isAdmin ? (
                <>
                  <button
                    onClick={handleOpenPinModal}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${activeChat.pinnedAnnouncement?.text ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' : 'bg-echo-bg hover:bg-echo-border text-echo-text'}`}
                    title="Pin Room Announcement"
                  >
                    <Pin size={14} className={activeChat.pinnedAnnouncement?.text ? 'text-amber-700 rotate-45' : ''} />
                    {activeChat.pinnedAnnouncement?.text ? 'Pinned' : 'Pin Notice'}
                  </button>
                  <button
                    onClick={() => setShowEditModal(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-echo-bg rounded-full text-xs font-bold hover:bg-echo-border transition-colors text-echo-text"
                    title="Edit Room Settings"
                  >
                    <Settings size={16} /> Edit Room
                  </button>
                  <button
                    onClick={() => setShowRequests(true)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-echo-bg rounded-full text-xs font-bold hover:bg-echo-border transition-colors text-echo-text"
                  >
                    <Users size={16} /> Manage Requests
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowEditModal(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-echo-bg rounded-full text-xs font-bold hover:bg-echo-border transition-colors text-echo-text"
                  title="View Room Info & Members"
                >
                  <Info size={16} /> Room Info
                </button>
              )}
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

      {/* Pinned Announcement Banner */}
      {activeChat.pinnedAnnouncement?.text && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center justify-between gap-4 text-xs font-semibold text-amber-900 shrink-0 shadow-xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <Pin size={15} className="text-amber-600 shrink-0 rotate-45" />
            <span className="font-bold text-amber-800 shrink-0 uppercase tracking-wider text-[10px] bg-amber-200/70 px-1.5 py-0.5 rounded">Pinned</span>
            <span className="truncate">{activeChat.pinnedAnnouncement.text}</span>
          </div>
          {isAdmin && (
            <button
              onClick={handleOpenPinModal}
              className="text-amber-800 hover:text-amber-950 underline shrink-0 font-bold text-xs"
            >
              Edit
            </button>
          )}
        </div>
      )}

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
              tags: updatedRoom.tags,
              isPrivate: updatedRoom.isPrivate,
              maxCapacity: updatedRoom.maxCapacity
            }));
          }
          setToastMsg('Room updated successfully!');
          setTimeout(() => setToastMsg(''), 4000);
        }}
        onRoomDeleted={() => {
          if (onClose) onClose();
        }}
        onLeaveRoom={() => {
          if (onClose) onClose();
        }}
      />

      {/* Pin Announcement Modal */}
      {showPinModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white border-2 border-echo-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-echo-border">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                  <Pin size={18} className="rotate-45" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-echo-text">Pinned Announcement</h3>
                  <p className="text-xs text-echo-muted">Broadcast an important rule or message to all members</p>
                </div>
              </div>
              <button 
                onClick={() => setShowPinModal(false)}
                className="p-1 text-echo-muted hover:text-echo-text hover:bg-echo-bg rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-echo-text uppercase tracking-wider mb-2">
                  Announcement Text
                </label>
                <textarea
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="e.g. Welcome to our room! Please be respectful to all members and avoid spamming."
                  rows={4}
                  maxLength={300}
                  className="w-full p-3 bg-echo-bg border border-echo-border rounded-xl text-sm font-medium focus:outline-none focus:border-echo-yellow resize-none text-echo-text"
                />
                <div className="flex justify-between text-[11px] text-echo-muted mt-1">
                  <span>Leave empty to remove the pinned message</span>
                  <span>{pinInput.length}/300</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {activeChat.pinnedAnnouncement?.text && (
                  <button
                    type="button"
                    onClick={async () => {
                      setSavingPin(true);
                      try {
                        const updated = await roomService.updatePinnedAnnouncement(activeChat.id, '');
                        if (setActiveChat) {
                          setActiveChat(prev => ({ ...prev, pinnedAnnouncement: updated }));
                        }
                        setShowPinModal(false);
                        setToastMsg('Pinned announcement removed!');
                        setTimeout(() => setToastMsg(''), 3000);
                      } catch (err) {
                        alert(err.response?.data?.message || 'Failed to clear pin');
                      } finally {
                        setSavingPin(false);
                      }
                    }}
                    disabled={savingPin}
                    className="px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors mr-auto"
                  >
                    Remove Pin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowPinModal(false)}
                  className="px-4 py-2 text-xs font-bold text-echo-muted hover:bg-echo-bg rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPin}
                  className="px-5 py-2 text-xs font-bold bg-echo-yellow text-echo-text hover:bg-yellow-400 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                >
                  {savingPin ? <Loader2 size={14} className="animate-spin" /> : 'Save Pin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
