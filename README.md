# Stylish QR Code Generator

A colorful Python QR code generator with a simple GUI. Create attractive, styled QR code images using different palettes and visual themes.

## Setup

1. Install dependencies:

```bash
pip install -r requirements.txt
```

2. Run the application:

```bash
python qr_generator.py
```

3. Or open `index.html` in your browser for the modern web-based QR Studio experience.

## Media uploads

Media uploads require the Python server because GitHub Pages cannot run Python or store uploaded files. Run the backend locally with:

```bash
python server.py
```

For a GitHub Pages deployment, deploy `server.py` to a public Python host first. The included `render.yaml` can be used with Render. Then put the backend's public URL in `media-config.js`:

```js
window.MEDIA_API_BASE = 'https://your-python-backend.example.com';
```

The backend URL must include the server that serves `/api/upload-media`, `/api/gallery/{id}`, `/gallery/{id}`, and `/uploads/...`. A GitHub Pages URL alone cannot support the media upload feature.

## Features

- Text or URL input
- Color palette selection
- Foreground/background color pickers
- Style options: Classic, Rounded, Gradient, Two-tone
- Save QR code as PNG
- Live preview after generation

## Notes

Use the `Save QR Code` button to choose the output file location. The default filename is `stylish_qr.png`.
