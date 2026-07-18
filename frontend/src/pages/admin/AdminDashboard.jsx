import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Users, Hash } from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import adminService from '../../api/services/adminService';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  
  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || !user.isAdmin) {
      navigate('/admin/login');
      return;
    }

    const fetchUsers = async () => {
      try {
        const [usersData, roomsData] = await Promise.all([
          adminService.getUsers(),
          adminService.getRooms()
        ]);
        setUsers(usersData);
        setRooms(roomsData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, token, navigate]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
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

          {activeTab === 'users' ? (
            <>
              <div className="mb-8 flex justify-between items-end">
                <div>
                  <h2 className="text-3xl font-bold mb-2">User Management</h2>
                  <p className="text-gray-400">Total Registered Users: <span className="text-echo-yellow font-bold">{users.length}</span></p>
                </div>
              </div>

        <div className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
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
              {users.map(u => (
                <tr key={u._id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-echo-yellow">
                        {u.username[0].toUpperCase()}
                      </div>
                      <span className="font-bold">{u.username}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400">{u.email}</td>
                  <td className="p-4">
                    {u.isAdmin ? (
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
                      <div className={`w-2 h-2 rounded-full \${u.isOnline ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                      <span className="text-gray-400 text-sm">{u.isOnline ? 'Online' : 'Offline'}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 text-sm font-medium">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {users.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 font-bold">No users found in database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
            </>
          ) : (
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
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rooms.map(room => (
                <tr key={room._id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-echo-yellow text-xl">
                        #
                      </div>
                      <span className="font-bold text-white">{room.name}</span>
                    </div>
                  </td>
                  <td className="p-4 text-gray-400 font-bold">
                    {room.admin?.username || 'Unknown'}
                  </td>
                  <td className="p-4">
                    {room.isPrivate ? (
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
                    {room.members?.length || 0}
                  </td>
                  <td className="p-4 text-gray-400 text-sm font-medium">
                    {new Date(room.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {rooms.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 font-bold">No rooms found in database.</td>
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
