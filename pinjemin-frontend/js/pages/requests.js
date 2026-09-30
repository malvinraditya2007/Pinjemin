import { renderAppShell } from '../layout.js';
import { requireLogin } from '../auth.js';
import api from '../api.js';
import { formatDateRange, formatRelativeTime, getStatusBadge, getCategoryInfo, getInitials } from '../utils.js';
import toast from '../toast.js';

requireLogin();
renderAppShell('requests');

let requests = [];
let activeFilter = '';

async function loadRequests() {
  try {
    let allRequests = await api.requests.getSent();
    // Hilangkan dari page permintaanku jika sudah diberi rating
    requests = allRequests.filter(r => !r.review);
    render();
  } catch (e) {
    console.error('Failed to load requests', e);
  }
}

function render() {
  const list = activeFilter ? requests.filter(r => r.status === activeFilter) : requests;
  const el = document.getElementById('requests-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📭</div><div class="empty-state__title">Belum ada permintaan</div><div class="empty-state__text">Mulai dengan mencari barang dan mengajukan pinjaman</div><a href="discover.html" class="btn btn-primary btn-md btn-pill" style="margin-top:var(--space-4)">Temukan Barang</a></div>`;
    return;
  }
  el.innerHTML = list.map(req => {
    const status = getStatusBadge(req.status);
    const cat = getCategoryInfo(req.item.category);
    const ownerInitials = getInitials(req.lender.fullName);
    return `
    <div class="request-card request-card--${req.status.toLowerCase()}" style="margin-bottom:var(--space-4)">
      <div class="request-card__avatar-wrap" style="flex-direction:row; justify-content:flex-start; margin-bottom:var(--space-2)">
        <div class="avatar avatar--md">
          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-600));color:white;font-weight:700">${ownerInitials}</div>
        </div>
        <div style="font-weight:600; font-size:1rem; color:var(--color-neutral-800)">${req.lender.fullName}</div>
      </div>
      <div class="request-card__content" style="flex:1">
        <div class="request-card__headline">
          Meminjam <strong>${req.item.title}</strong> dari <strong>${req.lender.fullName}</strong>
        </div>
        <div class="request-card__dates">
          📅 ${formatDateRange(req.startDate, req.endDate)}
          &nbsp;·&nbsp; Diajukan ${formatRelativeTime(req.createdAt)}
        </div>
        <div class="request-card__purpose">"${req.purpose}"</div>
        <a href="item-detail.html?id=${req.item.id}" class="request-card__item-thumb">
          <div style="width:44px;height:44px;border-radius:var(--radius-md);background:var(--color-primary-100);display:flex;align-items:center;justify-content:center;font-size:1.5rem">${cat.emoji}</div>
          <span class="request-card__item-name">${req.item.title}</span>
        </a>
      </div>
      <div class="request-card__actions">
        <span class="badge ${status.class}">${status.label}</span>
        ${req.status === 'PENDING' ? `<button class="btn btn-danger-outline btn-sm action-cancel-req" data-id="${req.id}">Batalkan</button>` : ''}
        ${req.status === 'RETURNED' ? `<a href="rate-review.html?req=${req.id}" class="btn btn-primary btn-sm btn-pill">⭐ Beri Rating</a>` : ''}
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tab-bar')?.addEventListener('click', e => {
    const tab = e.target.closest('[data-filter]');
    if (!tab) return;
    document.querySelectorAll('#tab-bar .tab-bar__item').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    activeFilter = tab.dataset.filter;
    render();
  });

  document.getElementById('requests-list')?.addEventListener('click', async e => {
    const cancelBtn = e.target.closest('.action-cancel-req');
    if (cancelBtn) {
      const id = cancelBtn.dataset.id;
      if (!confirm('Yakin ingin membatalkan permintaan ini?')) return;
      try {
        await api.requests.updateStatus(id, 'CANCELLED');
        toast.warning('Permintaan dibatalkan', 'Permintaan pinjam telah dibatalkan.'); 
        loadRequests();
      } catch (err) {
        toast.error('Gagal', err.message);
      }
    }
  });

  loadRequests();
});
