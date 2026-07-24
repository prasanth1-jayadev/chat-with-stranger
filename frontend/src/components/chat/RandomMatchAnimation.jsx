import React from 'react';
import './RandomMatchAnimation.css';
import { MessageCircle, Globe, Users, Sparkles } from 'lucide-react';

export default function RandomMatchAnimation({ isSearching, onStart, onCancel }) {
  const personIcon = (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.8"/>
      <path d="M4.5 20c1.2-4 4-6 7.5-6s6.3 2 7.5 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );

  const avatars = [
    { radius: 148, angle: 0,   dir: 1,  dur: 16 },
    { radius: 148, angle: 90,  dir: 1,  dur: 16 },
    { radius: 148, angle: 180, dir: 1,  dur: 16 },
    { radius: 148, angle: 270, dir: 1,  dur: 16 },
    { radius: 110, angle: 45,  dir: -1, dur: 12, gold: true },
    { radius: 110, angle: 135, dir: -1, dur: 12 },
    { radius: 110, angle: 225, dir: -1, dur: 12 },
    { radius: 110, angle: 315, dir: -1, dur: 12 },
  ];

  return (
    <div className="match-stage">
      {/* Floating Side Animations */}
      <div className="match-side-animations">
         <div className="side-float-item side-item-1"><MessageCircle size={28} /></div>
         <div className="side-float-item side-item-2"><Globe size={32} /></div>
         <div className="side-float-item side-item-3"><Users size={24} /></div>
         <div className="side-float-item side-item-4"><Sparkles size={28} /></div>
         <div className="side-float-item side-item-5"><MessageCircle size={22} /></div>
         <div className="side-float-item side-item-6"><Users size={30} /></div>
      </div>

      <h1 className="match-heading">
        {isSearching ? 'Finding a ' : 'Meet a '}<span className="match-accent">Stranger.</span>
      </h1>
      <p className="match-sub">
        {isSearching 
          ? "Sit tight — we're pairing you with someone completely new for a one-on-one conversation." 
          : "Dive into a spontaneous, one-on-one conversation with someone completely new."}
      </p>

      <div className="match-orb-wrap">
        <div className="match-ambient"></div>
        <div className="match-track"></div>
        {isSearching && (
          <>
            <div className="match-dashed-ring"></div>
            <div className="match-spinner"></div>
          </>
        )}
        {!isSearching && (
           <div className="match-dashed-ring" style={{ animationPlayState: 'paused', opacity: 0.5 }}></div>
        )}

        <div className="match-orb" style={{ animationPlayState: isSearching ? 'running' : 'paused' }}>
          <div className="match-scan-ring s1"></div>
          <div className="match-scan-ring s2"></div>
          <div className="match-scan-ring s3"></div>
          {isSearching && <div className="match-sweep"></div>}
          <div className="match-glass">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="10.5" cy="10.5" r="6.5" stroke="#E8BA33" strokeWidth="2"/>
              <line x1="15.3" y1="15.3" x2="21" y2="21" stroke="#E8BA33" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>
        </div>

        {isSearching && avatars.map((a, i) => {
          const startDelay = '-' + ((a.angle / 360) * a.dur).toFixed(2) + 's';
          return (
            <div 
              key={i} 
              className={`match-orbit ${a.dir === -1 ? 'reverse' : ''}`}
              style={{ animationDuration: a.dur + 's', animationDelay: startDelay }}
            >
              <div 
                className="match-radius-holder"
                style={{ transform: `translate(${a.radius}px, 0)` }}
              >
                <div 
                  className={`match-avatar ${a.gold ? 'gold' : ''}`}
                  style={{ 
                    color: a.gold ? '#E8BA33' : '#8A8172',
                    animationDuration: a.dur + 's',
                    animationDirection: a.dir === 1 ? 'reverse' : 'normal',
                    animationDelay: startDelay
                  }}
                >
                  {personIcon}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="match-status" style={{ opacity: isSearching ? 1 : 0, pointerEvents: 'none' }}>
        MATCHING YOU NOW<span className="match-dot">.</span><span className="match-dot">.</span><span className="match-dot">.</span>
      </div>

      <button 
        className="match-action-btn" 
        type="button" 
        onClick={isSearching ? onCancel : onStart}
      >
        {isSearching ? 'CANCEL SEARCH' : 'START MATCH'}
      </button>
    </div>
  );
}
