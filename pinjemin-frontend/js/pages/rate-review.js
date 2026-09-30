import { renderAppShell } from '../layout.js';
import { requireLogin } from '../auth.js';
import api from '../api.js';
import toast from '../toast.js';

requireLogin();
renderAppShell('requests');

let reqData = null;

async function init() {
  const reqId = new URLSearchParams(window.location.search).get('req');
  if (!reqId) {
    document.getElementById('dynamic-subtitle').innerHTML = '<span style="color:var(--color-danger-500)">Gagal memuat data (ID Permintaan tidak ditemukan)</span>';
    document.getElementById('submit-rating').disabled = true;
    return;
  }

  try {
    const sent = await api.requests.getSent();
    reqData = sent.find(r => r.id === reqId);
    
    if (reqData) {
      document.getElementById('dynamic-subtitle').innerHTML = `Untuk <strong>${reqData.item.title}</strong> dari <strong>${reqData.lender.fullName}</strong>`;
    } else {
      document.getElementById('dynamic-subtitle').innerHTML = '<span style="color:var(--color-danger-500)">Permintaan tidak ditemukan atau tidak valid.</span>';
      document.getElementById('submit-rating').disabled = true;
    }
  } catch (err) {
    console.error(err);
    document.getElementById('dynamic-subtitle').innerHTML = '<span style="color:var(--color-danger-500)">Gagal memuat data permintaan.</span>';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  init();

  document.getElementById('submit-rating')?.addEventListener('click', async () => {
    if (!reqData) return;
    const ownerRating = document.querySelector('input[name="owner-rating"]:checked')?.value;
    const itemCond    = document.querySelector('input[name="item-cond"]:checked')?.value;
    const comment     = document.getElementById('owner-comment').value;

    if (!ownerRating || !itemCond) {
      toast.error('Rating belum lengkap', 'Silakan pilih bintang untuk pemilik dan kondisi barang.');
      return;
    }

    const btn = document.getElementById('submit-rating');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Mengirim...';
    btn.disabled = true;

    try {
      await api.ratings.submit({
        requestId: reqData.id,
        rating: Number(ownerRating),
        itemCond: Number(itemCond),
        comment: comment
      });
      toast.success('Rating terkirim! ⭐', 'Terima kasih! Trust score berhasil diperbarui.');
      setTimeout(() => location.href = 'requests.html', 1500);
    } catch (err) {
      toast.error('Gagal', err.message || 'Terjadi kesalahan saat mengirim rating.');
      btn.innerHTML = originalText;
      btn.disabled = false;
    }
  });

  lucide.createIcons();
});
