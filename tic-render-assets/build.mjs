import fs from 'node:fs/promises';
import path from 'node:path';

const SOURCE = 'https://guileless-seahorse-b59315.netlify.app';
const OUT = path.resolve('dist');
const REPO_ASSETS = path.resolve('tic-render-assets');

await fs.rm(OUT, { recursive: true, force: true });
await fs.mkdir(OUT, { recursive: true });

const seen = new Set();
const queue = [];
const textTypes = /(?:javascript|json|css|html|xml|text)/i;
const interestingExt = /\.(?:js|mjs|css|png|jpe?g|webp|svg|gif|ico|woff2?|ttf|otf|json|map)(?:\?.*)?$/i;

function safeLocalPath(urlObj) {
  const pathname = decodeURIComponent(urlObj.pathname || '/');
  const clean = pathname === '/' ? '/index.html' : pathname;
  const rel = clean.replace(/^\/+/, '').replace(/\.\.(?:\/|\\)/g, '');
  return path.join(OUT, rel);
}

function enqueue(raw, base = SOURCE + '/') {
  if (!raw || raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('mailto:') || raw.startsWith('tel:') || raw.startsWith('#')) return;
  let u;
  try { u = new URL(raw, base); } catch { return; }
  if (u.origin !== SOURCE) return;
  if (u.pathname === '/') return;
  const key = u.origin + u.pathname;
  if (seen.has(key)) return;
  if (u.pathname.startsWith('/assets/') || interestingExt.test(u.pathname)) {
    seen.add(key);
    queue.push(u);
  }
}

function discover(text, baseUrl) {
  const abs = text.match(/(?:src|href)=["']([^"']+)["']/gi) || [];
  for (const item of abs) {
    const m = item.match(/=["']([^"']+)["']/i); if (m) enqueue(m[1], baseUrl);
  }
  const assetPaths = text.match(/\/assets\/[A-Za-z0-9_./@%+~?=&:-]+/g) || [];
  for (const p of assetPaths) enqueue(p, baseUrl);
  const relPaths = text.match(/["'`](\.\.?\/[A-Za-z0-9_./@%+~?=&:-]+\.(?:js|mjs|css|png|jpe?g|webp|svg|gif|woff2?|ttf|otf|json|map)(?:\?[^"'`]*)?)["'`]/g) || [];
  for (const token of relPaths) {
    const m = token.match(/["'`](.*)["'`]/); if (m) enqueue(m[1], baseUrl);
  }
}

async function fetchBuffer(url) {
  const res = await fetch(url, { redirect: 'follow', headers: { 'user-agent': 'TIC-Render-Mirror/1.0' } });
  if (!res.ok) throw new Error(`Fetch failed ${res.status}: ${url}`);
  return { buf: Buffer.from(await res.arrayBuffer()), type: res.headers.get('content-type') || '' };
}

console.log('Fetching TIC website from Netlify…');
const rootRes = await fetch(SOURCE + '/', { redirect: 'follow' });
if (!rootRes.ok) throw new Error(`Unable to fetch source site: ${rootRes.status}`);
let html = await rootRes.text();
discover(html, SOURCE + '/');

// Known public assets referenced with root-relative URLs from the React bundle.
['/hero-devices.jpg', '/tic-logo.png', '/favicon.png', '/assets/team/ravi_kumar_sarma.jpg'].forEach((x) => enqueue(x));

let cursor = 0;
while (cursor < queue.length && cursor < 160) {
  const u = queue[cursor++];
  try {
    const { buf, type } = await fetchBuffer(u.href);
    const dest = safeLocalPath(u);
    await fs.mkdir(path.dirname(dest), { recursive: true });
    if (textTypes.test(type) || /\.(?:js|mjs|css|json|map)$/i.test(u.pathname)) {
      let text = buf.toString('utf8');
      // Native patch so the founder photo and LinkedIn are already correct before the runtime enhancement runs.
      text = text
        .replaceAll('/assets/team/ravi_kumar_sarma.jpg?v=2', '/assets/team/ravi_kumar_sarma_clean.webp?v=3')
        .replaceAll('https://linkedin.com/in/ravi-kumar-1633b7244/', 'https://www.linkedin.com/in/ravikumarsarma');
      await fs.writeFile(dest, text);
      discover(text, u.href);
    } else {
      await fs.writeFile(dest, buf);
    }
    console.log('mirrored', u.pathname);
  } catch (err) {
    console.warn('mirror warning:', u.href, err.message);
  }
}

// Assemble the cleaned, transparent founder portrait from small repository chunks.
const partNames = (await fs.readdir(REPO_ASSETS)).filter((x) => /^ravi-small-part-\d+$/.test(x)).sort();
if (!partNames.length) throw new Error('Founder portrait chunks are missing.');
let photoB64 = '';
for (const name of partNames) photoB64 += (await fs.readFile(path.join(REPO_ASSETS, name), 'utf8')).trim();
const photoPath = path.join(OUT, 'assets', 'team', 'ravi_kumar_sarma_clean.webp');
await fs.mkdir(path.dirname(photoPath), { recursive: true });
await fs.writeFile(photoPath, Buffer.from(photoB64, 'base64'));

// Runtime enhancement file is committed as plain JS.
await fs.copyFile(path.resolve('tic-render-assets/overlay.js'), path.join(OUT, 'tic-overlay.js'));

try {
  const fixedFounderDest = path.join(OUT, 'assets', 'team', 'ravi_kumar_sarma_fixed.jpg');
  const fixedFounderB64 = (await fs.readFile(path.resolve('tic-render-assets/ravi-founder-fixed.b64'), 'utf8')).trim();
  await fs.mkdir(path.dirname(fixedFounderDest), { recursive: true });
  await fs.writeFile(fixedFounderDest, Buffer.from(fixedFounderB64, 'base64'));
  console.log('installed fixed founder portrait');
} catch (err) {
  console.warn('fixed founder portrait unavailable:', err.message);
}

const canonical = 'https://thinkinnovativecreations.onrender.com/';
const seo = `
<title>Think Innovative Creations (TIC) | Ravi Kumar Sarma Garimella | InvoiceFlowPro.in</title>
<meta name="description" content="Official website of Think Innovative Creations (TIC), founded by Ravi Kumar Sarma Garimella. TIC develops software, AI and digital products including InvoiceFlowPro.in.">
<meta name="author" content="Ravi Kumar Sarma Garimella">
<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">
<link rel="canonical" href="${canonical}">
<meta property="og:title" content="Think Innovative Creations (TIC) — Official Website">
<meta property="og:description" content="TIC, founded by Ravi Kumar Sarma Garimella, builds software and AI products including InvoiceFlowPro.in.">
<meta property="og:url" content="${canonical}">
<meta property="og:type" content="website">
<script type="application/ld+json">${JSON.stringify({
  '@context':'https://schema.org',
  '@graph':[
    {'@type':'Organization','@id':canonical+'#organization',name:'Think Innovative Creations',alternateName:'TIC',url:canonical,founder:{'@id':canonical+'#ravi'},sameAs:['https://github.com/Coder-Blocks','https://www.linkedin.com/in/ravikumarsarma']},
    {'@type':'Person','@id':canonical+'#ravi',name:'Ravi Kumar Sarma Garimella',jobTitle:['Founder & CEO','Software Developer'],url:canonical+'founder.html',worksFor:{'@id':canonical+'#organization'},sameAs:['https://github.com/Coder-Blocks','https://www.linkedin.com/in/ravikumarsarma']},
    {'@type':'SoftwareApplication','@id':'https://invoiceflowpro.in/#software',name:'InvoiceFlowPro',url:'https://invoiceflowpro.in',applicationCategory:'BusinessApplication',creator:{'@id':canonical+'#ravi'},provider:{'@id':canonical+'#organization'},description:'InvoiceFlowPro.in is a business software product developed by Think Innovative Creations (TIC), led by founder and lead developer Ravi Kumar Sarma Garimella.'}
  ]
})}</script>`;

html = html
  .replace(/<title[\s\S]*?<\/title>/i, '')
  .replace(/<meta\s+name=["']description["'][^>]*>/ig, '')
  .replace(/<link\s+rel=["']canonical["'][^>]*>/ig, '')
  .replace('</head>', seo + '\n</head>');

const attribution = `
<section id="official-tic-attribution" aria-labelledby="official-built-by-title" style="background:#030914;color:#fff;border-top:1px solid #17355B;border-bottom:1px solid #17355B;padding:72px 20px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif">
  <div style="max-width:1120px;margin:0 auto">
    <div style="display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,102,0,.35);background:rgba(255,102,0,.10);color:#FF8A3D;border-radius:999px;padding:7px 12px;font:800 12px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em">OFFICIAL TIC PRODUCT</div>
    <h2 id="official-built-by-title" style="font-size:clamp(34px,5vw,58px);line-height:1.03;margin:18px 0 10px;font-weight:900;letter-spacing:-.03em">BUILT BY <span style="color:#FF6600">TIC</span></h2>
    <p style="max-width:760px;color:#94A3B8;font-size:16px;line-height:1.75;margin:0 0 26px">Think Innovative Creations (TIC) designs and develops practical software, AI and digital products. The attribution below is published by TIC as first-party information about its own product and leadership.</p>
    <article style="border:1px solid #17355B;background:linear-gradient(145deg,#0A192F,#06101E);border-radius:26px;padding:clamp(22px,4vw,38px);box-shadow:0 20px 60px rgba(0,0,0,.25)">
      <div style="display:flex;flex-wrap:wrap;gap:20px;align-items:flex-start;justify-content:space-between">
        <div style="max-width:760px">
          <div style="color:#38BDF8;font:800 12px ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.08em">BUSINESS SOFTWARE • INDIA</div>
          <h3 style="font-size:clamp(28px,4vw,44px);margin:10px 0 12px;font-weight:900">InvoiceFlowPro.in</h3>
          <p style="color:#CBD5E1;line-height:1.75;margin:0 0 18px">A business platform for invoicing, GST workflows, UPI collection, inventory, dashboards and business automation.</p>
          <p style="color:#fff;line-height:1.8;margin:0"><strong style="color:#FF8A3D">Developed by:</strong> Think Innovative Creations (TIC)<br><strong style="color:#FF8A3D">Founder &amp; Lead Developer:</strong> Ravi Kumar Sarma Garimella</p>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;min-width:220px">
          <a href="https://invoiceflowpro.in" target="_blank" rel="noopener noreferrer" style="display:block;text-align:center;padding:13px 18px;border-radius:14px;background:#FF6600;color:white;text-decoration:none;font-weight:900">Visit InvoiceFlowPro.in ↗</a>
          <a href="/invoiceflowpro.html" style="display:block;text-align:center;padding:12px 18px;border-radius:14px;border:1px solid #17355B;color:#38BDF8;text-decoration:none;font-weight:800">Official attribution page</a>
          <a href="/founder.html" style="display:block;text-align:center;padding:12px 18px;border-radius:14px;border:1px solid #17355B;color:#CBD5E1;text-decoration:none;font-weight:800">Founder profile</a>
        </div>
      </div>
    </article>
  </div>
</section>`;

html = html.replace('</body>', `${attribution}\n<script src="/tic-overlay.js" defer></script>\n</body>`);
await fs.writeFile(path.join(OUT, 'index.html'), html);

// Render static sites serve real files reliably on nested routes.
// Create physical SPA entry points so Courses, Idea Forge and Careers work on direct navigation and refresh.
for (const route of ['courses','idea-forge','careers']) {
  const routeDir = path.join(OUT, route);
  await fs.mkdir(routeDir, { recursive: true });
  await fs.writeFile(path.join(routeDir, 'index.html'), html);
}

const commonStyle = `body{margin:0;background:#030914;color:#fff;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif}main{max-width:920px;margin:auto;padding:64px 22px}a{color:#38BDF8}.eyebrow{color:#FF8A3D;font:800 12px ui-monospace,monospace;letter-spacing:.08em}.card{border:1px solid #17355B;background:#0A192F;border-radius:24px;padding:28px;margin:24px 0}h1{font-size:clamp(38px,7vw,64px);line-height:1.03;margin:12px 0 18px}h2{margin-top:28px}p,li{color:#CBD5E1;line-height:1.8}.portrait{width:220px;height:220px;border-radius:50%;object-fit:cover;background:transparent;border:3px solid #FF6600}.btn{display:inline-block;background:#FF6600;color:#fff;text-decoration:none;font-weight:900;padding:12px 16px;border-radius:12px;margin:6px 8px 6px 0}`;

const founderHtml = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ravi Kumar Sarma Garimella | Founder of Think Innovative Creations (TIC)</title><meta name="description" content="Official TIC founder profile for Ravi Kumar Sarma Garimella, Founder & CEO of Think Innovative Creations and Founder & Lead Developer of InvoiceFlowPro.in."><link rel="canonical" href="${canonical}founder.html"><meta name="robots" content="index,follow"><style>${commonStyle}</style><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'Person',name:'Ravi Kumar Sarma Garimella',jobTitle:['Founder & CEO','Software Developer'],worksFor:{'@type':'Organization',name:'Think Innovative Creations',alternateName:'TIC'},sameAs:['https://github.com/Coder-Blocks','https://www.linkedin.com/in/ravikumarsarma'],url:canonical+'founder.html'})}</script></head><body><main><div class="eyebrow">OFFICIAL TIC FOUNDER PROFILE</div><h1>Ravi Kumar Sarma Garimella</h1><img class="portrait" src="/assets/team/ravi_kumar_sarma_clean.webp" alt="Ravi Kumar Sarma Garimella"><div class="card"><h2>Founder &amp; CEO — Think Innovative Creations (TIC)</h2><p>Ravi Kumar Sarma Garimella is the Founder &amp; CEO of Think Innovative Creations (TIC). He leads TIC's software, AI and digital product development.</p><p>For <a href="https://invoiceflowpro.in">InvoiceFlowPro.in</a>, TIC identifies Ravi Kumar Sarma Garimella as the <strong>Founder &amp; Lead Developer</strong> behind the product.</p><a class="btn" href="/">TIC official website</a><a class="btn" href="https://invoiceflowpro.in">InvoiceFlowPro.in</a></div><p>Official first-party statement published by Think Innovative Creations (TIC).</p></main></body></html>`;

const invoiceHtml = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>InvoiceFlowPro.in | Built by Think Innovative Creations (TIC)</title><meta name="description" content="Official TIC attribution: InvoiceFlowPro.in is developed by Think Innovative Creations (TIC), with Ravi Kumar Sarma Garimella as Founder & Lead Developer."><link rel="canonical" href="${canonical}invoiceflowpro.html"><meta name="robots" content="index,follow"><style>${commonStyle}</style><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':'SoftwareApplication',name:'InvoiceFlowPro',url:'https://invoiceflowpro.in',applicationCategory:'BusinessApplication',creator:{'@type':'Person',name:'Ravi Kumar Sarma Garimella'},provider:{'@type':'Organization',name:'Think Innovative Creations',alternateName:'TIC'},description:'InvoiceFlowPro.in is developed by Think Innovative Creations (TIC), with Ravi Kumar Sarma Garimella identified by TIC as Founder & Lead Developer.'})}</script></head><body><main><div class="eyebrow">OFFICIAL PRODUCT ATTRIBUTION</div><h1>InvoiceFlowPro.in</h1><div class="card"><h2>Built by Think Innovative Creations (TIC)</h2><p><strong>Product:</strong> InvoiceFlowPro.in</p><p><strong>Developer / Provider:</strong> Think Innovative Creations (TIC)</p><p><strong>Founder &amp; Lead Developer:</strong> Ravi Kumar Sarma Garimella</p><p>InvoiceFlowPro is a business platform for invoicing, GST workflows, UPI collection, inventory, dashboards and business automation.</p><a class="btn" href="https://invoiceflowpro.in">Open InvoiceFlowPro.in</a><a class="btn" href="/founder.html">Founder profile</a></div><p>Official first-party attribution published by Think Innovative Creations (TIC).</p></main></body></html>`;

await fs.writeFile(path.join(OUT, 'founder.html'), founderHtml);
await fs.writeFile(path.join(OUT, 'invoiceflowpro.html'), invoiceHtml);
await fs.writeFile(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${canonical}sitemap.xml\n`);
await fs.writeFile(path.join(OUT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${canonical}</loc></url><url><loc>${canonical}founder.html</loc></url><url><loc>${canonical}invoiceflowpro.html</loc></url></urlset>`);
await fs.writeFile(path.join(OUT, '_redirects'), `/courses /index.html 200\n/idea-forge /index.html 200\n/careers /index.html 200\n/* /index.html 200\n`);
console.log(`TIC Render mirror ready: ${seen.size} assets discovered, ${cursor} processed.`);
