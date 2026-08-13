// ======================
// CONFIG
// ======================
const API_URL = 'https://script.google.com/macros/s/AKfycbxmGwYHyeO7zBDXW4YoBWHYBneN8N9BxMW2PwiFdp_3vvouqLO04RoQY-L7cA3-fY57gQ/exec';
const PER_PAGE = 5;

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const lightbox = $('.lightbox');
const lightboxImage = $('.lightbox-image');

let attendValue = 'Hadir';
let wishes = [];
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
  setupGallery();
  setupLightbox();
  setupGuestName();
  loadComments();
  initFireflies('#fireflies', 15);
});

// ======================
// BUKA UNDANGAN
// ======================
function openInvitation() {
  const overlay = $('#envelope-overlay');
  const letterImage = $('#letter-image');
  overlay.classList.add('show');
 
    // trigger animasi buka amplop
    requestAnimationFrame(() => {
      letterImage.classList.add('open');
    });
   
    setTimeout(() => {
      overlay.classList.add('fade');
    }, 1000);
   
    setTimeout(() => {
      overlay.classList.remove('show', 'fade');
      letterImage.classList.remove('open');
      revealMainContent();
    }, 2000);
  }
 
function revealMainContent() {
  $('#cover').style.display = 'none';
  $('#main').classList.add('visible');
 
  initReveal();
  startCountdown();
  playMusic();
 
  $('#music-toggle').classList.add('show');
  window.scrollTo(0, 0);
}
 
function playMusic() {
  const music = $('#bg-music');
  music.volume = 0;
 
  music.play()
    .then(() => fadeInMusic(music))
    .catch(err => console.log('Autoplay diblok:', err));
}
 
function fadeInMusic(audio, target = 0.5, step = 0.02) {
  const interval = setInterval(() => {
    audio.volume = Math.min(target, audio.volume + step);
    if (audio.volume >= target) clearInterval(interval);
  }, 200);
}
 
function toggleMusic(){
  const audio = $('#bg-music'), btn = $('#music-toggle');
  if(audio.paused){ audio.play().catch(()=>{}); btn.classList.remove('music-paused'); }
  else{ audio.pause(); btn.classList.add('music-paused'); }
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
 
  $$('.reveal').forEach(el => observer.observe(el));
}

// ======================
// AUTO NAMA DARI URL
// ======================
function capitalizeWords(str) {
  return str.toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(w => w[0].toUpperCase() + w.slice(1))
    .join(' ');
}

function setupGuestName() {
  const guest = new URLSearchParams(window.location.search).get('to');
  const name = guest
    ? capitalizeWords(decodeURIComponent(guest).replace(/\+/g, ' ').trim())
    : 'Tamu Undangan';

  const nameEl = $('#guestName');
  const labelEl = $('#guestLabel');
  const inputEl = $('#wish-name');

  if (nameEl) nameEl.textContent = name;
  if (labelEl) labelEl.innerHTML = `Kepada Yth.<br>${name}`;
  if (inputEl) inputEl.value = name;
}

// ======================
// HITUNGAN MUNDUR
// ======================
let countdownInterval = null;

function startCountdown() {
  const target = new Date('2026-09-14T08:00:00+07:00');
  const units = ['cd-hari', 'cd-jam', 'cd-menit', 'cd-detik'];

  function update() {
    const diff = target - new Date();

    if (diff <= 0) {
      units.forEach(id => {
        const el = $(`#${id}`);
        if (el) el.textContent = '00';
      });

      const numbersEl = $('#cd-numbers');
      const messageEl = $('#cd-message');
      if (numbersEl) numbersEl.style.display = 'none';
      if (messageEl) messageEl.style.display = 'block';

      clearInterval(countdownInterval);
      return;
    }

    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    $('#cd-hari').textContent = String(d).padStart(2, '0');
    $('#cd-jam').textContent = String(h).padStart(2, '0');
    $('#cd-menit').textContent = String(m).padStart(2, '0');
    $('#cd-detik').textContent = String(s).padStart(2, '0');
  }

  update();
  countdownInterval = setInterval(update, 1000);
}

// ======================
// GALERI & LIGHTBOX
// ======================
function setupGallery() {
  $$('.gallery-item img').forEach(img => {
    img.addEventListener('click', () => {
      lightboxImage.src = img.dataset.full;
      lightbox.classList.add('show');
      document.body.style.overflow = 'hidden';
    });

    img.addEventListener('mouseenter', () => {
      new Image().src = img.dataset.full;
    });
  });
}

function setupLightbox() {
  const closeLightbox = () => {
    lightbox.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(() => lightboxImage.src = '', 300);
  };

  $('.lightbox-close').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeLightbox();
  });
}

// ======================
// KEHADIRAN
// ======================
function setAttend(el, val) {
  $$('.attend-btn').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  attendValue = val;
}

// ======================
// SUBMIT UCAPAN
// ======================
function submitWish() {
  const name = $('#wish-name').value.trim();
  const msg = $('#wish-msg').value.trim();
 
  if (!name || !msg) {
    toast('Mohon isi nama dan ucapan terlebih dahulu.');
    return;
  }
 
  const btn = $('.submit-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Mengirim...'; }
 
  const payload = { nama: name, hadir: attendValue, ucapan: msg };
 
  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
    .then(() => {
      // optimistic update: langsung tampilkan tanpa menunggu Google Sheet
      wishes.unshift({ ...payload, waktu: new Date().toISOString() });
      currentPage = 1;
      renderWishes();
 
      $('#wish-name').value = '';
      $('#wish-msg').value = '';
      toast('Terima kasih atas ucapan & doanya 🤍');
    })
    .catch(err => {
      console.error(err);
      toast('Gagal mengirim, coba lagi ya 🙏');
    })
    .finally(() => {
      if (btn) { btn.disabled = false; btn.textContent = 'Kirim'; }
    });
}

// ======================
// LOAD & RENDER DATA
// ======================
function loadComments() {
  fetch(API_URL)
    .then(res => res.json())
    .then(data => {
      wishes = Array.isArray(data) ? data : (data.data || []);
      wishes.sort((a, b) => new Date(b.waktu || 0) - new Date(a.waktu || 0));
      renderWishes();
    })
    .catch(err => console.error('Gagal load data:', err));
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function renderWishes() {
  const list = $('#wishes-list');
  const pag = $('#pagination');
  if (!list || !pag) return;

  if (wishes.length === 0) {
    list.innerHTML = `<p class="wishes-empty">Belum ada ucapan. Jadilah yang pertama mengirimkan doa restu 🤍</p>`;
    pag.innerHTML = '';
    return;
  }

  const totalPages = Math.ceil(wishes.length / PER_PAGE);
  currentPage = Math.min(currentPage, totalPages);

  const start = (currentPage - 1) * PER_PAGE;
  const pageItems = wishes.slice(start, start + PER_PAGE);

  list.innerHTML = pageItems.map(item => {
    const nama = item.nama || '';
    const ucapan = item.ucapan || '';
    const hadir = item.hadir || 'Hadir';

    const initials = nama.trim().split(/\s+/).slice(0, 2)
      .map(w => w.charAt(0)).join('').toUpperCase();

    const badgeClass = hadir === 'Hadir' ? 'hadir'
      : hadir === 'Tidak Hadir' ? 'tidak' : 'mungkin';

    return `
      <div class="wish-card">
        <div class="wish-head">
          <div class="wish-avatar">${initials}</div>
          <div class="wish-meta">
            <div class="wish-name">${escapeHTML(nama)}</div>
            <div class="wish-time">${formatDate(item.waktu)}</div>
          </div>
          <span class="wish-badge ${badgeClass}">${escapeHTML(hadir)}</span>
        </div>
        <p class="wish-msg">${escapeHTML(ucapan)}</p>
      </div>
    `;
  }).join('');

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const pagination = $('#pagination');
  pagination.innerHTML = '';
  if (totalPages <= 1) return;

  const makeBtn = (label, disabled, onClick) => {
    const btn = document.createElement('button');
    btn.innerHTML = label;
    btn.className = 'attend-btn';
    if (disabled) {
      btn.disabled = true;
      btn.style.opacity = '.35';
    }
    btn.addEventListener('click', onClick);
    return btn;
  };

  const goToPage = () => {
    renderWishes();
    $('#wishes')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  pagination.appendChild(makeBtn('‹', currentPage === 1, () => { currentPage--; goToPage(); }));

  const info = document.createElement('span');
  info.innerHTML = `Hal ${currentPage} / ${totalPages}`;
  pagination.appendChild(info);

  pagination.appendChild(makeBtn('›', currentPage === totalPages, () => { currentPage++; goToPage(); }));
}

/* ============================================================
   TOAST NOTIFICATION
   ============================================================ */
function toast(msg) {
  const t = $('#toast');
  t.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"/></svg><span>' + msg + '</span>';
  t.classList.add('show');
  clearTimeout(window.__toastTimer);
  window.__toastTimer = setTimeout(() => t.classList.remove('show'), 3500);
}

/* ============================================================
   ADD TO CALENDAR (.ics)
   ============================================================ */
function addToGoogleCalendar() {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: 'Pernikahan Gunawan & Chafifah',
    dates: '20260914T010000Z/20260914T050000Z',
    details: 'Akad Nikah 08.00 WIB, Resepsi 10.00 WIB',
    location: 'Dukuh Kalimeneng, Desa Girigondo, Kec. Pituruh, Kab. Purworejo'
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
}

// ======================
// FIREFLIES (full JS control)
// ======================
let fireflyState = [];
let fireflyRAF = null;

function initFireflies(containerSelector = '#fireflies', count = 15) {
  const ul = $(containerSelector);
  if (!ul) return;

  const rand = (min, max) => min + Math.random() * (max - min);

  fireflyState = Array.from({ length: count }).map(() => {
    const li = document.createElement('li');
    li.className = 'firefly';
    ul.appendChild(li);

    return {
      el: li,
      x: rand(0, 100),
      y: rand(0, 100),
      angle: rand(0, Math.PI * 2),   // arah gerak sekarang (radian)
      turnSpeed: rand(0.1, 0.5),     // seberapa cepat arahnya berubah/berbelok
      speed: rand(1, 4),             // kecepatan gerak (% layar per detik)
      baseSize: rand(3, 6),
      sizeAmp: rand(0, 1),
      sizePhase: rand(0, Math.PI * 2),
      sizeFreq: rand(0, 1),
      blinkPhase: rand(0, Math.PI * 2),
      blinkFreq: rand(0, 0.8),
      blinkMin: rand(0.05, 0.2),
      blinkMax: rand(0.7, 10),
      entered: false,
      entranceDelay: rand(0, 2500)
    };
  });

  startFireflyClock();
  animateFireflies();
}

function startFireflyClock() {
  fireflyState.forEach(f => {
    setTimeout(() => {
      f.entered = true;
      f.el.style.transition = 'opacity 1.2s ease, transform 1.2s ease';
    }, f.entranceDelay);
  });
}

function animateFireflies() {
  let last = performance.now();

  function tick(now) {
    const dt = Math.min((now - last) / 1000, 0.1); // dibatasi biar gak loncat kalau tab sempat freeze
    last = now;
    const t = now / 1000;

    fireflyState.forEach(f => {
      if (!f.entered) return;

      // --- belokkan arah secara acak & halus tiap frame ---
      const wobble = (Math.random() - 0.5) * f.turnSpeed * dt * 4;
      f.angle += wobble;

      // kadang naikkan/turunkan kecepatan juga, biar makin variatif
      f.speed += (Math.random() - 0.5) * dt * 3;
      f.speed = Math.max(1, Math.min(f.speed, 20));

      // gerak sesuai arah & kecepatan saat ini
      f.x += Math.cos(f.angle) * f.speed * dt;
      f.y += Math.sin(f.angle) * f.speed * dt;

      // --- pantulkan balik kalau kena tepi, biar gak kabur keluar layar ---
      if (f.x < 0) { f.x = 0; f.angle = Math.PI - f.angle; }
      if (f.x > 100) { f.x = 100; f.angle = Math.PI - f.angle; }
      if (f.y < 0) { f.y = 0; f.angle = -f.angle; }
      if (f.y > 100) { f.y = 100; f.angle = -f.angle; }

      // --- ukuran "bernapas" ---
      const sizeFactor = 1 + f.sizeAmp * Math.sin(t * f.sizeFreq + f.sizePhase);
      const size = Math.max(2, f.baseSize * sizeFactor);

      // --- kedip ---
      const blink = (Math.sin(t * f.blinkFreq + f.blinkPhase) + 1) / 2;
      const opacity = f.blinkMin + blink * (f.blinkMax - f.blinkMin);

      f.el.style.left = f.x + '%';
      f.el.style.top = f.y + '%';
      f.el.style.width = size + 'px';
      f.el.style.height = size + 'px';
      f.el.style.opacity = opacity;
      f.el.style.transform = 'scale(1)';
    });

    fireflyRAF = requestAnimationFrame(tick);
  }

  fireflyRAF = requestAnimationFrame(tick);
}

function stopFireflies() {
  if (fireflyRAF) cancelAnimationFrame(fireflyRAF);
}
