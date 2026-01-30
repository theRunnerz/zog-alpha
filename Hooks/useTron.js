// hooks/useTron.js
import { useState, useEffect } from 'react';

export function useTron() {
  const [address, setAddress] = useState(null);

  useEffect(() => {
    // Check if TronLink is injected
    const checkTron = async () => {
      if (window.tronWeb && window.tronWeb.defaultAddress.base58) {
        setAddress(window.tronWeb.defaultAddress.base58);
      }
    };

    // Listen for TronLink load
    window.addEventListener('message', (e) => {
      if (e.data.message && e.data.message.action == "setAccount") {
        checkTron();
      }
    });
    
    // Initial check
    const timer = setTimeout(checkTron, 1000);
    return () => clearTimeout(timer);
  }, []);

  const connect = async () => {
    if (window.tronWeb) {
      const res = await window.tronWeb.request({ method: 'tron_requestAccounts' });
      if (res.code === 200) {
        setAddress(window.tronWeb.defaultAddress.base58);
      }
    } else {
      alert("Please install TronLink!");
    }
  };

  return { address, connect };
}