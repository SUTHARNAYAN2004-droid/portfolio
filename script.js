// ===================== LOADER =====================
window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) setTimeout(() => loader.classList.add('hide'), 1200);
});

// ===================== CUSTOM CURSOR =====================
const cursor = document.querySelector('.cursor');
const follower = document.querySelector('.cursor-follower');
let mouseX = 0, mouseY = 0, followerX = 0, followerY = 0;

if (cursor && follower) {
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX; mouseY = e.clientY;
    cursor.style.left = mouseX + 'px';
    cursor.style.top  = mouseY + 'px';
  });

  function animateFollower() {
    followerX += (mouseX - followerX) * 0.12;
    followerY += (mouseY - followerY) * 0.12;
    follower.style.left = followerX + 'px';
    follower.style.top  = followerY + 'px';
    requestAnimationFrame(animateFollower);
  }
  animateFollower();

  document.querySelectorAll('a, button, .filter-btn, .skill-card, .portfolio-card, .gallery-item').forEach(el => {
    el.addEventListener('mouseenter', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(2)';
      follower.style.width = '60px'; follower.style.height = '60px';
    });
    el.addEventListener('mouseleave', () => {
      cursor.style.transform = 'translate(-50%,-50%) scale(1)';
      follower.style.width = '36px'; follower.style.height = '36px';
    });
  });
}

// ===================== NAVBAR =====================
const navbar    = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
    const btn = document.getElementById('backToTop');
    if (btn) btn.classList.toggle('show', window.scrollY > 400);
    updateActiveNav();
  });
}

if (hamburger && mobileMenu) {
  hamburger.addEventListener('click', () => {
    mobileMenu.classList.toggle('open');
    hamburger.classList.toggle('active');
  });
  document.querySelectorAll('.mob-link').forEach(link => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      hamburger.classList.remove('active');
    });
  });
}

function updateActiveNav() {
  const sections  = document.querySelectorAll('section[id]');
  const scrollPos = window.scrollY + 100;
  sections.forEach(section => {
    const top    = section.offsetTop;
    const bottom = top + section.offsetHeight;
    const navLink = document.querySelector(`.nav-link[href="#${section.id}"]`);
    if (navLink) navLink.classList.toggle('active', scrollPos >= top && scrollPos < bottom);
  });
}

// ===================== PARTICLES =====================
const particlesContainer = document.getElementById('particles');
if (particlesContainer) {
  function createParticle() {
    const p = document.createElement('div');
    p.className = 'particle';
    p.style.left = Math.random() * 100 + '%';
    p.style.bottom = '0';
    const size = Math.random() * 4 + 2;
    p.style.width = size + 'px'; p.style.height = size + 'px';
    const duration = Math.random() * 8 + 5;
    p.style.animationDuration = duration + 's';
    p.style.animationDelay   = Math.random() * 3 + 's';
    particlesContainer.appendChild(p);
    setTimeout(() => p.remove(), (duration + 3) * 1000);
  }
  setInterval(createParticle, 400);
}

// ===================== COUNTER ANIMATION =====================
function animateCounters() {
  document.querySelectorAll('.stat-num').forEach(counter => {
    const target = parseInt(counter.dataset.target);
    let count = 0;
    const step  = target / 60;
    const timer = setInterval(() => {
      count += step;
      if (count >= target) { counter.textContent = target; clearInterval(timer); }
      else counter.textContent = Math.floor(count);
    }, 30);
  });
}

// ===================== SKILL BARS =====================
function animateSkillBars() {
  document.querySelectorAll('.skill-fill').forEach(bar => {
    bar.style.width = bar.dataset.width + '%';
  });
}

// ===================== SCROLL REVEAL =====================
const revealEls = document.querySelectorAll('.skill-card, .portfolio-card, .gallery-item, .process-step, .info-card, .about-content, .about-image-wrap');
revealEls.forEach(el => el.classList.add('reveal'));
let countersAnimated = false, skillsAnimated = false;

const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.15 });
revealEls.forEach(el => observer.observe(el));

const heroStats = document.querySelector('.hero-stats');
if (heroStats) {
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !countersAnimated) {
      animateCounters(); countersAnimated = true;
    }
  }, { threshold: 0.5 }).observe(heroStats);
}

const skillsGrid = document.querySelector('.skills-grid');
if (skillsGrid) {
  new IntersectionObserver(entries => {
    if (entries[0].isIntersecting && !skillsAnimated) {
      animateSkillBars(); skillsAnimated = true;
    }
  }, { threshold: 0.3 }).observe(skillsGrid);
}

// ===================== PORTFOLIO GRID (homepage) — 1 image + gallery CTA =====================
const portfolioGrid = document.getElementById('portfolioGrid');
if (portfolioGrid) {
  async function loadPortfolio() {
    try {
      const res  = await fetch('/api/gallery');
      const data = await res.json();
      if (!data.photos.length) {
        portfolioGrid.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem">No photos yet.</p>';
        return;
      }
      // Show only the first image with a "Go to Gallery" overlay button
      const p = data.photos[0];
      portfolioGrid.innerHTML = `
        <div class="portfolio-preview-wrap">
          <div class="portfolio-preview-img">
            <img src="${p.src}" alt="${p.title || 'Woodwork'}" loading="lazy"/>
            <div class="portfolio-preview-overlay">
              <p class="preview-count">+${data.photos.length} photos in gallery</p>
              <a href="/gallery" class="btn-primary preview-gallery-btn">
                <i class="fas fa-images"></i>
                <span>View Full Gallery</span>
              </a>
            </div>
          </div>
        </div>`;
    } catch (e) {
      portfolioGrid.innerHTML = '<p style="text-align:center;color:var(--text-light);padding:2rem">Could not load photos.</p>';
    }
  }
  loadPortfolio();
}

// ===================== PORTFOLIO FILTER (static items) =====================
const filterBtns = document.querySelectorAll('.filter-btn');
filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;
    document.querySelectorAll('.portfolio-item').forEach(item => {
      item.style.display = (filter === 'all' || item.dataset.category === filter) ? '' : 'none';
    });
  });
});

// ===================== LIGHTBOX =====================
function initLightbox(items) {
  const lightbox = document.getElementById('lightbox');
  const lbImg    = document.getElementById('lbImg');
  const lbCaption = document.getElementById('lbCaption');
  if (!lightbox || !lbImg) return;

  let currentIndex = 0;

  function openLightbox(index) {
    currentIndex = index;
    lbImg.src = items[index].src;
    if (lbCaption) lbCaption.textContent = items[index].title || '';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
  }
  function showNext() { openLightbox((currentIndex + 1) % items.length); }
  function showPrev() { openLightbox((currentIndex - 1 + items.length) % items.length); }

  document.querySelectorAll('.gallery-item').forEach((el, i) => {
    el.addEventListener('click', () => openLightbox(i));
  });

  const closeBtn = document.getElementById('lbClose');
  const prevBtn  = document.getElementById('lbPrev');
  const nextBtn  = document.getElementById('lbNext');
  if (closeBtn) closeBtn.addEventListener('click', closeLightbox);
  if (prevBtn)  prevBtn.addEventListener('click',  showPrev);
  if (nextBtn)  nextBtn.addEventListener('click',  showNext);

  lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', e => {
    if (!lightbox.classList.contains('active')) return;
    if (e.key === 'Escape')     closeLightbox();
    if (e.key === 'ArrowRight') showNext();
    if (e.key === 'ArrowLeft')  showPrev();
  });
}

// ===================== GALLERY PAGE =====================
const galleryPageGrid = document.getElementById('galleryPageGrid');
if (galleryPageGrid) {
  async function loadGalleryPage() {
    try {
      const res  = await fetch('/api/gallery');
      const data = await res.json();
      if (!data.photos.length) {
        galleryPageGrid.innerHTML = '<p class="gallery-empty">No photos yet.</p>';
        return;
      }
      galleryPageGrid.innerHTML = data.photos.map((p, i) => `
        <div class="gallery-item" data-category="${p.category || 'furniture'}" data-index="${i}">
          <img src="${p.src}" alt="${p.title}" loading="lazy"/>
          <div class="gallery-item-overlay"><span>${p.title || 'Woodwork'}</span></div>
        </div>`).join('');

      // cursor hover on newly created items
      if (cursor && follower) {
        document.querySelectorAll('.gallery-item').forEach(el => {
          el.addEventListener('mouseenter', () => {
            cursor.style.transform = 'translate(-50%,-50%) scale(2)';
            follower.style.width = '60px'; follower.style.height = '60px';
          });
          el.addEventListener('mouseleave', () => {
            cursor.style.transform = 'translate(-50%,-50%) scale(1)';
            follower.style.width = '36px'; follower.style.height = '36px';
          });
        });
      }

      // init lightbox
      initLightbox(data.photos.map(p => ({ src: p.src, title: p.title })));

      // filter
      document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          const f = btn.dataset.filter;
          document.querySelectorAll('.gallery-item').forEach(item => {
            item.style.display = (f === 'all' || item.dataset.category === f) ? '' : 'none';
          });
        });
      });
    } catch (e) {
      galleryPageGrid.innerHTML = '<p class="gallery-empty">Could not load gallery.</p>';
    }
  }
  loadGalleryPage();
}

// ===================== BACK TO TOP =====================
const backToTopBtn = document.getElementById('backToTop');
if (backToTopBtn) {
  backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ===================== SMOOTH SCROLL =====================
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
  });
});

// ===================== HIRE ME BUTTON =====================
const hireBtn = document.querySelector('.hire-btn');
if (hireBtn) {
  hireBtn.addEventListener('click', () => {
    const contact = document.querySelector('#contact');
    if (contact) contact.scrollIntoView({ behavior: 'smooth' });
  });
}

// ===================== TILT EFFECT =====================
document.querySelectorAll('[data-tilt]').forEach(card => {
  card.addEventListener('mousemove', e => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `translateY(-8px) rotateX(${-y * 8}deg) rotateY(${x * 8}deg)`;
  });
  card.addEventListener('mouseleave', () => { card.style.transform = ''; });
});

// ===================== LANGUAGE TOGGLE =====================
(function () {
  let currentLang = 'en';
  const langToggle = document.getElementById('langToggle');
  if (!langToggle) return;

  const langEnSpan = langToggle.querySelector('.lang-en');
  const langGuSpan = langToggle.querySelector('.lang-gu');

  function applyLanguage(lang) {
    currentLang = lang;
    document.documentElement.setAttribute('data-lang', lang);

    document.querySelectorAll('[data-en]').forEach(el => {
      const text = lang === 'gu' ? el.getAttribute('data-gu') : el.getAttribute('data-en');
      if (!text) return;
      if (el.children.length === 0) {
        el.textContent = text;
      } else {
        const firstTextNode = [...el.childNodes].find(
          n => n.nodeType === 3 && n.textContent.trim() !== ''
        );
        if (firstTextNode) {
          const trailingSpace = firstTextNode.textContent.endsWith(' ') ? ' ' : '';
          firstTextNode.textContent = text + trailingSpace;
        } else {
          el.insertBefore(document.createTextNode(text + ' '), el.firstChild);
        }
      }
    });

    if (lang === 'gu') {
      langGuSpan.style.color = 'var(--gold)';      langGuSpan.style.fontWeight = '700';
      langEnSpan.style.color = 'rgba(255,255,255,0.5)'; langEnSpan.style.fontWeight = '400';
    } else {
      langEnSpan.style.color = 'var(--gold)';      langEnSpan.style.fontWeight = '700';
      langGuSpan.style.color = 'rgba(255,255,255,0.5)'; langGuSpan.style.fontWeight = '400';
    }
  }

  langToggle.addEventListener('click', () => applyLanguage(currentLang === 'en' ? 'gu' : 'en'));
  applyLanguage('en');
})();
