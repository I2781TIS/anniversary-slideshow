let photos = [];
let current = 0;
let autoTimer = null;
let restartTimer = null; // fn to restart whichever timer mode is active
const FALLBACK_INTERVAL = 4000; // used if no music / beat detection unavailable

const introScreen    = document.getElementById('intro-screen');
const greetingScreen = document.getElementById('greeting-screen');
const slideshowScreen= document.getElementById('slideshow-screen');
const slideImg       = document.getElementById('slide-img');
const progressBar    = document.getElementById('progress-bar');
const counter        = document.getElementById('counter');
const music          = document.getElementById('bg-music');
const endScreen      = document.getElementById('end-screen');

// ── Shuffle helper (Fisher-Yates) ──
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// ── Load data ──
fetch('data_filtered.json').catch(() => fetch('data.json'))
  .then(r => r.json())
  .then(data => {
    photos = shuffle(data.slice());
    console.log(`Loaded ${photos.length} photos (shuffled)`);
  })
  .catch(() => {
    photos = [];
    console.warn('data not found');
  });

// ── Start button ──
document.getElementById('start-btn').addEventListener('click', () => {
  if (photos.length === 0) {
    alert('לא נמצאו תמונות.');
    return;
  }
  introScreen.classList.add('hidden');
  greetingScreen.classList.remove('hidden');
});

// ── Continue from greeting to slideshow ──
document.getElementById('continue-btn').addEventListener('click', () => {
  greetingScreen.classList.add('hidden');
  slideshowScreen.classList.remove('hidden');
  spawnParticles();
  showSlide(0);

  music.play().then(() => {
    startSongSync();
  }).catch(() => {
    // No music file / autoplay blocked -> fall back to fixed interval
    startFixedTimer();
  });
});

// ── Show slide ──
function showSlide(index) {
  current = (index + photos.length) % photos.length;
  const photo = photos[current];

  counter.textContent = `${current + 1} / ${photos.length}`; // update immediately, not inside the fade timeout

  slideImg.classList.add('fade-out');
  setTimeout(() => {
    slideImg.src = `photos_filtered/${photo.file}`;
    slideshowScreen.style.setProperty('--bg-src', `url('photos_filtered/${photo.file}')`);
    slideImg.classList.remove('fade-out');
  }, 600);
}

// ── Fallback fixed-interval auto-advance (no music) ──
function startFixedTimer() {
  const run = () => {
    clearInterval(autoTimer);
    let elapsed = 0;
    const step = 100;
    autoTimer = setInterval(() => {
      elapsed += step;
      progressBar.style.width = `${(elapsed / FALLBACK_INTERVAL) * 100}%`;
      if (elapsed >= FALLBACK_INTERVAL) {
        elapsed = 0;
        showSlide(current + 1);
      }
    }, step);
  };
  restartTimer = run;
  run();
}

// ── Auto-advance at a fixed pace per photo ──
const PHOTO_INTERVAL = 500; // ms per photo

function startSongSync() {
  const run = () => {
    clearInterval(autoTimer);
    let elapsed = 0;
    const step = 50;
    autoTimer = setInterval(() => {
      elapsed += step;
      progressBar.style.width = `${(elapsed / PHOTO_INTERVAL) * 100}%`;
      if (elapsed >= PHOTO_INTERVAL) {
        elapsed = 0;
        if (current === photos.length - 1) {
          showEndScreen();
          return;
        }
        showSlide(current + 1);
      }
    }, step);
  };
  restartTimer = run;
  run();
}

// ── End screen ──
function showEndScreen() {
  clearInterval(autoTimer);
  progressBar.style.width = '0%';
  endScreen.classList.remove('hidden');
  music.pause();
}

// ── Controls ──
function navigate(delta) {
  showSlide(current + delta);
  if (restartTimer) restartTimer();
}

document.getElementById('prev-btn').addEventListener('click', () => navigate(-1));
document.getElementById('next-btn').addEventListener('click', () => navigate(1));

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight') navigate(1);
  if (e.key === 'ArrowLeft')  navigate(-1);
});

// ── Touch swipe navigation ──
let touchStartX = 0;
let touchStartY = 0;

slideshowScreen.addEventListener('touchstart', e => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}, { passive: true });

slideshowScreen.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = Math.abs(e.changedTouches[0].clientY - touchStartY);
  if (Math.abs(dx) > 50 && Math.abs(dx) > dy) {
    navigate(dx < 0 ? 1 : -1); // swipe left = next, swipe right = prev
  }
}, { passive: true });

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
