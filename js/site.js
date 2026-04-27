/* ═══════════════════════════════════════════════════════════
   Spielgruppe Seon – site.js
   Handles: banner, nav, reveal animations, events slider,
            gallery autoslider, form validation, data loading
═══════════════════════════════════════════════════════════ */

'use strict';

/* ─── helpers ─── */
const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

const WEB3FORMS_URL = 'https://api.web3forms.com/submit';

/* ══════════════════════════════════════════════════════════
   1. SETTINGS  (loads from _data/settings.json)
══════════════════════════════════════════════════════════ */
async function loadSettings() {
  try {
    const res = await fetch('_data/settings.json');
    if (!res.ok) return;
    const d = await res.json();

    if (d.web3formsKey) {
      document.querySelectorAll('input[name="access_key"]').forEach(el => { el.value = d.web3formsKey; });
    }
    if (d.logoImage) {
      const icon = document.getElementById('site-logo-icon');
      const img  = document.getElementById('site-logo-img');
      if (icon) icon.style.display = 'none';
      if (img)  { img.src = d.logoImage; img.classList.remove('hidden'); }
    }
    if (d.ueber_uns_image) {
      const wrap = document.getElementById('ueber-uns-img-wrap');
      if (wrap) wrap.innerHTML = `<img src="${d.ueber_uns_image}" alt="Spielgruppe Seon" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />`;
    }
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════
   2. BANNER  (loads from _data/banner.json)
══════════════════════════════════════════════════════════ */
async function loadBanner() {
  try {
    const res = await fetch('_data/banner.json');
    if (!res.ok) return;
    const data = await res.json();
    const banner = $('#top-banner');
    if (!data.visible || !banner) return;

    $('#banner-text').textContent = data.text;
    const btn = $('#banner-btn');
    btn.textContent = data.buttonText;
    btn.href = data.buttonUrl;
    banner.classList.remove('hidden');
    banner.style.display = 'flex';

    adjustNavTop();

    $('#banner-close').addEventListener('click', () => {
      banner.style.display = 'none';
      adjustNavTop();
    });
  } catch (e) { /* silently skip if file unavailable locally */ }
}

/* ══════════════════════════════════════════════════════════
   2. NAVIGATION
══════════════════════════════════════════════════════════ */
const navbar = $('#navbar');

function adjustNavTop() {
  const banner = $('#top-banner');
  const bannerH = (banner && banner.style.display !== 'none' && !banner.classList.contains('hidden'))
    ? banner.offsetHeight : 0;
  navbar.style.top = bannerH + 'px';
  const mobileMenu = $('#mobile-menu');
  if (mobileMenu) mobileMenu.style.paddingTop = (bannerH + 90) + 'px';
}

window.adjustNavTop = adjustNavTop;
adjustNavTop();
window.addEventListener('resize', adjustNavTop);

window.addEventListener('scroll', () => {
  navbar.classList.toggle('shadow-md', window.scrollY > 20);
});

/* hamburger */
const hamburgerBtn = $('#hamburger-btn');
const mobileMenu = $('#mobile-menu');
hamburgerBtn?.addEventListener('click', () => {
  mobileMenu.classList.toggle('hidden');
  mobileMenu.classList.toggle('flex');
});

window.closeMobileMenu = () => {
  mobileMenu?.classList.add('hidden');
  mobileMenu?.classList.remove('flex');
};

/* close mobile menu on outside tap */
document.addEventListener('click', e => {
  if (!mobileMenu?.classList.contains('flex')) return;
  if (!mobileMenu.contains(e.target) && !hamburgerBtn.contains(e.target)) {
    window.closeMobileMenu();
  }
});

/* active nav link on scroll */
(function initActiveNav() {
  const sections = $$('section[id], header[id]');
  const links = $$('.nav-link');
  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        links.forEach(l => l.classList.remove('active'));
        const active = links.find(l => l.getAttribute('href') === '#' + entry.target.id);
        active?.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -55% 0px' });
  sections.forEach(s => io.observe(s));
})();

/* ══════════════════════════════════════════════════════════
   3. REVEAL ANIMATIONS  (IntersectionObserver)
══════════════════════════════════════════════════════════ */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

$$('.reveal').forEach(el => revealObserver.observe(el));

/* ══════════════════════════════════════════════════════════
   4. EVENTS SLIDER  (loads from _data/events.json)
══════════════════════════════════════════════════════════ */

/* color mappings */
const EVENT_COLORS = {
  sage:  { bar: 'oklch(0.64 0.09 148)', badge: 'background:oklch(0.88 0.05 148);color:oklch(0.48 0.09 148)', btn: 'background:oklch(0.64 0.09 148);color:#fff' },
  terra: { bar: 'oklch(0.62 0.11 42)',  badge: 'background:oklch(0.90 0.05 42);color:oklch(0.55 0.11 42)',   btn: 'background:oklch(0.62 0.11 42);color:#fff' },
  honey: { bar: 'oklch(0.84 0.11 88)',  badge: 'background:oklch(0.95 0.06 88);color:oklch(0.50 0.10 88)',   btn: 'background:oklch(0.84 0.11 88);color:oklch(0.26 0.02 85)' },
};

function buildEventCard(ev) {
  const c = EVENT_COLORS[ev.color] || EVENT_COLORS.sage;
  const note = ev.note ? `<p style="font-size:.82rem;font-weight:700;color:oklch(0.62 0.11 42);font-style:italic;">${ev.note}</p>` : '';
  const btn  = ev.showButton && ev.buttonText
    ? `<div style="margin-top:4px;"><a href="${ev.buttonUrl}" style="display:inline-flex;align-items:center;${c.btn};font-weight:700;border-radius:999px;padding:9px 20px;font-size:.85rem;font-family:inherit;text-decoration:none;transition:opacity .2s;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">${ev.buttonText}</a></div>` : '';
  return `
    <div style="scroll-snap-align:start;flex:0 0 340px;background:#fff;border-radius:20px;padding:32px;box-shadow:0 2px 8px oklch(0.26 0.02 85 / .08);border:1.5px solid oklch(0.93 0.02 85);position:relative;display:flex;flex-direction:column;gap:12px;transition:box-shadow .2s,transform .2s;"
         onmouseover="this.style.boxShadow='0 6px 24px oklch(0.26 0.02 85 / .12)';this.style.transform='translateY(-2px)'"
         onmouseout="this.style.boxShadow='0 2px 8px oklch(0.26 0.02 85 / .08)';this.style.transform=''">
      <div style="position:absolute;top:0;left:0;right:0;height:4px;border-radius:20px 20px 0 0;background:${c.bar};"></div>
      <span style="display:inline-flex;align-items:center;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 10px;border-radius:999px;width:fit-content;${c.badge}">${ev.title}</span>
      <div style="font-family:'Baloo 2',sans-serif;font-size:1.5rem;font-weight:800;color:oklch(0.26 0.02 85);line-height:1.2;">${ev.date}</div>
      <div style="display:flex;flex-direction:column;gap:4px;">
        <div style="display:flex;align-items:center;gap:8px;font-size:.85rem;color:oklch(0.45 0.02 85);font-weight:600;">
          <span style="width:18px;text-align:center;">🕐</span>${ev.time}
        </div>
        <div style="display:flex;align-items:center;gap:8px;font-size:.85rem;color:oklch(0.45 0.02 85);font-weight:600;">
          <span style="width:18px;text-align:center;">📍</span>${ev.location}
        </div>
      </div>
      <p style="font-size:.88rem;color:oklch(0.45 0.02 85);line-height:1.65;flex:1;">${ev.description}</p>
      ${note}
      ${btn}
    </div>`;
}

async function loadEvents() {
  const slider = $('#events-slider');
  const dotsWrap = $('#events-dots');
  if (!slider) return;

  let events = [];
  try {
    const res = await fetch('_data/events.json');
    if (res.ok) {
      const data = await res.json();
      events = data.events || [];
    }
  } catch (e) { /* use empty fallback */ }

  if (!events.length) {
    slider.innerHTML = '<p style="padding:24px;color:oklch(0.45 0.02 85);">Keine Events vorhanden.</p>';
    return;
  }

  slider.innerHTML = events.map(buildEventCard).join('');
  initEventsSlider(slider, dotsWrap);
}

function initEventsSlider(slider, dotsWrap) {
  const cards = $$('[style*="scroll-snap-align"]', slider);
  let current = 0;

  dotsWrap.innerHTML = '';
  cards.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Event ' + (i + 1));
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, cards.length - 1));
    cards[current].scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    slider.scrollTo({ left: cards[current].offsetLeft - 24, behavior: 'smooth' });
    $$('.slider-dot', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === current));
  }

  $('#events-prev')?.addEventListener('click', () => goTo(current - 1));
  $('#events-next')?.addEventListener('click', () => goTo(current + 1));

  let scrollTimer;
  slider.addEventListener('scroll', () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      let closest = 0, minDist = Infinity;
      cards.forEach((c, i) => {
        const dist = Math.abs(c.offsetLeft - slider.scrollLeft - 24);
        if (dist < minDist) { minDist = dist; closest = i; }
      });
      current = closest;
      $$('.slider-dot', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === current));
    }, 80);
  });
}

/* ══════════════════════════════════════════════════════════
   5. GALLERY AUTOSLIDER  (static slides, JS-driven from gallery.json)
══════════════════════════════════════════════════════════ */
async function loadGallery() {
  const track = $('#gallery-track');
  const dotsWrap = $('#gallery-dots');
  if (!track) return;

  // try to load real photos from gallery.json
  try {
    const res = await fetch('_data/gallery.json');
    if (res.ok) {
      const data = await res.json();
      const photos = (data.photos || []).filter(p => p.src);
      if (photos.length) {
        // replace placeholder slides with real images
        track.innerHTML = photos.map(p =>
          `<div class="gallery-slide" style="flex:0 0 100%;height:420px;position:relative;overflow:hidden;">
            <img src="${p.src}" alt="${p.alt}" style="width:100%;height:100%;object-fit:cover;" loading="lazy" />
          </div>`
        ).join('');
      }
    }
  } catch (e) { /* keep placeholder slides */ }

  initGallery(track, dotsWrap);
}

function initGallery(track, dotsWrap) {
  const slides = $$('.gallery-slide', track);
  if (!slides.length) return;

  let current = 0;
  let timer;

  dotsWrap.innerHTML = '';
  slides.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', 'Bild ' + (i + 1));
    dot.addEventListener('click', () => { goTo(i); resetTimer(); });
    dotsWrap.appendChild(dot);
  });

  function goTo(idx) {
    current = ((idx % slides.length) + slides.length) % slides.length;
    track.style.transform = `translateX(-${current * 100}%)`;
    $$('.slider-dot', dotsWrap).forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function resetTimer() {
    clearInterval(timer);
    timer = setInterval(() => goTo(current + 1), 3800);
  }

  resetTimer();
  track.addEventListener('mouseenter', () => clearInterval(timer));
  track.addEventListener('mouseleave', resetTimer);

  /* touch swipe */
  let startX = 0;
  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) { goTo(dx < 0 ? current + 1 : current - 1); resetTimer(); }
  }, { passive: true });
}

/* ══════════════════════════════════════════════════════════
   6. CONTACT DATA  (loads from _data/contact.json)
══════════════════════════════════════════════════════════ */
async function loadContactData() {
  try {
    const res = await fetch('_data/contact.json');
    if (!res.ok) return;
    const d = await res.json();

    /* email */
    if (d.email) {
      const emailEl = $('#kontakt-email');
      if (emailEl) { emailEl.textContent = d.email; emailEl.href = 'mailto:' + d.email; }
    }
    /* tel */
    if (d.tel) {
      const telEl = $('#kontakt-tel');
      if (telEl) { telEl.textContent = d.tel; telEl.href = 'tel:' + d.tel.replace(/\s/g, ''); }
    }
    /* address */
    if (d.address) {
      const addrEl = $('#kontakt-adresse');
      if (addrEl) addrEl.innerHTML = `${d.address.street}<br />${d.address.city}`;
    }
    /* kontakt heading */
    if (d.kontakt_heading) {
      const h = document.getElementById('kontakt-heading');
      if (h) h.textContent = d.kontakt_heading;
    }
    /* zeiten */
    if (d.zeiten) {
      const z = document.getElementById('kontakt-zeiten');
      if (z) z.innerHTML = `${d.zeiten.tage}<br />Morgen: ${d.zeiten.morgen}<br />Nachmittag: ${d.zeiten.nachmittag}`;
    }
    /* team */
    if (d.dina) {
      const info = $('#team-info');
      if (info) {
        const nameEl = info.querySelector('h3');
        if (nameEl && d.dina.firstName) nameEl.textContent = d.dina.firstName + (d.dina.lastName ? ' ' + d.dina.lastName : '');
        if (d.dina.role) {
          const roleDiv = info.querySelector('div');
          if (roleDiv) roleDiv.textContent = d.dina.role;
        }
        if (d.dina.bio) {
          const bioEl = info.querySelector('p');
          if (bioEl) bioEl.innerHTML = d.dina.bio.replace(/\n\n/g, '<br /><br />');
        }
        if (d.dina.photo) {
          const photoWrap = document.getElementById('team-photo-wrap');
          if (photoWrap) {
            photoWrap.innerHTML = `<img src="${d.dina.photo}" alt="${d.dina.firstName}" style="width:100%;height:100%;object-fit:cover;" />`;
          }
        }
      }
    }
  } catch (e) { /* silently skip */ }
}

/* ══════════════════════════════════════════════════════════
   7. ANMELDUNG SECTION TEXT  (loads from _data/anmeldung.json)
══════════════════════════════════════════════════════════ */
async function loadAnmeldung() {
  try {
    const res = await fetch('_data/anmeldung.json');
    if (!res.ok) return;
    const d = await res.json();
    const heading    = document.getElementById('anmeldung-heading');
    const intro      = document.getElementById('anmeldung-intro');
    const disclaimer = document.getElementById('anmeldung-disclaimer');
    const submitBtn  = $('#anmeldung-form [type="submit"]');
    if (d.heading    && heading)    heading.textContent    = d.heading;
    if (d.intro      && intro)      intro.textContent      = d.intro;
    if (d.disclaimer && disclaimer) disclaimer.textContent = d.disclaimer;
    if (d.submitText && submitBtn)  submitBtn.textContent  = d.submitText;
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════
   8. HERO  (loads from _data/hero.json)
══════════════════════════════════════════════════════════ */
async function loadHero() {
  try {
    const res = await fetch('_data/hero.json');
    if (!res.ok) return;
    const d = await res.json();
    const badge       = document.getElementById('hero-badge');
    const heading     = document.getElementById('hero-heading');
    const subtitle    = document.getElementById('hero-subtitle');
    const ctaPrimary  = document.getElementById('hero-cta-primary');
    const ctaSecondary= document.getElementById('hero-cta-secondary');
    if (d.badge && badge) badge.textContent = d.badge;
    if (heading && (d.headingLine1 || d.headingHighlight || d.headingLine2)) {
      heading.innerHTML = `${d.headingLine1 || ''}<br /><em style="color:oklch(0.48 0.09 148);font-style:normal;">${d.headingHighlight || ''}</em><br />${d.headingLine2 || ''}`;
    }
    if (d.subtitle && subtitle) subtitle.textContent = d.subtitle;
    if (d.primaryCta)   { if (ctaPrimary)   { ctaPrimary.textContent   = d.primaryCta.text;   ctaPrimary.href   = d.primaryCta.url;   } }
    if (d.secondaryCta) { if (ctaSecondary) { ctaSecondary.textContent = d.secondaryCta.text; ctaSecondary.href = d.secondaryCta.url; } }
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════
   9. ÜBER UNS  (loads from _data/ueber_uns.json)
══════════════════════════════════════════════════════════ */
async function loadUeberUns() {
  try {
    const res = await fetch('_data/ueber_uns.json');
    if (!res.ok) return;
    const d = await res.json();
    const heading     = document.getElementById('ueber-uns-heading');
    const text        = document.getElementById('ueber-uns-text');
    const bullets     = document.getElementById('ueber-uns-bullets');
    const quoteText   = document.getElementById('ueber-uns-quote-text');
    const quoteAuthor = document.getElementById('ueber-uns-quote-author');
    if (d.heading && heading) heading.innerHTML = d.heading.replace(/\n/g, '<br />');
    if (d.text && text) text.textContent = d.text;
    if (d.bullets && bullets) {
      const colors = [
        { bg: 'var(--sage-light)',      stroke: 'oklch(0.48 0.09 148)' },
        { bg: 'var(--terra-light)',     stroke: 'oklch(0.55 0.11 42)'  },
        { bg: 'oklch(0.95 0.06 88)',   stroke: 'oklch(0.56 0.1 88)'   },
        { bg: 'var(--sage-light)',      stroke: 'oklch(0.48 0.09 148)' },
        { bg: 'var(--terra-light)',     stroke: 'oklch(0.55 0.11 42)'  },
      ];
      bullets.innerHTML = d.bullets.map((b, i) => {
        const c = colors[i % colors.length];
        return `<li class="flex gap-3 items-start">
          <span style="width:24px;height:24px;border-radius:50%;background:${c.bg};flex:0 0 24px;display:flex;align-items:center;justify-content:center;margin-top:2px;">
            <svg width="11" height="11" viewBox="0 0 11 11"><path d="M2 5.5l2.5 2.5 4.5-4.5" stroke="${c.stroke}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
          </span>
          <span class="text-[.95rem] text-ink leading-[1.6]">${b}</span>
        </li>`;
      }).join('');
    }
    if (d.quote) {
      if (d.quote.text   && quoteText)   quoteText.textContent   = d.quote.text;
      if (d.quote.author && quoteAuthor) quoteAuthor.textContent = '— ' + d.quote.author;
    }
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════
   10. SPIELGRUPPE  (loads from _data/spielgruppe.json)
══════════════════════════════════════════════════════════ */
async function loadSpielgruppe() {
  try {
    const res = await fetch('_data/spielgruppe.json');
    if (!res.ok) return;
    const d = await res.json();
    const heading = document.getElementById('spielgruppe-heading');
    const intro   = document.getElementById('spielgruppe-intro');
    if (d.heading && heading) heading.innerHTML = d.heading.replace(/\n/g, '<br />');
    if (d.intro   && intro)   intro.textContent = d.intro;
    if (d.cards) {
      d.cards.forEach((card, i) => {
        const titleEl = document.getElementById(`spielgruppe-card-${i + 1}-title`);
        const textEl  = document.getElementById(`spielgruppe-card-${i + 1}-text`);
        if (card.title && titleEl) titleEl.textContent = card.title;
        if (card.text  && textEl)  textEl.textContent  = card.text;
      });
    }
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════
   11. ZEITEN & PREISE  (loads from _data/zeiten_preise.json)
══════════════════════════════════════════════════════════ */
async function loadZeitenPreise() {
  try {
    const res = await fetch('_data/zeiten_preise.json');
    if (!res.ok) return;
    const d = await res.json();

    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.textContent = val; };
    set('zeiten-start',         d.start);
    set('zeiten-alter',         d.alter);
    set('zeiten-tage',          d.tage);
    set('hero-card-tage',       d.tage);
    set('hero-card-alter',      d.alter);

    if (d.morgen) {
      ['zeiten-morgen', 'hero-card-morgen'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'zeiten-morgen') el.innerHTML = `${d.morgen} <span class="text-[.75rem] font-medium text-[var(--ink-light)]">Uhr</span>`;
        else el.textContent = d.morgen;
      });
    }
    if (d.nachmittag) {
      ['zeiten-nachmittag', 'hero-card-nachmittag'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (id === 'zeiten-nachmittag') el.innerHTML = `${d.nachmittag} <span class="text-[.75rem] font-medium text-[var(--ink-light)]">Uhr</span>`;
        else el.textContent = d.nachmittag;
      });
    }
    set('warteliste-text', d.warteliste_text);

    const table = document.getElementById('preise-table');
    if (table && (d.preise_morgen || d.preise_nachmittag)) {
      const rows = (list, last) => list.map((r, i) =>
        `<div class="flex justify-between items-center px-6 py-[13px] ${i < list.length - 1 || !last ? 'border-b border-dashed border-cream-dark' : ''} hover:bg-cream transition-colors">
          <span class="text-[.92rem] font-semibold text-ink">${r.label}</span>
          <span class="font-display font-extrabold text-base text-[var(--sage-dark)]">${r.price}</span>
        </div>`
      ).join('');
      let html = `<div class="px-6 py-4 text-[.82rem] font-bold text-[var(--ink-mid)] uppercase tracking-[.06em] border-b border-cream-dark bg-cream">Preis pro Kind / Monat</div>`;
      if (d.preise_morgen) {
        html += `<div class="px-6 pt-3 pb-2 text-[.78rem] font-bold text-[var(--ink-light)] uppercase tracking-[.06em] bg-cream">Morgen (${d.morgen || '08:30 – 11:45'} Uhr)</div>`;
        html += rows(d.preise_morgen, !d.preise_nachmittag);
      }
      if (d.preise_nachmittag) {
        html += `<div class="px-6 pt-3 pb-2 text-[.78rem] font-bold text-[var(--ink-light)] uppercase tracking-[.06em] bg-cream border-t border-dashed border-cream-dark">Nachmittag (${d.nachmittag || '13:30 – 16:00'} Uhr)</div>`;
        html += rows(d.preise_nachmittag, true);
      }
      table.innerHTML = html;
    }
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════
   12. SCHNUPPERTAG  (loads from _data/schnuppertag.json)
══════════════════════════════════════════════════════════ */
async function loadSchnuppertag() {
  try {
    const res = await fetch('_data/schnuppertag.json');
    if (!res.ok) return;
    const d = await res.json();
    const heading     = document.getElementById('schnuppertag-heading');
    const text        = document.getElementById('schnuppertag-text');
    const hint        = document.getElementById('schnuppertag-hint');
    const ctaPrimary  = document.getElementById('schnuppertag-cta-primary');
    const ctaSecondary= document.getElementById('schnuppertag-cta-secondary');
    if (d.heading && heading) heading.textContent = d.heading;
    if (d.text    && text)    text.textContent    = d.text;
    if (d.hint    && hint)    hint.textContent    = d.hint;
    if (d.primaryCta)   { if (ctaPrimary)   { ctaPrimary.textContent   = d.primaryCta.text;   ctaPrimary.href   = d.primaryCta.url;   } }
    if (d.secondaryCta) { if (ctaSecondary) { ctaSecondary.textContent = d.secondaryCta.text; ctaSecondary.href = d.secondaryCta.url; } }
  } catch (e) {}
}

/* ══════════════════════════════════════════════════════════
   13. CHECKBOX TOGGLE  (Anmeldungsformular)
══════════════════════════════════════════════════════════ */
function initCheckboxes() {
  $$('.checkbox-label').forEach(label => {
    const input = label.querySelector('input[type="checkbox"]');
    if (!input) return;
    const update = () => {
      label.classList.toggle('checked', input.checked);
      const box = label.querySelector('.checkbox-custom');
      if (box) {
        box.innerHTML = input.checked
          ? '<svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>'
          : '';
      }
    };
    input.addEventListener('change', update);
    // make the whole label clickable
    label.addEventListener('click', e => {
      if (e.target === input) return;
      input.checked = !input.checked;
      update();
    });
  });
}

/* ══════════════════════════════════════════════════════════
   8. ANMELDUNG FORM  (client-side validation + success state)
══════════════════════════════════════════════════════════ */
function initAnmeldungForm() {
  const form = $('#anmeldung-form');
  const wrap = $('#anmeldung-wrap');
  if (!form) return;

  function showError(inputId, errId, msg) {
    const input = document.getElementById(inputId);
    const err   = document.getElementById(errId);
    input?.classList.add('input-error', 'border-[var(--terra)]');
    if (err) { err.textContent = msg; err.classList.remove('hidden'); }
    return false;
  }

  function clearError(inputId, errId) {
    const input = document.getElementById(inputId);
    const err   = document.getElementById(errId);
    input?.classList.remove('input-error', 'border-[var(--terra)]');
    if (err) { err.textContent = ''; err.classList.add('hidden'); }
    return true;
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;

    const fields = [
      { id: 'a-kind-name',    err: 'err-kind-name',    test: v => v.trim().length > 0,              msg: 'Bitte Name des Kindes angeben.' },
      { id: 'a-geburtsdatum', err: 'err-geburtsdatum', test: v => v.trim().length > 0,              msg: 'Bitte Geburtsdatum angeben.' },
      { id: 'a-eltern-name',  err: 'err-eltern-name',  test: v => v.trim().length > 0,              msg: 'Bitte Name der Eltern angeben.' },
      { id: 'a-email',        err: 'err-email',        test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Bitte gültige E-Mail-Adresse angeben.' },
      { id: 'a-telefon',      err: 'err-telefon',      test: v => v.trim().length > 6,              msg: 'Bitte Telefonnummer angeben.' },
    ];

    fields.forEach(f => {
      const val = document.getElementById(f.id)?.value || '';
      valid = f.test(val) ? clearError(f.id, f.err) && valid : showError(f.id, f.err, f.msg) && false;
    });

    const checked = form.querySelectorAll('input[name="tage"]:checked');
    const tageErr = document.getElementById('err-tage');
    if (checked.length === 0) {
      if (tageErr) { tageErr.textContent = 'Bitte mindestens einen Tag auswählen.'; tageErr.classList.remove('hidden'); }
      valid = false;
    } else {
      if (tageErr) { tageErr.textContent = ''; tageErr.classList.add('hidden'); }
    }

    if (!valid) {
      // scroll to first error
      const firstErr = form.querySelector('.input-error, .form-error:not(.hidden)');
      firstErr?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    /* Submit to Netlify */
    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet…';

    try {
      const formData = new FormData(form);
      const response = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });
      const result = await response.json();
      if (result.success) {
        showAnmeldungSuccess(wrap);
      } else {
        throw new Error(result.message || 'Fehler');
      }
    } catch (err) {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        showAnmeldungSuccess(wrap); // local preview: skip real submission
      } else {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Anmeldung absenden';
        alert('Es ist ein Fehler aufgetreten. Bitte versucht es später erneut oder kontaktiert Dina direkt.');
      }
    }
  });
}

function showAnmeldungSuccess(wrap) {
  wrap.innerHTML = `
    <div class="reveal bg-[var(--sage-light)] border-2 border-[var(--sage)] rounded-3xl p-10 md:p-16 text-center">
      <div style="font-size:3rem;margin-bottom:16px;">🎉</div>
      <h3 class="font-display font-bold text-[1.4rem] text-[var(--sage-dark)] mb-3">Vielen Dank für eure Anmeldung!</h3>
      <p class="text-[var(--ink-mid)] text-[.95rem] leading-[1.7]">
        Dina hat eure Anmeldung erhalten und meldet sich so bald wie möglich persönlich bei euch.<br /><br />
        <strong>Bitte beachtet:</strong> Es besteht eine Warteliste. Ihr werdet informiert, sobald ein Platz frei wird. Wir freuen uns auf euer Kind!
      </p>
      <div class="mt-6">
        <a href="#kontakt" class="inline-flex items-center justify-center bg-[var(--sage)] text-white font-bold rounded-full px-6 py-3 text-[.95rem] hover:bg-[var(--sage-dark)] transition-all">Bei Fragen: Kontakt aufnehmen</a>
      </div>
    </div>`;
  const box = wrap.querySelector('.reveal');
  setTimeout(() => box?.classList.add('visible'), 50);
  wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/* ══════════════════════════════════════════════════════════
   9. KONTAKT FORM
══════════════════════════════════════════════════════════ */
function initKontaktForm() {
  const form = $('#kontakt-form');
  if (!form) return;

  form.addEventListener('submit', async e => {
    e.preventDefault();
    let valid = true;

    const fields = [
      { id: 'k-name',     err: 'k-err-name',     test: v => v.trim().length > 0,                  msg: 'Bitte Name angeben.' },
      { id: 'k-email',    err: 'k-err-email',    test: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), msg: 'Bitte gültige E-Mail angeben.' },
      { id: 'k-nachricht',err: 'k-err-nachricht',test: v => v.trim().length > 0,                  msg: 'Bitte Nachricht eingeben.' },
    ];

    fields.forEach(f => {
      const val = document.getElementById(f.id)?.value || '';
      const err = document.getElementById(f.err);
      const input = document.getElementById(f.id);
      if (f.test(val)) {
        input?.classList.remove('input-error');
        if (err) { err.textContent = ''; err.classList.add('hidden'); }
      } else {
        input?.classList.add('input-error');
        if (err) { err.textContent = f.msg; err.classList.remove('hidden'); }
        valid = false;
      }
    });

    if (!valid) return;

    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Wird gesendet…';

    try {
      const formData = new FormData(form);
      const response = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: formData,
      });
      const result = await response.json();

      if (result.success || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const wrap = form.closest('.kontakt-form-card') || form.parentElement;
        wrap.innerHTML = `
          <div class="text-center py-8">
            <div style="font-size:2.5rem;margin-bottom:12px;">✉️</div>
            <h3 class="font-display font-bold text-[1.25rem] text-[var(--sage-dark)] mb-2">Nachricht erhalten!</h3>
            <p class="text-[var(--ink-mid)] text-[.95rem]">Dina meldet sich in Kürze bei euch.</p>
          </div>`;
      } else {
        throw new Error();
      }
    } catch {
      btn.disabled = false;
      btn.textContent = 'Nachricht senden';
    }
  });
}

/* ══════════════════════════════════════════════════════════
   INIT
══════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadHero();
  loadUeberUns();
  loadSpielgruppe();
  loadZeitenPreise();
  loadSchnuppertag();
  loadBanner();
  loadEvents();
  loadGallery();
  loadContactData();
  loadAnmeldung();
  initCheckboxes();
  initAnmeldungForm();
  initKontaktForm();
});
