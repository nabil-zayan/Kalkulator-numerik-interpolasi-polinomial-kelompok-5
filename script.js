const METHODS = {
  linear:   { n: 2, degree: 1, label: 'Linear',    example: [[2,4],[6,12]] },
  kuadratik:{ n: 3, degree: 2, label: 'Kuadratik', example: [[1,1],[2,4],[3,9]] },
  kubik:    { n: 4, degree: 3, label: 'Kubik',     example: [[0,0],[1,1],[2,8],[3,27]] }
};

let currentMethod = 'linear';
let chart = null;
let lastResult = null; // { yPred }
let lastComputation = null; // { points, coeffs, degree, targetX, yPred }

const coordList = document.getElementById('coord-list');
const tabs = document.getElementById('tabs');
const targetXInput = document.getElementById('target-x');
const trueYInput = document.getElementById('true-y');
const errorMsg = document.getElementById('error-msg');
const resultValueEl = document.getElementById('result-value');
const equationTextEl = document.getElementById('equation-text');
const metaMethodEl = document.getElementById('meta-method');
const metaDegreeEl = document.getElementById('meta-degree');
const errorPanelEl = document.getElementById('error-panel');
const errorTrueValueEl = document.getElementById('error-true-value');
const errorAbsValueEl = document.getElementById('error-abs-value');
const btnSteps = document.getElementById('btn-steps');
const modalOverlay = document.getElementById('modal-overlay');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalClose = document.getElementById('modal-close');

function buildCoordRows(method){
  const cfg = METHODS[method];
  coordList.innerHTML = '';
  for(let i = 0; i < cfg.n; i++){
    const row = document.createElement('div');
    row.className = 'coord-row';
    row.innerHTML = `
      <div class="coord-idx">${i}</div>
      <div class="field">
        <label>X${i}</label>
        <input type="number" step="any" class="coord-x" data-i="${i}" placeholder="x${i}">
      </div>
      <div class="field">
        <label>Y${i}</label>
        <input type="number" step="any" class="coord-y" data-i="${i}" placeholder="y${i}">
      </div>
    `;
    coordList.appendChild(row);
  }
}

function setMethod(method){
  currentMethod = method;
  document.querySelectorAll('.tab').forEach(t => {
    t.classList.toggle('active', t.dataset.method === method);
  });
  buildCoordRows(method);
  metaMethodEl.textContent = METHODS[method].label;
  metaDegreeEl.textContent = METHODS[method].degree;
  clearResultUI();
  clearError();
}

tabs.addEventListener('click', (e) => {
  const tab = e.target.closest('.tab');
  if(!tab) return;
  setMethod(tab.dataset.method);
});

function clearError(){
  errorMsg.textContent = '';
  document.querySelectorAll('input').forEach(i => i.classList.remove('invalid'));
}

function clearResultUI(){
  resultValueEl.textContent = '—';
  resultValueEl.classList.add('empty');
  equationTextEl.textContent = 'Belum ada perhitungan';
  equationTextEl.classList.add('empty');
  lastResult = null;
  lastComputation = null;
  errorPanelEl.style.display = 'none';
  renderChart([], null, null, METHODS[currentMethod].degree);
}

document.getElementById('btn-contoh').addEventListener('click', () => {
  const ex = METHODS[currentMethod].example;
  document.querySelectorAll('.coord-x').forEach((inp, idx) => inp.value = ex[idx][0]);
  document.querySelectorAll('.coord-y').forEach((inp, idx) => inp.value = ex[idx][1]);
  const midX = ex[Math.floor(ex.length/2) - (ex.length % 2 === 0 ? 0 : 0)];
  // Pick a sensible target between two known points
  const targets = { linear: 4, kuadratik: 1.5, kubik: 1.5 };
  targetXInput.value = targets[currentMethod];
  clearError();
});

document.getElementById('btn-clear').addEventListener('click', () => {
  document.querySelectorAll('.coord-x, .coord-y').forEach(inp => inp.value = '');
  targetXInput.value = '';
  trueYInput.value = '';
  clearError();
  clearResultUI();
});

document.getElementById('btn-copy').addEventListener('click', () => {
  if(!lastResult) return;
  navigator.clipboard?.writeText(String(lastResult.yPred));
  const btn = document.getElementById('btn-copy');
  const old = btn.textContent;
  btn.textContent = 'Tersalin!';
  setTimeout(() => btn.textContent = old, 1200);
});

/* ---------- Gaussian Elimination on Vandermonde matrix ---------- */
function gaussianElimination(Ain, bin){
  const n = bin.length;
  const A = Ain.map(row => row.slice());
  const b = bin.slice();
  for(let i = 0; i < n; i++) A[i].push(b[i]);

  for(let i = 0; i < n; i++){
    let maxEl = Math.abs(A[i][i]), maxRow = i;
    for(let k = i + 1; k < n; k++){
      if(Math.abs(A[k][i]) > maxEl){ maxEl = Math.abs(A[k][i]); maxRow = k; }
    }
    if(maxRow !== i){ [A[i], A[maxRow]] = [A[maxRow], A[i]]; }
    if(Math.abs(A[i][i]) < 1e-12) continue; // singular-ish, handled by caller via duplicate check
    for(let k = i + 1; k < n; k++){
      const c = -A[k][i] / A[i][i];
      for(let j = i; j <= n; j++){
        A[k][j] += c * A[i][j];
      }
    }
  }

  const x = new Array(n).fill(0);
  for(let i = n - 1; i >= 0; i--){
    let sum = A[i][n];
    for(let k = i + 1; k < n; k++) sum -= A[i][k] * x[k];
    x[i] = A[i][i] !== 0 ? sum / A[i][i] : 0;
  }
  return x;
}

function buildVandermonde(points, degree){
  const A = points.map(([x]) => {
    const row = [];
    for(let p = 0; p <= degree; p++) row.push(Math.pow(x, p));
    return row;
  });
  const b = points.map(([, y]) => y);
  return { A, b };
}

function evalPoly(coeffs, x){
  let y = 0;
  for(let p = 0; p < coeffs.length; p++) y += coeffs[p] * Math.pow(x, p);
  return y;
}

function fmtNum(v, decimals = 4){
  let r = Math.round(v * Math.pow(10, decimals)) / Math.pow(10, decimals);
  if(Object.is(r, -0)) r = 0;
  return r;
}

function buildEquationString(coeffs){
  const degree = coeffs.length - 1;
  const parts = [];
  for(let p = degree; p >= 0; p--){
    let c = fmtNum(coeffs[p], 4);
    if(Math.abs(c) < 1e-9 && degree > 0) continue;
    const sign = c < 0 ? '-' : (parts.length ? '+' : '');
    const abs = Math.abs(c);
    let term;
    if(p === 0) term = `${abs}`;
    else if(p === 1) term = `${abs}x`;
    else term = `${abs}x^${p}`;
    parts.push(`${sign}${parts.length ? ' ' : ''}${term}`);
  }
  if(parts.length === 0) parts.push('0');
  return 'y = ' + parts.join(' ');
}

function renderEquationAnimated(str){
  // split on spaces but keep sign tokens with following term; simplest: animate by character-chunks of terms
  const tokens = str.replace('y = ', '').split(/\s+/);
  equationTextEl.classList.remove('empty');
  equationTextEl.innerHTML = '<span class="term-in" style="animation-delay:0s">y =</span> ';
  let delay = 0.08;
  tokens.forEach(tok => {
    const span = document.createElement('span');
    span.className = 'term-in';
    span.style.animationDelay = delay + 's';
    span.textContent = tok + ' ';
    equationTextEl.appendChild(span);
    delay += 0.08;
  });
}

/* ---------- Validation ---------- */
function validateAndCollect(){
  clearError();
  const xInputs = Array.from(document.querySelectorAll('.coord-x'));
  const yInputs = Array.from(document.querySelectorAll('.coord-y'));
  let hasEmpty = false;
  const points = [];
  const xs = [];

  xInputs.forEach((xi, idx) => {
    const yi = yInputs[idx];
    if(xi.value === '' || yi.value === ''){
      hasEmpty = true;
      if(xi.value === '') xi.classList.add('invalid');
      if(yi.value === '') yi.classList.add('invalid');
    } else {
      points.push([parseFloat(xi.value), parseFloat(yi.value)]);
      xs.push(parseFloat(xi.value));
    }
  });

  if(targetXInput.value === ''){
    hasEmpty = true;
    targetXInput.classList.add('invalid');
  }

  if(hasEmpty){
    errorMsg.textContent = 'Ada kolom yang masih kosong. Lengkapi semua titik dan nilai target.';
    return null;
  }

  const seen = new Set();
  let hasDup = false;
  xInputs.forEach(xi => {
    const v = xi.value;
    if(seen.has(v)){ hasDup = true; xi.classList.add('invalid'); }
    seen.add(v);
  });
  if(hasDup){
    errorMsg.textContent = 'Nilai X tidak boleh berulang antar titik data.';
    return null;
  }

  return { points, targetX: parseFloat(targetXInput.value) };
}

/* ---------- Main compute ---------- */
document.getElementById('btn-hitung').addEventListener('click', () => {
  const data = validateAndCollect();
  if(!data) return;

  const { points, targetX } = data;
  const degree = METHODS[currentMethod].degree;
  const { A, b } = buildVandermonde(points, degree);
  const coeffs = gaussianElimination(A, b); // <-- mesin hitung utama, TIDAK diubah
  const yPred = evalPoly(coeffs, targetX);

  lastResult = { yPred: fmtNum(yPred, 4) };
  lastComputation = { points, coeffs, degree, targetX, yPred: fmtNum(yPred, 4), method: currentMethod };

  resultValueEl.textContent = fmtNum(yPred, 4);
  resultValueEl.classList.remove('empty');

  const eqStr = buildEquationString(coeffs);
  renderEquationAnimated(eqStr);

  renderChart(points, coeffs, { x: targetX, y: yPred }, degree);
  updateErrorPanel();
});

/* ---------- Fitur Galat (Error) ---------- */
function updateErrorPanel(){
  if(!lastComputation || trueYInput.value === ''){
    errorPanelEl.style.display = 'none';
    return;
  }
  const trueY = parseFloat(trueYInput.value);
  if(Number.isNaN(trueY)){
    errorPanelEl.style.display = 'none';
    return;
  }
  const galatMutlak = Math.abs(lastComputation.yPred - trueY);
  errorTrueValueEl.textContent = fmtNum(trueY, 4);
  errorAbsValueEl.textContent = fmtNum(galatMutlak, 4);
  errorPanelEl.style.display = 'block';
}

trueYInput.addEventListener('input', updateErrorPanel);

/* ---------- Chart ---------- */
function renderChart(points, coeffs, predPoint, degree){
  const ctx = document.getElementById('chart').getContext('2d');

  let curveData = [];
  let dataPoints = points.map(([x, y]) => ({ x, y }));

  if(coeffs && points.length){
    const xs = points.map(p => p[0]);
    const minX = Math.min(...xs, predPoint ? predPoint.x : Infinity);
    const maxX = Math.max(...xs, predPoint ? predPoint.x : -Infinity);
    const pad = (maxX - minX) * 0.15 || 1;
    const lo = minX - pad, hi = maxX + pad;
    const steps = 80;
    for(let s = 0; s <= steps; s++){
      const x = lo + (hi - lo) * (s / steps);
      curveData.push({ x, y: evalPoly(coeffs, x) });
    }
  }

  const datasets = [
    {
      label: 'Titik Data',
      data: dataPoints,
      backgroundColor: '#FFB454',
      borderColor: '#FFB454',
      pointRadius: 6,
      pointHoverRadius: 7,
      showLine: false,
      type: 'scatter'
    },
    {
      label: 'Kurva Polinomial',
      data: curveData,
      borderColor: '#4FEFC4',
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderDash: [6, 4],
      pointRadius: 0,
      tension: 0,
      type: 'line',
      fill: false
    }
  ];

  if(predPoint){
    datasets.push({
      label: 'Titik Prediksi',
      data: [{ x: predPoint.x, y: predPoint.y }],
      backgroundColor: '#4FEFC4',
      borderColor: '#0A0F17',
      borderWidth: 2,
      pointRadius: 8,
      pointHoverRadius: 9,
      showLine: false,
      type: 'scatter'
    });
  }

  const config = {
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 500 },
      interaction: { mode: 'nearest', intersect: false },
      scales: {
        x: {
          type: 'linear',
          grid: { color: '#161E29' },
          ticks: { color: '#7C8997', font: { family: 'IBM Plex Mono', size: 11 } },
          title: { display: true, text: 'X', color: '#4D5763', font: { family: 'IBM Plex Mono', size: 11 } }
        },
        y: {
          grid: { color: '#161E29' },
          ticks: { color: '#7C8997', font: { family: 'IBM Plex Mono', size: 11 } },
          title: { display: true, text: 'Y', color: '#4D5763', font: { family: 'IBM Plex Mono', size: 11 } }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: '#0C1119',
          borderColor: '#1D2733',
          borderWidth: 1,
          titleFont: { family: 'IBM Plex Mono', size: 11 },
          bodyFont: { family: 'IBM Plex Mono', size: 12 },
          callbacks: {
            label: (item) => `(${fmtNum(item.parsed.x,3)}, ${fmtNum(item.parsed.y,3)})`
          }
        }
      }
    }
  };

  if(chart) chart.destroy();
  chart = new Chart(ctx, config);
}

/* ---------- Init ---------- */
setMethod('linear');
renderChart([], null, null, 1);

/* =======================================================
   FITUR: LIHAT LANGKAH PENYELESAIAN
   Catatan: fungsi-fungsi di bawah ini HANYA untuk tampilan
   (trace) langkah penyelesaian. Hasil akhir yang dipakai
   tetap dari gaussianElimination() di atas, tidak diubah.
   ======================================================= */

/* --- Trace Eliminasi Gauss-Jordan (untuk Linear & Kuadratik) --- */
function gaussJordanTrace(Ain, bin){
  const n = bin.length;
  let M = Ain.map((row, i) => [...row, bin[i]]);
  const steps = [];
  steps.push({ label: 'Matriks Awal', matrix: M.map(r => r.slice()) });

  for(let i = 0; i < n; i++){
    // partial pivoting
    let maxRow = i, maxVal = Math.abs(M[i][i]);
    for(let k = i + 1; k < n; k++){
      if(Math.abs(M[k][i]) > maxVal){ maxVal = Math.abs(M[k][i]); maxRow = k; }
    }
    if(maxRow !== i){
      [M[i], M[maxRow]] = [M[maxRow], M[i]];
      steps.push({ label: `Tukar B${i+1} \u2194 B${maxRow+1}`, matrix: M.map(r => r.slice()) });
    }
    const piv = M[i][i];
    if(Math.abs(piv) > 1e-12 && Math.abs(piv - 1) > 1e-9){
      M[i] = M[i].map(v => v / piv);
      steps.push({ label: `B${i+1} \u00F7 ${fmtNum(piv,4)}`, matrix: M.map(r => r.slice()) });
    }
    for(let k = 0; k < n; k++){
      if(k === i) continue;
      const factor = M[k][i];
      if(Math.abs(factor) > 1e-9){
        M[k] = M[k].map((v, j) => v - factor * M[i][j]);
        steps.push({ label: `B${k+1} - (${fmtNum(factor,4)})\u00D7B${i+1}`, matrix: M.map(r => r.slice()) });
      }
    }
  }
  return steps;
}

function colLabelsForDegree(degree){
  const labels = [];
  for(let p = 0; p <= degree; p++) labels.push(`a${p}`);
  labels.push('b');
  return labels;
}

function renderMatrixStepsHTML(steps, degree){
  const colLabels = colLabelsForDegree(degree);
  let html = '';
  steps.forEach(step => {
    html += `<div class="step-block">`;
    html += `<div class="step-label">${step.label}</div>`;
    html += `<div class="step-matrix">`;
    step.matrix.forEach(row => {
      html += `<div class="step-matrix-row">`;
      row.forEach((val, j) => {
        const isB = j === row.length - 1;
        html += `<div class="step-matrix-cell${isB ? ' bvec' : ''}">${fmtNum(val, 4)}</div>`;
      });
      html += `</div>`;
    });
    html += `</div></div>`;
  });
  html += `<div class="modal-note">Kolom matriks berurutan: ${colLabels.join(', ')} (koefisien polinomial y = a0 + a1x + a2x² + ...). Proses berhenti saat sisi kiri menjadi matriks identitas — nilai di kolom "b" pada baris terakhir adalah koefisien a0, a1, a2, ... yang dicari.</div>`;
  return html;
}

/* --- Tabel Newton Beda Terbagi (untuk Kubik) --- */
function newtonDividedDifferenceTable(points){
  const n = points.length;
  const xs = points.map(p => p[0]);
  const fs = points.map(p => p[1]);
  const table = fs.map(f => [f]); // table[i][0] = f(xi)

  for(let j = 1; j < n; j++){
    for(let i = 0; i < n - j; i++){
      const num = table[i + 1][j - 1] - table[i][j - 1];
      const den = xs[i + j] - xs[i];
      table[i].push(num / den);
    }
  }
  return { xs, table };
}

function renderNewtonTableHTML(points){
  const { xs, table } = newtonDividedDifferenceTable(points);
  const n = points.length;
  const maxOrder = n - 1; // ST-1, ST-2, ST-3 (untuk 4 titik)

  let html = `<table class="nd-table"><thead><tr>`;
  html += `<th>Iterasi</th><th>xi</th><th>f(xi)</th>`;
  for(let o = 1; o <= maxOrder; o++) html += `<th>ST-${o}</th>`;
  html += `</tr></thead><tbody>`;

  for(let i = 0; i < n; i++){
    html += `<tr><td>${i}</td><td>${fmtNum(xs[i],4)}</td><td>${fmtNum(table[i][0],4)}</td>`;
    for(let o = 1; o <= maxOrder; o++){
      const val = table[i][o];
      html += val !== undefined ? `<td>${fmtNum(val,4)}</td>` : `<td class="empty-cell">—</td>`;
    }
    html += `</tr>`;
  }
  html += `</tbody></table>`;

  // Susun persamaan Newton dari diagonal pertama table[0]
  const coeffsNewton = table[0]; // [f(x0), ST1, ST2, ST3]
  let eqParts = [`${fmtNum(coeffsNewton[0],4)}`];
  for(let o = 1; o < coeffsNewton.length; o++){
    let term = `${fmtNum(coeffsNewton[o],4)}`;
    for(let k = 0; k < o; k++) term += `(x-${fmtNum(xs[k],4)})`;
    eqParts.push(term);
  }
  html += `<div class="modal-note">Polinom Newton: f(x) = ${eqParts.join(' + ')}<br>Koefisien ST-1, ST-2, ST-3 dipakai untuk menyusun persamaan secara bertahap dari titik x0. Hasil akhir polinom ini ekuivalen dengan persamaan hasil Eliminasi Gauss pada Matriks Vandermonde di atas.</div>`;
  return html;
}

/* --- Buka / Tutup Modal --- */
function openStepsModal(){
  if(!lastComputation){
    errorMsg.textContent = 'Klik "Hitung Prediksi Sekarang" dulu sebelum melihat langkah penyelesaian.';
    return;
  }
  const { points, degree, method } = lastComputation;

  if(method === 'kubik'){
    modalTitle.textContent = 'Polinom Newton Beda Terbagi';
    modalBody.innerHTML = renderNewtonTableHTML(points);
  } else {
    modalTitle.textContent = 'Proses Eliminasi Gauss-Jordan';
    const { A, b } = buildVandermonde(points, degree);
    const steps = gaussJordanTrace(A, b);
    modalBody.innerHTML = renderMatrixStepsHTML(steps, degree);
  }

  modalOverlay.classList.add('open');
}

function closeStepsModal(){
  modalOverlay.classList.remove('open');
}

btnSteps.addEventListener('click', openStepsModal);
modalClose.addEventListener('click', closeStepsModal);
modalOverlay.addEventListener('click', (e) => {
  if(e.target === modalOverlay) closeStepsModal();
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') closeStepsModal();
});
