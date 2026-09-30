import { renderAppShell } from '../layout.js';
import { requireLogin } from '../auth.js';
import api from '../api.js';
import { formatDateRange, formatRelativeTime, getStatusBadge, getCategoryInfo, getTrustLevel, getInitials } from '../utils.js';
import toast from '../toast.js';

requireLogin();
renderAppShell('approvals');

let approvals = [];
let activeFilter = '';

async function loadApprovals() {
  try {
    approvals = await api.requests.getReceived();
    render();
  } catch (e) {
    console.error('Failed to load approvals', e);
  }
}

function render() {
  const list = activeFilter ? approvals.filter(r => r.status === activeFilter) : approvals;
  const el = document.getElementById('approvals-list');
  if (!list.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📬</div><div class="empty-state__title">Tidak ada permintaan</div><div class="empty-state__text">Belum ada yang meminta meminjam barangmu</div></div>`;
    return;
  }
  el.innerHTML = list.map(req => {
    const status = getStatusBadge(req.status);
    const trust = getTrustLevel(req.borrower.trustScore);
    const cat = getCategoryInfo(req.item.category);
    const initials = getInitials(req.borrower.fullName);
    return `
<div class="card" style="margin-bottom:var(--space-4)" id="card-${req.id}">
  <div class="card__body">
    <div style="display:flex;gap:var(--space-4)">
      <div class="avatar avatar--lg">
        <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-600));color:white;font-weight:700;font-size:1.2rem">${initials}</div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:var(--space-3);flex-wrap:wrap;margin-bottom:var(--space-2)">
          <strong>${req.borrower.fullName}</strong>
          <span class="badge badge-trust ${trust.class}">${trust.label} · ${req.borrower.trustScore}</span>
          <span class="badge ${status.class}">${status.label}</span>
        </div>
        <p style="font-size:var(--text-body-sm-size);color:var(--color-neutral-700);margin-bottom:var(--space-2)">
          Ingin meminjam <strong>${req.item.title}</strong>
        </p>
        <div style="font-size:var(--text-body-xs-size);color:var(--color-neutral-500);margin-bottom:var(--space-3)">
          📅 ${formatDateRange(req.startDate, req.endDate)} &nbsp;·&nbsp; Diajukan ${formatRelativeTime(req.createdAt)}
        </div>
        <div class="info-card" style="margin-bottom:var(--space-4)">
          <div class="info-card__icon">💬</div>
          <div class="info-card__content">
            <div class="info-card__title">Tujuan</div>
            <div class="info-card__text">${req.purpose}</div>
          </div>
        </div>
        ${req.message ? `<div style="font-size:var(--text-body-sm-size);color:var(--color-neutral-500);font-style:italic;margin-bottom:var(--space-4)">"${req.message}"</div>` : ''}

        <a href="item-detail.html?id=${req.item.id}" class="request-card__item-thumb" style="text-decoration:none">
          <div style="width:44px;height:44px;border-radius:var(--radius-md);background:var(--color-primary-100);display:flex;align-items:center;justify-content:center;font-size:1.5rem">${cat.emoji}</div>
          <span class="request-card__item-name">${req.item.title}</span>
        </a>
      </div>
      <div style="display:flex;flex-direction:column;gap:var(--space-2);align-items:flex-end;flex-shrink:0">
        ${req.status === 'PENDING' ? `
          <button class="btn btn-primary btn-md btn-pill btn-approve" data-id="${req.id}">
            <i data-lucide="check" style="width:16px;height:16px"></i> Setujui
          </button>
          <button class="btn btn-danger-outline btn-md btn-pill btn-toggle-reject" data-id="${req.id}">
            <i data-lucide="x" style="width:16px;height:16px"></i> Tolak
          </button>` : ''}
      </div>
    </div>

    <!-- Reject Form (hidden) -->
    <div class="request-card__reject-form" id="reject-form-${req.id}">
      <div class="form-group">
        <label class="form-label">Alasan Penolakan</label>
        <select class="form-select" id="reject-reason-${req.id}">
          <option value="">Pilih alasan...</option>
          <option value="dates">Tanggal tidak tersedia</option>
          <option value="profile">Profil belum lengkap</option>
          <option value="trust">Trust score terlalu rendah</option>
          <option value="other">Lainnya</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Pesan (opsional)</label>
        <textarea class="form-textarea" id="reject-msg-${req.id}" rows="2" placeholder="Tambahkan penjelasan..."></textarea>
      </div>
      <div style="display:flex;gap:var(--space-3)">
        <button class="btn btn-ghost btn-md btn-toggle-reject" data-id="${req.id}">Batal</button>
        <button class="btn btn-danger btn-md btn-pill btn-submit-reject" data-id="${req.id}">Kirim Penolakan</button>
      </div>
    </div>
  </div>
</div>`;
  }).join('');
  lucide.createIcons();
}

async function approveReq(id) {
  try {
    await api.requests.updateStatus(id, 'APPROVED');
    toast.success('Permintaan disetujui! ✅', 'Peminjam akan mendapat notifikasi.');
    loadApprovals();
  } catch (e) {
    toast.error('Gagal', e.message);
  }
}

function toggleReject(id) {
  const form = document.getElementById(`reject-form-${id}`);
  if (form) form.classList.toggle('is-open');
}

async function rejectReq(id) {
  const reasonEl = document.getElementById(`reject-reason-${id}`);
  const reason = reasonEl ? reasonEl.value : '';
  if (!reason) { toast.error('Pilih alasan', 'Silakan pilih alasan penolakan.'); return; }

  try {
    await api.requests.updateStatus(id, 'REJECTED', reason);
    toast.warning('Permintaan ditolak', 'Peminjam akan mendapat notifikasi.');
    loadApprovals();
  } catch (e) {
    toast.error('Gagal', e.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tab-bar')?.addEventListener('click', e => {
    const tab = e.target.closest('[data-filter]');
    if (!tab) return;
    document.querySelectorAll('#tab-bar .tab-bar__item').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    activeFilter = tab.dataset.filter;
    render();
  });

  document.getElementById('approvals-list')?.addEventListener('click', e => {
    const btnApprove = e.target.closest('.btn-approve');
    if (btnApprove) {
      approveReq(btnApprove.dataset.id);
      return;
    }
    
    const btnToggleReject = e.target.closest('.btn-toggle-reject');
    if (btnToggleReject) {
      toggleReject(btnToggleReject.dataset.id);
      return;
    }
    
    const btnSubmitReject = e.target.closest('.btn-submit-reject');
    if (btnSubmitReject) {
      rejectReq(btnSubmitReject.dataset.id);
      return;
    }
  });

  loadApprovals();
});
