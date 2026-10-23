/** PINJEMIN — CONFIG */

// ── Environment-aware backend URL ────────────────────────────────────
// When the site runs on localhost/127.0.0.1 we talk to the local backend.
// Anywhere else (e.g. the Vercel deployment) we talk to the Render backend.
const IS_LOCAL = ['localhost', '127.0.0.1', ''].includes(window.location.hostname) || window.location.protocol === 'file:';
const PROD_API_ORIGIN = 'https://pinjemin-production-backend.up.railway.app';

const API_ORIGIN = IS_LOCAL ? 'http://localhost:3000' : PROD_API_ORIGIN;

export const API_BASE_URL = `${API_ORIGIN}/v1`;
export const SOCKET_URL   = API_ORIGIN;
export const APP_NAME     = 'Pinjemin';

export const CATEGORIES = [
  { value: 'TOOLS',       label: 'Peralatan',    emoji: '🔧' },
  { value: 'ELECTRONICS', label: 'Elektronik',   emoji: '💻' },
  { value: 'SPORTS',      label: 'Olahraga',     emoji: '🏋️' },
  { value: 'KITCHEN',     label: 'Dapur',        emoji: '🍳' },
  { value: 'GARDEN',      label: 'Kebun',        emoji: '🌿' },
  { value: 'VEHICLE',     label: 'Kendaraan',    emoji: '🚗' },
  { value: 'BABY_KIDS',   label: 'Bayi & Anak',  emoji: '👶' },
  { value: 'BOOKS_MEDIA', label: 'Buku & Media', emoji: '📚' },
  { value: 'FASHION',     label: 'Fashion',      emoji: '👗' },
  { value: 'OUTDOOR',     label: 'Outdoor',      emoji: '⛺' },
  { value: 'OTHER',       label: 'Lainnya',      emoji: '📦' },
];

export const CONDITIONS = [
  { value: 'EXCELLENT',  label: 'Sangat Baik' },
  { value: 'GOOD',       label: 'Baik' },
  { value: 'FAIR',       label: 'Cukup' },
  { value: 'NEEDS_CARE', label: 'Perlu Perhatian' },
];
