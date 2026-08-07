import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setCredentials } from '../../store/slices/authSlice';
import adminService from '../../api/services/adminService';

export default function AdminLoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) setErrors({ ...errors, [e.target.name]: '' });
    if (globalError) setGlobalError('');
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    if (!formData.password) newErrors.password = 'Password is required.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const data = await adminService.login({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (!data.user.isAdmin) {
        setGlobalError('Access denied. Administrator privileges required.');
        setLoading(false);
        return;
      }

      dispatch(setCredentials({ user: data.user, token: data.token }));
      navigate('/admin/dashboard');
    } catch (err) {
      if (err.response?.data?.errors) {
        setErrors(err.response.data.errors);
      } else {
        setGlobalError(err.response?.data?.message || 'Something went wrong');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center p-3 sm:p-6 bg-[#0a0a0a]">
      <div className="w-full max-w-md bg-[#111111] border border-gray-800 rounded-3xl shadow-2xl p-6 sm:p-12">
        <h2 className="text-3xl sm:text-4xl font-black text-center mb-2 text-white">Admin Portal</h2>
        <p className="text-gray-400 text-center font-semibold mb-6 sm:mb-10 text-sm sm:text-base">Secure access required</p>

        {globalError && (
          <div className="p-3 sm:p-4 rounded-xl mb-6 sm:mb-8 text-xs sm:text-sm font-bold text-center bg-red-900/30 text-red-400 border border-red-900/50">
            {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6" noValidate>
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 sm:mb-2 uppercase tracking-widest">Admin Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-black border ${errors.email ? 'border-red-500' : 'border-gray-800'} rounded-xl sm:rounded-2xl text-white outline-none focus:border-echo-yellow transition-all text-sm sm:text-base`}
              placeholder="admin@echo.com"
            />
            {errors.email && <p className="text-red-500 text-xs mt-1.5 sm:mt-2 font-bold">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 sm:mb-2 uppercase tracking-widest">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className={`w-full px-4 sm:px-6 py-3.5 sm:py-4 bg-black border ${errors.password ? 'border-red-500' : 'border-gray-800'} rounded-xl sm:rounded-2xl text-white outline-none focus:border-echo-yellow transition-all text-sm sm:text-base`}
              placeholder="••••••••"
            />
            {errors.password && <p className="text-red-500 text-xs mt-1.5 sm:mt-2 font-bold">{errors.password}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 sm:py-5 bg-echo-yellow text-black font-extrabold rounded-xl sm:rounded-2xl hover:bg-yellow-400 transition-all disabled:opacity-50 text-lg sm:text-xl tracking-tight"
          >
            {loading ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
}
