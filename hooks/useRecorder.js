import { useState, useRef } from "react";

export const useRecorder = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBase64, setAudioBase64] = useState(null); // The final string for Gemini
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      // 1. Get Microphone Stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Determine MimeType (Safari vs Chrome)
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/mp4"; // Fallback for some iOS versions

      // 3. Setup Recorder
      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // 4. Collect Data
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // 5. Start
      mediaRecorder.start();
      setIsRecording(true);
      setAudioBase64(null); // Reset previous recording

    } catch (err) {
      console.error("Mic Access Denied:", err);
      alert("Please allow microphone access to use the Zog Translator.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return;

    // Stop the recorder
    mediaRecorderRef.current.stop();
    setIsRecording(false);

    // Process the data when it stops
    mediaRecorderRef.current.onstop = () => {
      const mimeType = mediaRecorderRef.current.mimeType;
      const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
      
      // Convert Blob -> Base64 for Gemini
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = () => {
        const base64String = reader.result;
        // console.log("Raw Capture:", base64String.slice(0, 50) + "..."); // Debug
        setAudioBase64(base64String); 
      };

      // Stop all audio tracks to turn off the red "recording" dot in browser tab
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    };
  };

  return {
    isRecording,
    startRecording,
    stopRecording,
    audioBase64,
  };
};