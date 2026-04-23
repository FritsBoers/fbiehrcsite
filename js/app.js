/* ============================================
   Hard Rock Cafe Collection - Shared App Logic
   Navigation, data loading, utilities
   ============================================ */

const App = {
  _data: null,
  _dataPromise: null,

  // ---------- Data Loading ----------
  async loadData() {
    if (this._data) return this._data;
    if (this._dataPromise) return this._dataPromise;

    this._dataPromise = fetch('data/locations.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load location data');
        return res.json();
      })
      .then(data => {
        this._data = data;
        return data;
      });

    return this._dataPromise;
  },

  // ---------- Data Helpers ----------
  getVisited(data) {
    return data.filter(loc => loc.status === 'visited');
  },

  getPlanned(data) {
    return data.filter(loc => loc.status === 'planned');
  },

  getCafes(data) {
    return data.filter(loc => loc.type === 'cafe');
  },

  getHotels(data) {
    return data.filter(loc => loc.type === 'hotel');
  },

  getRockShops(data) {
    return data.filter(loc => loc.type === 'rockshop');
  },

  getClosed(data) {
    return data.filter(loc => loc.isClosed);
  },

  getCountries(data) {
    return [...new Set(data.map(loc => loc.country))].sort();
  },

  getContinents(data) {
    return [...new Set(data.map(loc => loc.continent))].sort();
  },

  getFavorites(data) {
    return data.filter(loc => loc.favorite);
  },

  getById(data, id) {
    return data.find(loc => loc.id === id);
  },

  getPinsCount(data) {
    return this.getVisited(data).reduce((sum, loc) => sum + (loc.pins ? loc.pins.length : 0), 0);
  },

  getTshirtsCount(data) {
    return this.getVisited(data).reduce((sum, loc) => sum + (loc.tshirts ? loc.tshirts.length : 0), 0);
  },

  getVisitedCountries(data) {
    return [...new Set(this.getVisited(data).map(loc => loc.country))];
  },

  // Sort visited by date descending
  getLatestVisits(data, count = 4) {
    return this.getVisited(data)
      .sort((a, b) => new Date(this.latestVisitDate(b)) - new Date(this.latestVisitDate(a)))
      .slice(0, count);
  },

  // Get the most recent visit date (supports string or array)
  latestVisitDate(loc) {
    if (!loc.visitDate) return null;
    if (Array.isArray(loc.visitDate)) {
      return loc.visitDate.length > 0 ? loc.visitDate[loc.visitDate.length - 1] : null;
    }
    return loc.visitDate;
  },

  // Get the first (earliest) visit date (supports string or array)
  firstVisitDate(loc) {
    if (!loc.visitDate) return null;
    if (Array.isArray(loc.visitDate)) {
      return loc.visitDate.length > 0 ? loc.visitDate[0] : null;
    }
    return loc.visitDate;
  },

  // Get visit count
  visitCount(loc) {
    if (!loc.visitDate) return 0;
    if (Array.isArray(loc.visitDate)) return loc.visitDate.length;
    return 1;
  },

  // Format all visit dates for display
  formatVisitDates(loc) {
    if (!loc.visitDate) return '—';
    const dates = Array.isArray(loc.visitDate) ? loc.visitDate : [loc.visitDate];
    return dates.map(d => this.formatDate(d)).join(', ');
  },

  // Furthest from Amsterdam (approx home base)
  getFurthest(data) {
    const homeLat = 52.37;
    const homeLng = 4.89;
    let maxDist = 0;
    let furthest = null;
    this.getVisited(data).forEach(loc => {
      const d = this.haversine(homeLat, homeLng, loc.lat, loc.lng);
      if (d > maxDist) {
        maxDist = d;
        furthest = loc;
      }
    });
    return furthest;
  },

  haversine(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  },

  // ---------- Formatting ----------
  formatDate(dateStr) {
    if (!dateStr) return '—';
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const [y, m] = dateStr.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  },

  formatShortDate(dateStr) {
    if (!dateStr) return '—';
    if (/^\d{4}-\d{2}$/.test(dateStr)) {
      const [y, m] = dateStr.split('-');
      const d = new Date(parseInt(y), parseInt(m) - 1);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
    }
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  },

  typeBadge(type) {
    const classes = {
      cafe: 'badge-cafe',
      hotel: 'badge-hotel',
      rockshop: 'badge-rockshop'
    };
    const labels = {
      cafe: 'Cafe',
      hotel: 'Hotel',
      rockshop: 'Rock Shop'
    };
    return `<span class="badge ${classes[type] || ''}">${labels[type] || type}</span>`;
  },

  // ---------- Placeholder Image ----------
  placeholderImg(text, width = 400, height = 300) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="#2d2d2d"/>
      <text x="50%" y="45%" text-anchor="middle" fill="#555" font-family="sans-serif" font-size="14">${this.escapeHtml(text)}</text>
      <text x="50%" y="58%" text-anchor="middle" fill="#444" font-family="sans-serif" font-size="11">Add your photo</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // ---------- Thumbnail ----------
  getThumb(loc) {
    if (loc.thumbnail) return loc.thumbnail;
    if (loc.photos && loc.photos.length > 0) return loc.photos[0];
    return null;
  },

  // ---------- Location Card HTML ----------
  locationCard(loc) {
    const imgSrc = this.getThumb(loc) || this.placeholderImg(loc.city);
    const dateStr = loc.status === 'planned'
      ? `Planned: ${this.formatShortDate(loc.plannedDate)}`
      : this.formatShortDate(this.latestVisitDate(loc));
    const visits = this.visitCount(loc);
    const visitBadge = visits > 1 ? ` <span class="badge badge-visits">${visits}x</span>` : '';
    const closedBadge = loc.isClosed ? ' <span class="badge badge-closed">Closed</span>' : '';

    return `
      <a href="location.html?id=${encodeURIComponent(loc.id)}" class="location-card">
        <img class="location-card-image" src="${imgSrc}" alt="${this.escapeHtml(loc.name)}"
             onerror="this.src='${this.placeholderImg(loc.city)}'">
        <div class="location-card-body">
          <div class="location-card-name">${this.escapeHtml(loc.name)}${visitBadge}${closedBadge}</div>
          <div class="location-card-city">${this.escapeHtml(loc.city)}, ${this.escapeHtml(loc.country)}</div>
          <div class="location-card-meta">
            ${this.typeBadge(loc.type)}
            <span>${dateStr}</span>
          </div>
        </div>
      </a>`;
  },

  // ---------- Navigation ----------
  initNav() {
    const toggle = document.querySelector('.nav-toggle');
    const links = document.querySelector('.nav-links');

    if (toggle && links) {
      toggle.addEventListener('click', () => {
        toggle.classList.toggle('active');
        links.classList.toggle('open');
      });

      // Close mobile menu on link click
      links.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          toggle.classList.remove('active');
          links.classList.remove('open');
        });
      });
    }

    // Active nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a').forEach(link => {
      const href = link.getAttribute('href');
      if (href === currentPage || (currentPage === '' && href === 'index.html')) {
        link.classList.add('active');
      }
    });
  },

  // ---------- Lightbox ----------
  initLightbox() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;

    const img = lightbox.querySelector('img');
    const close = lightbox.querySelector('.lightbox-close');
    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    const counter = lightbox.querySelector('.lightbox-counter');

    let images = [];
    let currentIndex = 0;

    const updateNav = () => {
      if (counter) counter.textContent = images.length > 1 ? `${currentIndex + 1} / ${images.length}` : '';
      if (prevBtn) prevBtn.style.display = images.length > 1 ? '' : 'none';
      if (nextBtn) nextBtn.style.display = images.length > 1 ? '' : 'none';
    };

    const showImage = (index) => {
      currentIndex = (index + images.length) % images.length;
      img.src = images[currentIndex];
      updateNav();
    };

    document.addEventListener('click', (e) => {
      if (e.target.matches('[data-lightbox]')) {
        images = Array.from(document.querySelectorAll('[data-lightbox]')).map(el => el.src);
        currentIndex = images.indexOf(e.target.src);
        if (currentIndex === -1) currentIndex = 0;
        showImage(currentIndex);
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden';
      }
    });

    const closeLightbox = () => {
      lightbox.classList.remove('active');
      document.body.style.overflow = '';
    };

    if (close) close.addEventListener('click', closeLightbox);
    if (prevBtn) prevBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', (e) => { e.stopPropagation(); showImage(currentIndex + 1); });

    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') showImage(currentIndex - 1);
      if (e.key === 'ArrowRight') showImage(currentIndex + 1);
    });

    // Touch swipe support
    let touchStartX = 0;
    lightbox.addEventListener('touchstart', (e) => { touchStartX = e.changedTouches[0].screenX; });
    lightbox.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].screenX - touchStartX;
      if (Math.abs(diff) > 50) {
        if (diff > 0) showImage(currentIndex - 1);
        else showImage(currentIndex + 1);
      }
    });
  },

  // ---------- Init ----------
  init() {
    this.initNav();
    this.initLightbox();
  }
};

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
