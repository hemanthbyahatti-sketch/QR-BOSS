/*
 * Advanced QR Code Generator
 * Premium Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide Icons
  lucide.createIcons();

  // APP STATE
  const state = {
    activeTab: 'url',
    bgMode: 'gradient',
    currentGradientIndex: 0,
    gradientColor1: '#ff5f6d',
    gradientColor2: '#ffc371',
    gradientAngle: 135,
    selectedEmoji: '🔥',
    emojiSize: 32,
    emojiSpacing: 60,
    emojiAngle: -15,
    solidColor: '#7d5fff',
    qrStyle: 'dots', // 'dots', 'classic', 'liquid'
    qrEyeStyle: 'rounded', // 'rounded', 'smooth', 'classic'
    qrFgColor: '#000000',
    qrBgColor: '#ffffff',
    qrColorMode: 'solid', // 'solid', 'grad'
    footerText: '@USERNAME',
    showLogoOverlay: true,
    activeLogoPreset: 'link', // 'link', 'heart', 'sparkles', 'none', 'custom'
    logoScale: 0.20,
    customLogoDataUrl: null,
    mediaFiles: [],
    mediaGalleryUrl: '',
  };

  // PRESET DATA
  const GRADIENT_PRESETS = [
    { name: 'Warm Sunset', c1: '#f09433', c2: '#bc1888', angle: 45 },
    { name: 'Aurora Glow', c1: '#00c6ff', c2: '#0072ff', angle: 135 },
    { name: 'Cherry Blossom', c1: '#ff5f6d', c2: '#ffc371', angle: 135 },
    { name: 'Midnight Violet', c1: '#141517', c2: '#7f00ff', angle: 135 },
    { name: 'Neon Emerald', c1: '#0575e6', c2: '#00f260', angle: 90 },
    { name: 'Golden Hour', c1: '#ffe259', c2: '#ffa751', angle: 135 },
    { name: 'Neon Burst', c1: '#ff3d90', c2: '#742cff', angle: 110 },
    { name: 'Solar Pop', c1: '#ff7a00', c2: '#ff3d8f', angle: 70 }
  ];

  const EMOJI_PRESETS = ['🔥', '✨', '💖', '😎', '🍕', '🚀', '💡', '🌈', '🎨', '🎉', '👾', '🥑', '🎸', '✈️', '🍀', '🌟', '👌', '😘', '💕'];

  const VECTOR_LOGOS = {
    instagram: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>`,
    link: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
    heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`,
    sparkles: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275Z"/></svg>`
  };

  // DOM ELEMENTS
  const qrCanvas = document.getElementById('qr-canvas');
  const cardBgLayer = document.getElementById('card-bg-layer');
  const tiltContainer = document.getElementById('tilt-container');
  const shareCardContainer = document.getElementById('share-card-container');
  const footerLogoIcon = document.getElementById('footer-logo-icon');
  const usernameText = document.getElementById('username-text');
  const exportStatus = document.getElementById('export-status');
  const savedQrList = document.getElementById('saved-qr-list');

  // Input bindings
  const qrUrlInput = document.getElementById('qr-url');
  const qrTextInput = document.getElementById('qr-text');
  const wifiSSIDInput = document.getElementById('wifi-ssid');
  const wifiPasswordInput = document.getElementById('wifi-password');
  const wifiEncryptionInput = document.getElementById('wifi-encryption');
  const profileNameInput = document.getElementById('profile-name');
  const profileHandleInput = document.getElementById('profile-handle');
  const profileTypeInput = document.getElementById('profile-type');
  
  // Custom logo uploader
  const logoUploadInput = document.getElementById('logo-upload');
  const mediaUploadInput = document.getElementById('media-upload-input');
  const mediaPreviewList = document.getElementById('media-preview-list');
  const rawBase = (typeof window !== 'undefined' && window.MEDIA_API_BASE) || '';
  const configuredMediaApiBase = (rawBase && rawBase !== 'null') ? String(rawBase).replace(/\/$/, '') : '';
  const isLocalServer = ['localhost', '127.0.0.1', '::1'].includes(window.location.hostname);
  const isGitHubPages = typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname.endsWith('github.io');

  function getApiEndpoint(endpoint) {
    const clean = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (configuredMediaApiBase && !configuredMediaApiBase.includes('github.io')) {
      return `${configuredMediaApiBase}${clean}`;
    }
    if (isLocalServer && window.location.port === '8000') {
      return clean;
    }
    if (isGitHubPages) {
      return clean;
    }
    return `http://localhost:8000${clean}`;
  }

  function getMediaUploadUrl() {
    return getApiEndpoint('/api/upload-media');
  }




  // DOM bindings for Media Batch & Controls
  const mediaActionsBar = document.getElementById('media-actions-bar');
  const mediaCountIndicator = document.getElementById('media-count-indicator');
  const mediaAddMoreInput = document.getElementById('media-add-more-input');
  const btnClearMedia = document.getElementById('btn-clear-media');
  const btnLoad10Samples = document.getElementById('btn-load-10-samples');

  function updateMediaCounter() {
    const total = state.mediaFiles.length;
    if (mediaActionsBar) {
      mediaActionsBar.style.display = total > 0 ? 'flex' : 'none';
    }
    if (mediaCountIndicator) {
      const photos = state.mediaFiles.filter(f => f.kind !== 'video').length;
      const videos = state.mediaFiles.filter(f => f.kind === 'video').length;
      if (total >= 10) {
        mediaCountIndicator.className = 'media-count-indicator ready';
        mediaCountIndicator.innerHTML = `🎉 ${total} / 10+ Items Ready (${photos} Photo${photos === 1 ? '' : 's'}${videos ? `, ${videos} Video${videos === 1 ? '' : 's'}` : ''}) in 1 QR Code`;
      } else if (total > 0) {
        mediaCountIndicator.className = 'media-count-indicator pending';
        mediaCountIndicator.innerHTML = `📁 ${total} / 10+ Items Added (Add ${10 - total} more for minimum 10)`;
      } else {
        mediaCountIndicator.className = 'media-count-indicator pending';
        mediaCountIndicator.innerHTML = `0 / 10+ Photos & Videos`;
      }
    }
  }

  function renderMediaPreviewList() {
    mediaPreviewList.innerHTML = '';
    updateMediaCounter();

    if (!state.mediaFiles.length) {
      const emptyState = document.createElement('div');
      emptyState.className = 'media-empty';
      emptyState.textContent = 'No photos or videos added yet. Choose 10+ files or click "Load 10 Demo Photos" below to test!';
      mediaPreviewList.appendChild(emptyState);
      return;
    }

    const grid = document.createElement('div');
    grid.className = 'media-cards-grid';

    state.mediaFiles.forEach((file, index) => {
      const card = document.createElement('div');
      card.className = 'media-thumb-card';

      const previewWrapper = document.createElement('div');
      previewWrapper.className = 'thumb-preview-wrapper';

      if (file.kind === 'video') {
        const video = document.createElement('video');
        video.src = file.src;
        video.muted = true;
        previewWrapper.appendChild(video);
      } else {
        const img = document.createElement('img');
        img.src = file.src;
        img.alt = file.name;
        img.loading = 'lazy';
        previewWrapper.appendChild(img);
      }

      const numBadge = document.createElement('span');
      numBadge.className = 'thumb-badge-num';
      numBadge.textContent = `#${index + 1}`;
      previewWrapper.appendChild(numBadge);

      const removeBtn = document.createElement('button');
      removeBtn.type = 'button';
      removeBtn.className = 'thumb-btn-remove';
      removeBtn.innerHTML = '&times;';
      removeBtn.title = `Remove ${file.name}`;
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        state.mediaFiles.splice(index, 1);
        renderMediaPreviewList();
        syncMediaQR();
      });
      previewWrapper.appendChild(removeBtn);

      card.appendChild(previewWrapper);

      const details = document.createElement('div');
      details.className = 'thumb-details';

      const nameEl = document.createElement('div');
      nameEl.className = 'thumb-filename';
      nameEl.textContent = file.name;
      nameEl.title = file.name;
      details.appendChild(nameEl);

      const sizeEl = document.createElement('div');
      sizeEl.className = 'thumb-filesize';
      sizeEl.textContent = file.sizeStr || (file.kind === 'video' ? 'Video File' : 'Photo Image');
      details.appendChild(sizeEl);

      card.appendChild(details);
      grid.appendChild(card);
    });

    mediaPreviewList.appendChild(grid);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }
  }

  function generateMediaQrPayload() {
    if (!state.mediaFiles.length) {
      return 'MEDIA:EMPTY';
    }

    if (!state.mediaGalleryUrl) {
      return 'MEDIA:UPLOAD_PENDING';
    }

    return state.mediaGalleryUrl;
  }

  // RENDER DYNAMIC UI CONTROLS
  // 1. Preset Gradient Grid
  const gradPresetsGrid = document.getElementById('gradient-presets');
  GRADIENT_PRESETS.forEach((preset, idx) => {
    const div = document.createElement('div');
    div.className = `preset-circle ${idx === 0 ? 'active' : ''}`;
    div.style.background = `linear-gradient(${preset.angle}deg, ${preset.c1}, ${preset.c2})`;
    div.title = preset.name;
    div.addEventListener('click', () => {
      document.querySelectorAll('#gradient-presets .preset-circle').forEach(c => c.classList.remove('active'));
      div.classList.add('active');
      state.currentGradientIndex = idx;
      
      // Update color pickers & values
      document.getElementById('grad-color-1').value = preset.c1;
      document.getElementById('grad-color-2').value = preset.c2;
      document.getElementById('grad-angle').value = preset.angle;
      document.getElementById('angle-val').innerText = `${preset.angle}°`;
      
      state.gradientColor1 = preset.c1;
      state.gradientColor2 = preset.c2;
      state.gradientAngle = preset.angle;
      updateBackground();
      renderQR();
    });
    gradPresetsGrid.appendChild(div);
  });

  // 2. Preset Emojis Grid
  const emojiPresetsGrid = document.getElementById('emoji-presets');
  EMOJI_PRESETS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.className = `emoji-preset-btn ${emoji === '🔥' ? 'active' : ''}`;
    btn.innerText = emoji;
    btn.addEventListener('click', () => {
      document.querySelectorAll('#emoji-presets .emoji-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.selectedEmoji = emoji;
      document.getElementById('custom-emoji-text').value = emoji;
      updateBackground();
    });
    emojiPresetsGrid.appendChild(btn);
  });

  // TAB SWITCHING
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      
      btn.classList.add('active');
      const tabId = btn.getAttribute('data-tab');
      document.getElementById(`tab-${tabId}`).classList.add('active');
      
      state.activeTab = tabId;
      renderQR();
    });
  });

  // BACKGROUND MODE SELECTOR
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.mode-settings').forEach(s => s.classList.remove('active'));
      
      btn.classList.add('active');
      const mode = btn.getAttribute('data-mode');
      document.getElementById(`settings-${mode}`).classList.add('active');
      
      state.bgMode = mode;
      updateBackground();
      renderQR();
    });
  });

  // ACCORDIONS
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.parentElement;
      const isOpen = item.classList.contains('active');
      
      // Close all
      document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
      
      // Toggle current
      if (!isOpen) {
        item.classList.add('active');
      }
    });
  });

  // EVENT LISTENERS FOR CONTROLS
  
  // Custom Gradients
  document.getElementById('grad-color-1').addEventListener('input', (e) => {
    state.gradientColor1 = e.target.value;
    document.querySelectorAll('#gradient-presets .preset-circle').forEach(c => c.classList.remove('active'));
    updateBackground();
    renderQR();
  });
  document.getElementById('grad-color-2').addEventListener('input', (e) => {
    state.gradientColor2 = e.target.value;
    document.querySelectorAll('#gradient-presets .preset-circle').forEach(c => c.classList.remove('active'));
    updateBackground();
    renderQR();
  });
  document.getElementById('grad-angle').addEventListener('input', (e) => {
    state.gradientAngle = parseInt(e.target.value);
    document.getElementById('angle-val').innerText = `${state.gradientAngle}°`;
    updateBackground();
    renderQR();
  });

  // Emojis Settings
  document.getElementById('apply-custom-emoji').addEventListener('click', () => {
    const val = document.getElementById('custom-emoji-text').value.trim();
    if (val) {
      state.selectedEmoji = val;
      // remove active states from presets
      document.querySelectorAll('#emoji-presets .emoji-preset-btn').forEach(b => b.classList.remove('active'));
      updateBackground();
    }
  });

  document.getElementById('emoji-size').addEventListener('input', (e) => {
    state.emojiSize = parseInt(e.target.value);
    document.getElementById('emoji-size-val').innerText = `${state.emojiSize}px`;
    updateBackground();
  });

  document.getElementById('emoji-spacing').addEventListener('input', (e) => {
    state.emojiSpacing = parseInt(e.target.value);
    document.getElementById('emoji-spacing-val').innerText = `${state.emojiSpacing}px`;
    updateBackground();
  });

  document.getElementById('emoji-angle').addEventListener('input', (e) => {
    state.emojiAngle = parseInt(e.target.value);
    document.getElementById('emoji-angle-val').innerText = `${state.emojiAngle}°`;
    updateBackground();
  });

  // Solid Color Settings
  document.getElementById('solid-color').addEventListener('input', (e) => {
    state.solidColor = e.target.value;
    document.getElementById('solid-color-hex').innerText = e.target.value.toUpperCase();
    updateBackground();
  });

  // QR Customizations
  document.getElementById('qr-design-style').addEventListener('change', (e) => {
    state.qrStyle = e.target.value;
    renderQR();
  });
  document.getElementById('qr-eye-style').addEventListener('change', (e) => {
    state.qrEyeStyle = e.target.value;
    renderQR();
  });
  document.getElementById('qr-color-mode').addEventListener('change', (e) => {
    state.qrColorMode = e.target.value;
    renderQR();
  });
  document.getElementById('qr-fg-color').addEventListener('input', (e) => {
    state.qrFgColor = e.target.value;
    renderQR();
  });
  document.getElementById('qr-bg-color').addEventListener('input', (e) => {
    state.qrBgColor = e.target.value;
    renderQR();
  });

  // Card Branding Label
  const cardUsernameInput = document.getElementById('card-username');
  usernameText.innerText = state.footerText;
  cardUsernameInput.value = state.footerText;
  cardUsernameInput.addEventListener('input', (e) => {
    state.footerText = e.target.value.trim() || '@USERNAME';
    usernameText.innerText = state.footerText;
  });

  const cardFontSelect = document.getElementById('card-font');
  cardFontSelect.addEventListener('change', (e) => {
    const font = e.target.value;
    usernameText.style.fontFamily = `"${font}", var(--font-sans)`;
  });

  const showLogoOverlayCheckbox = document.getElementById('show-logo-overlay');
  showLogoOverlayCheckbox.addEventListener('change', (e) => {
    state.showLogoOverlay = e.target.checked;
    footerLogoIcon.style.display = state.showLogoOverlay ? 'block' : 'none';
  });

  // Center Logo Select
  document.querySelectorAll('.logo-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.logo-preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeLogoPreset = btn.getAttribute('data-logo');
      renderQR();
    });
  });

  // Logo Scale Slider
  document.getElementById('logo-scale').addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    state.logoScale = val / 100;
    document.getElementById('logo-scale-val').innerText = `${val}%`;
    renderQR();
  });

  // Custom Logo File Uploader
  logoUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      state.customLogoDataUrl = event.target.result;
      state.activeLogoPreset = 'custom';
      document.querySelectorAll('.logo-preset-btn').forEach(b => b.classList.remove('active'));
      renderQR();
    };
    reader.readAsDataURL(file);
  });

  function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  async function uploadMediaFiles(files) {
    const isHttps = typeof window !== 'undefined' && window.location && window.location.protocol === 'https:';
    let backendCandidate = null;

    if (configuredMediaApiBase && !configuredMediaApiBase.includes('github.io')) {
      backendCandidate = `${configuredMediaApiBase}/api/upload-media`;
    } else if (isLocalServer && window.location.port === '8000') {
      backendCandidate = '/api/upload-media';
    } else if (!isHttps && !isGitHubPages) {
      backendCandidate = 'http://localhost:8000/api/upload-media';
    }

    // 1. Try local/custom Python server if reachable
    if (backendCandidate) {
      try {
        const formData = new FormData();
        files.forEach((file) => formData.append('mediaFiles', file));

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);
        const response = await fetch(backendCandidate, {
          method: 'POST',
          body: formData,
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && data.url) {
            return {
              url: data.url,
              files: data.files || []
            };
          }
        }
      } catch (err) {
        console.warn('Local Python backend not reachable, proceeding to cloud upload...', err);
      }
    }

    // 2. Cloud Upload via tmpfiles.org (CORS-enabled public host)
    try {
      showStatus(`Uploading ${files.length} items to cloud storage...`);
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const fd = new FormData();
          fd.append('file', file);
          const res = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: fd
          });
          if (!res.ok) throw new Error(`Cloud upload status ${res.status}`);
          const json = await res.json();
          if (json && json.data && json.data.url) {
            const raw = json.data.url;
            const fileId = raw.replace('https://tmpfiles.org/', '').split('/')[0];
            return {
              id: fileId,
              name: file.name,
              type: file.type.startsWith('video/') ? 'video' : 'image',
              url: raw,
              directUrl: raw.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/')
            };
          }
          throw new Error('Invalid cloud upload response');
        })
      );

      let finalGalleryUrl = '';
      if (uploadedFiles.length === 1) {
        finalGalleryUrl = uploadedFiles[0].url;
      } else {
        const originUrl = window.location.href.split('?')[0].replace(/index\.html$/, '');
        const ids = uploadedFiles.map(u => u.id).filter(Boolean);
        finalGalleryUrl = `${originUrl.replace(/\/$/, '')}/gallery.html?g=${ids.join(',')}`;
      }

      return {
        url: finalGalleryUrl,
        files: uploadedFiles
      };
    } catch (cloudErr) {
      console.warn('Cloud upload encountered an issue, falling back to local media mode:', cloudErr);
    }

    // 3. Fallback: Local client-side media mode (Always succeeds)
    const localBase = window.location.href.split('?')[0].replace(/index\.html$/, '');
    return {
      url: `${localBase.replace(/\/$/, '')}/gallery.html?local=1`,
      files: files.map(f => ({
        name: f.name,
        type: f.type.startsWith('video/') ? 'video' : 'image',
        url: URL.createObjectURL(f)
      }))
    };
  }

  async function handleIncomingFiles(files, append = true) {
    const validFiles = Array.from(files || []).filter(file =>
      file.type.startsWith('image/') || file.type.startsWith('video/')
    );

    if (!validFiles.length) return;

    showStatus(`Adding ${validFiles.length} photo${validFiles.length > 1 ? 's' : ''}...`);

    const newEntries = validFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      name: file.name,
      kind: file.type.startsWith('video/') ? 'video' : 'image',
      src: URL.createObjectURL(file),
      sizeStr: formatBytes(file.size),
      rawFile: file
    }));

    if (append) {
      state.mediaFiles = [...state.mediaFiles, ...newEntries];
    } else {
      state.mediaFiles = newEntries;
    }

    renderMediaPreviewList();

    // Switch tab to media
    state.activeTab = 'media';
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.toggle('active', b.getAttribute('data-tab') === 'media');
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.classList.toggle('active', p.id === 'tab-media');
    });

    try {
      const allRawFiles = state.mediaFiles.map(f => f.rawFile).filter(Boolean);
      showStatus(`Uploading ${allRawFiles.length} items to generate QR Code...`);
      const uploadResult = await uploadMediaFiles(allRawFiles);
      state.mediaGalleryUrl = uploadResult.url;
      renderQR();
      const count = state.mediaFiles.length;
      showStatus(`🎉 ${count} photo${count > 1 ? 's' : ''} bundled into single QR Code!`);
    } catch (err) {
      console.warn('Upload fallback to local preview:', err);
      state.mediaGalleryUrl = window.location.href;
      renderQR();
      showStatus(`${state.mediaFiles.length} items ready in QR Code!`);
    }
  }

  async function syncMediaQR() {
    if (!state.mediaFiles.length) {
      state.mediaGalleryUrl = '';
      renderQR();
      return;
    }

    const allRawFiles = state.mediaFiles.map(f => f.rawFile).filter(Boolean);
    if (allRawFiles.length > 0) {
      try {
        const uploadResult = await uploadMediaFiles(allRawFiles);
        state.mediaGalleryUrl = uploadResult.url;
      } catch (err) {
        console.warn('Sync upload error:', err);
      }
    }
    renderQR();
  }

  // 1-Click Demo: Generate 10 Real HD Sample Photos
  async function generate10SamplePhotos() {
    showStatus('Creating 10 vibrant sample photos...');
    const samplesMeta = [
      { name: '1_sunset_horizon.png', title: 'Sunset Horizon', c1: '#ff0055', c2: '#ff7700', icon: '☀️' },
      { name: '2_neon_cyberpunk.png', title: 'Neon Cyberpunk', c1: '#7928ca', c2: '#00f0ff', icon: '⚡' },
      { name: '3_emerald_forest.png', title: 'Emerald Forest', c1: '#00b09b', c2: '#96c93d', icon: '🌲' },
      { name: '4_deep_ocean.png', title: 'Deep Ocean', c1: '#0052d4', c2: '#4364f7', icon: '🌊' },
      { name: '5_golden_hour.png', title: 'Golden Hour', c1: '#f857a6', c2: '#ff5858', icon: '✨' },
      { name: '6_cosmic_galaxy.png', title: 'Cosmic Galaxy', c1: '#4776e6', c2: '#8e54e9', icon: '🌌' },
      { name: '7_mountain_peak.png', title: 'Mountain Peak', c1: '#1f4037', c2: '#99f2c8', icon: '🏔️' },
      { name: '8_tropical_paradise.png', title: 'Tropical Paradise', c1: '#fe8c00', c2: '#f83600', icon: '🏝️' },
      { name: '9_urban_architecture.png', title: 'Urban Architecture', c1: '#3a7bd5', c2: '#3a6073', icon: '🏙️' },
      { name: '10_aurora_borealis.png', title: 'Aurora Borealis', c1: '#00f2fe', c2: '#4facfe', icon: '🎆' }
    ];

    const sampleFiles = await Promise.all(samplesMeta.map(async (meta) => {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');

      const grad = ctx.createLinearGradient(0, 0, 600, 600);
      grad.addColorStop(0, meta.c1);
      grad.addColorStop(1, meta.c2);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 600);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.arc(300, 300, 220, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '90px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(meta.icon, 300, 250);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.fillText(meta.title, 300, 380);

      ctx.font = '22px sans-serif';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.fillText('Sample Photo #QR_BOSS', 300, 430);

      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
      return new File([blob], meta.name, { type: 'image/png' });
    }));

    await handleIncomingFiles(sampleFiles, false);
  }

  // File Inputs & Controls Listeners
  if (mediaUploadInput) {
    mediaUploadInput.addEventListener('change', async (e) => {
      await handleIncomingFiles(e.target.files, true);
      mediaUploadInput.value = '';
    });
  }

  if (mediaAddMoreInput) {
    mediaAddMoreInput.addEventListener('change', async (e) => {
      await handleIncomingFiles(e.target.files, true);
      mediaAddMoreInput.value = '';
    });
  }

  if (btnClearMedia) {
    btnClearMedia.addEventListener('click', () => {
      state.mediaFiles = [];
      state.mediaGalleryUrl = '';
      renderMediaPreviewList();
      renderQR();
      showStatus('All media cleared');
    });
  }

  if (btnLoad10Samples) {
    btnLoad10Samples.addEventListener('click', async () => {
      await generate10SamplePhotos();
    });
  }

  renderMediaPreviewList();

  // Live input changes triggers
  const inputsToWatch = [
    qrUrlInput, qrTextInput, wifiSSIDInput, wifiPasswordInput, wifiEncryptionInput,
    profileNameInput, profileHandleInput, profileTypeInput
  ];
  inputsToWatch.forEach(input => {
    input.addEventListener('input', () => renderQR());
    input.addEventListener('change', () => renderQR());
  });

  // BUTTON INTERACTION ACTION HANDLERS
  document.getElementById('btn-download-card').addEventListener('click', downloadCard);
  document.getElementById('btn-copy-card').addEventListener('click', copyCardToClipboard);
  document.getElementById('btn-download-qr').addEventListener('click', downloadQRImageOnly);
  const btnSaveQr = document.getElementById('btn-save-qr');
  if (btnSaveQr) {
    btnSaveQr.addEventListener('click', saveCurrentQrToDatabase);
  }

  function renderSavedQrList(records = []) {
    if (!savedQrList) return;
    savedQrList.innerHTML = '';

    if (!records.length) {
      const emptyItem = document.createElement('li');
      emptyItem.className = 'saved-qr-empty';
      emptyItem.textContent = 'No saved QR codes yet.';
      savedQrList.appendChild(emptyItem);
      return;
    }

    records.forEach((record) => {
      const item = document.createElement('li');
      item.className = 'saved-qr-item';
      item.innerHTML = `
        <strong>${(record.title || 'Untitled QR').replace(/</g, '&lt;')}</strong>
        <span>${(record.type || 'url').toUpperCase()}</span>
      `;
      item.title = record.content || '';
      item.addEventListener('click', () => {
        if (record.content) {
          navigator.clipboard?.writeText(record.content).catch(() => {});
          showStatus(`Saved QR copied: ${record.title || 'Untitled QR'}`);
        }
      });
      savedQrList.appendChild(item);
    });
  }

  async function loadSavedQrRecords() {
    if (!savedQrList) return;
    try {
      const response = await fetch(getApiEndpoint('/api/qr'));
      const data = await response.json();
      renderSavedQrList(Array.isArray(data.records) ? data.records : []);
    } catch (error) {
      console.warn('Could not load saved QR records:', error);
      renderSavedQrList([]);
    }
  }

  async function saveCurrentQrToDatabase() {
    const payload = {
      title: profileNameInput.value.trim() || `QR ${state.activeTab.toUpperCase()}`,
      type: state.activeTab,
      content: getQRDataContent(),
      theme: state.bgMode,
      metadata: {
        qrStyle: state.qrStyle,
        qrEyeStyle: state.qrEyeStyle,
        qrColorMode: state.qrColorMode,
        footerText: state.footerText,
      },
    };

    try {
      showStatus('Saving QR record...');
      const response = await fetch(getApiEndpoint('/api/qr'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to save QR');
      }

      showStatus('QR saved to database');
      await loadSavedQrRecords();
    } catch (error) {
      console.error(error);
      showStatus('Database save failed');
    }
  }

  // FUNCTIONS

  // Show dynamic toast status messages
  function showStatus(message, duration = 3000) {
    exportStatus.innerText = message;
    exportStatus.classList.add('show');
    setTimeout(() => {
      exportStatus.classList.remove('show');
    }, duration);
  }

  // Get current raw data based on selected tab input fields
  function getQRDataContent() {
    switch (state.activeTab) {
      case 'url':
        return qrUrlInput.value.trim() || 'https://example.com';
      case 'text':
        return qrTextInput.value.trim() || 'Welcome to QR Code Generator';
      case 'wifi':
        const ssid = wifiSSIDInput.value.trim() || 'WiFi';
        const password = wifiPasswordInput.value.trim() || '';
        const encryption = wifiEncryptionInput.value;
        return `WIFI:S:${ssid};T:${encryption};P:${password};;`;
      case 'profile':
        const handle = profileHandleInput.value.trim().replace('@', '') || 'instagram';
        const platform = profileTypeInput.value;
        switch (platform) {
          case 'Instagram': return `https://instagram.com/${handle}`;
          case 'Twitter': return `https://x.com/${handle}`;
          case 'LinkedIn': return `https://linkedin.com/in/${handle}`;
          case 'YouTube': return `https://youtube.com/@${handle}`;
          case 'Linktree': return `https://linktr.ee/${handle}`;
          default: return `https://example.com/${handle}`;
        }
      case 'media':
        return generateMediaQrPayload();
      default:
        return 'https://example.com';
    }
  }

  // Generate background style on preview panel
  function updateBackground() {
    if (state.bgMode === 'gradient') {
      const gradCss = `linear-gradient(${state.gradientAngle}deg, ${state.gradientColor1}, ${state.gradientColor2})`;
      cardBgLayer.style.background = gradCss;
      cardBgLayer.style.backgroundImage = gradCss;
    } else if (state.bgMode === 'solid') {
      cardBgLayer.style.background = state.solidColor;
      cardBgLayer.style.backgroundImage = 'none';
    } else if (state.bgMode === 'emoji') {
      const dataUrl = generateEmojiPattern(
        state.selectedEmoji,
        state.emojiSize,
        state.emojiSpacing,
        state.emojiAngle
      );
      cardBgLayer.style.background = `url(${dataUrl})`;
      cardBgLayer.style.backgroundImage = `url(${dataUrl})`;
      cardBgLayer.style.backgroundRepeat = 'repeat';
    }
  }

  // Renders dynamic tiled canvas to feed card background
  function generateEmojiPattern(emoji, size, spacing, rotationAngle) {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = spacing;
    patternCanvas.height = spacing;
    const ctx = patternCanvas.getContext('2d');
    
    ctx.clearRect(0, 0, spacing, spacing);
    
    // Smooth rendering attributes
    ctx.imageSmoothingEnabled = true;
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Translate and rotate around the center point
    ctx.translate(spacing / 2, spacing / 2);
    ctx.rotate((rotationAngle * Math.PI) / 180);
    ctx.fillText(emoji, 0, 0);
    
    return patternCanvas.toDataURL();
  }

  // Draw Rounded Rectangles helper on Canvas
  function drawRoundedRect(ctx, x, y, width, height, radius, fillStyle) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  // Draw Circle helper on Canvas
  function drawCircle(ctx, cx, cy, r, fillStyle) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fillStyle = fillStyle;
    ctx.fill();
  }

  // Detects if module coordinates lie within Finder Corner patterns
  function isFinderPattern(r, c, moduleCount) {
    // Top-left finder (7x7 modules)
    if (r < 7 && c < 7) return true;
    // Top-right finder (7x7 modules)
    if (r < 7 && c >= moduleCount - 7) return true;
    // Bottom-left finder (7x7 modules)
    if (r >= moduleCount - 7 && c < 7) return true;
    return false;
  }

  // CORE QR CANVAS RENDERER
  function renderQR() {
    const dataText = getQRDataContent();
    
    // Build QR Model
    // Error correction level set to H to guarantee recovery with center logos mask
    const qr = qrcode(0, 'H');
    qr.addData(dataText);
    qr.make();
    
    const moduleCount = qr.getModuleCount();
    
    // Target High Resolution Canvas drawing for quality exports
    const canvasRes = 600;
    qrCanvas.width = canvasRes;
    qrCanvas.height = canvasRes;
    
    const ctx = qrCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasRes, canvasRes);
    
    // Calculate sizing
    const cellSize = canvasRes / moduleCount;
    
    // Set colors
    let fillStyle = state.qrFgColor;
    if (state.qrColorMode === 'grad') {
      // If matches background gradient, draw linear canvas gradient
      const grad = ctx.createLinearGradient(0, 0, canvasRes, canvasRes);
      if (state.bgMode === 'gradient') {
        grad.addColorStop(0, state.gradientColor1);
        grad.addColorStop(1, state.gradientColor2);
      } else {
        grad.addColorStop(0, '#7d5fff');
        grad.addColorStop(1, '#ff5f6d');
      }
      fillStyle = grad;
    }
    
    // 1. Draw Canvas background fill
    ctx.fillStyle = state.qrBgColor;
    ctx.fillRect(0, 0, canvasRes, canvasRes);

    // 2. Draw Data Modules (Exclude finder patterns)
    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (qr.isDark(r, c)) {
          // Skip drawing finders here (handled separately below)
          if (isFinderPattern(r, c, moduleCount)) continue;
          
          const x = c * cellSize;
          const y = r * cellSize;
          
          // Draw based on selected style
          if (state.qrStyle === 'dots') {
            const cx = x + cellSize / 2;
            const cy = y + cellSize / 2;
            // Draw circle with slight margin
            drawCircle(ctx, cx, cy, (cellSize / 2) * 0.82, fillStyle);
          } else if (state.qrStyle === 'liquid') {
            // Rounded connected rectangles
            const radius = cellSize * 0.38;
            drawRoundedRect(ctx, x, y, cellSize, cellSize, radius, fillStyle);
          } else {
            // Classic Square blocks
            ctx.fillStyle = fillStyle;
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }
    }

    // 3. Draw Eyes / Finder corner patterns
    const drawEye = (xStart, yStart) => {
      const eyeSize = 7 * cellSize;
      const x = xStart * cellSize;
      const y = yStart * cellSize;
      const cx = x + eyeSize / 2;
      const cy = y + eyeSize / 2;

      // Draw depending on eye style
      if (state.qrEyeStyle === 'rounded') {
        // Double concentric circles
        // Outer Circle (radius = 3.5 * cellSize)
        drawCircle(ctx, cx, cy, 3.5 * cellSize, fillStyle);
        // Inner Clear circle gap
        drawCircle(ctx, cx, cy, 2.5 * cellSize, state.qrBgColor);
        // Center core circle dot
        drawCircle(ctx, cx, cy, 1.5 * cellSize, fillStyle);
      } else if (state.qrEyeStyle === 'smooth') {
        // Rounded rectangles
        const outerRadius = cellSize * 2.0;
        const innerRadius = cellSize * 1.0;
        // Outer box
        drawRoundedRect(ctx, x, y, eyeSize, eyeSize, outerRadius, fillStyle);
        // Inner white gap box
        drawRoundedRect(ctx, x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize, innerRadius, state.qrBgColor);
        // Center core solid box
        drawRoundedRect(ctx, x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize, cellSize * 0.6, fillStyle);
      } else {
        // Classic sharp square boxes
        // Outer box
        ctx.fillStyle = fillStyle;
        ctx.fillRect(x, y, eyeSize, eyeSize);
        // Inner white box
        ctx.fillStyle = state.qrBgColor;
        ctx.fillRect(x + cellSize, y + cellSize, 5 * cellSize, 5 * cellSize);
        // Center solid box
        ctx.fillStyle = fillStyle;
        ctx.fillRect(x + 2 * cellSize, y + 2 * cellSize, 3 * cellSize, 3 * cellSize);
      }
    };

    // Draw three corner finders in the correct QR positions
    drawEye(0, 0); // Top Left
    drawEye(moduleCount - 7, 0); // Top Right
    drawEye(0, moduleCount - 7); // Bottom Left

    // 4. Center Logo Masking & Rendering
    if (state.activeLogoPreset !== 'none' && state.showLogoOverlay) {
      const logoSize = canvasRes * state.logoScale;
      const lx = (canvasRes - logoSize) / 2;
      const ly = (canvasRes - logoSize) / 2;
      
      // Draw white background cutout/shield behind logo
      const shieldPadding = cellSize * 0.6;
      const shieldSize = logoSize + shieldPadding * 2;
      const sx = lx - shieldPadding;
      const sy = ly - shieldPadding;
      
      drawRoundedRect(ctx, sx, sy, shieldSize, shieldSize, shieldSize * 0.35, state.qrBgColor);
      
      // Draw logo preset or custom image
      if (state.activeLogoPreset === 'custom' && state.customLogoDataUrl) {
        const customImg = new Image();
        customImg.src = state.customLogoDataUrl;
        customImg.onload = () => {
          ctx.drawImage(customImg, lx, ly, logoSize, logoSize);
        };
      } else if (VECTOR_LOGOS[state.activeLogoPreset]) {
        // Convert inline SVG vector to dataURI and draw
        // Set color dynamically on SVG matches QR code color
        let logoColor = '#000000';
        if (state.qrColorMode === 'solid') {
          logoColor = state.qrFgColor;
        } else {
          logoColor = state.gradientColor1;
        }
        
        let svgString = VECTOR_LOGOS[state.activeLogoPreset]
          .replace('stroke="currentColor"', `stroke="${logoColor}"`)
          .replace('fill="currentColor"', `fill="${logoColor}"`);
          
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const URL = window.URL || window.webkitURL || window;
        const blobUrl = URL.createObjectURL(svgBlob);
        
        const logoImg = new Image();
        logoImg.src = blobUrl;
        logoImg.onload = () => {
          ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
          URL.revokeObjectURL(blobUrl);
        };
      }
    }
  }

  // 3D PARALLAX PERSPECTIVE MOUSE TILT ANIMATION
  tiltContainer.addEventListener('mousemove', (e) => {
    const rect = tiltContainer.getBoundingClientRect();
    // Cursor coords relative to panel
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Half width/height
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    // Calculate rotation angle (max 12 deg)
    const rotateX = ((centerY - y) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * -12; // Inverted for intuitive direct-point feel
    
    shareCardContainer.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });

  // Reset transforms on mouse leave
  tiltContainer.addEventListener('mouseleave', () => {
    shareCardContainer.style.transform = `rotateX(0deg) rotateY(0deg)`;
  });

  // HIGH-RESOLUTION IMAGE EXPORTER: html2canvas
  function downloadCard() {
    showStatus('Rendering Card PNG...');
    
    // Temporarily disable tilt transform during capture to avoid image warping skew
    shareCardContainer.style.transform = 'rotateX(0deg) rotateY(0deg)';
    
    // Wait for repaint
    setTimeout(() => {
      html2canvas(shareCardContainer, {
        scale: 2, // 2x density for crisp quality printing
        useCORS: true,
        logging: false,
        backgroundColor: null
      }).then(canvas => {
        const dataUrl = canvas.toDataURL('image/png');
        const link = document.createElement('a');
        link.download = `qr_code_${state.footerText.replace('@', '') || 'card'}.png`;
        link.href = dataUrl;
        link.click();
        showStatus('Card Downloaded successfully!');
      }).catch(err => {
        console.error(err);
        showStatus('Export failed. Check console.');
      });
    }, 100);
  }

  // COPY CARD TO CLIPBOARD API
  function copyCardToClipboard() {
    showStatus('Preparing Card image...');
    
    shareCardContainer.style.transform = 'rotateX(0deg) rotateY(0deg)';
    
    setTimeout(() => {
      html2canvas(shareCardContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: null
      }).then(canvas => {
        canvas.toBlob(blob => {
          navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]).then(() => {
            showStatus('Card copied to clipboard! Paste anywhere.');
          }).catch(err => {
            console.error(err);
            showStatus('Clipboard copy blocked by browser. Download instead.');
          });
        }, 'image/png');
      }).catch(err => {
        console.error(err);
        showStatus('Render failed.');
      });
    }, 100);
  }

  // DOWNLOAD RAW QR CODE ONLY
  function downloadQRImageOnly() {
    const dataUrl = qrCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `qr_code_only_${state.footerText.replace('@', '') || 'code'}.png`;
    link.href = dataUrl;
    link.click();
    showStatus('QR Code Only Downloaded!');
  }

  // APP INITIALIZATION RUNS
  updateBackground();
  renderQR();
  loadSavedQrRecords();
});
