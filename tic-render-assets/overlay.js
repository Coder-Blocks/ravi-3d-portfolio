(() => {
  'use strict';

  const CLEAN_PHOTO = '/assets/team/ravi_kumar_sarma_fixed.jpg?v=5';
  const LINKEDIN = 'https://www.linkedin.com/in/ravikumarsarma';
  const ROUTES = new Map([
    ['Courses', '/courses/'],
    ['Idea Forge', '/idea-forge/'],
    ['Careers', '/careers/']
  ]);
  const SECTION_BY_LABEL = new Map([
    ['Home','hero'],['Services','services'],['Team','team'],['Portfolio','portfolio'],['About','about'],['Contact','contact']
  ]);

  function normalizeLabel(el) {
    return String(el?.textContent || '').replace(/\s+/g,' ').trim();
  }

  function ensureNavCss() {
    if (document.getElementById('tic-nav-hotfix-style')) return;
    const s = document.createElement('style');
    s.id = 'tic-nav-hotfix-style';
    s.textContent = `
      #desktop-nav-links button > span { display:none !important; }
      #desktop-nav-links button { box-shadow:none !important; }
      #desktop-nav-links button.tic-active-nav-fixed {
        color:#FF6600 !important;
        box-shadow: inset 0 -2px 0 #FF6600 !important;
      }
      #desktop-nav-links button:not(.tic-active-nav-fixed) { color:#CBD5E1 !important; }
      #desktop-nav-links button:not(.tic-active-nav-fixed):hover { color:#FF6600 !important; }
    `;
    document.head.appendChild(s);
  }

  function updateActiveNav() {
    const nav = document.getElementById('desktop-nav-links');
    if (!nav || location.pathname !== '/') return;
    const buttons = [...nav.querySelectorAll('button')];
    let activeLabel = 'Home';
    const y = window.scrollY + 165;

    for (const [label, sectionId] of SECTION_BY_LABEL.entries()) {
      const el = document.getElementById(sectionId);
      if (!el) continue;
      const top = el.getBoundingClientRect().top + window.scrollY;
      if (y >= top) activeLabel = label;
    }

    buttons.forEach((btn) => {
      const label = normalizeLabel(btn);
      btn.classList.toggle('tic-active-nav-fixed', label === activeLabel);
    });
  }

  function installRouteGuard() {
    if (window.__ticRouteGuardInstalled) return;
    window.__ticRouteGuardInstalled = true;
    document.addEventListener('click', (event) => {
      const btn = event.target?.closest?.('#desktop-nav-links button, #mobile-navigation-dropdown button');
      if (!btn) return;
      const label = normalizeLabel(btn);
      const route = ROUTES.get(label);
      if (!route) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
      window.location.assign(route);
    }, true);
  }

  function updateFounder() {
    document.querySelectorAll('img').forEach((img) => {
      const alt = (img.getAttribute('alt') || '').toLowerCase();
      const src = img.getAttribute('src') || '';
      if (alt.includes('ravi kumar sarma') || src.includes('ravi_kumar_sarma')) {
        if (!src.includes('ravi_kumar_sarma_fixed.jpg')) img.setAttribute('src', CLEAN_PHOTO);
        img.setAttribute('alt', 'Ravi Kumar Sarma Garimella — Founder & CEO, Think Innovative Creations (TIC)');
        img.style.background = 'transparent';
      }
    });

    document.querySelectorAll('a[href*="linkedin.com/in/ravi-kumar-1633b7244"]').forEach((a) => {
      a.setAttribute('href', LINKEDIN);
    });

    const card = document.getElementById('founder-spotlight-card');
    if (card && !card.querySelector('#tic-founder-dev-proof')) {
      const heading = [...card.querySelectorAll('h3')].find((x) => /ravi kumar sarma/i.test(x.textContent || ''));
      if (heading) {
        const proof = document.createElement('div');
        proof.id = 'tic-founder-dev-proof';
        proof.setAttribute('style', 'display:inline-flex;align-items:center;gap:8px;margin-top:8px;padding:8px 12px;border-radius:999px;border:1px solid rgba(56,189,248,.35);background:rgba(56,189,248,.10);color:#BAE6FD;font:700 12px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.02em');
        proof.innerHTML = '<span style="width:7px;height:7px;border-radius:50%;background:#22C55E;box-shadow:0 0 14px rgba(34,197,94,.8)"></span><span>Founder &amp; CEO • Lead Developer — <a href="https://invoiceflowpro.in" target="_blank" rel="noopener noreferrer" style="color:#38BDF8;text-decoration:none">InvoiceFlowPro.in ↗</a></span>';
        heading.insertAdjacentElement('afterend', proof);
      }
    }
  }

  function placeOfficialAttribution() {
    const block = document.getElementById('official-tic-attribution');
    const team = document.getElementById('team');
    if (block && team && team.nextElementSibling !== block && location.pathname === '/') {
      team.insertAdjacentElement('afterend', block);
    }
  }

  function updateFooter() {
    const footer = document.getElementById('footer');
    if (!footer || footer.querySelector('#tic-footer-product-proof')) return;
    const wrap = footer.querySelector('.max-w-7xl') || footer.firstElementChild || footer;
    const proof = document.createElement('div');
    proof.id = 'tic-footer-product-proof';
    proof.setAttribute('style', 'max-width:80rem;margin:20px auto 0;padding:14px 18px;border:1px solid #17355B;border-radius:16px;background:#0A192F;color:#94A3B8;font:600 12px system-ui,sans-serif;display:flex;flex-wrap:wrap;gap:10px;align-items:center;justify-content:center;text-align:center');
    proof.innerHTML = '<span>Official TIC product:</span><a href="https://invoiceflowpro.in" target="_blank" rel="noopener noreferrer" style="color:#38BDF8;text-decoration:none;font-weight:800">InvoiceFlowPro.in ↗</a><span style="color:#334155">•</span><span>Founder &amp; Lead Developer: Ravi Kumar Sarma Garimella</span>';
    wrap.appendChild(proof);
  }

  function applyAll() {
    ensureNavCss();
    installRouteGuard();
    updateFounder();
    placeOfficialAttribution();
    updateFooter();
    updateActiveNav();
  }

  window.addEventListener('scroll', updateActiveNav, { passive:true });
  window.addEventListener('resize', updateActiveNav, { passive:true });

  let cycles = 0;
  const observer = new MutationObserver(() => {
    applyAll();
    if (++cycles > 120) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll, { once: true });
  applyAll();
  setTimeout(applyAll, 300);
  setTimeout(applyAll, 900);
  setTimeout(applyAll, 1800);
  setTimeout(applyAll, 3500);
})();