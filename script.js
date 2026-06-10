let photos = [];
let current = 0;
let autoTimer = null;
const AUTO_INTERVAL = 5000;

const introScreen    = document.getElementById('intro-screen');
const slideshowScreen= document.getElementById('slideshow-screen');
const yearBanner     = document.getElementById('year-banner');
const locationBanner = document.getElementById('location-banner');
const slideImg       = document.getElementById('slide-img');
const progressBar    = document.getElementById('progress-bar');
const counter        = document.getElementById('counter');
const music          = document.getElementById('bg-music');

// ── Load data ──
fetch('data_filtered.json').catch(() => fetch('data.json'))
  .then(r => r.json())
  .then(data => {
    photos = data.sort((a, b) => (a.date || a.year) < (b.date || b.year) ? -1 : 1);
    console.log(`Loaded ${photos.length} photos`);
  })
  .catch(() => {
    photos = [];
    console.warn('data.json not found — run fetch_photos.py first');
  });

// ── Start button ──
document.getElementById('start-btn').addEventListener('click', () => {
  if (photos.length === 0) {
    alert('לא נמצאו תמונות. הרץ את fetch_photos.py תחילה.');
    return;
  }
  introScreen.classList.add('hidden');
  slideshowScreen.classList.remove('hidden');
  spawnParticles();
  showSlide(0);
  startAuto();
  if (music.querySelector('source')) music.play().catch(() => {});
});

// ── Show slide ──
function showSlide(index) {
  current = (index + photos.length) % photos.length;
  const photo = photos[current];

  slideImg.classList.add('fade-out');
  setTimeout(() => {
    slideImg.src = `photos_filtered/${photo.file}`;
    slideshowScreen.style.setProperty('--bg-src', `url('photos_filtered/${photo.file}')`);
    yearBanner.textContent = photo.year;
    locationBanner.textContent = photo.location ? `📍 ${formatLocation(photo.location)}` : '';
    counter.textContent = `${current + 1} / ${photos.length}`;
    slideImg.classList.remove('fade-out');
  }, 600);

  updateProgress();
}

function formatLocation(loc) {
  if (!loc || !loc.includes(',')) return loc;
  return loc; // lat,lng — replace with reverse geocoding if desired
}

// ── Auto-advance ──
function startAuto() {
  clearInterval(autoTimer);
  let elapsed = 0;
  const step = 100;
  autoTimer = setInterval(() => {
    elapsed += step;
    progressBar.style.width = `${(elapsed / AUTO_INTERVAL) * 100}%`;
    if (elapsed >= AUTO_INTERVAL) {
      elapsed = 0;
      showSlide(current + 1);
    }
  }, step);
}

function updateProgress() {
  progressBar.style.width = '0%';
}

// ── Controls ──
document.getElementById('prev-btn').addEventListener('click', () => {
  showSlide(current - 1);
  startAuto();
});

document.getElementById('next-btn').addEventListener('click', () => {
  showSlide(current + 1);
  startAuto();
});

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') { showSlide(current + 1); startAuto(); }
  if (e.key === 'ArrowLeft')  { showSlide(current - 1); startAuto(); }
});

// ── Particles ──
function spawnParticles() {
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (6 + Math.random() * 10) + 's';
    p.style.animationDelay = (Math.random() * 8) + 's';
    p.style.opacity = Math.random() * 0.6 + 0.2;
    const size = 2 + Math.random() * 5;
    p.style.width = p.style.height = size + 'px';
    const colors = ['rgba(59,130,246,0.7)', 'rgba(96,165,250,0.7)', 'rgba(34,197,94,0.5)'];
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    document.body.appendChild(p);
  }
}
