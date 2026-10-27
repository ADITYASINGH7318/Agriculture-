# AgroPilot AI backend (local development)

## What is connected
- Node.js HTTP server using built-in modules only (no `npm install` needed).
- Serves the website and API from the same origin at `http://127.0.0.1:3000`.
- JSON-file persistence in `data/agropilot-data.json`, created on first save.
- Core API: health, farms, activities and crop shortlists.
- Generic persisted collections for calendar tasks, crop recovery follow-ups, crop triage logs, soil checks, expenses, notifications and settings.
- Farm form, crop shortlist save, decision activity log, crop triage and calendar/recovery list changes attempt to sync to backend; browser-local copy is retained if the server is unavailable.

## Run on macOS
1. Install Node.js 18 or newer.
2. Extract the ZIP and open the `agriculture-project-updated` folder in VS Code.
3. In the VS Code terminal run `npm start`.
4. Open `http://127.0.0.1:3000` (do not use Live Server if you want backend sync).
5. Check `http://127.0.0.1:3000/api/health`.
6. Run `npm run check` for JavaScript syntax checks.

No package installation is needed.

## API examples
```bash
curl http://127.0.0.1:3000/api/health
curl http://127.0.0.1:3000/api/farms
curl -X POST http://127.0.0.1:3000/api/shortlists \
  -H 'Content-Type: application/json' \
  -d '{"location":"Demo district","shortlist":[{"crop":"Wheat","score":70}]}'
curl -X PUT http://127.0.0.1:3000/api/data/calendar/replace \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"id":"task-1","task":"Check field moisture","date":"2026-10-29","priority":"Medium"}]}'
curl http://127.0.0.1:3000/api/data/calendar
curl -X POST http://127.0.0.1:3000/api/data/cropScans \
  -H 'Content-Type: application/json' \
  -d '{"crop":"Wheat","leadingClue":"Possible water stress"}'
```

## Important: what is NOT production-ready
This is a single-user local demo backend. It has no backend-managed login/session, user separation, production database, HTTPS deployment, backups, rate limiting, or cloud hosting. Signup/login in the current frontend remains browser-local and is **not secure authentication**. Do not store passwords, Aadhaar, bank details or other sensitive information in this prototype. JSON collections are useful for demos, not concurrent multi-user production use.

External features also need their own integrations: trained Crop Doctor model files, a verified live mandi data source, Google Places API key for rich business details, and an AI provider/backend secret for a generative chatbot. Weather uses the public Open-Meteo endpoint from the browser and needs internet. The crop shortlist and symptom triage are transparent rule-based helpers, not validated agronomic diagnosis or guaranteed profit estimates.

Before deployment for real farmers, migrate to PostgreSQL/SQLite with migrations, implement backend authentication and per-user authorization, server-side validation, HTTPS, secrets management, rate limits, backups, privacy/consent and security testing.

## Local crop-photo file storage

The backend now accepts crop photos at `POST /api/uploads` as a JSON payload with `dataUrl`, `originalName`, and optional `crop`/`location`. It accepts JPEG, PNG, and WebP images up to 4 MB. Files are saved under `uploads/crop-health/`; metadata is stored in `data/agropilot-data.json` and can be listed with `GET /api/uploads`. The API response includes a local URL for opening the saved image.

This is local prototype storage, not a cloud service or secure multi-user document store. Run the app with `npm start` (not only VS Code Live Server) so the browser can send uploads to the Node.js backend. Uploaded photos remain on that computer until manually removed. Avoid uploading personal documents or sensitive information.
