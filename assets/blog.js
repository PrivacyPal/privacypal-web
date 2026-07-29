/* =========================================================
   The Privacy Log — v3
   - loads blog/blog.json (single source of truth, also feeds rss.xml)
   - blog.html        : featured + grid + search + author/month/tag facets
   - blog-article.html: single post + author bio + related + sharing
   Root-relative asset paths from the JSON (thumbs, heroes, avatars,
   inline images) are repo-root-relative.
   ========================================================= */
(function(){
  const BLOG_URL = 'blog/blog.json';

  const dataPromise = fetch(BLOG_URL, { cache: 'no-store' })
    .then(r => { if (!r.ok) throw new Error('Could not load the Privacy Log (' + r.status + ')'); return r.json(); });

  /* ---------- utils ---------- */
  function escape(s){
    return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }
  // JSON paths are root-relative ("blog/images/x.jpg") — v3 pages live in /v3/
  function asset(p){
    if (!p) return p;
    return /^(https?:)?\/\//.test(p) || p.startsWith('../') || p.startsWith('/') ? p : p;
  }
  function fmtDate(iso){
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d)) return iso;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
  }
  function monthKey(iso){ return (iso || '').slice(0, 7); }              // YYYY-MM
  function monthLabel(key){
    const d = new Date(key + '-01T00:00:00');
    if (isNaN(d)) return key;
    return d.toLocaleDateString('en-US', { year:'numeric', month:'long' });
  }
  function byDateDesc(a, b){ return (a.date < b.date) ? 1 : (a.date > b.date) ? -1 : 0; }
  function articleUrl(a){ return 'blog-article.html?id=' + encodeURIComponent(a.id); }
  function authorLink(id){ return 'blog.html?author=' + encodeURIComponent(id); }
  function tagLink(t){ return 'blog.html?tag=' + encodeURIComponent(t); }

  const ARROW = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 5l7 7-7 7"/></svg>';

  function authorsById(data){
    const m = {};
    (data.authors || []).forEach(a => { m[a.id] = a; });
    return m;
  }
  function authorOf(data, a){
    return (data._authors || (data._authors = authorsById(data)))[a.author] || {
      id: a.author, name: a.author || 'PrivacyPal', role: '', avatar: 'assets/logo-color.png'
    };
  }

  // text the search matches against
  function searchText(data, a){
    const au = authorOf(data, a);
    const bits = [a.title, a.excerpt, au.name, au.role, (a.tags || []).join(' ')];
    (a.body || []).forEach(b => {
      if (b.text) bits.push(b.text);
      if (b.cite) bits.push(b.cite);
      if (b.caption) bits.push(b.caption);
      if (Array.isArray(b.items)) bits.push(b.items.join(' '));
    });
    return bits.join('  ').toLowerCase();
  }

  // avatar element, tolerant of a custom object-position
  function avatarHTML(au, cls){
    const pos = au.avatarPos ? ` style="object-position:${escape(au.avatarPos)}"` : '';
    return `<img class="log-avatar ${cls || ''}" src="${escape(asset(au.avatar))}" alt="${escape(au.name)}"${pos} loading="lazy">`;
  }

  // reusable story card (grid + related)
  function cardHTML(data, a){
    const au = authorOf(data, a);
    const tagPills = (a.tags || []).slice(0, 3).map(t => `<span class="pill">${escape(t)}</span>`).join('');
    return `
      <a class="post-card reveal in" href="${articleUrl(a)}">
        <div class="post-card-media">
          <img src="${escape(asset(a.thumb))}" alt="" loading="lazy" width="800" height="500">
        </div>
        <div class="post-card-body">
          <div class="post-card-meta mono">
            <span>${escape(fmtDate(a.date))}</span>
            ${a.readTime ? `<span class="sep">·</span><span>${escape(a.readTime)}</span>` : ''}
          </div>
          <h3>${escape(a.title)}</h3>
          <p>${escape(a.excerpt || '')}</p>
          ${tagPills ? `<div class="pill-row">${tagPills}</div>` : ''}
          <div class="post-card-foot">
            <span class="log-author">
              ${avatarHTML(au, 'sm')}
              <span class="log-author-name">${escape(au.name)}</span>
            </span>
            <span class="post-card-arrow">${ARROW}</span>
          </div>
        </div>
      </a>`;
  }

  // re-run scroll-reveal over freshly injected nodes
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
  const grid = document.getElementById('blogGrid');
  if (grid){
    const featuredWrap = document.getElementById('blogFeatured');
    const loading  = document.getElementById('blogLoading');
    const empty    = document.getElementById('blogEmpty');
    const countEl  = document.getElementById('blogCount');
    const clearAll = document.getElementById('blogClearAll');
    const searchBox= document.getElementById('blogSearchBox');
    const searchIn = document.getElementById('blogSearch');
    const clearBtn = document.getElementById('blogClear');
    const authorSel= document.getElementById('blogAuthor');
    const monthSel = document.getElementById('blogMonth');
    const tagWrap  = document.getElementById('blogTagFilter');

    let data = null, all = [], featured = null;
    let query = '', fAuthor = 'all', fMonth = 'all';
    const fTags = new Set();

    // read initial filters from the URL (deep links from cards / tags / author)
    const qp = new URLSearchParams(location.search);
    if (qp.get('author')) fAuthor = qp.get('author');
    if (qp.get('month'))  fMonth  = qp.get('month');
    if (qp.get('tag'))    fTags.add(qp.get('tag'));
    if (qp.get('q'))      query   = qp.get('q').toLowerCase();

    dataPromise.then(d => {
      data = d;
      all = (d.articles || []).slice().sort(byDateDesc);
      featured = all.find(a => a.featured) || all[0] || null;
      all.forEach(a => { a._search = searchText(d, a); });

      // ---- author facet ----
      const authorsPresent = [];
      const seenA = new Set();
      all.forEach(a => { if (!seenA.has(a.author)){ seenA.add(a.author); authorsPresent.push(authorOf(d, a)); }});
      authorsPresent.sort((x, y) => x.name.localeCompare(y.name));
      authorsPresent.forEach(au => {
        const o = document.createElement('option');
        o.value = au.id; o.textContent = au.name;
        authorSel.appendChild(o);
      });

      // ---- month facet ----
      const months = Array.from(new Set(all.map(a => monthKey(a.date)))).filter(Boolean).sort().reverse();
      months.forEach(m => {
        const o = document.createElement('option');
        o.value = m; o.textContent = monthLabel(m);
        monthSel.appendChild(o);
      });

      // ---- tag facet (with counts) ----
      const tagCounts = {};
      all.forEach(a => (a.tags || []).forEach(t => { tagCounts[t] = (tagCounts[t] || 0) + 1; }));
      const tagsSorted = Object.keys(tagCounts).sort((x, y) => tagCounts[y] - tagCounts[x] || x.localeCompare(y));
      tagsSorted.forEach(t => {
        const b = document.createElement('button');
        b.type = 'button'; b.className = 'log-chip'; b.dataset.tag = t;
        b.innerHTML = `${escape(t)} <span class="cnt">${tagCounts[t]}</span>`;
        tagWrap.appendChild(b);
      });

      // reflect any URL-provided state into the controls
      authorSel.value = fAuthor === 'all' ? '' : fAuthor;
      monthSel.value  = fMonth  === 'all' ? '' : fMonth;
      if (searchIn && query){ searchIn.value = query; searchBox.classList.add('has-value'); }

      // ---- wire controls ----
      authorSel.addEventListener('change', () => { fAuthor = authorSel.value || 'all'; render(); });
      monthSel.addEventListener('change',  () => { fMonth  = monthSel.value  || 'all'; render(); });
      tagWrap.addEventListener('click', e => {
        const b = e.target.closest('button.log-chip'); if (!b) return;
        const t = b.dataset.tag;
        if (fTags.has(t)) fTags.delete(t); else fTags.add(t);
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
          searchIn.value = ''; query = ''; searchBox.classList.remove('has-value'); searchIn.focus(); render();
        });
      }
      if (clearAll){
        clearAll.addEventListener('click', () => {
          query = ''; fAuthor = 'all'; fMonth = 'all'; fTags.clear();
          if (searchIn){ searchIn.value = ''; searchBox.classList.remove('has-value'); }
          authorSel.value = ''; monthSel.value = '';
          render();
        });
      }

      render();
    }).catch(err => {
      console.error(err);
      loading.hidden = true;
      empty.hidden = false;
      empty.querySelector('h3').textContent = "We couldn't load the Privacy Log.";
      empty.querySelector('p').textContent  = "Please try again in a moment, or email hello@privacypal.ai.";
    });

    function filtersActive(){
      return query.length > 0 || fAuthor !== 'all' || fMonth !== 'all' || fTags.size > 0;
    }

    function render(){
      loading.hidden = true;
      const filtering = filtersActive();

      let list = all.filter(a => {
        if (fAuthor !== 'all' && a.author !== fAuthor) return false;
        if (fMonth  !== 'all' && monthKey(a.date) !== fMonth) return false;
        if (fTags.size){
          const has = (a.tags || []).some(t => fTags.has(t));
          if (!has) return false;
        }
        if (query && a._search.indexOf(query) === -1) return false;
        return true;
      });

      // sync control visual state
      authorSel.parentElement.classList.toggle('active', fAuthor !== 'all');
      monthSel.parentElement.classList.toggle('active', fMonth !== 'all');
      tagWrap.querySelectorAll('button.log-chip').forEach(b => b.classList.toggle('active', fTags.has(b.dataset.tag)));
      clearAll.classList.toggle('show', filtering);

      // featured banner only in the default, unfiltered view
      const showFeatured = !filtering && featured;
      featuredWrap.hidden = !showFeatured;
      featuredWrap.innerHTML = showFeatured ? featuredHTML(featured) : '';
      const gridList = showFeatured ? list.filter(a => a.id !== featured.id) : list;

      if (!list.length){
        grid.hidden = true; grid.innerHTML = '';
        empty.hidden = false;
        empty.querySelector('h3').textContent = 'Nothing matches those filters yet.';
        empty.querySelector('p').textContent  = query
          ? `No posts for “${searchIn.value.trim()}”. Try another search or clear the filters.`
          : 'Try a different combination — or clear the filters to see everything.';
        countEl.textContent = '';
      } else {
        empty.hidden = true;
        grid.hidden = false;
        grid.innerHTML = gridList.map(a => cardHTML(data, a)).join('');
        const n = list.length;
        countEl.textContent = filtering
          ? `${n} ${n === 1 ? 'post' : 'posts'}`
          : `${n} ${n === 1 ? 'post' : 'posts'} from the Privacy Log`;
      }
      revealIn(featuredWrap); revealIn(grid);
    }

    function featuredHTML(a){
      const au = authorOf(data, a);
      const primaryTag = (a.tags || [])[0] || '';
      return `
        <a class="log-featured reveal in" href="${articleUrl(a)}">
          <div class="log-featured-media">
            <img src="${escape(asset(a.hero))}" alt="" width="1600" height="900">
          </div>
          <div class="log-featured-body">
            <div class="log-featured-meta mono">
              <span class="log-flag"><span class="dot"></span>Latest</span>
              ${primaryTag ? `<span class="pill">${escape(primaryTag)}</span>` : ''}
              <span>${escape(fmtDate(a.date))}</span>
              ${a.readTime ? `<span class="sep">·</span><span>${escape(a.readTime)}</span>` : ''}
            </div>
            <h2>${escape(a.title)}</h2>
            <p class="excerpt">${escape(a.excerpt || '')}</p>
            <div class="log-featured-foot">
              <span class="log-author">
                ${avatarHTML(au)}
                <span>
                  <span class="log-author-name">${escape(au.name)}</span><br>
                  <span class="log-author-role">${escape(au.role || '')}</span>
                </span>
              </span>
              <span class="link-arrow">Read the post</span>
            </div>
          </div>
        </a>`;
    }
  }

  /* =======================================================
     ARTICLE PAGE
     ======================================================= */
  const root = document.getElementById('blogArticleRoot');
  if (root){
    const params = new URLSearchParams(location.search);
    const id = params.get('id');

    dataPromise.then(data => {
      const all = (data.articles || []).slice().sort(byDateDesc);
      const a = all.find(x => x.id === id);
      if (!a){
        root.innerHTML = `
          <div class="post-missing">
            <h2>That post couldn't be found.</h2>
            <p>It may have moved, or the link may be wrong. Head back to the Privacy Log for the latest.</p>
            <div class="btn-row" style="justify-content:center">
              <a class="btn btn-primary" href="blog.html">Back to the Privacy Log</a>
              <a class="btn btn-ghost" href="mailto:hello@privacypal.ai">Email us</a>
            </div>
          </div>`;
        return;
      }

      const au = authorOf(data, a);
      const shareUrl = location.href;
      const shareText = a.title;

      // ---- meta / social ----
      document.title = `${a.title} — The Privacy Log — PrivacyPal`;
      setMeta('name', 'description', a.excerpt || '');
      setMeta('property', 'og:title', a.title);
      setMeta('name', 'twitter:title', a.title);
      setMeta('property', 'og:description', a.excerpt || '');
      setMeta('name', 'twitter:description', a.excerpt || '');
      setMeta('property', 'og:url', shareUrl);
      setMeta('property', 'article:author', au.name);
      setMeta('property', 'article:published_time', a.date);
      setCanonical(shareUrl);

      // related: same author first, then shared tags, then most-recent — max 3
      const tagset = new Set(a.tags || []);
      const related = all.filter(x => x.id !== a.id)
        .map(x => {
          const sharedTags = (x.tags || []).filter(t => tagset.has(t)).length;
          const sameAuthor = x.author === a.author ? 1 : 0;
          return { x, score: sameAuthor * 2 + sharedTags };
        })
        .sort((p, q) => q.score - p.score || byDateDesc(p.x, q.x))
        .slice(0, 3).map(o => o.x);

      const tagsHero = (a.tags || []).map(t => `<span class="pill">${escape(t)}</span>`).join('');
      const tagsRow  = (a.tags || []).map(t => `<a class="pill" href="${tagLink(t)}">${escape(t)}</a>`).join('');

      root.innerHTML = `
        <article>
          <header class="post-head">
            <div class="container">
              <div class="post-head-inner">
                <p class="post-crumbs reveal in"><a class="link-arrow back" href="blog.html">The Privacy Log</a></p>
                ${tagsHero ? `<div class="pill-row reveal in" style="justify-content:center">${tagsHero}</div>` : ''}
                <h1 class="reveal in">${escape(a.title)}</h1>
                ${a.excerpt ? `<p class="lede reveal in">${escape(a.excerpt)}</p>` : ''}
                <div class="post-byline reveal in">
                  ${avatarHTML(au)}
                  <span class="who">
                    <a class="log-author-name" href="${authorLink(au.id)}">${escape(au.name)}</a><br>
                    <span class="mono meta">${escape(au.role || '')}</span>
                  </span>
                  <span class="mono meta sep">·</span>
                  <span class="mono meta">${escape(fmtDate(a.date))}${a.readTime ? ' · ' + escape(a.readTime) : ''}</span>
                </div>
              </div>
            </div>
          </header>

          <div class="container">
            <figure class="post-hero-img reveal in"><img src="${escape(asset(a.hero))}" alt="" width="1600" height="900"></figure>
          </div>

          <section class="section-sm">
            <div class="container">
              <div class="prose post-body">
                ${(a.body || []).map(renderBlock).join('')}
                ${tagsRow ? `<div class="post-tagrow"><span class="lbl mono">Filed under</span><span class="pill-row">${tagsRow}</span></div>` : ''}
                <div class="post-share">
                  <span class="share-label mono">Share this post</span>
                  <div class="share-row">
                    <button class="share-btn" type="button" data-share="copy" aria-label="Copy link" title="Copy link">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
                    </button>
                    <a class="share-btn" href="https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener" aria-label="Share on X" title="Share on X">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.75L4.84 22H1.58l8.02-9.17L1.5 2h6.75l4.66 6.16L18.244 2Zm-1.16 18h1.83L7.01 3.9H5.05L17.084 20Z"/></svg>
                    </a>
                    <a class="share-btn" href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}" target="_blank" rel="noopener" aria-label="Share on LinkedIn" title="Share on LinkedIn">
                      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm6 0h3.83v1.64h.05c.53-.95 1.83-1.95 3.77-1.95C20.2 8.69 21 11 21 14.02V21h-4v-6.2c0-1.48-.03-3.38-2.06-3.38-2.06 0-2.38 1.6-2.38 3.27V21H9V9Z"/></svg>
                    </a>
                    <a class="share-btn" href="mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}" aria-label="Share by email" title="Share by email">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
                    </a>
                  </div>
                </div>
                ${authorCardHTML(au)}
              </div>
            </div>
          </section>

          ${related.length ? `
          <section class="section post-related" style="padding-top:24px">
            <div class="container">
              <div class="section-head reveal in">
                <span class="eyebrow">More from the Privacy Log</span>
                <h2>Keep reading</h2>
              </div>
              <div class="post-grid">${related.map(r => cardHTML(data, r)).join('')}</div>
            </div>
          </section>` : ''}
        </article>
      `;

      wireShare();
      revealIn(root);
    }).catch(err => {
      console.error(err);
      root.innerHTML = `
        <div class="post-missing">
          <h2>We couldn't load that post.</h2>
          <p>Please try again in a moment, or email hello@privacypal.ai.</p>
          <a class="btn btn-primary" href="blog.html">Back to the Privacy Log</a>
        </div>`;
    });

    function renderBlock(b){
      switch (b.type){
        case 'kicker': return `<p class="kicker">${escape(b.text)}</p>`;
        case 'h2':    return `<h2>${escape(b.text)}</h2>`;
        case 'quote': return `<blockquote><p>${escape(b.text)}</p>${b.cite ? `<cite>${escape(b.cite)}</cite>` : ''}</blockquote>`;
        case 'list':  return `<ul>${(b.items || []).map(i => `<li>${escape(i)}</li>`).join('')}</ul>`;
        case 'image': return `<figure><img src="${escape(asset(b.src))}" alt="${escape(b.alt || '')}" loading="lazy">${b.caption ? `<figcaption>${escape(b.caption)}</figcaption>` : ''}</figure>`;
        case 'p':
        default:      return `<p>${escape(b.text)}</p>`;
      }
    }

    function authorCardHTML(au){
      const li = au.linkedin ? `
        <a class="ln link-arrow" href="${escape(au.linkedin)}" target="_blank" rel="noopener">Connect on LinkedIn</a>` : '';
      return `
        <div class="post-authorcard">
          ${avatarHTML(au, 'lg')}
          <div class="who">
            <span class="kick mono">Written by</span>
            <h3>${escape(au.name)}</h3>
            <div class="role mono">${escape(au.role || '')}</div>
            ${au.bio ? `<p>${escape(au.bio)}</p>` : ''}
            ${li}
          </div>
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

    // set/update a <meta> tag by name= or property=
    function setMeta(attr, key, content){
      let el = document.head.querySelector(`meta[${attr}="${key}"]`);
      if (!el){ el = document.createElement('meta'); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute('content', content);
    }
    function setCanonical(href){
      let el = document.head.querySelector('link[rel="canonical"]');
      if (!el){ el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
      el.setAttribute('href', href);
    }
  }
})();
