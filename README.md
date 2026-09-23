# Ravi Kumar Sarma — 3D Portfolio

A responsive single-page 3D portfolio designed from the supplied resume.

## Run locally
Open `index.html` directly, or for best results use a local server:

```bash
python -m http.server 8080
```

Then open http://localhost:8080

## Deploy
Upload the folder to Netlify, Vercel, GitHub Pages or any static host.

## Notes
- Three.js is loaded from jsDelivr for the WebGL 3D background.
- If the CDN cannot load, the page automatically falls back to a lightweight Canvas2D particle background.
- The page is responsive and includes reduced-motion accessibility handling.
