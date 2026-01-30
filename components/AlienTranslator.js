import { useState, useEffect } from 'react';
import { Mic, Square, Loader2, Volume2, ArrowRightLeft } from 'lucide-react'; // Added ArrowRightLeft icon
import { useRecorder } from '../hooks/useRecorder';

export default function AlienTranslator() {
  const { isRecording, startRecording, stopRecording, audioBase64 } = useRecorder();
  
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState("idle"); 
  const [result, setResult] = useState("");
  const [targetLang, setTargetLang] = useState("Spanish"); 

  // Fake volume visualizer
  useEffect(() => {
    if (!isRecording) { setVolume(0); return; }
    const interval = setInterval(() => setVolume(Math.random() * 100), 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Send to API when recording stops
  useEffect(() => {
    if (audioBase64) handleTranslation(audioBase64);
  }, [audioBase64]);

  const handleTranslation = async (base64) => {
    setStatus("processing");
    setResult("");

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ audio: base64, targetLang })
      });

      const data = await res.json();
      if (data.translation) {
        setResult(data.translation);
        setStatus("success");
        speak(data.translation);
      } else {
        throw new Error("No translation returned");
      }
    } catch (e) {
      console.error(e);
      setResult("Signal lost.");
      setStatus("error");
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Voice matching logic
    const voices = window.speechSynthesis.getVoices();
    let langCode = 'en-US'; // Default
    if (targetLang === 'Spanish') langCode = 'es';
    if (targetLang === 'French') langCode = 'fr';
    if (targetLang === 'Tagalog') langCode = 'tl'; // Some systems use 'fil'
    
    // Find a voice that matches roughly
    const voice = voices.find(v => v.lang.includes(langCode));
    if (voice) utterance.voice = voice;
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="p-6 bg-black border border-green-900 rounded-3xl max-w-sm mx-auto text-center shadow-[0_0_30px_rgba(22,163,74,0.2)]">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-green-900/30 pb-4">
        <div className="text-left">
          <p className="text-[10px] text-green-500 font-mono tracking-widest uppercase mb-1">TARGET LANGUAGE</p>
          
          {/* FANCY DROPDOWN */}
          <div className="relative inline-block">
            <select 
              value={targetLang} 
              onChange={(e) => setTargetLang(e.target.value)}
              className="appearance-none bg-neutral-900 text-white text-sm font-bold border border-neutral-700 rounded px-3 py-1 pr-8 outline-none focus:border-green-500 cursor-pointer uppercase"
            >
              <option value="English">🇬🇧 English</option>
              <option value="Spanish">🇪🇸 Spanish</option>
              <option value="French">🇫🇷 French</option>
              <option value="Tagalog">🇵🇭 Tagalog</option>
            </select>
            {/* Custom arrow for dropdown */}
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
            </div>
          </div>
        </div>

        <div className="text-right opacity-50">
           <ArrowRightLeft className="text-green-500 w-5 h-5" />
        </div>
      </div>

      {/* Screen Area */}
      <div className="min-h-[140px] bg-neutral-900 rounded-xl border border-neutral-800 mb-6 flex flex-col items-center justify-center relative overflow-hidden p-4">
        
        {isRecording && (
          <div className="flex items-end gap-1 h-12">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="w-3 bg-green-500 transition-all duration-75" style={{ height: `${Math.max(10, Math.random() * volume)}%` }} />
            ))}
          </div>
        )}

        {status === "processing" && (
           <div className="flex flex-col items-center gap-2 text-green-500">
             <Loader2 className="animate-spin" size={24} />
             <span className="text-xs font-mono animate-pulse">DETECTING LANGUAGE...</span>
           </div>
        )}

        {status === "success" && (
            <div className="animate-in fade-in zoom-in duration-300">
              <p className="text-white text-lg font-bold leading-tight">"{result}"</p>
              <button onClick={() => speak(result)} className="mt-4 text-xs text-neutral-500 hover:text-green-500 uppercase tracking-wide flex items-center justify-center gap-2 w-full">
                <Volume2 size={14} /> Play Voice
              </button>
            </div>
        )}

        {status === "idle" && !isRecording && (
          <div className="text-neutral-600 text-xs font-mono">
            PRESS HOLD TO SPEAK<br/>
            (Any Language)
          </div>
        )}
        
        {status === "error" && (
          <div className="text-red-500 text-xs font-mono">{result}</div>
        )}
      </div>

      {/* Microphone Button */}
      <button
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
        onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
        disabled={status === "processing"}
        className={`
          relative w-24 h-24 rounded-full flex items-center justify-center border-4 transition-all duration-100 mx-auto group
          ${isRecording 
            ? 'bg-red-500/20 border-red-500 scale-95 shadow-[0_0_30px_rgba(239,68,68,0.5)]' 
            : status === "processing" 
              ? 'bg-neutral-800 border-neutral-700 opacity-50 cursor-not-allowed'
              : 'bg-green-600 border-green-400 hover:bg-green-500 hover:scale-105 shadow-[0_0_20px_rgba(34,197,94,0.4)]'
          }
        `}
      >
        {isRecording ? <Square size={32} className="text-red-500 fill-current" /> : <Mic size={32} className="text-black group-hover:scale-110 transition-transform" />}
      </button>

      <p className="mt-6 text-neutral-600 text-[10px] uppercase font-mono">
        {status === "processing" ? "Gemini 1.5 Flash // Analyzing..." : "Ready to Translate"}
      </p>
    </div>
  );
}