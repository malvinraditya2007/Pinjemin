import { renderAppShell } from '../layout.js';
import { requireLogin } from '../auth.js';
import api from '../api.js';
import toast from '../toast.js';

requireLogin();
renderAppShell('item-new');

let uploadedImages = [];
let mapInstance = null;
let mapMarker = null;
let currentSelectedLat = -6.200000;
let currentSelectedLng = 106.816666; // Default Jakarta
let currentAddressStr = '';

// DOM Elements
const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const previewGrid = document.getElementById('preview-grid');
const submitBtn = document.getElementById('submit-btn');
const neighborhoodInput = document.getElementById('neighborhood');

// Helper Functions
function goStep(n) {
  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`step-${i}`);
    if (el) el.style.display = i === n ? '' : 'none';
  }
  document.querySelectorAll('.step-indicator__item').forEach(item => {
    const s = parseInt(item.dataset.step);
    item.classList.toggle('is-active', s === n);
    item.classList.toggle('is-done', s < n);
  });
  if (n === 4) renderPreview();
  lucide.createIcons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function renderPreview() {
  const title = document.getElementById('item-title').value || 'Nama Barang';
  const cat = document.getElementById('item-cat').value;
  const loc = document.getElementById('neighborhood').value || 'Lokasiku';
  const dep = parseInt(document.getElementById('deposit').value) || 0;
  const catEmoji = { TOOLS: '🔧', ELECTRONICS: '💻', SPORTS: '🏋️', KITCHEN: '🍳', GARDEN: '🌿', VEHICLE: '🚗', BABY_KIDS: '👶', BOOKS_MEDIA: '📚', FASHION: '👗', OUTDOOR: '⛺', OTHER: '📦' };
  
  const previewCard = document.getElementById('preview-card');
  if (previewCard) {
    previewCard.innerHTML = `
      <div class="item-card" style="max-width:280px;pointer-events:none">
        <div class="item-card__image-wrap">
          <div class="item-card__placeholder"><span>${catEmoji[cat] || '📦'}</span></div>
          <div class="item-card__availability"><span class="badge badge-available">Tersedia</span></div>
        </div>
        <div class="item-card__body">
          <div class="item-card__title">${title}</div>
          <div class="item-card__location">📍 ${loc}</div>
          <div class="item-card__footer">
            <span class="item-card__deposit ${dep === 0 ? 'item-card__deposit--free' : ''}">${dep === 0 ? '✓ Gratis dipinjam' : 'Deposit: Rp ' + dep.toLocaleString('id-ID')}</span>
          </div>
        </div>
      </div>`;
  }
}

function compressImage(file, maxPx = 800, quality = 0.75) {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = ev => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxPx || height > maxPx) {
          if (width > height) { height = Math.round(height * maxPx / width); width = maxPx; }
          else { width = Math.round(width * maxPx / height); height = maxPx; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function openMapModal() {
  if (!document.getElementById('map-modal-container')) {
    const div = document.createElement('div');
    div.id = 'map-modal-container';
    div.innerHTML = `
      <div class="modal-backdrop" id="map-modal-overlay" style="z-index: 2000;">
        <div class="modal modal--md" id="map-modal" style="width: 90vw; max-width: 600px; overflow: hidden; padding: 0;">
          <div class="modal__header" style="padding: 16px; border-bottom: 1px solid var(--color-neutral-200);">
            <h2 class="modal__title">Pilih Lokasi</h2>
            <button class="modal__close" id="btn-close-map"><i data-lucide="x" style="width:20px;height:20px"></i></button>
          </div>
          <div class="modal__body" style="padding: 0;">
            <div id="leaflet-map" style="height: 60vh; width: 100%; min-height: 300px; z-index: 1;"></div>
            <div style="padding: 16px; background: white; z-index: 2; position: relative; border-top: 1px solid var(--color-neutral-200);">
              <p id="map-address-preview" style="margin-bottom: 12px; font-weight: 500; font-size: 14px; color: var(--color-neutral-700);">Memuat lokasi...</p>
              <button class="btn btn-primary btn-pill" id="btn-confirm-map" style="width: 100%;">Konfirmasi Lokasi</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    lucide.createIcons();
    
    // Wire map buttons dynamically
    document.getElementById('btn-close-map').addEventListener('click', closeMapModal);
    document.getElementById('btn-confirm-map').addEventListener('click', confirmMapLocation);
  }

  document.getElementById('map-modal-overlay').classList.add('is-open');

  setTimeout(() => {
    initLeafletMap();
  }, 350);
}

function closeMapModal() {
  const overlay = document.getElementById('map-modal-overlay');
  if (overlay) overlay.classList.remove('is-open');
}

function initLeafletMap() {
  if (!mapInstance) {
    mapInstance = L.map('leaflet-map').setView([currentSelectedLat, currentSelectedLng], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap'
    }).addTo(mapInstance);

    mapMarker = L.marker([currentSelectedLat, currentSelectedLng], { draggable: true }).addTo(mapInstance);

    mapMarker.on('dragend', function (e) {
      const position = mapMarker.getLatLng();
      updateMapLocation(position.lat, position.lng);
    });

    mapInstance.on('click', function (e) {
      updateMapLocation(e.latlng.lat, e.latlng.lng);
    });

    const savedLat = parseFloat(document.getElementById('edit-lat').value);
    const savedLng = parseFloat(document.getElementById('edit-lng').value);

    if (!isNaN(savedLat) && !isNaN(savedLng)) {
      updateMapLocation(savedLat, savedLng, true);
    } else {
      mapInstance.locate({ setView: true, maxZoom: 16 });
      mapInstance.on('locationfound', function (e) {
        updateMapLocation(e.latlng.lat, e.latlng.lng);
      });
      mapInstance.on('locationerror', function (e) {
        reverseGeocode(currentSelectedLat, currentSelectedLng);
      });
    }
  } else {
    mapInstance.invalidateSize();
    const savedLat = parseFloat(document.getElementById('edit-lat').value);
    const savedLng = parseFloat(document.getElementById('edit-lng').value);
    if (!isNaN(savedLat) && !isNaN(savedLng)) {
      updateMapLocation(savedLat, savedLng, true);
    }
  }
}

function updateMapLocation(lat, lng, centerMap = false) {
  currentSelectedLat = lat;
  currentSelectedLng = lng;
  mapMarker.setLatLng([lat, lng]);
  if (centerMap) {
    mapInstance.setView([lat, lng], 16);
  }
  reverseGeocode(lat, lng);
}

async function reverseGeocode(lat, lng) {
  const preview = document.getElementById('map-address-preview');
  if (preview) preview.textContent = "Mencari alamat...";
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'id'
      }
    });
    const data = await res.json();
    if (data && data.display_name) {
      currentAddressStr = data.display_name;
      if (preview) preview.textContent = currentAddressStr;
    } else {
      if (preview) preview.textContent = "Alamat tidak ditemukan.";
    }
  } catch (e) {
    console.error(e);
    if (preview) preview.textContent = "Gagal memuat alamat.";
  }
}

function confirmMapLocation() {
  document.getElementById('edit-lat').value = currentSelectedLat;
  document.getElementById('edit-lng').value = currentSelectedLng;
  document.getElementById('neighborhood').value = currentAddressStr;
  renderPreview();
  closeMapModal();
}

function getCurrentLocation(btn) {
  const ogText = btn.innerHTML;
  btn.innerHTML = '<i data-lucide="loader" style="width:14px;height:14px"></i> Mencari...';
  lucide.createIcons();
  btn.disabled = true;

  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      document.getElementById('edit-lat').value = lat;
      document.getElementById('edit-lng').value = lng;

      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
          headers: {
            'Accept-Language': 'id'
          }
        });
        const data = await res.json();
        if (data && data.display_name) {
          document.getElementById('neighborhood').value = data.display_name;
          renderPreview();
          toast.success('Berhasil', 'Lokasi ditemukan!');
        }
      } catch (e) {
        toast.error('Gagal', 'Tidak dapat mengambil nama jalan');
      } finally {
        btn.innerHTML = ogText;
        btn.disabled = false;
        lucide.createIcons();
      }
    }, (error) => {
      toast.error('Gagal', 'Akses lokasi ditolak atau gagal.');
      btn.innerHTML = ogText;
      btn.disabled = false;
      lucide.createIcons();
    }, { timeout: 10000 });
  } else {
    toast.error('Gagal', 'Geolocation tidak didukung browser ini.');
    btn.innerHTML = ogText;
    btn.disabled = false;
    lucide.createIcons();
  }
}


// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  // Step Navigation Delegation
  document.addEventListener('click', e => {
    const stepBtn = e.target.closest('.action-step');
    if (stepBtn) {
      const target = parseInt(stepBtn.dataset.target);
      if (target) goStep(target);
    }
  });

  // Upload Zone Drag & Drop
  if (uploadZone) {
    uploadZone.addEventListener('dragover', e => {
      e.preventDefault();
      uploadZone.style.borderColor = 'var(--color-primary-400)';
    });
    uploadZone.addEventListener('dragleave', () => {
      uploadZone.style.borderColor = 'var(--color-neutral-300)';
    });
  }

  // File Input Change
  if (fileInput) {
    fileInput.addEventListener('change', async e => {
      previewGrid.innerHTML = '';
      uploadedImages = [];
      const files = [...e.target.files].slice(0, 5);
      for (let idx = 0; idx < files.length; idx++) {
        const compressed = await compressImage(files[idx]);
        uploadedImages[idx] = compressed;
        const div = document.createElement('div');
        div.style.cssText = 'aspect-ratio:1;border-radius:var(--radius-md);overflow:hidden;position:relative;background:var(--color-neutral-100)';
        div.innerHTML = `<img src="${compressed}" style="width:100%;height:100%;object-fit:cover"/>`;
        previewGrid.appendChild(div);
      }
    });
  }

  // Submit Button
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const title = document.getElementById('item-title').value;
      const category = document.getElementById('item-cat').value;
      const condition = document.getElementById('item-cond').value;
      const description = document.getElementById('item-desc').value;
      const depositAmount = document.getElementById('deposit').value;
      const neighborhood = document.getElementById('neighborhood').value;
      const tags = document.getElementById('item-tags').value;
      const usageGuidelines = document.getElementById('guidelines').value;

      if (!title || !category || !condition || !description) {
        toast.error('Lengkapi data', 'Nama, kategori, kondisi, dan deskripsi wajib diisi.');
        return;
      }

      const ogText = submitBtn.innerHTML;
      submitBtn.innerHTML = 'Menyimpan...';
      submitBtn.disabled = true;

      const lat = document.getElementById('edit-lat').value;
      const lng = document.getElementById('edit-lng').value;

      try {
        const payload = {
          title,
          category,
          condition,
          description,
          depositAmount,
          neighborhood,
          tags,
          usageGuidelines,
          images: JSON.stringify(uploadedImages.filter(Boolean))
        };
        if (lat && lng) {
          payload.lat = parseFloat(lat);
          payload.lng = parseFloat(lng);
        }
        await api.items.create(payload);

        toast.success('Barang berhasil didaftarkan! 🎉', `"${title}" sekarang bisa ditemukan komunitas.`);
        setTimeout(() => location.href = 'dashboard.html', 2000);
      } catch (e) {
        toast.error('Gagal mendaftar', e.message);
        submitBtn.innerHTML = ogText;
        submitBtn.disabled = false;
      }
    });
  }

  // Location Buttons
  document.getElementById('btn-get-location')?.addEventListener('click', function() {
    getCurrentLocation(this);
  });
  
  document.getElementById('btn-open-map')?.addEventListener('click', () => {
    openMapModal();
  });

  // Neighborhood Input
  if (neighborhoodInput) {
    neighborhoodInput.addEventListener('input', () => {
      renderPreview();
    });
  }

  lucide.createIcons();
});
