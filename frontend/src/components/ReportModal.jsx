import { useState } from 'react';
import { X, AlertTriangle, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import reportService from '../api/services/reportService';

const REASONS = [
  { id: 'harassment', label: 'Harassment or Bullying', desc: 'Threats, intimidation, or hateful attacks' },
  { id: 'spam', label: 'Spam or Advertising', desc: 'Repetitive messages, scams, or unsolicited links' },
  { id: 'inappropriate', label: 'Inappropriate / NSFW Content', desc: 'Explicit or offensive images and text' },
  { id: 'hate_speech', label: 'Hate Speech or Toxicity', desc: 'Discriminatory or abusive slurs' },
  { id: 'other', label: 'Other Violation', desc: 'Any other platform rule violation' }
];

export default function ReportModal({
  isOpen,
  onClose,
  reportedUser,
  reportedRoom,
  reportedMessage,
  type = 'user',
  onSuccess
}) {
  const [selectedReason, setSelectedReason] = useState(REASONS[0].id);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await reportService.createReport({
        reportedUserId: reportedUser?._id || reportedUser?.id || null,
        reportedRoomId: reportedRoom?._id || reportedRoom?.id || null,
        reportedMessageId: reportedMessage?._id || reportedMessage?.id || null,
        type,
        reason: selectedReason,
        description: description.trim(),
        messageSnippet: reportedMessage?.content || ''
      });

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        if (onSuccess) onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit report. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-[#18181b] text-white border border-white/10 rounded-3xl w-full max-w-lg shadow-[0_25px_60px_rgba(0,0,0,0.6)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#121214]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
              <ShieldAlert size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-white">Report Content</h3>
              <p className="text-xs text-zinc-400">Help keep the community safe and clean</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {submitted ? (
          <div className="p-10 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h4 className="font-bold text-lg text-white">Report Received</h4>
            <p className="text-sm text-zinc-400 max-w-xs">
              Thank you for keeping our platform safe. Our super-admins will review this report shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            
            {/* Target Information Card */}
            {(reportedUser || reportedRoom || reportedMessage || type === 'stranger') && (
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-2xl text-xs space-y-1">
                <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px]">Reporting:</span>
                {reportedUser && (
                  <div className="font-bold text-echo-yellow text-sm">
                    User: @{reportedUser.username || 'Stranger'}
                  </div>
                )}
                {reportedRoom && type !== 'stranger' && (
                  <div className="font-semibold text-zinc-300">
                    Room: {reportedRoom.name || 'Chat Room'}
                  </div>
                )}
                {type === 'stranger' && (
                  <div className="font-semibold text-amber-400 flex items-center gap-1.5">
                    Stranger Match Chat
                  </div>
                )}
                {reportedMessage?.content && (
                  <div className="mt-1 p-2 bg-black/40 rounded-xl text-zinc-300 italic border-l-2 border-red-400 line-clamp-2">
                    "{reportedMessage.content}"
                  </div>
                )}
              </div>
            )}

            {/* Reason Selection */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2.5">
                Select Reason
              </label>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {REASONS.map((r) => (
                  <label 
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedReason === r.id 
                        ? 'bg-red-500/10 border-red-500/40 text-white' 
                        : 'bg-white/5 border-white/5 hover:border-white/20 text-zinc-300'
                    }`}
                  >
                    <input 
                      type="radio" 
                      name="report_reason" 
                      value={r.id}
                      checked={selectedReason === r.id}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="mt-0.5 accent-red-500"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs">{r.label}</div>
                      <div className="text-[11px] text-zinc-400">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Optional Description */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
                Additional Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide any additional context or explanation..."
                rows={3}
                maxLength={300}
                className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-medium focus:outline-none focus:border-red-500/50 resize-none text-white placeholder-zinc-500"
              />
              <div className="text-right text-[10px] text-zinc-500 mt-1">
                {description.length}/300
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 text-xs font-bold bg-red-600 text-white hover:bg-red-500 rounded-xl transition-colors shadow-lg shadow-red-600/20 flex items-center gap-2"
              >
                {submitting ? <Loader2 size={14} className="animate-spin" /> : 'Submit Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
