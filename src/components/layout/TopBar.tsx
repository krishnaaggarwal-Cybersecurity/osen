import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const TopBar: React.FC = () => {
  const { operator, isAudioMuted, toggleAudioMute } = useApp();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    setCurrentTime(new Date().toLocaleTimeString());
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="min-h-[72px] h-[72px] bg-white border-b border-slate-200 px-6 flex items-center justify-between z-30 sticky top-0 font-sans shadow-sm">
      {/* Brand title with Logo image with deep blue background and pixelated font (Items 7 & 8) */}
      <div className="flex items-center space-x-3.5">
        <div className="w-11 h-11 rounded-xl bg-[#0B7FF5] border border-blue-400/40 p-2 flex items-center justify-center shadow-md shrink-0">
          <img src="/logo.png" alt="NetraGridAI Logo" className="w-full h-full object-contain" />
        </div>
        <h1 className="font-sans text-xl md:text-2xl tracking-tight text-slate-900 font-bold uppercase select-none">
          NetraGridAI
        </h1>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-4">
        <button
          onClick={toggleAudioMute}
          className={`p-1.5 rounded-lg text-xs flex items-center space-x-1.5 transition-calm border ${
            isAudioMuted
              ? 'bg-slate-100 border-slate-200 text-slate-500'
              : 'bg-blue-50 border-blue-200 text-[#0B7FF5]'
          }`}
          title={isAudioMuted ? 'Unmute alert audio' : 'Mute alert audio'}
        >
          {isAudioMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          <span className="text-[11px] font-mono hidden lg:inline">{isAudioMuted ? 'Muted' : 'Audio On'}</span>
        </button>

        <div className="font-mono text-xs text-[#0B7FF5] bg-slate-50 border border-slate-200 px-3 py-1 rounded-lg tracking-wider font-semibold">
          {currentTime || '00:00:00 AM'}
        </div>

        <div className="flex items-center space-x-2 pl-3 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-blue-100 border border-blue-300 flex items-center justify-center text-[#0B7FF5] font-bold text-xs">
            <User className="w-4 h-4" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-xs font-bold text-slate-900 leading-tight">{operator.id}</div>
            <div className="text-[10px] text-slate-500">{operator.role}</div>
          </div>
        </div>
      </div>
    </header>
  );
};
