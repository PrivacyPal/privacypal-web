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
              ${closingCtaHTML}
            </div>
          </div>
        </section>`;

      observeReveal(root);
      if (gallery.length) wireLightbox(gallery, ev.title);
    }).catch(err => {
      console.error(err);
      root.innerHTML = `
        <div class="event-missing">
          <h2>We couldn't load that event.</h2>
          <p>Please try again, or browse all of our events.</p>
          <a class="btn btn-cobalt" href="events.html">Back to events</a>
        </div>`;
    });

    /* ---------- lightbox ---------- */
    function wireLightbox(gallery, eventTitle){
      let current = 0;
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
      const single  = gallery.length < 2;
      box.querySelector('.lb-prev').style.display = single ? 'none' : '';
      box.querySelector('.lb-next').style.display = single ? 'none' : '';

      function show(i){
        current = (i + gallery.length) % gallery.length;
        const g = gallery[current];
        imgEl.src = g.src;
        imgEl.alt = g.alt || g.caption || eventTitle;
        titleEl.textContent = g.caption || '';
        titleEl.style.display = g.caption ? '' : 'none';
        descEl.textContent  = g.description || '';
        descEl.style.display = g.description ? '' : 'none';
        countEl.textContent = single ? '' : (current + 1) + ' / ' + gallery.length;
      }
      function open(i){ show(i); box.classList.add('show'); box.setAttribute('aria-hidden','false'); document.body.style.overflow = 'hidden'; }
      function close(){ box.classList.remove('show'); box.setAttribute('aria-hidden','true'); document.body.style.overflow = ''; }

      const galleryEl = document.getElementById('eventGallery');
      galleryEl.addEventListener('click', e => {
        const fig = e.target.closest('.gallery-figure');
        if (fig) open(+fig.dataset.index);
      });
      galleryEl.addEventListener('keydown', e => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const fig = e.target.closest('.gallery-figure');
        if (fig){ e.preventDefault(); open(+fig.dataset.index); }
      });

      box.querySelector('.lb-close').addEventListener('click', close);
      box.querySelector('.lb-prev').addEventListener('click', e => { e.stopPropagation(); show(current - 1); });
      box.querySelector('.lb-next').addEventListener('click', e => { e.stopPropagation(); show(current + 1); });
      box.addEventListener('click', e => { if (e.target === box) close(); });
      document.addEventListener('keydown', e => {
        if (!box.classList.contains('show')) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowLeft' && !single) show(current - 1);
        else if (e.key === 'ArrowRight' && !single) show(current + 1);
      });
    }
  }
})();
