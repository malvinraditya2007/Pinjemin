import { renderAppShell } from '../layout.js';
import { requireLogin, getUser, logout } from '../auth.js';
import api from '../api.js';
import { getTrustLevel, getCategoryInfo, formatDate, formatIDR, getInitials } from '../utils.js';
import toast from '../toast.js';

requireLogin();
renderAppShell('profile');

let user = null;
let myItems = [];
let mapInstance = null;
let mapMarker = null;
let currentSelectedLat = -6.200000;
let currentSelectedLng = 106.816666; // Default Jakarta
let currentAddressStr = '';

const loggedInUser = getUser();
const MY_ID = loggedInUser?.id || 'user-001';

async function init() {
  const params = new URLSearchParams(location.search);
  const userId = params.get('user') || MY_ID;
  const isMe = userId === MY_ID;

  try {
    const [userData, allItems] = await Promise.all([
      api.users.getById(userId),
      api.items.getAll()
    ]);
    user = userData;
    myItems = allItems.filter(i => i.ownerId === user.id);

    const trust = getTrustLevel(user.trustScore);
    const initials = getInitials(user.fullName);

    document.getElementById('profile-content').innerHTML = `
      <!-- Cover + Header -->
      <div style="margin-bottom:var(--space-6)">
        <div class="profile-cover"></div>
        <div class="profile-header">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div class="profile-header__avatar">
              <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-600));color:white;font-weight:800;font-size:2rem">${initials}</div>
            </div>
            ${isMe ? `<div style="display:flex;gap:var(--space-2);margin-top:var(--space-4);flex-wrap:wrap">
              <button class="btn btn-outline-neutral btn-md" id="btn-open-edit-profile">
                <i data-lucide="edit-3" style="width:16px;height:16px"></i> Edit Profil
              </button>
              <button class="btn btn-md" id="profile-logout-btn" style="background:var(--color-danger-50,#FEF2F2);color:var(--color-danger,#EF4444);border:1.5px solid var(--color-danger-200,#FECACA);border-radius:var(--radius-lg)">
                <i data-lucide="log-out" style="width:16px;height:16px"></i> Logout
              </button>
            </div>` : ''}
          </div>
          <div class="profile-header__identity">
            <div class="profile-header__name">${user.fullName}</div>
            <div class="profile-header__username">@${user.username}</div>
            <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-3)">
              <span class="badge badge-trust ${trust.class}" style="font-size:0.8rem;padding:0.3em 0.8em">${trust.label} Member</span>
            </div>
            ${user.bio ? `<p class="profile-header__bio">${user.bio}</p>` : ''}
            <div class="profile-header__meta">
              <span class="profile-header__meta-item"><i data-lucide="map-pin" style="width:14px;height:14px"></i> ${user.address || 'Indonesia'}</span>
              <span class="profile-header__meta-item"><i data-lucide="calendar" style="width:14px;height:14px"></i> Bergabung ${formatDate(user.createdAt)}</span>
            </div>
          </div>

          <!-- Stats -->
          <div class="profile-stats">
            <div class="profile-stat">
              <div class="profile-stat__value">${myItems.length}</div>
              <div class="profile-stat__label">Barang Terdaftar</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat__value">${user.totalLends || 0}</div>
              <div class="profile-stat__label">Total Dipinjamkan</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat__value">${user.totalBorrows || 0}</div>
              <div class="profile-stat__label">Total Meminjam</div>
            </div>
            <div class="profile-stat">
              <div class="profile-stat__value">${user.successfulReturns || 0}</div>
              <div class="profile-stat__label">Dikembalikan Tepat</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Trust Score Widget -->
      <div class="trust-card" style="margin-bottom:var(--space-6)">
        <div class="trust-card__top">
          <div class="trust-ring trust-ring--${trust.level}" id="trust-ring-wrap">
            <svg class="trust-ring__svg" width="120" height="120" viewBox="0 0 120 120">
              <circle class="trust-ring__track" cx="60" cy="60" r="50"/>
              <circle class="trust-ring__fill" cx="60" cy="60" r="50"
                stroke-dasharray="314"
                stroke-dashoffset="314"
                id="trust-ring-fill"/>
            </svg>
            <div class="trust-ring__center">
              <span class="trust-ring__score">${user.trustScore}</span>
              <span class="trust-ring__label">/100</span>
            </div>
          </div>
          <div class="trust-card__info">
            <div class="trust-card__name">${trust.label} Member</div>
            <div class="trust-card__description">Trust score dihitung dari riwayat pengembalian, rating, dan aktivitas.</div>
          </div>
        </div>
        <div class="trust-breakdown">
          <div class="trust-breakdown__item">
            <div class="trust-breakdown__icon">⭐</div>
            <div class="trust-breakdown__label">Rating Rata-rata Diterima</div>
            <div class="trust-breakdown__value">4.8 / 5</div>
          </div>
          <div class="trust-breakdown__item">
            <div class="trust-breakdown__icon">✅</div>
            <div class="trust-breakdown__label">Tingkat Pengembalian Tepat Waktu</div>
            <div class="trust-breakdown__value">${Math.round((user.successfulReturns||0) / Math.max((user.totalBorrows||0),1) * 100)}%</div>
          </div>
          <div class="trust-breakdown__item">
            <div class="trust-breakdown__icon">📦</div>
            <div class="trust-breakdown__label">Total Aktivitas Pinjam</div>
            <div class="trust-breakdown__value">${(user.totalBorrows||0) + (user.totalLends||0)}x</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tab-bar" id="profile-tabs" style="margin-bottom:var(--space-6)">
        <div class="tab-bar__item is-active" data-tab="items">Barang</div>
        <div class="tab-bar__item" data-tab="badges">Badge</div>
      </div>
      <div id="tab-content"></div>`;

    setTimeout(() => {
      const fill = document.getElementById('trust-ring-fill');
      if (fill) {
        const offset = 314 - (314 * user.trustScore / 100);
        fill.style.transition = 'stroke-dashoffset 1.5s ease';
        fill.style.strokeDashoffset = offset;
      }
    }, 300);

    const myItemsHTML = myItems.length ? `
      <div class="grid grid-cols-3 grid-gap-6">${myItems.map(item => {
        const cat = getCategoryInfo(item.category);
        let images = [];
        images = Array.isArray(item.images) ? item.images : (() => { try { return JSON.parse(item.images || '[]'); } catch(e) { return []; } })();
        const imgHTML = images.length
          ? `<img src="${images[0]}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;" alt="${item.title}"/>`
          : `<div class="item-card__placeholder"><span>${cat.emoji}</span></div>`;

        return `<div class="item-card" style="cursor:default">
          <div class="item-card__image-wrap">
            ${imgHTML}
            <div class="item-card__availability"><span class="badge ${item.isAvailable?'badge-available':'badge-unavailable'}">${item.isAvailable?'Tersedia':'Dipinjam'}</span></div>
          </div>
          <div class="item-card__body">
            <div class="item-card__title">${item.title}</div>
            <div class="item-card__location">📍 ${item.neighborhood}</div>
            <div class="item-card__footer">
              <span class="item-card__deposit ${item.depositAmount===0?'item-card__deposit--free':''}">${item.depositAmount===0?'Gratis':formatIDR(item.depositAmount)}</span>
            </div>
          </div>
        </div>`;
      }).join('')}</div>` : `<div class="empty-state"><div class="empty-state__icon">📦</div><div class="empty-state__title">Belum ada barang</div>${isMe ? `<a href="item-new.html" class="btn btn-primary btn-md btn-pill" style="margin-top:var(--space-4)">+ Tambah Barang</a>` : ''}</div>`;

    const badgesHTML = `
      <div class="grid grid-cols-4 grid-gap-4">
        ${[
          {icon:'🤝', name:'First Lend', desc:'Dipinjamkan pertama kali', earned:true},
          {icon:'⭐', name:'5-Star Borrower', desc:'Dapat 5 bintang 3x berturut-turut', earned:true},
          {icon:'🚀', name:'Trust Rocket', desc:'Trust score mencapai 80+', earned:true},
          {icon:'🏆', name:'Community Hero', desc:'50+ pinjaman berhasil', earned:false},
          {icon:'💎', name:'Verified Member', desc:'Trust score 90+', earned:false},
          {icon:'🌍', name:'Eco Champion', desc:'100 pinjaman — hemat 10kg CO₂', earned:false},
        ].map(b => `
          <div class="card" style="${b.earned?'':'opacity:0.45;filter:grayscale(1)'}">
            <div class="card__body" style="text-align:center;padding:var(--space-5)">
              <div style="font-size:2rem;margin-bottom:var(--space-2)">${b.icon}</div>
              <div style="font-weight:700;font-size:var(--text-body-sm-size);margin-bottom:4px">${b.name}</div>
              <div style="font-size:var(--text-body-xs-size);color:var(--color-neutral-400)">${b.desc}</div>
              ${b.earned ? '<div style="margin-top:var(--space-2)"><span class="badge badge-approved">Diraih!</span></div>' : ''}
            </div>
          </div>`).join('')}
      </div>`;

    const tabContent = document.getElementById('tab-content');
    tabContent.innerHTML = myItemsHTML;

    // We can wire the edit profile button now since it was just rendered
    document.getElementById('btn-open-edit-profile')?.addEventListener('click', openEditProfile);
    document.getElementById('profile-logout-btn')?.addEventListener('click', () => { logout('../index.html'); });

    lucide.createIcons();
  } catch(e) {
    document.getElementById('profile-content').innerHTML = `<div class="empty-state"><div class="empty-state__icon">❌</div><div class="empty-state__title">Profil tidak ditemukan</div></div>`;
  }
}

function openEditProfile() {
  if (!document.getElementById('edit-profile-modal-container')) {
    const div = document.createElement('div');
    div.id = 'edit-profile-modal-container';
    div.innerHTML = `
      <div class="modal-backdrop" id="edit-profile-overlay">
        <div class="modal modal--sm" id="edit-profile-modal">
          <div class="modal__header">
            <h2 class="modal__title">Edit Profil</h2>
            <button class="modal__close" id="btn-close-edit"><i data-lucide="x" style="width:20px;height:20px"></i></button>
          </div>
          <div class="modal__body">
            <div class="form-group">
              <label class="form-label">Nama Lengkap</label>
              <input type="text" class="form-input" id="edit-fullname" />
            </div>
            <div class="form-group">
              <label class="form-label">Username</label>
              <div style="display:flex;align-items:center;gap:8px;padding:10px 14px;background:var(--color-neutral-100);border:1.5px solid var(--color-neutral-200);border-radius:var(--radius-md);color:var(--color-neutral-500)">
                <i data-lucide="lock" style="width:15px;height:15px;flex-shrink:0;color:var(--color-neutral-400)"></i>
                <span id="edit-username-display" style="font-weight:600"></span>
              </div>
              <div class="form-hint" style="margin-top:4px;font-size:var(--text-body-xs-size);color:var(--color-neutral-400)">Username tidak dapat diubah setelah akun dibuat.</div>
            </div>
            <div class="form-group">
              <label class="form-label">Bio Singkat</label>
              <textarea class="form-textarea" id="edit-bio" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Lokasi / Alamat</label>
              <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
                <button type="button" class="btn btn-outline-neutral btn-sm" id="btn-get-location" style="flex:1;display:flex;justify-content:center;gap:6px;align-items:center">
                  <i data-lucide="crosshair" style="width:14px;height:14px"></i> Lokasimu saat ini
                </button>
                <button type="button" class="btn btn-outline-neutral btn-sm" id="btn-open-map" style="flex:1;display:flex;justify-content:center;gap:6px;align-items:center">
                  <i data-lucide="map" style="width:14px;height:14px"></i> Pilih lewat peta
                </button>
              </div>
              <input type="text" class="form-input" id="edit-address" placeholder="Contoh: Jl. Sudirman..." />
              <input type="hidden" id="edit-lat" />
              <input type="hidden" id="edit-lng" />
            </div>
          </div>
          <div class="modal__footer" style="display:flex;justify-content:flex-end;gap:var(--space-3)">
            <button class="btn btn-ghost" id="btn-cancel-edit">Batal</button>
            <button class="btn btn-primary btn-pill" id="save-edit-btn">Simpan Perubahan</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    lucide.createIcons();

    document.getElementById('btn-close-edit').addEventListener('click', closeEditProfile);
    document.getElementById('btn-cancel-edit').addEventListener('click', closeEditProfile);
    document.getElementById('save-edit-btn').addEventListener('click', saveProfile);
    document.getElementById('btn-get-location').addEventListener('click', function() { getCurrentLocation(this); });
    document.getElementById('btn-open-map').addEventListener('click', openMapModal);
  }
  
  document.getElementById('edit-fullname').value = user.fullName;
  document.getElementById('edit-username-display').textContent = '@' + (user.username || '');
  document.getElementById('edit-bio').value = user.bio || '';
  document.getElementById('edit-address').value = user.address || '';
  document.getElementById('edit-lat').value = user.lat || '';
  document.getElementById('edit-lng').value = user.lng || '';
  
  setTimeout(() => {
    document.getElementById('edit-profile-overlay').classList.add('is-open');
  }, 10);
}

function closeEditProfile() {
  const overlay = document.getElementById('edit-profile-overlay');
  if (overlay) overlay.classList.remove('is-open');
}

async function saveProfile() {
  const fullName = document.getElementById('edit-fullname').value.trim();
  const bio = document.getElementById('edit-bio').value.trim();
  const address = document.getElementById('edit-address').value.trim();
  const lat = document.getElementById('edit-lat').value;
  const lng = document.getElementById('edit-lng').value;
  
  if (!fullName) { toast.error('Error', 'Nama lengkap wajib diisi'); return; }
  
  const btn = document.getElementById('save-edit-btn');
  const ogText = btn.innerHTML;
  btn.innerHTML = 'Menyimpan...';
  btn.disabled = true;
  
  try {
    const payload = { fullName, bio, address };
    if (lat && lng) {
      payload.lat = parseFloat(lat);
      payload.lng = parseFloat(lng);
    }
    await api.users.updateMe(payload);
    toast.success('Berhasil', 'Profil berhasil diperbarui!');
    closeEditProfile();
    init(); // reload data
  } catch(e) {
    toast.error('Gagal', e.message);
  } finally {
    btn.innerHTML = ogText;
    btn.disabled = false;
  }
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
            <button class="modal__close" id="btn-close-map-modal"><i data-lucide="x" style="width:20px;height:20px"></i></button>
          </div>
          <div class="modal__body" style="padding: 0;">
            <div id="leaflet-map" style="height: 60vh; width: 100%; min-height: 300px; z-index: 1;"></div>
            <div style="padding: 16px; background: white; z-index: 2; position: relative; border-top: 1px solid var(--color-neutral-200);">
              <p id="map-address-preview" style="margin-bottom: 12px; font-weight: 500; font-size: 14px; color: var(--color-neutral-700);">Memuat lokasi...</p>
              <button class="btn btn-primary btn-pill" id="btn-confirm-map-loc" style="width: 100%;">Konfirmasi Lokasi</button>
            </div>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(div);
    lucide.createIcons();

    document.getElementById('btn-close-map-modal').addEventListener('click', closeMapModal);
    document.getElementById('btn-confirm-map-loc').addEventListener('click', confirmMapLocation);
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
    
    mapMarker = L.marker([currentSelectedLat, currentSelectedLng], {draggable: true}).addTo(mapInstance);
    
    mapMarker.on('dragend', function(e) {
      const position = mapMarker.getLatLng();
      updateMapLocation(position.lat, position.lng);
    });

    mapInstance.on('click', function(e) {
      updateMapLocation(e.latlng.lat, e.latlng.lng);
    });
    
    const savedLat = parseFloat(document.getElementById('edit-lat').value);
    const savedLng = parseFloat(document.getElementById('edit-lng').value);
    
    if (!isNaN(savedLat) && !isNaN(savedLng)) {
      updateMapLocation(savedLat, savedLng, true);
    } else {
      mapInstance.locate({setView: true, maxZoom: 16});
      mapInstance.on('locationfound', function(e) {
        updateMapLocation(e.latlng.lat, e.latlng.lng);
      });
      mapInstance.on('locationerror', function(e) {
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
  if(preview) preview.textContent = "Mencari alamat...";
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`, {
      headers: {
        'Accept-Language': 'id'
      }
    });
    const data = await res.json();
    if (data && data.display_name) {
      currentAddressStr = data.display_name;
      if(preview) preview.textContent = currentAddressStr;
    } else {
      if(preview) preview.textContent = "Alamat tidak ditemukan.";
    }
  } catch(e) {
    console.error(e);
    if(preview) preview.textContent = "Gagal memuat alamat.";
  }
}

function confirmMapLocation() {
  document.getElementById('edit-lat').value = currentSelectedLat;
  document.getElementById('edit-lng').value = currentSelectedLng;
  document.getElementById('edit-address').value = currentAddressStr;
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
          document.getElementById('edit-address').value = data.display_name;
          toast.success('Berhasil', 'Lokasi ditemukan!');
        }
      } catch(e) {
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

document.addEventListener('DOMContentLoaded', () => {
  init();

  // Profile tabs delegation
  document.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    
    // We only want to handle #profile-tabs clicks
    if (!tab.closest('#profile-tabs')) return;

    document.querySelectorAll('#profile-tabs .tab-bar__item').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');

    const tabContent = document.getElementById('tab-content');
    if (tabContent) {
      if (tab.dataset.tab === 'items') {
        const myItemsHTML = myItems.length ? `
          <div class="grid grid-cols-3 grid-gap-6">${myItems.map(item => {
            const cat = getCategoryInfo(item.category);
            let images = [];
            images = Array.isArray(item.images) ? item.images : (() => { try { return JSON.parse(item.images || '[]'); } catch(e) { return []; } })();
            const imgHTML = images.length
              ? `<img src="${images[0]}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;" alt="${item.title}"/>`
              : `<div class="item-card__placeholder"><span>${cat.emoji}</span></div>`;

            return `<div class="item-card" style="cursor:default">
              <div class="item-card__image-wrap">
                ${imgHTML}
                <div class="item-card__availability"><span class="badge ${item.isAvailable?'badge-available':'badge-unavailable'}">${item.isAvailable?'Tersedia':'Dipinjam'}</span></div>
              </div>
              <div class="item-card__body">
                <div class="item-card__title">${item.title}</div>
                <div class="item-card__location">📍 ${item.neighborhood}</div>
                <div class="item-card__footer">
                  <span class="item-card__deposit ${item.depositAmount===0?'item-card__deposit--free':''}">${item.depositAmount===0?'Gratis':formatIDR(item.depositAmount)}</span>
                </div>
              </div>
            </div>`;
          }).join('')}</div>` : `<div class="empty-state"><div class="empty-state__icon">📦</div><div class="empty-state__title">Belum ada barang</div></div>`;
        tabContent.innerHTML = myItemsHTML;
      } else {
        const badgesHTML = `
          <div class="grid grid-cols-4 grid-gap-4">
            ${[
              {icon:'🤝', name:'First Lend', desc:'Dipinjamkan pertama kali', earned:true},
              {icon:'⭐', name:'5-Star Borrower', desc:'Dapat 5 bintang 3x berturut-turut', earned:true},
              {icon:'🚀', name:'Trust Rocket', desc:'Trust score mencapai 80+', earned:true},
              {icon:'🏆', name:'Community Hero', desc:'50+ pinjaman berhasil', earned:false},
              {icon:'💎', name:'Verified Member', desc:'Trust score 90+', earned:false},
              {icon:'🌍', name:'Eco Champion', desc:'100 pinjaman — hemat 10kg CO₂', earned:false},
            ].map(b => `
              <div class="card" style="${b.earned?'':'opacity:0.45;filter:grayscale(1)'}">
                <div class="card__body" style="text-align:center;padding:var(--space-5)">
                  <div style="font-size:2rem;margin-bottom:var(--space-2)">${b.icon}</div>
                  <div style="font-weight:700;font-size:var(--text-body-sm-size);margin-bottom:4px">${b.name}</div>
                  <div style="font-size:var(--text-body-xs-size);color:var(--color-neutral-400)">${b.desc}</div>
                  ${b.earned ? '<div style="margin-top:var(--space-2)"><span class="badge badge-approved">Diraih!</span></div>' : ''}
                </div>
              </div>`).join('')}
          </div>`;
        tabContent.innerHTML = badgesHTML;
      }
    }
    lucide.createIcons();
  });
});
