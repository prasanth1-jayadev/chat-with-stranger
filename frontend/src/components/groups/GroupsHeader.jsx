import { Search, Plus } from 'lucide-react';

export default function GroupsHeader({ setIsModalOpen, title, actionButton, searchQuery, setSearchQuery }) {
  return (
    <div className="px-10 py-6 border-b border-echo-border bg-echo-white/80 backdrop-blur-xl shrink-0 flex items-center justify-between relative z-20 shadow-sm">
      <div>
        <h2 className="text-3xl font-extrabold mb-1 tracking-tight text-echo-text">
          {title}
        </h2>
        <p className="text-echo-muted font-medium text-sm">Join a conversation or create your own space.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-full md:w-80 group transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-[#efcb40]/20 to-transparent rounded-full opacity-0 group-focus-within:opacity-100 transition-opacity duration-500 blur-sm"></div>
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-echo-muted transition-colors group-hover:text-echo-text group-focus-within:text-[#efcb40] z-10" />
          <input 
            type="text" 
            placeholder="Search rooms by name..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white/40 backdrop-blur-md border border-white/60 shadow-[inset_0_2px_4px_rgba(255,255,255,0.8)] rounded-full text-sm focus:outline-none focus:bg-white/70 focus:border-[#efcb40]/50 focus:shadow-[0_4px_15px_rgba(239,203,64,0.15)] transition-all duration-300 placeholder:text-echo-muted/70 font-bold group-hover:bg-white/60 group-hover:shadow-[0_4px_10px_rgba(0,0,0,0.03)] relative z-0"
          />
        </div>
        {actionButton}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="px-6 py-2.5 bg-[#1c1c1c] text-echo-white font-bold rounded-full flex items-center gap-2 hover:bg-black transition-all shadow-lg transform active:scale-95"
        >
          <Plus size={18} />
          Create Room
        </button>
      </div>
    </div>
  );
}
