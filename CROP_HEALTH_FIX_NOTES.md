# Crop Health fixes in this package

## Implemented in this update
- Replaced the fictional, hard-coded field health zones with a farmer-entered field inspection form.
- Field assessment priority is calculated from the observations entered (condition, moisture, spread, standing water) and the reasons are shown to the user.
- Field inspections are saved in browser local storage and sent to `POST /api/data/fieldInspections` when the local Node backend is running.
- Inspection history is displayed and individual records can be removed from the browser history.
- Soil health checklist results are saved in browser local storage and sent to `POST /api/data/soilChecks` when the backend is running.
- Crop symptom triage continues to save records through the crop scan API.
- Added `fieldInspections` to the backend's persisted collections.

## Important limitation: image-based AI
The package does not contain trained model weights. Photo upload and preview are not the same as AI diagnosis. The image classifier only runs if a compatible TensorFlow.js model and its weight files are trained and placed in `models/crop-doctor/` as described in `MODEL_TRAINING_GUIDE.md`. No disease prediction should be presented as confirmed; use an agriculture expert for severe or spreading symptoms.

## Run and check
1. Install Node.js 18 or newer.
2. In this folder run `npm start`.
3. Open `http://127.0.0.1:3000`.
4. Test Crop health check, Soil health advisor, and Field health zones.
5. Check `http://127.0.0.1:3000/api/health` for backend status.
6. Run `npm run check` for JavaScript syntax checks.

The backend is a local prototype using JSON-file storage, not a secure multi-user production service. Full browser end-to-end testing has not been completed.
