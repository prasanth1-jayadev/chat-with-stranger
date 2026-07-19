export default function GroupsFilters({ filter, setFilter }) {
  return (
    <div className="px-10 py-5 bg-white/30 backdrop-blur-2xl border-b border-white/50 shrink-0 relative z-10 flex justify-center items-center shadow-[0_4px_30px_rgba(0,0,0,0.03)]">
      <div className="flex bg-white/50 p-1.5 rounded-full border border-white/80 shadow-[inset_0_2px_4px_rgba(255,255,255,0.6)]">
          <button 
            onClick={() => setFilter('all')}
            className={`px-6 py-2 rounded-full text-[13px] font-bold uppercase tracking-widest transition-all duration-300 ${filter === 'all' ? 'bg-echo-yellow text-[#1a1a1a] shadow-md transform scale-105' : 'text-echo-muted hover:text-echo-text hover:bg-white/80 hover:shadow-sm'}`}
          >
            Explore All
          </button>
          <button 
            onClick={() => setFilter('public')}
            className={`px-6 py-2 rounded-full text-[13px] font-bold uppercase tracking-widest transition-all duration-300 ${filter === 'public' ? 'bg-echo-yellow text-[#1a1a1a] shadow-md transform scale-105' : 'text-echo-muted hover:text-echo-text hover:bg-white/80 hover:shadow-sm'}`}
          >
            Public
          </button>
          <button 
            onClick={() => setFilter('private')}
            className={`px-6 py-2 rounded-full text-[13px] font-bold uppercase tracking-widest transition-all duration-300 ${filter === 'private' ? 'bg-echo-yellow text-[#1a1a1a] shadow-md transform scale-105' : 'text-echo-muted hover:text-echo-text hover:bg-white/80 hover:shadow-sm'}`}
          >
            Private
          </button>
      </div>
    </div>
  );
}
