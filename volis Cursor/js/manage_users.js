/**
 * manage_users.js
 * All manage_users interactions namespaced under ManageUsers to avoid
 * polluting the global scope and to prevent name collisions.
 */
var ManageUsers = (function () {

    // ── pending state for approve/reject modals (Fix 10) ──────────
    var _pendingUserId   = null;
    var _pendingUsername = null;

    // ── View switching ─────────────────────────────────────────────
    function showAddUserForm() {
        document.getElementById('addUserForm').style.display    = 'block';
        document.getElementById('approvalView').style.display   = 'none';
        document.getElementById('allUsersView').style.display   = 'none';
    }
    function showApprovalView() {
        document.getElementById('addUserForm').style.display    = 'none';
        document.getElementById('approvalView').style.display   = 'block';
        document.getElementById('allUsersView').style.display   = 'none';
    }
    function showAllUsersView() {
        document.getElementById('addUserForm').style.display    = 'none';
        document.getElementById('approvalView').style.display   = 'none';
        document.getElementById('allUsersView').style.display   = 'block';
    }

    // ── Approval tabs ──────────────────────────────────────────────
    // Fix 5: accept event as explicit parameter — no bare global event
    function switchApprovalTab(event, tab) {
        document.querySelectorAll('.approval-tab').forEach(function (btn) {
            btn.classList.remove('active');
        });
        event.currentTarget.classList.add('active');
        document.querySelectorAll('.approval-section').forEach(function (sec) {
            sec.classList.remove('active');
        });
        document.getElementById('tab-' + tab).classList.add('active');
    }

    // ── Approve / Reject — modal-based (Fix 10) ────────────────────
    function openApproveModal(userId, username) {
        _pendingUserId   = userId;
        _pendingUsername = username;
        document.getElementById('approveUsername').textContent = username;
        document.getElementById('approveModal').classList.add('active');
    }
    function closeApproveModal() {
        document.getElementById('approveModal').classList.remove('active');
        _pendingUserId = _pendingUsername = null;
    }
    function confirmApprove() {
        if (!_pendingUserId) return;
        var formData = new FormData();
        formData.append('action',  'approve_user');
        formData.append('user_id', _pendingUserId);
        fetch('api/api_approval.php', { method: 'POST', body: formData })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                closeApproveModal();
                _showToast(data.message, data.success ? 'success' : 'error');
                if (data.success) setTimeout(function () { location.reload(); }, 1200);
            })
            .catch(function () { _showToast('Request failed. Please try again.', 'error'); });
    }

    function openRejectModal(userId, username) {
        _pendingUserId   = userId;
        _pendingUsername = username;
        document.getElementById('rejectUsername').textContent = username;
        document.getElementById('rejectModal').classList.add('active');
    }
    function closeRejectModal() {
        document.getElementById('rejectModal').classList.remove('active');
        _pendingUserId = _pendingUsername = null;
    }
    function confirmReject() {
        if (!_pendingUserId) return;
        var formData = new FormData();
        formData.append('action',  'reject_user');
        formData.append('user_id', _pendingUserId);
        fetch('api/api_approval.php', { method: 'POST', body: formData })
            .then(function (r) { return r.json(); })
            .then(function (data) {
                closeRejectModal();
                _showToast(data.message, data.success ? 'success' : 'error');
                if (data.success) setTimeout(function () { location.reload(); }, 1200);
            })
            .catch(function () { _showToast('Request failed. Please try again.', 'error'); });
    }

    // ── Add User Form — dynamic dropdowns (Fix 7b) ─────────────────
    function onAddRoleChange(sel) {
        var teamGroup = document.getElementById('addTeamGroup');
        var lineGroup = document.getElementById('addLineGroup');
        var teamSel   = document.getElementById('addUserTeam');
        var lineSel   = document.getElementById('addUserLine');
        if (sel.value === 'data_entry') {
            teamGroup.style.display = 'block';
        } else {
            teamGroup.style.display = 'none';
            lineGroup.style.display = 'none';
            teamSel.value = '';
            lineSel.innerHTML = '<option value="">-- Select Line --</option>';
        }
    }

    function onAddTeamChange(sel) {
        var lineGroup = document.getElementById('addLineGroup');
        var lineSel   = document.getElementById('addUserLine');
        var team      = sel.value;
        if (['A','B','C'].indexOf(team) !== -1) {
            lineGroup.style.display = 'block';
            _populateLineDropdown(lineSel, team, '');
        } else {
            lineGroup.style.display = 'none';
            lineSel.innerHTML = '<option value="">-- Select Line --</option>';
        }
    }

    // ── Edit Modal ──────────────────────────────────────────────────
    function openEditModal(id, username, role, team, line) {
        document.getElementById('editUserId').value   = id;
        document.getElementById('editUsername').value = username;
        document.getElementById('editRole').value     = role;
        document.getElementById('editPw').value       = '';
        _setEditTeamLine(role, team || '', line || '');
        document.getElementById('editModal').classList.add('active');
    }
    function closeEditModal() {
        document.getElementById('editModal').classList.remove('active');
    }
    function onEditRoleChange(sel) {
        _setEditTeamLine(sel.value, '', '');
    }
    function onEditTeamChange(sel) {
        var lineSel = document.getElementById('editLine');
        var team    = sel.value;
        if (['A','B','C'].indexOf(team) !== -1) {
            _populateLineDropdown(lineSel, team, '');
        } else {
            lineSel.innerHTML = '<option value="">-- Select Line --</option>';
        }
    }
    function _setEditTeamLine(role, team, line) {
        var teamRow = document.getElementById('editTeamRow');
        var teamSel = document.getElementById('editTeam');
        var lineSel = document.getElementById('editLine');
        if (role === 'data_entry') {
            teamRow.style.display = 'flex';
            teamSel.value = team;
            if (['A','B','C'].indexOf(team) !== -1) {
                _populateLineDropdown(lineSel, team, line);
            } else {
                lineSel.innerHTML = '<option value="">-- Select Line --</option>';
            }
        } else {
            teamRow.style.display = 'none';
            teamSel.value = '';
            lineSel.innerHTML = '<option value="">-- Select Line --</option>';
        }
    }

    // ── Delete Modal ────────────────────────────────────────────────
    function openDeleteModal(id, username) {
        document.getElementById('deleteUserId').value         = id;
        document.getElementById('deleteUsername').textContent = username;
        document.getElementById('deleteModal').classList.add('active');
    }
    function closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
    }

    // ── Line dropdown helper ────────────────────────────────────────
    function _populateLineDropdown(selectEl, team, selectedLine) {
        selectEl.innerHTML = '<option value="">-- Select Line --</option>';
        var lines = (typeof linesByTeamEdit !== 'undefined' && linesByTeamEdit[team]) ? linesByTeamEdit[team] : [];
        lines.forEach(function (line) {
            var opt         = document.createElement('option');
            opt.value       = line;
            opt.textContent = line;
            if (selectedLine && line === selectedLine) opt.selected = true;
            selectEl.appendChild(opt);
        });
    }

    // ── Search filter ───────────────────────────────────────────────
    function filterTable() {
        var q = (document.getElementById('userSearch') || {value:''}).value.toLowerCase();
        document.querySelectorAll('#userTable tbody tr').forEach(function (row) {
            var u = row.querySelector('.mu-username');
            if (!u) return;
            row.style.display = u.textContent.toLowerCase().includes(q) ? '' : 'none';
        });
    }

    // ── Password toggle ─────────────────────────────────────────────
    function togglePw(id, btn) {
        var inp = document.getElementById(id);
        if (!inp) return;
        inp.type = inp.type === 'password' ? 'text' : 'password';
        btn.querySelector('i').className = inp.type === 'text' ? 'fa fa-eye-slash' : 'fa fa-eye';
    }

    // ── Toast (Fix 10: replaces alert()) ───────────────────────────
    function _showToast(message, type) {
        var existing = document.getElementById('mu-toast');
        if (existing) existing.remove();
        var toast         = document.createElement('div');
        toast.id          = 'mu-toast';
        toast.textContent = message;
        toast.style.cssText = [
            'position:fixed','bottom:28px','right:28px','z-index:9999',
            'padding:14px 22px','border-radius:12px','font-size:14px',
            'font-weight:600','color:#fff','box-shadow:0 8px 24px rgba(0,0,0,0.15)',
            'transition:opacity 0.4s ease',
            'background:' + (type === 'success' ? '#10b981' : '#ef4444')
        ].join(';');
        document.body.appendChild(toast);
        setTimeout(function () { toast.style.opacity = '0'; }, 2800);
        setTimeout(function () { toast.remove(); }, 3200);
    }

    // ── Logout ──────────────────────────────────────────────────────
    function openLogoutModal()  { document.getElementById('logoutModal').style.display = 'flex'; }
    function closeLogoutModal() { document.getElementById('logoutModal').style.display = 'none'; }
    function confirmLogout()    { document.getElementById('logoutForm').submit(); }

    // ── Public API ──────────────────────────────────────────────────
    return {
        showAddUserForm  : showAddUserForm,
        showApprovalView : showApprovalView,
        showAllUsersView : showAllUsersView,
        switchApprovalTab: switchApprovalTab,
        openApproveModal : openApproveModal,
        closeApproveModal: closeApproveModal,
        confirmApprove   : confirmApprove,
        openRejectModal  : openRejectModal,
        closeRejectModal : closeRejectModal,
        confirmReject    : confirmReject,
        onAddRoleChange  : onAddRoleChange,
        onAddTeamChange  : onAddTeamChange,
        openEditModal    : openEditModal,
        closeEditModal   : closeEditModal,
        onEditRoleChange : onEditRoleChange,
        onEditTeamChange : onEditTeamChange,
        openDeleteModal  : openDeleteModal,
        closeDeleteModal : closeDeleteModal,
        filterTable      : filterTable,
        togglePw         : togglePw,
        openLogoutModal  : openLogoutModal,
        closeLogoutModal : closeLogoutModal,
        confirmLogout    : confirmLogout,
    };
})();

// ── Backward-compat globals for shared header onclick attrs ────────
function openLogoutModal()  { ManageUsers.openLogoutModal(); }
function closeLogoutModal() { ManageUsers.closeLogoutModal(); }
function confirmLogout()    { ManageUsers.confirmLogout(); }
function togglePw(id, btn)  { ManageUsers.togglePw(id, btn); }
function filterTable()      { ManageUsers.filterTable(); }