// Set this to the public URL where server.py is deployed.
// Leave it empty when running the app locally with: python server.py
const currentOrigin = window.location && window.location.protocol && window.location.protocol.startsWith('http')
  ? window.location.origin
  : '';

window.MEDIA_API_BASE = currentOrigin;