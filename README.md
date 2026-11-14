# Stylish QR Code Generator & Studio

A colorful, high-energy Python and web QR code generator with live media galleries and database persistence.

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the desktop GUI:

```bash
python qr_generator.py
```

3. Or run the modern web QR Studio with the backend server.

---

## Running the Backend Server (Continuous)

The Python backend provides media uploads, shared galleries, and database persistence. It can run continuously in the background until explicitly turned off:

- **Start continuous server**: Double-click `start_server.bat` (or run `.\start_server.ps1`). It launches the server in the background and opens the web app at `http://localhost:8000`.
- **Check server status**: Run `server_status.bat` to see whether the server is active, its port, PID, and uptime.
- **Stop server**: Run `stop_server.bat` (or `.\stop_server.ps1`) when you want to shut it down.

Alternatively, run in the foreground:
```bash
python server.py
```

---

## Media Uploads & Galleries

Media uploads require the Python server (`server.py`) because static hosting environments like GitHub Pages cannot run Python or store uploaded media.

When running locally with `start_server.bat` or `python server.py`, media uploads work automatically.

For a GitHub Pages deployment, deploy `server.py` to a public Python host (such as Render using `render.yaml`). Then configure the public backend URL in `media-config.js`:

```js
window.MEDIA_API_BASE = 'https://your-python-backend.example.com';
```

---

## Features

- **Continuous Background Server**: Runs quietly until you decide to stop it via `stop_server.bat`.
- **Live Status Indicator**: Real-time server health pill inside the web UI.
- **Bold, Vibrant Dark Theme**: Deep obsidian/carbon surfaces with electric flame gradients, neon accents, and zero dull dark blue.
- **Multi-Format Media Support**: Upload photos & videos into dedicated shareable gallery pages.
- **Full QR Customization**: Shapes (dots, classic, liquid), corner eye styles, foreground gradients, and center icon presets.
- **High-Res Export**: Download QR cards as PNG or SVG images with custom branding.
