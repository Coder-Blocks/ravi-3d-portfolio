(() => {
  'use strict';
  const CLEAN_PHOTO = '/assets/team/ravi_kumar_sarma_clean.webp?v=3';
  const LINKEDIN = 'https://www.linkedin.com/in/ravikumarsarma';

  function updateFounder() {
    document.querySelectorAll('img').forEach((img) => {
      const alt = (img.getAttribute('alt') || '').toLowerCase();
      const src = img.getAttribute('src') || '';
      if (alt.includes('ravi kumar sarma') || src.includes('ravi_kumar_sarma')) {
        if (!src.includes('ravi_kumar_sarma_clean.webp')) img.setAttribute('src', CLEAN_PHOTO);
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
    if (block && team && team.nextElementSibling !== block) {
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
    updateFounder();
    placeOfficialAttribution();
    updateFooter();
  }

  let cycles = 0;
  const observer = new MutationObserver(() => {
    applyAll();
    if (++cycles > 80) observer.disconnect();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll, { once: true });
  applyAll();
  setTimeout(applyAll, 500);
  setTimeout(applyAll, 1500);
  setTimeout(applyAll, 3500);
})();