import AlienTranslator from '../components/AlienTranslator';
import Link from 'next/link';

export default function TestVoice() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <Link href="/locker" className="text-gray-500 mb-8 hover:text-white pb-10">
         ← Back to Locker
      </Link>
      
      <h1 className="text-3xl text-white font-bold mb-8">Audio Capture Test</h1>
      
      <AlienTranslator />

      <div className="mt-12 p-4 border border-neutral-800 rounded text-neutral-500 text-xs max-w-md text-center">
        <strong>Day 1 Checklist:</strong><br/>
        1. Click & Hold Green Button.<br/>
        2. Speak for 3 seconds.<br/>
        3. Release Button.<br/>
        4. Check Developer Console (CMD+Option+J) for Base64 Data.
      </div>
    </div>
  );
}