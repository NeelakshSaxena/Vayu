import { useState } from 'react';
import { VoiceOrb } from './components/VoiceOrb/VoiceOrb';
import { useOrbStore } from './stores/useOrbStore';
import { Mood, OrbState } from './types';
import { audioAnalyzer } from './utils/AudioAnalyzer';

function App() {
  const { state, mood, intensity, setState, setMood, setIntensity } = useOrbStore();
  const [micActive, setMicActive] = useState(false);

  const toggleMic = async () => {
    if (!micActive) {
      await audioAnalyzer.initialize();
      setMicActive(true);
      setState(OrbState.Listening);
    } else {
      audioAnalyzer.stop();
      setMicActive(false);
      setState(OrbState.Idle);
    }
  };

  return (
    <div className="w-full h-full relative font-sans text-white bg-gray-900 overflow-hidden">
      <VoiceOrb />
      
      {/* UI Overlay for testing */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-4 bg-black/50 p-4 rounded-xl backdrop-blur-sm border border-white/10">
        <h1 className="text-xl font-bold tracking-wider text-white/90">AI VOICE ORB</h1>
        
        <div className="flex flex-col gap-2">
          <label className="text-xs uppercase tracking-widest text-white/50">State</label>
          <div className="flex flex-wrap gap-2">
            {Object.values(OrbState).map((s) => (
              <button 
                key={s}
                onClick={() => setState(s)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${state === s ? 'bg-white text-black font-semibold' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
          <label className="text-xs uppercase tracking-widest text-white/50">Mood</label>
          <div className="flex flex-wrap gap-2 max-w-[300px]">
            {Object.values(Mood).map((m) => (
              <button 
                key={m}
                onClick={() => setMood(m)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${mood === m ? 'bg-blue-500 text-white font-semibold' : 'bg-white/10 hover:bg-white/20'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>



        <div className="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
          <label className="text-xs uppercase tracking-widest text-white/50">Microphone (Audio Reactivity)</label>
          <button 
            onClick={toggleMic}
            className={`px-4 py-2 rounded font-bold transition-colors ${micActive ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
          >
            {micActive ? 'Stop Mic' : 'Start Mic'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;
