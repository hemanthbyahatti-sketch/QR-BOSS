// Set this to the public URL where server.py is deployed (e.g. 'https://your-backend.onrender.com').
// Leave it as default when running locally with: python server.py
(function () {
  const isHttp = typeof window !== 'undefined' && window.location && window.location.protocol && window.location.protocol.startsWith('http');
  const hostname = (typeof window !== 'undefined' && window.location && window.location.hostname) || '';
  const isGitHubPages = hostname.endsWith('github.io');
  const isLiveServer = (hostname === 'localhost' || hostname === '127.0.0.1') && window.location.port && window.location.port !== '8000';

  let defaultBase = '';
  if (isHttp && !isGitHubPages && !isLiveServer) {
    defaultBase = window.location.origin;
  } else if (!isGitHubPages) {
    defaultBase = 'http://localhost:8000';
  }

  // To connect a GitHub Pages deployment to a live Python backend, paste its URL here:
  // window.MEDIA_API_BASE = 'https://your-python-backend.example.com';
  if (!window.MEDIA_API_BASE) {
    window.MEDIA_API_BASE = defaultBase;
  }
})();