// ===== HERO TYPING LOOP =====
function playHeroTyping() {
    const els = [
        document.querySelector('.type-line-1'),
        document.querySelector('.type-line-2'),
        document.querySelector('.title-accent'),
        document.querySelector('.hero-title .type-cursor')
    ].filter(Boolean);
    els.forEach(el => { el.style.animation = 'none'; });
    void document.body.offsetWidth; // force reflow so the animation can restart
    els.forEach(el => { el.style.animation = ''; });
}
setInterval(playHeroTyping, 7000);

// ===== THEME TOGGLE =====
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

function applyThemeState(theme) {
    const isDark = theme === 'dark';
    themeToggle.setAttribute('aria-pressed', String(isDark));
    themeToggle.setAttribute('aria-label', isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro');
}

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    html.setAttribute('data-theme', savedTheme);
    applyThemeState(savedTheme);
} else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    applyThemeState(prefersDark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
    const current = html.getAttribute('data-theme') ||
        (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    const next = current === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    localStorage.setItem('theme', next);
    applyThemeState(next);
});

// ===== MOBILE MENU =====
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('active');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
});

navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.setAttribute('aria-expanded', 'false');
    });
});

// ===== SMOOTH SCROLL (nav links + data-scroll-to buttons) =====
function scrollToId(id) {
    const target = document.getElementById(id);
    if (!target) return;
    const offset = 72;
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
        const href = anchor.getAttribute('href');
        if (href.length > 1 && document.querySelector(href)) {
            e.preventDefault();
            scrollToId(href.slice(1));
        }
    });
});

document.querySelectorAll('[data-scroll-to]').forEach(btn => {
    btn.addEventListener('click', () => scrollToId(btn.dataset.scrollTo));
});

// ===== FOOTER: SCROLL TO TOP =====
const scrollTopBtn = document.getElementById('scrollTopBtn');
if (scrollTopBtn) {
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}

// ===== SERVICES CAROUSEL (infinite loop, transform-driven) =====
const servicesTrack = document.getElementById('servicesTrack');
const servicesPrev = document.getElementById('servicesPrev');
const servicesNext = document.getElementById('servicesNext');

if (servicesTrack && servicesPrev && servicesNext) {
    const originalCards = Array.from(servicesTrack.children);
    const total = originalCards.length;
    const cloneCount = Math.min(2, total);
    const maxIndex = total + cloneCount * 2 - 1;

    // Clone the first/last cards to the opposite ends so the track can loop
    const headClones = originalCards.slice(0, cloneCount).map(n => n.cloneNode(true));
    const tailClones = originalCards.slice(-cloneCount).map(n => n.cloneNode(true));
    // Insert in reverse so the final order matches the source order (each insertBefore pushes to the front)
    tailClones.slice().reverse().forEach(n => { n.setAttribute('aria-hidden', 'true'); servicesTrack.insertBefore(n, servicesTrack.firstChild); });
    headClones.forEach(n => { n.setAttribute('aria-hidden', 'true'); servicesTrack.appendChild(n); });

    const getStep = () => {
        const card = servicesTrack.querySelector('.service-card');
        const style = getComputedStyle(servicesTrack);
        const gap = parseFloat(style.columnGap || style.gap) || 24;
        return (card ? card.offsetWidth : 260) + gap;
    };

    let position = cloneCount; // index into the full track (clones + real cards)

    // Move the track to `position`. animate=false jumps instantly (used for the silent loop reset).
    const render = (animate) => {
        if (!animate) servicesTrack.style.transition = 'none';
        servicesTrack.style.transform = `translateX(${-position * getStep()}px)`;
        if (!animate) {
            void servicesTrack.offsetWidth; // force reflow so the jump applies before re-enabling the transition
            servicesTrack.style.transition = '';
        }
    };
    render(false);

    const goTo = (index) => {
        position = Math.max(0, Math.min(maxIndex, index));
        render(true);
    };

    // Once the slide animation finishes, silently snap back into the real-card range if we're sitting on a clone
    servicesTrack.addEventListener('transitionend', (e) => {
        if (e.propertyName && e.propertyName !== 'transform') return;
        if (position < cloneCount) {
            position += total;
            render(false);
        } else if (position > cloneCount + total - 1) {
            position -= total;
            render(false);
        }
    });

    servicesPrev.addEventListener('click', () => goTo(position - 1));
    servicesNext.addEventListener('click', () => goTo(position + 1));

    window.addEventListener('resize', () => render(false));
}

// ===== PROJECT GALLERIES (scroll-snap image carousels) =====
document.querySelectorAll('[data-gallery]').forEach(gallery => {
    const track = gallery.querySelector('[data-gallery-track]');
    const slides = Array.from(track.children);
    const prevBtn = gallery.querySelector('[data-gallery-prev]');
    const nextBtn = gallery.querySelector('[data-gallery-next]');
    const dotsWrap = gallery.querySelector('[data-gallery-dots]');
    if (!track || !slides.length) return;

    const dots = slides.map((_, i) => {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'gallery-dot';
        dot.setAttribute('aria-label', `Ir a la imagen ${i + 1}`);
        dot.addEventListener('click', () => {
            slides[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        });
        dotsWrap.appendChild(dot);
        return dot;
    });
    dots[0].classList.add('is-active');

    const setActive = (index) => {
        dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
    };

    const dotObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                setActive(slides.indexOf(entry.target));
            }
        });
    }, { root: track, threshold: 0.6 });
    slides.forEach(slide => dotObserver.observe(slide));

    const scrollByOne = (dir) => {
        track.scrollBy({ left: dir * track.clientWidth, behavior: 'smooth' });
    };
    if (prevBtn) prevBtn.addEventListener('click', () => scrollByOne(-1));
    if (nextBtn) nextBtn.addEventListener('click', () => scrollByOne(1));
});

// ===== PROCESS TIMELINE (horizontal stepper + panel) =====
const processTimeline = document.getElementById('processTimeline');
const processLineFill = document.getElementById('processLineFill');
const processDots = Array.from(document.querySelectorAll('.stepper-dot'));
const processPrev = document.getElementById('processPrev');
const processNext = document.getElementById('processNext');
const processPanel = document.getElementById('processPanel');
const processStepIndex = document.getElementById('processStepIndex');
const processStepTitle = document.getElementById('processStepTitle');
const processStepDesc = document.getElementById('processStepDesc');
const processStepsData = document.getElementById('processStepsData');

if (processTimeline && processLineFill && processDots.length && processStepsData) {
    const titles = processStepsData.dataset.titles.split(',');
    const descs = processStepsData.dataset.descs.split('|||');
    let activeStep = 0;
    let panelToken = 0; // invalidates a pending swap if a newer click comes in first

    const setActiveStep = (index) => {
        activeStep = Math.max(0, Math.min(processDots.length - 1, index));
        processDots.forEach((dot, i) => dot.classList.toggle('is-active', i === activeStep));

        const pct = (activeStep / (processDots.length - 1)) * 100;
        processLineFill.style.width = pct + '%';

        if (processPanel) {
            const myToken = ++panelToken;
            processPanel.style.opacity = '0';
            processPanel.style.transform = 'translateY(6px)';
            setTimeout(() => {
                if (myToken !== panelToken) return; // superseded by a later click, skip this swap
                processStepIndex.textContent = String(activeStep + 1).padStart(2, '0');
                processStepTitle.textContent = titles[activeStep];
                processStepDesc.textContent = descs[activeStep];
                processPanel.style.opacity = '1';
                processPanel.style.transform = 'translateY(0)';
            }, 160);
        }
    };

    processDots.forEach((dot, i) => dot.addEventListener('click', () => setActiveStep(i)));
    if (processPrev) processPrev.addEventListener('click', () => setActiveStep(activeStep - 1));
    if (processNext) processNext.addEventListener('click', () => setActiveStep(activeStep + 1));

    setActiveStep(0);
}

// ===== SCROLL REVEAL =====
const revealTargets = document.querySelectorAll(
    '.section-split, .services-carousel, .process-timeline, .project-card, .statement-box, .coming-box, .contact-content'
);
revealTargets.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -80px 0px' });

revealTargets.forEach(el => observer.observe(el));

// ===== NAVBAR ELEVATION ON SCROLL =====
// toggles a class instead of writing inline styles every scroll tick —
// constantly restyling the blurred/rounded sticky bar was causing a
// flicker/glitch on scroll in some browsers
const navbarEl = document.getElementById('navbar');
if (navbarEl) {
    let navScrolled = false;
    window.addEventListener('scroll', () => {
        const shouldElevate = window.scrollY > 40;
        if (shouldElevate !== navScrolled) {
            navScrolled = shouldElevate;
            navbarEl.classList.toggle('is-scrolled', shouldElevate);
        }
    }, { passive: true });
}

// ===== GALLERY MODAL =====
const galleryModal = document.getElementById('galleryModal');
const galleryImage = document.getElementById('galleryImage');
const galleryOverlay = document.getElementById('galleryOverlay');
const galleryClose = document.getElementById('galleryClose');
const galleryPrev = document.getElementById('galleryPrev');
const galleryNext = document.getElementById('galleryNext');
const galleryCounter = document.getElementById('galleryCounter');
const galleryTotal = document.getElementById('galleryTotal');

let currentGalleryImages = [];
let currentGalleryIndex = 0;

document.querySelectorAll('[data-gallery-trigger]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
        e.preventDefault();
        const gallerySource = trigger.closest('.project-preview').parentElement.querySelector('[data-gallery-source]');
        if (gallerySource) {
            currentGalleryImages = Array.from(gallerySource.querySelectorAll('img')).map(img => ({
                src: img.src,
                alt: img.alt
            }));
            if (currentGalleryImages.length > 0) {
                currentGalleryIndex = 0;
                updateGalleryModal();
                galleryModal.hidden = false;
                document.body.style.overflow = 'hidden';
            }
        }
    });
});

function updateGalleryModal() {
    if (currentGalleryImages.length === 0) return;
    const img = currentGalleryImages[currentGalleryIndex];
    galleryImage.src = img.src;
    galleryImage.alt = img.alt;
    galleryCounter.textContent = currentGalleryIndex + 1;
    galleryTotal.textContent = currentGalleryImages.length;
}

galleryClose.addEventListener('click', closeGallery);
galleryOverlay.addEventListener('click', closeGallery);

function closeGallery() {
    galleryModal.hidden = true;
    document.body.style.overflow = '';
}

galleryPrev.addEventListener('click', () => {
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length;
    updateGalleryModal();
});

galleryNext.addEventListener('click', () => {
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryImages.length;
    updateGalleryModal();
});

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (galleryModal.hidden) return;
    if (e.key === 'Escape') closeGallery();
    if (e.key === 'ArrowLeft') galleryPrev.click();
    if (e.key === 'ArrowRight') galleryNext.click();
});

console.log('✦ Portfolio de Jazmín Bustos cargado');
