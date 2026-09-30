import { isLoggedIn } from '../auth.js';

const API_BASE = 'http://localhost:3000/v1';

// If already logged in, skip register page
if (isLoggedIn()) {
  window.location.replace('dashboard.html');
}

// ── Init Lucide icons ────────────────────────────────────
lucide.createIcons();

// ── Password visibility toggles ──────────────────────────
function makeToggle(inputId, btnId, iconId) {
  const input = document.getElementById(inputId);
  const btn   = document.getElementById(btnId);
  const icon  = document.getElementById(iconId);
  if (!btn) return;
  btn.addEventListener('click', () => {
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    icon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
    lucide.createIcons();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  makeToggle('reg-password', 'toggle-reg-pw', 'toggle-reg-pw-icon');
  makeToggle('reg-confirm',  'toggle-reg-confirm', 'toggle-reg-confirm-icon');

  // ── Helper: alerts ───────────────────────────────────────
  function showError(msg) {
    document.getElementById('register-error-msg').textContent = msg;
    document.getElementById('register-error').classList.add('is-visible');
    document.getElementById('register-success').classList.remove('is-visible');
  }

  function showSuccess(msg) {
    document.getElementById('register-success-msg').textContent = msg;
    document.getElementById('register-success').classList.add('is-visible');
    document.getElementById('register-error').classList.remove('is-visible');
  }

  function clearAlerts() {
    document.getElementById('register-error').classList.remove('is-visible');
    document.getElementById('register-success').classList.remove('is-visible');
  }

  function setFieldError(errorId, inputId, msg) {
    const errEl   = document.getElementById(errorId);
    const inputEl = document.getElementById(inputId);
    if (msg) {
      errEl.textContent = msg;
      errEl.style.display = 'flex';
      inputEl.classList.add('is-error');
    } else {
      errEl.style.display = 'none';
      inputEl.classList.remove('is-error');
    }
  }

  // ── Form submit ──────────────────────────────────────────
  const form = document.getElementById('register-form');
  const btn  = document.getElementById('register-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlerts();

      const nama     = document.getElementById('reg-nama').value.trim();
      const username = document.getElementById('reg-username').value.trim().toLowerCase();
      const password = document.getElementById('reg-password').value;
      const confirm  = document.getElementById('reg-confirm').value;

      // Client-side validation
      let hasError = false;
      const usernameRegex = /^[a-z0-9_]{3,20}$/;

      if (!nama) {
        setFieldError('reg-nama-error', 'reg-nama', 'Nama lengkap wajib diisi.');
        hasError = true;
      } else {
        setFieldError('reg-nama-error', 'reg-nama', '');
      }

      if (!username || !usernameRegex.test(username)) {
        setFieldError('reg-username-error', 'reg-username', 'Username hanya huruf kecil, angka, underscore (3-20 karakter).');
        hasError = true;
      } else {
        setFieldError('reg-username-error', 'reg-username', '');
      }

      if (!password || password.length < 6) {
        setFieldError('reg-password-error', 'reg-password', 'Password minimal 6 karakter.');
        hasError = true;
      } else {
        setFieldError('reg-password-error', 'reg-password', '');
      }

      if (password !== confirm) {
        setFieldError('reg-confirm-error', 'reg-confirm', 'Password dan konfirmasi tidak sama.');
        hasError = true;
      } else {
        setFieldError('reg-confirm-error', 'reg-confirm', '');
      }

      if (hasError) return;

      // Submit to API
      btn.classList.add('is-loading');
      btn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nama, username, password }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          showSuccess('Registrasi berhasil! Mengalihkan ke halaman login...');
          setTimeout(() => {
            window.location.replace('login.html');
          }, 2000);
        } else {
          showError(data.message || 'Registrasi gagal. Coba lagi.');
          btn.classList.remove('is-loading');
          btn.disabled = false;
        }
      } catch (err) {
        showError('Tidak dapat terhubung ke server. Pastikan backend berjalan.');
        btn.classList.remove('is-loading');
        btn.disabled = false;
      }
    });
  }
});
