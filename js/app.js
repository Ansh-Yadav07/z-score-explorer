/* ===========================================================
   MATHEMATICS
   =========================================================== */
// Standard normal CDF Φ(x) — Hart (1968) / West (2005) double-precision
// algorithm. Relative error < 1e-8 everywhere, including deep in the tails,
// so small tail probabilities are reported accurately (unlike the
// Abramowitz & Stegun 7.1.26 formula, which has ~1e-7 *absolute* error).
function normalCDF(x) {
  if (Number.isNaN(x)) return NaN;
  const a = Math.abs(x);
  let c;
  if (a > 37) {
    c = 0;
  } else {
    const e = Math.exp(-a * a / 2);
    if (a < 7.07106781186547) {
      let b = 3.52624965998911e-02 * a + 0.700383064443688;
      b = b * a + 6.37396220353165;
      b = b * a + 33.912866078383;
      b = b * a + 112.079291497871;
      b = b * a + 221.213596169931;
      b = b * a + 220.206867912376;
      c = e * b;
      b = 8.83883476483184e-02 * a + 1.75566716318264;
      b = b * a + 16.064177579207;
      b = b * a + 86.7807322029461;
      b = b * a + 296.564248779674;
      b = b * a + 637.333633378831;
      b = b * a + 793.826512519948;
      b = b * a + 440.413735824752;
      c = c / b;
    } else {
      let b = a + 0.65;
      b = a + 4 / b;
      b = a + 3 / b;
      b = a + 2 / b;
      b = a + 1 / b;
      c = e / b / 2.506628274631;
    }
  }
  return x > 0 ? 1 - c : c;
}

// Upper tail P(Z ≥ x), computed without the 1 − Φ(x) cancellation
function upperTail(x) { return normalCDF(-x); }

// Probability between 0 and |x|, accurate for small and large |x|
function areaZeroTo(x) {
  const a = Math.abs(x);
  return a < 1 ? normalCDF(a) - 0.5 : 0.5 - upperTail(a);
}

// Probability between a and b (a ≤ b), using whichever tail form is more precise
function areaBetween(a, b) {
  if (a >= 0) return upperTail(a) - upperTail(b);
  if (b <= 0) return normalCDF(b) - normalCDF(a);
  return 1 - normalCDF(a) - upperTail(b);
}

function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// Inverse CDF Φ⁻¹(p) — Acklam's rational approximation + one Halley step
function inverseNormalCDF(p) {
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  const pLow = 0.02425;
  let q, r, x;
  if (p < pLow) {
    q = Math.sqrt(-2 * Math.log(p));
    x = (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  } else if (p <= 1 - pLow) {
    q = p - 0.5; r = q * q;
    x = (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
  } else {
    q = Math.sqrt(-2 * Math.log(1 - p));
    x = -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
  }
  const e = normalCDF(x) - p;
  const u = e * Math.sqrt(2 * Math.PI) * Math.exp(x * x / 2);
  return x - u / (1 + x * u / 2);
}

/* ===========================================================
   FORMATTING
   =========================================================== */
const SUP = { '-': '⁻', '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹' };
function sci(v, digits = 3) {
  const [m, e] = v.toExponential(digits - 1).split('e');
  const exp = String(parseInt(e, 10)).replace(/[-0-9]/g, ch => SUP[ch]);
  return `${m} × 10${exp}`;
}

// Z-score: up to 4 decimals, trailing zeros trimmed, typographic minus
function fmtZ(z) {
  let s = (Math.round(z * 10000) / 10000).toString();
  if (s === '-0') s = '0';
  return s.replace('-', '−');
}

// Probability in [0, 1]. Keeps meaningful digits for tiny tails and values near 1.
function fmtP(p) {
  if (p <= 0) return '0';
  if (p >= 1) return '1';
  if (p < 1e-4) return sci(p, 4);
  const q = 1 - p;
  if (q < 1e-4) {
    if (q < 1e-12) return '≈ 1';
    const k = Math.min(12, Math.ceil(-Math.log10(q)) + 2);
    return p.toFixed(k);
  }
  return p.toFixed(4);
}

// Probability as a percentage
function fmtPct(p) {
  const pct = p * 100;
  if (p <= 0) return '0%';
  if (p >= 1) return '100%';
  if (pct < 0.01) return (pct >= 1e-6 ? String(Number(pct.toPrecision(3))) : sci(pct, 3)) + '%';
  const q = 100 - pct;
  if (q < 0.01) {
    if (q < 1e-10) return '≈ 100%';
    const k = Math.min(12, Math.ceil(-Math.log10(q)) + 1);
    return pct.toFixed(k) + '%';
  }
  return pct.toFixed(2) + '%';
}

function ordinal(n) {
  const i = Math.floor(n);
  const mod100 = i % 100;
  if (mod100 >= 11 && mod100 <= 13) return 'th';
  return ({ 1: 'st', 2: 'nd', 3: 'rd' })[i % 10] || 'th';
}

/* ===========================================================
   STATE / DOM
   =========================================================== */
const $ = id => document.getElementById(id);
const REDUCED_MOTION = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const MODE_LABELS = { area0z: '0 → Z', leftTail: 'Left tail', rightTail: 'Right tail', between: 'Between' };

const state = { mode: 'area0z', z: 1.96, z1: -1.96, z2: 1.96, valid: true };

/* ===========================================================
   THEME
   =========================================================== */
$('themeToggle').addEventListener('click', () => {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem('z-theme', next); } catch (e) { /* storage unavailable */ }
  updateThemeColor();
  graph.redrawStatic();
  graph.render();
});
function updateThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
}

/* ===========================================================
   NAV: mobile menu, scroll state, active link, progress bar
   =========================================================== */
const mobileNav = $('mobileNav');
const menuBtn = $('mobileMenuBtn');
function setMenu(open) {
  mobileNav.classList.toggle('open', open);
  menuBtn.setAttribute('aria-expanded', String(open));
  menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
}
menuBtn.addEventListener('click', () => setMenu(!mobileNav.classList.contains('open')));
mobileNav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });
document.addEventListener('click', e => {
  if (mobileNav.classList.contains('open') && !$('nav').contains(e.target)) setMenu(false);
});

const navEl = $('nav');
const progressEl = $('scrollProgress');
let scrollTicking = false;
function onScroll() {
  const y = window.scrollY;
  navEl.classList.toggle('scrolled', y > 8);
  const max = document.documentElement.scrollHeight - window.innerHeight;
  progressEl.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
  scrollTicking = false;
}
window.addEventListener('scroll', () => {
  if (!scrollTicking) { scrollTicking = true; requestAnimationFrame(onScroll); }
}, { passive: true });
onScroll();

if ('IntersectionObserver' in window) {
  const links = document.querySelectorAll('.nav-links a');
  const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + entry.target.id));
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['calculator', 'confidence', 'reference', 'converter', 'facts'].forEach(id => sectionObserver.observe($(id)));

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  // Stagger siblings that reveal together
  document.querySelectorAll('.reveal').forEach(el => {
    const siblings = [...el.parentElement.children].filter(c => c.classList.contains('reveal'));
    const idx = siblings.indexOf(el);
    if (idx > 0) el.style.transitionDelay = `${Math.min(idx, 5) * 70}ms`;
    revealObserver.observe(el);
  });
} else {
  document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
}

/* ===========================================================
   BUTTON RIPPLES
   =========================================================== */
document.addEventListener('pointerdown', e => {
  const btn = e.target.closest('.btn, .conf-card');
  if (!btn || REDUCED_MOTION) return;
  const rect = btn.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  const span = document.createElement('span');
  span.className = 'ripple';
  span.style.width = span.style.height = size + 'px';
  span.style.left = (e.clientX - rect.left - size / 2) + 'px';
  span.style.top = (e.clientY - rect.top - size / 2) + 'px';
  btn.appendChild(span);
  span.addEventListener('animationend', () => span.remove());
});

/* ===========================================================
   HERO CURVE
   =========================================================== */
(function drawHeroCurve() {
  const path = $('heroCurve');
  let d = '';
  for (let i = 0; i <= 120; i++) {
    const x = -4 + 8 * i / 120;
    const px = (i / 120) * 1200;
    const py = 300 - (normalPDF(x) / 0.4) * 270;
    d += (i ? ' L ' : 'M ') + px.toFixed(1) + ',' + py.toFixed(1);
  }
  path.setAttribute('d', d);
  path.setAttribute('pathLength', '1');
})();

/* ===========================================================
   TABS
   =========================================================== */
const tabButtons = document.querySelectorAll('.tab-btn');
function moveTabIndicator() {
  const active = document.querySelector('.tab-btn.active');
  const ind = $('tabIndicator');
  ind.style.width = active.offsetWidth + 'px';
  ind.style.transform = `translateX(${active.offsetLeft}px)`;
}

function setMode(mode) {
  if (state.mode === mode) return;
  const prevMode = state.mode;
  // Carry the value across so switching tabs keeps the user's number
  if (mode === 'between' && prevMode !== 'between') {
    const z = parseFloat($('zInput').value);
    if (!isNaN(z) && z !== 0) {
      $('zInput1').value = String(-Math.abs(z));
      $('zInput2').value = String(Math.abs(z));
    }
  } else if (mode !== 'between' && prevMode === 'between' && $('zInput').value === '') {
    $('zInput').value = $('zInput2').value;
  }

  state.mode = mode;
  tabButtons.forEach(b => {
    const on = b.dataset.tab === mode;
    b.classList.toggle('active', on);
    b.setAttribute('aria-selected', String(on));
  });
  $('singleInputs').classList.toggle('active', mode !== 'between');
  $('betweenInputs').classList.toggle('active', mode === 'between');
  const pill = $('graphModeLabel');
  pill.textContent = MODE_LABELS[mode];
  pill.classList.remove('bump'); void pill.offsetWidth; pill.classList.add('bump');
  moveTabIndicator();
  syncSlider();
  calculate();
}
tabButtons.forEach(btn => btn.addEventListener('click', () => setMode(btn.dataset.tab)));

/* ===========================================================
   PRESETS / SLIDER / SETTING Z
   =========================================================== */
function highlightPreset(z) {
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', z !== null && Math.abs(parseFloat(b.dataset.z) - z) < 1e-9);
  });
}

// Load a Z-score into whatever mode is active (between → ±|z|)
function setZ(z, { animate = true } = {}) {
  if (state.mode === 'between') {
    $('zInput1').value = String(-Math.abs(z));
    $('zInput2').value = String(Math.abs(z));
  } else {
    $('zInput').value = String(z);
  }
  highlightPreset(state.mode === 'between' ? Math.abs(z) : z);
  syncSlider();
  calculate({ animate });
}

document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => setZ(parseFloat(btn.dataset.z)));
});

const slider = $('zSlider');
function sliderValue() {
  return state.mode === 'between' ? parseFloat($('zInput2').value) : parseFloat($('zInput').value);
}
function syncSlider() {
  const v = sliderValue();
  if (!isNaN(v)) slider.value = String(Math.max(-4, Math.min(4, v)));
  slider.style.setProperty('--pct', ((parseFloat(slider.value) + 4) / 8 * 100) + '%');
}
slider.addEventListener('input', () => {
  const v = parseFloat(slider.value);
  if (state.mode === 'between') {
    // Slider controls the upper bound; keep the lower bound below it
    $('zInput2').value = String(v);
    const lo = parseFloat($('zInput1').value);
    if (isNaN(lo) || lo > v) $('zInput1').value = String(-Math.abs(v));
  } else {
    $('zInput').value = String(v);
  }
  highlightPreset(null);
  slider.style.setProperty('--pct', ((v + 4) / 8 * 100) + '%');
  calculate({ animate: false });
});

/* ===========================================================
   CONFIDENCE CARDS — load the central ±z interval
   =========================================================== */
document.querySelectorAll('.conf-card').forEach(card => {
  card.addEventListener('click', () => {
    const z = parseFloat(card.dataset.z);
    if (state.mode !== 'between') setMode('between');
    $('zInput1').value = String(-z);
    $('zInput2').value = String(z);
    highlightPreset(null);
    syncSlider();
    calculate();
    $('calculator').scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
  });
});

/* ===========================================================
   REFERENCE TABLE
   =========================================================== */
const REF_DATA = [-3, -2.576, -2.326, -1.96, -1.645, -1.282, -1, 0, 1, 1.282, 1.645, 1.96, 2.326, 2.576, 3];
(function buildRefTable() {
  const tbody = $('refTableBody');
  REF_DATA.forEach(z => {
    const cdf = normalCDF(z);
    const tr = document.createElement('tr');
    tr.tabIndex = 0;
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-label', `Load Z = ${z}`);
    tr.innerHTML = `
      <td class="z-cell">${z > 0 ? '+' : ''}${z.toFixed(3).replace('-', '−')}</td>
      <td>${areaZeroTo(z).toFixed(4)}</td>
      <td>${cdf.toFixed(4)}</td>
      <td class="col-pct">${(cdf * 100).toFixed(2)}%</td>
      <td>${(upperTail(z) * 100).toFixed(2)}%</td>`;
    tr.addEventListener('click', () => {
      setZ(z);
      $('calculator').scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' });
    });
    tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tr.click(); } });
    tbody.appendChild(tr);
  });
})();

/* ===========================================================
   VALIDATION
   =========================================================== */
const Z_LIMIT = 10;
function readZ(inputEl, errEl) {
  const raw = inputEl.value.trim();
  let msg = '';
  let n = NaN;
  if (raw === '') {
    msg = inputEl.validity && inputEl.validity.badInput ? 'Invalid number.' : 'Please enter a Z-score.';
  } else {
    n = Number(raw);
    if (!Number.isFinite(n)) msg = 'Invalid number.';
    else if (Math.abs(n) > Z_LIMIT) msg = `Please enter a value between −${Z_LIMIT} and ${Z_LIMIT}.`;
  }
  errEl.textContent = msg;
  inputEl.classList.toggle('invalid', !!msg);
  inputEl.setAttribute('aria-invalid', String(!!msg));
  return msg ? null : n;
}

function hideResults() {
  ['resultsPanel', 'explanationBox', 'meaningBox', 'probBarSection'].forEach(id => { $(id).hidden = true; });
  ['ztRow', 'ztCol', 'ztVal'].forEach(id => { $(id).textContent = '—'; });
  $('ztNote').textContent = '';
}

/* ===========================================================
   CALCULATE
   =========================================================== */
function calculate({ animate = true } = {}) {
  ['zError', 'zError1', 'zError2'].forEach(id => { $(id).textContent = ''; });
  ['zInput', 'zInput1', 'zInput2'].forEach(id => { $(id).classList.remove('invalid'); $(id).removeAttribute('aria-invalid'); });

  if (state.mode === 'between') return calculateBetween(animate);

  const z = readZ($('zInput'), $('zError'));
  if (z === null) { state.valid = false; hideResults(); graph.setTarget(state, false); return; }
  state.z = z;
  state.valid = true;

  const cdf = normalCDF(z);
  const right = upperTail(z);
  const area0 = areaZeroTo(z);

  let label, value;
  if (state.mode === 'area0z') {
    label = z >= 0 ? `P(0 ≤ Z ≤ ${fmtZ(z)})` : `P(${fmtZ(z)} ≤ Z ≤ 0)`;
    value = area0;
  } else if (state.mode === 'leftTail') {
    label = `P(Z ≤ ${fmtZ(z)})`;
    value = cdf;
  } else {
    label = `P(Z ≥ ${fmtZ(z)})`;
    value = right;
  }
  showPrimary(label, value, animate);

  $('resultGrid').hidden = false;
  const pct = cdf * 100;
  const pctText = fmtPct(cdf).replace('%', '');
  $('resPercentile').innerHTML = (pct >= 0.01 && pct <= 99.99)
    ? `${pct.toFixed(2)}<small>${ordinal(pct)}</small>`
    : pctText;
  $('resCumulative').textContent = fmtP(cdf);
  $('resLeftTail').textContent = fmtPct(cdf);
  $('resRightTail').textContent = fmtPct(right);

  // Probability breakdown — segments always sum to 100%
  if (state.mode === 'area0z') {
    if (z >= 0) {
      setProbBar([
        { label: 'Below 0', p: 0.5, cls: 'muted' },
        { label: '0 to Z', p: area0, cls: 'selected' },
        { label: 'Above Z', p: right, cls: 'muted2' }
      ]);
    } else {
      setProbBar([
        { label: 'Below Z', p: cdf, cls: 'muted2' },
        { label: 'Z to 0', p: area0, cls: 'selected' },
        { label: 'Above 0', p: 0.5, cls: 'muted' }
      ]);
    }
  } else if (state.mode === 'leftTail') {
    setProbBar([
      { label: 'Below Z', p: cdf, cls: 'selected' },
      null,
      { label: 'Above Z', p: right, cls: 'muted' }
    ]);
  } else {
    setProbBar([
      { label: 'Below Z', p: cdf, cls: 'muted' },
      null,
      { label: 'Above Z', p: right, cls: 'selected' }
    ]);
  }

  updateZTableLookup(z);
  updateExplanation(z, value, cdf, right, area0);
  updateMeaning(z);
  graph.setTarget(state, animate);
}

function calculateBetween(animate) {
  const a = readZ($('zInput1'), $('zError1'));
  const b = readZ($('zInput2'), $('zError2'));
  if (a === null || b === null) { state.valid = false; hideResults(); graph.setTarget(state, false); return; }
  const z1 = Math.min(a, b);
  const z2 = Math.max(a, b);
  state.z1 = z1;
  state.z2 = z2;
  state.valid = true;

  const area = areaBetween(z1, z2);
  const below = normalCDF(z1);
  const above = upperTail(z2);

  showPrimary(`P(${fmtZ(z1)} ≤ Z ≤ ${fmtZ(z2)})`, area, animate);
  $('resultGrid').hidden = true;

  setProbBar([
    { label: 'Below Z₁', p: below, cls: 'muted' },
    { label: 'Between', p: area, cls: 'selected' },
    { label: 'Above Z₂', p: above, cls: 'muted2' }
  ]);

  $('explanationBox').hidden = false;
  let html = `The probability that Z falls between <span class="highlight">${fmtZ(z1)}</span> and <span class="highlight">${fmtZ(z2)}</span> is <strong>${fmtPct(area)}</strong>. `;
  if (Math.abs(z1 + z2) < 1e-9 && z2 > 0) {
    html += `This symmetric interval is a <strong>${fmtPct(area)} confidence interval</strong> — the remaining ${fmtPct(below + above)} is split equally between the two tails (${fmtPct(below)} each).`;
  } else {
    html += `${fmtPct(below)} of observations lie below Z₁ and ${fmtPct(above)} lie above Z₂.`;
  }
  $('explanationText').innerHTML = html;

  $('meaningBox').hidden = true;
  ['ztRow', 'ztCol', 'ztVal'].forEach(id => { $(id).textContent = '—'; });
  $('ztNote').textContent = 'Switch to a single-Z mode to see a table lookup.';

  graph.setTarget(state, animate);
}

/* ===========================================================
   RESULT RENDERING
   =========================================================== */
let primaryAnim = null;
let lastPrimary = null;
function showPrimary(label, value, animate) {
  const panel = $('resultsPanel');
  const wasHidden = panel.hidden;
  panel.hidden = false;
  $('resPrimaryLabel').textContent = label;
  $('resPrimaryPct').textContent = fmtPct(value);

  const el = $('resPrimaryValue');
  const final = fmtP(value);
  if (primaryAnim) cancelAnimationFrame(primaryAnim);
  const from = lastPrimary === null || wasHidden ? 0 : lastPrimary;
  lastPrimary = value;

  // Only count up when the display is a plain 4-decimal number
  if (!animate || REDUCED_MOTION || !/^\d\.\d{4}$/.test(final) || Math.abs(value - from) < 5e-5) {
    el.textContent = final;
  } else {
    const start = performance.now();
    const dur = 550;
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (from + (value - from) * eased).toFixed(4);
      if (t < 1) primaryAnim = requestAnimationFrame(step);
      else { el.textContent = final; primaryAnim = null; }
    };
    primaryAnim = requestAnimationFrame(step);
  }
  if (animate && !REDUCED_MOTION) {
    const box = el.parentElement;
    box.classList.remove('pulse'); void box.offsetWidth; box.classList.add('pulse');
  }
}

function setProbBar(segments) {
  $('probBarSection').hidden = false;
  segments.forEach((seg, i) => {
    const el = $('probSeg' + i);
    const lab = $('probLab' + i);
    if (!seg) {
      el.style.width = '0%';
      el.textContent = '';
      lab.style.visibility = 'hidden';
      return;
    }
    const w = seg.p * 100;
    el.className = 'prob-segment ' + seg.cls;
    el.style.width = w + '%';
    el.textContent = w >= 14 ? fmtPct(seg.p) : '';
    el.title = `${seg.label}: ${fmtPct(seg.p)}`;
    lab.style.visibility = 'visible';
    lab.querySelector('span').textContent = seg.label;
    lab.querySelector('.swatch').className = 'swatch ' + seg.cls;
    lab.querySelector('.prob-label-value').textContent = fmtPct(seg.p);
  });
}

/* ===========================================================
   Z-TABLE LOOKUP
   =========================================================== */
function updateZTableLookup(z) {
  const absZ = Math.abs(z);
  // Work in integer hundredths to avoid floating-point slips (e.g. 0.29 → row 0.2, col 0.09)
  const hundredths = Math.round(absZ * 100);
  const row = Math.floor(hundredths / 10) / 10;
  const col = (hundredths % 10) / 100;
  const tableZ = hundredths / 100;
  $('ztRow').textContent = row.toFixed(1);
  $('ztCol').textContent = col.toFixed(2);
  $('ztVal').textContent = areaZeroTo(tableZ).toFixed(4);

  const notes = [];
  if (Math.abs(absZ - tableZ) > 1e-9) {
    notes.push(`|z| = ${fmtZ(absZ)} is rounded to ${tableZ.toFixed(2)} for the table; the exact area is ${areaZeroTo(absZ).toFixed(4)}.`);
  }
  if (tableZ > 3.49) notes.push('Most printed tables stop at 3.49 — beyond that the area is ≈ 0.5.');
  $('ztNote').textContent = notes.join(' ');
}

/* ===========================================================
   EXPLANATION
   =========================================================== */
function updateExplanation(z, value, cdf, right, area0) {
  $('explanationBox').hidden = false;
  const absZ = Math.abs(z);
  const dir = z >= 0 ? 'above' : 'below';
  let html;
  if (z === 0) {
    html = `A Z-score of <span class="highlight">0</span> is exactly at the mean. <strong>50%</strong> of observations lie below and <strong>50%</strong> above this point.`;
    if (state.mode === 'area0z') html += ' The area from 0 to 0 is zero.';
  } else {
    html = `A Z-score of <span class="highlight">${fmtZ(z)}</span> is <strong>${fmtZ(absZ)} standard deviation${absZ === 1 ? '' : 's'} ${dir}</strong> the mean. `;
    if (state.mode === 'area0z') {
      html += `<strong>${fmtPct(area0)}</strong> of observations lie between the mean and this Z-score.`;
    } else if (state.mode === 'leftTail') {
      html += `<strong>${fmtPct(cdf)}</strong> of observations lie at or below it — it sits at the ${(cdf * 100).toFixed(2)}${ordinal(cdf * 100)} percentile.`;
    } else {
      html += `<strong>${fmtPct(right)}</strong> of observations lie at or above it.`;
      if (right > 0 && right < 0.5) html += ` That's roughly 1 in ${Math.round(1 / right).toLocaleString()}.`;
    }
  }
  $('explanationText').innerHTML = html;
}

/* ===========================================================
   MEANING
   =========================================================== */
function updateMeaning(z) {
  $('meaningBox').hidden = false;
  const absZ = Math.abs(z);
  const side = z > 0 ? 'above' : 'below';
  const twoTail = 2 * upperTail(absZ);
  const oneTail = upperTail(absZ);
  let level, label, text;
  if (absZ === 0) {
    level = 0; label = 'Average';
    text = 'Exactly at the mean of the distribution — the most typical value.';
  } else if (absZ < 1) {
    level = 1; label = 'Typical';
    text = `Within one standard deviation of the mean, where about 68.27% of all values fall. A common, unremarkable result.`;
  } else if (absZ < 2) {
    level = 2; label = 'Uncommon';
    text = `Between one and two standard deviations ${side} the mean. Only ${fmtPct(oneTail)} of values are this ${z > 0 ? 'high' : 'low'} or more extreme.`;
  } else if (absZ < 3) {
    level = 3; label = 'Rare';
    text = `Between two and three standard deviations from the mean — statistically unusual. Only ${fmtPct(twoTail)} of values are this far from the mean in either direction.`;
  } else {
    level = 4; label = 'Extremely rare';
    text = `More than three standard deviations from the mean. Only ${fmtPct(twoTail)} of values are this extreme in either direction (about 1 in ${Math.round(1 / twoTail).toLocaleString()}).`;
  }
  const badge = $('meaningBadge');
  badge.textContent = label;
  badge.className = 'meaning-badge lvl-' + level;
  $('meaningDesc').textContent = text;
}

/* ===========================================================
   SVG BELL CURVE (responsive, animated, draggable)
   =========================================================== */
const graph = (function () {
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svg = $('bellCurve');
  const wrap = $('graphWrap');
  const X_MIN = -4, X_MAX = 4, Y_MAX = 0.43;
  let W = 700, H = 340;
  const M = { top: 58, right: 14, bottom: 52, left: 14 };
  let gStatic, gDynamic;
  let firstDraw = true;
  let colors = {};

  // What is currently drawn (animated toward the target)
  const view = { mode: 'area0z', z: 1.96, z1: -1.96, z2: 1.96, valid: true };
  let anim = null;

  const xs = x => M.left + ((x - X_MIN) / (X_MAX - X_MIN)) * (W - M.left - M.right);
  const ys = y => M.top + (H - M.top - M.bottom) - (y / Y_MAX) * (H - M.top - M.bottom);
  const xInv = px => X_MIN + ((px - M.left) / (W - M.left - M.right)) * (X_MAX - X_MIN);

  function el(tag, attrs, parent) {
    const node = document.createElementNS(SVG_NS, tag);
    for (const k in attrs) node.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(node);
    return node;
  }

  function readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = n => cs.getPropertyValue(n).trim();
    colors = { stroke: v('--curve-stroke'), grid: v('--grid-line'), marker: v('--marker-color'), muted: v('--text-muted'), light: v('--text-light'), bg: v('--graph-bg') };
  }

  function measure() {
    W = Math.max(260, Math.round(wrap.clientWidth || 700));
    H = Math.round(Math.max(230, Math.min(360, W * 0.52)));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
  }

  function redrawStatic() {
    measure();
    readColors();
    svg.textContent = '';
    const defs = el('defs', {}, svg);
    const grad = el('linearGradient', { id: 'areaGrad', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: '0%', 'stop-color': colors.stroke, 'stop-opacity': 0.45 }, grad);
    el('stop', { offset: '100%', 'stop-color': colors.stroke, 'stop-opacity': 0.08 }, grad);

    gStatic = el('g', {}, svg);
    const small = W < 420;
    // Grid
    for (let x = -3; x <= 3; x++) el('line', { x1: xs(x), y1: M.top, x2: xs(x), y2: ys(0), stroke: colors.grid }, gStatic);
    for (let i = 1; i <= 4; i++) el('line', { x1: M.left, y1: ys(i / 10), x2: W - M.right, y2: ys(i / 10), stroke: colors.grid }, gStatic);
    // Axis
    el('line', { x1: M.left, y1: ys(0), x2: W - M.right, y2: ys(0), stroke: colors.muted, 'stroke-width': 1 }, gStatic);
    for (let x = -4; x <= 4; x++) {
      if (x === -4 || x === 4) continue;
      el('line', { x1: xs(x), y1: ys(0), x2: xs(x), y2: ys(0) + 5, stroke: colors.muted }, gStatic);
      const t = el('text', { x: xs(x), y: ys(0) + 19, 'text-anchor': 'middle', fill: colors.muted, 'font-size': small ? 11 : 12 }, gStatic);
      t.textContent = x === 0 ? '0' : String(x).replace('-', '−');
      if (x !== 0 && Math.abs(x) <= 3) {
        const s = el('text', { x: xs(x), y: ys(0) + 35, 'text-anchor': 'middle', fill: colors.light, 'font-size': 10 }, gStatic);
        s.textContent = (x > 0 ? '+' : '−') + Math.abs(x) + 'σ';
      }
    }
    // Mean line
    el('line', { x1: xs(0), y1: ys(Y_MAX * 0.97), x2: xs(0), y2: ys(0), stroke: colors.muted, 'stroke-dasharray': '3,4', opacity: 0.6 }, gStatic);

    gDynamic = el('g', {}, svg);

    // Curve on top of fill
    let d = '';
    const steps = 240;
    for (let i = 0; i <= steps; i++) {
      const x = X_MIN + (X_MAX - X_MIN) * i / steps;
      d += (i ? 'L' : 'M') + xs(x).toFixed(2) + ',' + ys(normalPDF(x)).toFixed(2);
    }
    const curve = el('path', { d, fill: 'none', stroke: colors.stroke, 'stroke-width': 2.5, 'stroke-linejoin': 'round', pathLength: 1, class: 'curve-line' }, svg);
    if (firstDraw && !REDUCED_MOTION) curve.classList.add('draw-in');
    firstDraw = false;

    gMarkers = el('g', {}, svg);
  }
  let gMarkers;

  function fillPath(from, to) {
    const a = Math.max(from, X_MIN), b = Math.min(to, X_MAX);
    if (!(b > a)) return '';
    const n = Math.max(2, Math.ceil((b - a) / (X_MAX - X_MIN) * 200));
    let d = `M${xs(a).toFixed(2)},${ys(0).toFixed(2)}`;
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * i / n;
      d += `L${xs(x).toFixed(2)},${ys(normalPDF(x)).toFixed(2)}`;
    }
    return d + `L${xs(b).toFixed(2)},${ys(0).toFixed(2)}Z`;
  }

  function regionFor(v) {
    if (v.mode === 'area0z') return v.z >= 0 ? [0, v.z] : [v.z, 0];
    if (v.mode === 'leftTail') return [-Infinity, v.z];
    if (v.mode === 'rightTail') return [v.z, Infinity];
    return [v.z1, v.z2];
  }
  function areaFor(v) {
    if (v.mode === 'area0z') return areaZeroTo(v.z);
    if (v.mode === 'leftTail') return normalCDF(v.z);
    if (v.mode === 'rightTail') return upperTail(v.z);
    return areaBetween(v.z1, v.z2);
  }

  function render() {
    if (!gDynamic) return;
    gDynamic.textContent = '';
    gMarkers.textContent = '';
    if (!view.valid) return;

    const [from, to] = regionFor(view);
    const d = fillPath(from, to);
    if (d) el('path', { d, fill: 'url(#areaGrad)' }, gDynamic);

    // Area annotation inside (or just above) the shaded region
    const area = areaFor(view);
    const a = Math.max(from, X_MIN + 0.15), b = Math.min(to, X_MAX - 0.15);
    if (b > a && area > 0) {
      let ax = (a + b) / 2;
      if (view.mode === 'leftTail' && b - a > 1.2) ax = Math.max(a + 0.6, b - 1.1);
      if (view.mode === 'rightTail' && b - a > 1.2) ax = Math.min(b - 0.6, a + 1.1);
      const pdf = normalPDF(ax);
      const narrow = xs(b) - xs(a) < 64 || pdf < 0.12;
      const ay = narrow ? ys(pdf) - 10 : ys(pdf * 0.42);
      const text = el('text', {
        x: Math.max(M.left + 30, Math.min(W - M.right - 30, xs(ax))), y: ay,
        'text-anchor': 'middle', fill: colors.stroke, 'font-size': W < 420 ? 12 : 13, 'font-weight': 600,
        stroke: narrow ? colors.bg : 'none', 'stroke-width': narrow ? 4 : 0, 'paint-order': 'stroke'
      }, gDynamic);
      text.textContent = fmtPct(area);
    }

    // Markers
    const markers = view.mode === 'between'
      ? [{ z: view.z1, label: 'Z₁ = ' + fmtZ(view.z1) }, { z: view.z2, label: 'Z₂ = ' + fmtZ(view.z2) }]
      : [{ z: view.z, label: 'Z = ' + fmtZ(view.z) }];
    const placed = [];
    markers.forEach((m, i) => {
      const clamped = Math.max(X_MIN, Math.min(X_MAX, m.z));
      const off = clamped !== m.z;
      const x = xs(clamped);
      el('line', { x1: x, y1: M.top - 4, x2: x, y2: ys(0), stroke: colors.marker, 'stroke-width': 2, 'stroke-dasharray': '5,3' }, gMarkers);
      if (!off) el('circle', { cx: x, cy: ys(normalPDF(m.z)), r: 5, fill: colors.marker, stroke: colors.bg, 'stroke-width': 2, class: 'marker-dot' }, gMarkers);

      const label = off ? m.label + (m.z < 0 ? ' ◂' : ' ▸') : m.label;
      const w = label.length * 7 + 16;
      let lx = Math.max(M.left + w / 2, Math.min(W - M.right - w / 2, x));
      // Stack the second label if it would collide with the first
      let row = 0;
      if (placed.length && Math.abs(placed[0].lx - lx) < (placed[0].w + w) / 2 + 4) row = 1;
      placed.push({ lx, w });
      const top = row ? 4 : 28;
      el('rect', { x: lx - w / 2, y: top, width: w, height: 22, rx: 6, fill: colors.marker }, gMarkers);
      const t = el('text', { x: lx, y: top + 15, 'text-anchor': 'middle', fill: '#fff', 'font-size': 11.5, 'font-weight': 600 }, gMarkers);
      t.textContent = label;
    });
  }

  function setTarget(s, animate) {
    const target = { mode: s.mode, z: s.z, z1: s.z1, z2: s.z2, valid: s.valid };
    if (anim) cancelAnimationFrame(anim);
    const modeChanged = view.mode !== target.mode || !view.valid;
    if (!animate || REDUCED_MOTION || modeChanged || !target.valid) {
      Object.assign(view, target);
      render();
      return;
    }
    const start = { z: view.z, z1: view.z1, z2: view.z2 };
    const clampD = v => Math.max(-6, Math.min(6, v));
    const t0 = performance.now();
    const dur = 500;
    const step = now => {
      const t = Math.min(1, (now - t0) / dur);
      const e = 1 - Math.pow(1 - t, 3);
      view.mode = target.mode;
      view.valid = true;
      view.z = t < 1 ? clampD(start.z) + (clampD(target.z) - clampD(start.z)) * e : target.z;
      view.z1 = t < 1 ? clampD(start.z1) + (clampD(target.z1) - clampD(start.z1)) * e : target.z1;
      view.z2 = t < 1 ? clampD(start.z2) + (clampD(target.z2) - clampD(start.z2)) * e : target.z2;
      render();
      anim = t < 1 ? requestAnimationFrame(step) : null;
    };
    anim = requestAnimationFrame(step);
  }

  // ----- Dragging to set Z -----
  let dragging = null;
  function zFromEvent(e) {
    const rect = svg.getBoundingClientRect();
    const px = (e.clientX - rect.left) * (W / rect.width);
    const z = Math.round(xInv(px) * 100) / 100;
    return Math.max(X_MIN, Math.min(X_MAX, z));
  }
  function applyDrag(z) {
    if (dragging === 'z1') {
      $('zInput1').value = String(z);
    } else if (dragging === 'z2') {
      $('zInput2').value = String(z);
    } else {
      $('zInput').value = String(z);
    }
    highlightPreset(null);
    syncSlider();
    calculate({ animate: false });
  }
  svg.addEventListener('pointerdown', e => {
    if (e.button !== undefined && e.button !== 0) return;
    const z = zFromEvent(e);
    if (state.mode === 'between') {
      const z1 = parseFloat($('zInput1').value), z2 = parseFloat($('zInput2').value);
      if (isNaN(z1) || isNaN(z2)) { dragging = isNaN(z1) ? 'z1' : 'z2'; }
      else dragging = Math.abs(z - Math.min(z1, z2)) <= Math.abs(z - Math.max(z1, z2))
        ? (z1 <= z2 ? 'z1' : 'z2')
        : (z1 <= z2 ? 'z2' : 'z1');
    } else {
      dragging = 'z';
    }
    svg.classList.add('dragging');
    try { svg.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    applyDrag(z);
  });
  svg.addEventListener('pointermove', e => { if (dragging) applyDrag(zFromEvent(e)); });
  const endDrag = () => { dragging = null; svg.classList.remove('dragging'); };
  svg.addEventListener('pointerup', endDrag);
  svg.addEventListener('pointercancel', endDrag);

  return { redrawStatic, render, setTarget };
})();

/* ===========================================================
   CONVERTERS (live)
   =========================================================== */
function num(id) {
  const v = $(id).value.trim();
  return v === '' ? NaN : Number(v);
}
function flash(el) {
  if (REDUCED_MOTION) return;
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}
function showConv(el, html, isError) {
  el.classList.toggle('error', !!isError);
  if (el.innerHTML !== html) { el.innerHTML = html; if (!isError) flash(el); }
}

let convZ1 = null;
function convertToZ() {
  const x = num('convX'), mu = num('convMu1'), sigma = num('convSig1');
  const res = $('convResult1');
  convZ1 = null;
  if ([x, mu, sigma].every(Number.isNaN)) { showConv(res, '—'); $('sendZ1').hidden = true; return; }
  if ([x, mu, sigma].some(v => !Number.isFinite(v))) { showConv(res, 'Enter X, μ and σ.', true); $('sendZ1').hidden = true; return; }
  if (sigma <= 0) { showConv(res, 'σ must be greater than 0.', true); $('sendZ1').hidden = true; return; }
  const z = (x - mu) / sigma;
  convZ1 = z;
  showConv(res, `Z = ${fmtZ(z)}<span class="sub">Percentile: ${fmtPct(normalCDF(z))}</span>`);
  $('sendZ1').hidden = Math.abs(z) > Z_LIMIT;
}

function convertToRaw() {
  const z = num('convZ2'), mu = num('convMu2'), sigma = num('convSig2');
  const res = $('convResult2');
  if ([z, mu, sigma].every(Number.isNaN)) { showConv(res, '—'); return; }
  if ([z, mu, sigma].some(v => !Number.isFinite(v))) { showConv(res, 'Enter Z, μ and σ.', true); return; }
  if (sigma <= 0) { showConv(res, 'σ must be greater than 0.', true); return; }
  const x = mu + z * sigma;
  const xs = Number.isInteger(x) ? String(x) : String(Math.round(x * 10000) / 10000);
  showConv(res, `X = ${xs.replace('-', '−')}<span class="sub">Percentile: ${fmtPct(normalCDF(z))}</span>`);
}

let convZ3 = null;
function convertInverse() {
  const p = num('invP');
  const type = $('invType').value;
  const res = $('convResult3');
  convZ3 = null;
  $('sendZ3').hidden = true;
  if (Number.isNaN(p)) { showConv(res, '—'); return; }
  if (!(p > 0 && p < 1)) { showConv(res, 'Probability must be strictly between 0 and 1.', true); return; }
  let z, desc;
  if (type === 'left') { z = inverseNormalCDF(p); desc = `P(Z ≤ ${fmtZ(z)}) = ${p}`; }
  else if (type === 'right') { z = -inverseNormalCDF(p); desc = `P(Z ≥ ${fmtZ(z)}) = ${p}`; }
  else { z = inverseNormalCDF(0.5 + p / 2); desc = `P(−${fmtZ(z)} ≤ Z ≤ ${fmtZ(z)}) = ${p}`; }
  convZ3 = { z, type };
  showConv(res, `${type === 'central' ? 'Z = ±' + fmtZ(z) : 'Z = ' + fmtZ(z)}<span class="sub">${desc}</span>`);
  $('sendZ3').hidden = false;
}

['convX', 'convMu1', 'convSig1'].forEach(id => $(id).addEventListener('input', convertToZ));
['convZ2', 'convMu2', 'convSig2'].forEach(id => $(id).addEventListener('input', convertToRaw));
$('invP').addEventListener('input', convertInverse);
$('invType').addEventListener('change', convertInverse);

function scrollToCalc() { $('calculator').scrollIntoView({ behavior: REDUCED_MOTION ? 'auto' : 'smooth' }); }
$('sendZ1').addEventListener('click', () => {
  if (convZ1 === null) return;
  if (state.mode === 'between') setMode('leftTail');
  setZ(Math.round(convZ1 * 10000) / 10000);
  scrollToCalc();
});
$('sendZ3').addEventListener('click', () => {
  if (!convZ3) return;
  const z = Math.round(convZ3.z * 10000) / 10000;
  if (convZ3.type === 'central') {
    setMode('between');
    $('zInput1').value = String(-z);
    $('zInput2').value = String(z);
    highlightPreset(null); syncSlider(); calculate();
  } else {
    setMode(convZ3.type === 'left' ? 'leftTail' : 'rightTail');
    setZ(z);
  }
  scrollToCalc();
});

/* ===========================================================
   EVENT LISTENERS
   =========================================================== */
$('calcBtn').addEventListener('click', () => calculate());
$('resetBtn').addEventListener('click', () => {
  ['zInput', 'zInput1', 'zInput2'].forEach(id => { $(id).value = ''; });
  highlightPreset(null);
  calculate({ animate: false });
  // Reset shows empty inputs without shouting errors at the user
  ['zError', 'zError1', 'zError2'].forEach(id => { $(id).textContent = ''; });
  ['zInput', 'zInput1', 'zInput2'].forEach(id => { $(id).classList.remove('invalid'); $(id).removeAttribute('aria-invalid'); });
  lastPrimary = null;
  slider.value = '0';
  slider.style.setProperty('--pct', '50%');
});

['zInput', 'zInput1', 'zInput2'].forEach(id => {
  const input = $(id);
  input.addEventListener('input', () => {
    highlightPreset(null);
    syncSlider();
    calculate({ animate: false });
  });
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); input.blur(); calculate(); }
  });
});

/* ===========================================================
   INIT
   =========================================================== */
(function init() {
  $('zInput').value = '1.96';
  $('zInput1').value = '-1.96';
  $('zInput2').value = '1.96';
  highlightPreset(1.96);
  updateThemeColor();
  graph.redrawStatic();
  moveTabIndicator();
  syncSlider();
  calculate({ animate: false });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveTabIndicator);
})();

let resizeTimer;
let lastWidth = window.innerWidth;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    moveTabIndicator();
    // Mobile browsers fire resize when the URL bar hides; only redraw on width change
    if (window.innerWidth !== lastWidth) {
      lastWidth = window.innerWidth;
      graph.redrawStatic();
      graph.render();
    }
  }, 120);
});
