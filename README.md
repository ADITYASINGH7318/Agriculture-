# Agriculture — Autonomous Farm Operations (HTML, CSS & JavaScript)

A browser-ready frontend demo. It does not require Python, Flask, a database server, or npm.

## Run in VS Code
1. Extract this ZIP.
2. Open the `agriculture-autonomous-farm-html-css-js` folder in VS Code.
3. Open `index.html` with the **Live Server** extension, or double-click `index.html` to open it in your browser.
4. Internet access is needed for the live Open-Meteo weather request and Google Fonts. If weather cannot load, the app displays clearly labelled sample values.

## Features
- Farm records: add farms and save them in browser `localStorage`.
- Crop recommendation: starter rule-based ranking using pH, temperature, season, soil and water.
- Crop health check: symptom-based possible causes and suggested observations.
- Weather: Open-Meteo forecast attempt with an offline sample fallback.
- Market prices: clearly labelled illustrative prices, not live mandi rates.
- Farming assistant: rule-based responses, not an LLM.
- Operations planner: suggested tasks based on moisture and rain probability, with a local activity log.
- Responsive layout adapted from the supplied project.

## Important limitations
This is a frontend demo, not a validated agricultural diagnostic system. Recommendations are indicative only. Weather depends on internet access. Market prices are sample data. Browser-local records stay in the same browser/device and are not shared across devices. The planner never controls pumps, sprays chemicals, buys supplies, or performs real-world actions.
