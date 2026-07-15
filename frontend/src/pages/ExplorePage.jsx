import { Link } from 'react-router-dom';
import { Play, Headphones, Music, Radio, Volume2, Search, ArrowRight, UserPlus, MessageCircle, Shuffle } from 'lucide-react';

export default function ExplorePage() {
  return (
    <div className="w-full bg-echo-bg">
      <style>
        {`
          .blob-1 {
            animation: blob-morph-1 12s ease-in-out infinite alternate, blob-spin 30s linear infinite;
          }
          .blob-2 {
            animation: blob-morph-2 15s ease-in-out infinite alternate-reverse, blob-spin-reverse 35s linear infinite;
          }
          .blob-3 {
            animation: blob-morph-1 18s ease-in-out infinite alternate, blob-spin 40s linear infinite;
          }
          .blob-4 {
            animation: blob-morph-2 10s ease-in-out infinite alternate-reverse, blob-spin-reverse 25s linear infinite;
          }
          @keyframes blob-morph-1 {
            0% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
            100% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
          }
          @keyframes blob-morph-2 {
            0% { border-radius: 40% 60% 70% 30% / 40% 50% 60% 50%; }
            50% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
            100% { border-radius: 50% 50% 20% 80% / 25% 80% 20% 75%; }
          }
          @keyframes blob-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes blob-spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
        `}
      </style>
      {/* --- MASSIVE ABSTRACT MATCH HERO --- */}
      <div className="sticky top-0 z-0 w-full min-h-screen bg-[#f8f6f0] border-b border-echo-border overflow-hidden shadow-sm flex flex-col items-center justify-center text-center px-4 pt-24">

        {/* Overlapping Yellow Circles Background (Fluid Animated) */}
        {/* Top Left big circle */}
        <div className="blob-1 absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#efcb40] opacity-90 mix-blend-multiply origin-center"></div>
        {/* Bottom Left circle */}
        <div className="blob-2 absolute -bottom-20 -left-10 w-[400px] h-[400px] bg-[#efcb40] opacity-90 mix-blend-multiply origin-center"></div>
        {/* Top Right massive circle */}
        <div className="blob-3 absolute -top-40 -right-20 w-[800px] h-[800px] bg-[#efcb40] opacity-90 mix-blend-multiply origin-center"></div>
        {/* Bottom Right circle */}
        <div className="blob-4 absolute -bottom-40 right-10 w-[500px] h-[500px] bg-[#efcb40] opacity-90 mix-blend-multiply origin-center"></div>

        {/* Small decorative dots */}
        <div className="absolute top-24 left-[20%] w-6 h-6 rounded-full bg-[#efcb40] animate-[bounce_4s_ease-in-out_infinite]"></div>
        <div className="absolute top-32 left-[25%] w-3 h-3 rounded-full bg-[#efcb40] animate-[bounce_3s_ease-in-out_infinite_0.5s]"></div>
        <div className="absolute top-20 right-[30%] w-8 h-8 rounded-full bg-[#efcb40] opacity-60 animate-[bounce_5s_ease-in-out_infinite_1s]"></div>
        <div className="absolute bottom-32 left-[35%] w-4 h-4 rounded-full bg-[#efcb40] animate-[bounce_3.5s_ease-in-out_infinite_0.2s]"></div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center font-sans antialiased">
          <h1 className="text-6xl md:text-[5.5rem] lg:text-[7rem] font-extrabold tracking-tighter text-[#1a1a1a] mb-6 leading-none max-w-4xl">
            Meet someone new. <br /> <span className="font-serif italic text-[#857109] drop-shadow-md">Right now.</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#1a1a1a]/70 font-medium mb-12 max-w-2xl px-4">
            Skip the browsing. Jump straight into an authentic voice conversation with someone who shares your vibe.
          </p>
          <Link to="/random" className="px-12 py-5 bg-[#1a1a1a] text-[#efcb40] rounded-full font-bold shadow-2xl hover:bg-black transition-all transform hover:-translate-y-1 inline-flex items-center gap-4 text-xl">
            <Search size={24} strokeWidth={3} /> Match Randomly
          </Link>
        </div>
      </div>

      {/* --- SCROLLING OVERLAY CONTENT --- */}
      <div className="relative z-10 w-full bg-echo-bg flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.15)]">

        {/* --- STATS BANNER --- */}
        <div className="w-full bg-[#1a1a1a] py-16">
          <div className="max-w-5xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
            <div>
              <h3 className="text-3xl font-bold text-echo-yellow mb-2">24.6k</h3>
              <p className="text-xs font-bold tracking-widest uppercase text-white/50">monthly listeners</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#b4d4f2] mb-2">150+</h3>
              <p className="text-xs font-bold tracking-widest uppercase text-white/50">active rooms</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#e1f0b4] mb-2">75min</h3>
              <p className="text-xs font-bold tracking-widest uppercase text-white/50">average session</p>
            </div>
            <div>
              <h3 className="text-3xl font-bold text-[#f2b4c8] mb-2">∞</h3>
              <p className="text-xs font-bold tracking-widest uppercase text-white/50">global network</p>
            </div>
          </div>
        </div>

        <div className="w-full max-w-5xl mx-auto px-8 py-24">

          {/* --- TRENDING ROOMS --- */}
          <div className="mb-12 flex items-end justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight mb-2">Trending Rooms</h2>
              <p className="text-echo-muted font-medium">What the community is talking about right now.</p>
            </div>
            <Link to="/groups" className="text-sm font-bold uppercase tracking-widest border-b-2 border-echo-text pb-1 hover:text-echo-muted hover:border-echo-muted transition-colors">
              see all rooms
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-32">
            {/* Card 1 (Large Yellow) */}
            <div className="md:col-span-2 bg-echo-yellow rounded-[2.5rem] p-10 flex flex-col justify-between min-h-[300px] hover:shadow-2xl hover:-translate-y-1 transition-all cursor-pointer relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-20 -mt-20"></div>
              <div>
                <div className="inline-block px-3 py-1 bg-black/10 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                  ✨ design & tech
                </div>
                <h3 className="text-4xl font-bold leading-tight mb-4 max-w-md">The Future of Generative Audio Design</h3>
                <p className="text-[#857109] font-medium max-w-md">Discussing AI tools, new instruments, and how to blend synthetic sounds into the mix for film. Tap to join!</p>
              </div>
              <div className="mt-8 flex items-center justify-between">
                <button className="px-6 py-3 bg-[#1a1a1a] text-echo-yellow rounded-full font-bold flex items-center gap-2 hover:bg-black transition-colors shadow-xl">
                  Join Room <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Card 2 (Small Beige) */}
            <div className="bg-echo-white border border-echo-border rounded-[2.5rem] p-8 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div>
                <div className="w-10 h-10 rounded-full bg-echo-bg border border-echo-border flex items-center justify-center mb-6">
                  <Headphones size={18} className="text-echo-muted" />
                </div>
                <h3 className="text-2xl font-bold leading-tight mb-4">Indie Hackers Midnight Coffee Chat</h3>
              </div>
              <div className="flex -space-x-2 mt-8">
                <div className="w-8 h-8 rounded-full border-2 border-echo-white bg-slate-300"></div>
                <div className="w-8 h-8 rounded-full border-2 border-echo-white bg-slate-400"></div>
                <div className="w-8 h-8 rounded-full border-2 border-echo-white flex items-center justify-center bg-echo-bg text-xs font-bold text-echo-muted">+8</div>
              </div>
            </div>

            {/* Card 3 (Black) */}
            <div className="bg-[#1a1a1a] text-white rounded-[2.5rem] p-8 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div>
                <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-[10px] font-bold uppercase tracking-widest text-white/70 mb-6">
                  🧘 lifestyle
                </div>
                <h3 className="text-2xl font-bold leading-tight mb-4 text-echo-white">Meditation & Ambient Textures</h3>
                <p className="text-white/60 text-sm font-medium">Weekly guided sessions for focus and flow.</p>
              </div>
              <div className="mt-8">
                <button className="w-full py-3 border border-white/20 text-white rounded-full font-bold text-sm hover:bg-white/10 transition-colors">
                  Remind Me
                </button>
              </div>
            </div>

            {/* Card 4 (Medium Beige) */}
            <div className="md:col-span-2 bg-echo-white border border-echo-border rounded-[2.5rem] p-8 flex items-center gap-8 hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer">
              <div className="w-32 h-32 rounded-2xl bg-[#e6e2d3] flex items-center justify-center shrink-0">
                <Volume2 size={40} className="text-[#c4bda3]" />
              </div>
              <div>
                <h3 className="text-3xl font-bold leading-tight mb-2">Poetry After Dark</h3>
                <p className="text-echo-muted font-medium mb-6">Anonymous readings. Low-fi beats. Just pure expression.</p>
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full border-2 border-echo-white bg-indigo-400"></div>
                    <div className="w-6 h-6 rounded-full border-2 border-echo-white bg-teal-400"></div>
                    <div className="w-6 h-6 rounded-full border-2 border-echo-white bg-amber-400"></div>
                  </div>
                  <span className="text-xs font-bold text-echo-muted uppercase tracking-widest">312 listening</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- STRANGER MATCH HERO (Sticky Layer 2) --- */}
      <div className="sticky top-0 z-0 w-full min-h-screen bg-echo-yellow overflow-hidden shadow-sm flex flex-col items-center justify-center pt-24 pb-12 px-8 group [transform-style:preserve-3d]">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/30 rounded-full blur-3xl -mr-40 -mt-40 transition-transform duration-700 group-hover:scale-110"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#d9b626]/40 rounded-full blur-3xl -ml-20 -mb-20"></div>
        <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-16 relative z-10 hover:[transform:perspective(1200px)_rotateX(8deg)_rotateY(-5deg)] transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
          <div className="max-w-xl text-center md:text-left">
            <h2 className="text-6xl md:text-[5rem] font-extrabold tracking-tighter mb-6 text-[#1a1a1a] leading-none">
              Stranger Meet
            </h2>
            <p className="text-[#857109] font-medium mb-12 text-2xl">
              Skip the browsing and jump straight into a one-on-one conversation with someone entirely new.
            </p>
            <Link to="/random" className="px-10 py-5 bg-[#1a1a1a] text-echo-yellow rounded-full font-bold shadow-2xl hover:bg-black transition-all transform hover:-translate-y-1 inline-flex items-center gap-4 text-xl">
              <Search size={24} strokeWidth={3} /> Match Randomly
            </Link>
          </div>

          <div className="relative w-full max-w-lg h-96 flex-shrink-0">
            {/* Complex Photo Collage */}
            {/* Central Radar Circles */}
            <div className="absolute inset-0 flex items-center justify-center -z-10">
              <div className="w-[120%] h-[120%] rounded-full border-2 border-white/40 absolute animate-[spin_20s_linear_infinite] border-dashed"></div>
              <div className="w-[80%] h-[80%] rounded-full border-2 border-black/10 absolute animate-[spin_15s_linear_infinite_reverse] border-dashed"></div>
            </div>

            {/* Photo 1: Large Center */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border-8 border-echo-white overflow-hidden shadow-2xl z-20 group-hover:scale-105 transition-all duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)]">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80" alt="User" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-1000"></div>
            </div>

            {/* Photo 2: Top Right */}
            <div className="absolute top-0 right-4 w-24 h-24 rounded-full border-4 border-echo-white overflow-hidden shadow-xl z-30 animate-[bounce_4s_ease-in-out_infinite]">
              <img src="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&q=80" alt="User" className="w-full h-full object-cover" />
            </div>

            {/* Photo 3: Bottom Left */}
            <div className="absolute bottom-2 left-2 w-28 h-28 rounded-full border-[6px] border-echo-white overflow-hidden shadow-xl z-30 animate-[bounce_5s_ease-in-out_infinite_1s]">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80" alt="User" className="w-full h-full object-cover" />
            </div>

            {/* Photo 4: Top Left small */}
            <div className="absolute top-10 left-6 w-20 h-20 rounded-full border-2 border-echo-white overflow-hidden shadow-lg z-10 animate-[bounce_3.5s_ease-in-out_infinite_2s]">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80" alt="User" className="w-full h-full object-cover" />
            </div>

            {/* Photo 5: Bottom Right small */}
            <div className="absolute bottom-8 right-12 w-16 h-16 rounded-full border-[3px] border-echo-white overflow-hidden shadow-lg z-10 animate-[bounce_3s_ease-in-out_infinite_0.5s]">
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&q=80" alt="User" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      </div>


      {/* --- SCROLLING OVERLAY CONTENT 2 --- */}
      <div className="relative z-20 w-full bg-echo-bg flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.15)] pt-32">
        <div className="w-full max-w-5xl mx-auto px-8">

          {/* --- HOW IT WORKS --- */}
          <div className="text-center mb-32">
            <h2 className="text-4xl font-bold tracking-tight mb-4">
              It's as easy as <span className="italic font-serif text-echo-yellow">saying hello.</span>
            </h2>
            <p className="text-echo-muted font-medium mb-16 max-w-lg mx-auto">
              No complex setups. Just pick a room, join the conversation, and let your voice be heard.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
              {/* Decorative dashed line connecting steps */}
              <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px border-t-2 border-dashed border-echo-border -z-10"></div>

              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-[2rem] bg-[#f0e8d1] flex items-center justify-center mb-6 shadow-sm rotate-3">
                  <Search size={32} className="text-[#857109]" />
                </div>
                <h4 className="text-lg font-bold mb-2">1. Pick a Vibe</h4>
                <p className="text-sm text-echo-muted font-medium px-4">Browse trending rooms and find a topic that matches your mood.</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-[2rem] bg-[#e1e3e6] flex items-center justify-center mb-6 shadow-sm -rotate-3">
                  <UserPlus size={32} className="text-slate-600" />
                </div>
                <h4 className="text-lg font-bold mb-2">2. Tap to Join</h4>
                <p className="text-sm text-echo-muted font-medium px-4">No invitations required. Just jump in and start listening or speaking.</p>
              </div>

              <div className="flex flex-col items-center">
                <div className="w-24 h-24 rounded-[2rem] bg-[#e6ead3] flex items-center justify-center mb-6 shadow-sm rotate-6">
                  <MessageCircle size={32} className="text-[#657a3e]" />
                </div>
                <h4 className="text-lg font-bold mb-2">3. Make an Echo</h4>
                <p className="text-sm text-echo-muted font-medium px-4">Share your thoughts, ask questions, or just enjoy the human connection.</p>
              </div>
            </div>
          </div>

          {/* --- BOTTOM CTA --- */}
          <div className="w-full bg-[#1a1a1a] rounded-[3rem] p-16 text-center shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>

            <div className="relative z-10">
              <h2 className="text-5xl font-extrabold text-echo-white mb-6">Ready to be<br />heard?</h2>
              <p className="text-white/60 font-medium mb-10 max-w-md mx-auto">
                Join thousands of users who have already found their community. It's free to start.
              </p>

              <div className="flex items-center justify-center gap-4">
                <Link to="/groups" className="px-8 py-4 bg-echo-yellow text-[#1a1a1a] rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                  Create an Account
                </Link>
                <Link to="/random" className="px-8 py-4 bg-white text-[#1a1a1a] rounded-full font-bold shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                  Match Randomly
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <footer className="border-t border-echo-border py-8 mt-12 text-center text-xs font-bold tracking-widest uppercase text-echo-muted">
          © 2026 echo audio. all rights reserved.
        </footer>

      </div> {/* End SCROLLING OVERLAY CONTENT */}
    </div>
  );
}
