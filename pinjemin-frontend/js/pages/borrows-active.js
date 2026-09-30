import { renderAppShell } from '../layout.js';
import { requireLogin } from '../auth.js';
import api from '../api.js';
import { formatDateRange, getCategoryInfo, getInitials } from '../utils.js';
import toast from '../toast.js';

requireLogin();
renderAppShell('borrows-active');

let borrowing = [];
let lending = [];
let currentTab = 'borrowing';

async function loadData() {
  try {
    const [sent, received] = await Promise.all([
      api.requests.getSent(),
      api.requests.getReceived()
    ]);
    
    // Show APPROVED requests (active borrows)
    borrowing = sent.filter(r => r.status === 'APPROVED');
    lending = received.filter(r => r.status === 'APPROVED');
    
    render();
  } catch(e) {
    console.error('Failed to load active borrows', e);
  }
}

function render() {
  const el = document.getElementById('active-list');
  const list = currentTab === 'borrowing' ? borrowing : lending;
  
  if (!list.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state__icon">📦</div>
        <div class="empty-state__title">Tidak ada aktivitas</div>
        <div class="empty-state__text">${currentTab === 'borrowing' ? 'Kamu tidak sedang meminjam barang apa pun.' : 'Belum ada barangmu yang sedang dipinjam.'}</div>
      </div>`;
    return;
  }
  
  el.innerHTML = list.map(req => {
    const isBorrowing = currentTab === 'borrowing';
    const otherUser = isBorrowing ? req.lender : req.borrower;
    const cat = getCategoryInfo(req.item.category);
    const initials = getInitials(otherUser.fullName);
    
    return `
    <div class="request-card request-card--active" style="margin-bottom:var(--space-4)">
      <div class="request-card__avatar-wrap">
        <div class="avatar avatar--md">
          <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-600));color:white;font-weight:700">${initials}</div>
        </div>
      </div>
      <div class="request-card__content" style="flex:1">
        <div class="request-card__headline">
          ${isBorrowing ? 'Meminjam' : 'Dipinjam'} <strong>${req.item.title}</strong> ${isBorrowing ? 'dari' : 'oleh'} <strong>${otherUser.fullName}</strong>
        </div>
        <div class="request-card__dates">
          📅 ${formatDateRange(req.startDate, req.endDate)}
        </div>
        <div class="request-card__purpose" style="margin-top:var(--space-2)">"${req.purpose}"</div>
        <a href="item-detail.html?id=${req.item.id}" class="request-card__item-thumb" style="margin-top:var(--space-3)">
          <div style="width:44px;height:44px;border-radius:var(--radius-md);background:var(--color-primary-100);display:flex;align-items:center;justify-content:center;font-size:1.5rem">${cat.emoji}</div>
          <span class="request-card__item-name">${req.item.title}</span>
        </a>
      </div>
      <div class="request-card__actions">
        <span class="badge badge-active">🟢 Sedang Dipinjam</span>
        ${isBorrowing ? `
          <button class="btn btn-primary btn-sm btn-pill btn-return" data-id="${req.id}" style="margin-top:var(--space-2)">
            Kembalikan Barang
          </button>
        ` : `
          <a href="mailto:?subject=Pinjemin: ${req.item.title}" class="btn btn-outline-neutral btn-sm" style="margin-top:var(--space-2)">
            Hubungi Peminjam
          </a>
        `}
      </div>
    </div>`;
  }).join('');
  lucide.createIcons();
}

async function returnItem(id) {
  if (!confirm('Apakah kamu sudah mengembalikan barang ini ke pemiliknya?')) return;
  try {
    await api.requests.updateStatus(id, 'RETURNED');
    toast.success('Dikembalikan!', 'Terima kasih telah mengembalikan barang tepat waktu.');
    
    // Prompt for rating
    setTimeout(() => {
      window.location.href = `rate-review.html?req=${id}`;
    }, 1500);
  } catch(e) {
    toast.error('Gagal', e.message);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('tab-bar')?.addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (!tab) return;
    document.querySelectorAll('#tab-bar .tab-bar__item').forEach(t => t.classList.remove('is-active'));
    tab.classList.add('is-active');
    currentTab = tab.dataset.tab;
    render();
  });

  document.getElementById('active-list')?.addEventListener('click', e => {
    const btn = e.target.closest('.btn-return');
    if (btn) {
      returnItem(btn.dataset.id);
    }
  });

  loadData();
});
