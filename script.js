const $ = (s, ctx=document) => ctx.querySelector(s);
const $$ = (s, ctx=document) => [...ctx.querySelectorAll(s)];

// Loader
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = $('#page-loader');
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
  }, 550);
});

// Reveal + section activation
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in-view');
      if (e.target.matches('.skills')) e.target.classList.add('in-view');
    }
  });
}, { threshold: .14 });
$$('.reveal, .skills').forEach(el => io.observe(el));

// Animated counters
const counterIO = new IntersectionObserver((entries, obs) => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    $$('[data-count]', entry.target).forEach(el => {
      const target = +el.dataset.count;
      let start = 0;
      const duration = 1100;
      const t0 = performance.now();
      const run = now => {
        const p = Math.min((now - t0) / duration, 1);
        const eased = 1 - Math.pow(1-p, 3);
        el.textContent = Math.floor(target * eased);
        if (p < 1) requestAnimationFrame(run); else el.textContent = target;
      };
      requestAnimationFrame(run);
    });
    obs.unobserve(entry.target);
  });
}, { threshold: .5 });
const heroStats = $('.hero-stats');
if (heroStats) counterIO.observe(heroStats);

// Mouse-driven card tilt
$$('.tilt-card').forEach(card => {
  card.addEventListener('mousemove', e => {
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    card.style.transform = `perspective(1200px) rotateX(${-y * 7}deg) rotateY(${x * 9}deg) translateZ(0)`;
  });
  card.addEventListener('mouseleave', () => card.style.transform = 'perspective(1200px) rotateX(0) rotateY(0)');
});

// Magnetic buttons
$$('.magnetic').forEach(el => {
  el.addEventListener('mousemove', e => {
    const r = el.getBoundingClientRect();
    const x = e.clientX - r.left - r.width/2;
    const y = e.clientY - r.top - r.height/2;
    el.style.transform = `translate(${x*.14}px,${y*.18}px)`;
  });
  el.addEventListener('mouseleave', () => el.style.transform = 'translate(0,0)');
});

// Custom cursor
const dot = $('.cursor-dot'), ring = $('.cursor-ring');
let mx=0,my=0,rx=0,ry=0;
window.addEventListener('mousemove', e => {mx=e.clientX; my=e.clientY; dot.style.transform=`translate(${mx-3}px,${my-3}px)`});
function cursorLoop(){rx += (mx-rx)*.18;ry += (my-ry)*.18;ring.style.transform=`translate(${rx-17}px,${ry-17}px)`;requestAnimationFrame(cursorLoop)}
cursorLoop();
$$('a,.tilt-card').forEach(el=>{el.addEventListener('mouseenter',()=>{ring.style.width='52px';ring.style.height='52px'});el.addEventListener('mouseleave',()=>{ring.style.width='34px';ring.style.height='34px'})});

// Subtle parallax
window.addEventListener('scroll', () => {
  const y = scrollY;
  $('.aurora-a').style.transform = `translateY(${y*.08}px)`;
  $('.aurora-b').style.transform = `translateY(${-y*.05}px)`;
});

// Lightweight 3D background: use Three.js when available, otherwise Canvas2D fallback.
const canvas = $('#webgl');
function startFallback(){
  const ctx = canvas.getContext('2d');
  let particles=[];
  const resize=()=>{canvas.width=innerWidth*devicePixelRatio;canvas.height=innerHeight*devicePixelRatio;ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);particles=Array.from({length:70},()=>({x:Math.random()*innerWidth,y:Math.random()*innerHeight,z:Math.random()*1+.2,r:Math.random()*1.3+.2}))};
  resize();addEventListener('resize',resize);
  const draw=()=>{ctx.clearRect(0,0,innerWidth,innerHeight);particles.forEach(p=>{p.y-=.08*p.z;if(p.y<-10)p.y=innerHeight+10;ctx.beginPath();ctx.arc(p.x,p.y,p.r*p.z,0,Math.PI*2);ctx.fillStyle=`rgba(150,220,255,${.13*p.z})`;ctx.fill()});requestAnimationFrame(draw)};draw();
}

async function startThree(){
  try{
    const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
    const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));
    renderer.setSize(innerWidth,innerHeight);
    const scene=new THREE.Scene();
    const camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,100);camera.position.z=7;
    const group=new THREE.Group();scene.add(group);
    const geo=new THREE.IcosahedronGeometry(1.55,2);
    const mat=new THREE.MeshBasicMaterial({color:0x69e8ff,wireframe:true,transparent:true,opacity:.085});
    const mesh=new THREE.Mesh(geo,mat);mesh.position.set(2.7,.15,-1.6);group.add(mesh);
    const geo2=new THREE.TorusKnotGeometry(.78,.19,120,10);
    const mat2=new THREE.MeshBasicMaterial({color:0xa56cff,wireframe:true,transparent:true,opacity:.065});
    const knot=new THREE.Mesh(geo2,mat2);knot.position.set(-3.1,-1.5,-2.5);group.add(knot);
    const starGeo=new THREE.BufferGeometry();const count=850;const pos=new Float32Array(count*3);
    for(let i=0;i<count*3;i+=3){pos[i]=(Math.random()-.5)*18;pos[i+1]=(Math.random()-.5)*12;pos[i+2]=(Math.random()-.5)*10}
    starGeo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xbfefff,size:.018,transparent:true,opacity:.32}));scene.add(stars);
    let tx=0,ty=0;addEventListener('mousemove',e=>{tx=(e.clientX/innerWidth-.5)*.45;ty=(e.clientY/innerHeight-.5)*.35});
    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
    const animate=()=>{mesh.rotation.x+=.0015;mesh.rotation.y+=.0025;knot.rotation.x-=.001;knot.rotation.y+=.002;group.rotation.y+=(tx-group.rotation.y)*.018;group.rotation.x+=(-ty-group.rotation.x)*.018;stars.rotation.y+=.00008;renderer.render(scene,camera);requestAnimationFrame(animate)};animate();
  }catch(err){ startFallback(); }
}
startThree();
