import { useEffect } from 'react';
import { VoiceOrb } from '../features/orb/components/VoiceOrb';
import { ChatUI } from '../features/conversation/components/ChatUI';
import { useOrbStore } from '../stores/useOrbStore';
import { OrbState } from '../types';
import { Transcript } from '../features/voice/components/Transcript';
import { AnimatedGridPattern } from '../components/ui/animated-grid-pattern';
import { useScreensaver } from '../hooks/useScreensaver';
import { cn } from '../lib/utils';
import { TopNav } from '../features/settings/components/TopNav';
import { DevControls } from '../features/settings/components/DevControls';
import { useChat } from '../features/conversation/hooks/useChat';
import { useVoice } from '../features/voice/hooks/useVoice';
import { useSettingsStore } from '../stores/useSettingsStore';

export const Home = () => {
  const state = useOrbStore((state) => state.state);
  const errorMessage = useOrbStore((state) => state.errorMessage);
  const theme = useSettingsStore((state) => state.theme);
  const appMode = useSettingsStore((state) => state.appMode);
  const { messages, handleSendMessage } = useChat();
  const { interimTranscript, startMic, stopMic, micActive } = useVoice(handleSendMessage);
  const isScreensaver = useScreensaver(30000); // 30 seconds

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        startMic();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
        e.preventDefault();
        stopMic();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [appMode, startMic, stopMic]);

  return (
    <div className={cn("w-full h-full relative font-sans overflow-hidden transition-colors duration-1000", theme, theme === 'dark' ? "text-white bg-[#161618]" : "text-gray-900 bg-gray-50")}>
      {/* Animated Grid Pattern behind everything */}
      <div className={cn(
        "absolute inset-0 z-0 transition-colors duration-1000",
        isScreensaver ? "bg-black" : "bg-transparent"
      )}>
        <AnimatedGridPattern
          numSquares={50}
          maxOpacity={isScreensaver ? 0.4 : 0.15}
          duration={3}
          repeatDelay={1}
          className={cn(
            "transition-all duration-1000",
            isScreensaver
              ? "[mask-image:none] inset-0 h-[100%] skew-y-0 animate-oled-pan"
              : "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)] inset-x-0 inset-y-[-30%] h-[160%] skew-y-12"
          )}
        />
      </div>

      <div className={cn("z-10 absolute inset-0 transition-opacity duration-1000", (appMode === 'hands-free' && !isScreensaver) ? "opacity-100 pointer-events-none" : "opacity-0 pointer-events-none")}>
        <VoiceOrb />
      </div>

      {/* Wrapper to hide the rest of the UI during screensaver */}
      <div className={cn("absolute inset-0 transition-opacity duration-1000", isScreensaver ? "opacity-0 pointer-events-none" : "opacity-100")}>
        {state === OrbState.Error && errorMessage && (
          <div className="absolute top-1/3 w-full flex justify-center z-20 pointer-events-none">
            <div className="bg-red-500/20 text-red-200 border border-red-500/30 px-6 py-3 rounded-lg backdrop-blur-md font-medium">
              {errorMessage}
            </div>
          </div>
        )}

        {appMode === 'hands-free' ? (
          <Transcript messages={interimTranscript ? [...messages, { id: 'interim', role: 'user', text: interimTranscript }] : messages} isActive={state !== OrbState.Idle} />
        ) : (
          <div className="absolute inset-0 z-10">
            <ChatUI 
              messages={interimTranscript ? [...messages, { id: 'interim', role: 'user', text: interimTranscript }] : messages} 
              onSendMessage={handleSendMessage} 
              currentState={state} 
              ModelAvatar={<VoiceOrb isMini orbStateOverride={state} />}
            />
          </div>
        )}

        <TopNav />
        <DevControls 
          onSimulateMessage={handleSendMessage}
          onStartMic={startMic}
          onStopMic={stopMic}
          micActive={micActive}
        />
      </div>
    </div>
  );
};
