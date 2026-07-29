import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import adminService from '../../api/services/adminService';
import { Users, Hash, LayoutDashboard, Activity, Database, Search, Filter } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');

  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  // --- NEW USER TABLE STATE ---
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, roomsData, statsData] = await Promise.all([
          adminService.getUsers(userPage, 10, userSearch, userFilter),
          adminService.getRooms(),
          adminService.getStats()
        ]);
        setUserTotalPages(usersData.totalPages);
        setUserTotalCount(usersData.totalUsers);
        setUsers(usersData.users);
        setRooms(roomsData);
        setStats(statsData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Auto-refresh stats every 5 seconds
    const interval = setInterval(async () => {
      try {
        const statsData = await adminService.getStats();
        setStats(statsData);
      } catch (e) {
        // ignore background refresh errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, token, navigate, userPage, userSearch, userFilter]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };


  const handleToggleBan = async (userId) => {
    try {
      await adminService.toggleBanUser(userId);
      // Refresh the user list so the UI updates
      const usersData = await adminService.getUsers();
      setUsers(usersData);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to toggle ban status');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Are you sure you want to permanently delete this room?")) return;
    try {
      await adminService.deleteRoom(roomId);
      const roomsData = await adminService.getRooms();
      setRooms(roomsData);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete room');
    }
  };


  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-echo-yellow text-xl font-bold">Loading secure data...</div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <nav className="bg-[#111111] border-b border-gray-800 px-8 py-4 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black">echo<span className="text-echo-yellow">.</span> <span className="text-gray-500 font-medium">| Admin Portal</span></h1>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-echo-yellow rounded-full flex items-center justify-center text-black font-bold">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="font-bold text-gray-300">{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold transition-colors"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <div className="flex h-[calc(100vh-73px)] overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-[#111111] border-r border-gray-800 p-6 flex flex-col gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'dashboard' ? 'bg-echo-yellow text-black' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'users' ? 'bg-echo-yellow text-black' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Users size={18} />
            User Management
          </button>
          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'rooms' ? 'bg-echo-yellow text-black' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <Hash size={18} />
            Room Management
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-y-auto">
          {error && (
            <div className="bg-red-900/30 border border-red-900/50 text-red-400 p-4 rounded-xl mb-6 font-bold">
              {error}
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && stats && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-3 mb-6">
                <Activity className="text-echo-yellow" size={28} />
                <h2 className="text-3xl font-bold">Real-time Activity</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl flex flex-col relative overflow-hidden shadow-lg group hover:border-gray-700 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-echo-yellow/5 rounded-bl-full group-hover:bg-echo-yellow/10 transition-colors"></div>
                  <span className="text-gray-400 font-bold mb-2 z-10 text-sm uppercase tracking-wider">Live Online Users</span>
                  <span className="text-5xl font-black text-white z-10">{stats.onlineUsersCount}</span>
                </div>
                <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl flex flex-col relative overflow-hidden shadow-lg group hover:border-gray-700 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-bl-full group-hover:bg-blue-500/10 transition-colors"></div>
                  <span className="text-gray-400 font-bold mb-2 z-10 text-sm uppercase tracking-wider">In Stranger Queue</span>
                  <span className="text-5xl font-black text-white z-10">{stats.waitingUsersCount}</span>
                </div>
                <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl flex flex-col relative overflow-hidden shadow-lg group hover:border-gray-700 transition-colors">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-bl-full group-hover:bg-green-500/10 transition-colors"></div>
                  <span className="text-gray-400 font-bold mb-2 z-10 text-sm uppercase tracking-wider">Active Random Chats</span>
                  <span className="text-5xl font-black text-white z-10">{stats.activeChatsCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-6">
                <Database className="text-gray-400" size={28} />
                <h2 className="text-2xl font-bold">Database Metrics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#111111] border border-gray-800 p-5 rounded-2xl flex flex-col justify-center">
                  <span className="text-gray-500 font-bold mb-1 text-xs uppercase tracking-wider">Total Registered Users</span>
                  <span className="text-2xl font-black text-white">{userTotalCount}</span>
                </div>
                <div className="bg-[#111111] border border-gray-800 p-5 rounded-2xl flex flex-col justify-center">
                  <span className="text-gray-500 font-bold mb-1 text-xs uppercase tracking-wider">Total Created Rooms</span>
                  <span className="text-2xl font-black text-white">{rooms.length}</span>
                </div>
                <div className="bg-[#111111] border border-gray-800 p-5 rounded-2xl flex flex-col justify-center">
                  <span className="text-gray-500 font-bold mb-1 text-xs uppercase tracking-wider">Public Rooms</span>
                  <span className="text-2xl font-black text-green-400">{(rooms || []).filter(r => !r.isPrivate).length}</span>
                </div>
                <div className="bg-[#111111] border border-gray-800 p-5 rounded-2xl flex flex-col justify-center">
                  <span className="text-gray-500 font-bold mb-1 text-xs uppercase tracking-wider">Private Rooms</span>
                  <span className="text-2xl font-black text-red-400">{(rooms || []).filter(r => r.isPrivate).length}</span>
                </div>
              </div>
            </div>
          )}

          {/* USERS TAB */}
          {activeTab === 'users' && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="mb-6 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
                <div>
                  <h2 className="text-3xl font-bold mb-2">User Management</h2>
                  <p className="text-gray-400">Total Matching Users: <span className="text-echo-yellow font-bold">{userTotalCount}</span></p>
                </div>
                
                {/* Search and Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text" 
                      placeholder="Search (Press Enter)..." 
                      className="w-full sm:w-64 bg-[#111111] border border-gray-800 text-white pl-10 pr-24 py-2.5 rounded-xl focus:outline-none focus:border-echo-yellow transition-colors"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setUserSearch(searchInput);
                          setUserPage(1); // Reset to page 1 on new search
                        }
                      }}
                    />
                    <button 
                      onClick={() => {
                        setUserSearch(searchInput);
                        setUserPage(1);
                      }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                    >
                      Search
                    </button>
                  </div>
                  <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                      className="w-full sm:w-auto bg-[#111111] border border-gray-800 text-white pl-10 pr-8 py-2.5 rounded-xl focus:outline-none focus:border-echo-yellow appearance-none cursor-pointer"
                      value={userFilter}
                      onChange={(e) => {
                        setUserFilter(e.target.value);
                        setUserPage(1); // Reset to page 1 on filter change
                      }}
                    >
                      <option value="all">All Users</option>
                      <option value="admin">Admins Only</option>
                      <option value="banned">Banned Users</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl mb-6">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                      <th className="p-4 font-bold">User</th>
                      <th className="p-4 font-bold">Email</th>
                      <th className="p-4 font-bold">Role</th>
                      <th className="p-4 font-bold">Status</th>
                      <th className="p-4 font-bold">Joined</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {(users || []).map(u => (
                      <tr key={u._id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-echo-yellow">
                              {u?.username?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <span className="font-bold">{u?.username || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400">{u?.email}</td>
                        <td className="p-4">
                          {u?.isAdmin ? (
                            <span className="px-3 py-1 bg-echo-yellow/20 text-echo-yellow rounded-full text-xs font-bold border border-echo-yellow/30">
                              Admin
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-gray-800 text-gray-300 rounded-full text-xs font-bold border border-gray-700">
                              User
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${stats?.onlineUserIds?.includes(u?._id) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse' : 'bg-gray-600'}`}></div>
                            <span className="text-gray-400 text-sm font-bold">{stats?.onlineUserIds?.includes(u?._id) ? <span className="text-green-400">Online</span> : 'Offline'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400 text-sm font-medium">
                          {u?.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}

                    {(!users || users.length === 0) && (
                      <tr>
                        <td colSpan="5" className="p-8 text-center text-gray-500 font-bold">No users found matching your filters.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {userTotalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                  <button 
                    disabled={userPage === 1}
                    onClick={() => setUserPage(prev => prev - 1)}
                    className="px-4 py-2 bg-[#111111] border border-gray-800 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-gray-400 font-bold">
                    Page <span className="text-echo-yellow">{userPage}</span> of {userTotalPages}
                  </span>
                  <button 
                    disabled={userPage === userTotalPages}
                    onClick={() => setUserPage(prev => prev + 1)}
                    className="px-4 py-2 bg-[#111111] border border-gray-800 rounded-xl font-bold hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ROOMS TAB */}
          {activeTab === 'rooms' && (
            <>
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Room Management</h2>
                  <p className="text-gray-400">Total Created Rooms: <span className="text-echo-yellow font-bold">{rooms.length}</span></p>
                </div>
              </div>

              <div className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                      <th className="p-4 font-bold">Room Name</th>
                      <th className="p-4 font-bold">Admin</th>
                      <th className="p-4 font-bold">Privacy</th>
                      <th className="p-4 font-bold">Members</th>
                      <th className="p-4 font-bold">Created</th>
                      <th className="p-4 font-bold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {(rooms || []).map(room => (
                      <tr key={room?._id} className="hover:bg-[#1a1a1a] transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-echo-yellow text-xl">
                              #
                            </div>
                            <span className="font-bold text-white">{room?.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-400 font-bold">
                          {room?.admin?.username || 'Unknown'}
                        </td>
                        <td className="p-4">
                          {room?.isPrivate ? (
                            <span className="px-3 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-bold border border-red-900/50 flex items-center gap-1 w-fit">
                              Private
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-bold border border-green-900/50 flex items-center gap-1 w-fit">
                              Public
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-gray-400 font-bold">
                          {room?.members?.length || 0}
                        </td>
                        <td className="p-4 text-gray-400 text-sm font-medium">
                          {room?.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleDeleteRoom(room._id)}
                            className="px-4 py-2 bg-red-900/30 text-red-400 rounded-lg text-xs font-bold border border-red-900/50 hover:bg-red-900/50 transition-colors"
                          >
                            Delete Room
                          </button>
                        </td>
                      </tr>
                    ))}

                    {(!rooms || rooms.length === 0) && (
                      <tr>
                        <td colSpan="6" className="p-8 text-center text-gray-500 font-bold">No rooms found in database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
