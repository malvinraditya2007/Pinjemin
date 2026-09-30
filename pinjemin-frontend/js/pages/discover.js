import { renderAppShell } from '../layout.js';
import { requireLogin } from '../auth.js';
import api from '../api.js';
import { getCategoryInfo, getConditionLabel, formatIDR, getInitials } from '../utils.js';

requireLogin();
renderAppShell('discover');

// Pre-select from URL params
const params = new URLSearchParams(location.search);
const initCat = params.get('category') || '';
if (initCat) document.getElementById('cat-select').value = initCat;

let MOCK_ITEMS = [];
let currentUser = null;

async function loadItems() {
  try {
    const appData = window._appData || {};
    currentUser = await (appData.userPromise || api.users.getMe());
  } catch(e) {
    console.error('Failed to load user', e);
  }
  
  try {
    MOCK_ITEMS = await api.items.getAll();
    render();
  } catch(e) {
    console.error('Failed to load items', e);
  }
}

function getFiltered() {
  const q    = document.getElementById('search-input').value.toLowerCase();
  const cat  = document.getElementById('cat-select').value;
  const cond = document.getElementById('cond-select').value;
  const avail= document.getElementById('avail-select').value;
  const loc  = document.getElementById('loc-input').value.toLowerCase();
  const sort = document.getElementById('sort-select').value;
  let items = MOCK_ITEMS.filter(i => i.isAvailable && (!currentUser || i.owner.id !== currentUser.id));
  if (q)     items = items.filter(i => i.title.toLowerCase().includes(q) || i.description.toLowerCase().includes(q));
  if (cat)   items = items.filter(i => i.category === cat);
  if (cond)  items = items.filter(i => i.condition === cond);
  if (avail === 'available') items = items.filter(i => i.isAvailable);
  if (loc)   items = items.filter(i => (i.neighborhood || '').toLowerCase().includes(loc));
  if (sort === 'views') items.sort((a,b) => b.viewCount - a.viewCount);
  return items;
}

function render() {
  const items = getFiltered();
  document.getElementById('results-count').innerHTML = `Menampilkan <strong>${items.length}</strong> barang`;
  document.getElementById('discover-grid').innerHTML = items.length ? items.map(item => {
    const cat = getCategoryInfo(item.category);
    const initials = getInitials(item.owner.fullName);
    let images = [];
    images = Array.isArray(item.images) ? item.images : (() => { try { return JSON.parse(item.images || '[]'); } catch(e) { return []; } })();
    const imgHTML = images.length
      ? `<img src="${images[0]}" style="width:100%;height:100%;object-fit:cover" alt="${item.title}"/>`
      : `<div class="item-card__placeholder"><span>${cat.emoji}</span></div>`;
    return `
      <a href="item-detail.html?id=${item.id}" class="item-card">
        <div class="item-card__image-wrap">
          ${imgHTML}
          <div class="item-card__availability">
            <span class="badge ${item.isAvailable ? 'badge-available' : 'badge-unavailable'}">${item.isAvailable ? 'Tersedia' : 'Dipinjam'}</span>
          </div>
          <div class="item-card__overlay"><span class="item-card__overlay-btn">Lihat Detail →</span></div>
        </div>
        <div class="item-card__body">
          <div class="item-card__title">${item.title}</div>
          <div class="item-card__condition">${getConditionLabel(item.condition)} · 👁 ${item.viewCount}</div>
          <div class="item-card__owner">
            <div class="item-card__owner-avatar">
              <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-600));color:white;font-size:0.55rem;font-weight:700">${initials}</div>
            </div>
            <span class="item-card__owner-name">${item.owner.fullName}</span>
          </div>
          <div class="item-card__location">📍 ${item.neighborhood}</div>
          <div class="item-card__footer">
            <span class="item-card__deposit ${item.depositAmount === 0 ? 'item-card__deposit--free' : ''}">${item.depositAmount === 0 ? '✓ Gratis' : `Deposit: ${formatIDR(item.depositAmount)}`}</span>
            <span class="btn btn-accent btn-sm btn-pill">Pinjam →</span>
          </div>
        </div>
      </a>`;
  }).join('') : `<div class="empty-state" style="grid-column:1/-1"><div class="empty-state__icon">🔍</div><div class="empty-state__title">Tidak ada barang ditemukan</div><div class="empty-state__text">Coba ubah filter atau kata kunci pencarianmu</div></div>`;
  lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', () => {
  ['search-input','cat-select','cond-select','avail-select','sort-select'].forEach(id => {
    document.getElementById(id)?.addEventListener(id === 'search-input' ? 'input' : 'change', render);
  });
  document.getElementById('loc-input')?.addEventListener('input', render);
  document.getElementById('reset-btn')?.addEventListener('click', () => {
    ['cat-select','cond-select','avail-select'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';
    const locInput = document.getElementById('loc-input');
    if (locInput) locInput.value = '';
    render();
  });
  
  render();
  loadItems();
});
