import { Hash, Users, Lock, Globe, CheckCircle } from 'lucide-react';

export default function RoomCard({ room, isJoined, onClick }) {
  const hasLogo = Boolean(room.logoUrl);

  return (
    <div 
      onClick={onClick}
      className={`group relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] p-5 sm:p-7 transition-all duration-500 flex flex-col min-h-[260px] sm:min-h-[320px] cursor-pointer shadow-[0_8px_32px_rgba(0,0,0,0.04)] hover:-translate-y-2 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] ${
        hasLogo ? 'border-transparent' : 'bg-white/40 backdrop-blur-2xl border border-white/50 hover:border-white/90'
      }`}
    >
      {/* Background Image & Overlay */}
      {hasLogo && (
        <>
          <div 
            className="absolute inset-0 z-0 transition-transform duration-700 group-hover:scale-110"
            style={{ 
              backgroundImage: `url(${room.logoUrl})`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center' 
            }}
          ></div>
          <div className="absolute inset-0 bg-black/50 group-hover:bg-black/40 transition-colors duration-500 z-0"></div>
          {/* Subtle gradient to ensure text readability at bottom */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-0"></div>
        </>
      )}

      {/* Decorative Gradient Blob (only if no logo) */}
      {!hasLogo && (
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-echo-yellow/40 via-echo-yellow/10 to-transparent rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:scale-110 group-hover:from-echo-yellow/60"></div>
      )}

      <div className="flex items-start justify-between mb-5 sm:mb-8 relative z-10">
        <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-white/60 backdrop-blur-md border border-white/80 flex items-center justify-center text-echo-text group-hover:bg-echo-yellow group-hover:text-[#1a1a1a] group-hover:border-echo-yellow group-hover:shadow-[0_0_20px_rgba(238,205,52,0.4)] transition-all duration-300 shadow-sm shrink-0">
          <Hash size={20} className="sm:w-6 sm:h-6" strokeWidth={2.5} />
        </div>
        <div className="flex flex-col items-end gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {room.isPrivate ? (
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest bg-gray-800/90 text-gray-300 flex items-center gap-1 sm:gap-1.5 shadow-sm backdrop-blur-md">
                <Lock size={10} className="sm:w-3 sm:h-3" strokeWidth={3} /> private
              </span>
            ) : (
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest bg-echo-yellow/80 text-[#5a4c06] border border-echo-yellow/50 flex items-center gap-1 sm:gap-1.5 shadow-sm backdrop-blur-md">
                <Globe size={10} className="sm:w-3 sm:h-3" strokeWidth={3} /> public
              </span>
            )}
            {isJoined && (
              <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest bg-green-100/90 text-green-800 border border-green-200/50 flex items-center gap-1 shadow-sm backdrop-blur-md">
                <CheckCircle size={10} className="sm:w-3 sm:h-3" strokeWidth={3} /> joined
              </span>
            )}
          </div>
          {room.badge && (
            <span className={`px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider sm:tracking-widest backdrop-blur-md shadow-sm border border-white/50 ${
              room.badge === 'popular' ? 'bg-echo-yellow/90 text-[#5a4c06]' : 'bg-green-100/90 text-green-800'
            }`}>
              {room.badge}
            </span>
          )}
        </div>
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <h3 className={`text-xl sm:text-2xl font-extrabold mb-2 sm:mb-3 tracking-tight transition-colors leading-tight ${hasLogo ? 'text-white' : 'text-echo-text group-hover:text-echo-text'}`}>
          {room.name}
        </h3>
        <p className={`text-xs sm:text-[15px] font-medium mb-5 sm:mb-8 line-clamp-2 leading-relaxed ${hasLogo ? 'text-gray-300' : 'text-echo-muted/90'}`}>
          {room.description || 'No description provided.'}
        </p>
        
        <div className={`flex items-center justify-between mt-auto pt-3.5 sm:pt-5 border-t ${hasLogo ? 'border-white/20' : 'border-echo-border/40'}`}>
          <div className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold transition-colors ${hasLogo ? 'text-gray-300 group-hover:text-white' : 'text-echo-muted group-hover:text-echo-text'}`}>
            <Users size={14} className="sm:w-4 sm:h-4" strokeWidth={2.5} />
            {room.members} online
          </div>
          <span className="text-xs sm:text-sm font-bold text-echo-text opacity-90 sm:opacity-0 group-hover:opacity-100 transition-all duration-300 transform sm:translate-x-4 group-hover:translate-x-0 flex items-center gap-1 bg-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-sm border border-white/50 hover:bg-echo-yellow hover:border-echo-yellow shrink-0">
            {isJoined ? 'open' : 'join'} <span className="text-base sm:text-xl leading-none">&rarr;</span>
          </span>
        </div>
      </div>
    </div>
  );
}
