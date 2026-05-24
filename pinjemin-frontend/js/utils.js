/**
 * PINJEMIN — UTILITY FUNCTIONS
 */

/** Format IDR currency */
export function formatIDR(amount) {
  if (!amount || amount === 0) return 'Gratis';
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
}

/** Format date to Indonesian locale */
export function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Format short date */
export function formatDateShort(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/** Format date range */
export function formatDateRange(start, end) {
  return `${formatDateShort(start)} – ${formatDateShort(end)}`;
}

/** Format duration in days */
export function formatDuration(start, end) {
  const ms = new Date(end) - new Date(start);
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return `${days} hari`;
}

/** Format relative time (e.g. "2 jam lalu") */
export function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minute = 60 * 1000, hour = 60 * minute, day = 24 * hour, week = 7 * day;
  if (diff < minute)  return 'Baru saja';
  if (diff < hour)    return `${Math.floor(diff / minute)} menit lalu`;
  if (diff < day)     return `${Math.floor(diff / hour)} jam lalu`;
  if (diff < week)    return `${Math.floor(diff / day)} hari lalu`;
  return formatDate(dateStr);
}

/** Format distance in km */
export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

/** Get trust level from score */
export function getTrustLevel(score) {
  if (score <= 40) return { level: 'new',      label: 'New',      class: 'badge-trust-new' };
  if (score <= 70) return { level: 'member',   label: 'Member',   class: 'badge-trust-member' };
  if (score <= 89) return { level: 'trusted',  label: 'Trusted',  class: 'badge-trust-trusted' };
  return             { level: 'verified', label: 'Verified', class: 'badge-trust-verified' };
}

/** Get request status badge info */
export function getStatusBadge(status) {
  const map = {
    PENDING:   { label: 'Menunggu',    class: 'badge-pending' },
    APPROVED:  { label: 'Dipinjam',    class: 'badge-active' },
    REJECTED:  { label: 'Ditolak',     class: 'badge-rejected' },
    RETURNED:  { label: 'Dikembalikan',class: 'badge-returned' },
    OVERDUE:   { label: 'Terlambat',   class: 'badge-overdue' },
    CANCELLED: { label: 'Dibatalkan',  class: 'badge-cancelled' },
  };
  return map[status] || { label: status, class: '' };
}

/** Get item condition label */
export function getConditionLabel(condition) {
  const map = {
    EXCELLENT:  'Sangat Baik',
    GOOD:       'Baik',
    FAIR:       'Cukup',
    NEEDS_CARE: 'Perlu Perhatian',
  };
  return map[condition] || condition;
}

/** Get category label & emoji */
export function getCategoryInfo(category) {
  const map = {
    TOOLS:       { label: 'Peralatan',   emoji: '🔧' },
    ELECTRONICS: { label: 'Elektronik',  emoji: '💻' },
    SPORTS:      { label: 'Olahraga',    emoji: '🏋️' },
    KITCHEN:     { label: 'Dapur',       emoji: '🍳' },
    GARDEN:      { label: 'Kebun',       emoji: '🌿' },
    VEHICLE:     { label: 'Kendaraan',   emoji: '🚗' },
    BABY_KIDS:   { label: 'Bayi & Anak', emoji: '👶' },
    BOOKS_MEDIA: { label: 'Buku & Media',emoji: '📚' },
    FASHION:     { label: 'Fashion',     emoji: '👗' },
    OUTDOOR:     { label: 'Outdoor',     emoji: '⛺' },
    OTHER:       { label: 'Lainnya',     emoji: '📦' },
  };
  return map[category] || { label: category, emoji: '📦' };
}

/** Generate initials from full name */
export function getInitials(name) {
  if (!name) return '?';
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

/** Debounce helper */
export function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/** CountUp animation */
export function animateCountUp(el, target, duration = 2000, prefix = '', suffix = '') {
  const start = performance.now();
  const startVal = 0;
  const update = (time) => {
    const progress = Math.min((time - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
    const current = Math.floor(startVal + (target - startVal) * eased);
    el.textContent = prefix + current.toLocaleString('id-ID') + suffix;
    if (progress < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

/** Truncate text */
export function truncate(str, maxLen = 80) {
  if (!str || str.length <= maxLen) return str;
  return str.slice(0, maxLen).trimEnd() + '…';
}

/** Escape HTML */
export function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/** Generate star HTML (display only) */
export function renderStars(score, max = 5) {
  let html = '<div class="stars">';
  for (let i = 1; i <= max; i++) {
    if (i <= score) {
      html += `<svg class="stars__star" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/></svg>`;
    } else {
      html += `<svg class="stars__star stars__star--empty" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`;
    }
  }
  html += '</div>';
  return html;
}
