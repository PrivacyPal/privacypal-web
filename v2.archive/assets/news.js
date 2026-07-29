/* =========================================================
   Newsroom — shared helpers
   - loadNews(): fetches news/news.json
   - renders featured + grid + search/filter on news.html
   - renders a single article + related on news-article.html
   ========================================================= */
(function(){
  const NEWS_URL = 'news/news.json';

  const dataPromise = fetch(NEWS_URL, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('Could not load news (' + r.status + ')'); return r.json(); });

  // ---------- utils ----------
  function escape(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  function catLabel(data, id){
    const c = (data.categories || []).find(x => x.id === id);
    return c ? c.label : id;
  }
  function fmtDate(iso){
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  }
  function byDateDesc(a, b){ return (a.date < b.date) ? 1 : (a.date > b.date) ? -1 : 0; }
  function articleUrl(a){ return 'news-article.html?id=' + encodeURIComponent(a.id); }

  // text we let the search match against
  function searchText(data, a){
    const bits = [a.title, a.excerpt, a.author, a.source, catLabel(data, a.category)];
    (a.body || []).forEach(b => {
      if (b.text) bits.push(b.text);
      if (b.cite) bits.push(b.cite);
      if (Array.isArray(b.items)) bits.push(b.items.join(' '));
    });
    return bits.join('  ').toLowerCase();
  }

  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

  // reusable story card (grid + related)
  function cardHTML(data, a){
    const isPress = !!a.source;
    return `
      <a class="news-card reveal in" href="${articleUrl(a)}">
        <div class="news-card-media">
          <span class="news-card-cat">${escape(catLabel(data, a.category))}</span>
          <img src="${escape(a.thumb)}" alt="" loading="lazy" width="800" height="500">
        </div>
        <div class="news-card-body">
          <div class="news-card-meta">
            <span>${escape(fmtDate(a.date))}</span>
            ${a.readTime ? `<span>&middot;</span><span>${escape(a.readTime)}</span>` : ''}
            ${isPress ? `<span>&middot;</span><span>${escape(a.source)}</span>` : ''}
          </div>
          <h3>${escape(a.title)}</h3>
          <p>${escape(a.excerpt || '')}</p>
          <span class="news-card-foot">Read story ${ARROW}</span>
        </div>
      </a>`;
  }

  // re-run the scroll-reveal observer over freshly injected nodes
  function revealIn(root){
    if (!window.IntersectionObserver) return;
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    (root || document).querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
  }

  /* =======================================================
     LISTING PAGE
     ======================================================= */
  const grid = document.getElementById('newsGrid');
  if (grid){
    const featuredWrap = document.getElementById('newsFeatured');
    const loading  = document.getElementById('newsLoading');
    const empty    = document.getElementById('newsEmpty');
    const filters  = document.getElementById('newsFilters');
    const countEl  = document.getElementById('newsCount');
    const searchBox= document.getElementById('newsSearchBox');
    const searchIn = document.getElementById('newsSearch');
    const clearBtn = document.getElementById('newsClear');

    let data = null, all = [], featured = null;
    let currentCat = 'all', query = '';

    dataPromise.then(d => {
      data = d;
      all = (d.articles || []).slice().sort(byDateDesc);
      featured = all.find(a => a.featured) || all[0] || null;

      // build category chips — only for categories that have stories
      const present = new Set(all.map(a => a.category));
      (d.categories || []).filter(c => present.has(c.id)).forEach(c => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'news-chip'; b.dataset.cat = c.id; b.textContent = c.label;
        filters.appendChild(b);
      });
      filters.addEventListener('click', e => {
        const btn = e.target.closest('button.news-chip'); if (!btn) return;
        currentCat = btn.dataset.cat;
        filters.querySelectorAll('button.news-chip').forEach(b => b.classList.toggle('active', b === btn));
        render();
      });

      if (searchIn){
        searchIn.addEventListener('input', () => {
          query = searchIn.value.trim().toLowerCase();
          searchBox.classList.toggle('has-value', query.length > 0);
          render();
        });
      }
      if (clearBtn){
        clearBtn.addEventListener('click', () => {
          searchIn.value = ''; query = ''; searchBox.classList.remove('has-value');
          searchIn.focus(); render();
        });
      }

      // precompute searchable text
      all.forEach(a => { a._search = searchText(d, a); });

      render();
    }).catch(err => {
      console.error(err);
      loading.hidden = true;
      empty.hidden = false;
      empty.querySelector('h3').textContent = "We couldn't load the newsroom.";
      empty.querySelector('p').textContent  = "Please try again in a moment, or email press@privacypal.ai.";
    });

    function render(){
      loading.hidden = true;
      const filtering = currentCat !== 'all' || query.length > 0;

      let list = all.filter(a => currentCat === 'all' || a.category === currentCat);
      if (query) list = list.filter(a => a._search.indexOf(query) !== -1);

      // featured banner only in the default, unfiltered view
      const showFeatured = !filtering && featured;
      featuredWrap.hidden = !showFeatured;
      featuredWrap.innerHTML = showFeatured ? featuredHTML(featured) : '';

      // in default view the featured story isn't repeated in the grid
      const gridList = showFeatured ? list.filter(a => a.id !== featured.id) : list;

      if (!list.length){
        grid.hidden = true; grid.innerHTML = '';
        empty.hidden = false;
        empty.querySelector('h3').textContent = 'No stories match that yet.';
        empty.querySelector('p').textContent  = query
          ? `Nothing for “${searchIn.value.trim()}”. Try another search or clear the filters.`
          : 'Check back soon — more is on the way.';
        countEl.textContent = '';
      } else {
        empty.hidden = true;
        grid.hidden = false;
        grid.innerHTML = gridList.map(a => cardHTML(data, a)).join('');
        const n = list.length;
        countEl.textContent = filtering
          ? `${n} ${n === 1 ? 'story' : 'stories'}${currentCat !== 'all' ? ' in ' + catLabel(data, currentCat) : ''}`
          : `${n} ${n === 1 ? 'story' : 'stories'} and counting`;
      }
      revealIn(featuredWrap); revealIn(grid);
    }

    function featuredHTML(a){
      const isPress = !!a.source;
      return `
        <a class="news-featured reveal in" href="${articleUrl(a)}">
          <div class="news-featured-media">
            <span class="news-flag"><span class="dot"></span>Featured</span>
            <img src="${escape(a.hero)}" alt="" width="1600" height="900">
          </div>
          <div class="news-featured-body">
            <div class="news-featured-meta">
              <span class="news-tag">${escape(catLabel(data, a.category))}</span>
              <span class="news-tag date">${escape(fmtDate(a.date))}</span>
              ${isPress ? `<span class="news-tag src">${escape(a.source)}</span>` : ''}
            </div>
            <h2>${escape(a.title)}</h2>
            <p class="excerpt">${escape(a.excerpt || '')}</p>
            <div class="news-byline">
              <span>${escape(a.author || 'PrivacyPal Newsroom')}</span>
              ${a.readTime ? `<span class="news-meta-dot">&middot;</span><span>${escape(a.readTime)}</span>` : ''}
            </div>
            <span class="news-read">Read the story ${ARROW}</span>
          </div>
        </a>`;
    }
  }

  /* =======================================================
     ARTICLE PAGE
     ======================================================= */
  const root = document.getElementById('articleRoot');
  if (root){
    // the article opens on a dark, full-bleed hero image — flip the (already
    // injected) nav to its light/on-dark variant so the logo + links stay
    // legible at the top, and pick up a dark backdrop once the page scrolls.
    const navEl = document.getElementById('siteNav');
    if (navEl) navEl.classList.add('on-dark');

    const params = new URLSearchParams(location.search);
    const id = params.get('id');

    dataPromise.then(data => {
      const all = (data.articles || []).slice().sort(byDateDesc);
      const a = all.find(x => x.id === id);
      if (!a){
        root.innerHTML = `
          <div class="news-missing">
            <h2>That story couldn't be found.</h2>
            <p>It may have moved, or the link may be wrong. Head back to the newsroom for the latest.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <a class="btn btn-cobalt" href="news.html">Back to the newsroom</a>
              <a class="btn btn-ghost" href="mailto:press@privacypal.ai">Email press</a>
            </div>
          </div>`;
        return;
      }

      document.title = `${a.title} — Newsroom — PrivacyPal`;
      const md = document.querySelector('meta[name="description"]');
      if (md && a.excerpt) md.setAttribute('content', a.excerpt);

      const isPress = !!a.source;
      const cat = catLabel(data, a.category);
      const shareUrl = location.href;
      const shareText = a.title;

      // related: same category first, then most-recent, max 3
      const related = all.filter(x => x.id !== a.id)
        .sort((x, y) => {
          const sx = x.category === a.category ? 0 : 1;
          const sy = y.category === a.category ? 0 : 1;
          return sx - sy || byDateDesc(x, y);
        }).slice(0, 3);

      root.innerHTML = `
        <article>
          <header class="article-hero">
            <div class="article-hero-media"><img src="${escape(a.hero)}" alt="" width="1600" height="900"></div>
            <div class="article-hero-inner">
              <div class="container">
                <div class="article-crumbs reveal in"><a href="news.html">Newsroom</a><span> / ${escape(cat)}</span></div>
                <div class="article-hero-meta reveal in">
                  <span class="news-tag">${escape(cat)}</span>
                  <span class="news-tag date">${escape(fmtDate(a.date))}</span>
                  ${a.readTime ? `<span class="news-tag date">${escape(a.readTime)}</span>` : ''}
                  ${isPress ? `<span class="news-tag src">${escape(a.source)}</span>` : ''}
                </div>
                <h1 class="reveal in">${escape(a.title)}</h1>
                ${a.excerpt ? `<p class="lede reveal in">${escape(a.excerpt)}</p>` : ''}
                <div class="article-hero-byline reveal in"><span>By ${escape(a.author || 'PrivacyPal Newsroom')}</span></div>
              </div>
            </div>
          </header>

          <section class="section">
            <div class="container">
              <div class="article-layout">
                <div class="article-body reveal">
                  ${(a.body || []).map(renderBlock).join('')}
                  ${isPress && a.sourceUrl ? sourceCTA(a) : ''}
                </div>
                <aside class="article-aside reveal">
                  <div class="share-label">Share</div>
                  <div class="article-share">
                    <button class="share-btn" type="button" data-share="copy" aria-label="Copy link" title="Copy link">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
                    </button>
                    <a class="share-btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener" aria-label="Share on X" title="Share on X">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.75L4.84 22H1.58l8.02-9.17L1.5 2h6.75l4.66 6.16L18.244 2Zm-1.16 18h1.83L7.01 3.9H5.05L17.084 20Z"/></svg>
                    </a>
                    <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener" aria-label="Share on LinkedIn" title="Share on LinkedIn">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.83v1.64h.05c.53-.95 1.83-1.95 3.77-1.95C20.2 8.69 21 11 21 14.02V21h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21H9V9Z"/></svg>
                    </a>
                  </div>
                </aside>
              </div>
            </div>
          </section>

          ${related.length ? `
          <section class="section section-alt article-related">
            <div class="container">
              <h2 class="reveal">More from the newsroom</h2>
              <p class="sub reveal">The latest news, press, and happenings at PrivacyPal.</p>
              <div class="news-grid">${related.map(r => cardHTML(data, r)).join('')}</div>
            </div>
          </section>` : ''}
        </article>

        <section class="final-cta">
          <div class="reveal">
            <h2>Working on a story?</h2>
            <p>For interviews, press assets, or anything newsroom-related, our team will get back to you fast.</p>
            <div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap">
              <a class="btn btn-cobalt" href="mailto:press@privacypal.ai?subject=Press%20inquiry">Email press@privacypal.ai</a>
              <a class="btn btn-ghost" href="news.html">Back to the newsroom</a>
            </div>
          </div>
        </section>
      `;

      wireShare();
      revealIn(root);
    }).catch(err => {
      console.error(err);
      root.innerHTML = `
        <div class="news-missing">
          <h2>We couldn't load that story.</h2>
          <p>Please try again in a moment, or email press@privacypal.ai.</p>
          <a class="btn btn-cobalt" href="news.html">Back to the newsroom</a>
        </div>`;
    });

    function renderBlock(b){
      switch (b.type){
        case 'kicker': return `<p class="article-kicker">${escape(b.text)}</p>`;
        case 'h2':    return `<h2>${escape(b.text)}</h2>`;
        case 'quote': return `<blockquote><p>${escape(b.text)}</p>${b.cite ? `<cite>${escape(b.cite)}</cite>` : ''}</blockquote>`;
        case 'list':  return `<ul>${(b.items || []).map(i => `<li>${escape(i)}</li>`).join('')}</ul>`;
        case 'image': return `<figure><img src="${escape(b.src)}" alt="${escape(b.alt || '')}" loading="lazy">${b.caption ? `<figcaption>${escape(b.caption)}</figcaption>` : ''}</figure>`;
        case 'p':
        default:      return `<p>${escape(b.text)}</p>`;
      }
    }

    function sourceCTA(a){
      return `
        <div class="article-source">
          <div>
            <div class="src-label">Originally published by</div>
            <div class="src-name">${escape(a.source)}</div>
          </div>
          <a class="btn btn-cobalt" href="${escape(a.sourceUrl)}" target="_blank" rel="noopener">
            Read on ${escape(a.source)} ${ARROW}
          </a>
        </div>`;
    }

    function wireShare(){
      const copyBtn = root.querySelector('[data-share="copy"]');
      if (!copyBtn) return;
      copyBtn.addEventListener('click', () => {
        const done = () => {
          copyBtn.classList.add('copied');
          copyBtn.setAttribute('title', 'Link copied');
          setTimeout(() => { copyBtn.classList.remove('copied'); copyBtn.setAttribute('title', 'Copy link'); }, 1600);
        };
        if (navigator.clipboard){ navigator.clipboard.writeText(location.href).then(done).catch(done); }
        else { done(); }
      });
    }
  }
})();
