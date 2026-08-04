import { useState, useEffect, useRef } from 'react';
import { VoiceOrb } from './components/VoiceOrb/VoiceOrb';
import { useOrbStore } from './stores/useOrbStore';
import { Mood, OrbState } from './types';
import { audioAnalyzer } from './utils/AudioAnalyzer';
import { Transcript } from './components/Transcript';
import type { Message } from './components/Transcript';
import { OpenRouter } from "@openrouter/sdk";

import { AnimatedGridPattern } from './components/ui/animated-grid-pattern';
import { cn } from './lib/utils';

// Initialize OpenRouter
const openrouter = new OpenRouter({
  apiKey: import.meta.env.VITE_OPEN_ROUTER_KEY || "",
});

const DEFAULT_MODEL = import.meta.env.VITE_OPEN_ROUTER_MODEL || "openrouter/free";

function App() {
  const { state, mood, setState, setMood, theme, setTheme, errorMessage, setErrorMessage } = useOrbStore();
  const [micActive, setMicActive] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);


  const messagesRef = useRef<Message[]>([]);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const generateAIResponse = async (chatHistory: Message[]) => {
    try {
      setState(OrbState.Thinking);

      const aiMessageId = Date.now().toString();
      setMessages((prev) => [...prev, { id: aiMessageId, role: 'model', text: "" }]);

      const stream = (await openrouter.chat.send({
        chatRequest: {
          model: DEFAULT_MODEL,
          messages: chatHistory.map(msg => ({
            role: msg.role === 'model' ? 'assistant' : msg.role,
            content: msg.text
          }) as any),
          stream: true
        }
      })) as any;

      setState(OrbState.Speaking);

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: msg.text + content } 
                : msg
            )
          );
        }
      }

      setTimeout(() => {
        setState(OrbState.Idle);
      }, 5000);

    } catch (error: any) {
      console.error("OpenRouter Error:", error);
      setErrorMessage(error.message || "Failed to generate AI response");
      setState(OrbState.Error);
      setTimeout(() => { setState(OrbState.Idle); setErrorMessage(null); }, 3000);
    }
  };

  const stateRef = useRef(state);
  const micActiveRef = useRef(micActive);
  
  useEffect(() => {
    stateRef.current = state;
    micActiveRef.current = micActive;
  }, [state, micActive]);

  const startMic = async () => {
    if (stateRef.current !== OrbState.Idle && stateRef.current !== OrbState.Error) return;
    if (micActiveRef.current) return;

    await audioAnalyzer.initialize();
    
    // Start UI recording immediately so visualizer reacts
    audioAnalyzer.startRecording();
    setMicActive(true);
    setState(OrbState.Listening);
  };

  const stopMic = async () => {
    if (!micActiveRef.current) return;
    
    setMicActive(false);
    setState(OrbState.Thinking);
    
    const audioBlob = await audioAnalyzer.stopRecording();
    
    if (!audioBlob) {
      setState(OrbState.Idle);
      return;
    }

    try {
      const apiKey = import.meta.env.VITE_SARVAM_API_KEY;
      const formData = new FormData();
      // Important: Provide a filename with an extension that matches the Blob's mime type 
      // (MediaRecorder defaults to audio/webm) so Sarvam recognizes it
      formData.append('file', audioBlob, 'audio.webm'); 

      const response = await fetch('https://api.sarvam.ai/speech-to-text', {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey
        },
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.message || `Sarvam STT failed with status ${response.status}`);
      }

      const result = await response.json();
      const finalText = result.transcript;

      if (!finalText || finalText.trim() === '') {
        // No speech detected
        setState(OrbState.Idle);
        return;
      }

      setMessages((prev) => {
        const finalMsg: Message = { id: Date.now().toString(), role: 'user', text: finalText };
        generateAIResponse([...messagesRef.current, finalMsg]);
        return [...prev, finalMsg];
      });

    } catch (error: any) {
      console.error("Sarvam STT Error:", error);
      setErrorMessage(error.message || "Failed to transcribe audio");
      setState(OrbState.Error);
      setTimeout(() => { setState(OrbState.Idle); setErrorMessage(null); }, 3000);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        startMic();
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
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
  }, []);

  return (
    <div className={cn("w-full h-full relative font-sans overflow-hidden transition-colors duration-1000", theme === 'dark' ? "text-white bg-[#161618]" : "text-gray-900 bg-gray-50")}>
      {/* Animated Grid Pattern behind everything */}
      <AnimatedGridPattern
        numSquares={50}
        maxOpacity={0.15}
        duration={3}
        repeatDelay={1}
        className={cn(
          "[mask-image:radial-gradient(800px_circle_at_center,white,transparent)]",
          "inset-x-0 inset-y-[-30%] h-[160%] skew-y-12 z-0"
        )}
      />
      
      <div className="z-10 absolute inset-0 pointer-events-none">
        <VoiceOrb />
      </div>
      
      {state === OrbState.Error && errorMessage && (
        <div className="absolute top-1/3 w-full flex justify-center z-20 pointer-events-none">
          <div className="bg-red-500/20 text-red-200 border border-red-500/30 px-6 py-3 rounded-lg backdrop-blur-md font-medium">
            {errorMessage}
          </div>
        </div>
      )}

      <Transcript messages={messages} isActive={state !== OrbState.Idle} />

      {/* Top Navigation Bar mimicking the screenshot */}
      <div className="absolute top-0 w-full p-8 flex justify-between items-start z-20 pointer-events-none">
        <div className="flex-1" />
        <div className={cn("backdrop-blur-md px-6 py-2 rounded-full border text-sm font-medium transition-colors", theme === 'dark' ? "bg-white/10 border-white/5 text-white/80" : "bg-black/10 border-black/5 text-black/80")}>
          <LiveClock />
        </div>
        <div className="flex gap-4 flex-1 justify-end">
          <div 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn("w-10 h-10 rounded-full backdrop-blur-md flex justify-center items-center pointer-events-auto cursor-pointer transition-colors", theme === 'dark' ? "bg-white/10 hover:bg-white/20" : "bg-black/10 hover:bg-black/20")}
          >
            {/* Theme Icon */}
            {theme === 'dark' ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z"/></svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12,18a6,6,0,1,1,6-6A6.006,6.006,0,0,1,12,18ZM12,8a4,4,0,1,0,4,4A4,4,0,0,0,12,8ZM12,4a1,1,0,0,0,1-1V2a1,1,0,0,0-2,0V3A1,1,0,0,0,12,4Zm0,16a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V21A1,1,0,0,0,12,20ZM22,11H21a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2ZM4,12a1,1,0,0,0-1-1H2a1,1,0,0,0,0,2H3A1,1,0,0,0,4,12Zm14.657-6.071a1,1,0,0,0,.707-.293l.707-.707a1,1,0,1,0-1.414-1.414l-.707.707a1,1,0,0,0,.707,1.707ZM5.343,18.071l-.707.707a1,1,0,1,0,1.414,1.414l.707-.707a1,1,0,1,0-1.414-1.414Zm14.021,0a1,1,0,1,0-1.414,1.414l.707.707a1,1,0,0,0,1.414-1.414ZM4.636,5.636a1,1,0,0,0,1.414-1.414l-.707-.707A1,1,0,0,0,3.929,4.929Z"/></svg>
            )}
          </div>
          <div className={cn("w-10 h-10 rounded-full backdrop-blur-md flex justify-center items-center pointer-events-auto cursor-pointer transition-colors", theme === 'dark' ? "bg-white/10 hover:bg-white/20" : "bg-black/10 hover:bg-black/20")}>
            {/* Widget Icon */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M4,11V4H11V11ZM4,20V13H11V20ZM13,11V4H20V11ZM13,20V13H20V20Z"/></svg>
          </div>
        </div>
      </div>
      
      {/* Developer Control UI Overlay */}
      <div className={cn("absolute top-32 left-8 z-30 flex flex-col gap-4 p-4 rounded-xl backdrop-blur-sm border scale-75 origin-top-left transition-colors", theme === 'dark' ? "bg-black/50 border-white/10" : "bg-white/50 border-black/10")}>
        <h1 className={cn("text-xl font-bold tracking-wider", theme === 'dark' ? "text-white/90" : "text-black/90")}>DEV CONTROLS</h1>
        
        <div className="flex flex-col gap-2">
          <label className={cn("text-xs uppercase tracking-widest", theme === 'dark' ? "text-white/50" : "text-black/50")}>State</label>
          <div className="flex flex-wrap gap-2 max-w-[200px]">
            {Object.values(OrbState).map((s) => (
              <button 
                key={s}
                onClick={() => setState(s)}
                className={`px-3 py-1 rounded text-xs transition-colors ${state === s ? (theme === 'dark' ? 'bg-white text-black font-semibold' : 'bg-black text-white font-semibold') : (theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black')}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        
        <div className={cn("flex flex-col gap-2 mt-2 pt-4 border-t", theme === 'dark' ? "border-white/10" : "border-black/10")}>
          <label className={cn("text-xs uppercase tracking-widest", theme === 'dark' ? "text-white/50" : "text-black/50")}>Mood</label>
          <div className="flex flex-wrap gap-2 max-w-[200px]">
            {Object.values(Mood).map((m) => (
              <button 
                key={m}
                onClick={() => setMood(m)}
                className={`px-3 py-1 rounded text-xs transition-colors ${mood === m ? 'bg-blue-500 text-white font-semibold' : (theme === 'dark' ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-black')}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className={cn("flex flex-col gap-2 mt-2 pt-4 border-t", theme === 'dark' ? "border-white/10" : "border-black/10")}>
          <label className={cn("text-xs uppercase tracking-widest", theme === 'dark' ? "text-white/50" : "text-black/50")}>Push To Talk</label>
          <button 
            onMouseDown={startMic}
            onMouseUp={stopMic}
            onMouseLeave={stopMic}
            className={`px-4 py-3 rounded font-bold transition-colors text-white ${micActive ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {micActive ? 'Recording... (Release)' : 'Hold Spacebar to Speak'}
          </button>
        </div>

        <div className={cn("flex flex-col gap-2 mt-2 pt-4 border-t", theme === 'dark' ? "border-white/10" : "border-black/10")}>
          <label className={cn("text-xs uppercase tracking-widest", theme === 'dark' ? "text-white/50" : "text-black/50")}>Mic Input Level</label>
          <MicVisualizer theme={theme} />
        </div>
      </div>

    </div>
  );
}

const MicVisualizer = ({ theme = 'dark' }: { theme?: 'dark' | 'light' }) => {
  const [vol, setVol] = useState(0);
  useEffect(() => {
    let id: number;
    const loop = () => {
      setVol(audioAnalyzer.getAudioData().volume);
      id = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="flex items-center gap-2 h-8">
      <div className="flex gap-1 items-end h-full">
        {Array.from({ length: 5 }).map((_, i) => (
          <div 
            key={i} 
            className="w-2 bg-green-400 rounded-t transition-all duration-75" 
            style={{ height: `${Math.max(10, (vol * 150) - (i * 10))}%`, opacity: vol > 0.01 ? 1 : 0.3 }} 
          />
        ))}
      </div>
      <div className={cn("text-xs font-mono w-12", theme === 'dark' ? "text-white/50" : "text-black/50")}>{(vol * 100).toFixed(1)}</div>
    </div>
  );
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  
  return (
    <>
      {time.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })} &bull; {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
    </>
  );
};

export default App;
