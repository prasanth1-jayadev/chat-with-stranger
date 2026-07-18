import { useState } from 'react';
import { X, Globe } from 'lucide-react';
import roomService from '../api/services/roomService';

export default function JoinPublicRoomModal({ isOpen, onClose, room, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !room) return null;

  const handleJoin = async () => {
    setError('');
    setLoading(true);
    try {
      await roomService.joinRoom(room._id || room.id);
      onSuccess(room);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred overlay */}
      <div 
        className="absolute inset-0 bg-echo-bg/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-fit min-w-[24rem] max-w-sm bg-echo-white/85 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col transform transition-all">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between relative">
          <div>
            <div className="w-10 h-10 rounded-full bg-echo-yellow/30 text-[#857109] flex items-center justify-center mb-4 shadow-sm border border-echo-yellow/50">
              <Globe size={20} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold mb-1 tracking-tight">join room</h2>
            <p className="text-echo-muted text-sm tracking-wide">
              are you sure you want to join <strong>{room.name}</strong>?
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-echo-text hover:opacity-50 transition-opacity"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm font-bold border border-red-200">{error}</div>}

          <div className="flex gap-3 mt-4">
            <button 
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-3.5 bg-transparent border-2 border-echo-border hover:border-echo-text text-echo-text rounded-full font-bold text-[14px] tracking-widest uppercase transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button 
              onClick={handleJoin}
              disabled={loading}
              className="flex-1 py-3.5 bg-[#1c1c1c] hover:bg-black text-echo-white rounded-full font-bold text-[14px] tracking-widest uppercase shadow-xl transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Joining...' : 'Join'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
