/* components/AlienTranslator.js - FINAL VERSION */
import { useState, useEffect } from 'react';
import { Mic, Square, Loader2, Volume2, ArrowRightLeft, Keyboard, X } from 'lucide-react';
import { useRecorder } from '../hooks/useRecorder';

export default function AlienTranslator({ onClose }) {
  const { isRecording, startRecording, stopRecording, audioBase64 } = useRecorder();
  
  // UI State
  const [volume, setVolume] = useState(0);
  const [status, setStatus] = useState("idle"); 
  const [result, setResult] = useState("");
  const [targetLang, setTargetLang] = useState("Spanish");
  
  // Text Mode State
  const [showTextMode, setShowTextMode] = useState(false);
  const [textInput, setTextInput] = useState("");

  // Fake volume visualizer
  useEffect(() => {
    if (!isRecording) { setVolume(0); return; }
    const interval = setInterval(() => setVolume(Math.random() * 100), 100);
    return () => clearInterval(interval);
  }, [isRecording]);

  // Trigger Audio Translation
  useEffect(() => {
    if (audioBase64) handleTranslation(audioBase64, 'audio');
  }, [audioBase64]);

  const handleTranslation = async (payload, type) => {
    setStatus("processing");
    setResult("");

    // Prepare body based on type (audio vs text)
    const body = type === 'audio' 
      ? { audio: payload, targetLang }
      : { text: payload, targetLang }; // You'll need to update API to handle 'text' (see Step 2)

    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (data.translation) {
        setResult(data.translation);
        setStatus("success");
        speak(data.translation);
        setTextInput(""); // Clear text input if used
      } else {
        throw new Error("No translation returned");
      }
    } catch (e) {
      console.error(e);
      setResult("Comm Link Failed.");
      setStatus("error");
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    
    let langCode = 'en-US'; 
    if (targetLang === 'Spanish') langCode = 'es';
    if (targetLang === 'French') langCode = 'fr';
    if (targetLang === 'Tagalog') langCode = 'tl';
    
    const voice = voices.find(v => v.lang.includes(langCode));
    if (voice) utterance.voice = voice;
    
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ 
      backgroundColor: '#000', border: '1px solid #14532d', borderRadius: '24px', 
      padding: '24px', maxWidth: '360px', width: '100%', margin: '0 auto',
      boxShadow: '0 0 40px rgba(22, 163, 74, 0.2)', position: 'relative'
    }}>
      
      {/* Close Button (Optional if used as modal) */}
      {onClose && (
        <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', color: '#444', background: 'none', border: 'none', cursor: 'pointer' }}>
          <X size={20} />
        </button>
      )}

      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
           <h3 style={{ color: '#22c55e', fontSize: '10px', letterSpacing: '2px', fontFamily: 'monospace', margin: 0 }}>UNIVERSAL TRANSLATOR</h3>
           <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginTop: '5px' }}>
             <select 
                value={targetLang} 
                onChange={(e) => setTargetLang(e.target.value)}
                style={{ backgroundColor: '#111', color: 'white', border: '1px solid #333', borderRadius: '4px', fontSize: '14px', padding: '2px 8px' }}
             >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="Tagalog">Tagalog</option>
             </select>
           </div>
        </div>
        <ArrowRightLeft size={16} color="#666" />
      </div>

      {/* DISPLAY SCREEN */}
      <div style={{ 
        backgroundColor: '#111', borderRadius: '12px', border: '1px solid #333', 
        minHeight: '120px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '20px', marginBottom: '20px', overflow: 'hidden'
      }}>
        
        {/* State: Recording */}
        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '40px' }}>
            {[...Array(6)].map((_, i) => (
               <div key={i} style={{ width: '8px', backgroundColor: '#22c55e', height: `${Math.max(20, Math.random() * volume)}%`, transition: 'height 0.1s' }} />
            ))}
          </div>
        )}

        {/* State: Processing */}
        {status === "processing" && (
           <div style={{ color: '#22c55e', textAlign: 'center' }}>
             <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
             <span style={{ fontSize: '10px', fontFamily: 'monospace' }}>PROCESSING...</span>
           </div>
        )}

        {/* State: Success */}
        {status === "success" && (
            <div style={{ animation: 'fadeIn 0.5s' }}>
              <p style={{ color: 'white', fontSize: '18px', fontWeight: 'bold', margin: '0 0 10px 0', lineHeight: 1.2 }}>"{result}"</p>
              <button onClick={() => speak(result)} style={{ color: '#666', background: 'none', border: 'none', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', margin: '0 auto', cursor: 'pointer' }}>
                <Volume2 size={14} /> REPLAY
              </button>
            </div>
        )}

        {/* State: Idle */}
        {status === "idle" && !isRecording && (
          <div style={{ color: '#666', fontSize: '12px', fontFamily: 'monospace', textAlign: 'center' }}>
             {showTextMode ? "ENTER TEXT BELOW" : "HOLD BUTTON TO SPEAK"}
          </div>
        )}
      </div>

      {/* CONTROLS */}
      {!showTextMode ? (
        // MICROPHONE MODE
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
            disabled={status === "processing"}
            style={{ 
               width: '80px', height: '80px', borderRadius: '50%',
               backgroundColor: isRecording ? 'rgba(239, 68, 68, 0.2)' : '#16a34a', // FORCED GREEN HEX
               border: isRecording ? '2px solid #ef4444' : '2px solid #4ade80',
               display: 'flex', alignItems: 'center', justifyContent: 'center',
               cursor: status === 'processing' ? 'not-allowed' : 'pointer',
               boxShadow: isRecording ? '0 0 20px #ef4444' : '0 0 20px rgba(34, 197, 94, 0.4)',
               transition: 'all 0.1s'
            }}
          >
            {isRecording ? <Square size={24} color="#ef4444" fill="#ef4444" /> : <Mic size={32} color="#000" />}
          </button>
          
          {/* Switch to Text Button */}
          <button 
             onClick={() => setShowTextMode(true)}
             style={{ position: 'absolute', right: '10px', bottom: '10px', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}
          >
            <Keyboard size={20} />
          </button>
        </div>
      ) : (
        // TEXT INPUT MODE
        <div style={{ display: 'flex', gap: '10px' }}>
           <input 
             type="text" 
             value={textInput}
             onChange={(e) => setTextInput(e.target.value)}
             placeholder="Type message..."
             style={{ flex: 1, backgroundColor: '#111', border: '1px solid #333', color: 'white', padding: '10px', borderRadius: '8px', outline: 'none' }}
           />
           <button 
             onClick={() => handleTranslation(textInput, 'text')}
             style={{ backgroundColor: '#16a34a', color: 'black', fontWeight: 'bold', border: 'none', padding: '0 20px', borderRadius: '8px', cursor: 'pointer' }}
           >
             GO
           </button>
           <button onClick={() => setShowTextMode(false)} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}><X size={20}/></button>
        </div>
      )}

      {/* FOOTER */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', gap: '10px', opacity: 0.5 }}>
         <div style={{ width: '40px', height: '4px', backgroundColor: '#333', borderRadius: '2px' }}></div>
      </div>
    </div>
  );
}