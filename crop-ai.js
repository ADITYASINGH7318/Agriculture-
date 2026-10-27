/* AgroPilot Crop Doctor: farmer details, camera/gallery upload, preview and TensorFlow.js inference.
   Actual image predictions require trained model files in ./models/crop-doctor/. */
(() => {
  const MODEL_URL = './models/crop-doctor/model.json';
  const LABELS_URL = './models/crop-doctor/labels.json';
  const statusBox = document.getElementById('crop-ai-status');
  const resultBox = document.getElementById('crop-ai-results');
  const galleryInput = document.getElementById('leaf-photo');
  const cameraInput = document.getElementById('leaf-camera');
  const scanButton = document.getElementById('scan-crop-btn');
  const takeButton = document.getElementById('take-leaf-photo');
  const chooseButton = document.getElementById('choose-leaf-photo');
  const previewBox = document.getElementById('leaf-preview');
  const photoStatus = document.getElementById('photo-selection-status');
  const form = document.getElementById('diagnose-form');
  let selectedFile = null, previewUrl = null;
  const cropSelect = document.querySelector('#diagnose-form select[name="crop"]');
  let model = null, labels = [], modelReady = false;
  const PROFILE_KEY = 'agropilot-crop-doctor-profile-v1';
  const setStatus = (message, type = '') => {
    if (!statusBox) return;
    statusBox.textContent = message;
    statusBox.className = `crop-ai-status ${type}`.trim();
  };
  const showMessage = (heading, message) => {
    if (!resultBox) return;
    resultBox.replaceChildren();
    const title = document.createElement('b'); title.textContent = heading;
    const paragraph = document.createElement('p'); paragraph.textContent = message;
    resultBox.append(title, paragraph);
  };
  const humanize = label => String(label).replaceAll('___', ' — ').replaceAll('_', ' ').replace(/\s+/g, ' ').trim();
  const cropAliases = {
    tomato:['tomato'], maize:['corn','maize'], wheat:['wheat'], rice:['rice'], mustard:['mustard'],
    chickpea:['chickpea','chick pea','gram'], cotton:['cotton'], apple:['apple'], blueberry:['blueberry'],
    cherry:['cherry'], grape:['grape'], orange:['orange'], peach:['peach'], 'bell pepper':['pepper, bell','bell pepper'],
    potato:['potato'], raspberry:['raspberry'], soybean:['soybean'], squash:['squash'], strawberry:['strawberry']
  };
  const labelCrop = label => {
    const raw = String(label).split('___')[0].toLowerCase().replaceAll('_', ' ');
    if (raw.includes('corn') || raw.includes('maize')) return 'maize';
    if (raw.includes('pepper')) return 'bell pepper';
    return raw.replace(/[()]/g, '').trim();
  };
  const cropSupported = crop => {
    const aliases = cropAliases[String(crop || '').toLowerCase()];
    return !!aliases && labels.some(label => {
      const normalized = labelCrop(label);
      return aliases.some(alias => normalized.includes(alias) || alias.includes(normalized));
    });
  };
  function profileFields() {
    if (!form) return [];
    return [...form.querySelectorAll('input[name], select[name], textarea[name]')].filter(el => el.type !== 'file' && el.name !== 'symptoms');
  }
  function saveProfile() {
    if (!form) return;
    const data = {};
    profileFields().forEach(el => { data[el.name] = el.value; });
    data.symptoms = [...form.querySelectorAll('input[name="symptoms"]:checked')].map(el => el.value);
    try { localStorage.setItem(PROFILE_KEY, JSON.stringify(data)); } catch (e) { /* private browsing/storage may be disabled */ }
  }
  function restoreProfile() {
    let data;
    try { data = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null'); } catch { data = null; }
    if (!data || !form) return;
    profileFields().forEach(el => { if (Object.prototype.hasOwnProperty.call(data, el.name) && data[el.name] !== '') el.value = data[el.name]; });
    (data.symptoms || []).forEach(value => { const el = form.querySelector(`input[name="symptoms"][value="${CSS.escape(value)}"]`); if (el) el.checked = true; });
  }
  async function loadModel() {
    if (!statusBox) return;
    if (!window.tf) { setStatus('TensorFlow.js did not load. Check your internet connection, then reload.', 'error'); return; }
    try {
      await window.tf.ready();
      model = await window.tf.loadLayersModel(MODEL_URL);
      const response = await fetch(LABELS_URL);
      if (!response.ok) throw new Error('labels.json not found');
      const data = await response.json();
      labels = Array.isArray(data) ? data : (data.labels || []);
      if (!labels.length) throw new Error('No class labels found');
      modelReady = true;
      setStatus(`Trained model loaded · ${labels.length} classes`, 'ready');
      showMessage('AI model ready', 'Choose the matching crop and scan a clear leaf photo. This is a screening aid, not a confirmed diagnosis.');
    } catch (error) {
      modelReady = false;
      setStatus('Trained model files not found. Photo upload works, but AI prediction needs the model files.', 'warning');
      showMessage('Photo scanner ready · AI model still needed', 'You can enter farmer details and preview a photo now. To detect a disease, train/export the model and place model.json, its .bin weight files and labels.json in models/crop-doctor/.');
    }
  }
  function acceptPhoto(file, source) {
    if (!file) return;
    if (!file.type || !file.type.startsWith('image/')) {
      selectedFile = null;
      if (photoStatus) photoStatus.textContent = 'Please select a JPG, PNG or another image file.';
      showMessage('Unsupported file', 'Choose a photo image such as JPG, PNG or WEBP.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      selectedFile = null;
      if (photoStatus) photoStatus.textContent = 'Photo is larger than 15 MB. Please choose a smaller image.';
      showMessage('Photo too large', 'Choose an image under 15 MB for a smoother scan.');
      return;
    }
    selectedFile = file;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    if (previewBox) {
      previewBox.replaceChildren();
      const image = document.createElement('img'); image.src = previewUrl; image.alt = 'Preview of selected crop leaf photo';
      const info = document.createElement('span');
      info.textContent = `${file.name || 'Camera photo'} · ${(file.size / (1024 * 1024)).toFixed(2)} MB. ${source}. Check that the leaf is clear and well lit, then scan.`;
      previewBox.append(image, info); previewBox.hidden = false;
    }
    if (photoStatus) photoStatus.textContent = `Photo selected: ${file.name || 'Camera photo'}`;
    saveProfile();
    showMessage('Photo ready to scan', modelReady ? 'Press “Scan crop with AI” to analyse this photo.' : 'Photo preview is ready. The trained model files must be installed before image prediction can run.');
  }
  async function predict(file) {
    if (!file || !resultBox) return;
    if (!modelReady || !model) { showMessage('AI model not installed yet', 'Your photo is selected, but this project does not contain trained model weights yet. Complete MODEL_TRAINING_GUIDE.md and add the exported files.'); return; }
    const selectedCrop = cropSelect?.value || '';
    if (!cropSupported(selectedCrop)) {
      showMessage('Crop not covered by this model', `The installed model has no trained class for ${selectedCrop}. Add verified images for this crop and retrain before using image predictions for it.`);
      return;
    }
    showMessage('Analysing leaf…', 'Preparing the selected photo for the trained model.');
    let bitmap;
    try {
      bitmap = await createImageBitmap(file);
      const output = window.tf.tidy(() => {
        const input = window.tf.browser.fromPixels(bitmap).resizeBilinear([224,224]).toFloat().expandDims(0);
        return model.predict(input);
      });
      const probabilities = await output.data(); output.dispose();
      const aliases = cropAliases[selectedCrop.toLowerCase()] || [];
      const cropResults = labels.map((label, index) => ({label, score:Number(probabilities[index] || 0), index}))
        .filter(item => { const predCrop = labelCrop(item.label); return aliases.some(alias => predCrop.includes(alias) || alias.includes(predCrop)); })
        .sort((a,b) => b.score - a.score);
      if (!cropResults.length) {
        showMessage('Crop not covered by this model', `The installed model has no labelled classes for ${selectedCrop}. Add verified images for this crop and retrain before using image predictions for it.`);
        return;
      }
      const best = cropResults[0];
      const confidence = best.score;
      resultBox.replaceChildren();
      const title=document.createElement('b'); title.textContent=`AI leaf scan · ${selectedCrop} disease class scores`;
      const intro=document.createElement('p'); intro.className='ai-score-note'; intro.textContent='Ranked results for classes this model knows for the selected crop. Higher score means a stronger model match; these percentages are NOT calibrated disease probabilities.';
      const pred=document.createElement('div'); pred.className='ai-prediction'; pred.textContent=`Highest-scoring match: ${humanize(best.label)}`;
      const list=document.createElement('div'); list.className='ai-disease-list';
      cropResults.forEach((item, rank) => {
        const row=document.createElement('div'); row.className='ai-disease-row';
        const head=document.createElement('div'); head.className='ai-disease-head';
        const name=document.createElement('span'); name.className='ai-disease-name'; name.textContent=`${rank+1}. ${humanize(item.label).split(' — ').slice(1).join(' — ') || humanize(item.label)}`;
        const score=document.createElement('strong'); score.textContent=`${(item.score*100).toFixed(1)}%`;
        head.append(name,score);
        const bar=document.createElement('div'); bar.className='ai-prediction-bar'; const fill=document.createElement('span'); fill.style.width=`${Math.max(0,Math.min(100,item.score*100))}%`; bar.append(fill);
        row.append(head,bar); list.append(row);
      });
      const details=document.createElement('p'); details.className='ai-score-note'; details.textContent=confidence<0.60 ? 'The highest model score is low. Treat this scan as uncertain; retake a clear photo in natural light and consult a local agriculture expert.' : 'The first result is the model’s strongest match, not a confirmed diagnosis. Similar-looking conditions and real-field photos can cause errors.';
      const caution=document.createElement('div'); caution.className='ai-caution'; caution.textContent='Do not apply pesticide or fertilizer based only on these scores. Confirm the issue with a KVK/agriculture officer or validated plant diagnostic service.';
      resultBox.append(title,intro,pred,list,details,caution);
      saveProfile();
    } catch (error) {
      console.error('Crop AI prediction failed:',error);
      showMessage('Could not analyse this photo','Try a smaller JPG/PNG image with a clear leaf and check that model export files are complete.');
    } finally { if (bitmap) bitmap.close(); }
  }
  takeButton?.addEventListener('click', () => cameraInput?.click());
  chooseButton?.addEventListener('click', () => galleryInput?.click());
  galleryInput?.addEventListener('change', event => { const file=event.target.files?.[0]; if(file) acceptPhoto(file, 'Chosen from gallery/files'); event.target.value=''; });
  cameraInput?.addEventListener('change', event => { const file=event.target.files?.[0]; if(file) acceptPhoto(file, 'Taken with camera'); event.target.value=''; });
  scanButton?.addEventListener('click', () => {
    saveProfile();
    if (!selectedFile) { showMessage('Photo needed', 'Tap “Take photo” to use your camera or “Choose from gallery / files” to upload a photo.'); takeButton?.focus(); return; }
    predict(selectedFile);
  });
  form?.addEventListener('input', saveProfile);
  form?.addEventListener('change', saveProfile);
  restoreProfile();
  loadModel();
  window.AgroPilotCropAI = { isReady: () => modelReady, predict, getSelectedPhoto: () => selectedFile, saveProfile };
})();
