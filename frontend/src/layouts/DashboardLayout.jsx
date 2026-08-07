import { useEffect, useState } from 'react';
import { NavLink, Link, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { Compass, Users, MessageSquare, Shuffle, User, Plus } from 'lucide-react';
import { socket } from '../socket';
import { setOnlineUsers, addOnlineUser, removeOnlineUser } from '../store/slices/chatSlice';
import { logout } from '../store/slices/authSlice';
import CreateGroupModal from '../components/CreateGroupModal';
import { sweetAlert } from '../utils/alert';

export default function DashboardLayout() {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;

    // Connect socket on mount
    socket.connect();
    socket.emit('register_user', user.id || user._id);

    socket.on('online_users_initial', (users) => {
      dispatch(setOnlineUsers(users));
    });

    socket.on('user_joined', (userId) => {
      dispatch(addOnlineUser(userId));
    });

    socket.on('user_left', (userId) => {
      dispatch(removeOnlineUser(userId));
    });

    socket.on('user_globally_banned', async (data) => {
      const currentUserId = (user?.id || user?._id)?.toString();
      if (data?.userId === currentUserId) {
        await sweetAlert.error('Account Banned', 'Your account has been banned by an administrator.');
        dispatch(logout());
        socket.disconnect();
      }
    });

    return () => {
      socket.off('online_users_initial');
      socket.off('user_joined');
      socket.off('user_left');
      socket.off('user_globally_banned');
      socket.disconnect();
    };
  }, [user]);

  const navItemClass = ({ isActive }) =>
    `relative px-1 py-1 transition-colors duration-300 text-sm font-bold tracking-widest uppercase ${
      isActive 
        ? 'text-[#1a1a1a] after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-full after:h-[3px] after:bg-[#efcb40] after:rounded-full' 
        : 'text-gray-500 hover:text-[#1a1a1a] after:content-[""] after:absolute after:-bottom-1 after:left-0 after:w-0 hover:after:w-full after:transition-all after:duration-300 after:h-[3px] after:bg-[#efcb40] after:rounded-full'
    }`;

  const mobileNavClass = ({ isActive }) =>
    `flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-all ${
      isActive
        ? 'text-[#efcb40] font-bold scale-105'
        : 'text-zinc-400 hover:text-zinc-200'
    }`;

  const handleScroll = (e) => {
    if (e.target.scrollTop > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  };

  return (
    <div className="w-full h-screen bg-echo-bg flex flex-col overflow-hidden relative font-sans antialiased">
      
      {/* 1. Desktop Floating Glassy Navbar (Hidden on Mobile) */}
      <header className={`fixed z-50 transition-all duration-1000 ease-[cubic-bezier(0.23,1,0.32,1)] hidden md:flex items-center justify-between ${
        isScrolled 
          ? 'top-4 left-1/2 -translate-x-1/2 w-[90%] max-w-4xl rounded-[2.5rem] bg-white/70 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-white/60 px-8 h-16' 
          : 'top-0 left-1/2 -translate-x-1/2 w-full rounded-none bg-transparent px-10 h-24'
      }`}>
        <div className="w-full h-full flex items-center justify-between">
          <div className="flex items-center gap-12">
            {/* Logo */}
            <Link to="/explore" className="text-3xl font-extrabold tracking-tight pb-1 text-[#1a1a1a]">echo</Link>
            
            {/* Links */}
            <nav className="flex items-center gap-6 mt-1">
              <NavLink to="/explore" className={navItemClass}>explore</NavLink>
              <NavLink to="/groups" className={navItemClass}>rooms</NavLink>
              <NavLink to="/dms" className={navItemClass}>messages</NavLink>
              <NavLink to="/random" className={navItemClass}>match</NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-2.5 rounded-full text-sm font-bold bg-[#1a1a1a] text-white hover:bg-black hover:shadow-lg transition-all transform hover:-translate-y-0.5 tracking-wide"
            >
              start room
            </button>
            {/* User Avatar linking to Profile */}
            <Link 
              to="/profile" 
              className="w-11 h-11 rounded-full bg-echo-border overflow-hidden border-2 border-white shadow-md hover:scale-105 transition-transform"
              title="Profile"
            >
              <div className="w-full h-full bg-[#efcb40] text-[#1a1a1a] flex items-center justify-center font-extrabold text-lg overflow-hidden">
                {user?.avatar ? (
                  <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  user?.username?.charAt(0).toUpperCase()
                )}
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Mobile Top Brand Bar (Visible only on mobile < md) */}
      <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 px-4 flex md:hidden items-center justify-between shadow-xs">
        <Link to="/explore" className="text-2xl font-black tracking-tight text-[#1a1a1a] flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-[#efcb40] inline-block animate-pulse"></span>
          echo
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="p-2 rounded-full bg-[#1a1a1a] text-white hover:bg-black transition-all shadow-xs"
            title="Create Room"
          >
            <Plus size={18} strokeWidth={2.5} />
          </button>

          <Link 
            to="/profile" 
            className="w-9 h-9 rounded-full bg-echo-border overflow-hidden border border-white shadow-xs"
            title="Profile"
          >
            <div className="w-full h-full bg-[#efcb40] text-[#1a1a1a] flex items-center justify-center font-bold text-sm">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                user?.username?.charAt(0).toUpperCase()
              )}
            </div>
          </Link>
        </div>
      </header>

      {/* 3. Main Content Area */}
      <main 
        className="flex-1 overflow-y-auto bg-echo-bg pt-0 relative flex flex-col pb-16 md:pb-0"
        onScroll={handleScroll}
      >
        <Outlet />
      </main>

      {/* 4. Mobile Bottom Navigation Bar (Visible only on mobile < md) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 h-16 bg-[#121214]/95 backdrop-blur-2xl border-t border-white/10 px-2 flex md:hidden items-center justify-around shadow-[0_-10px_30px_rgba(0,0,0,0.3)]">
        <NavLink to="/explore" className={mobileNavClass}>
          <Compass size={20} />
          <span className="text-[10px] tracking-wider uppercase">Explore</span>
        </NavLink>
        <NavLink to="/groups" className={mobileNavClass}>
          <Users size={20} />
          <span className="text-[10px] tracking-wider uppercase">Rooms</span>
        </NavLink>
        <NavLink to="/dms" className={mobileNavClass}>
          <MessageSquare size={20} />
          <span className="text-[10px] tracking-wider uppercase">Messages</span>
        </NavLink>
        <NavLink to="/random" className={mobileNavClass}>
          <Shuffle size={20} />
          <span className="text-[10px] tracking-wider uppercase">Match</span>
        </NavLink>
        <NavLink to="/profile" className={mobileNavClass}>
          <User size={20} />
          <span className="text-[10px] tracking-wider uppercase">Profile</span>
        </NavLink>
      </nav>

      {/* Global Create Room Modal */}
      {isCreateModalOpen && (
        <CreateGroupModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}

    </div>
  );
}
