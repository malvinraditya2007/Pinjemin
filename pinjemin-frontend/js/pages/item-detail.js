import { renderAppShell } from '../layout.js';
import { requireLogin } from '../auth.js';
import api from '../api.js';
import { getCategoryInfo, getConditionLabel, formatIDR, getTrustLevel, getInitials } from '../utils.js';
import toast from '../toast.js';

requireLogin();
renderAppShell('discover');

let item = null;

async function init() {
  const params = new URLSearchParams(location.search);
  const id = params.get('id') || 'item-001'; // Default fallback for local testing
  
  try {
    item = await api.items.getById(id);
    const cat = getCategoryInfo(item.category);
    const trust = getTrustLevel(item.owner.trustScore);
    const initials = getInitials(item.owner.fullName);
    
    document.title = `${item.title} — Pinjemin`;
    document.getElementById('breadcrumb').innerHTML = `
      <a href="discover.html" style="color:var(--color-neutral-400);text-decoration:none">Temukan</a>
      <i data-lucide="chevron-right" style="width:12px;height:12px"></i>
      <span>${cat.label}</span>
      <i data-lucide="chevron-right" style="width:12px;height:12px"></i>
      <span style="color:var(--color-neutral-700)">${item.title}</span>`;
      
    let images = [];
    images = Array.isArray(item.images) ? item.images : (() => { try { return JSON.parse(item.images || '[]'); } catch(e) { return []; } })();
    const mainImgHTML = images.length
      ? `<img src="${images[0]}" id="gallery-main-img" style="width:100%;height:100%;object-fit:cover" alt="${item.title}"/>`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-50),var(--color-primary-100));font-size:6rem">${cat.emoji}</div>`;
    const thumbsHTML = images.length > 1
      ? `<div style="display:flex;gap:var(--space-2);margin-top:var(--space-3);flex-wrap:wrap" id="gallery-thumbs">${images.map((src, i) =>
          `<img src="${src}" class="thumb-img" data-src="${src}" style="width:60px;height:60px;object-fit:cover;border-radius:var(--radius-md);cursor:pointer;border:2px solid ${i===0?'var(--color-primary-400)':'var(--color-neutral-200)'}"/>`
        ).join('')}</div>`
      : '';

    document.getElementById('page-body').innerHTML = `
    <div class="item-detail-layout">
      <!-- Gallery -->
      <div>
        <div class="item-gallery__main">
          ${mainImgHTML}
        </div>
        ${thumbsHTML}
      </div>

      <!-- Info -->
      <div>
        <div class="item-info__breadcrumb">${cat.emoji} ${cat.label}</div>
        <h1 class="text-display-md" style="margin-bottom:var(--space-3)">${item.title}</h1>
        <div style="display:flex;align-items:center;gap:var(--space-3);margin-bottom:var(--space-4)">
          <span class="badge ${item.isAvailable ? 'badge-available' : 'badge-unavailable'}" style="font-size:0.9rem;padding:0.3em 0.9em">
            ${item.isAvailable ? '✓ Tersedia' : '⏸ Sedang Dipinjam'}
          </span>
          <span style="font-size:var(--text-body-sm-size);color:var(--color-neutral-400)">👁 ${item.viewCount} dilihat</span>
        </div>

        <div style="font-size:var(--text-body-sm-size);color:var(--color-neutral-500);margin-bottom:var(--space-5)">
          Kondisi: <strong style="color:var(--color-neutral-700)">${getConditionLabel(item.condition)}</strong>
        </div>

        <!-- Owner Card -->
        <a href="profile.html?user=${item.owner.id}" class="item-owner-card">
          <div class="avatar avatar--lg avatar--bordered">
            <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-600));color:white;font-weight:700;font-size:1.2rem">${initials}</div>
          </div>
          <div class="item-owner-card__info">
            <div class="item-owner-card__name">${item.owner.fullName}</div>
            <div style="display:flex;align-items:center;gap:var(--space-2);margin-top:2px">
              <span class="badge badge-trust ${trust.class}">${trust.label}</span>
              <span style="font-size:var(--text-body-xs-size);color:var(--color-neutral-400)">Score: ${item.owner.trustScore}</span>
            </div>
            <div class="item-owner-card__meta">4.8★ · Member sejak ${new Date(item.owner.createdAt).getFullYear()}</div>
          </div>
          <i data-lucide="chevron-right" style="width:18px;height:18px;color:var(--color-neutral-400)"></i>
        </a>

        ${item.depositAmount > 0 ? `
        <div class="info-card" style="margin-bottom:var(--space-4)">
          <div class="info-card__icon">💰</div>
          <div class="info-card__content">
            <div class="info-card__title">Deposit: ${formatIDR(item.depositAmount)}</div>
            <div class="info-card__text">Deposit dikembalikan saat barang sudah dikembalikan dalam kondisi baik.</div>
          </div>
        </div>` : ''}

        ${item.usageGuidelines ? `
        <div class="usage-guidelines">
          <span style="font-size:1.1rem">⚠️</span>
          <div>
            <strong>Panduan Penggunaan:</strong><br/>
            ${item.usageGuidelines}
          </div>
        </div>` : ''}

        <button class="btn btn-accent btn-xl btn-full btn-pill" id="borrow-btn" ${!item.isAvailable ? 'disabled' : ''} style="margin-top:var(--space-5)">
          ${item.isAvailable ? '🤝 Ajukan Peminjaman' : '😔 Sedang Dipinjam'}
        </button>
      </div>
    </div>

    <!-- Description -->
    <div style="margin-top:var(--space-10);padding-top:var(--space-8);border-top:1px solid var(--color-neutral-200)">
      <h2 class="text-heading-xl" style="margin-bottom:var(--space-4)">Deskripsi</h2>
      <p style="color:var(--color-neutral-600);line-height:1.7">${item.description}</p>
      <div style="margin-top:var(--space-4);display:flex;gap:var(--space-2);flex-wrap:wrap">
        ${(Array.isArray(item.tags) ? item.tags : typeof item.tags === 'string' ? item.tags.split(',') : []).map(t => `<span class="tag-chip">#${t.trim()}</span>`).join('')}
      </div>
    </div>

    <!-- Similar items -->
    <div style="margin-top:var(--space-10)">
      <div class="section-header">
        <div class="section-header__title">Barang Serupa</div>
        <a href="discover.html?category=${item.category}" class="btn btn-outline btn-sm">Lihat Semua</a>
      </div>
      <div class="grid grid-cols-3 grid-gap-6" id="similar-grid"></div>
    </div>`;

    // Fetch similar items
    const allItems = await api.items.getAll({ category: item.category });
    const similar = allItems.filter(i => i.id !== item.id).slice(0, 3);
    
    document.getElementById('similar-grid').innerHTML = similar.map(si => {
      const sc = getCategoryInfo(si.category);
      const imgArr = Array.isArray(si.images) ? si.images : (() => { try { return JSON.parse(si.images || '[]'); } catch(e) { return []; } })();
      const imgHTML = imgArr.length
        ? `<img src="${imgArr[0]}" style="width:100%;height:100%;object-fit:cover;position:absolute;top:0;left:0;z-index:1;" alt="${si.title}"/>`
        : `<div class="item-card__placeholder"><span>${sc.emoji}</span></div>`;

      return `<a href="item-detail.html?id=${si.id}" class="item-card">
        <div class="item-card__image-wrap">${imgHTML}
          <div class="item-card__availability"><span class="badge ${si.isAvailable?'badge-available':'badge-unavailable'}">${si.isAvailable?'Tersedia':'Dipinjam'}</span></div>
        </div>
        <div class="item-card__body">
          <div class="item-card__title">${si.title}</div>
          <div class="item-card__location">📍 ${si.neighborhood}</div>
        </div>
      </a>`;
    }).join('');

    setupModal();
    lucide.createIcons();

    // Setup gallery thumbs listener
    const thumbsContainer = document.getElementById('gallery-thumbs');
    if (thumbsContainer) {
      thumbsContainer.addEventListener('click', e => {
        if (e.target.classList.contains('thumb-img')) {
          const src = e.target.dataset.src;
          const mainImg = document.getElementById('gallery-main-img');
          if (mainImg && src) {
            mainImg.src = src;
            // update border
            thumbsContainer.querySelectorAll('.thumb-img').forEach(img => img.style.border = '2px solid var(--color-neutral-200)');
            e.target.style.border = '2px solid var(--color-primary-400)';
          }
        }
      });
    }
    
  } catch(e) {
    document.getElementById('page-body').innerHTML = `<div class="empty-state"><div class="empty-state__icon">❌</div><div class="empty-state__title">Barang tidak ditemukan</div></div>`;
  }
}

function setupModal() {
  const modal = document.getElementById('borrow-modal');
  document.getElementById('borrow-btn')?.addEventListener('click', () => {
    modal.classList.add('is-open');
    document.getElementById('modal-item-name').textContent = item.title;
    if (item.depositAmount > 0) {
      document.getElementById('deposit-info').style.display = 'flex';
      document.getElementById('deposit-text').textContent = `Deposit ${formatIDR(item.depositAmount)} akan dikonfirmasi saat bertemu pemilik.`;
    }
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').value = today;
    document.getElementById('start-date').min = today;
    document.getElementById('end-date').min = today;
  });

  ['modal-close','modal-cancel'].forEach(id => {
    document.getElementById(id)?.addEventListener('click', () => modal.classList.remove('is-open'));
  });
  modal.addEventListener('click', e => { if (e.target === modal) modal.classList.remove('is-open'); });

  function updateDuration() {
    const s = document.getElementById('start-date').value;
    const e = document.getElementById('end-date').value;
    const el = document.getElementById('duration-info');
    if (s && e && e >= s) {
      const days = Math.ceil((new Date(e) - new Date(s)) / 86400000) + 1;
      el.textContent = `⏱ Durasi: ${days} hari`;
    } else { el.textContent = ''; }
  }
  ['start-date','end-date'].forEach(id => document.getElementById(id)?.addEventListener('change', updateDuration));

  document.getElementById('modal-submit')?.addEventListener('click', async () => {
    const purpose = document.getElementById('purpose').value;
    const message = document.getElementById('msg').value;
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    
    if (!purpose.trim()) { toast.error('Tujuan diperlukan', 'Mohon isi tujuan peminjaman.'); return; }
    if (!startDate || !endDate || endDate < startDate) { toast.error('Tanggal tidak valid', 'Pilih tanggal mulai dan selesai.'); return; }
    
    const btn = document.getElementById('modal-submit');
    const ogText = btn.innerHTML;
    btn.innerHTML = 'Mengirim...';
    btn.disabled = true;

    try {
      await api.requests.create({
        itemId: item.id,
        purpose,
        message,
        startDate,
        endDate
      });
      modal.classList.remove('is-open');
      toast.success('Permintaan terkirim! 🎉', 'Tunggu konfirmasi dari pemilik barang ya.');
      setTimeout(() => location.href = 'requests.html', 2000);
    } catch(e) {
      toast.error('Gagal mengajukan', e.message);
      btn.innerHTML = ogText;
      btn.disabled = false;
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  init();
});
