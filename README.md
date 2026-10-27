# AgroPilot AI — Autonomous Farm Operations

A responsive HTML/CSS/JavaScript hackathon prototype for connected farm decision support. Runs locally in a browser; no build tools are required.

## Run locally
1. Extract the ZIP.
2. Open the `agriculture-project-updated` folder in VS Code.
3. Open `index.html` with Live Server (recommended) or in a browser.
4. Internet is needed for live Open-Meteo forecast and Google Fonts. Other demo features run locally.

## Features
- Dashboard overview and inspirational farmer message
- Multiple farm records saved in browser local storage
- Rule-based crop recommendation shortlist
- Expanded crop root-cause triage using crop, moisture, rain, leaf symptoms, growth stage, symptom spread, root/stem condition, pest signs and irrigation history; ranks possible causes with evidence and next checks
- Live weather forecast via Open-Meteo when reachable, with clearly labelled demo fallback
- Sample mandi price table and selling checklist
- Rule-based farming assistant with optional browser speech input/output
- Operations planner and local activity log
- **Autonomous Decision Engine:** combines crop condition, moisture, rain probability and growth stage to explain and rank suggested actions
- **Water & Profit Simulator:** calculates estimated revenue, entered costs, net return and break-even price; includes qualitative irrigation guidance
- **Field Health Zones:** interactive illustrative zone map with inspection notes and activity logging
- Mobile responsive layout

## Important demo boundaries
- Crop recommendations and root-cause suggestions are transparent heuristic/rule-based triage, not a trained AI diagnosis and not calibrated probabilities. The ranking is a clue-match score only.
- The leaf photo is only previewed in the browser; no image AI model is connected. For real image-based disease detection, train or fine-tune a crop-specific model, validate it on field images, and connect inference through a backend/API.
- Field zones and sample crop-health indicators are fictional demonstration data, not satellite or sensor readings.
- Market prices are sample values, not live mandi prices.
- Profit outputs use only the numbers entered by the user; actual yield, price and costs may differ.
- Weather is fetched from Open-Meteo when internet is available. Forecasts are not field sensor readings.
- Voice features depend on browser support and permissions.
- The app does not autonomously control pumps, apply chemicals, buy supplies or execute real-world actions. Human review is required.

## Files
- `index.html` — page structure and navigation
- `style.css` — responsive dashboard styling
- `app.js` — client-side demo logic
- `farm-hero.jpg` — dashboard hero image

## Nearby Agricultural Shops (Google Maps)

The **Nearby agri shops** section lets a farmer enter a village/town, district, state, and crop, then search Google Maps for nearby:

- Seed shops
- Fertilizer and nutrient suppliers
- Crop-protection shops
- Farm machinery and equipment dealers
- Irrigation and pump suppliers
- Soil-testing laboratories
- Plant nurseries
- Krishi Vigyan Kendra (KVK) / agriculture offices

These are location-specific Google Maps search links, so current business listings and map results are provided by Google Maps. The prototype does not fetch or verify shop listings inside the dashboard, and it cannot guarantee inventory, opening hours, or the absolute nearest shop. A Google Places API integration with a secured backend/API key would be needed to display live shop names, distance, ratings, and phone numbers directly inside AgroPilot.


## Additional farmer support modules

This update adds five interactive modules while preserving the existing dashboard:

- **Crop Recovery Tracker:** records follow-up observations, farmer-reported condition, action and notes in browser local storage.
- **Soil Health Advisor:** provides a cautious checklist from entered pH, moisture and symptoms; it does not prescribe fertilizer doses.
- **Yield & Risk Simulator:** calculates low/baseline/high illustrative yield and revenue scenarios from user-provided estimates. Scenario ranges are assumptions, not model predictions.
- **Smart Farm Calendar:** adds, completes and deletes dated tasks saved in the current browser.
- **Government Schemes & Expert Help:** links to selected official portals and creates a Google Maps search for local KVKs, soil labs or other help based on village/district/state.

### Important limitations

These added modules are frontend decision-support tools, not trained AI models. Recovery history and calendar tasks stay in the current browser/device and are not synced to a server. Google Maps results are search links, not a verified list of the nearest businesses. Scheme eligibility and deadlines must be confirmed on official portals. Yield ranges are illustrative assumptions. Soil and crop-health guidance should be verified with a soil test or local agriculture expert before costly or chemical treatment decisions.

## Run locally

Open `index.html` with VS Code Live Server. Most local forms work in a modern browser. Weather requires an internet connection to retrieve live Open-Meteo forecast data; the app shows a clearly labelled sample fallback if the request fails.

## Login and logout (prototype)
- New users can create an account with name, email and password; existing users can log in and log out.
- Passwords are stored as SHA-256 digests in this browser's local storage, and the signed-in session is held in session storage. This is suitable only for a local demo, not a secure production identity system.
- Browser storage can be cleared or edited, and client-side checks can be bypassed. Do not use real/reused passwords or sensitive farmer data. For a production release, use a backend or trusted identity provider (for example Firebase Authentication or Supabase Auth), enforce server-side authorization, and protect farm records per account.
- Run with VS Code Live Server for the most reliable browser crypto support.


## Trained image AI — Crop Doctor starter pipeline

This update adds `crop-ai.js` integration and `train_crop_doctor_colab.ipynb`, a Google Colab training notebook using transfer learning with MobileNetV2 on the PlantVillage image dataset. The notebook trains, evaluates on a held-out test split, and exports TensorFlow.js files. See `MODEL_TRAINING_GUIDE.md`.

**Important:** the notebook has not been run as part of this package build, so trained weights and measured accuracy are not included. The image model will not make predictions until you train it and copy `model.json`, all `.bin` weight shards, and `labels.json` into `models/crop-doctor/`. The starter PlantVillage model does not cover every crop; current UI intentionally blocks unsupported crop selections rather than presenting another crop's prediction as a diagnosis. The starter class list covers tomato, maize, apple, blueberry, cherry, grape, orange, peach, bell pepper, potato, raspberry, soybean, squash and strawberry. To support wheat, rice, mustard, chickpea, cotton and other crops, add reliable labelled data and retrain/test. Model scores are not calibrated probabilities and do not replace expert diagnosis.


## Leaf photo scan (Crop Doctor)
1. Open **Crop health check**. Choose the crop in the form.
2. On a phone, use **Take or upload a leaf photo** and choose camera or photo library. On a computer, select a JPG/PNG image.
3. Check the preview and press **Scan crop with AI**.
4. Image prediction requires the trained TensorFlow.js files (`model.json`, weight `.bin` files and `labels.json`) inside `models/crop-doctor/`. These files are not bundled because training has not yet been run. Without them, the interface explains that the model must be installed; it does not fabricate a prediction.

## Farmer details and crop photo scanner

The Crop health check now includes optional farmer and field details (name, contact number, village, district, state, affected area, crop variety and planting date). Details and selected symptom choices are saved in this browser's local storage so they can be reused on this device. Do not enter sensitive information on a shared device.

Photo controls are separated for clarity:
- **Take photo** opens the device camera on supported mobile browsers (`capture="environment"`). Browser/device support varies; on some devices the browser may still show a chooser.
- **Choose from gallery / files** opens the normal image picker for gallery or computer files.
- A selected image is previewed before scanning; supported image files must be under 15 MB.
- **Scan crop with AI** runs image inference only when a trained TensorFlow.js model has been exported and installed in `models/crop-doctor/`.

The scanner interface and symptom-based triage can be used without model weights, but that does not mean image disease detection is active. No trained weights are bundled with this project. Run `train_crop_doctor_colab.ipynb`, follow `MODEL_TRAINING_GUIDE.md`, and validate the exported model before relying on predictions. Phone photos and real field conditions may differ from public training datasets.
