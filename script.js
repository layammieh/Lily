'use strict';

const $ = (id) => document.getElementById(id);

const envelopeScene   = $('envelopeScene');
const extrasScene     = $('extrasScene');
const envAssembly     = $('envAssembly');
const letterCard      = $('letterCard');
const envSeal         = $('envSeal');
const envHint         = $('envHint');
const sceneTitle      = $('sceneTitle');
const heartsContainer = $('heartsContainer');
const particleCanvas  = $('particleCanvas');
const closeLetterBtn  = $('closeLetterBtn');
const musicBtn  = $('musicBtn');
const musicIcon = $('musicIcon');
const trackSelect = $('trackSelect');
const mp3Art      = $('mp3Art');
const mp3ProgressBar = $('mp3ProgressBar');
const bgMusic   = $('bgMusic');

let isOpen        = false;
let musicPlaying  = false;
let heartInterval = null;

function recalcOffsets() {
  const envH    = envAssembly.offsetHeight;
  const letterH = letterCard.scrollHeight;

  if (!envH || !letterH) return;

  const naturalTop  = envH - letterH;                        // negative (above assembly)
  const closedY     = -naturalTop + 2;                       // pushes letter just inside envelope top

  const pushDown    = Math.min(40, window.innerHeight * 0.05);
  const asmTop      = (window.innerHeight - envH) / 2 + pushDown; 
  const desiredTop  = Math.max(24, window.innerHeight * 0.04);
  const openY       = desiredTop - asmTop - naturalTop;

  envAssembly.style.setProperty('--letter-closed-y', `${closedY}px`);
  envAssembly.style.setProperty('--letter-open-y',   `${openY}px`);
  envAssembly.style.setProperty('--env-push-down',   `${pushDown}px`);
}

recalcOffsets();
window.addEventListener('load',   recalcOffsets);
window.addEventListener('resize', recalcOffsets);
setTimeout(recalcOffsets, 200);
setTimeout(recalcOffsets, 600);

function openLetter() {
  if (isOpen) return;
  isOpen = true;

  envAssembly.style.pointerEvents = 'none';
  envAssembly.style.cursor = 'default';
  envSeal.classList.add('fade-out');
  envHint.classList.add('hide');
  setTimeout(() => sceneTitle.classList.add('faded'), 80);

  setTimeout(() => {
    envAssembly.classList.add('is-open');
    letterCard.classList.add('is-revealed');
    document.body.style.transition = 'filter 1.2s ease';
    document.body.style.filter     = 'brightness(1.05)';
  }, 160);

  setTimeout(startFloatingHearts, 750);
}

function closeLetter(e) {
  if (e) e.stopPropagation(); // prevent clicking envAssembly
  if (!isOpen) return;
  isOpen = false;

  stopFloatingHearts();
  
  // Revert classes
  envAssembly.classList.remove('is-open');
  letterCard.classList.remove('is-revealed');
  
  // Revert body filter
  document.body.style.filter = '';
  
  // Restore elements
  envSeal.classList.remove('fade-out');
  envHint.classList.remove('hide');
  sceneTitle.classList.remove('faded');
  
  // Re-enable clicks after animation
  setTimeout(() => {
    envAssembly.style.pointerEvents = 'auto';
    envAssembly.style.cursor = 'pointer';
  }, 750);
}

envAssembly.addEventListener('click', openLetter);
envAssembly.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLetter(); }
});
closeLetterBtn.addEventListener('click', closeLetter);

const HEARTS = ['❤️','💜','💙','🤍','✨','💫','🌸'];
function spawnHeart() {
  const el       = document.createElement('span');
  el.className   = 'floating-heart';
  el.textContent = HEARTS[Math.floor(Math.random() * HEARTS.length)];
  el.style.cssText = `
    left:${Math.random()*100}vw;
    font-size:${Math.random()*16+9}px;
    animation-duration:${Math.random()*6+8}s;
  `;
  heartsContainer.appendChild(el);
  el.addEventListener('animationend', () => el.remove(), { once: true });
}
function startFloatingHearts() { spawnHeart(); heartInterval = setInterval(spawnHeart, 2000); }
function stopFloatingHearts()  { clearInterval(heartInterval); heartInterval = null; }

(function initParticles() {
  const ctx = particleCanvas.getContext('2d');
  let particles = [];
  function resize() { particleCanvas.width = window.innerWidth; particleCanvas.height = window.innerHeight; }
  function mkParticle() { return { x: Math.random() * particleCanvas.width, y: Math.random() * particleCanvas.height, r: Math.random() * 2 + 0.5, dx: (Math.random() - 0.5) * 0.28, dy: -(Math.random() * 0.35 + 0.1), alpha: Math.random() * 0.4 + 0.1, hue: [270, 200, 285, 185][Math.floor(Math.random() * 4)] }; }
  function initPool(n) { particles = Array.from({ length: n }, mkParticle); }
  function draw() {
    ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
    particles.forEach((p) => {
      p.x += p.dx; p.y += p.dy; p.alpha += Math.sin(Date.now() * .001 + p.x) * .003; p.alpha = Math.max(.05, Math.min(.55, p.alpha));
      if (p.y < -5) p.y = particleCanvas.height + 5; if (p.x < -5) p.x = particleCanvas.width + 5; if (p.x > particleCanvas.width + 5) p.x = -5;
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      g.addColorStop(0, `hsla(${p.hue},70%,70%,${p.alpha})`); g.addColorStop(1, `hsla(${p.hue},70%,70%,0)`);
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  window.addEventListener('resize', () => { resize(); initPool(80); });
  resize(); initPool(80); draw();
})();

(function initMusic() {
  bgMusic.addEventListener('error', () => { $('musicControl').style.opacity = '0.4'; $('musicControl').style.pointerEvents = 'none'; });
  
  bgMusic.addEventListener('timeupdate', () => {
    if (bgMusic.duration) {
      mp3ProgressBar.style.width = (bgMusic.currentTime / bgMusic.duration * 100) + '%';
    }
  });

  trackSelect.addEventListener('change', () => {
    bgMusic.src = trackSelect.value;
    if (musicPlaying) bgMusic.play().catch(console.error);
  });

  function setPlaying(isPlaying) {
    if (isPlaying) {
      musicPlaying = true;
      musicIcon.className = 'fas fa-pause';
      mp3Art.classList.add('spinning');
    } else {
      musicPlaying = false;
      musicIcon.className = 'fas fa-play';
      mp3Art.classList.remove('spinning');
    }
  }

  musicBtn.addEventListener('click', (e) => {
    e.stopPropagation(); // Prevent document click handler below
    if (musicPlaying) {
      bgMusic.pause(); setPlaying(false);
    } else {
      bgMusic.play().then(() => setPlaying(true)).catch(console.error);
    }
  });

  // Attempt autoplay on first user interaction
  let interacted = false;
  document.addEventListener('click', () => {
    if (!interacted && !musicPlaying) {
      interacted = true;
      bgMusic.play().then(() => setPlaying(true)).catch(console.error);
    }
  });
})();

(function initSparkle() {
  const cvs = document.createElement('canvas');
  cvs.style.cssText = 'position:absolute;inset:0;pointer-events:none;width:100%;height:100%;border-radius:14px;z-index:5;';
  envAssembly.appendChild(cvs);
  let sparkles = [], animating = false;
  function resize() { const r = envAssembly.getBoundingClientRect(); cvs.width = r.width; cvs.height = r.height; }
  function spawn(x, y) {
    for (let i = 0; i < 5; i++) {
      const a = (Math.PI*2/5)*i + Math.random()*.5, sp = Math.random()*2+.8;
      sparkles.push({ x,y, vx:Math.cos(a)*sp, vy:Math.sin(a)*sp, life:1, r:Math.random()*2.5+.8, hue:[270,190,285][Math.floor(Math.random()*3)] });
    }
  }
  function animate() {
    const c = cvs.getContext('2d');
    c.clearRect(0,0,cvs.width,cvs.height);
    sparkles = sparkles.filter(s=>s.life>0);
    sparkles.forEach(s=>{ s.x+=s.vx; s.y+=s.vy; s.vy+=.04; s.life-=.028; c.beginPath(); c.arc(s.x,s.y,s.r,0,Math.PI*2); c.fillStyle=`hsla(${s.hue},80%,72%,${s.life})`; c.fill(); });
    if (sparkles.length) requestAnimationFrame(animate); else animating=false;
  }
  envAssembly.addEventListener('mousemove', (e) => {
    if (isOpen) return;
    resize();
    const r = cvs.getBoundingClientRect();
    spawn(e.clientX-r.left, e.clientY-r.top);
    if (!animating) { animating=true; animate(); }
  });
  window.addEventListener('resize', resize);
  resize();
})();
