# AgroPilot AI — Frontend deployment

This folder is a static website for Netlify, Vercel (static), GitHub Pages, or any static host.

## Deploy
1. Open `config.js`.
2. Replace `https://YOUR-BACKEND-URL` with the public HTTPS URL of your deployed backend (no trailing slash).
3. Upload the **contents of this folder** to your static host.
4. In the backend host settings, set `FRONTEND_ORIGIN` to this frontend's exact origin, e.g. `https://your-site.netlify.app`.

If you deploy frontend and backend on the same origin, you can leave `window.AGROPILOT_API_BASE` blank. Do not put API keys in frontend files.
