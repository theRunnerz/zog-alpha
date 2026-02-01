/* components/RefereeOverlay.js */
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export default function RefereeOverlay({ trigger }) {
  const [comment, setComment] = useState("");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;

    // Fetch comment from AI
    const fetchComment = async () => {
      try {
        const res = await fetch('/api/referee', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(trigger) // { event: 'GOAL', score: 10 }
        });
        const data = await res.json();
        setComment(data.commentary);
        setVisible(true);
        
        // Hide after 3 seconds
        setTimeout(() => setVisible(false), 3000);
      } catch (e) {
        console.error(e);
      }
    };

    fetchComment();
  }, [trigger]); // Runs whenever 'trigger' changes

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            style={{
                position: 'absolute',
                top: '20%', // Positioned near top of game
                left: '50%',
                transform: 'translateX(-50%)',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                border: '2px solid #22c55e',
                color: '#22c55e',
                padding: '15px 30px',
                borderRadius: '12px',
                fontFamily: 'monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                textAlign: 'center',
                zIndex: 50,
                boxShadow: '0 0 20px rgba(34, 197, 94, 0.4)',
                maxWidth: '90%'
            }}
        >
          <span style={{ fontSize: '10px', display: 'block', color: '#666', marginBottom: '5px' }}>REF-BOT 9000:</span>
          "{comment}"
        </motion.div>
      )}
    </AnimatePresence>
  );
}