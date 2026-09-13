/* ===========================================================
   MATHEMATICS
   =========================================================== */
// Highly accurate CDF using Abramowitz & Stegun rational approximation
// Maximum error: ~1.5×10⁻⁷
function normalCDF(z) {
  if (z === 0) return 0.5;
  const a1 =  0.254829592;
  const a2 = -0.284496736;
  const a3 =  1.421413741;
  const a4 = -1.453152027;
  const a5 =  1.061405429;
  const p  =  0.3275911;
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.SQRT2;
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5*t + a4)*t) + a3)*t + a2)*t + a1)*t * Math.exp(-x*x);
  return 0.5 * (1.0 + sign * y);
}

// PDF
function normalPDF(x) {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

/* ===========================================================
   STATE
   =========================================================== */
let currentMode = 'area0z'; // area0z, leftTail, rightTail, between
let currentZ = 1.96;
let currentZ1 = -1.96;
let currentZ2 = 1.96;

/* ===========================================================
   THEME
   =========================================================== */
(function initTheme() {
  const stored = localStorage.getItem('z-theme');
  if (stored) {
    document.documentElement.setAttribute('data-theme', stored);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
  updateThemeIcon();
})();

function updateThemeIcon() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.getElementById('themeIcon').textContent = isDark ? '☀' : '☽';
}

document.getElementById('themeToggle').addEventListener('click', () => {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const next = isDark ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('z-theme', next);
  updateThemeIcon();
  drawBellCurve();
});

/* ===========================================================
   MOBILE MENU
   =========================================================== */
function closeMobileMenu() {
  document.getElementById('mobileNav').classList.remove('open');
  document.getElementById('mobileMenuBtn').setAttribute('aria-expanded', 'false');
}
document.getElementById('mobileMenuBtn').addEventListener('click', () => {
  const nav = document.getElementById('mobileNav');
  const open = nav.classList.toggle('open');
  document.getElementById('mobileMenuBtn').setAttribute('aria-expanded', open);
});

/* ===========================================================
   TABS
   =========================================================== */
document.querySelectorAll('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-selected','false'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected','true');
    const tab = btn.getAttribute('data-tab');
    currentMode = tab;
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('active');
    document.getElementById('graphModeLabel').textContent =
      tab === 'area0z' ? '0 → Z' : tab === 'leftTail' ? 'Left Tail' : tab === 'rightTail' ? 'Right Tail' : 'Between';
    calculate();
  });
});

/* ===========================================================
   PRESETS
   =========================================================== */
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const z = parseFloat(btn.getAttribute('data-z'));
    setInputForMode(z);
    highlightPreset(z);
    calculate();
  });
});

function highlightPreset(z) {
  document.querySelectorAll('.preset-btn').forEach(b => {
    b.classList.toggle('active', parseFloat(b.getAttribute('data-z')) === z);
  });
}

function setInputForMode(z) {
  if (currentMode === 'between') {
    document.getElementById('zInput1').value = (-Math.abs(z)).toFixed(4);
    document.getElementById('zInput2').value = Math.abs(z).toFixed(4);
  } else {
    const inputId = currentMode === 'leftTail' ? 'zInputLeft' : currentMode === 'rightTail' ? 'zInputRight' : 'zInput';
    document.getElementById(inputId).value = z;
  }
}

/* ===========================================================
   CONFIDENCE CARDS
   =========================================================== */
document.querySelectorAll('.conf-card').forEach(card => {
  function handler() {
    const z = parseFloat(card.getAttribute('data-z'));
    // Switch to 0→Z tab
    document.querySelector('.tab-btn[data-tab="area0z"]').click();
    document.getElementById('zInput').value = z;
    highlightPreset(z);
    calculate();
    document.getElementById('calculator').scrollIntoView({ behavior:'smooth' });
  }
  card.addEventListener('click', handler);
  card.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(); }});
});

/* ===========================================================
   REFERENCE TABLE
   =========================================================== */
const REF_DATA = [
  [-3.00], [-2.576], [-2.326], [-1.960], [-1.645], [-1.282], [-1.00],
  [0], [1.00], [1.282], [1.645], [1.960], [2.326], [2.576], [3.00]
];
(function buildRefTable() {
  const tbody = document.getElementById('refTableBody');
  REF_DATA.forEach(([z]) => {
    const cdf = normalCDF(z);
    const area0z = normalCDF(Math.abs(z)) - 0.5;
    const tr = document.createElement('tr');
    tr.tabIndex = 0;
    tr.setAttribute('role', 'button');
    tr.setAttribute('aria-label', `Load Z = ${z.toFixed(3)}`);
    tr.innerHTML = `
      <td class="z-cell">${z >= 0 ? '+' : ''}${z.toFixed(3)}</td>
      <td>${area0z.toFixed(4)}</td>
      <td>${cdf.toFixed(4)}</td>
      <td>${(cdf * 100).toFixed(2)}%</td>
      <td>${((1 - cdf) * 100).toFixed(2)}%</td>`;
    tr.addEventListener('click', () => {
      document.querySelector('.tab-btn[data-tab="area0z"]').click();
      document.getElementById('zInput').value = z;
      highlightPreset(z);
      calculate();
      document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
    });
    tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tr.click(); }});
    tbody.appendChild(tr);
  });
})();

/* ===========================================================
   CALCULATE
   =========================================================== */
function getActiveInput() {
  if (currentMode === 'area0z') return document.getElementById('zInput');
  if (currentMode === 'leftTail') return document.getElementById('zInputLeft');
  if (currentMode === 'rightTail') return document.getElementById('zInputRight');
  return null;
}

function getActiveError() {
  if (currentMode === 'area0z') return document.getElementById('zError');
  if (currentMode === 'leftTail') return document.getElementById('zErrorLeft');
  if (currentMode === 'rightTail') return document.getElementById('zErrorRight');
  return null;
}

function validate(val, errEl) {
  if (val === '' || val === undefined || val === null) {
    if (errEl) errEl.textContent = 'Please enter a Z-score.';
    return false;
  }
  const n = parseFloat(val);
  if (isNaN(n)) {
    if (errEl) errEl.textContent = 'Invalid number.';
    return false;
  }
  if (Math.abs(n) > 10) {
    if (errEl) errEl.textContent = 'Z-scores beyond ±10 are rarely meaningful.';
    return false;
  }
  if (errEl) errEl.textContent = '';
  return true;
}

function calculate() {
  // Clear all errors
  ['zError','zErrorLeft','zErrorRight','zError1','zError2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = '';
  });

  if (currentMode === 'between') {
    return calculateBetween();
  }

  const input = getActiveInput();
  const errEl = getActiveError();
  if (!input) return;
  if (!validate(input.value, errEl)) {
    document.getElementById('resultsPanel').style.display = 'none';
    document.getElementById('explanationBox').style.display = 'none';
    document.getElementById('meaningBox').style.display = 'none';
    document.getElementById('probBarSection').style.display = 'none';
    return;
  }

  const z = parseFloat(input.value);
  currentZ = z;
  const absZ = Math.abs(z);
  const cdf = normalCDF(z);
  const area0z = normalCDF(absZ) - 0.5;
  const leftTail = cdf;
  const rightTail = 1 - cdf;
  const percentile = cdf * 100;

  // Results
  const panel = document.getElementById('resultsPanel');
  panel.style.display = 'block';

  let primaryLabel, primaryVal, primaryPct;
  if (currentMode === 'area0z') {
    primaryLabel = `AREA FROM 0 TO ${absZ.toFixed(2)}`;
    primaryVal = area0z.toFixed(4);
    primaryPct = (area0z * 100).toFixed(2) + '%';
  } else if (currentMode === 'leftTail') {
    primaryLabel = `LEFT TAIL P(Z ≤ ${z.toFixed(2)})`;
    primaryVal = leftTail.toFixed(4);
    primaryPct = (leftTail * 100).toFixed(2) + '%';
  } else {
    primaryLabel = `RIGHT TAIL P(Z ≥ ${z.toFixed(2)})`;
    primaryVal = rightTail.toFixed(4);
    primaryPct = (rightTail * 100).toFixed(2) + '%';
  }
  animateText('resPrimaryLabel', primaryLabel);
  animateNumber('resPrimaryValue', parseFloat(primaryVal), 4);
  animateText('resPrimaryPct', primaryPct);

  const pctStr = percentile.toFixed(2);
  document.getElementById('resPercentile').innerHTML = pctStr + '<span style="font-size:12px;">th</span>';
  document.getElementById('resCumulative').textContent = cdf.toFixed(4);
  document.getElementById('resLeftTail').textContent = (leftTail * 100).toFixed(2) + '%';
  document.getElementById('resRightTail').textContent = (rightTail * 100).toFixed(2) + '%';

  // Show result grid only for non-between modes
  document.getElementById('resultGrid').style.display = 'grid';

  // Probability bar
  document.getElementById('probBarSection').style.display = 'block';
  const leftPct = leftTail * 100;
  const centerPct = area0z * 100;
  const rightPctVal = rightTail * 100;
  document.getElementById('probLeft').style.width = (z >= 0 ? (leftPct - centerPct) : leftPct) + '%';
  document.getElementById('probCenter').style.width = centerPct + '%';
  document.getElementById('probRight').style.width = rightPctVal + '%';
  document.getElementById('probLeftVal').textContent = (leftPct).toFixed(2) + '%';
  document.getElementById('probCenterVal').textContent = centerPct.toFixed(2) + '%';
  document.getElementById('probRightVal').textContent = rightPctVal.toFixed(2) + '%';

  // Z-Table lookup
  updateZTableLookup(z);

  // Explanation
  updateExplanation(z, area0z, cdf);

  // Meaning
  updateMeaning(z);

  // Redraw graph
  drawBellCurve();
}

function calculateBetween() {
  const v1 = document.getElementById('zInput1').value;
  const v2 = document.getElementById('zInput2').value;
  if (!validate(v1, document.getElementById('zError1')) || !validate(v2, document.getElementById('zError2'))) {
    document.getElementById('resultsPanel').style.display = 'none';
    document.getElementById('explanationBox').style.display = 'none';
    document.getElementById('meaningBox').style.display = 'none';
    document.getElementById('probBarSection').style.display = 'none';
    return;
  }
  let z1 = parseFloat(v1);
  let z2 = parseFloat(v2);
  if (z1 > z2) { [z1, z2] = [z2, z1]; }
  currentZ1 = z1;
  currentZ2 = z2;

  const area = normalCDF(z2) - normalCDF(z1);
  const panel = document.getElementById('resultsPanel');
  panel.style.display = 'block';

  animateText('resPrimaryLabel', `P(${z1.toFixed(2)} ≤ Z ≤ ${z2.toFixed(2)})`);
  animateNumber('resPrimaryValue', area, 4);
  animateText('resPrimaryPct', (area * 100).toFixed(2) + '%');

  // Hide single-Z detail grid for between mode
  document.getElementById('resultGrid').style.display = 'none';

  // Probability bar for between
  document.getElementById('probBarSection').style.display = 'block';
  const leftArea = normalCDF(z1) * 100;
  const centerArea = area * 100;
  const rightArea = (1 - normalCDF(z2)) * 100;
  document.getElementById('probLeft').style.width = leftArea + '%';
  document.getElementById('probCenter').style.width = centerArea + '%';
  document.getElementById('probRight').style.width = rightArea + '%';
  document.getElementById('probLeftVal').textContent = leftArea.toFixed(2) + '%';
  document.getElementById('probCenterVal').textContent = centerArea.toFixed(2) + '%';
  document.getElementById('probRightVal').textContent = rightArea.toFixed(2) + '%';

  // Explanation
  document.getElementById('explanationBox').style.display = 'block';
  document.getElementById('explanationText').innerHTML =
    `The probability that Z falls between <span class="highlight">${z1.toFixed(2)}</span> and <span class="highlight">${z2.toFixed(2)}</span> is <strong>${(area*100).toFixed(2)}%</strong>. ` +
    `This means approximately <strong>${(area*100).toFixed(2)}%</strong> of observations from a standard normal distribution lie within this range.`;

  document.getElementById('meaningBox').style.display = 'none';
  document.getElementById('ztRow').textContent = '—';
  document.getElementById('ztCol').textContent = '—';
  document.getElementById('ztVal').textContent = '—';

  drawBellCurve();
}

/* ===========================================================
   Z-TABLE LOOKUP
   =========================================================== */
function updateZTableLookup(z) {
  const absZ = Math.abs(z);
  const row = Math.floor(absZ * 10) / 10;
  const col = Math.round((absZ - row) * 100) / 100;
  const area = normalCDF(absZ) - 0.5;
  document.getElementById('ztRow').textContent = row.toFixed(1);
  document.getElementById('ztCol').textContent = col.toFixed(2);
  document.getElementById('ztVal').textContent = area.toFixed(4);
}

/* ===========================================================
   EXPLANATION
   =========================================================== */
function updateExplanation(z, area0z, cdf) {
  const box = document.getElementById('explanationBox');
  box.style.display = 'block';
  const txt = document.getElementById('explanationText');
  const absZ = Math.abs(z);
  const dir = z >= 0 ? 'above' : 'below';
  const areaP = (area0z * 100).toFixed(2);
  const cdfP = (cdf * 100).toFixed(2);

  let html = '';
  if (z === 0) {
    html = `A Z-score of <span class="highlight">0</span> is exactly at the mean. <strong>50%</strong> of observations lie below and <strong>50%</strong> above this point.`;
  } else {
    html = `Your Z-score of <span class="highlight">${z.toFixed(2)}</span> is <strong>${absZ.toFixed(2)} standard deviations ${dir}</strong> the mean. `;
    html += `Approximately <strong>${areaP}%</strong> of observations lie between the mean and this Z-score. `;
    html += `About <strong>${cdfP}%</strong> of observations lie below this Z-score.`;
  }
  txt.innerHTML = html;
}

/* ===========================================================
   MEANING
   =========================================================== */
function updateMeaning(z) {
  const box = document.getElementById('meaningBox');
  box.style.display = 'block';
  const badge = document.getElementById('meaningBadge');
  const desc = document.getElementById('meaningDesc');
  const absZ = Math.abs(z);
  let label, color, bg, text;

  if (absZ === 0) {
    label = 'Average'; color = '#4B5563'; bg = 'rgba(75,85,99,0.1)';
    text = 'Exactly at the mean of the distribution. This is the most typical value.';
  } else if (absZ < 1) {
    label = 'Typical'; color = '#047857'; bg = 'rgba(4,120,87,0.1)';
    text = `Within one standard deviation of the mean. About 68% of values fall in this range. This is a common, unremarkable result.`;
  } else if (absZ < 2) {
    label = 'Uncommon'; color = '#B45309'; bg = 'rgba(180,83,9,0.1)';
    text = `Between one and two standard deviations ${z > 0 ? 'above' : 'below'} the mean. Only about ${z > 0 ? ((1-normalCDF(z))*100).toFixed(1) : (normalCDF(z)*100).toFixed(1)}% of values are this ${z > 0 ? 'high' : 'low'} or more extreme.`;
  } else if (absZ < 3) {
    label = 'Rare'; color = '#B91C1C'; bg = 'rgba(185,28,28,0.1)';
    text = `More than two standard deviations from the mean. This is a statistically unusual result — only about ${((1-normalCDF(absZ))*2*100).toFixed(2)}% of values are this extreme in either direction.`;
  } else {
    label = 'Extremely Rare'; color = '#6F263D'; bg = 'rgba(111,38,61,0.15)';
    text = `More than three standard deviations from the mean. This is exceptionally rare in a normal distribution — fewer than 0.3% of values are this extreme.`;
  }

  badge.textContent = label;
  badge.style.background = bg;
  badge.style.color = color;
  desc.textContent = text;
}

/* ===========================================================
   ANIMATION HELPERS
   =========================================================== */
function animateText(id, text) {
  document.getElementById(id).textContent = text;
}

function animateNumber(id, target, decimals) {
  const el = document.getElementById(id);
  const start = parseFloat(el.textContent) || 0;
  const diff = target - start;
  if (Math.abs(diff) < 0.00005) { el.textContent = target.toFixed(decimals); return; }
  const duration = 400;
  const startTime = performance.now();
  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    el.textContent = (start + diff * eased).toFixed(decimals);
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ===========================================================
   SVG BELL CURVE
   =========================================================== */
const SVG_NS = 'http://www.w3.org/2000/svg';
const GW = 700, GH = 340;
const MARGIN = { top: 30, right: 30, bottom: 50, left: 30 };
const PW = GW - MARGIN.left - MARGIN.right;
const PH = GH - MARGIN.top - MARGIN.bottom;
const X_MIN = -4, X_MAX = 4;
const Y_MAX = 0.42;

function xScale(x) { return MARGIN.left + ((x - X_MIN) / (X_MAX - X_MIN)) * PW; }
function yScale(y) { return MARGIN.top + PH - (y / Y_MAX) * PH; }

function drawBellCurve() {
  const svg = document.getElementById('bellCurve');
  svg.innerHTML = '';
  const cs = getComputedStyle(document.documentElement);
  const curveFill = cs.getPropertyValue('--curve-fill').trim();
  const curveStroke = cs.getPropertyValue('--curve-stroke').trim();
  const curveLine = cs.getPropertyValue('--curve-line').trim();
  const gridLine = cs.getPropertyValue('--grid-line').trim();
  const markerColor = cs.getPropertyValue('--marker-color').trim();
  const textMuted = cs.getPropertyValue('--text-muted').trim();
  const textColor = cs.getPropertyValue('--text').trim();

  // Defs
  const defs = document.createElementNS(SVG_NS, 'defs');
  // Gradient for filled area
  const grad = document.createElementNS(SVG_NS, 'linearGradient');
  grad.id = 'areaGrad';
  grad.setAttribute('x1','0'); grad.setAttribute('y1','0');
  grad.setAttribute('x2','0'); grad.setAttribute('y2','1');
  const stop1 = document.createElementNS(SVG_NS, 'stop');
  stop1.setAttribute('offset','0%'); stop1.setAttribute('stop-color', curveStroke); stop1.setAttribute('stop-opacity','0.35');
  const stop2 = document.createElementNS(SVG_NS, 'stop');
  stop2.setAttribute('offset','100%'); stop2.setAttribute('stop-color', curveStroke); stop2.setAttribute('stop-opacity','0.05');
  grad.appendChild(stop1); grad.appendChild(stop2);
  defs.appendChild(grad);
  svg.appendChild(defs);

  // Grid lines
  for (let x = -3; x <= 3; x++) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', xScale(x)); line.setAttribute('y1', MARGIN.top);
    line.setAttribute('x2', xScale(x)); line.setAttribute('y2', MARGIN.top + PH);
    line.setAttribute('stroke', gridLine); line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }
  for (let y = 0.1; y <= 0.4; y += 0.1) {
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', MARGIN.left); line.setAttribute('y1', yScale(y));
    line.setAttribute('x2', MARGIN.left + PW); line.setAttribute('y2', yScale(y));
    line.setAttribute('stroke', gridLine); line.setAttribute('stroke-width', '1');
    svg.appendChild(line);
  }

  // X-axis
  const xAxis = document.createElementNS(SVG_NS, 'line');
  xAxis.setAttribute('x1', MARGIN.left); xAxis.setAttribute('y1', yScale(0));
  xAxis.setAttribute('x2', MARGIN.left + PW); xAxis.setAttribute('y2', yScale(0));
  xAxis.setAttribute('stroke', textMuted); xAxis.setAttribute('stroke-width', '1');
  svg.appendChild(xAxis);

  // Tick marks + labels
  for (let x = -3; x <= 3; x++) {
    const tick = document.createElementNS(SVG_NS, 'line');
    tick.setAttribute('x1', xScale(x)); tick.setAttribute('y1', yScale(0));
    tick.setAttribute('x2', xScale(x)); tick.setAttribute('y2', yScale(0) + 6);
    tick.setAttribute('stroke', textMuted); tick.setAttribute('stroke-width', '1');
    svg.appendChild(tick);
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', xScale(x)); label.setAttribute('y', yScale(0) + 22);
    label.setAttribute('text-anchor', 'middle'); label.setAttribute('fill', textMuted);
    label.setAttribute('font-size', '11'); label.setAttribute('font-family', "'DM Mono', monospace");
    label.textContent = x;
    svg.appendChild(label);
  }

  // Y-axis labels
  for (let y = 0.1; y <= 0.4; y += 0.1) {
    const label = document.createElementNS(SVG_NS, 'text');
    label.setAttribute('x', MARGIN.left - 6); label.setAttribute('y', yScale(y) + 4);
    label.setAttribute('text-anchor', 'end'); label.setAttribute('fill', textMuted);
    label.setAttribute('font-size', '9'); label.setAttribute('font-family', "'DM Mono', monospace");
    label.textContent = y.toFixed(1);
    svg.appendChild(label);
  }

  // Generate curve points
  const STEPS = 400;
  const curvePoints = [];
  for (let i = 0; i <= STEPS; i++) {
    const x = X_MIN + (X_MAX - X_MIN) * i / STEPS;
    curvePoints.push({ x, y: normalPDF(x) });
  }

  // Shaded area
  let fillFrom, fillTo;
  if (currentMode === 'area0z') {
    fillFrom = 0; fillTo = Math.abs(currentZ);
    if (currentZ < 0) { fillFrom = currentZ; fillTo = 0; }
    else { fillFrom = 0; fillTo = currentZ; }
  } else if (currentMode === 'leftTail') {
    fillFrom = X_MIN; fillTo = currentZ;
  } else if (currentMode === 'rightTail') {
    fillFrom = currentZ; fillTo = X_MAX;
  } else {
    fillFrom = currentZ1; fillTo = currentZ2;
  }

  // Build fill path
  let fillPath = `M ${xScale(Math.max(fillFrom, X_MIN))},${yScale(0)} `;
  for (let i = 0; i <= STEPS; i++) {
    const x = X_MIN + (X_MAX - X_MIN) * i / STEPS;
    if (x >= fillFrom && x <= fillTo) {
      fillPath += `L ${xScale(x)},${yScale(normalPDF(x))} `;
    }
  }
  fillPath += `L ${xScale(Math.min(fillTo, X_MAX))},${yScale(0)} Z`;

  const fillEl = document.createElementNS(SVG_NS, 'path');
  fillEl.setAttribute('d', fillPath);
  fillEl.setAttribute('fill', 'url(#areaGrad)');
  fillEl.setAttribute('stroke', 'none');
  fillEl.style.transition = 'all 0.3s ease';
  svg.appendChild(fillEl);

  // Bell curve line
  let curvePath = `M ${xScale(curvePoints[0].x)},${yScale(curvePoints[0].y)} `;
  for (let i = 1; i < curvePoints.length; i++) {
    curvePath += `L ${xScale(curvePoints[i].x)},${yScale(curvePoints[i].y)} `;
  }
  const curveEl = document.createElementNS(SVG_NS, 'path');
  curveEl.setAttribute('d', curvePath);
  curveEl.setAttribute('fill', 'none');
  curveEl.setAttribute('stroke', curveStroke);
  curveEl.setAttribute('stroke-width', '2.5');
  curveEl.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(curveEl);

  // Mean line (dashed)
  const meanLine = document.createElementNS(SVG_NS, 'line');
  meanLine.setAttribute('x1', xScale(0)); meanLine.setAttribute('y1', MARGIN.top);
  meanLine.setAttribute('x2', xScale(0)); meanLine.setAttribute('y2', yScale(0));
  meanLine.setAttribute('stroke', textMuted); meanLine.setAttribute('stroke-width', '1');
  meanLine.setAttribute('stroke-dasharray', '4,4');
  svg.appendChild(meanLine);

  // Z marker(s)
  function drawMarker(z, label) {
    if (z < X_MIN || z > X_MAX) return;
    const mLine = document.createElementNS(SVG_NS, 'line');
    mLine.setAttribute('x1', xScale(z)); mLine.setAttribute('y1', MARGIN.top);
    mLine.setAttribute('x2', xScale(z)); mLine.setAttribute('y2', yScale(0));
    mLine.setAttribute('stroke', markerColor); mLine.setAttribute('stroke-width', '2');
    mLine.setAttribute('stroke-dasharray', '6,3');
    svg.appendChild(mLine);

    // Marker dot
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', xScale(z)); dot.setAttribute('cy', yScale(normalPDF(z)));
    dot.setAttribute('r', '5'); dot.setAttribute('fill', markerColor);
    dot.setAttribute('stroke', '#fff'); dot.setAttribute('stroke-width', '2');
    svg.appendChild(dot);

    // Label background
    const labelText = label || `Z = ${z.toFixed(2)}`;
    const lx = xScale(z);
    const ly = MARGIN.top - 8;

    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', lx - 36); bg.setAttribute('y', ly - 14);
    bg.setAttribute('width', 72); bg.setAttribute('height', 20);
    bg.setAttribute('rx', 4); bg.setAttribute('fill', markerColor);
    svg.appendChild(bg);

    const txt = document.createElementNS(SVG_NS, 'text');
    txt.setAttribute('x', lx); txt.setAttribute('y', ly);
    txt.setAttribute('text-anchor', 'middle'); txt.setAttribute('fill', '#fff');
    txt.setAttribute('font-size', '10'); txt.setAttribute('font-weight', '600');
    txt.setAttribute('font-family', "'DM Mono', monospace");
    txt.textContent = labelText;
    svg.appendChild(txt);
  }

  if (currentMode === 'between') {
    drawMarker(currentZ1, `Z₁ = ${currentZ1.toFixed(2)}`);
    drawMarker(currentZ2, `Z₂ = ${currentZ2.toFixed(2)}`);
  } else {
    drawMarker(currentZ);
  }

  // Area annotation
  let annotZ, annotArea;
  if (currentMode === 'between') {
    annotZ = (currentZ1 + currentZ2) / 2;
    annotArea = normalCDF(currentZ2) - normalCDF(currentZ1);
  } else if (currentMode === 'area0z') {
    const az = Math.abs(currentZ);
    annotZ = currentZ >= 0 ? az / 2 : currentZ / 2;
    annotArea = normalCDF(az) - 0.5;
  } else if (currentMode === 'leftTail') {
    annotZ = Math.min(currentZ, 0) / 2 - 0.5;
    annotArea = normalCDF(currentZ);
  } else {
    annotZ = Math.max(currentZ, 0) / 2 + 0.5;
    annotArea = 1 - normalCDF(currentZ);
  }

  // Only show annotation if area > 0.001
  if (annotArea > 0.001) {
    const annX = xScale(annotZ);
    const annY = yScale(normalPDF(annotZ) * 0.4);
    const annText = document.createElementNS(SVG_NS, 'text');
    annText.setAttribute('x', annX); annText.setAttribute('y', annY);
    annText.setAttribute('text-anchor', 'middle'); annText.setAttribute('fill', curveStroke);
    annText.setAttribute('font-size', '12'); annText.setAttribute('font-weight', '700');
    annText.setAttribute('font-family', "'DM Mono', monospace");
    annText.textContent = (annotArea * 100).toFixed(2) + '%';
    svg.appendChild(annText);
  }

  // σ labels
  const sigmaLabels = [{x:-1,t:'-1σ'},{x:1,t:'+1σ'},{x:-2,t:'-2σ'},{x:2,t:'+2σ'}];
  sigmaLabels.forEach(({x,t}) => {
    const sl = document.createElementNS(SVG_NS, 'text');
    sl.setAttribute('x', xScale(x)); sl.setAttribute('y', yScale(0) + 36);
    sl.setAttribute('text-anchor', 'middle'); sl.setAttribute('fill', textMuted);
    sl.setAttribute('font-size', '9'); sl.setAttribute('font-family', "'DM Sans', sans-serif");
    sl.setAttribute('opacity', '0.6');
    sl.textContent = t;
    svg.appendChild(sl);
  });
}

/* ===========================================================
   CONVERTER
   =========================================================== */
function convertToZ() {
  const x = parseFloat(document.getElementById('convX').value);
  const mu = parseFloat(document.getElementById('convMu1').value);
  const sigma = parseFloat(document.getElementById('convSig1').value);
  const res = document.getElementById('convResult1');
  if (isNaN(x) || isNaN(mu) || isNaN(sigma) || sigma <= 0) {
    res.textContent = 'Enter valid values (σ > 0)';
    res.style.color = '#B91C1C';
    return;
  }
  const z = (x - mu) / sigma;
  res.style.color = '';
  res.innerHTML = `Z = ${z.toFixed(4)}<br><span style="font-size:12px;color:var(--text-muted);">Percentile: ${(normalCDF(z)*100).toFixed(2)}%</span>`;
}

function convertToRaw() {
  const z = parseFloat(document.getElementById('convZ2').value);
  const mu = parseFloat(document.getElementById('convMu2').value);
  const sigma = parseFloat(document.getElementById('convSig2').value);
  const res = document.getElementById('convResult2');
  if (isNaN(z) || isNaN(mu) || isNaN(sigma) || sigma <= 0) {
    res.textContent = 'Enter valid values (σ > 0)';
    res.style.color = '#B91C1C';
    return;
  }
  const x = mu + z * sigma;
  res.style.color = '';
  res.textContent = `X = ${x.toFixed(4)}`;
}

/* ===========================================================
   EVENT LISTENERS
   =========================================================== */
document.getElementById('calcBtn').addEventListener('click', calculate);
document.getElementById('resetBtn').addEventListener('click', () => {
  ['zInput','zInputLeft','zInputRight','zInput1','zInput2'].forEach(id => {
    document.getElementById(id).value = '';
  });
  document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('resultsPanel').style.display = 'none';
  document.getElementById('explanationBox').style.display = 'none';
  document.getElementById('meaningBox').style.display = 'none';
  document.getElementById('probBarSection').style.display = 'none';
  currentZ = 0;
  drawBellCurve();
});

// Auto-calculate on input change
['zInput','zInputLeft','zInputRight','zInput1','zInput2'].forEach(id => {
  const el = document.getElementById(id);
  el.addEventListener('input', () => {
    // Clear preset highlight
    document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
    calculate();
  });
  el.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); calculate(); }});
});

/* ===========================================================
   INIT
   =========================================================== */
(function init() {
  document.getElementById('zInput').value = '1.96';
  highlightPreset(1.96);
  calculate();
  drawBellCurve();
})();

// Redraw on resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(drawBellCurve, 100);
});
