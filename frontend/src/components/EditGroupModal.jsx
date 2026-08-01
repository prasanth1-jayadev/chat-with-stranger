import { useState, useEffect } from 'react';
import { X, Volume2, Image as ImageIcon, Loader2 } from 'lucide-react';
import roomService from '../api/services/roomService';
import uploadService from '../api/services/uploadService';

export default function EditGroupModal({ isOpen, onClose, activeChat, onUpdateSuccess }) {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && activeChat) {
      setGroupName(activeChat.name || '');
      setDescription(activeChat.description || '');
      setLogoUrl(activeChat.logoUrl || '');
      setTags(activeChat.tags || []);
      setError('');
    }
  }, [isOpen, activeChat]);

  if (!isOpen) return null;

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!groupName.trim()) {
      setError('Group name is required.');
      return;
    }
    
    if (uploadingLogo) {
      setError('Please wait for the image to finish uploading.');
      return;
    }

    setLoading(true);
    try {
      const updatedRoom = await roomService.updateRoom(activeChat.id, {
        name: groupName,
        description,
        logoUrl,
        tags
      });
      
      onClose();
      if (onUpdateSuccess) {
        onUpdateSuccess(updatedRoom);
      }
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update group');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploadingLogo(true);
      setError('');
      const response = await uploadService.uploadImage(file);
      setLogoUrl(response.imageUrl);
    } catch (err) {
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred overlay */}
      <div 
        className="absolute inset-0 bg-echo-bg/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-[28rem] bg-echo-white/85 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col transform transition-all">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between relative">
          <div>
            <h2 className="text-3xl font-bold mb-1 tracking-tight">edit group</h2>
            <p className="text-echo-muted text-sm tracking-wide">
              update the details of your room.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-echo-text hover:opacity-50 transition-opacity"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-8 overflow-y-auto max-h-[80vh]">
          {error && <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-lg text-sm font-bold border border-red-200">{error}</div>}

          <form className="space-y-5" onSubmit={handleSubmit}>
            
            {/* Group Name */}
            <div>
              <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-2">
                group name
              </label>
              <input 
                type="text" 
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                className="w-full bg-transparent border-b border-echo-border pb-2 focus:outline-none focus:border-echo-text text-[15px] font-medium transition-colors"
                placeholder=" "
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-2">
                description
              </label>
              <input 
                type="text" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-transparent border-b border-echo-border pb-2 focus:outline-none focus:border-echo-text text-[15px] font-medium transition-colors"
                placeholder=" "
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-2">
                room background image
              </label>
              
              {logoUrl ? (
                <div className="relative w-full h-32 rounded-xl overflow-hidden border border-echo-border group">
                  <img src={logoUrl} alt="Room Logo" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      type="button" 
                      onClick={() => setLogoUrl('')}
                      className="px-4 py-2 bg-red-500 text-white rounded-full text-xs font-bold shadow-md hover:bg-red-600"
                    >
                      Remove Image
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-echo-border rounded-xl cursor-pointer hover:bg-echo-yellow/5 hover:border-echo-yellow/50 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingLogo ? (
                      <Loader2 className="w-8 h-8 text-echo-yellow animate-spin mb-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-echo-muted mb-2 group-hover:text-echo-yellow transition-colors" />
                    )}
                    <p className="text-sm text-echo-muted font-medium">
                      {uploadingLogo ? 'Uploading...' : (
                        <>Click to upload <span className="font-bold text-echo-text">local image</span></>
                      )}
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                    disabled={uploadingLogo}
                  />
                </label>
              )}
            </div>

            {/* Topic Tags */}
            <div>
              <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-2">
                topic tags
              </label>
              <input 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-transparent border-b border-echo-border pb-2 focus:outline-none focus:border-echo-text text-[15px] font-medium transition-colors mb-2"
                placeholder=" "
              />
              <div className="flex flex-wrap gap-2">
                {tags.map(tag => (
                  <span 
                    key={tag} 
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-echo-border text-xs font-medium text-echo-muted"
                  >
                    #{tag}
                    <button 
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="hover:text-echo-text focus:outline-none"
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="mt-6 p-4 rounded-2xl bg-echo-yellow border border-[#e3c72b] flex items-center gap-4 shadow-sm relative overflow-hidden">
               <div className="w-12 h-12 rounded-full bg-echo-white flex items-center justify-center shrink-0 shadow-sm border border-white/50">
                 <Volume2 size={24} className="text-echo-text" />
               </div>
               <div className="flex-1 relative z-10 min-w-0">
                 <p className="text-[10px] font-bold text-[#857109] tracking-widest uppercase mb-1">
                   {activeChat?.isPrivate ? 'private group' : 'public group'}
                 </p>
                 <h4 className="font-bold text-lg leading-tight text-echo-text truncate">
                   {groupName || 'new group name'}
                 </h4>
                 <p className="text-sm font-medium text-[#857109] italic truncate">
                   {description || 'no description yet...'}
                 </p>
               </div>
               
               {/* Decorative glare */}
               <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-r from-transparent to-white/20 transform skew-x-[-20deg] translate-x-12"></div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full mt-6 py-4 bg-[#1c1c1c] hover:bg-black text-echo-white rounded-full font-bold text-[15px] tracking-widest uppercase shadow-xl transition-all transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'saving...' : 'save changes'}
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}
