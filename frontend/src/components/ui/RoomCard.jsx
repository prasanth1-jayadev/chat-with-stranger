import { Hash, Users } from 'lucide-react';

export default function RoomCard({ room, onClick }) {
  return (
    <div 
      onClick={onClick}
      className="group relative bg-echo-white/60 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-6 hover:shadow-2xl hover:border-white/80 transition-all duration-300 flex flex-col h-full cursor-pointer overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.05)]"
    >
      {/* Decorative Gradient Blob */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-echo-yellow/20 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:bg-echo-yellow/40"></div>

      <div className="flex items-start justify-between mb-6 relative z-10">
        <div className="w-14 h-14 rounded-full bg-white/80 backdrop-blur-sm border border-white flex items-center justify-center text-echo-text group-hover:bg-echo-yellow group-hover:border-echo-yellow transition-colors shadow-sm">
          <Hash size={24} />
        </div>
        {room.badge && (
          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider backdrop-blur-md shadow-sm border border-white/50 ${
            room.badge === 'popular' ? 'bg-echo-yellow/80 text-[#857109]' : 'bg-green-100/80 text-green-700'
          }`}>
            {room.badge}
          </span>
        )}
      </div>
      
      <div className="relative z-10 flex-1 flex flex-col">
        <h3 className="text-xl font-extrabold mb-2 text-echo-text tracking-tight group-hover:text-echo-text transition-colors">
          {room.name}
        </h3>
        <p className="text-sm font-medium text-echo-muted/90 mb-6 line-clamp-2 leading-relaxed">
          {room.description}
        </p>
        
        <div className="flex items-center justify-between mt-auto pt-4 border-t border-echo-border/30">
          <div className="flex items-center gap-1.5 text-xs font-bold text-echo-muted">
            <Users size={14} />
            {room.members} online
          </div>
          <span className="text-sm font-bold text-echo-text opacity-0 group-hover:opacity-100 transition-opacity transform translate-x-2 group-hover:translate-x-0 flex items-center gap-1 bg-white/50 px-3 py-1.5 rounded-full">
            join <span className="text-lg leading-none">&rarr;</span>
          </span>
        </div>
      </div>
    </div>
  );
}
