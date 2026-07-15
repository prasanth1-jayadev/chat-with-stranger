import { useState } from 'react';
import { useDispatch } from 'react-redux';
import axios from 'axios';
import { setCredentials } from '../store/slices/authSlice';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const { data } = await axios.post(`${BACKEND_URL}/api/auth/login`, {
          email: formData.email,
          password: formData.password,
        });
        dispatch(setCredentials({ user: data.user, token: data.token }));
      } else {
        await axios.post(`${BACKEND_URL}/api/auth/register`, formData);
        setIsLogin(true);
        setError('Registration successful! Please login.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-echo-white rounded-3xl shadow-2xl overflow-hidden border border-echo-border">
        <div className="p-10">
        <h2 className="text-4xl font-bold text-center mb-2 tracking-tight text-echo-text">
          echo
        </h2>
        <p className="text-echo-muted text-center font-medium mb-10">
          {isLogin ? 'welcome back. sign in to chat.' : 'join the conversation today.'}
        </p>

        {error && (
          <div className={`p-4 rounded-xl mb-8 text-sm font-bold text-center border ${error.includes('successful') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-sm font-bold text-echo-text mb-2 ml-1">username</label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-echo-bg border border-echo-border rounded-full focus:ring-2 focus:ring-echo-yellow focus:border-transparent outline-none transition-all text-echo-text placeholder:text-echo-muted font-medium"
                placeholder="choose a username"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-bold text-echo-text mb-2 ml-1">email</label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-echo-bg border border-echo-border rounded-full focus:ring-2 focus:ring-echo-yellow focus:border-transparent outline-none transition-all text-echo-text placeholder:text-echo-muted font-medium"
              placeholder="enter your email"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-echo-text mb-2 ml-1">password</label>
            <input
              type="password"
              name="password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full px-5 py-3 bg-echo-bg border border-echo-border rounded-full focus:ring-2 focus:ring-echo-yellow focus:border-transparent outline-none transition-all text-echo-text placeholder:text-echo-muted font-medium"
              placeholder="enter your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 mt-4 bg-[#1a1a1a] hover:bg-black text-echo-yellow font-bold rounded-full shadow-xl transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-lg tracking-wide"
          >
            {loading ? 'processing...' : (isLogin ? 'sign in' : 'create account')}
          </button>
        </form>

        <div className="mt-8 text-center text-sm font-medium text-echo-muted">
          {isLogin ? "don't have an account? " : "already have an account? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-echo-text hover:text-black font-bold underline transition-colors"
          >
            {isLogin ? 'sign up' : 'sign in'}
          </button>
          </div>
        </div>
      </div>
    </div>
  );
}
