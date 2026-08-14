import { useEffect, useState, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import adminService from '../../api/services/adminService';
import reportService from '../../api/services/reportService';
import { Users, Hash, LayoutDashboard, Activity, Database, Search, Filter, Shield, Ban, CheckCircle, ShieldAlert, AlertTriangle, Trash2, UserX, CheckCircle2, XCircle, MessageSquare, Menu, X, LogOut, VolumeX, Volume2, Lock, Globe, TrendingUp, BarChart3, Clock, Sparkles, Calendar } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid, Cell } from 'recharts';
import { logout } from '../../store/slices/authSlice';
import { toast, sweetAlert } from '../../utils/alert';

export default function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [activeChartMetric, setActiveChartMetric] = useState('both');
  
  // --- USER TABLE STATE ---
  const [userPage, setUserPage] = useState(1);
  const [userTotalPages, setUserTotalPages] = useState(1);
  const [userTotalCount, setUserTotalCount] = useState(0);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [searchInput, setSearchInput] = useState('');

  // --- ROOM TABLE STATE ---
  const [roomSearch, setRoomSearch] = useState('');
  const [roomFilter, setRoomFilter] = useState('all');
  const [roomSearchInput, setRoomSearchInput] = useState('');

  // --- REPORTS INBOX STATE ---
  const [reports, setReports] = useState([]);
  const [reportPage, setReportPage] = useState(1);
  const [reportTotalPages, setReportTotalPages] = useState(1);
  const [reportTotalCount, setReportTotalCount] = useState(0);
  const [reportPendingCount, setReportPendingCount] = useState(0);
  const [reportStatusFilter, setReportStatusFilter] = useState('pending');
  const [reportTypeFilter, setReportTypeFilter] = useState('all');
  const [resolvingId, setResolvingId] = useState(null);

  const fetchReports = useCallback(async () => {
    try {
      const data = await reportService.getReports(reportPage, 10, reportStatusFilter, reportTypeFilter);
      setReports(data.reports || []);
      setReportTotalPages(data.totalPages || 1);
      setReportTotalCount(data.totalReports || 0);
      setReportPendingCount(data.pendingCount || 0);
    } catch (err) {
      console.error('Failed to fetch reports:', err);
    }
  }, [reportPage, reportStatusFilter, reportTypeFilter]);

  const fetchRoomsData = useCallback(async () => {
    try {
      const roomsData = await adminService.getRooms(roomSearch, roomFilter);
      setRooms(roomsData || []);
    } catch (err) {
      console.error('Failed to fetch rooms:', err);
    }
  }, [roomSearch, roomFilter]);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      const data = await adminService.getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersData, roomsData, statsData, analyticsData] = await Promise.all([
          adminService.getUsers(userPage, 10, userSearch, userFilter),
          adminService.getRooms(roomSearch, roomFilter),
          adminService.getStats(),
          adminService.getAnalytics()
        ]);
        setUserTotalPages(usersData.totalPages);
        setUserTotalCount(usersData.totalUsers);
        setUsers(usersData.users);
        setRooms(roomsData);
        setStats(statsData);
        setAnalytics(analyticsData);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    fetchReports();

    // Auto-refresh stats & pending reports every 5 seconds
    const interval = setInterval(async () => {
      try {
        const [statsData, reportsData] = await Promise.all([
          adminService.getStats(),
          reportService.getReports(reportPage, 10, reportStatusFilter, reportTypeFilter)
        ]);
        setStats(statsData);
        setReportPendingCount(reportsData.pendingCount || 0);
        if (activeTab === 'reports') {
          setReports(reportsData.reports || []);
          setReportTotalPages(reportsData.totalPages || 1);
          setReportTotalCount(reportsData.totalReports || 0);
        }
      } catch (e) {
        // ignore background refresh errors
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user, token, navigate, userPage, userSearch, userFilter, roomSearch, roomFilter, fetchReports, fetchAnalyticsData, activeTab, reportPage, reportStatusFilter, reportTypeFilter]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/admin/login');
  };

  const handleToggleBan = async (userId) => {
    try {
      await adminService.toggleBanUser(userId);
      const usersData = await adminService.getUsers(userPage, 10, userSearch, userFilter);
      setUsers(usersData.users);
      setUserTotalPages(usersData.totalPages);
      setUserTotalCount(usersData.totalUsers);
      toast.success('User ban status updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to toggle ban status');
    }
  };

  const handleToggleMute = async (userId, isCurrentlyMuted) => {
    const confirmed = await sweetAlert.confirm({
      title: isCurrentlyMuted ? 'Unmute User?' : 'Mute User for 24 Hours?',
      message: isCurrentlyMuted
        ? 'Restore messaging privileges for this user?'
        : 'Restrict this user from sending messages in rooms and random chats for 24 hours.',
      confirmText: isCurrentlyMuted ? 'Unmute' : 'Mute (24h)',
      icon: isCurrentlyMuted ? 'question' : 'warning',
      isDanger: !isCurrentlyMuted
    });
    if (!confirmed) return;

    try {
      await adminService.toggleMuteUser(userId, 24);
      const usersData = await adminService.getUsers(userPage, 10, userSearch, userFilter);
      setUsers(usersData.users);
      toast.success(isCurrentlyMuted ? 'User unmuted successfully' : 'User muted for 24 hours');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update user mute status');
    }
  };

  const handleToggleAdminRole = async (userId) => {
    const confirmed = await sweetAlert.confirm({
      title: 'Change Admin Role?',
      message: "Are you sure you want to change this user's administrator privileges?",
      confirmText: 'Change Role',
      icon: 'question'
    });
    if (!confirmed) return;

    try {
      await adminService.toggleAdminRole(userId);
      const usersData = await adminService.getUsers(userPage, 10, userSearch, userFilter);
      setUsers(usersData.users);
      setUserTotalPages(usersData.totalPages);
      setUserTotalCount(usersData.totalUsers);
      toast.success('Admin role updated');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to change admin role');
    }
  };

  const handleToggleQuarantineRoom = async (roomId, isCurrentlyQuarantined) => {
    const confirmed = await sweetAlert.confirm({
      title: isCurrentlyQuarantined ? 'Restore Quarantined Room?' : 'Quarantine Room?',
      message: isCurrentlyQuarantined
        ? 'Restore this room and make it visible and joinable for community members?'
        : 'Quarantine this room immediately to prevent public access during moderation review.',
      confirmText: isCurrentlyQuarantined ? 'Restore Room' : 'Quarantine',
      isDanger: !isCurrentlyQuarantined
    });
    if (!confirmed) return;

    try {
      await adminService.toggleQuarantineRoom(roomId);
      await fetchRoomsData();
      toast.success(isCurrentlyQuarantined ? 'Room restored successfully' : 'Room quarantined');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update room quarantine status');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    const confirmed = await sweetAlert.confirm({
      title: 'Delete Room?',
      message: 'Are you sure you want to permanently delete this room? All room messages and attachments will be deleted.',
      confirmText: 'Delete Room',
      isDanger: true
    });
    if (!confirmed) return;

    try {
      await adminService.deleteRoom(roomId);
      await fetchRoomsData();
      toast.success('Room deleted successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete room');
    }
  };

  const handleResolveReport = async (reportId, action) => {
    if (action === 'ban_user') {
      const confirmed = await sweetAlert.confirm({
        title: 'Global Ban User?',
        message: 'Are you sure you want to GLOBALLY BAN the reported user? Their active session will be terminated immediately.',
        confirmText: 'Ban User',
        isDanger: true
      });
      if (!confirmed) return;
    } else if (action === 'delete_message') {
      const confirmed = await sweetAlert.confirm({
        title: 'Delete Message?',
        message: 'Are you sure you want to permanently delete this message from the room?',
        confirmText: 'Delete Message',
        isDanger: true
      });
      if (!confirmed) return;
    }

    setResolvingId(reportId);
    try {
      await reportService.resolveReport(reportId, action);
      await fetchReports();
      // If user was banned, refresh user table
      if (action === 'ban_user') {
        const usersData = await adminService.getUsers(userPage, 10, userSearch, userFilter);
        setUsers(usersData.users);
      }
      toast.success('Report resolved successfully');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to resolve report');
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-echo-yellow text-xl font-bold">Loading secure data...</div>;

  const getTabTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Overview';
      case 'users': return 'Users';
      case 'rooms': return 'Rooms';
      case 'reports': return 'Reports';
      default: return 'Overview';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Navbar */}
      <nav className="bg-[#111111] border-b border-gray-800 px-4 sm:px-8 py-3.5 sm:py-4 flex justify-between items-center shrink-0 relative z-30">
        <div className="flex items-center gap-3">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="md:hidden p-2 -ml-1.5 text-gray-400 hover:text-white hover:bg-gray-800/80 rounded-xl transition-colors active:scale-95"
            title="Open navigation menu"
            aria-label="Open navigation menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-2xl font-black">echo<span className="text-echo-yellow">.</span> <span className="text-gray-500 font-medium text-xs sm:text-base hidden sm:inline">| Admin Portal</span></h1>
            {/* Active section pill on mobile */}
            <span className="md:hidden px-2 py-0.5 rounded-full text-[11px] font-black bg-echo-yellow/15 text-echo-yellow border border-echo-yellow/30">
              {getTabTitle()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-6">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-echo-yellow rounded-full flex items-center justify-center text-black font-bold text-xs sm:text-sm shadow-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <span className="font-bold text-gray-300 text-xs sm:text-sm hidden sm:inline">{user?.username}</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs sm:text-sm font-bold transition-colors shadow-xs"
          >
            Sign Out
          </button>
        </div>
      </nav>

      {/* Mobile Slide-Out Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative w-[280px] max-w-[85vw] bg-[#111111] border-r border-gray-800 p-6 flex flex-col justify-between shadow-2xl z-10 animate-in slide-in-from-left duration-300">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-5 border-b border-gray-800/80 mb-5">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black">echo<span className="text-echo-yellow">.</span></span>
                  <span className="text-gray-400 font-bold text-xs uppercase tracking-wider">Admin</span>
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Close Menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Admin Profile Preview */}
              <div className="p-3.5 bg-gray-900/80 rounded-2xl border border-gray-800 flex items-center gap-3 mb-5">
                <div className="w-10 h-10 bg-echo-yellow rounded-full flex items-center justify-center text-black font-extrabold text-sm shadow-sm shrink-0">
                  {user?.username?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-white truncate">{user?.username}</span>
                  <span className="text-[10px] text-echo-yellow font-bold uppercase tracking-wider">Super Admin</span>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'dashboard' ? 'bg-echo-yellow text-black shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                  <LayoutDashboard size={18} />
                  Dashboard Overview
                </button>

                <button
                  onClick={() => {
                    setActiveTab('users');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'users' ? 'bg-echo-yellow text-black shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                  <Users size={18} />
                  User Management
                </button>

                <button
                  onClick={() => {
                    setActiveTab('rooms');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'rooms' ? 'bg-echo-yellow text-black shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                  <Hash size={18} />
                  Room Management
                </button>

                <button
                  onClick={() => {
                    setActiveTab('reports');
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold text-sm transition-colors ${activeTab === 'reports' ? 'bg-echo-yellow text-black shadow-md' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={18} />
                    Reports Inbox
                  </div>
                  {reportPendingCount > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === 'reports' ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                      {reportPendingCount}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-5 border-t border-gray-800">
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 w-full py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl font-bold text-sm transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 h-[calc(100vh-61px)] md:h-[calc(100vh-73px)] overflow-hidden">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex w-64 bg-[#111111] border-r border-gray-800 p-6 flex-col gap-2 shrink-0">
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
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center justify-between w-full px-4 py-3 rounded-xl font-bold transition-colors ${activeTab === 'reports' ? 'bg-echo-yellow text-black' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`}
          >
            <div className="flex items-center gap-3">
              <ShieldAlert size={18} />
              Reports Inbox
            </div>
            {reportPendingCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-black ${activeTab === 'reports' ? 'bg-red-600 text-white' : 'bg-red-500/20 text-red-400 border border-red-500/30'}`}>
                {reportPendingCount}
              </span>
            )}
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto">
          {error && (
            <div className="bg-red-900/30 border border-red-900/50 text-red-400 p-3 sm:p-4 rounded-xl mb-6 font-bold text-xs sm:text-sm">
              {error}
            </div>
          )}

          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && stats && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
              {/* Real-time Activity Row */}
              <div>
                <div className="flex items-center gap-2.5 sm:gap-3 mb-4 sm:mb-6">
                  <Activity className="text-echo-yellow" size={24} />
                  <h2 className="text-2xl sm:text-3xl font-bold">Real-time Activity</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              </div>

              {/* 7-Day Growth & Activity Visual Metrics */}
              {analytics && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <TrendingUp className="text-echo-yellow" size={24} />
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-bold">7-Day Growth & Activity</h2>
                        <p className="text-gray-400 text-xs sm:text-sm">Platform engagement, signups, and messaging trends over the past week</p>
                      </div>
                    </div>

                    {/* Chart Metric Toggle */}
                    <div className="flex items-center bg-[#111111] border border-gray-800 rounded-xl p-1 gap-1 self-start sm:self-auto shadow-inner">
                      <button
                        onClick={() => setActiveChartMetric('both')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartMetric === 'both' ? 'bg-echo-yellow text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                      >
                        All Metrics
                      </button>
                      <button
                        onClick={() => setActiveChartMetric('messages')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeChartMetric === 'messages' ? 'bg-white text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-gray-400"></span> Messages
                      </button>
                      <button
                        onClick={() => setActiveChartMetric('signups')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${activeChartMetric === 'signups' ? 'bg-echo-yellow text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                      >
                        <span className="w-2 h-2 rounded-full bg-amber-600"></span> Signups
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Badges */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-[#111111] border border-gray-800 p-5 rounded-2xl flex items-center justify-between hover:border-echo-yellow/40 transition-colors shadow-lg">
                      <div>
                        <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block mb-1">7-Day New Signups</span>
                        <span className="text-3xl font-black text-echo-yellow">{analytics?.summary?.totalSignupsLast7Days || 0}</span>
                        <span className="text-xs text-gray-400 block mt-0.5">~{Math.round(((analytics?.summary?.totalSignupsLast7Days || 0) / 7) * 10) / 10} new users/day</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-echo-yellow/10 border border-echo-yellow/20 flex items-center justify-center text-echo-yellow shrink-0 shadow-[0_0_12px_rgba(239,203,64,0.15)]">
                        <Users size={22} />
                      </div>
                    </div>

                    <div className="bg-[#111111] border border-gray-800 p-5 rounded-2xl flex items-center justify-between hover:border-gray-600 transition-colors shadow-lg">
                      <div>
                        <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block mb-1">7-Day Messages Sent</span>
                        <span className="text-3xl font-black text-white">{analytics?.summary?.totalMessagesLast7Days || 0}</span>
                        <span className="text-xs text-gray-400 block mt-0.5">~{Math.round((analytics?.summary?.totalMessagesLast7Days || 0) / 7)} messages/day</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white shrink-0 shadow-[0_0_12px_rgba(255,255,255,0.1)]">
                        <MessageSquare size={22} />
                      </div>
                    </div>

                    <div className="bg-[#111111] border border-gray-800 p-5 rounded-2xl flex items-center justify-between hover:border-echo-yellow/40 transition-colors shadow-lg">
                      <div>
                        <span className="text-gray-500 font-bold text-xs uppercase tracking-wider block mb-1">Peak Active Window</span>
                        <span className="text-xl sm:text-2xl font-black text-white">{analytics?.summary?.peakHour || 'N/A'}</span>
                        <span className="text-xs text-echo-yellow font-bold block mt-0.5">{analytics?.summary?.peakHourCount || 0} peak messages recorded</span>
                      </div>
                      <div className="w-12 h-12 rounded-2xl bg-echo-yellow/10 border border-echo-yellow/20 flex items-center justify-center text-echo-yellow shrink-0 shadow-[0_0_12px_rgba(239,203,64,0.15)]">
                        <Clock size={22} />
                      </div>
                    </div>
                  </div>

                  {/* Visual 7-Day Bar Chart Card */}
                  <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="text-echo-yellow" size={18} />
                        <h3 className="font-bold text-sm sm:text-base text-white">Daily Volume (Last 7 Days)</h3>
                      </div>
                      <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                        {(activeChartMetric === 'both' || activeChartMetric === 'messages') && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]"></div>
                            <span className="text-gray-300">Messages</span>
                          </div>
                        )}
                        {(activeChartMetric === 'both' || activeChartMetric === 'signups') && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-echo-yellow shadow-[0_0_8px_rgba(239,203,64,0.5)]"></div>
                            <span className="text-gray-300">Signups</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Chart Columns */}
                    <div className="h-72 w-full pt-6">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.sevenDaysTrend || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                          <XAxis dataKey="day" stroke="#888" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <YAxis stroke="#888" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#161616', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            cursor={{ fill: '#ffffff0a' }}
                          />
                          {(activeChartMetric === 'both' || activeChartMetric === 'messages') && (
                            <Bar dataKey="messages" name="Messages" fill="#ffffff" radius={[4, 4, 0, 0]} />
                          )}
                          {(activeChartMetric === 'both' || activeChartMetric === 'signups') && (
                            <Bar dataKey="signups" name="Signups" fill="#efcb40" radius={[4, 4, 0, 0]} />
                          )}
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* 24-Hour Traffic Distribution Heatbar */}
                  <div className="bg-[#111111] border border-gray-800 p-6 rounded-2xl shadow-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="text-echo-yellow" size={18} />
                        <h3 className="font-bold text-sm sm:text-base text-white">24-Hour Activity Distribution</h3>
                      </div>
                      <span className="text-xs text-gray-500 font-bold hidden sm:inline">Platform hourly message traffic</span>
                    </div>

                    <div className="h-48 w-full pt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics?.hourlyDistribution || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                          <XAxis 
                            dataKey="label" 
                            stroke="#888" 
                            tick={{ fill: '#888', fontSize: 10 }} 
                            axisLine={false} 
                            tickLine={false} 
                            interval={3}
                          />
                          <YAxis hide />
                          <RechartsTooltip 
                            contentStyle={{ backgroundColor: '#161616', borderColor: '#333', borderRadius: '12px', color: '#fff' }}
                            itemStyle={{ fontWeight: 'bold' }}
                            cursor={{ fill: '#ffffff0a' }}
                          />
                          <Bar dataKey="count" name="Messages" fill="#efcb40" radius={[4, 4, 0, 0]}>
                            {
                              (analytics?.hourlyDistribution || []).map((entry, index) => {
                                const isPeak = entry.count === Math.max(...(analytics?.hourlyDistribution || []).map(h => h.count));
                                return <Cell key={`cell-${index}`} fill={isPeak ? '#efcb40' : '#444444'} />;
                              })
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* Database Metrics Row */}
              <div>
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
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                        <th className="p-4 font-bold">User</th>
                        <th className="p-4 font-bold">Email</th>
                        <th className="p-4 font-bold">Role</th>
                        <th className="p-4 font-bold">Status</th>
                        <th className="p-4 font-bold">Joined</th>
                        <th className="p-4 font-bold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {(users || []).map(u => {
                        const isCurrentUser = (user?.id || user?._id)?.toString() === u?._id?.toString();
                        return (
                          <tr key={u._id} className="hover:bg-[#1a1a1a] transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-echo-yellow">
                                  {u?.username?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                  <span className="font-bold block">{u?.username || 'Unknown'}</span>
                                  <div className="flex items-center gap-1 mt-0.5">
                                    {u?.isBanned && (
                                      <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Banned</span>
                                    )}
                                    {u?.isMuted && (
                                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                        <VolumeX size={10} /> Muted
                                      </span>
                                    )}
                                  </div>
                                </div>
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
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {/* Toggle Admin Role */}
                                {!isCurrentUser && (
                                  <button
                                    onClick={() => handleToggleAdminRole(u._id)}
                                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${u.isAdmin ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                    title={u.isAdmin ? "Revoke Admin Role" : "Promote to Admin"}
                                  >
                                    <Shield size={14} className={u.isAdmin ? 'text-amber-400 fill-amber-400/20' : ''} />
                                    <span>{u.isAdmin ? 'Revoke' : 'Admin'}</span>
                                  </button>
                                )}

                                {/* Toggle Mute (24h) */}
                                {!u.isAdmin && !isCurrentUser && (
                                  <button
                                    onClick={() => handleToggleMute(u._id, u.isMuted)}
                                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${u.isMuted ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800'}`}
                                    title={u.isMuted ? "Unmute User" : "Mute User for 24 Hours"}
                                  >
                                    {u.isMuted ? <Volume2 size={14} /> : <VolumeX size={14} />}
                                    <span>{u.isMuted ? 'Unmute' : 'Mute'}</span>
                                  </button>
                                )}

                                {/* Toggle Ban */}
                                {!u.isAdmin && !isCurrentUser && (
                                  <button
                                    onClick={() => handleToggleBan(u._id)}
                                    className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${u.isBanned ? 'border-green-500/30 text-green-400 hover:bg-green-500/10' : 'border-red-500/30 text-red-400 hover:bg-red-500/10'}`}
                                    title={u.isBanned ? "Unban User" : "Ban User"}
                                  >
                                    {u.isBanned ? <CheckCircle size={14} /> : <Ban size={14} />}
                                    <span>{u.isBanned ? 'Unban' : 'Ban'}</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {(!users || users.length === 0) && (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-500 font-bold">No users found matching your filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
              <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Room Management</h2>
                  <p className="text-gray-400 text-sm">Total Community Rooms: <span className="text-echo-yellow font-bold">{rooms.length}</span></p>
                </div>

                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <input 
                      type="text"
                      placeholder="Search rooms..."
                      className="w-full bg-[#111111] border border-gray-800 text-white pl-10 pr-20 py-2.5 rounded-xl focus:outline-none focus:border-echo-yellow text-sm"
                      value={roomSearchInput}
                      onChange={(e) => setRoomSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setRoomSearch(roomSearchInput);
                        }
                      }}
                    />
                    <button 
                      onClick={() => setRoomSearch(roomSearchInput)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-800 hover:bg-gray-700 text-white px-3 py-1 rounded-lg text-xs font-bold transition-colors"
                    >
                      Search
                    </button>
                  </div>

                  <div className="relative w-full sm:w-auto">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    <select 
                      className="w-full sm:w-auto bg-[#111111] border border-gray-800 text-white pl-10 pr-8 py-2.5 rounded-xl focus:outline-none focus:border-echo-yellow appearance-none cursor-pointer text-sm"
                      value={roomFilter}
                      onChange={(e) => setRoomFilter(e.target.value)}
                    >
                      <option value="all">All Rooms</option>
                      <option value="public">Public Only</option>
                      <option value="private">Private Only</option>
                      <option value="quarantined">Quarantined Only</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-[#111111] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className="bg-[#1a1a1a] border-b border-gray-800 text-gray-400 text-sm uppercase tracking-wider">
                        <th className="p-4 font-bold">Room Name</th>
                        <th className="p-4 font-bold">Admin</th>
                        <th className="p-4 font-bold">Type</th>
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
                              <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center font-bold text-echo-yellow text-xl overflow-hidden shrink-0">
                                {room?.logoUrl ? (
                                  <img src={room.logoUrl} alt={room.name} className="w-full h-full object-cover" />
                                ) : (
                                  '#'
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white block">{room?.name || 'Unknown'}</span>
                                {room?.description && (
                                  <span className="text-xs text-gray-500 line-clamp-1 max-w-xs">{room.description}</span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-gray-400 font-bold">
                            {room?.admin?.username || 'Unknown'}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap items-center gap-1.5">
                              {room?.isPrivate ? (
                                <span className="px-2.5 py-1 bg-red-900/30 text-red-400 rounded-full text-xs font-bold border border-red-900/50 flex items-center gap-1 w-fit">
                                  <Lock size={12} /> Private
                                </span>
                              ) : (
                                <span className="px-2.5 py-1 bg-green-900/30 text-green-400 rounded-full text-xs font-bold border border-green-900/50 flex items-center gap-1 w-fit">
                                  <Globe size={12} /> Public
                                </span>
                              )}
                              {room?.isQuarantined && (
                                <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-full text-[10px] font-black uppercase tracking-wider">
                                  ⚠️ Quarantined
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-gray-400 font-bold">
                            {room?.members?.length || 0}
                          </td>
                          <td className="p-4 text-gray-400 text-sm font-medium">
                            {room?.createdAt ? new Date(room.createdAt).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Quarantine Toggle */}
                              <button
                                onClick={() => handleToggleQuarantineRoom(room._id, room.isQuarantined)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                                  room.isQuarantined
                                    ? 'bg-green-900/30 text-green-400 border-green-900/50 hover:bg-green-900/50'
                                    : 'bg-amber-900/30 text-amber-400 border-amber-900/50 hover:bg-amber-900/50'
                                }`}
                                title={room.isQuarantined ? "Restore Room Access" : "Quarantine Room"}
                              >
                                {room.isQuarantined ? 'Restore' : 'Quarantine'}
                              </button>

                              {/* Delete Room */}
                              <button
                                onClick={() => handleDeleteRoom(room._id)}
                                className="px-3 py-1.5 bg-red-900/30 text-red-400 rounded-lg text-xs font-bold border border-red-900/50 hover:bg-red-900/50 transition-colors"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}

                      {(!rooms || rooms.length === 0) && (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-gray-500 font-bold">No community rooms found matching your filters.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* REPORTS INBOX TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Header & Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-white flex items-center gap-3">
                    <ShieldAlert className="text-red-500" />
                    Reports Inbox & Moderation Queue
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Review incoming reports and moderate offensive users, messages, and rooms with 1-click actions.
                  </p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3">
                  {/* Status Pills */}
                  <div className="flex bg-[#111111] p-1 rounded-xl border border-gray-800">
                    {['pending', 'resolved', 'dismissed', 'all'].map((status) => (
                      <button
                        key={status}
                        onClick={() => {
                          setReportStatusFilter(status);
                          setReportPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${
                          reportStatusFilter === status
                            ? 'bg-echo-yellow text-black shadow-sm'
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>

                  {/* Type Filter */}
                  <select
                    value={reportTypeFilter}
                    onChange={(e) => {
                      setReportTypeFilter(e.target.value);
                      setReportPage(1);
                    }}
                    className="bg-[#111111] border border-gray-800 text-gray-300 px-3 py-2 rounded-xl text-xs font-bold focus:outline-none focus:border-echo-yellow"
                  >
                    <option value="all">All Types</option>
                    <option value="user">User Reports</option>
                    <option value="message">Message Reports</option>
                    <option value="room">Room Reports</option>
                    <option value="stranger">Stranger Reports</option>
                  </select>
                </div>
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report._id}
                    className={`bg-[#111111] border rounded-2xl p-5 shadow-xl transition-all ${
                      report.status === 'pending'
                        ? 'border-red-900/40 bg-gradient-to-r from-red-950/10 via-[#111111] to-[#111111]'
                        : 'border-gray-800/80 opacity-80'
                    }`}
                  >
                    {/* Top Row: Meta info & Reason */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-800/80">
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-[11px] font-black uppercase tracking-wider">
                          {report.reason?.replace('_', ' ')}
                        </span>
                        <span className="px-2.5 py-1 bg-gray-800 text-gray-300 rounded-lg text-[11px] font-bold uppercase tracking-wider">
                          Type: {report.type}
                        </span>
                        <span className="text-xs text-gray-400">
                          Reported by <strong className="text-white">@{report.reporter?.username || 'Unknown'}</strong> ({report.reporter?.email || 'N/A'})
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span>{new Date(report.createdAt).toLocaleString()}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            report.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : report.status === 'resolved'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>
                    </div>

                    {/* Middle: Content details */}
                    <div className="py-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Target Info */}
                      <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-gray-800/60">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                          Reported Target:
                        </span>
                        {report.reportedUser && (
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-sm font-bold text-white">
                              User: @{report.reportedUser.username} ({report.reportedUser.email})
                            </span>
                            <div className="flex items-center gap-1">
                              {report.reportedUser.isBanned && (
                                <span className="px-2 py-0.5 bg-red-900/40 border border-red-800 text-red-400 rounded text-[10px] font-black">
                                  BANNED
                                </span>
                              )}
                              {report.reportedUser.isMuted && !report.reportedUser.isBanned && (
                                <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded text-[10px] font-black">
                                  🔇 AUTO-MUTED
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                        {report.reportedRoom && (
                          <div className="flex flex-wrap items-center justify-between gap-1.5">
                            <span className="text-sm font-semibold text-echo-yellow">
                              Room: #{report.reportedRoom.name} {report.reportedRoom.isPrivate ? '(Private)' : '(Public)'}
                            </span>
                            {report.reportedRoom.isQuarantined && (
                              <span className="px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded text-[10px] font-black">
                                ⚠️ AUTO-QUARANTINED
                              </span>
                            )}
                          </div>
                        )}
                        {report.strangerSession && (
                          <div className="text-sm font-semibold text-amber-400">
                            Stranger Match Chat ({report.strangerSession})
                          </div>
                        )}
                        {!report.reportedUser && !report.reportedRoom && !report.strangerSession && (
                          <div className="text-sm text-gray-400 italic">Anonymous Stranger Session</div>
                        )}
                      </div>

                      {/* Description & Message Snippet */}
                      <div className="space-y-2 bg-black/30 p-3.5 rounded-xl border border-gray-800/60">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400">
                          Details & Evidence:
                        </span>
                        {report.messageSnippet && (
                          <div className="p-2 bg-red-950/20 border-l-2 border-red-500 rounded text-xs text-red-200 font-mono">
                            "{report.messageSnippet}"
                          </div>
                        )}
                        {report.description ? (
                          <p className="text-xs text-gray-300">{report.description}</p>
                        ) : (
                          <p className="text-xs text-gray-500 italic">No additional comment provided.</p>
                        )}
                      </div>
                    </div>

                    {/* Bottom: Action Bar */}
                    <div className="pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-3">
                      {report.status === 'pending' ? (
                        <>
                          <div className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                            <AlertTriangle size={14} className="text-amber-400" />
                            <span>Action required</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* 1-Click Dismiss */}
                            <button
                              onClick={() => handleResolveReport(report._id, 'dismiss')}
                              disabled={resolvingId === report._id}
                              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              <XCircle size={14} /> Dismiss
                            </button>

                            {/* 1-Click Delete Message (if message attached) */}
                            {report.reportedMessage && (
                              <button
                                onClick={() => handleResolveReport(report._id, 'delete_message')}
                                disabled={resolvingId === report._id}
                                className="px-3.5 py-1.5 bg-amber-900/30 hover:bg-amber-900/50 border border-amber-800 text-amber-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                              >
                                <Trash2 size={14} /> Delete Message
                              </button>
                            )}

                            {/* 1-Click Delete Room (if room attached) */}
                            {report.reportedRoom && (
                              <button
                                onClick={() => handleResolveReport(report._id, 'delete_room')}
                                disabled={resolvingId === report._id}
                                className="px-3.5 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-800 text-red-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                              >
                                <Trash2 size={14} /> Delete Room
                              </button>
                            )}

                            {/* 1-Click Ban User (if user attached and not admin) */}
                            {report.reportedUser && !report.reportedUser.isAdmin && !report.reportedUser.isBanned && (
                              <button
                                onClick={() => handleResolveReport(report._id, 'ban_user')}
                                disabled={resolvingId === report._id}
                                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold transition-colors shadow-lg shadow-red-600/20 flex items-center gap-1.5"
                              >
                                <UserX size={14} /> Ban User
                              </button>
                            )}

                            {/* Mark Resolved */}
                            <button
                              onClick={() => handleResolveReport(report._id, 'resolve')}
                              disabled={resolvingId === report._id}
                              className="px-3.5 py-1.5 bg-green-900/30 hover:bg-green-900/50 border border-green-800 text-green-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              <CheckCircle size={14} /> Mark Resolved
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-gray-400 flex items-center gap-2">
                          <CheckCircle size={14} className="text-green-400" />
                          <span>
                            {report.status === 'dismissed' ? 'Dismissed' : 'Resolved'} by{' '}
                            <strong className="text-white">@{report.resolvedBy?.username || 'Admin'}</strong> • Action Taken:{' '}
                            <strong className="text-echo-yellow capitalize">{report.actionTaken?.replace('_', ' ') || 'None'}</strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {(!reports || reports.length === 0) && (
                  <div className="bg-[#111111] border border-gray-800 rounded-2xl p-12 text-center">
                    <div className="w-14 h-14 bg-green-500/10 text-green-400 rounded-full flex items-center justify-center mx-auto mb-3">
                      <CheckCircle2 size={28} />
                    </div>
                    <h3 className="text-base font-bold text-white">All Clear! No Reports Found</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      There are no reports matching the current filter criteria.
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {reportTotalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <span className="text-xs text-gray-400">
                    Showing page {reportPage} of {reportTotalPages} ({reportTotalCount} total reports)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setReportPage((p) => Math.max(1, p - 1))}
                      disabled={reportPage === 1}
                      className="px-3 py-1.5 bg-[#111111] border border-gray-800 rounded-lg text-xs font-bold text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-colors"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setReportPage((p) => Math.min(reportTotalPages, p + 1))}
                      disabled={reportPage === reportTotalPages}
                      className="px-3 py-1.5 bg-[#111111] border border-gray-800 rounded-lg text-xs font-bold text-gray-300 disabled:opacity-40 hover:bg-gray-800 transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
