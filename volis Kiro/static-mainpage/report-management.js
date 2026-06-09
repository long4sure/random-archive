// ── Shared helpers ────────────────────────────────────────────────────────
function initSidebar(){
    const btn=document.getElementById("hamburgerBtn"),sidebar=document.getElementById("sidebar"),backdrop=document.getElementById("sidebarBackdrop");
    if(!btn||!sidebar) return;
    btn.addEventListener("click",()=>{sidebar.classList.toggle("mobile-open");backdrop.classList.toggle("active");});
    backdrop.addEventListener("click",()=>{sidebar.classList.remove("mobile-open");backdrop.classList.remove("active");});
}
function openLogout()  { document.getElementById("logoutDlg")?.classList.add("open"); }
function closeLogout() { document.getElementById("logoutDlg")?.classList.remove("open"); }
function showToast(msg,type=""){
    const t=document.getElementById("toast"); if(!t) return;
    t.textContent=msg; t.className="toast"+(type?" "+type:"");
    t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),3200);
}

// ── Mock data ─────────────────────────────────────────────────────────────
const MOCK_ROWS=[
    {team:"A",line:"Line 1",sku:"SKU-001",desc:"Product Alpha 500ml",qty:30000,uom:"PCS",shiftOut:9800,cum:9200,opsStart:"2026-05-19",opsEnd:"2026-05-25",lipas:"N",volpas:0.3067},
    {team:"A",line:"Line 1",sku:"SKU-002",desc:"Product Beta 1L",    qty:28000,uom:"PCS",shiftOut:9400,cum:9100,opsStart:"2026-05-19",opsEnd:"2026-05-25",lipas:"N",volpas:0.3250},
    {team:"A",line:"Line 2",sku:"SKU-010",desc:"Product Delta 750ml",qty:25500,uom:"PCS",shiftOut:8600,cum:8400,opsStart:"2026-05-19",opsEnd:"2026-05-25",lipas:"N",volpas:0.3294},
    {team:"A",line:"Line 2",sku:"SKU-011",desc:"Product Epsilon 2L", qty:22000,uom:"PCS",shiftOut:7400,cum:7200,opsStart:"2026-05-19",opsEnd:"2026-05-25",lipas:"N",volpas:0.3273},
    {team:"B",line:"Line 3",sku:"SKU-020",desc:"Product Zeta 330ml", qty:20000,uom:"PCS",shiftOut:6800,cum:6600,opsStart:"2026-05-19",opsEnd:"2026-05-25",lipas:"N",volpas:0.3300},
];
const MOCK_LV=[
    {team:"A",line:"Line 1",month:"MAY",year:2026,opsStart:"2026-05-05",opsEnd:"2026-05-11",lipasPlan:24,lipasActual:22,volpasPlan:30000,volpasActual:28500},
    {team:"A",line:"Line 1",month:"MAY",year:2026,opsStart:"2026-05-12",opsEnd:"2026-05-18",lipasPlan:24,lipasActual:23,volpasPlan:30000,volpasActual:29100},
    {team:"A",line:"Line 1",month:"MAY",year:2026,opsStart:"2026-05-19",opsEnd:"2026-05-25",lipasPlan:24,lipasActual:21,volpasPlan:30000,volpasActual:27800},
    {team:"A",line:"Line 2",month:"MAY",year:2026,opsStart:"2026-05-05",opsEnd:"2026-05-11",lipasPlan:20,lipasActual:19,volpasPlan:25500,volpasActual:24800},
    {team:"A",line:"Line 2",month:"MAY",year:2026,opsStart:"2026-05-12",opsEnd:"2026-05-18",lipasPlan:20,lipasActual:18,volpasPlan:25500,volpasActual:24100},
    {team:"B",line:"Line 3",month:"MAY",year:2026,opsStart:"2026-05-05",opsEnd:"2026-05-11",lipasPlan:18,lipasActual:17,volpasPlan:22000,volpasActual:21500},
    {team:"B",line:"Line 3",month:"MAY",year:2026,opsStart:"2026-05-12",opsEnd:"2026-05-18",lipasPlan:18,lipasActual:16,volpasPlan:22000,volpasActual:21000},
];

// ── View switching ────────────────────────────────────────────────────────
const VIEWS=["formulate","manage-line","manage-lv"];
const VIEW_TITLES={formulate:"Formulate Line Report","manage-line":"Manage Line Report","manage-lv":"Manage LIPAS VOLPAS"};
const VIEW_SUBS={formulate:"Formulate","manage-line":"Manage Line","manage-lv":"Manage LV"};

function getView(){ const v=new URLSearchParams(window.location.search).get("view"); return VIEWS.includes(v)?v:"formulate"; }
function switchView(view){
    VIEWS.forEach(v=>{
        document.getElementById(`${v}-section`)?.classList.toggle("hidden",v!==view);
        document.getElementById(`btn-${v}`)?.classList.toggle("active",v===view);
    });
    document.getElementById("topbarTitle").textContent=VIEW_TITLES[view]||"";
    document.getElementById("topbarSub").textContent=VIEW_SUBS[view]||"";
    const url=new URL(window.location); url.searchParams.set("view",view); window.history.replaceState({},""  ,url);
    if(view==="formulate")   formulateApply();
    if(view==="manage-line") manageLineApply();
    if(view==="manage-lv")   manageLvApply();
}

// ── Helpers ───────────────────────────────────────────────────────────────
function getChecked(cls){ return [...document.querySelectorAll(`.${cls}:checked`)].map(cb=>parseInt(cb.value)); }
function lipasColor(v){ return v==="Y"?"color:var(--green);font-weight:700;":"color:var(--pioneer-red);font-weight:700;"; }
function pctColor(p){ return parseFloat(p)>=100?"color:var(--green);font-weight:700;":"color:var(--pioneer-red);font-weight:700;"; }
function fmtDate(d){ if(!d) return ""; const dt=new Date(d+"T00:00:00"); return dt.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); }

function buildShiftTable(rows,tableId,shiftLabel){
    const totQty=rows.reduce((a,r)=>a+r.qty,0), totSO=rows.reduce((a,r)=>a+r.shiftOut,0), totCum=rows.reduce((a,r)=>a+r.cum,0);
    const lipasN=rows.filter(r=>r.lipas==="Y").length, skuCnt=rows.length;
    const lipasPct=skuCnt>0?Math.min(100,Math.round(lipasN/skuCnt*100)):0;
    const volpasPct=totQty>0?Math.min(100,Math.round(totCum/totQty*100)):0;
    return `
    <h3 style="font-size:14px;font-weight:700;color:var(--text-primary);margin:20px 0 10px;">${shiftLabel}</h3>
    <div class="report-table-card">
        <div class="report-table-head">
            <span class="report-table-head-title">${shiftLabel} — ${rows.length} SKUs</span>
            <button class="btn btn-success" style="padding:6px 14px;font-size:12px;" onclick="exportTable('${tableId}','${shiftLabel}')">↓ Export</button>
        </div>
        <div style="overflow-x:auto;">
            <table id="${tableId}">
                <thead><tr><th>Team</th><th>Line</th><th>SKU Code</th><th>SKU Description</th><th>Quantity</th><th>UOM</th><th>Shift Output</th><th>Cumulative</th><th>Ops Start</th><th>Ops End</th><th>LIPAS</th><th>VOLPAS</th></tr></thead>
                <tbody>
                    ${rows.map(r=>`<tr>
                        <td>${r.team}</td><td>${r.line}</td><td class="mono">${r.sku}</td><td>${r.desc}</td>
                        <td class="mono">${r.qty.toLocaleString()}</td><td>${r.uom}</td>
                        <td class="mono">${r.shiftOut.toLocaleString()}</td><td class="mono">${r.cum.toLocaleString()}</td>
                        <td>${r.opsStart}</td><td>${r.opsEnd}</td>
                        <td><span style="${lipasColor(r.lipas)}">${r.lipas}</span></td>
                        <td class="mono">${r.volpas.toFixed(4)}</td>
                    </tr>`).join("")}
                </tbody>
                <tfoot><tr><td colspan="4">TOTALS</td><td class="mono">${totQty.toLocaleString()}</td><td></td><td class="mono">${totSO.toLocaleString()}</td><td class="mono">${totCum.toLocaleString()}</td><td colspan="4"></td></tr></tfoot>
            </table>
        </div>
        <div class="summary-stats">
            <div class="stat-item"><div class="stat-label">Quantity</div><input class="stat-input" readonly value="${totQty.toLocaleString()}"></div>
            <div class="stat-item"><div class="stat-label">Cumulative</div><input class="stat-input" readonly value="${totCum.toLocaleString()}"></div>
            <div class="stat-item"><div class="stat-label">SKU Count</div><input class="stat-input" readonly value="${skuCnt}" style="width:80px;"></div>
            <div class="stat-item"><div class="stat-label">LIPAS Count</div>
                <div class="lipas-inputs"><input class="stat-input" readonly value="${lipasN}" style="width:60px;"><span class="lipas-div">/</span><input class="stat-input" readonly value="${lipasPct}%" style="width:70px;"></div>
            </div>
            <div class="stat-item"><div class="stat-label">VOLPAS</div><input class="stat-input" readonly value="${volpasPct}%" style="width:80px;"></div>
            <div class="stat-item"><div class="stat-label">Shift Output</div><input class="stat-input" readonly value="${totSO.toLocaleString()}"></div>
        </div>
    </div>`;
}

function exportTable(tableId,filename){
    const table=document.getElementById(tableId); if(!table) return;
    const rows=[...table.querySelectorAll("tr")].map(tr=>[...tr.querySelectorAll("th,td")].map(td=>td.textContent.trim()).join(",")).join("\n");
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([rows],{type:"text/csv"})),download:filename.replace(/\s+/g,"_")+".csv"});
    a.click();
}

// ── Formulate ─────────────────────────────────────────────────────────────
function formulateApply(){
    const team=document.getElementById("f-team")?.value||"";
    const shifts=getChecked("shift-cb");
    const results=document.getElementById("formulateResults");
    const saveBar=document.getElementById("formulateSaveBar");
    if(!team){
        results.innerHTML=`<div class="empty-state"><span class="empty-state-icon">◫</span><div class="empty-state-title">Select a Team to get started</div></div>`;
        saveBar.classList.add("hidden"); return;
    }
    const filtered=MOCK_ROWS.filter(r=>r.team===team);
    if(!filtered.length){
        results.innerHTML=`<div class="empty-state"><span class="empty-state-icon">◫</span><div class="empty-state-title">No data for selected filters</div></div>`;
        saveBar.classList.add("hidden"); return;
    }
    const shiftNames={1:"1st Shift (6AM–2PM)",2:"2nd Shift (2PM–10PM)",3:"3rd Shift (10PM–6AM)"};
    results.innerHTML=shifts.map(sn=>buildShiftTable(filtered,`shiftTbl${sn}`,shiftNames[sn])).join("");
    saveBar.classList.remove("hidden");
}
function formulateReset(){
    document.getElementById("f-team").value="";
    document.getElementById("f-month").value="MAY";
    document.getElementById("f-ops").value="2026-05-19|2026-05-25";
    document.getElementById("f-day").value="2026-05-21";
    document.querySelectorAll(".shift-cb").forEach(cb=>cb.checked=true);
    document.getElementById("formulateResults").innerHTML="";
    document.getElementById("formulateSaveBar").classList.add("hidden");
}

// ── Manage Line Report ────────────────────────────────────────────────────
function manageLineApply(){
    const team=document.getElementById("ml-team")?.value||"";
    const shifts=getChecked("ml-shift-cb");
    const results=document.getElementById("manageLineResults");
    const filtered=MOCK_ROWS.filter(r=>!team||r.team===team);
    if(!filtered.length){
        results.innerHTML=`<div class="empty-state"><span class="empty-state-icon">◫</span><div class="empty-state-title">No saved report data</div><div class="empty-state-sub">Apply filters and try again.</div></div>`;
        return;
    }
    const shiftNames={1:"1st Shift",2:"2nd Shift",3:"3rd Shift"};
    results.innerHTML=shifts.map(sn=>buildShiftTable(filtered,`mlTbl${sn}`,shiftNames[sn]+" (Saved)")).join("");
}
function manageLineReset(){
    document.getElementById("ml-team").value="";
    document.getElementById("ml-month").value="MAY";
    document.getElementById("ml-day").value="";
    document.querySelectorAll(".ml-shift-cb").forEach(cb=>cb.checked=true);
    document.getElementById("manageLineResults").innerHTML="";
}

// ── Manage LIPAS VOLPAS ───────────────────────────────────────────────────
function manageLvApply(){
    const team=document.getElementById("lv-team")?.value||"";
    const ops=document.getElementById("lv-ops")?.value||"";
    const filtered=MOCK_LV.filter(r=>(!team||r.team===team)&&(!ops||(r.opsStart+"|"+r.opsEnd)===ops));

    const lPlan=filtered.reduce((a,r)=>a+r.lipasPlan,0), lActual=filtered.reduce((a,r)=>a+r.lipasActual,0);
    const vPlan=filtered.reduce((a,r)=>a+r.volpasPlan,0), vActual=filtered.reduce((a,r)=>a+r.volpasActual,0);
    const lPct=lPlan>0?Math.min(100,(lActual/lPlan*100)).toFixed(1):"0.0";
    const vPct=vPlan>0?Math.min(100,(vActual/vPlan*100)).toFixed(1):"0.0";

    document.getElementById("lvTotalsGrid").innerHTML=`
        <div class="lv-total-card lipas card"><div class="card-title">LIPAS Total Plan</div><div class="card-value">${lPlan.toLocaleString()}</div></div>
        <div class="lv-total-card lipas card"><div class="card-title">LIPAS Total Actual</div><div class="card-value">${lActual.toLocaleString()}</div><div class="lv-pct ${parseFloat(lPct)>=100?"pct-green":"pct-red"}">${lPct}%</div></div>
        <div class="lv-total-card volpas card"><div class="card-title">VOLPAS Total Plan</div><div class="card-value">${vPlan.toLocaleString()}</div></div>
        <div class="lv-total-card volpas card"><div class="card-title">VOLPAS Total Actual</div><div class="card-value">${vActual.toLocaleString()}</div><div class="lv-pct ${parseFloat(vPct)>=100?"pct-green":"pct-red"}">${vPct}%</div></div>
    `;

    if(ops){ renderLvDetailed(filtered); } else { renderLvPivot(filtered); }
}

function renderLvDetailed(rows){
    const head=`<tr><th>Team</th><th>Line</th><th>Month</th><th>Ops Start</th><th>Ops End</th><th>LIPAS Plan</th><th>LIPAS Actual</th><th>LIPAS %</th><th>VOLPAS Plan</th><th>VOLPAS Actual</th><th>VOLPAS %</th></tr>`;
    const makeRows=rows.map(r=>{
        const lp=r.lipasPlan>0?Math.min(100,(r.lipasActual/r.lipasPlan*100)).toFixed(1):"0.0";
        const vp=r.volpasPlan>0?Math.min(100,(r.volpasActual/r.volpasPlan*100)).toFixed(1):"0.0";
        return `<tr><td>${r.team}</td><td>${r.line}</td><td>${r.month}</td><td>${r.opsStart}</td><td>${r.opsEnd}</td>
            <td class="mono">${r.lipasPlan}</td><td class="mono">${r.lipasActual}</td><td><span style="${pctColor(lp)}">${lp}%</span></td>
            <td class="mono">${r.volpasPlan.toLocaleString()}</td><td class="mono">${r.volpasActual.toLocaleString()}</td><td><span style="${pctColor(vp)}">${vp}%</span></td>
        </tr>`;
    }).join("");
    document.getElementById("lipasHead").innerHTML=head; document.getElementById("lipasTbody").innerHTML=makeRows;
    document.getElementById("volpasHead").innerHTML=head; document.getElementById("volpasTbody").innerHTML=makeRows;
}

function renderLvPivot(rows){
    const ranges=[...new Set(rows.map(r=>r.opsStart+"|"+r.opsEnd))].sort();
    const rangeLabels=ranges.map(r=>{ const[s,e]=r.split("|"); return fmtDate(s)+" – "+fmtDate(e); });
    const head=`<tr><th>Team</th><th>Line</th><th>Month</th>${rangeLabels.map(l=>`<th>${l}</th>`).join("")}<th>Total Plan</th><th>Total Actual</th><th>%</th></tr>`;
    const groups={};
    rows.forEach(r=>{ const k=`${r.team}||${r.line}||${r.month}`; if(!groups[k]) groups[k]={team:r.team,line:r.line,month:r.month,ranges:{}}; groups[k].ranges[r.opsStart+"|"+r.opsEnd]=r; });
    const lipasTbody=Object.values(groups).map(g=>{
        const cells=ranges.map(rk=>{ const d=g.ranges[rk]; return d?`<td class="mono">${d.lipasPlan}/${d.lipasActual}</td>`:`<td style="color:var(--text-muted);">—</td>`; }).join("");
        const tp=Object.values(g.ranges).reduce((a,r)=>a+r.lipasPlan,0), ta=Object.values(g.ranges).reduce((a,r)=>a+r.lipasActual,0);
        const pct=tp>0?Math.min(100,(ta/tp*100)).toFixed(1):"0.0";
        return `<tr><td>${g.team}</td><td>${g.line}</td><td>${g.month}</td>${cells}<td class="mono">${tp}</td><td class="mono">${ta}</td><td><span style="${pctColor(pct)}">${pct}%</span></td></tr>`;
    }).join("");
    const volpasTbody=Object.values(groups).map(g=>{
        const cells=ranges.map(rk=>{ const d=g.ranges[rk]; return d?`<td class="mono">${d.volpasPlan.toLocaleString()}/${d.volpasActual.toLocaleString()}</td>`:`<td style="color:var(--text-muted);">—</td>`; }).join("");
        const tp=Object.values(g.ranges).reduce((a,r)=>a+r.volpasPlan,0), ta=Object.values(g.ranges).reduce((a,r)=>a+r.volpasActual,0);
        const pct=tp>0?Math.min(100,(ta/tp*100)).toFixed(1):"0.0";
        return `<tr><td>${g.team}</td><td>${g.line}</td><td>${g.month}</td>${cells}<td class="mono">${tp.toLocaleString()}</td><td class="mono">${ta.toLocaleString()}</td><td><span style="${pctColor(pct)}">${pct}%</span></td></tr>`;
    }).join("");
    document.getElementById("lipasHead").innerHTML=head; document.getElementById("lipasTbody").innerHTML=lipasTbody;
    document.getElementById("volpasHead").innerHTML=head; document.getElementById("volpasTbody").innerHTML=volpasTbody;
}

function manageLvReset(){ document.getElementById("lv-team").value=""; document.getElementById("lv-year").value="2026"; document.getElementById("lv-month").value="MAY"; document.getElementById("lv-ops").value=""; manageLvApply(); }

// ── Modals ────────────────────────────────────────────────────────────────
function openSaveModal()  { document.getElementById("saveDlg")?.classList.add("open"); }
function closeSaveModal() { document.getElementById("saveDlg")?.classList.remove("open"); }
function confirmSave()    { closeSaveModal(); showToast("Report data saved successfully.","success"); }
function openLvModal()    { document.getElementById("lvModal")?.classList.add("open"); }
function closeLvModal()   { document.getElementById("lvModal")?.classList.remove("open"); }
function confirmLv()      { const w=document.querySelector('input[name="lv-week"]:checked')?.value||1; closeLvModal(); showToast(`LIPAS VOLPAS data saved for Week ${w}.`,"success"); }

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded",()=>{
    initSidebar();
    const view=getView(); switchView(view);
});
