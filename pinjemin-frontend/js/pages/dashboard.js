import { renderAppShell } from '../layout.js';
import api from '../api.js';
import { formatRelativeTime, getCategoryInfo, getConditionLabel, formatIDR, getInitials } from '../utils.js';
import { requireLogin } from '../auth.js';

requireLogin();
renderAppShell('dashboard');

let user;
let itemsData = [];
let notifsData = [];

let userLat = null;
let userLng = null;
let distanceFilterLimit = null;

function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Always reveal elements, regardless of API success
function revealElements() {
  document.querySelectorAll('.reveal').forEach((el, index) => {
    setTimeout(() => el.classList.add('visible'), 100 * index);
  });
}

async function init() {
  // Reuse promises already started by layout.js (sidebar), fall back to fresh calls
  const appData = window._appData || {};

  // Fire all API calls in parallel for ~1s total load time
  const [userResult, itemsResult, notifsResult, topLendersResult, impactResult, sentReqsResult, rcvReqsResult] = await Promise.allSettled([
    appData.userPromise || api.users.getMe(),
    api.items.getAll(),
    appData.notifsPromise || api.notifications.getAll(),
    api.users.getTopLenders(),
    api.users.getImpact(),
    api.requests.getSent(),
    api.requests.getReceived()
  ]);

  // Handle user data
  if (userResult.status === 'fulfilled') {
    user = userResult.value;
    userLat = user.lat || -6.200000; // default Jakarta
    userLng = user.lng || 106.816666;
    document.getElementById('greeting-text').textContent = `Halo, ${user.fullName.split(' ')[0]}! 👋`;
    document.getElementById('greeting-loc').textContent = user.address || 'Indonesia';
    
    const scoreValEl = document.getElementById('trust-score-val');
    if (scoreValEl) scoreValEl.textContent = user.trustScore;
    
    const offset = 188 - (188 * user.trustScore / 100);
    if (document.getElementById('trust-ring-fill')) {
      document.getElementById('trust-ring-fill').style.strokeDashoffset = offset;
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        renderGrid(activeFilter);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${userLat}&lon=${userLng}`);
          const data = await res.json();
          if (data && data.display_name) {
            let addressName = data.display_name.split(',').slice(0, 2).join(',');
            if (data.address) {
               const neighborhood = data.address.neighbourhood || data.address.suburb || data.address.village;
               const city = data.address.city || data.address.town || data.address.county;
               if (neighborhood && city) addressName = `${neighborhood}, ${city}`;
               else if (city) addressName = city;
            }
            const locEl = document.getElementById('greeting-loc');
            if (locEl) locEl.innerHTML = addressName;
          }
        } catch(e) {
          console.error('Reverse geocoding failed', e);
        }
      }, () => {});
    }
  } else {
    console.warn('Could not load user data', userResult.reason);
    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) greetingEl.textContent = `Halo! 👋`;
  }

  // Handle items data
  if (itemsResult.status === 'fulfilled') {
    itemsData = itemsResult.value;
    renderGrid('');
  } else {
    console.warn('Could not load items', itemsResult.reason);
    const gridEl = document.getElementById('items-grid');
    if (gridEl) {
      gridEl.innerHTML = `
        <div style="grid-column:1/-1;text-align:center;padding:var(--space-10) var(--space-4);color:var(--color-neutral-400)">
          <div style="font-size:2.5rem;margin-bottom:var(--space-3)">📦</div>
          <div style="font-size:var(--text-body-md-size);font-weight:600;color:var(--color-neutral-600);margin-bottom:var(--space-2)">Tidak dapat memuat barang</div>
          <div style="font-size:var(--text-body-sm-size)">Periksa koneksi backend server kamu.</div>
        </div>`;
    }
  }

  // Handle notifications data
  if (notifsResult.status === 'fulfilled') {
    notifsData = notifsResult.value;
    renderActivityFeed();
  } else {
    console.warn('Could not load notifications', notifsResult.reason);
    const feedEl = document.getElementById('activity-feed');
    if (feedEl) feedEl.innerHTML = `<div style="color:var(--color-neutral-500);font-size:var(--text-body-sm-size);padding:var(--space-2) 0">Belum ada aktivitas.</div>`;
  }

  // Handle top lenders
  if (topLendersResult.status === 'fulfilled') {
    const lenders = topLendersResult.value;
    const topLendersEl = document.getElementById('top-lenders-container');
    if (topLendersEl) {
      if (lenders.length > 0) {
        topLendersEl.innerHTML = lenders.map((l, i) => `
          <div class="leaderboard-item">
            <div class="leaderboard-item__rank leaderboard-item__rank--${i + 1}">${i + 1}</div>
            <div class="leaderboard-item__info">
              <div class="leaderboard-item__name">${l.fullName}</div>
              <div class="leaderboard-item__sub">${l.totalLends} item dipinjamkan</div>
            </div>
            <div class="leaderboard-item__score">${l.trustScore}</div>
          </div>
        `).join('');
      } else {
        topLendersEl.innerHTML = '<div style="text-align:center;padding:var(--space-4);color:var(--color-neutral-500);font-size:var(--text-body-sm-size)">Belum ada peminjam</div>';
      }
    }
  }

  // Handle impact data
  if (impactResult.status === 'fulfilled') {
    const impact = impactResult.value;
    const impactEl = document.getElementById('impact-container');
    if (impactEl) {
      impactEl.innerHTML = `
        <div>♻️ CO₂ dihemat: <strong>${impact.co2SavedKg} kg</strong></div>
        <div style="margin-top:4px">💰 Uang dihemat: <strong>${formatIDR(impact.moneySavedIdr)}</strong></div>
        <div style="margin-top:4px">🤝 Pinjaman selesai: <strong>${impact.completedBorrows}</strong></div>
      `;
    }
  }

  if (sentReqsResult.status === 'fulfilled') {
    const activeCount = sentReqsResult.value.filter(r => r.status === 'APPROVED').length;
    const el = document.getElementById('active-borrows-count');
    if (el) el.textContent = activeCount;
  }

  if (rcvReqsResult.status === 'fulfilled') {
    const pendingCount = rcvReqsResult.value.filter(r => r.status === 'PENDING').length;
    const el = document.getElementById('approval-count');
    if (el) el.textContent = pendingCount;
  }

  // Always animate elements into view
  revealElements();
}

function renderItemCard(item) {
  const cat = getCategoryInfo(item.category);
  const initials = getInitials(item.owner.fullName);
  let images = [];
  images = Array.isArray(item.images) ? item.images : (() => { try { return JSON.parse(item.images || '[]'); } catch (e) { return []; } })();

  const imageHtml = images.length > 0
    ? `<img src="${images[0]}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;" alt="${item.title}">`
    : `<div class="item-card__placeholder">
        <span>${cat.emoji}</span>
        <span class="item-card__placeholder-text">${cat.label}</span>
      </div>`;

  return `
<a href="item-detail.html?id=${item.id}" class="item-card">
  <div class="item-card__image-wrap">
    ${imageHtml}
    <div class="item-card__availability">
      <span class="badge ${item.isAvailable ? 'badge-available' : 'badge-unavailable'}">
        ${item.isAvailable ? 'Tersedia' : 'Dipinjam'}
      </span>
    </div>
    <div class="item-card__category">
      <span class="badge badge-available" style="background:var(--color-neutral-100);color:var(--color-neutral-600)">${cat.emoji} ${cat.label}</span>
    </div>
    <div class="item-card__overlay">
      <span class="item-card__overlay-btn">Lihat Detail →</span>
    </div>
  </div>
  <div class="item-card__body">
    <div class="item-card__title">${item.title}</div>
    <div class="item-card__condition">${getConditionLabel(item.condition)}</div>
    <div class="item-card__owner">
      <div class="item-card__owner-avatar">
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-600));color:white;font-size:0.55rem;font-weight:700">${initials}</div>
      </div>
      <span class="item-card__owner-name">${item.owner.fullName}</span>
    </div>
    <div class="item-card__location">📍 ${item.neighborhood}${item.distance !== null ? ` • ${item.distance.toFixed(1)} km` : ''}</div>
    <div class="item-card__footer">
      <span class="item-card__deposit ${item.depositAmount === 0 ? 'item-card__deposit--free' : ''}">
        ${item.depositAmount === 0 ? '✓ Gratis dipinjam' : `Deposit: ${formatIDR(item.depositAmount)}`}
      </span>
      <span class="btn btn-accent btn-sm btn-pill">Pinjam →</span>
    </div>
  </div>
</a>`;
}

let activeFilter = '';
function renderGrid(filter) {
  let filtered = itemsData.filter(i => i.isAvailable && (!user || i.owner.id !== user.id) && (!filter || i.category === filter));

  // Calculate distances for each item
  filtered.forEach(i => {
    i.distance = calculateDistance(userLat, userLng, i.lat, i.lng);
  });

  // Filter by distance
  if (distanceFilterLimit !== null) {
    filtered = filtered.filter(i => i.distance !== null && i.distance <= distanceFilterLimit);
  }

  // Sort by distance (closest first)
  filtered.sort((a, b) => {
    if (a.distance === null) return 1;
    if (b.distance === null) return -1;
    return a.distance - b.distance;
  });

  const gridEl = document.getElementById('items-grid');
  if (gridEl) {
    gridEl.innerHTML = filtered.length
      ? filtered.map(renderItemCard).join('')
      : `<div style="grid-column:1/-1;text-align:center;padding:var(--space-10) var(--space-4);color:var(--color-neutral-400)">Belum ada barang yang cocok di area ini.</div>`;
  }

  lucide.createIcons();
}

function renderActivityFeed() {
  const icons = {
    BORROW_REQUEST_RECEIVED: { icon: '📦', iconClass: 'icon--blue' },
    BORROW_REQUEST_APPROVED: { icon: '✅', iconClass: 'icon--green' },
    TRUST_SCORE_CHANGED: { icon: '⭐', iconClass: 'icon--orange' }
  };

  const activities = notifsData.slice(0, 3).map(n => {
    const ic = icons[n.type] || { icon: '🔔', iconClass: 'icon--blue' };
    return `
  <div class="activity-item">
    <div class="activity-item__icon activity-item__${ic.iconClass}">${ic.icon}</div>
    <div class="activity-item__content">
      <div class="activity-item__text">${n.body}</div>
      <div class="activity-item__time">${formatRelativeTime(n.createdAt)}</div>
    </div>
  </div>`;
  });

  const feedEl = document.getElementById('activity-feed');
  if (feedEl) {
    if (activities.length > 0) {
      feedEl.innerHTML = activities.join('');
    } else {
      feedEl.innerHTML = `<div style="color:var(--color-neutral-500);font-size:var(--text-body-sm-size);padding:var(--space-2) 0">Belum ada aktivitas.</div>`;
    }
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('cat-filters')?.addEventListener('click', e => {
    const btn = e.target.closest('[data-cat]');
    if (!btn) return;
    document.querySelectorAll('#cat-filters .chip').forEach(c => { c.className = 'chip chip--default'; });
    btn.className = 'chip chip--active';
    activeFilter = btn.dataset.cat;
    renderGrid(activeFilter);
  });

  document.getElementById('distance-filter')?.addEventListener('change', e => {
    const val = e.target.value;
    distanceFilterLimit = val ? parseFloat(val) : null;
    renderGrid(activeFilter);
  });
});
