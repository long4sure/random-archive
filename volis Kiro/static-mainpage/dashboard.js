// ── Mock data ─────────────────────────────────────────────────────────────
const MOCK = {
    weekly: {
        kpi: { sku:42, lipas:38, actual:123500, planned:130000 },
        cumulative: {
            labels:["Line 1","Line 2","Line 3","Line 4"],
            datasets:[
                { label:"VOLPAS Actual",  data:[24500,31000,28600,39400], backgroundColor:"rgba(30,95,200,.75)",  borderColor:"#1e5fc8", borderWidth:1 },
                { label:"VOLPAS Planned", data:[26000,32000,30000,42000], backgroundColor:"rgba(200,32,42,.55)",  borderColor:"#c8202a", borderWidth:1 }
            ]
        },
        daily: {
            labels:["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
            datasets:[
                { label:"1st Shift", data:[4200,4600,4400,4800,4700,3900,0], backgroundColor:"rgba(30,95,200,.8)",  borderColor:"#1e5fc8", borderWidth:1 },
                { label:"2nd Shift", data:[3800,4100,4300,4200,4000,3400,0], backgroundColor:"rgba(74,159,212,.8)", borderColor:"#4a9fd4", borderWidth:1 },
                { label:"3rd Shift", data:[3000,3100,3200,3150,2980,2500,0], backgroundColor:"rgba(200,32,42,.7)",  borderColor:"#c8202a", borderWidth:1 }
            ]
        }
    },
    monthly: {
        kpi:{ sku:151, lipas:140, actual:487900, planned:500000 },
        shift:{
            labels:["Week 1","Week 2","Week 3","Week 4","Week 5"],
            datasets:[
                { label:"Line 1", data:[65000,71000,69000,72000,42000], backgroundColor:"rgba(30,95,200,.75)",  borderColor:"#1e5fc8", borderWidth:1 },
                { label:"Line 2", data:[58000,63000,61000,64000,38000], backgroundColor:"rgba(74,159,212,.75)", borderColor:"#4a9fd4", borderWidth:1 },
                { label:"Line 3", data:[47000,51000,49500,52000,31000], backgroundColor:"rgba(200,32,42,.65)",  borderColor:"#c8202a", borderWidth:1 }
            ]
        },
        cum:{
            labels:["Week 1","Week 2","Week 3","Week 4","Week 5"],
            datasets:[
                { label:"VOLPAS Actual",  data:[170000,185000,179000,188000,114000], backgroundColor:"rgba(30,95,200,.75)", borderColor:"#1e5fc8", borderWidth:1 },
                { label:"VOLPAS Planned", data:[176000,190000,185000,194000,118000], backgroundColor:"rgba(200,32,42,.55)", borderColor:"#c8202a", borderWidth:1 }
            ]
        }
    },
    yearly: {
        kpi:{ sku:1640, lipas:1582, actual:5654200, planned:5900000 },
        shift:{
            labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
            datasets:[
                { label:"Line 1", data:[820000,790000,910000,880000,940000,870000,0,0,0,0,0,0], backgroundColor:"rgba(30,95,200,.75)",  borderColor:"#1e5fc8", borderWidth:1 },
                { label:"Line 2", data:[740000,710000,830000,800000,860000,790000,0,0,0,0,0,0], backgroundColor:"rgba(74,159,212,.75)", borderColor:"#4a9fd4", borderWidth:1 }
            ]
        },
        cum:{
            labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
            datasets:[
                { label:"VOLPAS Actual",  data:[810000,780000,905000,875000,935000,865000,0,0,0,0,0,0], backgroundColor:"rgba(30,95,200,.75)", borderColor:"#1e5fc8", borderWidth:1 },
                { label:"VOLPAS Planned", data:[830000,800000,920000,890000,950000,880000,0,0,0,0,0,0], backgroundColor:"rgba(200,32,42,.55)", borderColor:"#c8202a", borderWidth:1 }
            ]
        }
    },
    lv:{
        monthly:{
            labels:["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
            lipas:  { plan:[20000,21000,22000,21500,22500,21000,0,0,0,0,0,0], actual:[19500,20400,21800,21000,22000,20500,0,0,0,0,0,0] },
            volpas: { plan:[21000,22000,23000,22500,23500,22000,0,0,0,0,0,0], actual:[20700,21600,22800,22100,23200,21700,0,0,0,0,0,0] }
        },
        weekly:{
            labels:["Week 1","Week 2","Week 3","Week 4","Week 5"],
            lipas:  { plan:[5500,5600,5700,5500,5200], actual:[5400,5500,5600,5400,5100] },
            volpas: { plan:[5800,5900,6000,5800,5500], actual:[5700,5800,5900,5700,5400] }
        }
    }
};

// ── Chart registry ────────────────────────────────────────────────────────
const charts = {};
function destroyChart(id){ if(charts[id]){ charts[id].destroy(); delete charts[id]; } }
function makeChart(id, type, data, extra={}){
    destroyChart(id);
    const canvas = document.getElementById(id);
    if(!canvas) return;
    const defaults = {
        responsive:true,
        plugins:{ legend:{ position:"top", labels:{ font:{ family:"Inter", size:11 }, boxWidth:12 } } },
        scales: type==="pie" ? {} : { x:{ stacked:false, ticks:{ font:{family:"Inter",size:11} } }, y:{ beginAtZero:true, ticks:{ font:{family:"Inter",size:11} } } }
    };
    charts[id] = new Chart(canvas, { type, data, options:Object.assign(defaults, extra) });
}

// ── Report routing ────────────────────────────────────────────────────────
const REPORTS = ["weekly","monthly","yearly","lipas_volpas"];
const TITLES  = { weekly:"Weekly Report", monthly:"Monthly Report", yearly:"Yearly Report", lipas_volpas:"LIPAS VOLPAS Report" };

function getReport(){
    const r = new URLSearchParams(window.location.search).get("report");
    return REPORTS.includes(r) ? r : "weekly";
}

function switchReport(report){
    REPORTS.forEach(r => {
        document.getElementById(`${r}-section`)?.classList.toggle("hidden", r!==report);
        document.getElementById(`tab-${r}`)?.classList.toggle("active", r===report);
    });
    const titleEl = document.getElementById("topbarTitle");
    if(titleEl) titleEl.textContent = TITLES[report] || report;
    // push to URL without reload
    const url = new URL(window.location);
    url.searchParams.set("report", report);
    window.history.replaceState({}, "", url);
    // render charts for the newly visible section
    if(report==="weekly")       applyWeeklyFilters();
    if(report==="monthly")      applyMonthlyFilters();
    if(report==="yearly")       applyYearlyFilters();
    if(report==="lipas_volpas") applyLvFilters();
}

// ── KPI helper ────────────────────────────────────────────────────────────
function setKpi(id, val){ const el=document.getElementById(id); if(el) el.textContent=typeof val==="number"?val.toLocaleString():val; }

// ── Weekly ────────────────────────────────────────────────────────────────
function applyWeeklyFilters(){
    const d = MOCK.weekly;
    setKpi("w-kpi-sku",    d.kpi.sku);
    setKpi("w-kpi-lipas",  d.kpi.lipas);
    setKpi("w-kpi-actual", d.kpi.actual);
    setKpi("w-kpi-planned",d.kpi.planned);

    const opsLabels = { week1:"May 5–11", week2:"May 12–18", week3:"May 19–25", week4:"May 26–Jun 1", all:"All Weeks" };
    const ops = document.getElementById("w-ops")?.value || "week3";
    const titleEl = document.getElementById("dailyShiftTitle");
    if(titleEl) titleEl.textContent = `Daily Shift Output – ${opsLabels[ops]||""}`;

    const shift = document.getElementById("w-shift")?.value || "all";
    let dailyData = JSON.parse(JSON.stringify(d.daily));
    if(shift!=="all"){ const idx=parseInt(shift)-1; dailyData.datasets=[dailyData.datasets[idx]]; }

    makeChart("cumulativeChart","bar",d.cumulative);
    makeChart("dailyShiftChart_0","bar",dailyData,{ scales:{ x:{stacked:true}, y:{stacked:true,beginAtZero:true} } });
}

// ── Monthly ───────────────────────────────────────────────────────────────
function applyMonthlyFilters(){
    const d = MOCK.monthly;
    setKpi("m-kpi-sku",    d.kpi.sku);
    setKpi("m-kpi-lipas",  d.kpi.lipas);
    setKpi("m-kpi-actual", d.kpi.actual);
    setKpi("m-kpi-planned",d.kpi.planned);
    makeChart("monthlyShiftChart","bar",d.shift);
    makeChart("monthlyCumChart",  "bar",d.cum);
}

// ── Yearly ────────────────────────────────────────────────────────────────
function applyYearlyFilters(){
    const d = MOCK.yearly;
    setKpi("y-kpi-sku",    d.kpi.sku);
    setKpi("y-kpi-lipas",  d.kpi.lipas);
    setKpi("y-kpi-actual", d.kpi.actual);
    setKpi("y-kpi-planned",d.kpi.planned);
    makeChart("yearlyShiftChart","bar",d.shift);
    makeChart("yearlyCumChart",  "bar",d.cum);
}

// ── LIPAS VOLPAS ──────────────────────────────────────────────────────────
let lvChartType = "bar";

function setLvChartType(type){
    lvChartType = type;
    document.getElementById("btn-bar")?.classList.toggle("active", type==="bar");
    document.getElementById("btn-pie")?.classList.toggle("active", type==="pie");
    applyLvFilters();
}

function applyLvFilters(){
    const period  = document.getElementById("lv-period")?.value || "monthly";
    const dataset = document.getElementById("lv-dataset")?.value || "both";

    document.getElementById("lv-month-group")?.classList.toggle("hidden", period==="weekly");
    document.getElementById("lv-week-group")?.classList.toggle("hidden",  period!=="weekly");

    const src = period==="weekly" ? MOCK.lv.weekly : MOCK.lv.monthly;
    const labels = src.labels;

    const lPlan   = src.lipas.plan.reduce((a,b)=>a+b,0);
    const lActual = src.lipas.actual.reduce((a,b)=>a+b,0);
    const vPlan   = src.volpas.plan.reduce((a,b)=>a+b,0);
    const vActual = src.volpas.actual.reduce((a,b)=>a+b,0);
    const lPct    = lPlan>0 ? Math.min(100,(lActual/lPlan*100)).toFixed(2) : "0.00";
    const vPct    = vPlan>0 ? Math.min(100,(vActual/vPlan*100)).toFixed(2) : "0.00";

    setKpi("lv-kpi-lplan",  lPlan);
    setKpi("lv-kpi-lactual",lActual);
    setKpi("lv-kpi-vplan",  vPlan);
    setKpi("lv-kpi-vactual",vActual);

    const lpctEl = document.getElementById("lv-kpi-lpct");
    const vpctEl = document.getElementById("lv-kpi-vpct");
    if(lpctEl){ lpctEl.textContent=lPct+"%"; lpctEl.className="lv-pct "+(parseFloat(lPct)>=100?"pct-green":"pct-red"); }
    if(vpctEl){ vpctEl.textContent=vPct+"%"; vpctEl.className="lv-pct "+(parseFloat(vPct)>=100?"pct-green":"pct-red"); }

    // Show/hide KPI cards and chart wrappers
    ["lv-card-lplan","lv-card-lactual"].forEach(id => document.getElementById(id)?.classList.toggle("hidden", dataset==="volpas"));
    ["lv-card-vplan","lv-card-vactual"].forEach(id => document.getElementById(id)?.classList.toggle("hidden", dataset==="lipas"));
    document.getElementById("lv-lipas-wrap")?.classList.toggle("hidden",  dataset==="volpas");
    document.getElementById("lv-volpas-wrap")?.classList.toggle("hidden", dataset==="lipas");

    if(lvChartType==="pie"){
        if(dataset!=="volpas") makeChart("lvLipasChart","pie",{
            labels:["LIPAS Plan","LIPAS Actual"],
            datasets:[{ data:[lPlan,lActual], backgroundColor:["rgba(30,95,200,.7)","rgba(26,39,68,.85)"], borderWidth:1 }]
        });
        if(dataset!=="lipas") makeChart("lvVolpasChart","pie",{
            labels:["VOLPAS Plan","VOLPAS Actual"],
            datasets:[{ data:[vPlan,vActual], backgroundColor:["rgba(200,32,42,.6)","rgba(160,24,32,.85)"], borderWidth:1 }]
        });
    } else {
        if(dataset!=="volpas") makeChart("lvLipasChart","bar",{
            labels,
            datasets:[
                { label:"LIPAS Plan",   data:src.lipas.plan,   backgroundColor:"rgba(30,95,200,.45)",  borderColor:"#1e5fc8", borderWidth:2 },
                { label:"LIPAS Actual", data:src.lipas.actual, backgroundColor:"rgba(30,95,200,.85)",  borderColor:"#1a2744", borderWidth:2 }
            ]
        });
        if(dataset!=="lipas") makeChart("lvVolpasChart","bar",{
            labels,
            datasets:[
                { label:"VOLPAS Plan",   data:src.volpas.plan,   backgroundColor:"rgba(200,32,42,.4)",  borderColor:"#c8202a", borderWidth:2 },
                { label:"VOLPAS Actual", data:src.volpas.actual, backgroundColor:"rgba(200,32,42,.85)", borderColor:"#a01820", borderWidth:2 }
            ]
        });
    }
}

// ── Sidebar ───────────────────────────────────────────────────────────────
function initSidebar(){
    const btn      = document.getElementById("hamburgerBtn");
    const sidebar  = document.getElementById("sidebar");
    const backdrop = document.getElementById("sidebarBackdrop");
    if(!btn||!sidebar) return;
    btn.addEventListener("click",()=>{ sidebar.classList.toggle("mobile-open"); backdrop.classList.toggle("active"); });
    backdrop.addEventListener("click",()=>{ sidebar.classList.remove("mobile-open"); backdrop.classList.remove("active"); });
}

// ── Logout dialog ─────────────────────────────────────────────────────────
function openLogout()  { document.getElementById("logoutDlg")?.classList.add("open"); }
function closeLogout() { document.getElementById("logoutDlg")?.classList.remove("open"); }

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded",()=>{
    initSidebar();
    const report = getReport();
    switchReport(report);
});
