const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const reveals = $$('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.07 });
reveals.forEach((item) => revealObserver.observe(item));

const navLinks = $$('.nav-link');
const sections = $$('main section[id]');
const navObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === `#${visible.target.id}`);
  });
}, { rootMargin: '-22% 0px -63%', threshold: [0.05, 0.25, 0.5] });
sections.forEach((section) => navObserver.observe(section));

const closeSubnavs = (except = null) => {
  $$('.nav-item.open').forEach((item) => {
    if (item === except) return;
    item.classList.remove('open');
    item.querySelector('.has-subnav')?.setAttribute('aria-expanded', 'false');
  });
};

$$('.has-subnav').forEach((trigger) => {
  trigger.addEventListener('click', (event) => {
    event.preventDefault();
    const item = trigger.closest('.nav-item');
    const willOpen = !item.classList.contains('open');
    closeSubnavs(item);
    item.classList.toggle('open', willOpen);
    trigger.setAttribute('aria-expanded', String(willOpen));
  });
});

$$('.subnav a').forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.forEach((item) => item.classList.remove('active'));
    link.closest('.nav-item')?.querySelector('.nav-link')?.classList.add('active');
    closeSubnavs();
  });
});

document.addEventListener('click', (event) => {
  if (!event.target.closest('.nav-item')) closeSubnavs();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeSubnavs();
});

$$('.media-rail').forEach((rail) => {
  const shell = rail.closest('.rail-shell');
  const amount = () => Math.min(rail.clientWidth * 0.82, 560);
  shell?.querySelector('.rail-prev')?.addEventListener('click', () => rail.scrollBy({ left: -amount(), behavior: 'smooth' }));
  shell?.querySelector('.rail-next')?.addEventListener('click', () => rail.scrollBy({ left: amount(), behavior: 'smooth' }));

  rail.addEventListener('wheel', (event) => {
    if (rail.scrollWidth <= rail.clientWidth || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    const atStart = rail.scrollLeft <= 0 && event.deltaY < 0;
    const atEnd = Math.ceil(rail.scrollLeft + rail.clientWidth) >= rail.scrollWidth && event.deltaY > 0;
    if (atStart || atEnd) return;
    event.preventDefault();
    rail.scrollLeft += event.deltaY;
  }, { passive: false });

  let dragging = false;
  let startX = 0;
  let startScroll = 0;
  rail.addEventListener('pointerdown', (event) => {
    if (event.target.closest('button,a,video')) return;
    dragging = true;
    startX = event.clientX;
    startScroll = rail.scrollLeft;
    rail.setPointerCapture(event.pointerId);
  });
  rail.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    rail.scrollLeft = startScroll - (event.clientX - startX);
  });
  rail.addEventListener('pointerup', () => { dragging = false; });
  rail.addEventListener('pointercancel', () => { dragging = false; });
});

function stopOtherVideos(except) {
  $$('.video-card video').forEach((video) => {
    if (video !== except) video.pause();
  });
}

$$('.video-launch').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.video-card');
    const player = document.createElement('video');
    player.controls = true;
    player.playsInline = true;
    player.preload = 'metadata';
    player.poster = card.dataset.poster || '';
    player.src = card.dataset.videoSrc;
    player.setAttribute('controlsList', 'nodownload');
    card.classList.add('playing');
    card.replaceChildren(player);
    stopOtherVideos(player);
    player.play().catch(() => {});
  });
});

const lightbox = document.querySelector('.lightbox');
const stage = document.querySelector('.lightbox-stage');
const counter = document.querySelector('.lightbox-count');
const caption = document.querySelector('.lightbox-caption');
let mediaItems = [];
let currentIndex = 0;

function renderLightbox() {
  const item = mediaItems[currentIndex];
  if (!item) return;
  const content = document.createElement('img');
  content.alt = item.querySelector('img')?.alt || '作品预览';
  content.src = item.dataset.src;
  stage.replaceChildren(content);
  counter.textContent = `${currentIndex + 1} / ${mediaItems.length}`;
  caption.textContent = item.querySelector('em')?.textContent || item.getAttribute('aria-label') || '作品预览';
}

function openLightbox(item) {
  mediaItems = $$('.media-open');
  currentIndex = Math.max(0, mediaItems.indexOf(item));
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
  renderLightbox();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
  stage.replaceChildren();
}

function moveLightbox(direction) {
  if (!mediaItems.length) return;
  currentIndex = (currentIndex + direction + mediaItems.length) % mediaItems.length;
  renderLightbox();
}

$$('.media-open').forEach((item) => item.addEventListener('click', () => openLightbox(item)));
document.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
document.querySelector('.lightbox-nav.prev')?.addEventListener('click', () => moveLightbox(-1));
document.querySelector('.lightbox-nav.next')?.addEventListener('click', () => moveLightbox(1));
lightbox?.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener('keydown', (event) => {
  if (!lightbox?.classList.contains('open')) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') moveLightbox(-1);
  if (event.key === 'ArrowRight') moveLightbox(1);
});

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  reveals.forEach((item) => item.classList.add('visible'));
}
