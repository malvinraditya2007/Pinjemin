import { saveSession, isLoggedIn } from '../auth.js';

const API_BASE = 'http://localhost:3000/v1';

// If already logged in, skip login page
if (isLoggedIn()) {
  window.location.replace('dashboard.html');
}

// ── Init Lucide icons ────────────────────────────────────
lucide.createIcons();

document.addEventListener('DOMContentLoaded', () => {
  // ── Password visibility toggle ───────────────────────────
  const pwInput = document.getElementById('login-password');
  const toggleBtn = document.getElementById('toggle-login-pw');
  const toggleIcon = document.getElementById('toggle-login-pw-icon');

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = pwInput.type === 'password';
      pwInput.type = isHidden ? 'text' : 'password';
      toggleIcon.setAttribute('data-lucide', isHidden ? 'eye-off' : 'eye');
      lucide.createIcons();
    });
  }

  // ── Helper: show/hide alerts ─────────────────────────────
  function showError(msg) {
    document.getElementById('login-error-msg').textContent = msg;
    document.getElementById('login-error').classList.add('is-visible');
    document.getElementById('login-success').classList.remove('is-visible');
  }

  function showSuccess(msg) {
    document.getElementById('login-success-msg').textContent = msg;
    document.getElementById('login-success').classList.add('is-visible');
    document.getElementById('login-error').classList.remove('is-visible');
  }

  function clearAlerts() {
    document.getElementById('login-error').classList.remove('is-visible');
    document.getElementById('login-success').classList.remove('is-visible');
  }

  function setFieldError(id, msg) {
    const el = document.getElementById(id);
    if (msg) {
      el.textContent = msg;
      el.style.display = 'flex';
      document.getElementById(id.replace('-error', '')).classList.add('is-error');
    } else {
      el.style.display = 'none';
      document.getElementById(id.replace('-error', '')).classList.remove('is-error');
    }
  }

  // ── Form submit ──────────────────────────────────────────
  const form = document.getElementById('login-form');
  const btn  = document.getElementById('login-btn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      clearAlerts();

      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;

      // Client-side validation
      let hasError = false;
      if (!username) {
        setFieldError('login-username-error', 'Username wajib diisi.');
        hasError = true;
      } else {
        setFieldError('login-username-error', '');
      }
      if (!password) {
        setFieldError('login-password-error', 'Password wajib diisi.');
        hasError = true;
      } else {
        setFieldError('login-password-error', '');
      }
      if (hasError) return;

      // Submit to API
      btn.classList.add('is-loading');
      btn.disabled = true;

      try {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });

        const data = await res.json();

        if (res.ok && data.success) {
          saveSession(data.token, data.user);
          showSuccess('Login berhasil! Mengalihkan ke dashboard...');
          setTimeout(() => {
            window.location.replace('dashboard.html');
          }, 1200);
        } else {
          showError(data.message || 'Username atau password salah.');
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
