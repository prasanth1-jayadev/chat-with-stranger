import { Search, Plus } from 'lucide-react';

export default function GroupsHeader({ setIsModalOpen, filter }) {
  const getPageTitle = () => {
    switch (filter) {
      case 'joined': return 'My Rooms';
      case 'public': return 'Public Rooms';
      case 'private': return 'Private Rooms';
      case 'all': default: return 'Explore Rooms';
    }
  };

  return (
    <div className="px-10 py-6 border-b border-echo-border bg-echo-white/80 backdrop-blur-xl shrink-0 flex items-center justify-between relative z-20 shadow-sm">
      <div>
        <h2 className="text-3xl font-extrabold mb-1 tracking-tight text-echo-text">
          {getPageTitle()}
        </h2>
        <p className="text-echo-muted font-medium text-sm">Join a conversation or create your own space.</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="relative w-full md:w-64 group transition-all duration-300 hover:-translate-y-0.5">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-echo-muted transition-colors group-hover:text-echo-text group-focus-within:text-echo-text" />
          <input 
            type="text" 
            placeholder="search rooms..." 
            className="w-full pl-11 pr-4 py-2.5 bg-echo-bg/50 border border-echo-border rounded-full text-sm focus:outline-none focus:border-echo-text transition-all duration-300 placeholder:text-echo-muted font-medium group-hover:bg-white/80 group-hover:shadow-md focus:bg-white focus:shadow-md"
          />
        </div>
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
