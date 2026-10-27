# Advanced Crop Health Toolkit

## Included
- Transparent rule-based plant health indicator (0–100), not a disease probability.
- Nutrient-status checklist using farmer-entered N/P/K test status and pH.
- Water-stress, pest-observation, affected-area and weather-context risk notes.
- Before/current image preview and optional local backend upload (JPEG, PNG, WebP, up to 4 MB per photo).
- Personalised action checklist, report history, browser-local saving, backend JSON persistence, and Print / Save as PDF.
- Optional follow-up entry in the existing recovery tracker.
- New backend collection: `healthReports` at `POST /api/data/healthReports` and `GET /api/data/healthReports`.

## Run
1. Use Node.js 18+.
2. In this folder run `npm start`.
3. Open `http://127.0.0.1:3000` and choose Crop health check.
4. Use Advanced Crop Health Toolkit below the initial symptom triage.

## Limitations
- The indicator is a transparent heuristic from user-entered values. It is not a calibrated plant-health metric, confirmed diagnosis, or guarantee of crop recovery.
- Weather-linked notes use entered humidity, temperature and recent rain; this module does not claim to automatically obtain a field-specific forecast for the health report.
- Photo comparison is a visual record, not automated computer vision.
- Actual image-based disease classification still requires training and installing the TensorFlow.js model described in `MODEL_TRAINING_GUIDE.md`. No trained weights are included in this package.
- Backend storage is local JSON and local disk uploads. It has no login or per-user access control and must not be exposed to the public internet as-is.
- Test soil and crop-specific decisions with a recognised soil lab, local agriculture office/KVK, or qualified agronomist. Do not choose pesticide or fertilizer doses from this prototype alone.
