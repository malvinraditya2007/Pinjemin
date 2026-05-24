/**
 * PINJEMIN — TOAST NOTIFICATION SYSTEM
 */

let container = null;

function getContainer() {
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
  return container;
}

/**
 * Show a toast notification
 * @param {Object} opts
 * @param {string} opts.type - 'success' | 'error' | 'warning' | 'info'
 * @param {string} opts.title
 * @param {string} [opts.message]
 * @param {number} [opts.duration] - ms, 0 = persistent
 */
export function showToast({ type = 'info', title, message = '', duration } = {}) {
  const durations = { success: 3000, error: 5000, warning: 4000, info: 4000 };
  const ms = duration !== undefined ? duration : durations[type];

  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.innerHTML = `
    <span class="toast__icon">${icons[type]}</span>
    <div class="toast__content">
      <div class="toast__title">${title}</div>
      ${message ? `<div class="toast__message">${message}</div>` : ''}
    </div>
    <button class="toast__close" aria-label="Tutup">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
    </button>
    ${ms > 0 ? `<div class="toast__progress" style="animation-duration:${ms}ms"></div>` : ''}
  `;

  const close = () => {
    toast.classList.add('is-leaving');
    toast.addEventListener('animationend', () => toast.remove(), { once: true });
  };

  toast.querySelector('.toast__close').addEventListener('click', close);
  toast.addEventListener('click', close);

  getContainer().appendChild(toast);
  if (ms > 0) setTimeout(close, ms);
  return toast;
}

export const toast = {
  success: (title, message) => showToast({ type: 'success', title, message }),
  error:   (title, message) => showToast({ type: 'error', title, message }),
  warning: (title, message) => showToast({ type: 'warning', title, message }),
  info:    (title, message) => showToast({ type: 'info', title, message }),
};

export default toast;
