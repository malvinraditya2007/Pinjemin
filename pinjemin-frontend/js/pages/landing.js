/**
 * PINJEMIN — LANDING PAGE SCRIPT
 * Scroll reveals, countUp, trust meter, smooth nav
 */

import { animateCountUp } from '../utils.js';

// ── Intersection Observer for scroll reveals ──────────────
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

// ── CountUp Observer (Section 5 impact numbers) ───────────
const counters = [
  { id: 'counter-borrows',    target: 12400, suffix: '+',  prefix: '' },
  { id: 'counter-co2',        target: 3200,  suffix: ' kg',prefix: '' },
  { id: 'counter-savings',    target: 890,   suffix: ' Jt',prefix: 'Rp ' },
  { id: 'counter-communities',target: 156,   suffix: '',   prefix: '' },
];

const countObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const data = counters.find(c => c.id === el.id);
      if (data) animateCountUp(el, data.target, 2200, data.prefix, data.suffix);
      countObserver.unobserve(el);
    });
  },
  { threshold: 0.5 }
);

counters.forEach(({ id }) => {
  const el = document.getElementById(id);
  if (el) countObserver.observe(el);
});

// ── Trust Meter Animation (Section 4) ────────────────────
const trustMeterObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const fill = document.querySelector('.trust-meter__arc-fill');
      if (fill) {
        // 628 = full circumference; show 87/100 score
        const score = 87;
        const offset = 628 - (628 * score / 100);
        fill.style.strokeDashoffset = offset;
        // Also animate the number
        const numEl = document.querySelector('.trust-meter__number');
        if (numEl) animateCountUp(numEl, score, 2000);
      }
      trustMeterObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.4 }
);

const trustSection = document.querySelector('.trust-section');
if (trustSection) trustMeterObserver.observe(trustSection);

// ── Sticky Navbar Shadow ──────────────────────────────────
const landingNav = document.querySelector('.landing-nav');
if (landingNav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      landingNav.style.boxShadow = 'var(--shadow-md)';
    } else {
      landingNav.style.boxShadow = 'none';
    }
  }, { passive: true });
}

// ── Smooth scroll for anchor links ────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ── Mobile nav toggle ─────────────────────────────────────
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const mobileMenu    = document.getElementById('mobile-menu');
if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('is-open');
  });
}

// ── Category card hover tilt ──────────────────────────────
document.querySelectorAll('.category-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `translateY(-4px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg)`;
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
  });
});
