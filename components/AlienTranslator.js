/* components/AlienTranslator.js */
import { useState, useEffect } from 'react';
import { Mic, Square, Activity } from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';

export default function AlienTranslator() {
  const { isRecording, startRecording, stopRecording, audioBase64 } = useRecorder();
  
  // Visualizer fake animation state
  const [volume, setVolume] = useState(0);

  // Fake volume bounce effect when recording
  useEffect(() => {
    if (!isRecording) { setVolume(0); return; }
    const interval = setInterval(() => {
      setVolume(Math.random() * 100);
    }, 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  // TEMPORARY: Log the output to prove Day 1 Success
  useEffect(() => {
    if (audioBase64) {
      console.log("✅ AUDIO PROCESSED FOR GEMINI:");
      console.log(audioBase64); // This is what we send to API tomorrow
      alert("Audio captured! Check Console for Base64 string.");
    }
  }, [audioBase64]);

  return (
    <div className="p-6 bg-black border border-green-900 rounded-3xl max-w-sm mx-auto text-center shadow-[0_0_30px_rgba(22,163,74,0.2)]">
      
      {/* Header */}
      <h3 className="text-green-500 font-mono text-xs tracking-[0.3em] mb-4 uppercase">
        Zog Universal Translator v1
      </h3>

      {/* Visualizer Display */}
      <div className="h-24 bg-neutral-900 rounded-xl border border-neutral-800 mb-6 flex items-center justify-center relative overflow-hidden">
        {isRecording ? (
          <div className="flex items-end gap-1 h-12">
            {[...Array(8)].map((_, i) => (
              <div 
                key={i} 
                className="w-3 bg-green-500 transition-all duration-75"
                style={{ height: `${Math.max(10, Math.random() * volume)}%` }} 
              />
            ))}
          </div>
        ) : (
          <div className="text-neutral-600 text-xs font-mono animate-pulse">
            {audioBase64 ? "DATA READY // WAITING FOR UPLINK" : "PRESS HOLD TO SPEAK"}
          </div>
        )}
      </div>

      {/* The Big Button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
        onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
        className={`
          relative w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-100
          ${isRecording 
            ? 'bg-red-500/20 border-red-500 scale-95 shadow-[0_0_20px_rgba(239,68,68,0.6)]' 
            : 'bg-green-600 border-green-400 hover:bg-green-500 hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
          }
        `}
      >
        {isRecording ? (
          <Square size={32} className="text-red-500 fill-current" />
        ) : (
          <Mic size={32} className="text-black" />
        )}
      </button>

      <p className="mt-6 text-neutral-500 text-[10px] uppercase">
        {isRecording ? "Transmitting..." : "Integrated with Gemini 1.5 Flash"}
      </p>
    </div>
  );
}