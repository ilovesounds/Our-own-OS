export const getApiUrl = (path) => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    const port = window.location.port;
    if ((hostname === 'localhost' || hostname === '127.0.0.1') && port !== '8000') {
      return `http://127.0.0.1:8000${path}`;
    }
  }
  return path;
};
