import { X, Check } from 'lucide-react';

export default function FriendRequestsModal({ isOpen, onClose, friendsData, onAction }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-echo-white rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Decorative Blobs */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-echo-yellow rounded-[40%_60%_70%_30%/40%_50%_60%_50%] opacity-40 pointer-events-none"></div>
        <div className="absolute -bottom-24 -left-16 w-56 h-56 bg-echo-yellow rounded-[60%_40%_30%_70%/60%_30%_70%_40%] opacity-40 pointer-events-none"></div>

        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-echo-border/50 relative z-10 flex items-center justify-between shrink-0">
          <h2 className="text-2xl font-black tracking-tight text-echo-text">Friend Requests</h2>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-echo-border text-echo-muted hover:text-echo-text hover:bg-echo-bg transition-colors shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-8 overflow-y-auto relative z-10 flex-1 scrollbar-hide">
          <div className="space-y-10">
            {/* Incoming Requests */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-echo-muted mb-4 border-b border-echo-border pb-2">
                Incoming — {friendsData.friendRequests.length}
              </h3>
              
              <div className="space-y-4">
                {friendsData.friendRequests.map(req => (
                  <div key={req._id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-echo-border shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-echo-border flex items-center justify-center font-bold overflow-hidden shadow-sm border-2 border-echo-white">
                        {req.avatar && req.avatar.length > 2 ? (
                          <img src={req.avatar} alt="avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-echo-muted">{req.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <div>
                        <div className="font-bold text-[15px] text-echo-text leading-tight">{req.username}</div>
                        <div className="text-[13px] text-echo-muted font-medium">Wants to be friends</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onAction(req._id, 'accept')}
                        className="px-4 py-1.5 bg-echo-yellow border border-echo-yellow shadow-sm rounded-md text-[13px] font-bold text-echo-text hover:brightness-95 transition-all"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onAction(req._id, 'reject')}
                        className="w-8 h-8 flex items-center justify-center rounded-md text-echo-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Reject"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                {friendsData.friendRequests.length === 0 && (
                  <div className="text-center py-8 text-echo-muted font-medium text-sm border-2 border-dashed border-echo-border rounded-xl">
                    No pending incoming requests.
                  </div>
                )}
              </div>
            </div>

            {/* Outgoing Requests */}
            {friendsData.sentRequests.length > 0 && (
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-echo-muted mb-4 border-b border-echo-border pb-2">
                  Outgoing — {friendsData.sentRequests.length}
                </h3>
                
                <div className="space-y-4">
                  {friendsData.sentRequests.map(req => (
                    <div key={req._id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-echo-border shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-echo-border flex items-center justify-center font-bold overflow-hidden shadow-sm border-2 border-echo-white">
                          {req.avatar && req.avatar.length > 2 ? (
                            <img src={req.avatar} alt="avatar" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-echo-muted">{req.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-[15px] text-echo-text leading-tight">{req.username}</div>
                          <div className="text-[13px] text-echo-muted font-medium">Request sent</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onAction(req._id, 'cancel')}
                          className="w-8 h-8 flex items-center justify-center rounded-md text-echo-muted hover:text-red-500 hover:bg-red-50 transition-colors"
                          title="Cancel Request"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
