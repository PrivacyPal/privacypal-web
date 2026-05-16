/* =========================================================
   Careers — shared helpers
   - loadJobs(): fetches careers/jobs.json
   - renders listings on careers.html
   - renders single role + form on careers-apply.html
   ========================================================= */
(function(){
  const JOBS_URL = 'careers/jobs.json';

  // ---------- data ----------
  const dataPromise = fetch(JOBS_URL, { cache: 'no-store' })
    .then(r => {
      if (!r.ok) throw new Error('Could not load roles (' + r.status + ')');
      return r.json();
    });

  function teamLabel(data, id){
    const t = (data.teams || []).find(x => x.id === id);
    return t ? t.label : id;
  }
  function locLabel(data, id){
    const l = (data.locations || []).find(x => x.id === id);
    return l ? l.label : id;
  }
  function escape(s){
    return String(s || '').replace(/[&<>"']/g, c => ({
      '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
    }[c]));
  }

  // ---------- LISTINGS PAGE ----------
  const grid    = document.getElementById('rolesGrid');
  const loading = document.getElementById('rolesLoading');
  const empty   = document.getElementById('rolesEmpty');
  const filters = document.getElementById('roleFilters');

  if (grid){
    let currentTeam = 'all';
    let dataset = null;

    dataPromise.then(data => {
      dataset = data;
      // build filter chips
      (data.teams || []).forEach(t => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.dataset.team = t.id;
        b.textContent = t.label;
        filters.appendChild(b);
      });

      filters.addEventListener('click', e => {
        const btn = e.target.closest('button.chip');
        if (!btn) return;
        currentTeam = btn.dataset.team;
        filters.querySelectorAll('button.chip').forEach(b => b.classList.toggle('active', b === btn));
        render();
      });

      render();
    }).catch(err => {
      console.error(err);
      loading.hidden = true;
      empty.hidden = false;
      empty.querySelector('p').textContent =
        "We couldn't load open roles right now. Email careers@privacypal.ai and we'll send the list over.";
    });

    function render(){
      const jobs = (dataset.jobs || []).filter(j => currentTeam === 'all' || j.team === currentTeam);
      loading.hidden = true;
      if (!jobs.length){
        grid.hidden = true;
        empty.hidden = false;
        return;
      }
      empty.hidden = true;
      grid.hidden  = false;

      grid.innerHTML = jobs.map(j => `
        <a class="role-card reveal in" href="careers-apply.html?id=${encodeURIComponent(j.id)}">
          <div>
            <div class="role-meta">
              <span class="role-tag">${escape(teamLabel(dataset, j.team))}</span>
              <span class="role-tag loc">${escape(locLabel(dataset, j.location))}</span>
              <span class="role-tag type">${escape(j.type || 'Full-time')}</span>
              ${j.level ? `<span class="role-tag type">${escape(j.level)}</span>` : ''}
            </div>
            <h3>${escape(j.title)}</h3>
            <p>${escape(j.summary || '')}</p>
          </div>
          <span class="role-cta">
            View role
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                 stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 5l7 7-7 7"/>
            </svg>
          </span>
        </a>
      `).join('');
    }
  }

  // ---------- APPLY PAGE ----------
  const applyRoot = document.getElementById('applyRoot');
  if (applyRoot){
    const params = new URLSearchParams(location.search);
    const jobId  = params.get('id');

    dataPromise.then(data => {
      const job = (data.jobs || []).find(j => j.id === jobId);
      if (!job){
        applyRoot.innerHTML = `
          <div class="job-missing">
            <h2>That role couldn't be found.</h2>
            <p>It may have closed, or the link may be wrong. Browse our current open roles or send us a note directly.</p>
            <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
              <a class="btn btn-cobalt" href="careers-full.html">See open roles</a>
              <a class="btn btn-ghost" href="mailto:careers@privacypal.ai">Email us</a>
            </div>
          </div>`;
        return;
      }

      document.title = `${job.title} — Careers — PrivacyPal`;
      const teamName = teamLabel(data, job.team);
      const locName  = locLabel(data, job.location);
      const applicationsEmail = (data.meta && data.meta.applicationsEmail) || 'careers@privacypal.ai';

      applyRoot.innerHTML = `
        <section class="sub-hero careers-hero job-hero">
          <div class="container">
            <div class="crumbs reveal in">
              <a href="careers-full.html">Careers</a>
              <span> / ${escape(teamName)}</span>
            </div>
            <span class="eyebrow reveal in">${escape(teamName)} · ${escape(locName)}</span>
            <h1 class="reveal in">${escape(job.title)}</h1>
            <p class="lede reveal in" style="margin-top:18px">${escape(job.summary || '')}</p>
            <div class="job-tags reveal in">
              <span class="role-tag">${escape(teamName)}</span>
              <span class="role-tag loc">${escape(locName)}</span>
              <span class="role-tag type">${escape(job.type || 'Full-time')}</span>
              ${job.level ? `<span class="role-tag type">${escape(job.level)}</span>` : ''}
              ${job.comp ? `<span class="role-tag type">${escape(job.comp)}</span>` : ''}
            </div>
          </div>
        </section>

        <section class="section">
          <div class="container">
            <div class="job-layout">

              <div class="job-body">
                ${job.about ? `
                <section class="reveal">
                  <h2>About the role</h2>
                  <p>${escape(job.about)}</p>
                </section>` : ''}

                ${Array.isArray(job.responsibilities) && job.responsibilities.length ? `
                <section class="reveal">
                  <h2>What you'll own</h2>
                  <ul>${job.responsibilities.map(r => `<li>${escape(r)}</li>`).join('')}</ul>
                </section>` : ''}

                ${Array.isArray(job.qualifications) && job.qualifications.length ? `
                <section class="reveal">
                  <h2>What we're looking for</h2>
                  <ul>${job.qualifications.map(r => `<li>${escape(r)}</li>`).join('')}</ul>
                </section>` : ''}

                ${Array.isArray(job.nicetohave) && job.nicetohave.length ? `
                <section class="reveal">
                  <h2>Nice to have</h2>
                  <ul>${job.nicetohave.map(r => `<li>${escape(r)}</li>`).join('')}</ul>
                </section>` : ''}

                <section class="reveal">
                  <h2>Compensation</h2>
                  <p>${escape(job.comp || 'Top-of-band cash and meaningful equity. We share the band on the first call.')} The number on the offer letter is the number we believe in — we don't negotiate against ourselves and we don't expect you to.</p>
                </section>
              </div>

              <aside class="apply-card reveal" id="applyCardWrap">
                <h3>Apply for this role</h3>
                <p class="sub">We read every application. You'll hear back inside a week.</p>

                <form id="applyForm"
                      action="https://formsubmit.co/${encodeURIComponent(applicationsEmail)}"
                      method="POST"
                      enctype="multipart/form-data">

                  <input type="hidden" name="_subject" value="New application — ${escape(job.title)}">
                  <input type="hidden" name="_template" value="table">
                  <input type="hidden" name="_captcha" value="false">
                  <input type="hidden" name="_next" value="${location.origin}${location.pathname.replace(/[^\/]*$/, '')}careers-thanks.html">
                  <input type="hidden" name="_honey" value="" tabindex="-1" autocomplete="off" style="display:none">
                  <input type="hidden" name="Role" value="${escape(job.title)}">
                  <input type="hidden" name="Role ID" value="${escape(job.id)}">
                  <input type="hidden" name="Team" value="${escape(teamName)}">
                  <input type="hidden" name="Location" value="${escape(locName)}">

                  <div class="field-row">
                    <div class="field">
                      <label for="firstName">First name<span class="req">*</span></label>
                      <input type="text" id="firstName" name="First name" required autocomplete="given-name">
                    </div>
                    <div class="field">
                      <label for="lastName">Last name<span class="req">*</span></label>
                      <input type="text" id="lastName" name="Last name" required autocomplete="family-name">
                    </div>
                  </div>

                  <div class="field">
                    <label for="email">Email<span class="req">*</span></label>
                    <input type="email" id="email" name="Email" required autocomplete="email">
                  </div>

                  <div class="field-row">
                    <div class="field">
                      <label for="phone">Phone<span class="req">*</span></label>
                      <input type="tel" id="phone" name="Phone" required autocomplete="tel">
                    </div>
                    <div class="field">
                      <label for="locationField">Where you'd work from<span class="req">*</span></label>
                      <input type="text" id="locationField" name="Candidate location" required placeholder="City, country">
                    </div>
                  </div>

                  <div class="field">
                    <label for="linkedin">LinkedIn or personal site<span class="req">*</span></label>
                    <input type="url" id="linkedin" name="LinkedIn / site" required placeholder="https://">
                  </div>

                  <div class="field">
                    <label for="portfolio">Portfolio, GitHub, or proof of work<span class="req">*</span></label>
                    <input type="url" id="portfolio" name="Portfolio / GitHub" required placeholder="https://">
                  </div>

                  <div class="field">
                    <label for="resume">Resume (PDF preferred)<span class="req">*</span></label>
                    <div class="file-field" id="fileField">
                      <input type="file" id="resume" name="attachment" required accept=".pdf,.doc,.docx,application/pdf">
                      <div class="file-label" id="fileLabel">
                        Drop a file or <b>browse</b> — PDF, DOC, or DOCX up to 5MB
                      </div>
                    </div>
                  </div>

                  <div class="field">
                    <label for="message">Why this role, in your words<span class="req">*</span></label>
                    <textarea id="message" name="Why this role" rows="5" required
                              placeholder="What you'd want to own. What you'd change. What you'd build first."></textarea>
                  </div>

                  <label class="consent" for="consent">
                    <input type="checkbox" id="consent" name="Consent" value="acknowledged" required>
                    <span>I consent to PrivacyPal storing and reviewing this application. We'll only use it to evaluate you for this role and future openings, and we never share it externally.</span>
                  </label>

                  <button class="submit-btn" type="submit" id="submitBtn">
                    <span class="lbl">Submit application</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
                         style="width:16px;height:16px">
                      <path d="M5 12h14M13 5l7 7-7 7"/>
                    </svg>
                  </button>

                  <div class="apply-status" id="applyStatus" aria-live="polite"></div>

                  <p class="apply-footnote">
                    Trouble with the form? Email
                    <a href="mailto:${escape(applicationsEmail)}?subject=Application%20—%20${encodeURIComponent(job.title)}"
                       style="color:var(--cobalt)">${escape(applicationsEmail)}</a>
                    with your resume attached.
                  </p>
                </form>
              </aside>

            </div>
          </div>
        </section>
      `;

      // re-run reveal observer on newly injected nodes
      if (window.IntersectionObserver){
        const io = new IntersectionObserver(entries => {
          entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }});
        }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
        applyRoot.querySelectorAll('.reveal:not(.in)').forEach(el => io.observe(el));
      }

      wireApplyForm();
    }).catch(err => {
      console.error(err);
      applyRoot.innerHTML = `
        <div class="job-missing">
          <h2>We couldn't load that role.</h2>
          <p>Email careers@privacypal.ai and we'll send the description over directly.</p>
          <a class="btn btn-cobalt" href="careers-full.html">Back to careers</a>
        </div>`;
    });

    function wireApplyForm(){
      const form     = document.getElementById('applyForm');
      const fileIn   = document.getElementById('resume');
      const fileWrap = document.getElementById('fileField');
      const fileLbl  = document.getElementById('fileLabel');
      const status   = document.getElementById('applyStatus');
      const btn      = document.getElementById('submitBtn');
      if (!form) return;

      fileIn.addEventListener('change', () => {
        const f = fileIn.files && fileIn.files[0];
        if (!f){
          fileWrap.classList.remove('has-file');
          fileLbl.innerHTML = 'Drop a file or <b>browse</b> — PDF, DOC, or DOCX up to 5MB';
          return;
        }
        if (f.size > 5 * 1024 * 1024){
          status.className = 'apply-status error';
          status.textContent = 'That file is over 5MB. Please attach a smaller PDF, or include a link to your resume.';
          fileIn.value = '';
          fileWrap.classList.remove('has-file');
          return;
        }
        status.className = 'apply-status'; status.textContent = '';
        fileWrap.classList.add('has-file');
        fileLbl.innerHTML = '<b>' + escape(f.name) + '</b> — ' + (f.size/1024).toFixed(0) + ' KB';
      });

      form.addEventListener('submit', e => {
        // bot honeypot
        const honey = form.querySelector('input[name="_honey"]');
        if (honey && honey.value){ e.preventDefault(); return; }

        // belt-and-suspenders validation: native HTML5 should already block
        // this (form has no `novalidate`), but enforce in JS too so a stale
        // cached page or quirky browser can't slip an invalid submission past
        if (!form.checkValidity()){
          e.preventDefault();
          form.reportValidity();
          return;
        }
        const consent = form.querySelector('#consent');
        if (consent && !consent.checked){
          e.preventDefault();
          consent.focus();
          consent.reportValidity();
          return;
        }

        // route the POST into a hidden iframe so the page never navigates
        // away from privacypal.ai (FormSubmit otherwise redirects)
        const iframeName = 'pp-apply-target-' + Date.now();
        const iframe = document.createElement('iframe');
        iframe.name = iframeName;
        iframe.setAttribute('aria-hidden', 'true');
        iframe.style.cssText = 'position:absolute;width:0;height:0;border:0;visibility:hidden';
        document.body.appendChild(iframe);
        form.target = iframeName;

        btn.disabled = true;
        btn.querySelector('.lbl').textContent = 'Submitting…';

        iframe.addEventListener('load', () => {
          // The iframe's initial about:blank insertion can fire load too —
          // ignore it. Only the post-submit navigation matters.
          let landedHere = false;
          try {
            const url = iframe.contentWindow.location.href;
            if (url === 'about:blank' || url === '') return;
            // Reading succeeded → same-origin → FormSubmit's _next redirect
            // returned us to our own thanks page. The email actually went out.
            landedHere = true;
          } catch (_err) {
            // Cross-origin: FormSubmit served its own page (activation gate,
            // captcha, rate-limit, or error). The application did NOT deliver.
          }

          if (landedHere){
            showApplySuccess();
            setTimeout(() => iframe.remove(), 800);
          } else {
            showApplyError();
            iframe.remove();
          }
        });
      });
    }

    function showApplyError(){
      const status = document.getElementById('applyStatus');
      const btn    = document.getElementById('submitBtn');
      if (status){
        status.className = 'apply-status error';
        status.innerHTML = "We couldn't submit your application right now. Please email your resume to <a href=\"mailto:ops@privacypal.ai\" style=\"color:var(--cobalt)\">ops@privacypal.ai</a> and we'll take it from there.";
      }
      if (btn){
        btn.disabled = false;
        btn.querySelector('.lbl').textContent = 'Submit application';
      }
    }

    function showApplySuccess(){
      const card = document.getElementById('applyCardWrap');
      if (!card) return;
      card.classList.add('apply-card-success');
      card.innerHTML = `
        <div class="apply-success">
          <div class="apply-success-check" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"
                 stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 12l5 5L20 7"/>
            </svg>
          </div>
          <h3>Application received</h3>
          <p>Thanks — we've got it. A real human on our team will read it inside the next few business days, and we'll get back to you either way.</p>
          <div class="apply-success-actions">
            <a class="btn btn-cobalt" href="careers-full.html">See other roles</a>
          </div>
        </div>
      `;
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }
})();
