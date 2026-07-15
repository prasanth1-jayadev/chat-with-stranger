import { useState } from 'react';
import { X, Volume2 } from 'lucide-react';

export default function CreateGroupModal({ isOpen, onClose }) {
  const [isPublic, setIsPublic] = useState(true);
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState(['design', 'crypto']);
  const [password, setPassword] = useState('');

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Blurred overlay */}
      <div 
        className="absolute inset-0 bg-echo-bg/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      ></div>

      {/* Modal Container */}
      <div className="relative w-fit min-w-[26rem] max-w-lg bg-echo-white/85 backdrop-blur-2xl rounded-[2rem] border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.08)] overflow-hidden flex flex-col transform transition-all">
        
        {/* Header */}
        <div className="px-8 pt-8 pb-4 flex items-start justify-between relative">
          <div>
            <h2 className="text-3xl font-bold mb-1 tracking-tight">create group</h2>
            <p className="text-echo-muted text-sm tracking-wide">
              set the stage for your next great conversation.
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

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            
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

            {/* Password (if private) */}
            {!isPublic && (
              <div>
                <label className="block text-[10px] font-bold text-echo-muted tracking-[0.15em] uppercase mb-2">
                  password
                </label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-echo-border pb-2 focus:outline-none focus:border-echo-text text-[15px] font-medium transition-colors"
                  placeholder=" "
                />
              </div>
            )}

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
               <div className="flex-1 relative z-10">
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
              className="w-full mt-6 py-4 bg-[#1c1c1c] hover:bg-black text-echo-white rounded-full font-bold text-[15px] tracking-widest uppercase shadow-xl transition-all transform active:scale-95"
            >
              create group
            </button>
            
          </form>
        </div>
      </div>
    </div>
  );
}
