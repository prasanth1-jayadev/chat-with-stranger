import { useState, useEffect } from 'react';
import { X, Check, XCircle, Users } from 'lucide-react';
import roomService from '../../api/services/roomService';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function ManageRequestsModal({ isOpen, onClose, roomId }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && roomId) {
      fetchRequests();
    }
  }, [isOpen, roomId]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await roomService.getJoinRequests(roomId);
      setRequests(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await roomService.handleRequest(roomId, userId, 'approve');
      setRequests(requests.filter(req => req._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to approve user');
    }
  };

  const handleReject = async (userId) => {
    try {
      await roomService.handleRequest(roomId, userId, 'reject');
      setRequests(requests.filter(req => req._id !== userId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reject user');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred overlay */}
      <div 
        className="absolute inset-0 bg-echo-bg/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-echo-white/95 backdrop-blur-3xl rounded-[2rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col max-h-[80vh]">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-echo-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-echo-yellow text-[#1a1a1a] flex items-center justify-center shadow-sm">
              <Users size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Join Requests</h2>
              <p className="text-echo-muted text-xs font-semibold">
                {requests.length} pending approval{requests.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-echo-muted hover:text-echo-text hover:bg-black/5 rounded-full transition-colors"
          >
            <X size={20} strokeWidth={2} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm font-bold border border-red-200">{error}</div>}
          
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-echo-muted border-t-echo-text rounded-full animate-spin"></div>
            </div>
          ) : requests.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-echo-muted font-medium">No pending requests.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map(req => (
                <div key={req._id} className="flex items-center justify-between p-4 rounded-2xl border border-echo-border bg-white hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-echo-border flex items-center justify-center font-bold text-echo-muted overflow-hidden">
                      {req.avatar ? (
                        <img src={req.avatar} alt={req.username} className="w-full h-full object-cover" />
                      ) : (
                        req.username.charAt(0).toUpperCase()
                      )}
                    </div>
                    <span className="font-semibold">{req.username}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => handleReject(req._id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                      title="Reject"
                    >
                      <XCircle size={22} />
                    </button>
                    <button 
                      onClick={() => handleApprove(req._id)}
                      className="p-2 text-green-500 hover:bg-green-50 rounded-full transition-colors"
                      title="Approve"
                    >
                      <Check size={22} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
