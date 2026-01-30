/* hooks/useTron.js */
import { useState, useEffect } from 'react';

export function useTron() {
  const [address, setAddress] = useState(null);

  useEffect(() => {
    // 1. Check if TronLink is already connected on load
    const checkTron = () => {
      if (window.tronWeb && window.tronWeb.ready && window.tronWeb.defaultAddress.base58) {
        setAddress(window.tronWeb.defaultAddress.base58);
      }
    };

    // Initial check
    checkTron();

    // 2. Poll for account changes (TronLink doesn't have great event listeners)
    const interval = setInterval(checkTron, 1000);
    return () => clearInterval(interval);
  }, []);

  const connect = async () => {
    if (window.tronWeb) {
      try {
        await window.tronWeb.request({ method: 'tron_requestAccounts' });
        if(window.tronWeb.ready) {
             setAddress(window.tronWeb.defaultAddress.base58);
        }
      } catch (e) {
        console.error("Connection failed", e);
      }
    } else {
      alert("Please install TronLink!");
    }
  };

  return { address, connect };
}
