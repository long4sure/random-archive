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

// ── Data ──────────────────────────────────────────────────────────────────
const LINES_BY_TEAM={A:["Line 1","Line 2"],B:["Line 3","Line 4"],C:["Line 5","Line 6"]};
const ROLE_LABELS={system_admin:"System Admin",admin:"Admin",data_entry:"Data Entry",viewer:"Viewer"};
const USERS_KEY="mu_users";

function loadUsers(){ try{ return JSON.parse(localStorage.getItem(USERS_KEY))||getDefaultUsers(); }catch{ return getDefaultUsers(); } }
function saveUsers(u){ localStorage.setItem(USERS_KEY,JSON.stringify(u)); }
function getDefaultUsers(){
    return [
        {id:1,firstName:"Alice", lastName:"Santos",  username:"alice.santos",  role:"system_admin",team:null,  line:null,    status:"approved",created:"2026-01-10"},
        {id:2,firstName:"Bob",   lastName:"Reyes",   username:"bob.reyes",     role:"admin",       team:null,  line:null,    status:"approved",created:"2026-02-14"},
        {id:3,firstName:"Carol", lastName:"Lim",     username:"carol.lim",     role:"data_entry",  team:"A",   line:"Line 1",status:"approved",created:"2026-03-05"},
        {id:4,firstName:"David", lastName:"Cruz",    username:"david.cruz",    role:"data_entry",  team:"B",   line:"Line 3",status:"approved",created:"2026-03-20"},
        {id:5,firstName:"Eve",   lastName:"Torres",  username:"eve.torres",    role:"viewer",      team:null,  line:null,    status:"approved",created:"2026-04-01"},
        {id:6,firstName:"Frank", lastName:"Garcia",  username:"frank.garcia",  role:"data_entry",  team:"C",   line:"Line 5",status:"pending", created:"2026-05-10"},
        {id:7,firstName:"Grace", lastName:"Mendoza", username:"grace.mendoza", role:"viewer",      team:null,  line:null,    status:"pending", created:"2026-05-18"},
        {id:8,firstName:"Henry", lastName:"Bautista",username:"henry.bautista",role:"data_entry",  team:"A",   line:"Line 2",status:"rejected",created:"2026-04-22"},
    ];
}

let users=loadUsers(), nextUserId=Math.max(...users.map(u=>u.id),0)+1, pendingActionId=null, currentTab="pending";

// ── Badges ────────────────────────────────────────────────────────────────
function rolePill(role){ return `<span class="role-pill ${role}">${ROLE_LABELS[role]||role}</span>`; }
function statusBadge(s){ return `<span class="status-badge status-${s}">${s.charAt(0).toUpperCase()+s.slice(1)}</span>`; }

// ── View switching ────────────────────────────────────────────────────────
const VIEW_TITLES={"approval":"User Approval","all-users":"All Users","add-user":"Add New User"};
const VIEW_SUBS={"approval":"Approval","all-users":"All Users","add-user":"Add User"};

function showView(view){
    ["approval","all-users","add-user"].forEach(v=>{
        document.getElementById(`${v}-view`)?.classList.add("hidden");
        document.getElementById(`btn-${v}`)?.classList.remove("active");
    });
    document.getElementById(`${view}-view`)?.classList.remove("hidden");
    document.getElementById(`btn-${view}`)?.classList.add("active");
    document.getElementById("topbarTitle").textContent=VIEW_TITLES[view]||"";
    document.getElementById("topbarSub").textContent=VIEW_SUBS[view]||"";
    if(view==="approval")  renderApprovalView();
    if(view==="all-users") renderAllUsers();
}

// ── Overview ──────────────────────────────────────────────────────────────
function renderOverview(){
    const counts={pending:0,approved:0,rejected:0};
    users.forEach(u=>counts[u.status]++);
    document.getElementById("overviewGrid").innerHTML=`
        <div class="card pending card-warn"><div class="card-title">Pending</div><div class="card-value mono">${counts.pending}</div></div>
        <div class="card approved card-ok"><div class="card-title">Approved</div><div class="card-value mono">${counts.approved}</div></div>
        <div class="card rejected card-bad"><div class="card-title">Rejected</div><div class="card-value mono">${counts.rejected}</div></div>
        <div class="card total card-info"><div class="card-title">Total Users</div><div class="card-value mono">${users.length}</div></div>
    `;
    ["pending","approved","rejected"].forEach(s=>{ const el=document.getElementById(`badge-${s}`); if(el) el.textContent=counts[s]; });
    const allBadge=document.getElementById("badge-all"); if(allBadge) allBadge.textContent=users.length;
    const navBadge=document.getElementById("navBadge"); if(navBadge) navBadge.textContent=counts.pending;
}

// ── Approval view ─────────────────────────────────────────────────────────
function renderApprovalView(){ renderOverview(); renderTabTable(currentTab); }

function switchTab(tab,btn){
    currentTab=tab;
    document.querySelectorAll(".sa-tab").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    renderTabTable(tab);
}

function renderTabTable(tab){
    const filtered=tab==="all"?users:users.filter(u=>u.status===tab);
    const wrap=document.getElementById("approvalTableWrap");
    if(!filtered.length){ wrap.innerHTML=`<div class="empty-state"><span class="empty-state-icon">👥</span><div class="empty-state-title">No users in this category.</div></div>`; return; }
    const rows=filtered.map(u=>{
        let actions="";
        if(u.status==="pending"||u.status==="rejected") actions+=`<button class="sa-action-btn sa-action-approve" onclick="openApproveModal(${u.id})">✓ Approve</button>`;
        if(u.status==="pending") actions+=`<button class="sa-action-btn sa-action-reject" onclick="openRejectModal(${u.id})">✕ Reject</button>`;
        if(u.status!=="pending"){ actions+=`<button class="sa-action-btn sa-action-edit" onclick="openEditModal(${u.id})">✎ Edit</button>`; actions+=`<button class="sa-action-btn sa-action-delete" onclick="openDeleteModal(${u.id})">✕ Delete</button>`; }
        return `<tr><td>${u.firstName}</td><td>${u.lastName}</td><td><strong>${u.username}</strong></td><td>${rolePill(u.role)}</td><td>${statusBadge(u.status)}</td><td>${u.created}</td><td style="white-space:nowrap;">${actions}</td></tr>`;
    }).join("");
    wrap.innerHTML=`<div class="table-scroll"><table><thead><tr><th>First Name</th><th>Last Name</th><th>Username</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ── All users ─────────────────────────────────────────────────────────────
function renderAllUsers(){
    const q=(document.getElementById("userSearch")?.value||"").toLowerCase();
    const filtered=users.filter(u=>!q||u.username.toLowerCase().includes(q)||u.firstName.toLowerCase().includes(q)||u.lastName.toLowerCase().includes(q));
    const wrap=document.getElementById("allUsersTableWrap");
    if(!filtered.length){ wrap.innerHTML=`<div class="empty-state"><span class="empty-state-icon">👥</span><div class="empty-state-title">No users found.</div></div>`; return; }
    const rows=filtered.map(u=>`<tr><td>${u.firstName}</td><td>${u.lastName}</td><td><strong>${u.username}</strong></td><td>${rolePill(u.role)}</td><td>${statusBadge(u.status)}</td><td>${u.created}</td><td style="white-space:nowrap;"><button class="sa-action-btn sa-action-edit" onclick="openEditModal(${u.id})">✎ Edit</button><button class="sa-action-btn sa-action-delete" onclick="openDeleteModal(${u.id})">✕ Delete</button></td></tr>`).join("");
    wrap.innerHTML=`<div class="table-scroll"><table><thead><tr><th>First Name</th><th>Last Name</th><th>Username</th><th>Role</th><th>Status</th><th>Created</th><th>Actions</th></tr></thead><tbody>${rows}</tbody></table></div>`;
}

// ── Add user ──────────────────────────────────────────────────────────────
function onRoleChange(){ const r=document.getElementById("au-role").value, isDE=r==="data_entry"; document.getElementById("au-team-group").classList.toggle("hidden",!isDE); document.getElementById("au-line-group").classList.toggle("hidden",!isDE); if(!isDE){document.getElementById("au-team").value="";document.getElementById("au-line").innerHTML='<option value="">— Select Line —</option>';} }
function onTeamChange(){ const t=document.getElementById("au-team").value, ls=document.getElementById("au-line"), lines=LINES_BY_TEAM[t]||[]; ls.innerHTML='<option value="">— Select Line —</option>'+lines.map(l=>`<option value="${l}">${l}</option>`).join(""); }
function submitAddUser(e){
    e.preventDefault();
    const first=document.getElementById("au-first").value.trim(), last=document.getElementById("au-last").value.trim();
    const username=document.getElementById("au-username").value.trim(), role=document.getElementById("au-role").value;
    const team=document.getElementById("au-team")?.value||null, line=document.getElementById("au-line")?.value||null;
    const alertEl=document.getElementById("addUserAlert");
    if(users.find(u=>u.username===username)){ alertEl.textContent=`Username "${username}" is already taken.`; alertEl.className="alert alert-error"; alertEl.classList.remove("hidden"); return; }
    users.push({id:nextUserId++,firstName:first,lastName:last,username,role,team,line,status:"pending",created:new Date().toISOString().split("T")[0]});
    saveUsers(users);
    alertEl.textContent=`User "${username}" created. Pending approval.`; alertEl.className="alert alert-success"; alertEl.classList.remove("hidden");
    document.getElementById("addUserForm").reset(); onRoleChange(); renderOverview();
    setTimeout(()=>{ alertEl.classList.add("hidden"); showView("approval"); },2000);
}

// ── Edit modal ────────────────────────────────────────────────────────────
function openEditModal(id){
    const u=users.find(x=>x.id===id); if(!u) return;
    pendingActionId=id;
    document.getElementById("edit-uid").value=id;
    document.getElementById("edit-username").value=u.username;
    document.getElementById("edit-role").value=u.role;
    document.getElementById("edit-password").value="";
    onEditRoleChange();
    if(u.role==="data_entry"){ document.getElementById("edit-team").value=u.team||""; onEditTeamChange(); document.getElementById("edit-line").value=u.line||""; }
    document.getElementById("editModal").classList.add("open");
}
function closeEditModal(){ document.getElementById("editModal").classList.remove("open"); pendingActionId=null; }
function onEditRoleChange(){ const r=document.getElementById("edit-role").value; document.getElementById("edit-team-row").classList.toggle("hidden",r!=="data_entry"); }
function onEditTeamChange(){ const t=document.getElementById("edit-team").value, ls=document.getElementById("edit-line"), lines=LINES_BY_TEAM[t]||[]; ls.innerHTML='<option value="">— Select Line —</option>'+lines.map(l=>`<option value="${l}">${l}</option>`).join(""); }
function saveEditUser(){
    const id=parseInt(document.getElementById("edit-uid").value), idx=users.findIndex(u=>u.id===id); if(idx===-1) return;
    const role=document.getElementById("edit-role").value;
    users[idx].role=role;
    users[idx].team=role==="data_entry"?(document.getElementById("edit-team").value||null):null;
    users[idx].line=role==="data_entry"?(document.getElementById("edit-line").value||null):null;
    saveUsers(users); closeEditModal(); renderApprovalView(); renderAllUsers();
    showToast("User updated.","success");
}

// ── Delete ────────────────────────────────────────────────────────────────
function openDeleteModal(id){ pendingActionId=id; const u=users.find(x=>x.id===id); document.getElementById("deleteUsername").textContent=u?.username||""; document.getElementById("deleteDlg").classList.add("open"); }
function closeDeleteModal(){ document.getElementById("deleteDlg").classList.remove("open"); pendingActionId=null; }
function confirmDelete(){ users=users.filter(u=>u.id!==pendingActionId); saveUsers(users); closeDeleteModal(); renderApprovalView(); renderAllUsers(); showToast("User deleted.","success"); }

// ── Approve / Reject ──────────────────────────────────────────────────────
function openApproveModal(id){ pendingActionId=id; const u=users.find(x=>x.id===id); document.getElementById("approveUsername").textContent=u?.username||""; document.getElementById("approveDlg").classList.add("open"); }
function closeApproveModal(){ document.getElementById("approveDlg").classList.remove("open"); pendingActionId=null; }
function confirmApprove(){ const idx=users.findIndex(u=>u.id===pendingActionId); if(idx!==-1){users[idx].status="approved";saveUsers(users);} closeApproveModal(); renderApprovalView(); showToast("User approved.","success"); }

function openRejectModal(id){ pendingActionId=id; const u=users.find(x=>x.id===id); document.getElementById("rejectUsername").textContent=u?.username||""; document.getElementById("rejectDlg").classList.add("open"); }
function closeRejectModal(){ document.getElementById("rejectDlg").classList.remove("open"); pendingActionId=null; }
function confirmReject(){ const idx=users.findIndex(u=>u.id===pendingActionId); if(idx!==-1){users[idx].status="rejected";saveUsers(users);} closeRejectModal(); renderApprovalView(); showToast("User rejected.","success"); }

// ── Password toggle ───────────────────────────────────────────────────────
function togglePw(id,btn){ const el=document.getElementById(id); if(!el) return; const isPass=el.type==="password"; el.type=isPass?"text":"password"; btn.style.opacity=isPass?"0.5":"1"; }

// ── Init ──────────────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded",()=>{ initSidebar(); showView("approval"); });
