// ── Shared helpers ────────────────────────────────────────────────────────
function initSidebar(){
    const btn=document.getElementById("hamburgerBtn"), sidebar=document.getElementById("sidebar"), backdrop=document.getElementById("sidebarBackdrop");
    if(!btn||!sidebar) return;
    btn.addEventListener("click",()=>{ sidebar.classList.toggle("mobile-open"); backdrop.classList.toggle("active"); });
    backdrop.addEventListener("click",()=>{ sidebar.classList.remove("mobile-open"); backdrop.classList.remove("active"); });
}
function openLogout()  { document.getElementById("logoutDlg")?.classList.add("open"); }
function closeLogout() { document.getElementById("logoutDlg")?.classList.remove("open"); }
function showToast(msg, type=""){
    const t=document.getElementById("toast"); if(!t) return;
    t.textContent=msg; t.className="toast"+(type?" "+type:"");
    t.classList.add("show"); setTimeout(()=>t.classList.remove("show"),3200);
}

// ── Mock SKU master ───────────────────────────────────────────────────────
const SKU_MASTER=[
    {sku:"SKU-001",desc:"Product Alpha 500ml",uom:"PCS",team:"A",line:"Line 1"},
    {sku:"SKU-002",desc:"Product Beta 1L",    uom:"PCS",team:"A",line:"Line 1"},
    {sku:"SKU-003",desc:"Product Gamma 250ml",uom:"CTN",team:"A",line:"Line 1"},
    {sku:"SKU-010",desc:"Product Delta 750ml",uom:"PCS",team:"A",line:"Line 2"},
    {sku:"SKU-011",desc:"Product Epsilon 2L", uom:"CTN",team:"A",line:"Line 2"},
    {sku:"SKU-020",desc:"Product Zeta 330ml", uom:"PCS",team:"B",line:"Line 3"},
    {sku:"SKU-021",desc:"Product Eta 1.5L",   uom:"CTN",team:"B",line:"Line 3"},
    {sku:"SKU-030",desc:"Product Theta 500ml",uom:"PCS",team:"C",line:"Line 4"},
    {sku:"SKU-031",desc:"Product Iota 1L",    uom:"CTN",team:"C",line:"Line 4"},
];

// ── Records store ─────────────────────────────────────────────────────────
const STORAGE_KEY="prod_records";
function loadRecords(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY))||getDefaults(); }catch{ return getDefaults(); } }
function saveRecords(r){ localStorage.setItem(STORAGE_KEY,JSON.stringify(r)); }
function getDefaults(){
    return [
        {id:1,team:"A",month:"MAY",year:2026,line:"Line 1",sku:"SKU-001",desc:"Product Alpha 500ml",qty:30000,uom:"PCS",cum:27800,opsStart:"2026-05-19",opsEnd:"2026-05-25",shifts:buildShifts(27800)},
        {id:2,team:"A",month:"MAY",year:2026,line:"Line 1",sku:"SKU-002",desc:"Product Beta 1L",    qty:28000,uom:"PCS",cum:26900,opsStart:"2026-05-19",opsEnd:"2026-05-25",shifts:buildShifts(26900)},
        {id:3,team:"A",month:"MAY",year:2026,line:"Line 2",sku:"SKU-010",desc:"Product Delta 750ml",qty:25500,uom:"PCS",cum:24100,opsStart:"2026-05-19",opsEnd:"2026-05-25",shifts:buildShifts(24100)},
        {id:4,team:"B",month:"MAY",year:2026,line:"Line 3",sku:"SKU-020",desc:"Product Zeta 330ml", qty:22000,uom:"PCS",cum:21500,opsStart:"2026-05-12",opsEnd:"2026-05-18",shifts:buildShifts(21500)},
        {id:5,team:"C",month:"APRIL",year:2026,line:"Line 4",sku:"SKU-030",desc:"Product Theta 500ml",qty:18000,uom:"PCS",cum:17200,opsStart:"2026-04-14",opsEnd:"2026-04-20",shifts:buildShifts(17200)},
    ];
}
function buildShifts(total){ const p=Math.floor(total/21),s={}; for(let d=1;d<=7;d++){s[`s1d${d}`]=p;s[`s2d${d}`]=p;s[`s3d${d}`]=p;} return s; }

let records=loadRecords(), nextId=Math.max(...records.map(r=>r.id),0)+1, selectedId=null;

// ── View switching ────────────────────────────────────────────────────────
function getView(){ const v=new URLSearchParams(window.location.search).get("view"); return v==="manage"?"manage":"add"; }
function switchView(view){
    document.getElementById("add-section")?.classList.toggle("hidden",    view!=="add");
    document.getElementById("manage-section")?.classList.toggle("hidden", view!=="manage");
    document.getElementById("btn-add")?.classList.toggle("active",    view==="add");
    document.getElementById("btn-manage")?.classList.toggle("active", view==="manage");
    const titles={add:"Add Production Record",manage:"Manage Production Records"};
    const subs={add:"Add",manage:"Manage"};
    const titleEl=document.getElementById("topbarTitle");
    const subEl=document.getElementById("topbarSub");
    if(titleEl) titleEl.textContent=titles[view]||"";
    if(subEl)   subEl.textContent=subs[view]||"";
    const url=new URL(window.location); url.searchParams.set("view",view); window.history.replaceState({},""  ,url);
    if(view==="add")    initAddForm();
    if(view==="manage") applyManageFilters();
}

// ── Manage table ──────────────────────────────────────────────────────────
function applyManageFilters(){
    const team=document.getElementById("mg-team")?.value||"";
    const month=document.getElementById("mg-month")?.value||"";
    const line=document.getElementById("mg-line")?.value||"";
    const filtered=records.filter(r=>(!team||r.team===team)&&(!month||r.month===month)&&(!line||r.line===line));
    renderTable(filtered);
    selectedId=null; updateActionBtns();
}

function renderTable(data){
    const tbody=document.getElementById("recordsTbody");
    const countEl=document.getElementById("recordCount");
    if(countEl) countEl.textContent=`${data.length} record${data.length!==1?"s":""}`;
    if(!data.length){ tbody.innerHTML=`<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:32px;">No records found.</td></tr>`; return; }
    tbody.innerHTML=data.map(r=>`
        <tr data-id="${r.id}" onclick="selectRow(${r.id},this)">
            <td>${r.team}</td><td>${r.month}</td><td>${r.year}</td><td>${r.line}</td>
            <td class="mono">${r.sku}</td><td>${r.desc}</td>
            <td class="mono">${r.qty.toLocaleString()}</td><td>${r.uom}</td>
            <td class="mono">${r.cum.toLocaleString()}</td>
            <td>${r.opsStart}</td><td>${r.opsEnd}</td>
        </tr>`).join("");
}

function selectRow(id,tr){
    document.querySelectorAll("#recordsTbody tr").forEach(r=>r.classList.remove("selected"));
    tr.classList.add("selected"); selectedId=id; updateActionBtns();
}
function updateActionBtns(){
    const has=selectedId!==null;
    document.getElementById("editBtn").disabled=!has;
    document.getElementById("deleteBtn").disabled=!has;
}

function exportCSV(){
    const headers=["TEAM","MONTH","YEAR","LINE","SKU CODE","SKU DESCRIPTION","QUANTITY","UOM","CUMULATIVE","OPS START","OPS END"];
    const rows=records.map(r=>[r.team,r.month,r.year,r.line,r.sku,r.desc,r.qty,r.uom,r.cum,r.opsStart,r.opsEnd]);
    const csv=[headers,...rows].map(r=>r.join(",")).join("\n");
    const a=Object.assign(document.createElement("a"),{href:URL.createObjectURL(new Blob([csv],{type:"text/csv"})),download:"production_export.csv"});
    a.click();
}

// ── Add form ──────────────────────────────────────────────────────────────
const DAY_NAMES=["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"];

function buildShiftRows(bodyId,prefix,shifts={}){
    const tbody=document.getElementById(bodyId); if(!tbody) return;
    tbody.innerHTML=DAY_NAMES.map((name,i)=>{
        const d=i+1;
        return `<tr>
            <td>Day ${d} <small style="color:var(--text-muted);">${name}</small></td>
            <td><input type="number" id="${prefix}s1d${d}" class="shift-input" min="0" value="${shifts[`s1d${d}`]??0}" oninput="recalcTotal('${prefix}')"></td>
            <td><input type="number" id="${prefix}s2d${d}" class="shift-input" min="0" value="${shifts[`s2d${d}`]??0}" oninput="recalcTotal('${prefix}')"></td>
            <td><input type="number" id="${prefix}s3d${d}" class="shift-input" min="0" value="${shifts[`s3d${d}`]??0}" oninput="recalcTotal('${prefix}')"></td>
        </tr>`;
    }).join("");
}

function recalcTotal(prefix){
    let total=0;
    for(let d=1;d<=7;d++) for(let s=1;s<=3;s++){ const el=document.getElementById(`${prefix}s${s}d${d}`); if(el) total+=parseInt(el.value)||0; }
    const liveEl=prefix==="f-"?document.getElementById("liveTotal"):document.getElementById("editLiveTotal");
    if(liveEl) liveEl.textContent=total.toLocaleString();
    return total;
}

function getShiftValues(prefix){
    const shifts={};
    for(let d=1;d<=7;d++) for(let s=1;s<=3;s++){ const el=document.getElementById(`${prefix}s${s}d${d}`); shifts[`s${s}d${d}`]=el?(parseInt(el.value)||0):0; }
    return shifts;
}

function initSkuAutocomplete(){
    const input=document.getElementById("f-sku"), list=document.getElementById("skuList"), dropBtn=document.getElementById("skuDropBtn");
    if(!input||!list) return;
    const teamSku=SKU_MASTER.filter(s=>s.team==="A"&&s.line==="Line 1");
    function renderList(items){
        if(!items.length){list.style.display="none";return;}
        list.innerHTML=items.map(s=>`<li onclick="selectSku('${s.sku}')">${s.sku} — ${s.desc}</li>`).join("");
        list.style.display="block";
    }
    input.addEventListener("input",()=>{ const q=input.value.toLowerCase(); renderList(q?teamSku.filter(s=>s.sku.toLowerCase().includes(q)||s.desc.toLowerCase().includes(q)):teamSku); });
    dropBtn.addEventListener("click",()=>{ if(list.style.display==="block"){list.style.display="none";}else renderList(teamSku); });
    document.addEventListener("click",e=>{ if(!input.contains(e.target)&&!dropBtn.contains(e.target)) list.style.display="none"; });
}

function selectSku(skuCode){
    const s=SKU_MASTER.find(x=>x.sku===skuCode); if(!s) return;
    document.getElementById("f-sku").value=s.sku;
    document.getElementById("f-desc").value=s.desc;
    document.getElementById("f-uom").value=s.uom;
    document.getElementById("skuList").style.display="none";
    checkDuplicate(); validateForm();
}

function initOpsDays(){
    const startEl=document.getElementById("f-ops-start"), endEl=document.getElementById("f-ops-end");
    if(!startEl||!endEl) return;
    startEl.addEventListener("change",()=>{
        const d=new Date(startEl.value); if(isNaN(d)) return;
        const dow=d.getDay(); const diff=dow===0?-6:1-dow; d.setDate(d.getDate()+diff);
        startEl.value=d.toISOString().split("T")[0];
        const end=new Date(d); end.setDate(end.getDate()+6);
        endEl.value=end.toISOString().split("T")[0];
        document.getElementById("shiftSection").classList.remove("hidden");
        buildShiftRows("shiftTableBody","f-");
        checkDuplicate(); validateForm();
    });
}

function checkDuplicate(){
    const sku=document.getElementById("f-sku").value, start=document.getElementById("f-ops-start").value, end=document.getElementById("f-ops-end").value;
    const warn=document.getElementById("dupWarning");
    if(!sku||!start||!end){warn.classList.add("hidden");return;}
    const dup=records.find(r=>r.sku===sku&&r.opsStart===start&&r.opsEnd===end);
    warn.classList.toggle("hidden",!dup);
}

function validateForm(){
    const sku=document.getElementById("f-sku").value.trim(), start=document.getElementById("f-ops-start").value, end=document.getElementById("f-ops-end").value;
    const hasDup=!document.getElementById("dupWarning").classList.contains("hidden");
    document.getElementById("submitBtn").disabled=!(sku&&start&&end&&!hasDup);
}

function resetForm(){
    document.getElementById("productionForm").reset();
    document.getElementById("f-ops-end").value="";
    document.getElementById("shiftSection").classList.add("hidden");
    document.getElementById("liveTotal").textContent="0";
    document.getElementById("dupWarning").classList.add("hidden");
    document.getElementById("submitBtn").disabled=true;
    document.getElementById("formAlert").classList.add("hidden");
}

function initFormSubmit(){
    document.getElementById("productionForm").addEventListener("submit",e=>{
        e.preventDefault();
        const sku=document.getElementById("f-sku").value.trim(), month=document.getElementById("f-month").value;
        const year=parseInt(document.getElementById("f-year").value), qty=parseInt(document.getElementById("f-qty").value)||0;
        const uom=document.getElementById("f-uom").value, desc=document.getElementById("f-desc").value;
        const start=document.getElementById("f-ops-start").value, end=document.getElementById("f-ops-end").value;
        const shifts=getShiftValues("f-"), cum=Object.values(shifts).reduce((a,b)=>a+b,0);
        records.push({id:nextId++,team:"A",month,year,line:"Line 1",sku,desc,qty,uom,cum,opsStart:start,opsEnd:end,shifts});
        saveRecords(records);
        const alert=document.getElementById("formAlert");
        alert.textContent="Record successfully added."; alert.className="alert alert-success"; alert.classList.remove("hidden");
        resetForm(); setTimeout(()=>alert.classList.add("hidden"),4000);
    });
}

// ── Edit modal ────────────────────────────────────────────────────────────
function openEditModal(){
    if(!selectedId) return;
    const r=records.find(x=>x.id===selectedId); if(!r) return;
    document.getElementById("edit-id").value=r.id;
    document.getElementById("edit-team").value=r.team;
    document.getElementById("edit-month").value=r.month;
    document.getElementById("edit-year").value=r.year;
    document.getElementById("edit-line").value=r.line;
    document.getElementById("edit-sku").value=r.sku;
    document.getElementById("edit-qty").value=r.qty;
    document.getElementById("edit-uom").value=r.uom;
    document.getElementById("edit-ops-start").value=r.opsStart;
    document.getElementById("edit-ops-end").value=r.opsEnd;
    buildShiftRows("editShiftBody","e-",r.shifts||{});
    recalcTotal("e-");
    document.querySelectorAll("#editShiftBody .shift-input").forEach(inp=>inp.addEventListener("input",()=>recalcTotal("e-")));
    document.getElementById("editModal").classList.add("open");
}
function closeEditModal(){ document.getElementById("editModal").classList.remove("open"); }
function saveEdit(){
    const id=parseInt(document.getElementById("edit-id").value), idx=records.findIndex(r=>r.id===id); if(idx===-1) return;
    const shifts=getShiftValues("e-"), cum=Object.values(shifts).reduce((a,b)=>a+b,0);
    records[idx]={...records[idx],month:document.getElementById("edit-month").value,year:parseInt(document.getElementById("edit-year").value),qty:parseInt(document.getElementById("edit-qty").value)||0,opsStart:document.getElementById("edit-ops-start").value,opsEnd:document.getElementById("edit-ops-end").value,cum,shifts};
    saveRecords(records); closeEditModal(); applyManageFilters(); selectedId=null; updateActionBtns();
    showToast("Record updated.","success");
}

// ── Delete ────────────────────────────────────────────────────────────────
function openDeleteModal(){ if(!selectedId) return; document.getElementById("deleteDlg").classList.add("open"); }
function closeDeleteModal(){ document.getElementById("deleteDlg").classList.remove("open"); }
function executeDelete(){
    records=records.filter(r=>r.id!==selectedId); saveRecords(records); selectedId=null;
    closeDeleteModal(); applyManageFilters(); updateActionBtns();
    showToast("Record deleted.","success");
}

// ── Init ──────────────────────────────────────────────────────────────────
let addFormInited = false;
function initAddForm(){
    if(addFormInited) return;
    addFormInited = true;
    initSkuAutocomplete();
    initOpsDays();
    initFormSubmit();
    const skuEl = document.getElementById("f-sku");
    if(skuEl) skuEl.addEventListener("input", validateForm);
}

document.addEventListener("DOMContentLoaded",()=>{
    initSidebar();
    const view=getView(); switchView(view);
});
