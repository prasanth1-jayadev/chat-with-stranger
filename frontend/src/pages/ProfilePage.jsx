import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { LogOut, Save, Camera, Check } from 'lucide-react';
import { logout, updateUser } from '../store/slices/authSlice';
import userService from '../api/services/userService';

const AVAILABLE_INTERESTS = [
  'Tech & AI', 'Design', 'Music', 'Gaming', 'Lifestyle', 'Business', 'Art', 'Fitness', 'Philosophy', 'Science'
];

export default function ProfilePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [selectedInterests, setSelectedInterests] = useState(user?.interests || []);
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);

  const toggleInterest = (interest) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter(i => i !== interest));
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('interests', JSON.stringify(selectedInterests));
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const data = await userService.updateProfile(formData);

      dispatch(updateUser(data.user));
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Make sure Cloudinary credentials are set on backend.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-echo-bg relative pb-24">
      {/* Massive Header / Cover Photo Area */}
      <div className="w-full h-72 bg-echo-yellow relative overflow-hidden">
        {/* Decorative background element */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/40 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#857109]/20 to-transparent"></div>
      </div>

      <div className="w-full max-w-5xl mx-auto px-8 relative -mt-32">
        <form onSubmit={handleSave} className="bg-echo-white rounded-[3rem] border border-echo-border shadow-[0_20px_50px_rgba(0,0,0,0.05)] p-10 md:p-14">

          {/* Avatar floating between header and card */}
          <div className="flex flex-col md:flex-row md:items-end gap-6 mb-12 -mt-28 relative">
            <div className="relative inline-block self-start">
              <div className="w-36 h-36 rounded-[2.5rem] bg-echo-bg border-[6px] border-echo-white shadow-xl flex items-center justify-center font-bold text-6xl text-echo-text z-10 rotate-3 transform transition-transform hover:rotate-0 overflow-hidden">
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                ) : (
                  username.charAt(0).toUpperCase()
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="absolute -bottom-2 -right-2 w-12 h-12 bg-echo-yellow text-[#1a1a1a] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-20 border-4 border-echo-white"
              >
                <Camera size={20} />
              </button>
            </div>
            <div className="pb-2 flex-1">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-echo-text">{username || 'Your Profile'}</h1>
              <p className="text-echo-muted font-medium mt-2 text-lg">Manage your personal information and preferences.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
            {/* Left Column: Inputs */}
            <div className="space-y-8">
              <div>
                <label className="block text-sm font-bold text-echo-text mb-3 uppercase tracking-wide">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-echo-bg border border-echo-border rounded-2xl px-6 py-5 focus:outline-none focus:border-echo-text transition-colors font-semibold text-lg"
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-echo-text mb-3 uppercase tracking-wide">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-echo-bg border border-echo-border rounded-2xl px-6 py-5 focus:outline-none focus:border-echo-text transition-colors font-semibold text-lg text-echo-muted"
                  placeholder="Enter your email"
                  disabled // Emails often shouldn't be changed easily
                />
              </div>
            </div>

            {/* Right Column: Interests */}
            <div>
              <label className="block text-sm font-bold text-echo-text mb-4 uppercase tracking-wide">Your Interests</label>
              <div className="flex flex-wrap gap-3">
                {AVAILABLE_INTERESTS.map(interest => {
                  const isSelected = selectedInterests.includes(interest);
                  return (
                    <button
                      key={interest}
                      type="button"
                      onClick={() => toggleInterest(interest)}
                      className={`px-6 py-3.5 rounded-full font-bold text-sm transition-all border-2 ${isSelected
                          ? 'bg-echo-yellow border-echo-yellow text-[#1a1a1a] shadow-[0_4px_14px_rgba(238,205,52,0.4)] transform hover:-translate-y-0.5'
                          : 'bg-transparent border-echo-border text-echo-muted hover:border-echo-text hover:text-echo-text hover:bg-echo-bg'
                        }`}
                    >
                      {interest}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-echo-border/50 my-12"></div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleLogout}
              className="px-8 py-4 border-2 border-red-100 text-red-500 hover:bg-red-50 hover:border-red-200 rounded-full font-bold flex items-center gap-2 transition-all"
            >
              <LogOut size={18} /> Logout
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className={`px-12 py-4 rounded-full font-bold flex items-center gap-2 shadow-lg transition-all text-lg ${isSaved
                  ? 'bg-green-500 text-white shadow-green-500/20'
                  : isLoading
                    ? 'bg-gray-400 text-gray-700 cursor-not-allowed'
                    : 'bg-[#1a1a1a] text-echo-yellow hover:bg-black hover:-translate-y-1 hover:shadow-2xl'
                }`}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
              ) : isSaved ? (
                <Check size={22} />
              ) : (
                <Save size={22} />
              )}
              {isLoading ? 'Saving...' : isSaved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
