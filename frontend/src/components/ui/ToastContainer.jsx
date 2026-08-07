import { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  HelpCircle, 
  X, 
  ShieldAlert 
} from 'lucide-react';
import { subscribeAlerts, toast } from '../../utils/alert';

export default function ToastContainer() {
  const [state, setState] = useState({ toasts: [], currentModal: null });

  useEffect(() => {
    const unsubscribe = subscribeAlerts((newState) => {
      setState(newState);
    });
    return unsubscribe;
  }, []);

  const { toasts, currentModal } = state;

  return (
    <>
      {/* ============================================================ */}
      {/* 1. FLOATING TOASTS (Top-Right) */}
      {/* ============================================================ */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-3 sm:px-0">
        {toasts.map((item) => {
          let icon = <Info size={18} className="text-blue-500 shrink-0" />;
          let borderStyle = 'border-blue-200 bg-white/95 text-[#1a1a1a]';
          let progressBg = 'bg-blue-500';

          if (item.type === 'success') {
            icon = <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />;
            borderStyle = 'border-emerald-200 bg-white/95 text-[#1a1a1a]';
            progressBg = 'bg-emerald-500';
          } else if (item.type === 'error') {
            icon = <XCircle size={18} className="text-rose-500 shrink-0" />;
            borderStyle = 'border-rose-200 bg-white/95 text-[#1a1a1a]';
            progressBg = 'bg-rose-500';
          } else if (item.type === 'warning') {
            icon = <AlertTriangle size={18} className="text-amber-500 shrink-0" />;
            borderStyle = 'border-amber-200 bg-white/95 text-[#1a1a1a]';
            progressBg = 'bg-amber-500';
          }

          return (
            <div
              key={item.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-2xl border shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-md transition-all duration-300 animate-in slide-in-from-top-3 fade-in relative overflow-hidden ${borderStyle}`}
            >
              <div className="mt-0.5">{icon}</div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="text-xs sm:text-sm font-bold leading-snug break-words">
                  {item.message}
                </p>
              </div>
              <button
                onClick={() => toast.dismiss(item.id)}
                className="p-1 hover:bg-black/5 rounded-lg text-gray-400 hover:text-gray-700 transition-colors"
                title="Dismiss"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* ============================================================ */}
      {/* 2. SWEET ALERT MODAL (Center Backdrop Popup) */}
      {/* ============================================================ */}
      {currentModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
            onClick={currentModal.cancelText ? currentModal.onCancel : currentModal.onConfirm}
          />

          {/* Dialog Container */}
          <div className="relative bg-[#f8f6f0] text-[#1a1a1a] rounded-[2rem] p-6 sm:p-8 max-w-sm sm:max-w-md w-full shadow-[0_25px_70px_rgba(0,0,0,0.3)] border-2 border-black/5 animate-in zoom-in-95 fade-in duration-200 flex flex-col items-center text-center">
            
            {/* Modal Icon Badge */}
            <div className="mb-4">
              {currentModal.icon === 'success' && (
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-inner border border-emerald-200">
                  <CheckCircle2 size={36} strokeWidth={2.5} />
                </div>
              )}
              {currentModal.icon === 'error' && (
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shadow-inner border border-rose-200">
                  <XCircle size={36} strokeWidth={2.5} />
                </div>
              )}
              {currentModal.icon === 'warning' && (
                <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shadow-inner border border-amber-200">
                  <AlertTriangle size={36} strokeWidth={2.5} />
                </div>
              )}
              {currentModal.icon === 'info' && (
                <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner border border-blue-200">
                  <Info size={36} strokeWidth={2.5} />
                </div>
              )}
              {currentModal.icon === 'question' && (
                <div className="w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner border border-indigo-200">
                  <HelpCircle size={36} strokeWidth={2.5} />
                </div>
              )}
            </div>

            {/* Title */}
            {currentModal.title && (
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-[#1a1a1a] mb-2">
                {currentModal.title}
              </h3>
            )}

            {/* Message Body */}
            {currentModal.message && (
              <p className="text-sm sm:text-base text-gray-600 font-medium leading-relaxed mb-6">
                {currentModal.message}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-3 w-full mt-2">
              {currentModal.cancelText && (
                <button
                  type="button"
                  onClick={currentModal.onCancel}
                  className="flex-1 py-3 px-5 rounded-full font-extrabold text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors shadow-xs"
                >
                  {currentModal.cancelText}
                </button>
              )}
              <button
                type="button"
                onClick={currentModal.onConfirm}
                className={`flex-1 py-3 px-5 rounded-full font-extrabold text-sm transition-all shadow-md active:scale-95 ${
                  currentModal.isDanger
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
                    : 'bg-echo-yellow text-[#1a1a1a] hover:bg-yellow-400 border border-yellow-400 shadow-echo-yellow/30'
                }`}
              >
                {currentModal.confirmText || 'OK'}
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
