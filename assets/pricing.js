/* =========================================================
   PrivacyPal — pricing engine
   Drives the billing toggle, the Max seat slider (volume
   pricing) and every price readout on pricing.html and
   privacypal-max.html. No dependencies.

   Markup contract
   ---------------
   Billing toggle : .billing-toggle > button[data-billing="monthly|annual"]
   Pro readouts   : [data-price="pro-unit|pro-term|pro-save"]
   Max readouts   : [data-price="max-unit|max-term|max-save|max-note"]
   Calculator     : [data-seat-calc] wrapping input.seat-range and
                    [data-calc="seats|unit|total|total-label|tier|save"]
   Tier legend    : button.seat-tier[data-tier="0..3"]
   Tier table     : tr[data-tier-row="0..3"]
   ========================================================= */
(function () {
  'use strict';

  /* ---------- The price book (single source of truth) ---------- */
  var PRO = { monthly: 9, annual: 7.5 };

  var MAX_TIERS = [
    { min: 1,    max: 9,        label: '1-9 seats',     monthly: 34, annual: 30 },
    { min: 10,   max: 99,       label: '10-99 seats',   monthly: 29, annual: 25 },
    { min: 100,  max: 999,      label: '100-999 seats', monthly: 26, annual: 21 },
    { min: 1000, max: Infinity, label: '1000+ seats',   monthly: 22, annual: 17 }
  ];

  /* Slider stops: dense where teams actually buy, sparse at the top end. */
  var STOPS = [
    1, 2, 3, 4, 5, 6, 7, 8, 9,
    10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 90,
    100, 125, 150, 200, 250, 300, 400, 500, 600, 700, 800, 900,
    1000, 1250, 1500, 2000, 2500, 3000, 4000, 5000
  ];

  var state = { billing: 'annual', seats: 25 };

  /* ---------- Helpers ---------- */
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  function money(n) {
    var v = Math.round(n * 100) / 100;
    return '$' + (v % 1 === 0 ? v.toLocaleString('en-US') : v.toFixed(2));
  }
  function moneyRound(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
  function count(n) { return n.toLocaleString('en-US'); }

  function tierFor(seats) {
    for (var i = 0; i < MAX_TIERS.length; i++) {
      if (seats >= MAX_TIERS[i].min && seats <= MAX_TIERS[i].max) return MAX_TIERS[i];
    }
    return MAX_TIERS[MAX_TIERS.length - 1];
  }
  function tierIndex(seats) { return MAX_TIERS.indexOf(tierFor(seats)); }

  function savePct(monthlyRate, annualRate) {
    return Math.round((monthlyRate - annualRate) / monthlyRate * 100);
  }

  function nearestStopIndex(seats) {
    var best = 0, bestGap = Infinity;
    for (var i = 0; i < STOPS.length; i++) {
      var gap = Math.abs(STOPS[i] - seats);
      if (gap < bestGap) { bestGap = gap; best = i; }
    }
    return best;
  }

  function setText(sel, html) {
    $all('[data-price="' + sel + '"]').forEach(function (el) { el.innerHTML = html; });
  }
  function setCalc(sel, html, root) {
    $all('[data-calc="' + sel + '"]', root).forEach(function (el) { el.innerHTML = html; });
  }

  /* ---------- Render ---------- */
  function renderPro() {
    var annual = state.billing === 'annual';
    var unit = annual ? PRO.annual : PRO.monthly;
    setText('pro-unit', money(unit));
    setText('pro-term', annual
      ? '/mo · one person · billed ' + money(PRO.annual * 12) + '/yr'
      : '/mo · one person · billed monthly');
    setText('pro-save', annual ? 'Save ' + savePct(PRO.monthly, PRO.annual) + '%' : '');
    $all('[data-price="pro-save"]').forEach(function (el) { el.hidden = !annual; });
  }

  function renderMax() {
    var annual = state.billing === 'annual';
    var tier = tierFor(state.seats);
    var unit = annual ? tier.annual : tier.monthly;
    var list = MAX_TIERS[0];

    setText('max-unit', money(unit));
    setText('max-term', annual
      ? '/mo · per seat · billed ' + money(unit * 12) + '/yr'
      : '/mo · per seat · billed monthly');
    setText('max-save', annual ? 'Save ' + savePct(tier.monthly, tier.annual) + '%' : '');
    $all('[data-price="max-save"]').forEach(function (el) { el.hidden = !annual; });

    var off = Math.round((list[annual ? 'annual' : 'monthly'] - unit) / list[annual ? 'annual' : 'monthly'] * 100);
    setText('max-note', tier === list
      ? 'Priced at <b>' + count(state.seats) + (state.seats === 1 ? ' seat</b>' : ' seats</b>') + ' · volume pricing starts at 10 seats'
      : 'Priced at <b>' + count(state.seats) + ' seats</b> · ' + tier.label + ' · <b>' + off + '% off</b> the 1-9 seat rate');
  }

  function renderCalc() {
    var annual = state.billing === 'annual';
    var tier = tierFor(state.seats);
    var unit = annual ? tier.annual : tier.monthly;
    var list = MAX_TIERS[0];
    var listRate = annual ? list.annual : list.monthly;
    var off = Math.round((listRate - unit) / listRate * 100);

    $all('[data-seat-calc]').forEach(function (root) {
      setCalc('seats', count(state.seats), root);
      setCalc('seat-word', state.seats === 1 ? 'seat' : 'seats', root);
      setCalc('unit', money(unit) + '<small>/seat/mo</small>', root);
      setCalc('total-label', annual ? 'Billed annually' : 'Billed monthly', root);
      setCalc('total', annual
        ? moneyRound(unit * 12 * state.seats) + '<small>/yr</small>'
        : moneyRound(unit * state.seats) + '<small>/mo</small>', root);
      setCalc('tier', tier.label, root);
      setCalc('tier-sub', off > 0 ? off + '% off the 1-9 seat rate' : 'List price', root);
      setCalc('save', moneyRound((tier.monthly - tier.annual) * 12 * state.seats) + '<small>/yr</small>', root);

      var input = root.querySelector('input.seat-range');
      if (input) {
        var idx = Number(input.value);
        var pct = STOPS.length > 1 ? (idx / (STOPS.length - 1)) * 100 : 0;
        input.style.setProperty('--fill', pct.toFixed(2) + '%');
        input.setAttribute('aria-valuetext', count(state.seats) + (state.seats === 1 ? ' seat' : ' seats'));
      }

      $all('.seat-tier', root).forEach(function (btn) {
        btn.classList.toggle('active', Number(btn.dataset.tier) === tierIndex(state.seats));
      });
    });

    $all('tr[data-tier-row]').forEach(function (row) {
      row.classList.toggle('tier-on', Number(row.dataset.tierRow) === tierIndex(state.seats));
    });
  }

  function render() { renderPro(); renderMax(); renderCalc(); }

  /* ---------- Wiring ---------- */
  function setBilling(mode) {
    state.billing = mode === 'monthly' ? 'monthly' : 'annual';
    $all('.billing-toggle button[data-billing]').forEach(function (b) {
      var on = b.dataset.billing === state.billing;
      b.classList.toggle('active', on);
      b.setAttribute('aria-selected', on ? 'true' : 'false');
    });
    render();
  }

  function init() {
    $all('.billing-toggle button[data-billing]').forEach(function (b) {
      b.addEventListener('click', function () { setBilling(b.dataset.billing); });
    });

    $all('[data-seat-calc]').forEach(function (root) {
      var input = root.querySelector('input.seat-range');
      if (!input) return;
      input.min = 0;
      input.max = STOPS.length - 1;
      input.step = 1;
      input.value = nearestStopIndex(Number(root.dataset.seatCalc) || state.seats);
      state.seats = STOPS[Number(input.value)];
      input.setAttribute('aria-label', 'Number of Max seats');

      input.addEventListener('input', function () {
        state.seats = STOPS[Number(input.value)];
        render();
      });

      $all('.seat-tier', root).forEach(function (btn) {
        btn.addEventListener('click', function () {
          var tier = MAX_TIERS[Number(btn.dataset.tier)];
          if (!tier) return;
          input.value = nearestStopIndex(tier.min);
          state.seats = STOPS[Number(input.value)];
          render();
        });
      });
    });

    var active = document.querySelector('.billing-toggle button[data-billing].active');
    setBilling(active ? active.dataset.billing : 'annual');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
