// ======================
// CONFIG
// ======================
const API_URL = 'https://script.google.com/macros/s/AKfycbxmGwYHyeO7zBDXW4YoBWHYBneN8N9BxMW2PwiFdp_3vvouqLO04RoQY-L7cA3-fY57gQ/exec';
const LIMIT = 5;
const galleryImages = document.querySelectorAll('.gallery-item img');
const lightbox = document.querySelector('.lightbox');
const lightboxImage = document.querySelector('.lightbox-image');
const closeBtn = document.querySelector('.lightbox-close');

let attendValue = 'Hadir';
let comments = [];
let currentPage = 1;

// ======================
// INIT (HALAMAN DIBUKA)
// ======================
document.addEventListener('DOMContentLoaded', () => {
  loadComments();
});

// ======================
// TOMBOL BUKA UNDANGAN
// ======================
function openInvitation() {
  document.getElementById('cover').style.display = 'none';
  
  const main = document.getElementById('main');
  main.classList.add('visible');

  initReveal();
  startCountdown();

  const music = document.getElementById('bg-music');

  // mulai dari volume kecil
  music.volume = 0;
  
  music.play().then(() => {
    fadeInMusic(music);
  }).catch(err => {
    console.log("Autoplay diblok:", err);
  });

  // munculin tombol
  document.getElementById('music-toggle').classList.add('show');

  window.scrollTo(0, 0);
}

function fadeInMusic(audio) {
  let volume = 0;
  const target = 0.5; // max volume (0 - 1)
  const step = 0.02;

  const interval = setInterval(() => {
    if (volume < target) {
      volume += step;
      audio.volume = volume;
    } else {
      clearInterval(interval);
    }
  }, 200);
}

function toggleMusic() {
  const music = document.getElementById('bg-music');
  const btn = document.getElementById('music-toggle');

  music.muted = !music.muted;

  btn.textContent = music.muted ? "🔇" : "🔊";
}

function initReveal() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  }

// ======================
// AUTO NAMA DARI URL
// ======================
const params = new URLSearchParams(window.location.search);
const guest = params.get('to');
const guestNameEl = document.getElementById('guestName');
const guestLabelEl = document.getElementById('guestLabel');
const nameInput = document.getElementById('wish-name');

function capitalizeWords(str) {
  return str
  .toLowerCase()
  .split(' ')
  .filter(Boolean)
  .map(w => w[0].toUpperCase() + w.slice(1))
  .join(' ');
}

let formattedName = 'Tamu Undangan';

if (guest) {
  formattedName = capitalizeWords(
    decodeURIComponent(guest).replace(/\+/g, ' ').trim()
    );
}

if (guestNameEl) guestNameEl.textContent = formattedName;
if (guestLabelEl) guestLabelEl.innerHTML = `Kepada Yth.<br>${formattedName}`;
if (nameInput) nameInput.value = formattedName;

// ======================
// HITUNGAN MUNDUR
// ======================
function startCountdown() {
    const target = new Date('2026-08-10T08:00:00+07:00');
    function update() {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) {
        document.getElementById('cd-hari').textContent = '0';
        document.getElementById('cd-jam').textContent = '0';
        document.getElementById('cd-menit').textContent = '0';
        document.getElementById('cd-detik').textContent = '0';
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      document.getElementById('cd-hari').textContent = String(d).padStart(2,'0');
      document.getElementById('cd-jam').textContent = String(h).padStart(2,'0');
      document.getElementById('cd-menit').textContent = String(m).padStart(2,'0');
      document.getElementById('cd-detik').textContent = String(s).padStart(2,'0');
    }
    update();
    setInterval(update, 1000);
  }

  // ======================
  // Zoom Galery
  // ======================
  galleryImages.forEach(img => {

    /* buka lightbox */
    img.addEventListener('click', () => {
      lightboxImage.src = img.dataset.full;
      lightbox.classList.add('show');
      document.body.style.overflow = 'hidden';
    });

    /* preload saat hover desktop */
    img.addEventListener('mouseenter', () => {
      const preload = new Image();
      preload.src = img.dataset.full;
    });
  });

  function closeLightbox(){
    lightbox.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => {
      lightboxImage.src = '';
    }, 300);
  }

  closeBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if(e.target === lightbox){
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (e) => {
    if(e.key === 'Escape'){
      closeLightbox();
    }
  });

// ======================
// PILIH KEHADIRAN
// ======================
function setAttend(el, val) {
  document.querySelectorAll('.attend-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  attendValue = val;
}


// ======================
// SUBMIT UCAPAN
// ======================
function submitWish() {
  const name = document.getElementById('wish-name').value.trim();
  const msg = document.getElementById('wish-msg').value.trim();

  if (!name || !msg) {
    alert('Mohon isi nama dan ucapan terlebih dahulu.');
    return;
  }

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify({
      nama: name,
      hadir: attendValue,
      ucapan: msg
    })
  })
  .then(() => {
    document.getElementById('wish-name').value = '';
    document.getElementById('wish-msg').value = '';

    // reload data + balik ke page 1
    currentPage = 1;
    loadComments();
  })
  .catch(err => console.error(err));
}


// ======================
// LOAD DATA DARI SHEET
// ======================
function loadComments() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {

      // handle format API
      if (Array.isArray(data)) {
        comments = data;
      } else if (data.data) {
        comments = data.data;
      } else {
        comments = [];
      }

      // sort terbaru di atas
      comments.sort((a, b) => {
        return new Date(b.waktu || 0) - new Date(a.waktu || 0);
      });

      renderComments();
      renderPagination();
    })
    .catch(err => console.error('Gagal load komentar:', err));
}


// ======================
// RENDER KOMENTAR
// ======================
function formatTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

function renderComments() {
  const list = document.getElementById('wishes-list');
  if (!list) return;

  list.innerHTML = '';

  const start = (currentPage - 1) * LIMIT;
  const end = start + LIMIT;

  comments.slice(start, end).forEach(item => {
    const div = document.createElement('div');
    div.className = 'wish-item';

    div.innerHTML = `
      <div class="wish-item-header">
        <span class="wish-item-name">${item.nama}</span>
        <span class="wish-item-attend">${item.hadir}</span>
      </div>
      <p class="wish-item-msg">"${item.ucapan}"</p>
      <div class="comment-time">
          ${item.waktu ? formatTime(item.waktu) : ''}
      </div>
    `;

    list.appendChild(div);
  });
}

// ======================
// PAGINATION
// ======================
function renderPagination() {
  const pagination = document.getElementById('pagination');
  if (!pagination) return;

  pagination.innerHTML = '';

  const totalPages = Math.ceil(comments.length / LIMIT);
  if (totalPages <= 1) return;

  const maxVisible = 5;
  let start = Math.max(1, currentPage - 4);
  let end = Math.min(totalPages, start + maxVisible - 1);

  // biar tetap 5 tombol kalau di akhir
  if (end - start < maxVisible - 1) {
    start = Math.max(1, end - maxVisible + 1);
  }

  // tombol pertama + ...
  if (start > 1) {
    addPageButton(1);

    if (start > 2) {
      addDots();
    }
  }

  // tombol tengah
  for (let i = start; i <= end; i++) {
    addPageButton(i);
  }

  // ... + tombol terakhir
  if (end < totalPages) {
    if (end < totalPages - 1) {
      addDots();
    }

    addPageButton(totalPages);
  }

  // helper
  function addPageButton(page) {
    const btn = document.createElement('button');
    btn.textContent = page;

    if (page === currentPage) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      currentPage = page;
      renderComments();
      renderPagination();
    });

    pagination.appendChild(btn);
  }

  function addDots() {
    const span = document.createElement('span');
    span.textContent = '...';
    span.style.padding = '0 8px';
    pagination.appendChild(span);
  }

  // PREV
if (currentPage > 1) {
  const prev = document.createElement('button');
  prev.textContent = '←';
  prev.addEventListener('click', () => {
    currentPage--;
    renderComments();
    renderPagination();
  });
  pagination.appendChild(prev);
}

// NEXT
if (currentPage < totalPages) {
  const next = document.createElement('button');
  next.textContent = '→';
  next.addEventListener('click', () => {
    currentPage++;
    renderComments();
    renderPagination();
  });
  pagination.appendChild(next);
}

btn.addEventListener('click', () => {
  currentPage = page;
  renderComments();
  renderPagination();

  window.scrollTo({
    top: document.getElementById('wishes').offsetTop,
    behavior: 'smooth'
  });
});
}
