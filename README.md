# AgroPilot AI — Autonomous Farm Operations

A browser-based smart-farming learning prototype built with HTML, CSS and JavaScript.

## Start here
Read [`START_HERE.md`](START_HERE.md) first. See [`CONFIGURATION_AND_TESTING.md`](CONFIGURATION_AND_TESTING.md) for feature status, live-service requirements, security notes and smoke checks.

## Run with backend (recommended)
Read [`BACKEND_SETUP.md`](BACKEND_SETUP.md), then run `npm start` and open `http://127.0.0.1:3000`. This enables the local API and persistent backend sync for farms, decision activities and crop shortlists.

## Frontend-only mode
You can still launch `index.html` with Live Server; localStorage saving works, but backend sync will not be available.

## Important limitations
- Farm profiles and crop shortlists save in browser localStorage and can also sync to the included single-user local JSON backend when started with `npm start`.
- Crop recommendations are a rule-based shortlist from a limited crop knowledge base; fit scores are not probabilities or guaranteed outcomes.
- Market prices are sample/demo values unless explicitly marked otherwise.
- The crop scanner requires separately trained TensorFlow.js model files for image-based prediction; photo preview alone is not AI diagnosis.
- Weather availability depends on the current service/network and entered coordinates.
- Nearby shop searches open Google Maps search results; they do not verify stock, opening hours or nearest-provider status.
- Do not use prototype output alone to decide fertilizer, pesticide, irrigation amounts or crop selection. Confirm with a soil test and local agriculture experts/KVK.
