import { useState } from 'react';
import { X, Lock, Eye, EyeOff } from 'lucide-react';
import roomService from '../api/services/roomService';

export default function JoinPrivateRoomModal({ isOpen, onClose, room, onSuccess }) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  if (!isOpen || !room) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!password) {
      setError('Password is required.');
      return;
    }

    setLoading(true);
    try {
      const data = await roomService.joinRoom(room._id || room.id, { password });
      
      setPassword('');
      if (data.status === 'pending') {
        setSuccess('Request sent for approval. The admin will review it.');
        setTimeout(() => {
          setSuccess('');
          onClose();
        }, 2500);
      } else {
        onSuccess(room);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room. Incorrect password?');
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
            <div className="w-10 h-10 rounded-full bg-gray-800 text-gray-200 flex items-center justify-center mb-4 shadow-sm">
              <Lock size={20} strokeWidth={2.5} />
            </div>
            <h2 className="text-2xl font-bold mb-1 tracking-tight">private room</h2>
            <p className="text-echo-muted text-sm tracking-wide">
              enter the password for <strong>{room.name}</strong>
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
          {success && <div className="mb-4 p-3 bg-green-100 text-green-700 rounded-lg text-sm font-bold border border-green-200">{success}</div>}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-transparent border-b border-echo-border pb-2 focus:outline-none focus:border-echo-text text-[15px] font-medium transition-colors pr-10"
                placeholder="Password"
                autoFocus
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-0 text-echo-muted hover:text-echo-text transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-3.5 bg-[#1c1c1c] hover:bg-black text-echo-white rounded-full font-bold text-[14px] tracking-widest uppercase shadow-xl transition-all transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? 'Verifying...' : 'Unlock & Join'}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}
