import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { socket } from '../socket';

export default function DashboardLayout() {
  const { user } = useSelector((state) => state.auth);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Connect socket on mount
    socket.connect();
    socket.emit('register_user', user.id);

    socket.on('online_users_update', (users) => {
      // update online users in redux if needed
    });

    return () => {
      socket.disconnect();
    };
  }, [user]);

  const navItemClass = ({ isActive }) =>
    `relative px-1 py-1 transition-colors duration-300 text-sm font-bold tracking-widest uppercase ${
      isActive 
        ? 'text-[#1a1a1a] after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[3px] after:bg-[#efcb40] after:rounded-full' 
        : 'text-gray-500 hover:text-[#1a1a1a] after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-0 hover:after:w-full after:transition-all after:duration-300 after:h-[3px] after:bg-[#efcb40] after:rounded-full'
    }`;

  const handleScroll = (e) => {
    if (e.target.scrollTop > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  return (
    <div className="w-full h-screen bg-echo-bg flex flex-col overflow-hidden relative">
      
      {/* Floating Glassy Navbar */}
      <div className={`fixed z-50 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] font-sans antialiased ${
        isScrolled 
          ? 'top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl rounded-[2.5rem] bg-white/70 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/60 px-8 h-16' 
          : 'top-0 left-1/2 -translate-x-1/2 w-full rounded-none bg-transparent px-10 h-24'
      }`}>
        <div className="w-full h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* Logo */}
            <h1 className="text-3xl font-extrabold tracking-tight pb-1 text-[#1a1a1a]">echo</h1>
            
            {/* Links */}
            <nav className="flex items-center gap-6 mt-1">
              <NavLink to="/explore" className={navItemClass}>explore</NavLink>
              <NavLink to="/groups" className={navItemClass}>rooms</NavLink>
              <NavLink to="/dms" className={navItemClass}>messages</NavLink>
              <NavLink to="/random" className={navItemClass}>match</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <button className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#1a1a1a] text-white hover:bg-black hover:shadow-lg transition-all transform hover:-translate-y-0.5 tracking-wide">
              start room
            </button>
            {/* User Avatar linking to Profile */}
            <Link 
              to="/profile" 
              className="w-11 h-11 rounded-full bg-echo-border overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform"
              title="Profile"
            >
              <div className="w-full h-full bg-[#efcb40] text-[#1a1a1a] flex items-center justify-center font-extrabold text-lg">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        className="flex-1 overflow-y-auto bg-echo-bg pt-0 relative flex flex-col"
        onScroll={handleScroll}
      >
        <Outlet />
      </div>

    </div>
  );
}
