import React from 'react';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import chatbotIcon from '../../../assets/chatbot.png';
import { cn } from '../../../lib/utils';

export const TopNav: React.FC = () => {
  const { theme, appMode, setTheme, setAppMode, showDevControls, setShowDevControls } = useSettingsStore();

  return (
    <div className="absolute top-0 w-full p-8 flex justify-between items-start z-20 pointer-events-none">
      <div className="flex-1" />
      <div className={cn("backdrop-blur-md p-1 rounded-full border text-sm font-medium transition-colors flex items-center pointer-events-auto", theme === 'dark' ? "bg-white/10 border-white/5 text-white/80" : "bg-black/10 border-black/5 text-black/80")}>
        <img src={chatbotIcon} alt="Logo" className={cn("w-6 h-6 mx-3", theme === 'dark' ? "invert" : "")} />
        <button
          onClick={() => setAppMode('hands-free')}
          className={cn("px-4 py-1.5 rounded-full transition-colors", appMode === 'hands-free' ? (theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white') : 'hover:bg-white/10')}
        >
          Hands-free mode
        </button>
        <button
          onClick={() => setAppMode('hands-on')}
          className={cn("px-4 py-1.5 rounded-full transition-colors", appMode === 'hands-on' ? (theme === 'dark' ? 'bg-white text-black' : 'bg-black text-white') : 'hover:bg-white/10')}
        >
          Hands-on mode
        </button>
      </div>
      <div className="flex gap-4 flex-1 justify-end">
        <div
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className={cn("w-10 h-10 rounded-full backdrop-blur-md flex justify-center items-center pointer-events-auto cursor-pointer transition-colors", theme === 'dark' ? "bg-white/10 hover:bg-white/20" : "bg-black/10 hover:bg-black/20")}
        >
          {theme === 'dark' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" /></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12,18a6,6,0,1,1,6-6A6.006,6.006,0,0,1,12,18ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8ZM12,4a1,1,0,0,0,1-1V2a1,1,0,0,0-2,0V3A1,1,0,0,0,12,4Zm0,16a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V21A1,1,0,0,0,12,20ZM22,11H21a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2ZM4,12a1,1,0,0,0-1-1H2a1,1,0,0,0,0,2H3A1,1,0,0,0,4,12Zm14.657-6.071a1,1,0,0,0,.707-.293l.707-.707a1,1,0,1,0-1.414-1.414l-.707.707a1,1,0,0,0,.707,1.707ZM5.343,18.071l-.707.707a1,1,0,1,0,1.414,1.414l.707-.707a1,1,0,1,0-1.414-1.414Zm14.021,0a1,1,0,1,0-1.414,1.414l.707.707a1,1,0,0,0,1.414-1.414ZM4.636,5.636a1,1,0,0,0,1.414-1.414l-.707-.707A1,1,0,0,0,3.929,4.929Z" /></svg>
          )}
        </div>
        <div
          onClick={() => setShowDevControls(!showDevControls)}
          className={cn("w-10 h-10 rounded-full backdrop-blur-md flex justify-center items-center pointer-events-auto cursor-pointer transition-colors", theme === 'dark' ? "bg-white/10 hover:bg-white/20" : "bg-black/10 hover:bg-black/20")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4,11V4H11V11ZM4,20V13H11V20ZM13,11V4H20V11ZM13,20V13H20V20Z" /></svg>
        </div>
      </div>
    </div>
  );
};
