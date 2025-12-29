document.addEventListener('DOMContentLoaded', () => {

  /* ======================
     CONFIG
  ====================== */
  const API_URL = 'https://script.google.com/macros/s/AKfycbxmGwYHyeO7zBDXW4YoBWHYBneN8N9BxMW2PwiFdp_3vvouqLO04RoQY-L7cA3-fY57gQ/exec';
  const LIMIT = 7;

  /* ======================
     AUTO NAMA DARI URL
  ====================== */
  const params = new URLSearchParams(window.location.search);
  const guest = params.get('to');
  const guestNameEl = document.getElementById('guestName');
  const guestLabelEl = document.getElementById('guestLabel');
  const nameInput = document.getElementById('wishName');

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

  /* ======================
     COVER OPENING
  ====================== */
  const openBtn = document.getElementById('openInvitation');
  const cover = document.getElementById('cover');
  const main = document.getElementById('main-content');

  if (openBtn && cover && main) {
    document.body.classList.add('lock-scroll');

    openBtn.addEventListener('click', () => {
      cover.style.opacity = '0';

      setTimeout(() => {
        cover.style.display = 'none';
        main.style.display = 'block';
        document.body.classList.remove('lock-scroll');
        window.scrollTo(0, 0);
      }, 800);
    });
  }

  /* ======================
     COUNTDOWN
  ====================== */
  const countdownEl = document.getElementById('countdown');
  const targetDate = new Date('June 8, 2026 00:00:00').getTime();

  if (countdownEl) {
    setInterval(() => {
      const now = Date.now();
      const diff = targetDate - now;

      if (diff <= 0) return;

      const d = Math.floor(diff / (1000 * 60 * 60 * 24));
      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);

      countdownEl.innerHTML = `
        <div class="count-item">
            <span class="count-number">${d}</span>
            <span class="count-label">Hari</span>
          </div>
          <div class="count-item">
            <span class="count-number">${h}</span>
            <span class="count-label">Jam</span>
          </div>
          <div class="count-item">
            <span class="count-number">${m}</span>
            <span class="count-label">Menit</span>
          </div>
          <div class="count-item">
            <span class="count-number">${s}</span>
            <span class="count-label">Detik</span>
          </div>
      `;
    }, 1000);
  }

  /* ======================
     KOMENTAR + PAGINATION
  ====================== */
  const wishesBox = document.getElementById('wishes');
  const paginationBox = document.getElementById('pagination');

  let comments = [];
  let currentPage = 1;

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
    if (!wishesBox) return;

    wishesBox.innerHTML = '';

    const start = (currentPage - 1) * LIMIT;
    const end = start + LIMIT;

    comments.slice(start, end).forEach(item => {
      const div = document.createElement('div');
      div.className = 'comment';

      div.innerHTML = `
        <div class="comment-header">
          <span class="comment-name">${item.nama}</span>
          <span class="comment-status">${item.hadir}</span>
        </div>

        <div class="comment-text">
          ${item.ucapan}
        </div>

        <div class="comment-time">
          ${item.waktu ? formatTime(item.waktu) : ''}
        </div>
      `;

      wishesBox.appendChild(div);
    });
  }

  function renderPagination() {
    if (!paginationBox) return;

    paginationBox.innerHTML = '';
    const totalPages = Math.ceil(comments.length / LIMIT);

    if (totalPages <= 1) return;

    for (let i = 1; i <= totalPages; i++) {
      const btn = document.createElement('button');
      btn.textContent = i;

      if (i === currentPage) {
        btn.classList.add('active'); 
      }

      btn.addEventListener('click', () => {
        currentPage = i;
        renderComments();
        renderPagination(); 
      });

      paginationBox.appendChild(btn);
    }
  }

  function loadComments() {
    fetch(API_URL)
    .then(res => res.json())
    .then(data => {

      comments = data.sort((a, b) => {
        return new Date(b.waktu) - new Date(a.waktu);
      });

      currentPage = 1;
      renderComments();
      renderPagination();
    })
    .catch(err => console.error('Gagal load komentar:', err));
  }

  loadComments();


  /* ======================
     FORM SUBMIT
  ====================== */
  const form = document.getElementById('wishForm');
  const popup = document.getElementById('thankYouPopup');
  const closePopup = document.getElementById('closePopup');

  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const nama = wishName.value;
      const hadir = form.querySelector('select').value;
      const ucapan = form.querySelector('textarea').value.trim();
      if (!ucapan) return;

      popup.style.display = 'flex';
      document.body.classList.add('lock-scroll');

      fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({ nama, hadir, ucapan })
      }).catch(err => console.error(err));

      form.querySelector('textarea').value = '';
    });
  }

  /* ======================
     CLOSE POPUP
  ====================== */
  if (closePopup && popup) {
    closePopup.addEventListener('click', () => {
      popup.style.display = 'none';
      document.body.classList.remove('lock-scroll');

      loadComments();

      document
      .getElementById('commentSection')
      ?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
        }
      });
    },
    { threshold: 0.15 }
    );

  document
  .querySelectorAll('.reveal, .reveal-zoom')
  .forEach(el => observer.observe(el));
  
  /* ======================
     LIGHTBOX
  ====================== */
  const galleryImages = document.querySelectorAll('.gallery img');
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxClose = document.getElementById('lightboxClose');

  galleryImages.forEach(img => {
    img.addEventListener('click', () => {
      lightboxImg.src = img.src;
      lightbox.style.display = 'flex';
      document.body.classList.add('lock-scroll');
    });
  });

  lightboxClose.addEventListener('click', () => {
    lightbox.style.display = 'none';
    document.body.classList.remove('lock-scroll');
  });

  lightbox.addEventListener('click', e => {
    if (e.target === lightbox) {
      lightbox.style.display = 'none';
      document.body.classList.remove('lock-scroll');
    }
  });

});
