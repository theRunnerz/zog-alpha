/* components/AlienTranslator.js */
import { useState, useEffect } from 'react';
import { Mic, Square, Loader2, Volume2 } from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';

export default function AlienTranslator() {
  const { isRecording, startRecording, stopRecording, audioBase64 } = useRecorder();
  
  // UI State
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState("idle"); // idle, processing, success, error
  const [result, setResult] = useState("");
  const [targetLang, setTargetLang] = useState("Spanish"); // Default

  // 1. Fake Visualizer Bounce Effect
  useEffect(() => {
    if (!isRecording) { setVolume(0); return; }
    const interval = setInterval(() => setVolume(Math.random() * 100), 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  // 2. TRIGGER API: When audio is captured (audioBase64 updates), send it to the server
  useEffect(() => {
    if (audioBase64) {
      handleTranslation(audioBase64);
    }
  }, [audioBase64]);

  const handleTranslation = async (base64) => {
    setStatus("processing");
    setResult("");

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          audio: base64, 
          targetLang: targetLang 
        })
      });

      const data = await res.json();
      
      if (data.translation) {
        setResult(data.translation);
        setStatus("success");
        speak(data.translation); // Auto-read the result
      } else {
        throw new Error("No translation returned");
      }

    } catch (e) {
      console.error(e);
      setResult("Translation signal lost. Try again.");
      setStatus("error");
    }
  };

  // 3. Text-To-Speech Logic
  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // Stop any previous speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Attempt to select a voice that matches the language
    // Note: Tagalog (tl-PH) might not exist on all computers; it will fallback to default voice.
    const voices = window.speechSynthesis.getVoices();
    let langCode = 'es-ES'; // Default Spanish
    if (targetLang === 'French') langCode = 'fr-FR';
    if (targetLang === 'Tagalog') langCode = 'tl-PH'; // or 'fil-PH'

    const voice = voices.find(v => v.lang.includes(langCode));
    if (voice) utterance.voice = voice;

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6 bg-black border border-green-900 rounded-3xl max-w-sm mx-auto text-center shadow-[0_0_30px_rgba(22,163,74,0.2)]">
      
      {/* Header & Language Selector */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-green-500 font-mono text-xs tracking-widest uppercase">ZOG TRANSLATOR</h3>
        
        {/* LANGUAGE DROPDOWN */}
        <select 
          value={targetLang} 
          onChange={(e) => setTargetLang(e.target.value)}
          className="bg-neutral-900 text-white text-xs border border-neutral-700 rounded p-1 outline-none focus:border-green-500 cursor-pointer"
        >
          <option value="Spanish">Spanish 🇪🇸</option>
          <option value="French">French 🇫🇷</option>
          <option value="Tagalog">Tagalog 🇵🇭</option>
        </select>
      </div>

      {/* Screen Area */}
      <div className="min-h-[120px] bg-neutral-900 rounded-xl border border-neutral-800 mb-6 flex flex-col items-center justify-center relative overflow-hidden p-4">
        
        {/* Mode A: Recording Visualizer */}
        {isRecording && (
          <div className="flex items-end gap-1 h-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-3 bg-green-500 transition-all duration-75" style={{ height: `${Math.max(10, Math.random() * volume)}%` }} />
            ))}
          </div>
        )}

        {/* Mode B: Processing Spinner */}
        {status === "processing" && (
           <div className="flex flex-col items-center gap-2 text-green-500">
             <Loader2 className="animate-spin" size={24} />
             <span className="text-xs font-mono animate-pulse">UPLOADING...</span>
           </div>
        )}

        {/* Mode C: Result Display */}
        {status === "success" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
              <p className="text-white text-lg font-bold leading-tight">"{result}"</p>
              <button 
                onClick={() => speak(result)} 
                className="mt-3 text-neutral-500 hover:text-green-500 flex items-center justify-center gap-2 w-full text-xs uppercase tracking-wide"
              >
                <Volume2 size={14} /> Replay Audio
              </button>
            </div>
        )}

         {/* Mode D: Idle/Error */}
        {status === "idle" && !isRecording && (
          <div className="text-neutral-600 text-xs font-mono">PRESS & HOLD TO SPEAK</div>
        )}
        {status === "error" && (
          <div className="text-red-500 text-xs font-mono">{result}</div>
        )}

      </div>

      {/* The Big Microphone Button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
        onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
        disabled={status === "processing"} // Disable while loading
        className={`
          relative w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-100 mx-auto
          ${isRecording 
            ? 'bg-red-500/20 border-red-500 scale-95 shadow-[0_0_20px_rgba(239,68,68,0.6)]' 
            : status === "processing" 
              ? 'bg-neutral-800 border-neutral-700 opacity-50 cursor-not-allowed'
              : 'bg-green-600 border-green-400 hover:bg-green-500 hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
          }
        `}
      >
        {isRecording ? <Square size={32} className="text-red-500 fill-current" /> : <Mic size={32} className="text-black" />}
      </button>

      <p className="mt-6 text-neutral-500 text-[10px] uppercase">
        {status === "processing" ? "Translating with Gemini 1.5..." : "Zog Communication Uplink Active"}
      </p>
    </div>
  );
}