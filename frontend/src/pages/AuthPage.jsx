import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { setCredentials } from '../store/slices/authSlice';
import authService from '../api/services/authService';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState('');
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
    if (globalError) setGlobalError('');
  };

  const validateForm = () => {
    const newErrors = {};
    const email = formData.email.trim();
    const password = formData.password;
    const username = formData.username.trim();
    const confirmPassword = formData.confirmPassword;

    // 1. Required Fields
    if (!email) newErrors.email = 'Email is required.';
    if (!password) newErrors.password = 'Password is required.';
    if (!isLogin) {
      if (!username) newErrors.username = 'Username is required.';
      if (!confirmPassword) newErrors.confirmPassword = 'Confirm Password is required.';
    }

    // 2. Format Validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (password && !isLogin) {
      if (password.length < 8) newErrors.password = 'Password must be at least 8 characters long.';
      else if (!/(?=.*[a-z])/.test(password)) newErrors.password = 'Password must contain at least one lowercase letter.';
      else if (!/(?=.*[A-Z])/.test(password)) newErrors.password = 'Password must contain at least one uppercase letter.';
      else if (!/(?=.*\d)/.test(password)) newErrors.password = 'Password must contain at least one number.';
      else if (!/(?=.*[!@#$%^&*])/.test(password)) newErrors.password = 'Password must contain at least one special character.';
    }

    if (!isLogin) {
      if (username && (username.length < 3 || username.length > 20)) {
        newErrors.username = 'Username must be between 3 and 20 characters.';
      } else if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores.';
      }

      if (confirmPassword && password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    const payload = {
      email: formData.email.trim(),
      password: formData.password,
    };
    
    if (!isLogin) {
      payload.username = formData.username.trim();
      payload.confirmPassword = formData.confirmPassword;
    }

    try {
      if (isLogin) {
        const data = await authService.login(payload);
        dispatch(setCredentials({ user: data.user, token: data.token }));
      } else {
        await authService.register(payload);
        setIsLogin(true);
        setFormData({ username: '', email: '', password: '', confirmPassword: '' });
        setGlobalError('Registration successful! Please login.');
      }
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

  const getInputClass = (fieldName) => `w-full px-6 py-4 bg-white border-2 rounded-2xl outline-none transition-all text-[#1a1a1a] font-bold text-lg shadow-sm ${errors[fieldName] ? 'border-red-500 focus:ring-4 focus:ring-red-500/20 focus:border-red-500' : 'border-echo-border focus:ring-4 focus:ring-echo-yellow/30 focus:border-echo-yellow placeholder:text-echo-muted/50'}`;

  return (
    <div className="flex-1 min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-[#f8f6f0]">
      <style>
        {`
          .blob-1 { animation: blob-morph-1 12s ease-in-out infinite alternate, blob-spin 30s linear infinite; }
          .blob-2 { animation: blob-morph-2 15s ease-in-out infinite alternate-reverse, blob-spin-reverse 35s linear infinite; }
          .blob-3 { animation: blob-morph-1 18s ease-in-out infinite alternate, blob-spin 40s linear infinite; }
          .blob-4 { animation: blob-morph-2 10s ease-in-out infinite alternate-reverse, blob-spin-reverse 25s linear infinite; }
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
          @keyframes blob-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
          @keyframes blob-spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
          @keyframes slide-up {
            from { transform: translateY(100vh); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
          .animate-slide-up {
            animation: slide-up 1.2s cubic-bezier(0.2, 0.9, 0.3, 1) forwards;
          }
        `}
      </style>

      {/* Background Blobs */}
      <div className="blob-1 absolute -top-32 -left-32 w-[600px] h-[600px] bg-[#efcb40] opacity-90 mix-blend-multiply origin-center"></div>
      <div className="blob-2 absolute -bottom-20 -left-10 w-[400px] h-[400px] bg-[#efcb40] opacity-90 mix-blend-multiply origin-center"></div>
      <div className="blob-3 absolute -top-40 -right-20 w-[800px] h-[800px] bg-[#efcb40] opacity-90 mix-blend-multiply origin-center"></div>
      <div className="blob-4 absolute -bottom-40 right-10 w-[500px] h-[500px] bg-[#efcb40] opacity-90 mix-blend-multiply origin-center"></div>

      {/* Small decorative dots */}
      <div className="absolute top-24 left-[20%] w-6 h-6 rounded-full bg-[#efcb40] animate-[bounce_4s_ease-in-out_infinite]"></div>
      <div className="absolute top-32 left-[25%] w-3 h-3 rounded-full bg-[#efcb40] animate-[bounce_3s_ease-in-out_infinite_0.5s]"></div>
      <div className="absolute top-20 right-[30%] w-8 h-8 rounded-full bg-[#efcb40] opacity-60 animate-[bounce_5s_ease-in-out_infinite_1s]"></div>
      <div className="absolute bottom-32 left-[35%] w-4 h-4 rounded-full bg-[#efcb40] animate-[bounce_3.5s_ease-in-out_infinite_0.2s]"></div>

      <div 
        key={isLogin ? 'login' : 'signup'}
        className={`w-full max-w-md bg-echo-white rounded-3xl shadow-2xl overflow-hidden border border-echo-border relative z-10 ${isLogin ? 'animate-slide-up' : ''}`}
      >
        <div className="p-12">
          <h2 className="text-5xl font-black text-center mb-3 tracking-tighter text-[#1a1a1a]">
            echo<span className="text-echo-yellow">.</span>
          </h2>
          <p className="text-[#857109] text-center font-semibold mb-10 text-lg">
            {isLogin ? 'Welcome back. Sign in to chat.' : 'Join the conversation today.'}
          </p>

          {globalError && (
            <div className={`p-4 rounded-xl mb-8 text-sm font-bold text-center border ${globalError.includes('successful') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              {globalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-echo-muted mb-2 ml-1 uppercase tracking-widest">Username</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className={getInputClass('username')}
                  placeholder="Choose a username"
                />
                {errors.username && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{errors.username}</p>}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-echo-muted mb-2 ml-1 uppercase tracking-widest">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={getInputClass('email')}
                placeholder="Enter your email"
              />
              {errors.email && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-echo-muted mb-2 ml-1 uppercase tracking-widest">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={getInputClass('password')}
                placeholder="Enter your password"
              />
              {errors.password && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{errors.password}</p>}
            </div>

            {!isLogin && (
              <div>
                <label className="block text-xs font-bold text-echo-muted mb-2 ml-1 uppercase tracking-widest">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={getInputClass('confirmPassword')}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="text-red-500 text-xs font-bold mt-2 ml-1">{errors.confirmPassword}</p>}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 mt-6 bg-[#1a1a1a] hover:bg-black text-echo-yellow font-extrabold rounded-2xl shadow-[0_10px_20px_rgba(0,0,0,0.1)] transition-all transform hover:-translate-y-1 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-xl tracking-tight"
            >
              {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
          </form>

          <div className="mt-10 text-center text-sm font-bold text-echo-muted">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setErrors({});
                setGlobalError('');
                setFormData({ username: '', email: '', password: '', confirmPassword: '' });
              }}
              className="text-[#1a1a1a] hover:text-[#857109] underline decoration-2 underline-offset-4 transition-colors"
            >
              {isLogin ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
