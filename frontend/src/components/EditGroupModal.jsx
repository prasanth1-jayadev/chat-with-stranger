import { useState, useEffect } from 'react';
import { 
  X, 
  Volume2, 
  Image as ImageIcon, 
  Loader2, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Users, 
  UserX, 
  ShieldAlert, 
  Trash2, 
  LogOut, 
  AlertTriangle, 
  Sliders, 
  Shield, 
  Check,
  Search
} from 'lucide-react';
import { useSelector } from 'react-redux';
import roomService from '../api/services/roomService';
import uploadService from '../api/services/uploadService';

export default function EditGroupModal({ 
  isOpen, 
  onClose, 
  activeChat, 
  onUpdateSuccess, 
  onRoomDeleted, 
  onLeaveRoom 
}) {
  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'privacy' | 'members' | 'danger'
  
  // General Form State
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [maxCapacity, setMaxCapacity] = useState(50);
  
  // Privacy & Access State
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Members State
  const [members, setMembers] = useState([]);
  const [bannedUsers, setBannedUsers] = useState([]);
  const [roomAdmin, setRoomAdmin] = useState(null);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [membersSubTab, setMembersSubTab] = useState('active'); // 'active' | 'banned'
  const [memberActionLoading, setMemberActionLoading] = useState(null);

  // Danger Zone State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [dangerLoading, setDangerLoading] = useState(false);

  // Global Modal UI State
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { user } = useSelector((state) => state.auth);
  const currentUserId = (user?.id || user?._id)?.toString();
  const effectiveAdmin = roomAdmin || activeChat?.admin;
  const adminIdStr = (effectiveAdmin?._id || effectiveAdmin)?.toString();
  const isAdmin = Boolean(adminIdStr && currentUserId && adminIdStr === currentUserId);
  const roomId = activeChat?.id || activeChat?._id;

  const fetchMembersData = async () => {
    if (!roomId) return;
    try {
      setLoadingMembers(true);
      const data = await roomService.getRoomMembers(roomId);
      setMembers(data.members || []);
      setBannedUsers(data.bannedUsers || []);
      if (data.admin) setRoomAdmin(data.admin);
      if (data.maxCapacity) setMaxCapacity(data.maxCapacity);
      if (data.isPrivate !== undefined) setIsPrivate(data.isPrivate);
      if (data.requiresApproval !== undefined) setRequiresApproval(data.requiresApproval);
    } catch (err) {
      console.error('Failed to load members:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (isOpen && activeChat) {
      setGroupName(activeChat.name || '');
      setDescription(activeChat.description || '');
      setLogoUrl(activeChat.logoUrl || '');
      setTags(activeChat.tags || []);
      setIsPrivate(Boolean(activeChat.isPrivate));
      setRequiresApproval(Boolean(activeChat.requiresApproval));
      setMaxCapacity(activeChat.maxCapacity || 50);
      setPassword('');
      setError('');
      setSuccessMsg('');
      setActiveTab('general');
      setShowDeleteConfirm(false);
      setShowLeaveConfirm(false);
      fetchMembersData();
    }
  }, [isOpen, activeChat]);

  if (!isOpen || !activeChat) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError('');
      const response = await uploadService.uploadImage(file);
      setLogoUrl(response.imageUrl);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!roomId) {
      setError('Room ID is missing.');
      return;
    }

    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }

    const wasPrivate = Boolean(activeChat.isPrivate);
    if (isPrivate && !wasPrivate && !password.trim()) {
      setError('Password is required when making a room private.');
      return;
    }

    if (uploadingLogo) {
      setError('Please wait for the image to finish uploading.');
      return;
    }

    setLoading(true);
    try {
      const updatePayload = {
        name: groupName.trim(),
        description: description?.trim() || '',
        logoUrl: logoUrl || '',
        tags: tags || [],
        isPrivate: Boolean(isPrivate),
        requiresApproval: isPrivate ? Boolean(requiresApproval) : false,
        maxCapacity: Number(maxCapacity) || 50
      };

      if (isPrivate && password.trim()) {
        updatePayload.password = password.trim();
      }

      const updatedRoom = await roomService.updateRoom(roomId, updatePayload);

      setSuccessMsg('Group settings saved successfully!');
      if (onUpdateSuccess) {
        onUpdateSuccess(updatedRoom);
      }
      setTimeout(() => {
        onClose();
      }, 900);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to update group';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleKickUser = async (targetUserId) => {
    try {
      setMemberActionLoading(`kick-${targetUserId}`);
      await roomService.removeUser(roomId, targetUserId);
      setMembers(prev => prev.filter(m => (m._id || m) !== targetUserId));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to remove user';
      setError(msg);
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleBanUser = async (targetUserId) => {
    try {
      setMemberActionLoading(`ban-${targetUserId}`);
      await roomService.banUser(roomId, targetUserId);
      const bannedMember = members.find(m => (m._id || m) === targetUserId);
      setMembers(prev => prev.filter(m => (m._id || m) !== targetUserId));
      if (bannedMember) {
        setBannedUsers(prev => [...prev, bannedMember]);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to ban user';
      setError(msg);
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleUnbanUser = async (targetUserId) => {
    try {
      setMemberActionLoading(`unban-${targetUserId}`);
      await roomService.unbanUser(roomId, targetUserId);
      setBannedUsers(prev => prev.filter(m => (m._id || m) !== targetUserId));
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to unban user';
      setError(msg);
    } finally {
      setMemberActionLoading(null);
    }
  };

  const handleDeleteRoom = async () => {
    try {
      setDangerLoading(true);
      await roomService.deleteRoom(roomId);
      onClose();
      if (onRoomDeleted) {
        onRoomDeleted(roomId);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to delete room';
      setError(msg);
      setDangerLoading(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      setDangerLoading(true);
      await roomService.leaveRoom(roomId);
      onClose();
      if (onLeaveRoom) {
        onLeaveRoom(roomId);
      }
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to leave room';
      setError(msg);
      setDangerLoading(false);
    }
  };

  const filteredMembers = members.filter(m => 
    m.username?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  const filteredBanned = bannedUsers.filter(m => 
    m.username?.toLowerCase().includes(memberSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred overlay */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[32rem] bg-echo-white/95 backdrop-blur-2xl rounded-[2.5rem] border border-white/60 shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col transform transition-all max-h-[90vh]">
        
        {/* Header */}
        <div className="px-8 pt-7 pb-4 flex items-start justify-between relative border-b border-echo-border/50">
          <div>
            <h2 className="text-2xl font-bold mb-0.5 tracking-tight text-[#1a1a1a]">
              {isAdmin ? 'Group Settings' : 'Room Info'}
            </h2>
            <p className="text-echo-muted text-xs tracking-wide">
              {isAdmin ? 'Manage room configuration, privacy, and members' : 'View room details, members, and options'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-echo-border/40 hover:bg-echo-border flex items-center justify-center text-echo-text transition-colors"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-echo-border/60 bg-[#f8f6f0]/60 px-6 py-2 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('general')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'general'
                ? 'bg-[#1a1a1a] text-[#efcb40] shadow-sm'
                : 'text-echo-muted hover:text-echo-text'
            }`}
          >
            <Sliders size={14} /> General
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-[#1a1a1a] text-[#efcb40] shadow-sm'
                : 'text-echo-muted hover:text-echo-text'
            }`}
          >
            {isPrivate ? <Lock size={14} /> : <Unlock size={14} />} Privacy & Access
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'members'
                ? 'bg-[#1a1a1a] text-[#efcb40] shadow-sm'
                : 'text-echo-muted hover:text-echo-text'
            }`}
          >
            <Users size={14} /> Members ({members.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('danger')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all shrink-0 ${
              activeTab === 'danger'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-red-500/80 hover:text-red-600'
            }`}
          >
            <AlertTriangle size={14} /> Danger Zone
          </button>
        </div>

        {/* Body Content */}
        <div className="px-8 py-6 overflow-y-auto flex-1 space-y-5">
          {error && (
            <div className="p-3.5 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-200 flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-green-50 text-green-700 rounded-xl text-xs font-semibold border border-green-200 flex items-center gap-2">
              <Check size={16} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* ===================== TAB 1: GENERAL ===================== */}
          {activeTab === 'general' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              {!isAdmin && (
                <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Shield size={16} className="shrink-0 text-amber-700" />
                  <span>Viewing in read-only mode. Only the room admin can modify group settings.</span>
                </div>
              )}

              {/* Group Name */}
              <div>
                <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-1.5">
                  Group Name
                </label>
                <input 
                  type="text" 
                  value={groupName}
                  disabled={!isAdmin}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-white/80 border border-echo-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-echo-text text-[14px] font-medium transition-colors disabled:opacity-75 disabled:bg-gray-50"
                  placeholder="Enter group name"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-1.5">
                  Description
                </label>
                <input 
                  type="text" 
                  value={description}
                  disabled={!isAdmin}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-white/80 border border-echo-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-echo-text text-[14px] font-medium transition-colors disabled:opacity-75 disabled:bg-gray-50"
                  placeholder="What is this group about?"
                />
              </div>

              {/* Max Capacity */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase">
                    Max Capacity / Participant Limit
                  </label>
                  <span className="text-xs font-bold text-echo-text bg-echo-yellow/40 px-2 py-0.5 rounded-md">
                    {maxCapacity} members max
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="2" 
                    max="200" 
                    step="1"
                    disabled={!isAdmin}
                    value={maxCapacity}
                    onChange={(e) => setMaxCapacity(Number(e.target.value))}
                    className="flex-1 accent-[#1a1a1a] cursor-pointer disabled:cursor-not-allowed"
                  />
                  {isAdmin && (
                    <div className="flex gap-1.5">
                      {[10, 25, 50, 100].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setMaxCapacity(val)}
                          className={`px-2 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                            maxCapacity === val 
                              ? 'bg-[#1a1a1a] text-[#efcb40] border-[#1a1a1a]' 
                              : 'bg-white border-echo-border text-echo-muted hover:text-echo-text'
                          }`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Logo Upload */}
              <div>
                <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-1.5">
                  Room Background Image
                </label>
                {logoUrl ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border border-echo-border group">
                    <img src={logoUrl} alt="Room Logo" className="w-full h-full object-cover" />
                    {isAdmin && (
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button 
                          type="button" 
                          onClick={() => setLogoUrl('')}
                          className="px-4 py-1.5 bg-red-500 text-white rounded-full text-xs font-bold shadow-md hover:bg-red-600"
                        >
                          Remove Image
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  isAdmin && (
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-echo-border rounded-xl cursor-pointer hover:bg-echo-yellow/5 hover:border-echo-yellow/50 transition-colors">
                      <div className="flex flex-col items-center justify-center">
                        {uploadingLogo ? (
                          <Loader2 className="w-6 h-6 text-echo-yellow animate-spin mb-1" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-echo-muted mb-1" />
                        )}
                        <p className="text-xs text-echo-muted font-medium">
                          {uploadingLogo ? 'Uploading...' : 'Upload room image'}
                        </p>
                      </div>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange} 
                        disabled={uploadingLogo}
                      />
                    </label>
                  )
                )}
              </div>

              {/* Topic Tags */}
              <div>
                <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-1.5">
                  Topic Tags
                </label>
                {isAdmin && (
                  <input 
                    type="text" 
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full bg-white/80 border border-echo-border rounded-xl px-3.5 py-2 focus:outline-none focus:border-echo-text text-[13px] font-medium transition-colors mb-2"
                    placeholder="Type a tag and press Enter"
                  />
                )}
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span 
                      key={tag} 
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border border-echo-border text-xs font-medium text-echo-text shadow-sm"
                    >
                      #{tag}
                      {isAdmin && (
                        <button 
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="hover:text-red-500 focus:outline-none ml-1"
                        >
                          <X size={12} strokeWidth={2} />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              </div>

              {/* Save Button (Admin Only) */}
              {isAdmin && (
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 bg-[#1c1c1c] hover:bg-black text-echo-white rounded-full font-bold text-[14px] tracking-wider uppercase shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
                  {loading ? 'Saving Changes...' : 'Save General Settings'}
                </button>
              )}
            </form>
          )}

          {/* ===================== TAB 2: PRIVACY & ACCESS ===================== */}
          {activeTab === 'privacy' && (
            <form onSubmit={handleSaveSettings} className="space-y-5">
              {!isAdmin && (
                <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <Shield size={16} className="shrink-0 text-amber-700" />
                  <span>Viewing in read-only mode. Only the room admin can modify privacy settings.</span>
                </div>
              )}

              {/* Public / Private Mode Switch */}
              <div>
                <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-2">
                  Room Privacy Mode
                </label>
                <div className="flex border border-echo-border rounded-full p-1 bg-white/80 w-full">
                  <button 
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setIsPrivate(false)}
                    className={`flex-1 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                      !isPrivate 
                        ? 'bg-echo-yellow text-[#1a1a1a] shadow-sm border border-[#e3c72b]' 
                        : 'text-echo-muted hover:text-echo-text'
                    }`}
                  >
                    <Unlock size={14} /> Public Group
                  </button>
                  <button 
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => setIsPrivate(true)}
                    className={`flex-1 py-2.5 rounded-full text-xs font-bold tracking-wide transition-all flex items-center justify-center gap-1.5 ${
                      isPrivate 
                        ? 'bg-[#1a1a1a] text-[#efcb40] shadow-sm border border-[#1a1a1a]' 
                        : 'text-echo-muted hover:text-echo-text'
                    }`}
                  >
                    <Lock size={14} /> Private Group
                  </button>
                </div>
                <p className="text-[11px] text-echo-muted mt-1.5 px-1">
                  {!isPrivate 
                    ? 'Anyone can discover and join public groups directly.' 
                    : 'Private groups require a password and/or admin approval to join.'}
                </p>
              </div>

              {/* Password Section (Only for Private) */}
              {isPrivate && (
                <div className="p-4 bg-white/70 border border-echo-border rounded-2xl space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase">
                        Change / Reset Room Password
                      </label>
                      <span className="text-[10px] text-echo-muted italic">
                        {activeChat.isPrivate ? 'Leave blank to keep existing' : 'Password required'}
                      </span>
                    </div>
                    <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        value={password}
                        disabled={!isAdmin}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-white border border-echo-border rounded-xl px-3.5 py-2.5 pr-10 focus:outline-none focus:border-echo-text text-[14px] font-medium transition-colors disabled:opacity-75 disabled:bg-gray-50"
                        placeholder={activeChat.isPrivate ? "Enter new password to change" : "Set room password"}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-echo-muted hover:text-echo-text transition-colors"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Approval Toggle */}
                  <div className="pt-2 border-t border-echo-border/60 flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-echo-text">Require Admin Approval</h4>
                      <p className="text-[11px] text-echo-muted">
                        Users must be approved by an admin before entering
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        disabled={!isAdmin}
                        checked={requiresApproval} 
                        onChange={(e) => setRequiresApproval(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#1a1a1a]"></div>
                    </label>
                  </div>
                </div>
              )}

              {/* Save Button (Admin Only) */}
              {isAdmin && (
                <button 
                  type="submit"
                  disabled={loading}
                  className="w-full mt-4 py-3.5 bg-[#1c1c1c] hover:bg-black text-echo-white rounded-full font-bold text-[14px] tracking-wider uppercase shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                  {loading ? 'Updating Privacy...' : 'Save Privacy & Password'}
                </button>
              )}
            </form>
          )}

          {/* ===================== TAB 3: MEMBERS & BANS ===================== */}
          {activeTab === 'members' && (
            <div className="space-y-4">
              {/* Member Sub Tabs */}
              <div className="flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setMembersSubTab('active')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      membersSubTab === 'active' 
                        ? 'bg-[#1a1a1a] text-[#efcb40]' 
                        : 'bg-white border border-echo-border text-echo-muted hover:text-echo-text'
                    }`}
                  >
                    Active Members ({members.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setMembersSubTab('banned')}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      membersSubTab === 'banned' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-white border border-echo-border text-echo-muted hover:text-echo-text'
                    }`}
                  >
                    Banned ({bannedUsers.length})
                  </button>
                </div>
              </div>

              {/* Search Members */}
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-echo-muted" />
                <input 
                  type="text"
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  placeholder={`Search ${membersSubTab === 'active' ? 'members' : 'banned users'}...`}
                  className="w-full bg-white border border-echo-border rounded-xl pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-echo-text"
                />
              </div>

              {/* Members List */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {loadingMembers ? (
                  <div className="text-center py-8 text-echo-muted text-xs flex items-center justify-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Loading members...
                  </div>
                ) : membersSubTab === 'active' ? (
                  filteredMembers.length === 0 ? (
                    <div className="text-center py-6 text-echo-muted text-xs">
                      No members found
                    </div>
                  ) : (
                    filteredMembers.map((member) => {
                      const memberId = (member._id || member)?.toString();
                      const isMemberAdmin = adminIdStr === memberId;
                      const isCurrentUser = memberId === currentUserId;

                      return (
                        <div 
                          key={memberId} 
                          className="p-3 bg-white border border-echo-border rounded-xl flex items-center justify-between shadow-sm hover:border-gray-300 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-echo-yellow/40 border border-echo-yellow flex items-center justify-center font-bold text-xs overflow-hidden">
                              {member.avatar ? (
                                <img src={member.avatar} alt={member.username} className="w-full h-full object-cover" />
                              ) : (
                                member.username?.charAt(0).toUpperCase() || 'U'
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-xs text-echo-text">{member.username}</span>
                                {isCurrentUser && (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded font-medium">You</span>
                                )}
                                {isMemberAdmin && (
                                  <span className="text-[10px] bg-echo-yellow text-[#857109] font-bold px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                                    <Shield size={10} /> Admin
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-echo-muted">
                                {member.isOnline ? '🟢 Online' : 'Offline'}
                              </p>
                            </div>
                          </div>

                          {/* Kick & Ban Actions (Admin only, non-admin members) */}
                          {isAdmin && !isMemberAdmin && !isCurrentUser && (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={memberActionLoading === `kick-${memberId}`}
                                onClick={() => handleKickUser(memberId)}
                                className="px-2.5 py-1 text-[11px] font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-1"
                                title="Remove from room"
                              >
                                {memberActionLoading === `kick-${memberId}` ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <UserX size={12} />
                                )}
                                Kick
                              </button>
                              <button
                                type="button"
                                disabled={memberActionLoading === `ban-${memberId}`}
                                onClick={() => handleBanUser(memberId)}
                                className="px-2.5 py-1 text-[11px] font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors flex items-center gap-1 border border-red-200"
                                title="Ban user from re-joining"
                              >
                                {memberActionLoading === `ban-${memberId}` ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  <ShieldAlert size={12} />
                                )}
                                Ban
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                ) : (
                  filteredBanned.length === 0 ? (
                    <div className="text-center py-6 text-echo-muted text-xs">
                      No banned users
                    </div>
                  ) : (
                    filteredBanned.map((banned) => {
                      const bannedId = (banned._id || banned)?.toString();
                      return (
                        <div 
                          key={bannedId} 
                          className="p-3 bg-red-50/50 border border-red-200 rounded-xl flex items-center justify-between shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-red-100 border border-red-200 flex items-center justify-center font-bold text-xs text-red-700">
                              {banned.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-echo-text">{banned.username}</span>
                              <p className="text-[10px] text-red-500 font-semibold">Banned from room</p>
                            </div>
                          </div>

                          {isAdmin && (
                            <button
                              type="button"
                              disabled={memberActionLoading === `unban-${bannedId}`}
                              onClick={() => handleUnbanUser(bannedId)}
                              className="px-3 py-1 text-[11px] font-bold text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg transition-colors"
                            >
                              {memberActionLoading === `unban-${bannedId}` ? 'Unbanning...' : 'Unban'}
                            </button>
                          )}
                        </div>
                      );
                    })
                  )
                )}
              </div>
            </div>
          )}

          {/* ===================== TAB 4: DANGER ZONE ===================== */}
          {activeTab === 'danger' && (
            <div className="space-y-5">
              {/* Delete Group (Admin) */}
              {isAdmin ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                      <Trash2 size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-red-900">Delete this Group</h4>
                      <p className="text-xs text-red-700 mt-0.5 leading-relaxed">
                        Permanently delete this group, its messages, media, and remove all members. This action cannot be undone.
                      </p>
                    </div>
                  </div>

                  {!showDeleteConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <Trash2 size={14} /> Delete Group
                    </button>
                  ) : (
                    <div className="p-3 bg-white border border-red-300 rounded-xl space-y-2.5">
                      <p className="text-xs font-bold text-red-800 text-center">
                        Are you absolutely sure you want to delete &quot;{activeChat.name}&quot;?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeleteConfirm(false)}
                          disabled={dangerLoading}
                          className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleDeleteRoom}
                          disabled={dangerLoading}
                          className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          {dangerLoading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                          {dangerLoading ? 'Deleting...' : 'Yes, Delete Permanently'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Leave Group (Regular Member) */
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                      <LogOut size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-orange-900">Leave this Group</h4>
                      <p className="text-xs text-orange-700 mt-0.5 leading-relaxed">
                        You will leave &quot;{activeChat.name}&quot;. You will need to rejoin or request access if you wish to return.
                      </p>
                    </div>
                  </div>

                  {!showLeaveConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowLeaveConfirm(true)}
                      className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2"
                    >
                      <LogOut size={14} /> Leave Group
                    </button>
                  ) : (
                    <div className="p-3 bg-white border border-orange-300 rounded-xl space-y-2.5">
                      <p className="text-xs font-bold text-orange-800 text-center">
                        Are you sure you want to leave &quot;{activeChat.name}&quot;?
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowLeaveConfirm(false)}
                          disabled={dangerLoading}
                          className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg text-xs font-bold transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleLeaveRoom}
                          disabled={dangerLoading}
                          className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          {dangerLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                          {dangerLoading ? 'Leaving...' : 'Yes, Leave Room'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Group Live Preview Footer for Context */}
          <div className="pt-2 border-t border-echo-border/40">
            <div className="p-3 rounded-2xl bg-echo-yellow/40 border border-[#e3c72b]/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm border border-white/50">
                <Volume2 size={20} className="text-echo-text" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-[#857109] tracking-widest uppercase">
                    {isPrivate ? '🔒 Private Room' : '🌐 Public Room'}
                  </span>
                  <span className="text-[9px] text-[#857109] font-semibold">
                    • {maxCapacity} max capacity
                  </span>
                </div>
                <h4 className="font-bold text-sm text-echo-text truncate">
                  {groupName || 'Room Name'}
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
