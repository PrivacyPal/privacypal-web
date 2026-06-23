/* =========================================================
   Events — shared helpers
   - loadEvents(): fetches events/events.json
   - renders the card grid on events.html
   - renders a single event + gallery/lightbox on event.html
   ========================================================= */
(function(){
  const EVENTS_URL = 'events/events.json';

  // ---------- data ----------
  const dataPromise = fetch(EVENTS_URL, { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('Could not load events (' + r.status + ')');
      return r.json();
    });

  // ---------- helpers ----------
  function escape(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  // description / tagline copy is authored with a few safe inline tags
  // (<strong>, <em>, <code>) — allow those, escape everything else.
  function richText(s){
    return escape(s).replace(/&lt;(\/?(?:strong|em|b|i|code))&gt;/g, '<$1>');
  }
  function catLabel(data, id){
    const c = (data.categories || []).find(x => x.id === id);
    return c ? c.label : id;
  }
  function isUpcoming(ev){
    if (ev.status === 'upcoming') return true;
    if (ev.status === 'past') return false;
    // derive from date when status not explicit
    const d = ev.date ? new Date(ev.date + 'T23:59:59') : null;
    return d && !isNaN(d) ? d >= new Date() : false;
  }
  // upcoming first (soonest → latest), then past (most recent → oldest)
  function sortEvents(list){
    return list.slice().sort((a, b) => {
      const ua = isUpcoming(a), ub = isUpcoming(b);
      if (ua !== ub) return ua ? -1 : 1;
      const da = new Date(a.date || 0).getTime();
      const db = new Date(b.date || 0).getTime();
      return ua ? da - db : db - da;
    });
  }

  // shared inline icons
  const ICON = {
    cal:  '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
    pin:  '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    clock:'<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    venue:'<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/></svg>',
    arrow:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>',
    play: '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>'
  };

  function ytThumb(id){ return 'https://img.youtube.com/vi/' + id + '/maxresdefault.jpg'; }
  function ytWatch(id){ return 'https://youtu.be/' + id; }

  // re-run the site's reveal animation on freshly injected nodes
  function observeReveal(root){
    if (!window.IntersectionObserver) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    (root || document).querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
  }

  /* =======================================================
     LISTING PAGE  (events.html)
     ======================================================= */
  const grid    = document.getElementById('eventsGrid');
  const loading = document.getElementById('eventsLoading');
  const empty   = document.getElementById('eventsEmpty');
  const filters = document.getElementById('eventFilters');

  if (grid){
    let currentCat = 'all';
    let dataset = null;

    dataPromise.then(data => {
      dataset = data;
      // only show category chips that are actually used by an event
      const used = new Set((data.events || []).map(e => e.category));
      (data.categories || []).filter(c => used.has(c.id)).forEach(c => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.dataset.cat = c.id;
        b.textContent = c.label;
        filters.appendChild(b);
      });
      filters.addEventListener('click', e => {
        const btn = e.target.closest('button.chip');
        if (!btn) return;
        currentCat = btn.dataset.cat;
        filters.querySelectorAll('button.chip').forEach(b => b.classList.toggle('active', b === btn));
        render();
      });
      render();
    }).catch(err => {
      console.error(err);
      loading.hidden = true;
      empty.hidden = false;
      empty.querySelector('p').textContent =
        "We couldn't load events right now. Follow us on LinkedIn for the latest.";
    });

    function cardMeta(ev){
      const bits = [];
      if (ev.dateDisplay || ev.date) bits.push('<span>' + ICON.cal + escape(ev.dateDisplay || ev.date) + '</span>');
      if (ev.city) bits.push('<span>' + ICON.pin + escape(ev.city) + '</span>');
      return bits.join('');
    }

    function render(){
      const events = sortEvents((dataset.events || [])
        .filter(e => currentCat === 'all' || e.category === currentCat));
      loading.hidden = true;
      if (!events.length){
        grid.hidden = true;
        empty.hidden = false;
        return;
      }
      empty.hidden = true;
      grid.hidden  = false;

      grid.innerHTML = events.map((ev, i) => {
        const up = isUpcoming(ev);
        const badge = up
          ? '<span class="event-badge upcoming"><span class="dot"></span>Upcoming</span>'
          : '<span class="event-badge past">Past event</span>';
        const thumb = ev.thumb
          ? '<img src="' + escape(ev.thumb) + '" alt="' + escape(ev.title) + '" loading="lazy">'
          : '';
        return `
        <a class="event-card reveal${i < 3 ? ' reveal-delay-' + (i+1) : ''}" href="event.html?id=${encodeURIComponent(ev.id)}">
          <div class="event-thumb">${thumb}${badge}</div>
          <div class="event-card-body">
            <div class="event-card-meta">${cardMeta(ev)}</div>
            <h3>${escape(ev.title)}</h3>
            <p>${escape(ev.summary || '')}</p>
            <span class="event-card-cta">${up ? 'Event details' : 'View recap'} ${ICON.arrow}</span>
          </div>
        </a>`;
      }).join('');
      observeReveal(grid);
    }
  }

  /* =======================================================
     DETAIL PAGE  (event.html)
     ======================================================= */
  const root = document.getElementById('eventRoot');
  if (root){
    const params  = new URLSearchParams(location.search);
    const eventId = params.get('id');

    dataPromise.then(data => {
      const ev = (data.events || []).find(e => e.id === eventId);
      if (!ev){
        root.innerHTML = `
          <div class="event-missing">
            <h2>That event couldn't be found.</h2>
            <p>It may have been removed, or the link may be wrong. Browse all of our events instead.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <a class="btn btn-cobalt" href="events.html">See all events</a>
              <a class="btn btn-ghost" href="https://www.linkedin.com/company/privacypalai/" target="_blank" rel="noopener">Follow on LinkedIn</a>
            </div>
          </div>`;
        return;
      }

      const up = isUpcoming(ev);
      document.title = ev.title + ' — Events — PrivacyPal';

      // ---- hero facts ----
      const facts = [];
      if (ev.dateDisplay || ev.date) facts.push('<span class="event-fact">' + ICON.cal + escape(ev.dateDisplay || ev.date) + '</span>');
      if (ev.time)  facts.push('<span class="event-fact">' + ICON.clock + escape(ev.time) + '</span>');
      if (ev.venue) facts.push('<span class="event-fact">' + ICON.venue + escape(ev.venue) + '</span>');
      if (ev.city)  facts.push('<span class="event-fact">' + ICON.pin + escape(ev.city) + '</span>');

      // ---- prose ----
      const paras = Array.isArray(ev.description) ? ev.description
                  : (ev.description ? [ev.description] : []);
      const proseHTML = paras.map(p => '<p>' + richText(p) + '</p>').join('');

      // ---- highlights ----
      const highlightsHTML = Array.isArray(ev.highlights) && ev.highlights.length ? `
        <section class="event-section reveal">
          <h2>Highlights</h2>
          <ul class="event-highlights">${ev.highlights.map(h => '<li>' + richText(h) + '</li>').join('')}</ul>
        </section>` : '';

      // ---- videos ----
      const videos = Array.isArray(ev.videos) ? ev.videos : [];
      const videosHTML = videos.length ? `
        <section class="event-section reveal">
          <h2>Watch</h2>
          <div class="event-videos">
            ${videos.map(v => {
              const id = v.id;
              const href = v.href || (id ? ytWatch(id) : '#');
              const img  = v.thumb || (id ? ytThumb(id) : '');
              return `
              <div class="event-video">
                ${v.label ? '<p class="video-label">' + escape(v.label) + '</p>' : ''}
                <a class="video-frame" href="${escape(href)}" target="_blank" rel="noopener" aria-label="${escape(v.title || v.label || 'Watch video')}">
                  ${img ? '<img src="' + escape(img) + '" alt="" loading="lazy" onerror="this.src=\'https://img.youtube.com/vi/' + escape(id) + '/hqdefault.jpg\'">' : ''}
                  <span class="video-play">${ICON.play} Watch on YouTube</span>
                </a>
              </div>`;
            }).join('')}
          </div>
        </section>` : '';

      // ---- gallery ----
      const gallery = Array.isArray(ev.gallery) ? ev.gallery : [];
      const galleryHTML = gallery.length ? `
        <section class="event-section reveal">
          <h2>Photos</h2>
          <div class="event-gallery-grid" id="eventGallery">
            ${gallery.map((g, i) => `
              <figure class="gallery-figure" data-index="${i}" tabindex="0" role="button" aria-label="View photo: ${escape(g.caption || g.alt || 'photo')}">
                <div class="gallery-media">
                  <img src="${escape(g.src)}" alt="${escape(g.alt || g.caption || ev.title)}" loading="lazy">
                  <span class="gallery-zoom" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3M11 8v6M8 11h6"/></svg></span>
                </div>
                ${(g.caption || g.description) ? `<figcaption>
                  ${g.caption ? '<span class="cap-title">' + escape(g.caption) + '</span>' : ''}
                  ${g.description ? '<span class="cap-desc">' + escape(g.description) + '</span>' : ''}
                </figcaption>` : ''}
              </figure>`).join('')}
          </div>
        </section>` : '';

      // ---- full-event album carousel ----
      const album = (Array.isArray(ev.album) ? ev.album : [])
        .map(a => typeof a === 'string' ? { src: a } : a)
        .filter(a => a && a.src);
      const albumHTML = album.length ? `
        <section class="event-section reveal event-album-section">
          <div class="album-head">
            <h2>Walk through the event</h2>
            <span class="album-total">${album.length} photos</span>
          </div>
          <div class="album-carousel">
            <div class="album-viewport">
              <div class="album-track">
                ${album.map((a, i) => `
                  <figure class="album-slide" data-index="${i}">
                    <img src="${escape(a.src)}" alt="${escape(a.alt || ev.title)}" loading="${i < 2 ? 'eager' : 'lazy'}" draggable="false">
                  </figure>`).join('')}
              </div>
              <button class="album-arrow album-prev" type="button" aria-label="Previous photo"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
              <button class="album-arrow album-next" type="button" aria-label="Next photo"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
              <span class="album-counter"><span class="album-cur">1</span> / ${album.length}</span>
            </div>
            <div class="album-strip">
              ${album.map((a, i) => `
                <button class="album-thumb${i === 0 ? ' active' : ''}" type="button" data-index="${i}" aria-label="Go to photo ${i + 1}">
                  <img src="${escape(a.src)}" alt="" loading="lazy" draggable="false">
                </button>`).join('')}
            </div>
          </div>
        </section>` : '';

      // ---- CTAs ----
      const ctas = Array.isArray(ev.ctas) ? ev.ctas : [];
      const ctaButtons = ctas.map(c =>
        `<a class="btn ${c.style === 'primary' ? 'btn-cobalt' : 'btn-ghost'}" href="${escape(c.href)}"${/^https?:/.test(c.href) ? ' target="_blank" rel="noopener"' : ''}>${escape(c.label)}</a>`
      ).join('');

      // upcoming events lead with a register card; past events lead with content
      const registerHTML = up && ctas.length ? `
        <section class="event-section reveal">
          <div class="event-register">
            <h3>Join us</h3>
            <p>${escape(ev.tagline || 'Save your spot — we\'d love to see you there.')}</p>
            <div class="event-cta-row">${ctaButtons}</div>
          </div>
        </section>` : '';

      const closingCtaHTML = (!up && ctas.length) ? `
        <section class="event-section reveal">
          <div class="event-cta-row">${ctaButtons}</div>
        </section>` : '';

      root.innerHTML = `
        <section class="sub-hero events-hero event-detail-hero">
          <div class="container">
            <div class="crumbs reveal in">
              <a href="events.html">Events</a><span> / ${escape(catLabel(data, ev.category))}</span>
            </div>
            <span class="eyebrow reveal in">${up ? 'Upcoming event' : 'Past event'}${ev.city ? ' · ' + escape(ev.city) : ''}</span>
            <h1 class="reveal in">${escape(ev.title)}</h1>
            ${ev.tagline ? '<p class="lede reveal in">' + richText(ev.tagline) + '</p>' : ''}
            ${facts.length ? '<div class="event-facts reveal in">' + facts.join('') + '</div>' : ''}
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="event-detail-body">
              ${registerHTML}
              ${proseHTML ? '<section class="event-section reveal"><h2>About the event</h2><div class="event-prose">' + proseHTML + '</div></section>' : ''}
              ${highlightsHTML}
              ${videosHTML}
              ${galleryHTML}
              ${albumHTML}
              ${closingCtaHTML}
            </div>
          </div>
        </section>`;

      observeReveal(root);
      const lightbox = createLightbox();
      if (gallery.length) wireGalleryGrid(gallery, ev.title, lightbox);
      if (album.length)   wireCarousel(album, ev.title, lightbox);
    }).catch(err => {
      console.error(err);
      root.innerHTML = `
        <div class="event-missing">
          <h2>We couldn't load that event.</h2>
          <p>Please try again, or browse all of our events.</p>
          <a class="btn btn-cobalt" href="events.html">Back to events</a>
        </div>`;
    });

    /* ---------- shared lightbox (used by the highlights grid and the album) ---------- */
    function createLightbox(){
      let photos = [], current = 0, title = '';
      const box = document.createElement('div');
      box.className = 'lightbox';
      box.setAttribute('aria-hidden', 'true');
      box.innerHTML = `
        <button class="lb-close" type="button" aria-label="Close">&times;</button>
        <figure class="lightbox-figure">
          <div class="lightbox-img-wrap">
            <button class="lb-btn lb-prev" type="button" aria-label="Previous photo"><svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg></button>
            <img alt="">
            <button class="lb-btn lb-next" type="button" aria-label="Next photo"><svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg></button>
          </div>
          <figcaption>
            <div class="cap-title"></div>
            <div class="cap-desc"></div>
            <div class="lightbox-count"></div>
          </figcaption>
        </figure>`;
      document.body.appendChild(box);

      const imgEl   = box.querySelector('img');
      const titleEl = box.querySelector('.cap-title');
      const descEl  = box.querySelector('.cap-desc');
      const countEl = box.querySelector('.lightbox-count');
      const prevBtn = box.querySelector('.lb-prev');
      const nextBtn = box.querySelector('.lb-next');

      function show(i){
        current = (i + photos.length) % photos.length;
        const g = photos[current];
        const single = photos.length < 2;
        imgEl.src = g.src;
        imgEl.alt = g.alt || g.caption || title;
        titleEl.textContent = g.caption || '';
        titleEl.style.display = g.caption ? '' : 'none';
        descEl.textContent  = g.description || '';
        descEl.style.display = g.description ? '' : 'none';
        countEl.textContent = single ? '' : (current + 1) + ' / ' + photos.length;
        prevBtn.style.display = single ? 'none' : '';
        nextBtn.style.display = single ? 'none' : '';
      }
      function close(){ box.classList.remove('show'); box.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }

      box.querySelector('.lb-close').addEventListener('click', close);
      prevBtn.addEventListener('click', e => { e.stopPropagation(); show(current - 1); });
      nextBtn.addEventListener('click', e => { e.stopPropagation(); show(current + 1); });
      box.addEventListener('click', e => { if (e.target === box) close(); });
      document.addEventListener('keydown', e => {
        if (!box.classList.contains('show')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft'  && photos.length > 1) show(current - 1);
        else if (e.key === 'ArrowRight' && photos.length > 1) show(current + 1);
      });

      return {
        open(list, i, t){
          photos = list; title = t || '';
          show(i || 0);
          box.classList.add('show'); box.setAttribute('aria-hidden','false');
          document.body.style.overflow = 'hidden';
        }
      };
    }

    /* ---------- highlights grid -> lightbox ---------- */
    function wireGalleryGrid(gallery, title, lb){
      const galleryEl = document.getElementById('eventGallery');
      if (!galleryEl) return;
      galleryEl.addEventListener('click', e => {
        const fig = e.target.closest('.gallery-figure');
        if (fig) lb.open(gallery, +fig.dataset.index, title);
      });
      galleryEl.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const fig = e.target.closest('.gallery-figure');
        if (fig){ e.preventDefault(); lb.open(gallery, +fig.dataset.index, title); }
      });
    }

    /* ---------- full-event album carousel ---------- */
    function wireCarousel(album, title, lb){
      const root = document.querySelector('.album-carousel');
      if (!root) return;
      const track  = root.querySelector('.album-track');
      const slides = Array.from(root.querySelectorAll('.album-slide'));
      const thumbs = Array.from(root.querySelectorAll('.album-thumb'));
      const curEl  = root.querySelector('.album-cur');
      const vp     = root.querySelector('.album-viewport');
      let idx = 0;

      function go(i, smooth){
        idx = (i + album.length) % album.length;
        // fetch the current slide and its neighbours promptly (the rest stay lazy)
        [idx - 1, idx, idx + 1].forEach(n => {
          const s = slides[(n + album.length) % album.length];
          const im = s && s.querySelector('img');
          if (im && im.loading === 'lazy') im.loading = 'eager';
        });
        if (smooth === false) track.style.transition = 'none';
        track.style.transform = 'translateX(-' + (idx * 100) + '%)';
        if (smooth === false){ void track.offsetWidth; track.style.transition = ''; }
        curEl.textContent = idx + 1;
        thumbs.forEach((t, n) => t.classList.toggle('active', n === idx));
        const at = thumbs[idx];
        if (at) at.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
      }

      root.querySelector('.album-prev').addEventListener('click', () => go(idx - 1));
      root.querySelector('.album-next').addEventListener('click', () => go(idx + 1));
      thumbs.forEach(t => t.addEventListener('click', () => go(+t.dataset.index)));

      // swipe — and suppress the click -> lightbox that would follow a drag
      let x0 = null, moved = false;
      vp.addEventListener('pointerdown', e => { x0 = e.clientX; moved = false; });
      vp.addEventListener('pointermove', e => { if (x0 !== null && Math.abs(e.clientX - x0) > 8) moved = true; });
      vp.addEventListener('pointerup',   e => {
        if (x0 === null) return;
        const dx = e.clientX - x0; x0 = null;
        if (Math.abs(dx) > 40) go(dx < 0 ? idx + 1 : idx - 1);
      });
      slides.forEach(s => s.addEventListener('click', () => {
        if (moved){ moved = false; return; }
        lb.open(album, +s.dataset.index, title);
      }));

      // keyboard when the carousel has focus
      root.setAttribute('tabindex', '0');
      root.addEventListener('keydown', e => {
        if (e.key === 'ArrowLeft'){ e.preventDefault(); go(idx - 1); }
        else if (e.key === 'ArrowRight'){ e.preventDefault(); go(idx + 1); }
        else if (e.key === 'Enter'){ lb.open(album, idx, title); }
      });

      go(0, false);
    }
  }
})();
