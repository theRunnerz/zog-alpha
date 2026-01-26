// lib/tron.js
export const connectWallet = async () => {
  // Check if TronLink is injected
  if (window.tronWeb) { 
    try {
      // Request account access if needed (modern TronLink)
      const res = await window.tronWeb.request({ method: 'tron_requestAccounts' });
      if (res.code === 200) {
        return window.tronWeb.defaultAddress.base58;
      }
    } catch(e) {
      // Fallback for older TronLink versions just reading the address
      if(window.tronWeb.ready && window.tronWeb.defaultAddress.base58) {
         return window.tronWeb.defaultAddress.base58;
      }
    }
  }
  return null;
};