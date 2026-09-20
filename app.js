const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const projectSection = document.querySelector('#projects');
const campusExperience = document.querySelector('[data-project="campus"]');
const experienceSection = document.querySelector('#experience');

if (campusExperience && experienceSection) {
  campusExperience.classList.add('section', 'campus-standalone');
  campusExperience.removeAttribute('data-project');
  experienceSection.insertAdjacentElement('afterend', campusExperience);
}

if (projectSection) {
  ['nio', 'miniso', 'zhifei', 'panda', 'practice'].forEach((project) => {
    const block = projectSection.querySelector(`[data-project="${project}"]`);
    if (block) projectSection.appendChild(block);
  });
}

const reveals = $$('.reveal');
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 });
reveals.forEach((item) => revealObserver.observe(item));

const navLinks = $$('.nav-link');
const sections = $$('main section[id]');
const navObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting)
    .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  navLinks.forEach((link) => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + visible.target.id);
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
    const project = link.hash.replace('#project-', '');
    const projectButton = document.querySelector(`[data-project-filter="${project}"]`);
    if (link.hash.startsWith('#project-') && projectButton) projectButton.click();
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

$$('.project-tab').forEach((button) => {
  button.addEventListener('click', () => {
    $$('.project-tab').forEach((item) => item.classList.remove('active'));
    button.classList.add('active');
    const filter = button.dataset.projectFilter;
    $$('.project-block', projectSection).forEach((project) => {
      project.classList.toggle('hidden', filter !== 'all' && project.dataset.project !== filter);
    });
  });
});

$$('.more-media').forEach((details) => {
  details.addEventListener('toggle', () => {
    if (!details.open) return;
    const peers = details.classList.contains('exp-details') ? $$('.exp-details') : [];
    peers.forEach((peer) => {
      if (peer !== details) peer.open = false;
    });
  });
});

const lightbox = document.querySelector('.lightbox');
const stage = document.querySelector('.lightbox-stage');
const counter = document.querySelector('.lightbox-count');
const caption = document.querySelector('.lightbox-caption');
let mediaItems = [];
let currentIndex = 0;

function visibleMediaItems() {
  return $$('.media-open').filter((item) => {
    const project = item.closest('.project-block');
    const details = item.closest('details');
    return (!project || !project.classList.contains('hidden')) && (!details || details.open);
  });
}

function renderLightbox() {
  const item = mediaItems[currentIndex];
  if (!item) return;
  stage.innerHTML = '';
  const type = item.dataset.type;
  let content;
  if (type === 'video') {
    content = document.createElement('video');
    content.controls = true;
    content.playsInline = true;
    content.preload = 'metadata';
    content.poster = item.querySelector('img')?.src || '';
    const source = document.createElement('source');
    source.src = item.dataset.src;
    source.type = 'video/mp4';
    content.appendChild(source);
  } else {
    content = document.createElement('img');
    content.alt = item.querySelector('img')?.alt || '作品预览';
    content.src = item.dataset.src;
  }
  stage.appendChild(content);
  if (type === 'video') {
    content.play().catch(() => {});
  }
  counter.textContent = `${currentIndex + 1} / ${mediaItems.length}`;
  caption.textContent = item.querySelector('em')?.textContent || item.getAttribute('aria-label') || '作品预览';
}

function openLightbox(item) {
  mediaItems = visibleMediaItems();
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
  stage.innerHTML = '';
}

function moveLightbox(direction) {
  if (!mediaItems.length) return;
  currentIndex = (currentIndex + direction + mediaItems.length) % mediaItems.length;
  renderLightbox();
}

$$('.media-open').forEach((item) => item.addEventListener('click', () => openLightbox(item)));
document.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
document.querySelector('.lightbox-nav.prev').addEventListener('click', () => moveLightbox(-1));
document.querySelector('.lightbox-nav.next').addEventListener('click', () => moveLightbox(1));
lightbox.addEventListener('click', (event) => {
  if (event.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (event) => {
  if (!lightbox.classList.contains('open')) return;
  if (event.key === 'Escape') closeLightbox();
  if (event.key === 'ArrowLeft') moveLightbox(-1);
  if (event.key === 'ArrowRight') moveLightbox(1);
});

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  reveals.forEach((item) => item.classList.add('visible'));
}
