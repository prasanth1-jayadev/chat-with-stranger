import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './layouts/DashboardLayout';
import ExplorePage from './pages/ExplorePage';
import GroupsPage from './pages/GroupsPage';
import DMsPage from './pages/DMsPage';
import RandomMatchPage from './pages/RandomMatchPage';
import ProfilePage from './pages/ProfilePage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboard from './pages/admin/AdminDashboard';

function App() {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <div className="min-h-screen bg-echo-bg text-echo-text">
      <Routes>
        <Route 
          path="/login" 
          element={!isAuthenticated ? <AuthPage /> : <Navigate to="/" />} 
        />
        <Route 
          path="/admin/login" 
          element={!isAuthenticated ? <AdminLoginPage /> : <Navigate to="/admin/dashboard" />} 
        />
        <Route 
          path="/admin/dashboard" 
          element={<AdminDashboard />} 
        />
        
        <Route 
          path="/" 
          element={isAuthenticated ? <DashboardLayout /> : <Navigate to="/login" />} 
        >
          <Route index element={<Navigate to="/explore" replace />} />
          <Route path="explore" element={<ExplorePage />} />
          <Route path="groups" element={<GroupsPage />} />
          <Route path="dms" element={<DMsPage />} />
          <Route path="random" element={<RandomMatchPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
