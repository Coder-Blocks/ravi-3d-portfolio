(()=>{const d=document,w=window;if(!d.body)return;d.body.classList.add('motion-ready');

const progress=d.createElement('div');progress.className='motion-progress';d.body.appendChild(progress);
const cursor=d.createElement('div');cursor.className='motion-cursor';d.body.appendChild(cursor);
const sky=d.createElement('div');sky.className='motion-sky';for(let i=0;i<22;i++){const s=d.createElement('i');s.className='motion-star';s.style.left=((i*37)%97)+'%';s.style.top=((i*53)%88)+'%';s.style.animationDelay=((i%7)*.7)+'s';s.style.opacity=(.25+(i%5)*.12).toFixed(2);sky.appendChild(s)}d.body.prepend(sky);

const nav=d.querySelector('.nav,.site-nav');
const move=(e)=>{cursor.style.transform='translate('+(e.clientX-140)+'px,'+(e.clientY-140)+'px)'};
if(matchMedia('(pointer:fine)').matches)d.addEventListener('mousemove',move,{passive:true});

const update=()=>{const max=Math.max(1,d.documentElement.scrollHeight-w.innerHeight);const p=Math.min(1,w.scrollY/max);progress.style.width=(p*100)+'%';d.documentElement.style.setProperty('--motion-parallax',(p*70).toFixed(1)+'px');if(nav)nav.classList.toggle('motion-compact',w.scrollY>60)};update();w.addEventListener('scroll',update,{passive:true});

const revealTargets=[...d.querySelectorAll('section,header .hero-copy,.hero>div:first-child,.project,.product,.idea-card,.team-role,.contact-panel,.about-section,.section-heading,.matrix,.expertise-matrix,.faq-list,.ledger,.project-ledger')];
revealTargets.forEach(el=>el.classList.add('motion-reveal'));
[d.querySelector('.matrix'),d.querySelector('.expertise-matrix'),d.querySelector('.project-ledger'),d.querySelector('.ledger'),d.querySelector('.team-grid'),d.querySelector('.constellation')].filter(Boolean).forEach(el=>el.classList.add('motion-stagger'));

const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('motion-in');io.unobserve(e.target)}}),{threshold:.10,rootMargin:'0px 0px -5% 0px'});d.querySelectorAll('.motion-reveal,.motion-stagger').forEach(el=>io.observe(el));

[d.querySelector('.portrait'),d.querySelector('.portrait-shell'),d.querySelector('.orbit-stage'),d.querySelector('.portal')].filter(Boolean).forEach(el=>el.classList.add('motion-float'));

const tilt=[...d.querySelectorAll('.project,.product,.idea-card,.team-role')];if(matchMedia('(pointer:fine)').matches&&!matchMedia('(prefers-reduced-motion: reduce)').matches){tilt.forEach(card=>{card.addEventListener('mousemove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;card.style.transform='perspective(1100px) rotateX('+(-y*2.2)+'deg) rotateY('+(x*2.8)+'deg) translateY(-3px)'});card.addEventListener('mouseleave',()=>card.style.transform='')})}

d.querySelectorAll('a[href]').forEach(a=>{const h=a.getAttribute('href')||'';if(h.startsWith('#')||h.startsWith('mailto:')||a.target==='_blank')return;a.addEventListener('click',e=>{try{const u=new URL(a.href,location.href);if(u.origin!==location.origin)return;e.preventDefault();d.body.classList.add('motion-page-out');setTimeout(()=>location.href=u.href,220)}catch{}})});

const hero=d.querySelector('.hero');if(hero&&!matchMedia('(prefers-reduced-motion: reduce)').matches){w.addEventListener('scroll',()=>{const r=hero.getBoundingClientRect();if(r.bottom<0||r.top>w.innerHeight)return;hero.style.setProperty('--hero-shift',(Math.max(-1,Math.min(1,-r.top/w.innerHeight))*20).toFixed(1)+'px')},{passive:true})}
})();