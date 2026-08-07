import { useState, useRef } from 'react';
import { X, Volume2, Eye, EyeOff, Image as ImageIcon, Loader2, Crop, Trash2 } from 'lucide-react';
import roomService from '../api/services/roomService';
import uploadService from '../api/services/uploadService';
import ImageCropModal from './ImageCropModal';

export default function CreateGroupModal({ isOpen, onClose }) {
  const [isPublic, setIsPublic] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['design', 'crypto']);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [maxCapacity, setMaxCapacity] = useState(50);
  const [loading, setLoading] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [error, setError] = useState('');

  // Image Crop & Preview State
  const [rawImageSrc, setRawImageSrc] = useState('');
  const [showCropModal, setShowCropModal] = useState(false);
  const fileInputRef = useRef(null);

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
      await roomService.createRoom({
        name: groupName,
        isPrivate: !isPublic,
        description,
        logoUrl,
        tags,
        password: !isPublic ? password : undefined,
        requiresApproval: !isPublic,
        maxCapacity: Number(maxCapacity) || 50
      });
      
      // Reset form and close
      setGroupName('');
      setDescription('');
      setLogoUrl('');
      setRawImageSrc('');
      setTags(['design', 'crypto']);
      setPassword('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Verify file is an image
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawImageSrc(reader.result);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);

    // Reset input so re-selecting same file triggers change
    if (e.target) e.target.value = '';
  };

  const handleCropComplete = async (croppedBlob, croppedPreviewUrl) => {
    try {
      setUploadingLogo(true);
      setError('');
      // Set immediate local preview
      setLogoUrl(croppedPreviewUrl);

      const response = await uploadService.uploadImage(croppedBlob);
      setLogoUrl(response.imageUrl);
    } catch (err) {
      console.error('Failed to upload image:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Blurred overlay */}
      <div 
        className="absolute inset-0 bg-echo-bg/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-[28rem] bg-echo-white/95 backdrop-blur-2xl rounded-3xl sm:rounded-[2rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col transform transition-all max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-3 sm:pb-4 flex items-start justify-between relative">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-1 tracking-tight">create group</h2>
            <p className="text-echo-muted text-xs sm:text-sm tracking-wide">
              set the stage for your next great conversation.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-echo-text hover:opacity-50 transition-opacity p-1"
          >
            <X size={22} strokeWidth={1.5} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 overflow-y-auto max-h-[75vh]">
          
          {/* Public / Private Toggle */}
          <div className="flex border border-echo-border rounded-full p-1 mb-6 w-full">
            <button 
              type="button"
              onClick={() => setIsPublic(true)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold tracking-wide transition-all ${
                isPublic ? 'bg-echo-yellow text-echo-text shadow-sm border border-[#e3c72b]' : 'text-echo-muted hover:text-echo-text'
              }`}
            >
              public
            </button>
            <button 
              type="button"
              onClick={() => setIsPublic(false)}
              className={`flex-1 py-2 rounded-full text-sm font-semibold tracking-wide transition-all ${
                !isPublic ? 'bg-echo-yellow text-echo-text shadow-sm border border-[#e3c72b]' : 'text-echo-muted hover:text-echo-text'
              }`}
            >
              private
            </button>
          </div>

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

            {/* Max Capacity */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase">
                  max capacity
                </label>
                <span className="text-xs font-bold text-echo-text bg-echo-yellow/40 px-2 py-0.5 rounded-md">
                  {maxCapacity} members
                </span>
              </div>
              <input 
                type="range" 
                min="2" 
                max="200" 
                step="1"
                value={maxCapacity}
                onChange={(e) => setMaxCapacity(Number(e.target.value))}
                className="w-full accent-[#1c1c1c] cursor-pointer"
              />
            </div>

            {/* Logo Upload */}
            <div>
              <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-2">
                room background image
              </label>
              
              {logoUrl ? (
                <div className="relative w-full h-36 rounded-2xl overflow-hidden border border-echo-border bg-[#f3efe4] group shadow-inner">
                  <img src={logoUrl} alt="Room Logo" className="w-full h-full object-cover" />
                  
                  {uploadingLogo && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-2 text-white">
                      <Loader2 className="w-6 h-6 animate-spin text-echo-yellow" />
                      <span className="text-xs font-bold">Uploading cropped image...</span>
                    </div>
                  )}

                  {!uploadingLogo && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2 p-3">
                      {rawImageSrc && (
                        <button 
                          type="button" 
                          onClick={() => setShowCropModal(true)}
                          className="px-3 py-1.5 bg-echo-yellow text-[#1a1a1a] rounded-full text-xs font-bold shadow-md hover:bg-yellow-400 flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                          title="Recrop Image"
                        >
                          <Crop size={13} />
                          Recrop
                        </button>
                      )}
                      
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 bg-white/90 text-[#1a1a1a] rounded-full text-xs font-bold shadow-md hover:bg-white flex items-center gap-1 cursor-pointer transition-transform active:scale-95"
                        title="Change Image"
                      >
                        <ImageIcon size={13} />
                        Change
                      </button>

                      <button 
                        type="button" 
                        onClick={() => { setLogoUrl(''); setRawImageSrc(''); }}
                        className="p-1.5 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 cursor-pointer transition-transform active:scale-95"
                        title="Remove Image"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-echo-border rounded-xl cursor-pointer hover:bg-echo-yellow/5 hover:border-echo-yellow/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    {uploadingLogo ? (
                      <Loader2 className="w-8 h-8 text-echo-yellow animate-spin mb-2" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-echo-muted mb-2 group-hover:text-echo-yellow transition-colors" />
                    )}
                    <p className="text-sm text-echo-muted font-medium">
                      {uploadingLogo ? 'Processing & Uploading...' : (
                        <>Click to select & <span className="font-bold text-echo-text">crop room image</span></>
                      )}
                    </p>
                    <span className="text-[11px] text-echo-muted/70 mt-0.5">Supports PNG, JPG, WebP</span>
                  </div>
                </div>
              )}

              {/* Hidden file input */}
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange} 
                disabled={uploadingLogo}
              />
            </div>

            {/* Password (if private) */}
            {!isPublic && (
              <div className="space-y-4">
                <div className="relative">
                  <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-2">
                    password
                  </label>
                  <input 
                    type={showPassword ? "text" : "password"} 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent border-b border-echo-border pb-2 focus:outline-none focus:border-echo-text text-[15px] font-medium transition-colors pr-10"
                    placeholder=" "
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-6 text-echo-muted hover:text-echo-text transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Tags */}
            <div>
              <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-2">
                tags
              </label>
              <input 
                type="text" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleAddTag}
                className="w-full bg-transparent border-b border-echo-border pb-2 focus:outline-none focus:border-echo-text text-[15px] font-medium transition-colors mb-3"
                placeholder="press enter to add tag"
              />
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span 
                    key={tag}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-echo-border/40 text-echo-text"
                  >
                    #{tag}
                    <button 
                      type="button" 
                      onClick={() => removeTag(tag)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Preview Card */}
            <div className="mt-6 p-4 rounded-2xl bg-echo-yellow border border-[#e3c72b] flex items-center gap-4 shadow-sm relative overflow-hidden">
               <div className="w-12 h-12 rounded-full bg-echo-white flex items-center justify-center shrink-0 shadow-sm border border-white/50 overflow-hidden">
                 {logoUrl ? (
                   <img src={logoUrl} alt="logo" className="w-full h-full object-cover" />
                 ) : (
                   <Volume2 size={24} className="text-echo-text" />
                 )}
               </div>
               <div className="flex-1 relative z-10 min-w-0">
                 <p className="text-[10px] font-bold text-[#857109] tracking-widest uppercase mb-1">
                   {isPublic ? 'public group' : 'private group'}
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
              className="w-full mt-6 py-4 bg-[#1c1c1c] hover:bg-black text-echo-white rounded-full font-bold text-[15px] tracking-widest uppercase shadow-xl transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {loading ? 'creating...' : 'create group'}
            </button>
            
          </form>
        </div>
      </div>

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={showCropModal}
        onClose={() => setShowCropModal(false)}
        imageSrc={rawImageSrc}
        onCropComplete={handleCropComplete}
        aspectRatio={1}
      />
    </div>
  );
}
