# AgroPilot AI — Backend deployment

Node.js API server with JSON-file persistence and optional external API integrations. Deploy this folder to Render, Railway, Fly.io, or another Node host.

## Deploy steps
1. Create a new Node.js web service from this folder/repository.
2. Build command: leave blank (no dependencies required). Start command: `npm start`.
3. Set environment variables in the host dashboard: `FRONTEND_ORIGIN` (exact deployed frontend origin), and optional `OPENAI_API_KEY`, `OPENAI_MODEL`, `DATA_GOV_IN_API_KEY`, `PLANT_ID_API_KEY`. Keep keys only on the backend.
4. After deploy, test `https://YOUR-BACKEND-URL/api/health`.
5. Paste that backend URL into `frontend/config.js` and redeploy the frontend.

## Important persistence note
The prototype stores data in `data/agropilot-data.json` and uploaded images in `uploads/`. Many cloud hosts have ephemeral filesystems; configure a persistent disk/volume or replace JSON storage with a managed database before relying on saved records.

## Production cautions
This is a prototype, not production-hardened. Before real farmer data: add authentication/authorization, request rate limits, robust validation, secure upload scanning, a managed database, backups, monitoring, and a strict CORS origin. Do not set `FRONTEND_ORIGIN=*` for production. Live third-party features require valid provider keys and separate testing.
