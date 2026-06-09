'use strict';

// ── Constants ────────────────────────────────────────────────────────────────
const MONTHS = ['OCT','NOV','DEC','JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP'];

// ── Default Data ─────────────────────────────────────────────────────────────
const DEFAULT_DATA = {
  utilities: {
    act26: {
      cost: [1419.396,1774.361,969.300,1402.336,1610.775,1823.867,1761.209,0,0,0,0,0],
      vol:  [1235.077,1604.295,1116.661,1610.185,1401.684,1923.821,1795.409,0,0,0,0,0]
    },
    ob26: {
      cost: [1360.921,1360.921,1360.921,1360.921,1360.921,1098.064,1098.064,1098.064,1098.064,1098.064,1098.064,1098.064],
      vol:  [1221.866,1414.924,1090.697,1561.423,1557.404,1735.500,1562.843,1582.313,1778.153,1786.124,1680.816,1842.025]
    },
    act25: {
      cost: [989.328,1216.217,1100.687,1197.250,1011.898,1424.429,1006.350,1020.920,1645.035,1576.584,1604.604,1778.981],
      vol:  [1348.547,1507.939,852.370,1119.745,1401.766,1932.838,1132.089,1545.606,1462.671,1661.469,1385.854,1906.487]
    }
  },
  rm: {
    act26: {
      cost: [627.408,534.585,592.597,413.535,782.007,720.106,1510.803,0,0,0,0,0],
      vol:  [1235.077,1604.295,1116.661,1610.185,1401.684,1923.821,1795.409,0,0,0,0,0]
    },
    ob26: {
      cost: [147.667,167.667,467.667,1707.667,232.667,608.667,897.667,1167.667,237.667,157.667,207.667,638.667],
      vol:  [1221.866,1414.924,1090.697,1561.423,1557.404,1735.500,1562.843,1582.313,1778.153,1786.124,1680.816,1842.025]
    },
    act25: {
      cost: [204.637,227.669,98.505,424.059,859.434,649.425,560.928,1463.890,1098.990,1021.489,656.978,644.171],
      vol:  [1348.547,1507.939,852.370,1119.745,1401.766,1932.838,1132.089,1545.606,1462.671,1661.469,1385.854,1906.487]
    }
  }
};

// Working copy
let data = deepClone(DEFAULT_DATA);

// ── Helpers ───────────────────────────────────────────────────────────────────
function deepClone(obj) { return JSON.parse(JSON.stringify(obj)); }

function cpk(cost, vol) { return (vol && vol > 0) ? cost / vol : null; }

function sumArr(arr, count) {
  const n = (count !== undefined) ? count : arr.length;
  return arr.slice(0, n).reduce((a, b) => a + b, 0);
}

function ytdCount(arr) {
  // Count trailing non-zero entries from start
  let c = 0;
  for (let i = 0; i < arr.length; i++) { if (arr[i] > 0) c++; }
  return c;
}

function fmt(v, dec = 4) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return v.toFixed(dec);
}

function fmtNum(v) {
  if (v === null || v === undefined || isNaN(v)) return '—';
  return v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 3 });
}

// ── Tab Switching ─────────────────────────────────────────────────────────────
function showTab(tab, btn) {
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('tab-' + tab).classList.add('active');
  btn.classList.add('active');
}

// ── Cell Edit Handler ─────────────────────────────────────────────────────────
function handleCellEdit(input) {
  const cat = input.dataset.cat;
  const s   = input.dataset.set;
  const key = input.dataset.key;
  const mi  = parseInt(input.dataset.mi);
  const val = parseFloat(input.value);

  data[cat][s][key][mi] = isNaN(val) ? 0 : val;

  // Recalculate CPK for this cell
  recomputeCpkCell(cat, s, mi);
  recomputeTotals(cat);
  buildSummary();
  buildVariance();
}

function recomputeCpkCell(cat, s, mi) {
  const d = data[cat];
  const v = cpk(d[s].cost[mi], d[s].vol[mi]);
  const el = document.getElementById('cpk-' + cat + '-' + s + '-' + mi);
  if (el) {
    if (el.tagName === 'INPUT') {
      el.value = v !== null ? v.toFixed(4) : '';
    } else {
      el.textContent = v !== null ? fmt(v) : '—';
    }
  }
}

function recomputeTotals(cat) {
  const d = data[cat];
  const ytd = ytdCount(d.act26.cost);
  ['act26', 'ob26', 'act25'].forEach(s => {
    const isFullYear = (s === 'act25');
    const n = isFullYear ? 12 : ytd;
    const costSum = sumArr(d[s].cost, n);
    const volSum  = sumArr(d[s].vol,  n);
    const cpkTot  = cpk(costSum, volSum);

    const cpkEl  = document.getElementById('cpk-tot-' + cat + '-' + s);
    const costEl = document.getElementById('tot-cost-' + cat + '-' + s);
    const volEl  = document.getElementById('tot-vol-'  + cat + '-' + s);

    if (cpkEl)  cpkEl.textContent  = cpkTot !== null ? fmt(cpkTot) : '—';
    if (costEl) costEl.textContent = fmtNum(costSum);
    if (volEl)  volEl.textContent  = fmtNum(volSum);
  });
}

// ── Build Table ───────────────────────────────────────────────────────────────
function buildTable(tableId, cat) {
  const tbl = document.getElementById(tableId);
  const d   = data[cat];
  const ytd = ytdCount(d.act26.cost);
  const cpkRowCls = cat === 'utilities' ? 'row-cpk' : 'row-cpk-rm';

  const sets = [
    { key: 'act26', label: 'Actual FY26',     hcls: 'group-act',  editable: true  },
    { key: 'ob26',  label: 'Budget FY26 (OB)', hcls: 'group-ob',   editable: true  },
    { key: 'act25', label: 'Actual FY25',     hcls: 'group-act25', editable: true  }
  ];

  // ── THEAD ──
  let thead = '<thead>';

  // Row 1: group headers
  thead += '<tr><th rowspan="2" style="text-align:left;vertical-align:bottom;">Row</th>';
  sets.forEach((s, si) => {
    const sepCls = si > 0 ? ' col-sep' : '';
    thead += `<th colspan="${MONTHS.length}" class="${s.hcls}${sepCls}">${s.label}</th>`;
  });
  thead += '<th class="group-act col-sep tot" colspan="2">YTD Act26</th>';
  thead += '<th class="group-ob  col-sep tot" colspan="2">YTD OB26</th>';
  thead += '<th class="group-act25 col-sep tot" colspan="2">FY25 Total</th>';
  thead += '</tr>';

  // Row 2: month headers
  thead += '<tr>';
  sets.forEach((s, si) => {
    MONTHS.forEach((m, mi) => {
      const sepCls = (mi === 0 && si > 0) ? ' col-sep' : '';
      thead += `<th class="${s.hcls}${sepCls}">${m}</th>`;
    });
  });
  // Total sub-headers
  ['group-act','group-ob','group-act25'].forEach(g => {
    thead += `<th class="${g} col-sep tot">Cost</th><th class="${g} tot">Vol (kg)</th>`;
  });
  thead += '</tr></thead>';

  // ── TBODY ──
  const rowDefs = [
    { key: 'cost', label: 'Cost',        rowCls: 'row-cost' },
    { key: 'vol',  label: 'Volume (kg)', rowCls: 'row-vol'  },
    { key: 'cpk',  label: 'Cost / Kg',   rowCls: cpkRowCls  }
  ];

  let tbody = '<tbody>';

  rowDefs.forEach(rd => {
    tbody += `<tr class="${rd.rowCls}"><td>${rd.label}</td>`;

    sets.forEach((s, si) => {
      MONTHS.forEach((m, mi) => {
        const sepCls = (mi === 0 && si > 0) ? ' col-sep' : '';
        let val;

        if (rd.key === 'cpk') {
          val = cpk(d[s.key].cost[mi], d[s.key].vol[mi]);
        } else {
          val = d[s.key][rd.key][mi];
        }

        const zeroCls = (!val || val === 0) ? ' zero' : '';

        if (s.editable && rd.key !== 'cpk') {
          // Editable input cell
          const daKey = `data-cat="${cat}" data-set="${s.key}" data-key="${rd.key}" data-mi="${mi}"`;
          const dispVal = (val && val !== 0) ? val.toFixed(3) : '';
          tbody += `<td class="editable-cell${sepCls}${zeroCls}">`;
          tbody += `<input type="number" step="0.001" value="${dispVal}" placeholder="0.000" ${daKey} onchange="handleCellEdit(this)" />`;
          tbody += `</td>`;
        } else if (rd.key === 'cpk') {
          // CPK: display only (auto-computed) — but still editable if needed? No — always auto
          const id = `cpk-${cat}-${s.key}-${mi}`;
          tbody += `<td id="${id}" class="${zeroCls}${sepCls}">${val !== null ? fmt(val) : '—'}</td>`;
        } else {
          tbody += `<td class="${zeroCls}${sepCls}">${val ? fmtNum(val) : '—'}</td>`;
        }
      });
    });

    // Totals columns (3 sets × 2 cols each)
    const totSets = [
      { key: 'act26', n: ytd },
      { key: 'ob26',  n: ytd },
      { key: 'act25', n: 12  }
    ];

    totSets.forEach((ts, tsi) => {
      const costSum = sumArr(d[ts.key].cost, ts.n);
      const volSum  = sumArr(d[ts.key].vol,  ts.n);
      const cpkTot  = cpk(costSum, volSum);

      if (rd.key === 'cost') {
        const id = `tot-cost-${cat}-${ts.key}`;
        tbody += `<td id="${id}" class="col-sep tot">${fmtNum(costSum)}</td>`;
        const vid = `tot-vol-${cat}-${ts.key}`;
        tbody += `<td id="${vid}" class="tot">${fmtNum(volSum)}</td>`;
      } else if (rd.key === 'vol') {
        tbody += `<td class="col-sep tot" colspan="2"></td>`;
      } else {
        // cpk row totals
        const id = `cpk-tot-${cat}-${ts.key}`;
        tbody += `<td id="${id}" class="col-sep tot" style="font-weight:700">${cpkTot !== null ? fmt(cpkTot) : '—'}</td>`;
        tbody += `<td class="tot"></td>`;
      }
    });

    tbody += '</tr>';
  });

  tbody += '</tbody>';
  tbl.innerHTML = thead + tbody;
}

// ── Summary Cards ─────────────────────────────────────────────────────────────
function buildSummary() {
  const cards = document.getElementById('summary-cards');
  const ytdU  = ytdCount(data.utilities.act26.cost);
  const ytdR  = ytdCount(data.rm.act26.cost);

  const utActCost  = sumArr(data.utilities.act26.cost, ytdU);
  const utObCost   = sumArr(data.utilities.ob26.cost,  ytdU);
  const utActVol   = sumArr(data.utilities.act26.vol,  ytdU);
  const utObVol    = sumArr(data.utilities.ob26.vol,   ytdU);

  const rmActCost  = sumArr(data.rm.act26.cost, ytdR);
  const rmObCost   = sumArr(data.rm.ob26.cost,  ytdR);
  const rmActVol   = sumArr(data.rm.act26.vol,  ytdR);
  const rmObVol    = sumArr(data.rm.ob26.vol,   ytdR);

  const engActCpk = cpk(utActCost + rmActCost, utActVol);
  const engObCpk  = cpk(utObCost  + rmObCost,  utObVol);
  const engVar    = (engActCpk && engObCpk) ? ((engActCpk - engObCpk) / engObCpk) * 100 : null;
  const isOver    = engVar > 0;

  const defs = [
    { label: 'YTD Utilities Cost',      value: fmtNum(utActCost),   sub: 'Actual FY26 (Oct–Apr)', cls: 'neutral' },
    { label: 'YTD R&M Cost',            value: fmtNum(rmActCost),   sub: 'Actual FY26 (Oct–Apr)', cls: 'neutral' },
    { label: 'Engg CC Cost/Kg (Act)',   value: engActCpk ? engActCpk.toFixed(4) : '—', sub: 'Combined YTD Actual', cls: 'neutral' },
    { label: 'Engg CC Cost/Kg (OB)',    value: engObCpk  ? engObCpk.toFixed(4)  : '—', sub: 'Budget YTD',         cls: 'neutral' },
    { label: 'Variance vs Budget',      value: engVar !== null ? (isOver ? '+' : '') + engVar.toFixed(2) + '%' : '—',
      sub: isOver ? 'Over budget' : 'Under budget', cls: isOver ? 'neg' : 'pos' },
    { label: 'YTD Production Volume',   value: fmtNum(utActVol),    sub: 'Actual FY26 (kg)',      cls: 'neutral' }
  ];

  cards.innerHTML = defs.map(d => `
    <div class="summary-card">
      <div class="label">${d.label}</div>
      <div class="value ${d.cls}">${d.value}</div>
      <div class="sub">${d.sub}</div>
    </div>`).join('');
}

// ── Variance Panel ────────────────────────────────────────────────────────────
function buildVariance() {
  const vg = document.getElementById('variance-grid');
  const catDefs = [
    { key: 'utilities', label: 'Utilities' },
    { key: 'rm',        label: 'Repair & Maintenance' }
  ];

  vg.innerHTML = catDefs.map(c => {
    const d   = data[c.key];
    const ytd = ytdCount(d.act26.cost);

    const actCost = sumArr(d.act26.cost, ytd);
    const obCost  = sumArr(d.ob26.cost,  ytd);
    const actVol  = sumArr(d.act26.vol,  ytd);
    const obVol   = sumArr(d.ob26.vol,   ytd);
    const act25Cost = sumArr(d.act25.cost);
    const act25Vol  = sumArr(d.act25.vol);

    const actCpk  = cpk(actCost,    actVol);
    const obCpk   = cpk(obCost,     obVol);
    const act25Cpk = cpk(act25Cost, act25Vol);

    const absVar  = actCost - obCost;
    const pctVar  = obCost > 0 ? (absVar / obCost) * 100 : null;
    const cpkVar  = (actCpk && obCpk) ? actCpk - obCpk : null;
    const cpkPct  = (actCpk && obCpk) ? ((actCpk - obCpk) / obCpk) * 100 : null;
    const yoyCost = actCost - sumArr(d.act25.cost, ytd);
    const yoyPct  = sumArr(d.act25.cost, ytd) > 0 ? (yoyCost / sumArr(d.act25.cost, ytd)) * 100 : null;

    const isOver  = absVar > 0;
    const isCpkOv = cpkVar > 0;
    const isYoyOv = yoyCost > 0;

    function varRow(label, val, cls, pill) {
      return `<div class="var-row">
        <span class="var-label">${label}</span>
        <span class="var-val ${cls}">${val}${pill ? ` <span class="pill ${isCpkOv||isOver||isYoyOv?'pill-over':'pill-under'}">${pill}</span>` : ''}</span>
      </div>`;
    }

    return `<div class="var-card">
      <h4>${c.label} — YTD Variance Summary</h4>
      <div class="var-row"><span class="var-label">Actual Cost (YTD)</span><span class="var-val">${fmtNum(actCost)}</span></div>
      <div class="var-row"><span class="var-label">Budget Cost (YTD)</span><span class="var-val">${fmtNum(obCost)}</span></div>
      <div class="var-row">
        <span class="var-label">Abs. Variance (Act vs OB)</span>
        <span class="var-val ${isOver?'over':'under'}">${isOver?'+':''}${fmtNum(absVar)}
          <span class="pill ${isOver?'pill-over':'pill-under'}">${isOver?'Over':'Under'}</span>
        </span>
      </div>
      <div class="var-row">
        <span class="var-label">% Variance (Act vs OB)</span>
        <span class="var-val ${isOver?'over':'under'}">${pctVar!==null?(isOver?'+':'')+pctVar.toFixed(2)+'%':'—'}</span>
      </div>
      <div class="var-row"><span class="var-label">Actual Cost/Kg</span><span class="var-val">${actCpk!==null?actCpk.toFixed(4):'—'}</span></div>
      <div class="var-row"><span class="var-label">Budget Cost/Kg</span><span class="var-val">${obCpk!==null?obCpk.toFixed(4):'—'}</span></div>
      <div class="var-row">
        <span class="var-label">Cost/Kg Variance</span>
        <span class="var-val ${isCpkOv?'over':'under'}">${cpkVar!==null?(isCpkOv?'+':'')+cpkVar.toFixed(4):'—'}
          <span class="pill ${isCpkOv?'pill-over':'pill-under'}">${cpkPct!==null?(isCpkOv?'+':'')+cpkPct.toFixed(1)+'%':''}</span>
        </span>
      </div>
      <div class="var-row"><span class="var-label">Prior Year Cost/Kg (FY25)</span><span class="var-val">${act25Cpk!==null?act25Cpk.toFixed(4):'—'}</span></div>
      <div class="var-row">
        <span class="var-label">YoY Cost Change</span>
        <span class="var-val ${isYoyOv?'over':'under'}">${yoyCost!==null?(isYoyOv?'+':'')+fmtNum(yoyCost):'—'}
          ${yoyPct!==null?`<span class="pill ${isYoyOv?'pill-over':'pill-under'}">${isYoyOv?'+':''}${yoyPct.toFixed(1)}%</span>`:''}
        </span>
      </div>
    </div>`;
  }).join('');
}

// ── Data Entry Form ───────────────────────────────────────────────────────────
function applyEntry() {
  const cat  = document.getElementById('e-cat').value;
  const set  = document.getElementById('e-set').value;
  const mi   = parseInt(document.getElementById('e-month').value);
  const cost = parseFloat(document.getElementById('e-cost').value);
  const vol  = parseFloat(document.getElementById('e-vol').value);

  if (isNaN(cost) && isNaN(vol)) {
    showMsg('Please enter at least a cost or volume value.', true);
    return;
  }

  if (!isNaN(cost)) data[cat][set].cost[mi] = cost;
  if (!isNaN(vol))  data[cat][set].vol[mi]  = vol;

  buildTable('tbl-utilities', 'utilities');
  buildTable('tbl-rm', 'rm');
  buildSummary();
  buildVariance();

  const setLabel = { act26: 'Actual FY26', ob26: 'Budget FY26 (OB)', act25: 'Actual FY25' }[set];
  const catLabel = cat === 'utilities' ? 'Utilities' : 'R&M';
  showMsg(
    `✓ Updated ${catLabel} — ${setLabel} — ${MONTHS[mi]}: ` +
    `Cost = ${!isNaN(cost) ? cost.toFixed(3) : 'unchanged'}, ` +
    `Vol = ${!isNaN(vol) ? vol.toFixed(3) : 'unchanged'}`,
    false
  );
}

function clearEntry() {
  document.getElementById('e-cost').value = '';
  document.getElementById('e-vol').value  = '';
  document.getElementById('entry-msg').style.display = 'none';
}

function showMsg(msg, isErr) {
  const el = document.getElementById('entry-msg');
  el.textContent = msg;
  el.className = isErr ? 'error' : '';
  el.style.display = 'block';
  clearTimeout(el._timer);
  el._timer = setTimeout(() => { el.style.display = 'none'; }, 5000);
}

function resetData() {
  if (!confirm('Reset all data to original file defaults?')) return;
  data = deepClone(DEFAULT_DATA);
  buildTable('tbl-utilities', 'utilities');
  buildTable('tbl-rm', 'rm');
  buildSummary();
  buildVariance();
  showMsg('All data reset to original defaults.', false);
}

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  buildTable('tbl-utilities', 'utilities');
  buildTable('tbl-rm', 'rm');
  buildSummary();
  buildVariance();
})();
