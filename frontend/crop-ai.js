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
      setStatus('Local model absent · hosted AI fallback available when configured', 'warning');
      showMessage('Crop photo scanner ready', 'Scan uses your local trained model when installed; otherwise it can call the hosted Plant.id health-assessment API when PLANT_ID_API_KEY is configured on the backend.');
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
  async function imageDataUrlForApi(file) {
    const bitmap = await createImageBitmap(file);
    try {
      const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(bitmap.width * scale)); canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d'); ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      let blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.82));
      if (!blob) throw new Error('Could not prepare image for analysis');
      if (blob.size > 4 * 1024 * 1024) blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.62));
      if (!blob || blob.size > 4 * 1024 * 1024) throw new Error('Image remains larger than 4 MB. Choose a smaller photo.');
      return await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(new Error('Could not read image'));reader.readAsDataURL(blob)});
    } finally { bitmap.close(); }
  }
  async function predictWithHostedAI(file) {
    showMessage('Connecting to plant health AI…', 'Preparing a resized image and checking the configured Plant.id service.');
    const image = await imageDataUrlForApi(file);
    const lat = document.getElementById('lat')?.value, lon = document.getElementById('lon')?.value;
    const response = await fetch('/api/crop-doctor', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({image,crop:cropSelect?.value||'',latitude:lat,longitude:lon})});
    const data = await response.json().catch(()=>({}));
    if (!response.ok || !data.ok) { showMessage(data.configured===false?'Hosted crop AI needs an API key':'Crop AI service unavailable', data.error || 'Configure PLANT_ID_API_KEY in the local .env file, restart the server, and try again. Symptom-based triage remains available.'); setStatus(data.configured===false?'AI provider key required':'AI provider unavailable','warning'); return; }
    resultBox.replaceChildren();
    const title=document.createElement('b');title.textContent='AI crop health screening · Plant.id';resultBox.append(title);
    if(data.isHealthy===true){const p=document.createElement('p');p.textContent='The image model currently leans toward a healthy plant. This does not rule out field problems.';resultBox.append(p)}
    else if(data.isHealthy===false){const p=document.createElement('p');p.textContent='The image model detected possible plant-health concerns. Results below are ranked suggestions, not a confirmed diagnosis.';resultBox.append(p)}
    if(data.diseases?.length){data.diseases.forEach(d=>{const card=document.createElement('div');card.className='weather-advisory-note';const p=document.createElement('p');const strong=document.createElement('b');strong.textContent=`${d.name} · ${(d.probability*100).toFixed(1)}% model score`;p.append(strong);if(d.description){p.append(document.createElement('br'),document.createTextNode(d.description))}if(d.treatment){p.append(document.createElement('br'),document.createTextNode('Suggested follow-up: '+d.treatment))}card.append(p);resultBox.append(card)})}else{const p=document.createElement('p');p.textContent='The provider returned no ranked condition. Retake a clear photo and inspect symptoms manually.';resultBox.append(p)}
    const caution=document.createElement('div');caution.className='ai-caution';caution.textContent=data.note||'Do not apply pesticide or fertilizer based only on an AI result. Confirm with a local KVK/agriculture officer.';resultBox.append(caution);setStatus('Hosted AI service connected','ready');
  }
  async function predict(file) {
    if (!file || !resultBox) return;
    if (!modelReady || !model) { try { await predictWithHostedAI(file); } catch(error) { console.error('Hosted crop AI failed:',error); showMessage('Could not reach crop AI', `${error.message}. Check the local backend and configured PLANT_ID_API_KEY. Symptom-based assessment is still available.`); } return; }
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
      let best = 0;
      for (let i=1;i<probabilities.length;i++) if (probabilities[i] > probabilities[best]) best=i;
      const confidence = Number(probabilities[best] || 0);
      const label = labels[best] || `Class ${best}`;
      const predCrop = labelCrop(label);
      const aliases = cropAliases[selectedCrop.toLowerCase()] || [];
      if (!aliases.some(alias => predCrop.includes(alias) || alias.includes(predCrop))) {
        showMessage('Crop mismatch — result withheld', `The top class (“${humanize(label)}”) does not match selected crop ${selectedCrop}. Check the crop selection and photo. Do not treat this as a diagnosis.`);
        return;
      }
      resultBox.replaceChildren();
      const title=document.createElement('b'); title.textContent='AI leaf scan · model prediction';
      const pred=document.createElement('div'); pred.className='ai-prediction'; pred.textContent=humanize(label);
      const badge=document.createElement('span'); badge.className='ai-confidence'; badge.textContent=`Model score: ${(confidence*100).toFixed(1)}%`;
      const bar=document.createElement('div'); bar.className='ai-prediction-bar'; const fill=document.createElement('span'); fill.style.width=`${Math.max(0,Math.min(100,confidence*100))}%`; bar.append(fill);
      const details=document.createElement('p'); details.textContent=confidence<0.60 ? 'The model score is low. Treat this as uncertain; retake a clear photo in natural light and consult a local agriculture expert.' : 'This is the model’s top class, not a calibrated probability or confirmed diagnosis. Similar-looking conditions and field photos may cause errors.';
      const caution=document.createElement('div'); caution.className='ai-caution'; caution.textContent='Do not apply pesticide or fertilizer based only on this prediction. Confirm the issue with a KVK/agriculture officer or validated plant diagnostic service.';
      resultBox.append(title,pred,badge,bar,details,caution);
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
