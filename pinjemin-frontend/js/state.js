/**
 * PINJEMIN — GLOBAL STATE
 * No auth — uses mock current user
 */
import { MOCK_USER } from './mock.js';

const state = {
  currentUser: { ...MOCK_USER },
  notifications: [],
  unreadCount: 2,
};

export function getState() { return state; }
export function getCurrentUser() { return state.currentUser; }
export function setCurrentUser(user) { state.currentUser = { ...state.currentUser, ...user }; }
export function getUnreadCount() { return state.unreadCount; }
export function setUnreadCount(n) {
  state.unreadCount = n;
  document.querySelectorAll('[data-notif-badge]').forEach(el => {
    el.textContent = n > 0 ? (n > 99 ? '99+' : n) : '';
    el.style.display = n > 0 ? '' : 'none';
  });
}
export function markAllRead() { state.unreadCount = 0; setUnreadCount(0); }

export default state;
