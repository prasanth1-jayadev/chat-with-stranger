import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, UserPlus, Check, Clock, MessageSquare, ShieldAlert, Flag } from 'lucide-react';
import userService from '../api/services/userService';
import roomService from '../api/services/roomService';
import ReportModal from './ReportModal';
import { useNavigate } from 'react-router-dom';
import { toast, sweetAlert } from '../utils/alert';

export default function UserProfileModal({ isOpen, onClose, userId, roomId, isAdmin }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none'); // none, sent, pending, friends
  const [actionLoading, setActionLoading] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
  const { onlineUsers = [] } = useSelector((state) => state.chat || {});
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && userId) {
      setLoading(true);
      fetchProfileAndStatus();
    }
  }, [isOpen, userId]);

  const fetchProfileAndStatus = async () => {
    try {
      const [profileData, friendsData] = await Promise.all([
        userService.getUser(userId),
        userService.getFriends()
      ]);
      setProfile(profileData);

      // Determine friend status
      if (friendsData.friends?.some(f => (f._id || f.id) === userId)) {
        setFriendStatus('friends');
      } else if (friendsData.sentRequests?.some(r => (r._id || r.id) === userId)) {
        setFriendStatus('sent');
      } else if (friendsData.friendRequests?.some(r => (r._id || r.id) === userId)) {
        setFriendStatus('pending'); // they sent us a request
      } else {
        setFriendStatus('none');
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action) => {
    setActionLoading(true);
    try {
      if (action === 'request') {
        const res = await userService.sendRequest(userId);
        setFriendStatus(res.status); // 'sent' or 'friends'
      } else if (action === 'accept') {
        const res = await userService.acceptRequest(userId);
        setFriendStatus(res.status); // 'friends'
      } else if (action === 'reject' || action === 'cancel') {
        const res = await userService.rejectRequest(userId);
        setFriendStatus(res.status); // 'none'
      } else if (action === 'remove_from_room') {
        const confirmed = await sweetAlert.confirm({
          title: 'Remove User?',
          message: `Are you sure you want to remove ${profile?.username || 'this user'} from the room?`,
          confirmText: 'Remove',
          isDanger: true
        });
        if (!confirmed) return;

        await roomService.removeUser(roomId, userId);
        toast.success('User has been removed from the room.');
        onClose();
      } else if (action === 'ban_from_room') {
        const confirmed = await sweetAlert.confirm({
          title: 'Ban User?',
          message: `Are you sure you want to permanently ban ${profile?.username || 'this user'} from this room?`,
          confirmText: 'Ban User',
          isDanger: true
        });
        if (!confirmed) return;

        await roomService.banUser(roomId, userId);
        toast.success('User has been banned from the room.');
        onClose();
      }
    } catch (err) {
      console.error('Action failed:', err);
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      await roomService.createDM(userId);
      onClose();
      navigate('/dms');
    } catch (err) {
      console.error('Failed to create DM:', err);
    }
  };

  if (!isOpen) return null;

  const isSelf = (user?.id || user?._id)?.toString() === userId?.toString();
  const isOnline = isSelf || Boolean(userId && onlineUsers.some(id => id?.toString() === userId?.toString()));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="relative bg-[#f8f6f0] text-[#1a1a1a] rounded-3xl sm:rounded-[2.5rem] w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Banner Section with Avatar anchored */}
        <div className="h-28 sm:h-32 bg-echo-yellow relative px-4 shrink-0 flex items-center justify-between">
          {!isSelf && !loading && (
            <button 
              onClick={() => setShowReportModal(true)}
              className="absolute top-3.5 sm:top-4 left-3.5 sm:left-4 px-3 py-1.5 bg-black/10 hover:bg-black/20 rounded-full flex items-center gap-1.5 text-xs font-bold text-black/80 hover:text-black transition-colors"
              title="Report this user"
            >
              <Flag size={13} /> Report
            </button>
          )}
          <button 
            onClick={onClose}
            className="absolute top-3.5 sm:top-4 right-3.5 sm:right-4 w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-black/80 hover:text-black transition-colors"
          >
            <X size={16} strokeWidth={2.5} />
          </button>

          {/* Full Avatar Circle overlapping banner boundary cleanly without clipping */}
          <div className="absolute -bottom-11 sm:-bottom-13 left-6 sm:left-8 w-22 h-22 sm:w-26 sm:h-26 rounded-full border-4 border-[#f8f6f0] bg-white shadow-md overflow-hidden flex items-center justify-center z-20">
            {loading ? (
              <div className="w-full h-full bg-gray-200 animate-pulse" />
            ) : profile?.avatar ? (
              <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-white flex items-center justify-center text-3xl sm:text-4xl font-black text-[#1a1a1a]">
                {profile?.username?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            {!loading && (
              <div 
                className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white ${isOnline ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-gray-400'}`} 
                title={isOnline ? 'Online' : 'Offline'}
              />
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="px-6 sm:px-8 pt-3 pb-6 sm:pb-8 overflow-y-auto flex-1 space-y-4">
          
          {/* Top Actions Row (Positioned on the right side of the avatar) */}
          <div className="flex items-center justify-end min-h-[44px]">
            {!isSelf && !loading && (
              <div className="flex flex-wrap items-center justify-end gap-2">
                {friendStatus === 'friends' && (
                  <button 
                    onClick={handleMessage}
                    className="px-4 py-2 bg-[#1a1a1a] text-white rounded-full font-bold text-xs shadow-sm hover:bg-black transition-all flex items-center gap-1.5"
                  >
                    <MessageSquare size={14} /> Message
                  </button>
                )}
                {friendStatus === 'none' && (
                  <button 
                    onClick={() => handleAction('request')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-echo-yellow text-[#1a1a1a] border border-yellow-400/60 rounded-full font-bold text-xs shadow-sm hover:bg-yellow-400 transition-all flex items-center gap-1.5"
                  >
                    <UserPlus size={14} /> Add Friend
                  </button>
                )}
                {friendStatus === 'sent' && (
                  <button 
                    onClick={() => handleAction('cancel')}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-full font-bold text-xs shadow-xs hover:bg-gray-300 transition-all flex items-center gap-1.5"
                  >
                    <Clock size={14} /> Request Sent
                  </button>
                )}
                {friendStatus === 'pending' && (
                  <div className="flex items-center gap-1.5">
                    <button 
                      onClick={() => handleAction('accept')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs font-bold shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Check size={14} /> Accept
                    </button>
                    <button 
                      onClick={() => handleAction('reject')}
                      disabled={actionLoading}
                      className="px-3 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-full text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <X size={14} /> Decline
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Details */}
          {loading ? (
            <div className="space-y-3 pt-2">
              <div className="h-7 bg-gray-200 rounded-lg w-1/2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded-lg w-1/3 animate-pulse" />
            </div>
          ) : (
            <>
              {/* Username & Badges */}
              <div className="pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-3xl font-black text-[#1a1a1a] tracking-tight">
                    {profile?.username}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${isOnline ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                  {profile?.isAdmin && (
                    <span className="px-2 py-0.5 bg-yellow-300 text-black border border-yellow-400 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                      <ShieldAlert size={12} /> Admin
                    </span>
                  )}
                </div>
                {profile?.bio && (
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                    {profile.bio}
                  </p>
                )}
              </div>

              {/* Interests Section */}
              <div className="pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-2">
                  INTERESTS
                </h4>
                <div className="flex flex-wrap gap-2">
                  {profile?.interests?.length > 0 ? (
                    profile.interests.map((interest, idx) => (
                      <span 
                        key={idx} 
                        className="px-3.5 py-1.5 bg-white border border-gray-200/80 rounded-full text-xs font-semibold text-gray-800 shadow-xs"
                      >
                        {interest}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-gray-400 italic">No interests specified</span>
                  )}
                </div>
              </div>

              {/* Member Since Section */}
              <div className="pt-1">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                  MEMBER SINCE
                </h4>
                <p className="text-sm font-semibold text-gray-800">
                  {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' }) : 'N/A'}
                </p>
              </div>

              {/* Room Moderation Controls (Cleanly positioned at the bottom if Admin) */}
              {isAdmin && roomId && !isSelf && (
                <div className="pt-3 mt-2 border-t border-gray-200 flex items-center gap-2">
                  <button 
                    onClick={() => handleAction('remove_from_room')}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-gray-200/80 hover:bg-gray-300 text-gray-700 rounded-full font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldAlert size={14} className="text-gray-600" /> Kick
                  </button>
                  <button 
                    onClick={() => handleAction('ban_from_room')}
                    disabled={actionLoading}
                    className="flex-1 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-full font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <ShieldAlert size={14} className="text-red-500" /> Ban User
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        reportedUser={profile}
        type="user"
      />
    </div>
  );
}
