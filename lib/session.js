export function getSessionId() {
  if (typeof window === 'undefined') return null;
  let id = localStorage.getItem('zog_session');
  if (!id) {
    id = 'zog_' + Math.random().toString(36).slice(2, 12);
    localStorage.setItem('zog_session', id);
  }
  return id;
}