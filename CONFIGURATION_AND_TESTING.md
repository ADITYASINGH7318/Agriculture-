# AgroPilot AI — working features, setup and integration checklist

## Run locally
1. Extract this folder.
2. Open it in VS Code.
3. Install the **Live Server** extension if needed.
4. Right-click `index.html` → **Open with Live Server**.
5. Use a modern browser and allow network access for live weather / external maps.

## Features that work in the browser prototype
- Browser-local sign-up/login flow (demo only; not production authentication).
- Farm profile records and personalized scheme roadmap saved in this browser.
- Crop recommendation form with input validation, explainable rule-based ranking, top-five shortlist, save-to-browser and print / Save as PDF.
- Live weather forecast through Open-Meteo when the network and service are available; otherwise a clearly labelled demo fallback is shown.
- Crop symptom triage, recovery tracking, soil checklist, farm calendar, task planner, rule-based decision engine and revenue/cost calculator.
- Location-based Google Maps searches and embedded general support-centre map where Google Maps is reachable.
- Official mandi portals and location-specific search links in Market Prices.
- Hindi/English voice input depends on browser Speech Recognition support.

## Integrations that require extra setup or cannot be truthfully claimed as live yet
- **Live mandi rates inside the table:** the table is intentionally marked sample data. The search form opens Agmarknet/e-NAM and a crop/location search; it does not scrape or verify today's rate. A reliable automatic feed needs an official data/API source and potentially credentials or a backend.
- **Image-based crop disease AI:** the UI and TensorFlow.js loader are included, but trained model weights are not included. Follow `MODEL_TRAINING_GUIDE.md` and `train_crop_doctor_colab.ipynb`, then place the trained `model.json`, all referenced `.bin` weight files, and `labels.json` in `models/crop-doctor/`.
- **Google Places business cards with verified phone/hours/rating:** the current shop finder opens Maps searches. In-app Places results require a Google Maps Platform project, enabled APIs, billing, a restricted key, and ideally a backend proxy. Never put an unrestricted secret key in a public frontend or share it in chat.
- **Real AI chat:** the assistant is a rules-based helper, not an LLM. A hosted AI integration requires a backend so secret API keys are not exposed in browser JavaScript.
- **Secure accounts and cross-device sync:** the included login is a local prototype only. Production use requires a trusted authentication provider and server/database. Do not use it to store sensitive identity, banking, or government-document data.
- **Farm-specific scientific yield/profit prediction:** current scores and cost ranges are starter heuristics, not validated agronomic predictions. Confirm with local KVK/agriculture officers, soil tests, verified market rates and locally suitable varieties.

## Important interpretation notes
- Crop fit scores are rankings, **not probabilities** of successful harvest.
- Weather forecasts are not field sensors. Check soil moisture and crop stage.
- Scheme cards are discovery guidance, not eligibility approval.
- Sample market prices must not be used to decide when or where to sell.
- Recommendations do not operate pumps, spray chemicals, or purchase inputs automatically.

## Smoke checks performed for this package
- `node --check app.js`
- `node --check crop-ai.js`
- ZIP integrity check (`unzip -t`)

These checks confirm JavaScript syntax and archive integrity, not a full browser/end-to-end test of every external service.
