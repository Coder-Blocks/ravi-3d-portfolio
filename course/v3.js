
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const canvas = document.getElementById("webgl");
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, innerWidth/innerHeight, .1, 100);
camera.position.set(0,0,8.2);

const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.setSize(innerWidth,innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;

const root = new THREE.Group();
scene.add(root);

const cyan = new THREE.Color("#42e8ff");
const violet = new THREE.Color("#ad6cff");
const blue = new THREE.Color("#6477ff");
const pink = new THREE.Color("#ff54c8");

const aiCanvas = document.createElement("canvas");
aiCanvas.width = 1024; aiCanvas.height = 1024;
const aictx = aiCanvas.getContext("2d");
const grad = aictx.createLinearGradient(120,100,900,900);
grad.addColorStop(0,"#42e8ff");
grad.addColorStop(.48,"#dce6ff");
grad.addColorStop(1,"#ad6cff");
aictx.clearRect(0,0,1024,1024);
aictx.shadowColor = "rgba(66,232,255,.75)";
aictx.shadowBlur = 42;
aictx.fillStyle = grad;
aictx.font = "900 520px Inter, Arial, sans-serif";
aictx.textAlign = "center";
aictx.textBaseline = "middle";
aictx.fillText("AI",512,540);
const aiTexture = new THREE.CanvasTexture(aiCanvas);
aiTexture.colorSpace = THREE.SRGBColorSpace;
const aiMat = new THREE.MeshBasicMaterial({map:aiTexture,transparent:true,depthWrite:false,side:THREE.DoubleSide});
const aiMesh = new THREE.Mesh(new THREE.PlaneGeometry(3.5,3.5),aiMat);
aiMesh.position.set(2.6,.25,0);
root.add(aiMesh);

const shell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2.08,2),
  new THREE.MeshBasicMaterial({color:0x42e8ff,wireframe:true,transparent:true,opacity:.10})
);
shell.position.copy(aiMesh.position);
root.add(shell);

const ringMat1 = new THREE.MeshBasicMaterial({color:0x42e8ff,transparent:true,opacity:.22});
const ringMat2 = new THREE.MeshBasicMaterial({color:0xad6cff,transparent:true,opacity:.18});
const ring1 = new THREE.Mesh(new THREE.TorusGeometry(2.7,.012,8,180),ringMat1);
ring1.position.copy(aiMesh.position); ring1.rotation.x=1.06; root.add(ring1);
const ring2 = new THREE.Mesh(new THREE.TorusGeometry(3.25,.009,8,180),ringMat2);
ring2.position.copy(aiMesh.position); ring2.rotation.y=.95; ring2.rotation.x=.35; root.add(ring2);

const orbGeom = new THREE.SphereGeometry(.095,18,18);
const orbMat = new THREE.MeshBasicMaterial({color:0xff54c8});
const orb = new THREE.Mesh(orbGeom,orbMat);
orb.position.set(5.25,.32,.1); root.add(orb);

const ambient = new THREE.AmbientLight(0x7698ff,1.35); scene.add(ambient);
const key = new THREE.PointLight(0x42e8ff,8,18); key.position.set(4,3,5); scene.add(key);
const rim = new THREE.PointLight(0xad6cff,8,18); rim.position.set(1,-3,3); scene.add(rim);
const hot = new THREE.PointLight(0xff54c8,4,13); hot.position.set(5,1,-2); scene.add(hot);

// stars
const count = innerWidth < 700 ? 650 : 1200;
const pos = new Float32Array(count*3);
for(let i=0;i<count;i++){
  pos[i*3]=(Math.random()-.5)*20;
  pos[i*3+1]=(Math.random()-.5)*14;
  pos[i*3+2]=(Math.random()-.5)*14-2;
}
const g = new THREE.BufferGeometry();
g.setAttribute("position",new THREE.BufferAttribute(pos,3));
const stars = new THREE.Points(g,new THREE.PointsMaterial({color:0x9ddfff,size:.018,transparent:true,opacity:.72}));
scene.add(stars);

// floating polyhedra
const floaters = [];
const geoms = [
  new THREE.OctahedronGeometry(.38,0),
  new THREE.TetrahedronGeometry(.35,0),
  new THREE.DodecahedronGeometry(.32,0)
];
for(let i=0;i<7;i++){
  const mesh = new THREE.Mesh(
    geoms[i%geoms.length],
    new THREE.MeshBasicMaterial({color:[0x42e8ff,0xad6cff,0x6477ff][i%3],wireframe:true,transparent:true,opacity:.24})
  );
  mesh.position.set((Math.random()-.5)*11,(Math.random()-.5)*6,(Math.random()-.5)*4-1);
  mesh.userData={s:Math.random()*.006+.003,o:Math.random()*Math.PI*2};
  scene.add(mesh); floaters.push(mesh);
}

let mx=0,my=0,scrollP=0;
addEventListener("pointermove",e=>{
  mx=(e.clientX/innerWidth-.5);
  my=(e.clientY/innerHeight-.5);
});
addEventListener("scroll",()=>{
  const max=document.documentElement.scrollHeight-innerHeight;
  scrollP=max>0?scrollY/max:0;
},{passive:true});

function resize(){
  camera.aspect=innerWidth/innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth,innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio,2));
}
addEventListener("resize",resize);

const clock = new THREE.Clock();
function tick(){
  const t=clock.getElapsedTime();
  aiMesh.rotation.x = my*.10 + Math.sin(t*.45)*.035;\n  aiMesh.rotation.y = mx*.16 + Math.cos(t*.38)*.05;\n  aiMesh.scale.setScalar(1 + Math.sin(t*.8)*.025);
  shell.rotation.x=-t*.09;
  shell.rotation.y=t*.12;
  ring1.rotation.z=t*.16;
  ring2.rotation.z=-t*.12;
  orb.position.x = 2.6 + Math.cos(t*.7)*3.15;
  orb.position.y = .25 + Math.sin(t*.7)*2.08;
  stars.rotation.y=t*.008;
  stars.rotation.x=Math.sin(t*.08)*.04;
  floaters.forEach((m,i)=>{
    m.rotation.x+=m.userData.s;
    m.rotation.y+=m.userData.s*1.25;
    m.position.y += Math.sin(t*.6+m.userData.o)*.0008;
  });
  root.rotation.z = scrollP*.28;\n  root.position.y = -scrollP*7.5;
  camera.position.x += ((mx*.6)-camera.position.x)*.035;
  camera.position.y += ((-my*.38)-camera.position.y)*.035;
  camera.position.z = 8.2 - scrollP*.8;
  camera.lookAt(0,0,0);
  renderer.render(scene,camera);
  if(!reduce) requestAnimationFrame(tick);
}
tick();

// loader
const loader=document.querySelector(".loader");
const loaderBar=document.querySelector(".loaderLine i");
let lp=0;
const li=setInterval(()=>{
  lp+=Math.random()*18+7;
  loaderBar.style.width=Math.min(lp,100)+"%";
  if(lp>=100){
    clearInterval(li);
    setTimeout(()=>{
      loader.animate([{clipPath:"inset(0 0 0 0)"},{clipPath:"inset(0 0 100% 0)"}],{duration:850,easing:"cubic-bezier(.76,0,.24,1)",fill:"forwards"});
      setTimeout(()=>loader.remove(),900);
    },180);
  }
},90);

// cursor glow
const cursor=document.getElementById("cursor");
if(!reduce){
  addEventListener("pointermove",e=>{cursor.style.left=e.clientX+"px";cursor.style.top=e.clientY+"px"});
}

// hero parallax
const heroVisual=document.querySelector(".heroVisual");
if(heroVisual && !reduce){
  addEventListener("pointermove",e=>{
    const x=(e.clientX/innerWidth-.5)*18;
    const y=(e.clientY/innerHeight-.5)*-14;
    heroVisual.style.transform=`rotateX(${y*.16}deg) rotateY(${x*.22}deg)`;
  });
}

// native scroll reveal fallback + observer
const io=new IntersectionObserver(entries=>{
  entries.forEach(e=>{
    if(e.isIntersecting){
      e.target.classList.add("visible");
      e.target.querySelectorAll?.(".fill").forEach(f=>f.style.width=f.dataset.w);
    }
  })
},{threshold:.16});
document.querySelectorAll("[data-reveal],.panel").forEach(el=>io.observe(el));

// tilt pricing cards
document.querySelectorAll(".plan").forEach(card=>{
  if(reduce) return;
  card.addEventListener("pointermove",e=>{
    const r=card.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width, y=(e.clientY-r.top)/r.height;
    card.style.setProperty("--mx",(x*100)+"%");
    card.style.setProperty("--my",(y*100)+"%");
    card.style.transform=`perspective(900px) rotateX(${(.5-y)*11}deg) rotateY(${(x-.5)*13}deg) translateY(-6px)`;
  });
  card.addEventListener("pointerleave",()=>card.style.transform="");
});

// magnetic buttons
document.querySelectorAll(".magnetic").forEach(btn=>{
  if(reduce) return;
  btn.addEventListener("pointermove",e=>{
    const r=btn.getBoundingClientRect();
    const x=e.clientX-r.left-r.width/2,y=e.clientY-r.top-r.height/2;
    btn.style.transform=`translate(${x*.09}px,${y*.09}px) scale(1.02)`;
  });
  btn.addEventListener("pointerleave",()=>btn.style.transform="");
});

// CTA perspective
const cta=document.querySelector(".cta3d");
if(cta && !reduce){
  cta.addEventListener("pointermove",e=>{
    const r=cta.getBoundingClientRect();
    const x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    cta.style.transform=`perspective(1100px) rotateX(${-y*5}deg) rotateY(${x*6}deg)`;
  });
  cta.addEventListener("pointerleave",()=>cta.style.transform="");
}

// GSAP cinematic transitions (loaded globally)
function initGSAP(){
  if(!window.gsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);

  gsap.from(".hero .eyebrow",{y:18,opacity:0,duration:.7,delay:.95});
  gsap.from(".heroTitle",{y:52,opacity:0,rotateX:10,duration:1.05,delay:1.03,ease:"power4.out"});
  gsap.from(".heroLead",{y:28,opacity:0,duration:.85,delay:1.15});
  gsap.from(".heroActions",{y:24,opacity:0,duration:.8,delay:1.25});
  gsap.from(".heroTags span",{y:16,opacity:0,stagger:.06,duration:.55,delay:1.35});
  gsap.from(".floatCard",{scale:.6,opacity:0,z:-160,stagger:.13,duration:1.1,delay:1.08,ease:"back.out(1.6)"});
  gsap.from(".portal",{scale:.45,opacity:0,rotation:-40,duration:1.35,delay:1.0,ease:"expo.out"});

  document.querySelectorAll(".sectionHead").forEach(head=>{
    gsap.from(head.children,{
      scrollTrigger:{trigger:head,start:"top 82%",toggleActions:"play none none reverse"},
      y:42,opacity:0,stagger:.09,duration:.75,ease:"power3.out"
    });
  });

  gsap.from(".plan",{
    scrollTrigger:{trigger:".plans",start:"top 82%",toggleActions:"play none none reverse"},
    y:95,z:-260,rotationX:18,rotationY:(i)=>i%2?12:-12,opacity:0,
    stagger:.12,duration:1.05,ease:"power4.out"
  });

  gsap.from(".skill",{
    scrollTrigger:{trigger:".skills",start:"top 84%",toggleActions:"play none none reverse"},
    y:80,rotationX:52,transformOrigin:"50% 100%",opacity:0,stagger:.1,duration:.9,ease:"power3.out"
  });

  gsap.from(".compare",{
    scrollTrigger:{trigger:".compare",start:"top 82%",toggleActions:"play none none reverse"},
    clipPath:"inset(0 50% 0 50%)",opacity:.2,duration:1.15,ease:"expo.out"
  });

  gsap.from(".potential .panel",{
    scrollTrigger:{trigger:".potential",start:"top 82%",toggleActions:"play none none reverse"},
    x:(i)=>i===0?-100:100,rotationY:(i)=>i===0?8:-8,opacity:0,stagger:.14,duration:1.0,ease:"power3.out"
  });

  gsap.to(".bandText",{
    xPercent:-24,
    scrollTrigger:{trigger:".transitionBand",start:"top bottom",end:"bottom top",scrub:1}
  });

  gsap.to(".pageWipe",{
    height:"18vh",
    scrollTrigger:{trigger:"#skills",start:"top bottom",end:"top 65%",scrub:1}
  });
  gsap.to(".pageWipe",{
    height:0,
    scrollTrigger:{trigger:"#skills",start:"top 65%",end:"top 35%",scrub:1}
  });

  gsap.from(".cta3d",{
    scrollTrigger:{trigger:".cta3d",start:"top 84%",toggleActions:"play none none reverse"},
    scale:.75,rotationX:12,opacity:0,duration:1.15,ease:"back.out(1.35)"
  });

  gsap.to(".heroGrid",{
    scale:.9,opacity:.35,y:-80,
    scrollTrigger:{trigger:".hero",start:"60% center",end:"bottom top",scrub:1}
  });
}
if(document.readyState==="complete") initGSAP(); else addEventListener("load",initGSAP);

// section transition flash on nav click
const wipe=document.querySelector(".pageWipe");
document.querySelectorAll('a[href^="#"]').forEach(a=>{
  a.addEventListener("click",()=>{
    if(reduce) return;
    wipe.animate([{height:"0vh",opacity:0},{height:"100vh",opacity:1},{height:"0vh",opacity:0}],{duration:720,easing:"cubic-bezier(.76,0,.24,1)"});
  });
});
