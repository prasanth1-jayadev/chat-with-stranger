import { Hash, Users, Lock, Globe, CheckCircle } from 'lucide-react';

export default function RoomCard({ room, isJoined, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-white/40 backdrop-blur-2xl border border-white/50 rounded-[2.5rem] p-7 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] hover:border-white/90 hover:-translate-y-2 transition-all duration-500 flex flex-col h-full cursor-pointer overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
    >
      {/* Decorative Gradient Blob */}
      <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-echo-yellow/40 via-echo-yellow/10 to-transparent rounded-full blur-2xl -mr-12 -mt-12 transition-all duration-500 group-hover:scale-110 group-hover:from-echo-yellow/60"></div>

      <div className="flex items-start justify-between mb-8 relative z-10">
        <div className="w-14 h-14 rounded-full bg-white/60 backdrop-blur-md border border-white/80 flex items-center justify-center text-echo-text group-hover:bg-echo-yellow group-hover:text-[#1a1a1a] group-hover:border-echo-yellow group-hover:shadow-[0_0_20px_rgba(238,205,52,0.4)] transition-all duration-300 shadow-sm">
          <Hash size={24} strokeWidth={2.5} />
        </div>
        {room.badge && (
          <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest backdrop-blur-md shadow-sm border border-white/50 ${
            room.badge === 'popular' ? 'bg-echo-yellow/90 text-[#5a4c06]' : 'bg-green-100/90 text-green-800'
          }`}>
            {room.badge}
          </span>
        )}
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-2">
          {room.isPrivate ? (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-gray-800 text-gray-300 flex items-center gap-1.5 shadow-sm">
              <Lock size={12} strokeWidth={3} /> private
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-echo-yellow/30 text-[#857109] border border-echo-yellow/50 flex items-center gap-1.5 shadow-sm">
              <Globe size={12} strokeWidth={3} /> public
            </span>
          )}
          {isJoined && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 shadow-sm">
              <CheckCircle size={12} strokeWidth={3} /> joined
            </span>
          )}
        </div>
        
        <h3 className="text-2xl font-extrabold mb-3 text-echo-text tracking-tight group-hover:text-echo-text transition-colors leading-tight">
          {room.name}
        </h3>
        <p className="text-[15px] font-medium text-echo-muted/90 mb-8 line-clamp-2 leading-relaxed">
          {room.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-5 border-t border-echo-border/40">
          <div className="flex items-center gap-2 text-sm font-bold text-echo-muted group-hover:text-echo-text transition-colors">
            <Users size={16} strokeWidth={2.5} />
            {room.members} online
          </div>
          <span className="text-sm font-bold text-echo-text opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-4 group-hover:translate-x-0 flex items-center gap-1.5 bg-white px-4 py-2 rounded-full shadow-sm border border-white/50 hover:bg-echo-yellow hover:border-echo-yellow">
            {isJoined ? 'open' : 'join'} <span className="text-xl leading-none">&rarr;</span>
          </span>
        </div>
      </div>
    </div>
  );
}
