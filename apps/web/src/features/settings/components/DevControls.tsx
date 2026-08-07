import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '../../../stores/useSettingsStore';
import { useOrbStore } from '../../../stores/useOrbStore';
import { OrbState, Mood } from '../../../types';
import { audioAnalyzer } from '../../../services/audio/AudioAnalyzer';
import { cn } from '../../../lib/utils';
import { useConversationStore } from '../../../stores/useConversationStore';

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

const OutputVisualizer = ({ theme = 'dark' }: { theme?: 'dark' | 'light' }) => {
  const [vol, setVol] = useState(0);
  useEffect(() => {
    let id: number;
    const loop = () => {
      setVol(audioAnalyzer.getOutputAudioData().volume);
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
            className="w-2 bg-blue-400 rounded-t transition-all duration-75"
            style={{ height: `${Math.max(10, (vol * 150) - (i * 10))}%`, opacity: vol > 0.01 ? 1 : 0.3 }}
          />
        ))}
      </div>
      <div className={cn("text-xs font-mono w-12", theme === 'dark' ? "text-white/50" : "text-black/50")}>{(vol * 100).toFixed(1)}</div>
    </div>
  );
};

interface DevControlsProps {
  onSimulateMessage: (text: string) => void;
  onStartMic: () => void;
  onStopMic: () => void;
  micActive: boolean;
}

export const DevControls: React.FC<DevControlsProps> = ({ onSimulateMessage, onStartMic, onStopMic, micActive }) => {
  const { theme, showDevControls } = useSettingsStore();
  const { state, mood, setState, setMood } = useOrbStore();
  const setMessages = useConversationStore((state) => state.setMessages);

  const [simulatedUserInput, setSimulatedUserInput] = useState("");
  const [testModelResponse, setTestModelResponse] = useState("Precise model response testing...");

  if (!showDevControls) return null;

  return (
    <div className={cn("absolute top-20 right-8 z-30 flex flex-col gap-4 p-4 rounded-xl backdrop-blur-sm border scale-90 origin-top-right transition-colors pointer-events-auto", theme === 'dark' ? "bg-black/50 border-white/10" : "bg-white/50 border-black/10")}>
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
          onMouseDown={onStartMic}
          onMouseUp={onStopMic}
          onMouseLeave={onStopMic}
          className={`px-4 py-3 rounded font-bold transition-colors text-white ${micActive ? 'bg-red-500 hover:bg-red-600 animate-pulse' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {micActive ? 'Recording... (Release)' : 'Hold Spacebar to Speak'}
        </button>
      </div>

      <div className={cn("flex flex-col gap-2 mt-2 pt-4 border-t", theme === 'dark' ? "border-white/10" : "border-black/10")}>
        <div className="flex gap-8">
          <div className="flex flex-col gap-2">
            <label className={cn("text-xs uppercase tracking-widest", theme === 'dark' ? "text-white/50" : "text-black/50")}>Mic Input Level</label>
            <MicVisualizer theme={theme} />
          </div>
          <div className="flex flex-col gap-2">
            <label className={cn("text-xs uppercase tracking-widest", theme === 'dark' ? "text-white/50" : "text-black/50")}>Audio Output Level</label>
            <OutputVisualizer theme={theme} />
          </div>
        </div>
      </div>

      <div className={cn("flex flex-col gap-2 mt-2 pt-4 border-t", theme === 'dark' ? "border-white/10" : "border-black/10")}>
        <label className={cn("text-xs uppercase tracking-widest", theme === 'dark' ? "text-white/50" : "text-black/50")}>Simulate User Message</label>
        <textarea
          value={simulatedUserInput}
          onChange={(e) => setSimulatedUserInput(e.target.value)}
          className={`w-full h-16 p-2 text-sm rounded bg-transparent border outline-none ${theme === 'dark' ? 'border-white/20 text-white focus:border-white/50' : 'border-black/20 text-black focus:border-black/50'}`}
          placeholder="Type a message to simulate..."
        />
        <button
          onClick={() => {
            if (!simulatedUserInput.trim()) return;
            onSimulateMessage(simulatedUserInput);
            setSimulatedUserInput("");
          }}
          className="bg-green-600 text-white px-3 py-1.5 rounded text-xs hover:bg-green-500 transition-colors font-semibold"
        >
          Send Message
        </button>
      </div>

      <div className={cn("flex flex-col gap-2 mt-2 pt-4 border-t", theme === 'dark' ? "border-white/10" : "border-black/10")}>
        <label className={cn("text-xs uppercase tracking-widest", theme === 'dark' ? "text-white/50" : "text-black/50")}>Test Speaking Mode</label>
        <textarea
          value={testModelResponse}
          onChange={(e) => setTestModelResponse(e.target.value)}
          className={`w-full h-20 p-2 text-sm rounded bg-transparent border outline-none ${theme === 'dark' ? 'border-white/20 text-white focus:border-white/50' : 'border-black/20 text-black focus:border-black/50'}`}
          placeholder="Enter placeholder text..."
        />
        <button
          onClick={() => {
            setState(OrbState.Speaking);
            const aiMessageId = Date.now().toString() + Math.random().toString(36).substring(2);
            setMessages((prev) => [...prev, { id: aiMessageId, role: 'model', text: testModelResponse }]);
            setTimeout(() => setState(OrbState.Idle), 5000);
          }}
          className="bg-blue-600 text-white px-3 py-1.5 rounded text-xs hover:bg-blue-500 transition-colors font-semibold"
        >
          Simulate Model Response
        </button>
      </div>
    </div>
  );
};
