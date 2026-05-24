/**
 * PINJEMIN — SHARED APP LAYOUT
 * Renders sidebar, bottom nav, top bar for all app pages
 */
import api, { CURRENT_USER_ID } from './api.js';
import { getTrustLevel, getInitials } from './utils.js';
import toast from './toast.js';

export function renderAppShell(activePage = '') {
  // Render placeholder first
  const user = { fullName: 'Loading...', trustScore: 0, avatarUrl: '' };
  const trust = { class: '', label: '' };
  const initials = '';

  const navLinks = [
    { href: 'dashboard.html',    icon: 'home',        label: 'Beranda',           id: 'dashboard' },
    { href: 'discover.html',     icon: 'search',      label: 'Temukan Barang',    id: 'discover' },
    { href: 'item-new.html',     icon: 'plus-circle', label: 'Tambah Barang',     id: 'item-new' },
    { href: 'requests.html',     icon: 'send',        label: 'Permintaanku',      id: 'requests' },
    { href: 'approvals.html',    icon: 'inbox',       label: 'Persetujuan',       id: 'approvals', badge: true },
    { href: 'borrows-active.html',icon:'package',     label: 'Dipinjam Aktif',    id: 'borrows-active' },
    { href: 'notifications.html',icon: 'bell',        label: 'Notifikasi',        id: 'notifications', badge: true },
    { href: 'profile.html',      icon: 'user',        label: 'Profil Saya',       id: 'profile' },
  ];

  const sidebarHtml = `
  <aside class="sidebar" id="sidebar">
    <a href="dashboard.html" class="sidebar__logo">
      <div class="sidebar__logo-mark">P</div>
      <span class="sidebar__logo-text">Pinjemin</span>
    </a>
    <a href="profile.html" class="sidebar__user">
      <div class="sidebar__avatar" id="sidebar-avatar">
        <!-- populated async -->
      </div>
      <div class="sidebar__user-info">
        <div class="sidebar__username" id="sidebar-username">Loading...</div>
        <span class="badge badge-trust" id="sidebar-trust">...</span>
      </div>
    </a>
    <div class="sidebar__cta">
      <a href="item-new.html" class="btn btn-primary btn-md btn-full">
        <i data-lucide="plus" style="width:16px;height:16px"></i>
        Tambah Barang
      </a>
    </div>
    <nav class="sidebar__nav">
      ${navLinks.map(link => `
        <a href="${link.href}" class="sidebar__link ${activePage === link.id ? 'is-active' : ''}">
          <i data-lucide="${link.icon}" style="width:18px;height:18px"></i>
          <span class="sidebar__link-text">${link.label}</span>
          ${link.badge ? `<span class="sidebar__link-badge" data-notif-badge style="display:none"></span>` : ''}
        </a>
      `).join('')}
    </nav>
    <div class="sidebar__bottom">
      <a href="../index.html" class="sidebar__link">
        <i data-lucide="arrow-left" style="width:18px;height:18px"></i>
        <span class="sidebar__link-text">Kembali ke Landing</span>
      </a>
    </div>
  </aside>
  <div class="sidebar-overlay" id="sidebar-overlay"></div>`;

  const bottomNavHtml = `
  <nav class="bottom-nav" id="bottom-nav">
    <a href="dashboard.html" class="bottom-nav__item ${activePage==='dashboard'?'is-active':''}">
      <span class="bottom-nav__icon"><i data-lucide="home" style="width:24px;height:24px"></i></span>
      <span class="bottom-nav__label">Beranda</span>
    </a>
    <a href="discover.html" class="bottom-nav__item ${activePage==='discover'?'is-active':''}">
      <span class="bottom-nav__icon"><i data-lucide="search" style="width:24px;height:24px"></i></span>
      <span class="bottom-nav__label">Temukan</span>
    </a>
    <a href="item-new.html" class="bottom-nav__fab" aria-label="Tambah Barang">
      <i data-lucide="plus" style="width:24px;height:24px"></i>
    </a>
    <a href="requests.html" class="bottom-nav__item ${activePage==='requests'?'is-active':''}">
      <span class="bottom-nav__icon">
        <i data-lucide="send" style="width:24px;height:24px"></i>
        <span class="bottom-nav__badge" data-notif-badge style="display:none"></span>
      </span>
      <span class="bottom-nav__label">Request</span>
    </a>
    <a href="profile.html" class="bottom-nav__item ${activePage==='profile'?'is-active':''}">
      <span class="bottom-nav__icon"><i data-lucide="user" style="width:24px;height:24px"></i></span>
      <span class="bottom-nav__label">Profil</span>
    </a>
  </nav>`;

  document.getElementById('app-sidebar').innerHTML = sidebarHtml;
  document.getElementById('app-bottom-nav').innerHTML = bottomNavHtml;

  // Fire sidebar data fetches in parallel and expose promises for page reuse
  const userPromise = api.users.getMe();
  const notifsPromise = api.notifications.getAll();

  // Expose for page scripts to reuse (avoids duplicate API calls)
  window._appData = { userPromise, notifsPromise };

  // Populate sidebar with fetched user data
  userPromise.then(realUser => {
    const realTrust = getTrustLevel(realUser.trustScore);
    const realInitials = getInitials(realUser.fullName);
    
    document.getElementById('sidebar-username').textContent = realUser.fullName;
    document.getElementById('sidebar-trust').className = `badge badge-trust ${realTrust.class} badge-trust`;
    document.getElementById('sidebar-trust').textContent = `${realTrust.label} · ${realUser.trustScore}`;
    
    document.getElementById('sidebar-avatar').innerHTML = realUser.avatarUrl 
      ? `<img src="${realUser.avatarUrl}" alt="${realUser.fullName}">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--color-primary-400),var(--color-primary-600));color:white;font-weight:700;font-size:1rem">${realInitials}</div>`;
  }).catch(e => console.error(e));

  // Populate notification badges
  notifsPromise.then(notifs => {
    const count = notifs.filter(n => !n.isRead).length;
    document.querySelectorAll('[data-notif-badge]').forEach(el => {
      if (count > 0) { el.textContent = count; el.style.display = ''; }
      else el.style.display = 'none';
    });
  }).catch(e => console.error(e));

  // Setup Socket.io (with limited reconnection to avoid browser freeze)
  if (!window.ioLoaded) {
    window.ioLoaded = true;
    const script = document.createElement('script');
    script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
    script.onload = () => {
      const socket = io('http://localhost:3000', {
        extraHeaders: { 'x-user-id': CURRENT_USER_ID },
        reconnectionAttempts: 3,
        reconnectionDelay: 5000,
        timeout: 5000
      });
      socket.on('notification', (data) => {
        toast.info(data.title, data.body);
        // Increment badge
        document.querySelectorAll('[data-notif-badge]').forEach(el => {
          let count = parseInt(el.textContent) || 0;
          el.textContent = count + 1;
          el.style.display = '';
        });
      });
      socket.on('connect_error', () => {
        console.warn('Socket.io connection failed, will retry up to 3 times');
      });
    };
    document.head.appendChild(script);
  }

  // Mobile sidebar toggle
  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('is-open');
    document.getElementById('sidebar-overlay').classList.toggle('is-active');
  });
  document.getElementById('sidebar-overlay')?.addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('is-open');
    document.getElementById('sidebar-overlay').classList.remove('is-active');
  });

  if (typeof lucide !== 'undefined') lucide.createIcons();
}
