# AgroPilot AI Crop Doctor — training and installation guide

## What this package gives you

- `train_crop_doctor_colab.ipynb`: a Google Colab notebook that downloads PlantVillage, trains a MobileNetV2 transfer-learning classifier, evaluates it on a held-out split, and exports a TensorFlow.js model.
- `crop-ai.js`: website integration that loads the exported model, accepts a leaf image, displays the model's top class and score, and blocks results for crop types not covered by the starter model.
- `models/crop-doctor/README.txt`: explains where to place the exported files.

**Important:** No trained weights are bundled because a training run has not yet been executed. The project is training-ready, but image predictions will remain unavailable until you run the notebook and install the exported files. Do not describe this as an already-trained model until you have completed training and evaluated it.

## A. Train the model in Google Colab

1. Open [Google Colab](https://colab.research.google.com/).
2. Upload `train_crop_doctor_colab.ipynb` from this folder.
3. In Colab, choose **Runtime → Change runtime type → T4 GPU** if available. CPU can work but may be much slower.
4. Run the notebook cells from top to bottom. The first cell installs dependencies; the dataset download and training can take a while.
5. Read the printed held-out test accuracy and loss. These are measured results from your run. Inspect per-class errors and test additional unseen field photos before relying on it.
6. The final cells download `agropilot-crop-doctor-model.zip` to your computer.

## B. Install the exported model into this project

1. Extract `agropilot-crop-doctor-model.zip`.
2. Copy **all** files inside the extracted folder (`model.json`, every `.bin` weight shard, and `labels.json`) into:

   `agriculture-project-updated/models/crop-doctor/`

3. Keep the filenames and folder structure unchanged. Do not put the files in an extra nested folder.
4. Open the `agriculture-project-updated` folder in VS Code and start **Live Server** from `index.html`.
5. Open **Crop health check**, choose a crop, and upload a clear leaf image. The status should change to “Trained model loaded”.

## C. What the first model can and cannot identify

The notebook starts from PlantVillage, which contains 38 labelled leaf-condition classes across roughly 14 crop species. It does **not** include every crop, every disease, or every real field condition. The Crop health check dropdown includes the PlantVillage starter crops (including tomato, maize, apple, blueberry, cherry, grape, orange, peach, bell pepper, potato, raspberry, soybean, squash and strawberry). Wheat, rice, mustard, chickpea and cotton are intentionally marked unsupported rather than guessed because they are not represented by the starter dataset.

To expand to all crops, you need verified, correctly labelled images for each additional crop and its target conditions. Include healthy leaves, lookalike conditions, varied backgrounds, lighting and field photos. Split by farm/source where possible to reduce leakage, then retrain and test. Do not merge uncertain labels or treat symptoms as a confirmed disease.

## D. Safe interpretation

- The displayed score is the model's output score, **not** a calibrated probability or guarantee of correctness.
- A leaf photo alone cannot reliably distinguish every disease, nutrient problem, root issue or water stress.
- Do not apply pesticides or fertilizers based only on model output. Confirm through a KVK/agriculture officer, plant clinic or suitable lab test.
- PlantVillage-style image performance can be much worse on real phone photos. Validate on images not used during training or tuning.

## Troubleshooting

- **“No trained model installed yet”**: confirm `model.json`, `.bin` shard(s), and `labels.json` are inside `models/crop-doctor/`.
- **Model fetch fails**: use VS Code Live Server, not a `file://` URL. Check the browser console and confirm TensorFlow.js can load from the internet.
- **Unsupported crop**: the starter dataset does not cover that crop. Do not use a different crop's class as its diagnosis; add data and retrain.
- **Export error in Colab**: rerun the dependency installation cell, restart the runtime if prompted, then rerun all cells in order.
