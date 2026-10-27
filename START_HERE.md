## Backend setup
For the included local backend, follow [`BACKEND_SETUP.md`](BACKEND_SETUP.md), run `npm start`, and open `http://127.0.0.1:3000`.

# AgroPilot AI — Start Here (Crop Scanner)

## Current status

- Camera/gallery photo selection and preview: available.
- Symptom-based preliminary triage: rule-based, not AI image diagnosis.
- Image-based AI disease prediction: **not active until you train the model and install its exported files**. This ZIP does not include trained weights, so it will not invent a disease result when no model exists.
- The starter training notebook is based on PlantVillage classes. It does not cover every crop or all real-world field conditions.

## 1. Run the website

1. Extract the ZIP.
2. Open the `agriculture-project-updated` folder in VS Code.
3. Install/use the **Live Server** extension.
4. Right-click `index.html` and choose **Open with Live Server**.
5. Open **Crop health check**. Select a crop, then take a leaf photo or choose one from your files.

The scanner status should clearly tell you whether the trained model is installed. Without the model files, photo preview works but AI prediction is unavailable.

## 2. Activate image-based AI

1. Open `train_crop_doctor_colab.ipynb` in [Google Colab](https://colab.research.google.com/).
2. Run its cells from top to bottom. Review the held-out evaluation results; do not assume accuracy before training finishes.
3. Download the generated `agropilot-crop-doctor-model.zip`.
4. Extract it and copy `model.json`, all associated `.bin` weight shard files, and `labels.json` into `models/crop-doctor/`.
5. Reload the site through Live Server. The status should report that the trained model has loaded.

Detailed instructions and limitations are in `MODEL_TRAINING_GUIDE.md`.

## 3. What results mean

The model score is not a calibrated probability or a confirmed diagnosis. Phone photos and real field conditions can differ from training images. If the crop is unsupported, the app should withhold the prediction. Do not apply pesticides or fertilizers based only on a prediction; confirm with a Krishi Vigyan Kendra (KVK), agriculture officer, or plant diagnostic service.

## 4. Privacy and safety

Farm profile details are stored in this browser on this device. This demo is not a secure production database and does not submit data to a government service. Do not enter Aadhaar numbers, bank details, OTPs, or other sensitive credentials.

## Project files

- `index.html` — dashboard and scanner UI
- `style.css` — layout and styling
- `app.js` — dashboard features and rule-based symptom triage
- `crop-ai.js` — model loading, photo selection and TensorFlow.js inference
- `train_crop_doctor_colab.ipynb` — training/export notebook
- `MODEL_TRAINING_GUIDE.md` — detailed training steps and limitations
- `models/crop-doctor/` — destination for exported model files

## 5. Smart Crop Recommendation shortlist

The Crop Recommendation screen now asks for a complete farm profile: state, district, village, area, pH, soil type, N/P/K status, moisture, season, temperature, rainfall outlook, water availability, irrigation method, preferred crop duration, budget, farming goal, market access, preferred method, previous crop and known field concern.

- All fields must be completed before the shortlist is generated. Use `Unknown / not tested` when a soil nutrient reading is unavailable; do not guess lab measurements.
- The screen ranks up to five crop options and shows why each one ranked, warnings to check, broad water/temperature needs and an illustrative input-cost range for the entered area.
- The shortlist can be saved in the current browser or printed / saved as PDF.
- Fit scores are transparent rule-based rankings, **not** probabilities, guaranteed yield, profit predictions or a substitute for local crop calendars and soil-test interpretation.

## 6. Other available modules

The dashboard includes farm records and a personalized scheme roadmap, weather, sample market-price comparison, rule-based farming assistant with voice input where supported by the browser, crop photo scanner, operations planner, autonomous decision rules, water/profit calculator, field map, nearby agricultural shop search links, crop recovery tracker, soil-health checklist, yield-risk scenarios and farm calendar. Some modules use illustrative/demo data or external search links. In particular, market prices are not live, and the image-based crop disease model requires separately trained model files as described above.


## 6. Other features and real-service setup

See [`CONFIGURATION_AND_TESTING.md`](CONFIGURATION_AND_TESTING.md) for the full feature checklist, live market-data limitations, Maps/Places configuration, authentication security, and the tests performed for this package. Market Prices now includes a crop-and-location form that opens official Agmarknet/e-NAM portals and a targeted search; sample table figures remain explicitly marked as samples.
