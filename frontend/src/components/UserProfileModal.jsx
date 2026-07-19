import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { X, UserPlus, Check, Clock, MessageSquare, ShieldAlert } from 'lucide-react';
import userService from '../api/services/userService';
import roomService from '../api/services/roomService';
import { useNavigate } from 'react-router-dom';

export default function UserProfileModal({ isOpen, onClose, userId }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [friendStatus, setFriendStatus] = useState('none'); // none, sent, pending, friends
  const [actionLoading, setActionLoading] = useState(false);
  
  const { user } = useSelector((state) => state.auth);
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
      if (friendsData.friends.some(f => f._id === userId)) {
        setFriendStatus('friends');
      } else if (friendsData.sentRequests.some(r => r._id === userId)) {
        setFriendStatus('sent');
      } else if (friendsData.friendRequests.some(r => r._id === userId)) {
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
      }
    } catch (err) {
      console.error('Action failed:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessage = async () => {
    try {
      await roomService.createDM(userId);
      onClose();
      navigate('/dms'); // Or handle this better if already on DMs
    } catch (err) {
      console.error('Failed to create DM:', err);
    }
  };

  if (!isOpen) return null;

  const isSelf = user?.id === userId || user?._id === userId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal Content */}
      <div className="relative bg-[#f8f6f0] rounded-[2.5rem] w-full max-w-md shadow-[0_20px_60px_rgba(0,0,0,0.15)] overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Header / Banner */}
        <div className="h-32 bg-echo-yellow relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 bg-black/10 hover:bg-black/20 rounded-full flex items-center justify-center text-black/60 hover:text-black transition-colors"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        {/* Profile Content */}
        <div className="px-8 pb-8">
          <div className="relative flex justify-between items-end -mt-16 mb-4">
            <div className="w-32 h-32 rounded-full border-4 border-[#f8f6f0] bg-white overflow-hidden shadow-lg relative">
              {loading ? (
                <div className="w-full h-full bg-gray-200 animate-pulse"></div>
              ) : profile?.avatar ? (
                <img src={profile.avatar} alt={profile.username} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-echo-border flex items-center justify-center text-4xl font-black">
                  {profile?.username?.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            
            {/* Actions */}
            {!isSelf && !loading && (
              <div className="mb-2">
                {friendStatus === 'friends' && (
                  <button 
                    onClick={handleMessage}
                    className="px-5 py-2.5 bg-[#1a1a1a] text-white rounded-full font-bold text-sm shadow-md hover:bg-black hover:-translate-y-0.5 transition-all flex items-center gap-2"
                  >
                    <MessageSquare size={16} /> Message
                  </button>
                )}
                {friendStatus === 'none' && (
                  <button 
                    onClick={() => handleAction('request')}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-echo-yellow text-[#1a1a1a] rounded-full font-bold text-sm shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-2"
                  >
                    <UserPlus size={16} /> Add Friend
                  </button>
                )}
                {friendStatus === 'sent' && (
                  <button 
                    onClick={() => handleAction('cancel')}
                    disabled={actionLoading}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-full font-bold text-sm shadow-sm hover:bg-gray-300 transition-all flex items-center gap-2"
                  >
                    <Clock size={16} /> Request Sent
                  </button>
                )}
                {friendStatus === 'pending' && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleAction('accept')}
                      disabled={actionLoading}
                      className="w-10 h-10 bg-green-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-green-600 transition-colors"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => handleAction('reject')}
                      disabled={actionLoading}
                      className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-md hover:bg-red-600 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          {loading ? (
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse"></div>
            </div>
          ) : (
            <>
              <h2 className="text-3xl font-black text-[#1a1a1a] flex items-center gap-2">
                {profile?.username}
                {profile?.isAdmin && (
                  <ShieldAlert size={20} className="text-echo-yellow" fill="currentColor" />
                )}
              </h2>
              
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-echo-muted mb-3">Interests</h4>
                  <div className="flex flex-wrap gap-2">
                    {profile?.interests?.length > 0 ? (
                      profile.interests.map((interest, idx) => (
                        <span key={idx} className="px-3 py-1 bg-white border border-echo-border rounded-full text-sm font-medium shadow-sm text-echo-text">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-echo-muted italic">No interests specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-echo-muted mb-2">Member Since</h4>
                  <p className="text-sm font-medium text-echo-text">
                    {new Date(profile?.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
