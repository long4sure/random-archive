/* ═══════════════════════════════════════════════════════════════
   add_edit.js  —  Manage Production Records (Central Edit Modal)
   Replaces side panel with a standard centred modal.
   Functions: table row selection, edit modal open/close/update/delete,
   toolbar delete, export, filter helpers.
   ═══════════════════════════════════════════════════════════════ */

(function () {
'use strict';

// ── Line filter <select> (filter bar) ───────────────────────────
const lineSelect        = document.getElementById('lineSelect');
const manageTableSelect = document.getElementById('manage_table');

function populateLineSelect(team) {
    if (!lineSelect) return;
    // Clear existing options except the "All Lines" placeholder
    lineSelect.innerHTML = '<option value="">All Lines</option>';
    if (!team) { lineSelect.disabled = true; return; }

    const linesByTeam = window.AE_linesByTeam || {};
    const teamKey     = team === 'a_summary_line' ? 'A'
                      : team === 'b_summary_line' ? 'B'
                      : team === 'c_summary_line' ? 'C' : team;
    const lines = linesByTeam[teamKey] || [];

    lines.forEach(line => {
        const opt = document.createElement('option');
        opt.value       = line;
        opt.textContent = line;
        if (window.AE_selectedLine && window.AE_selectedLine === line) {
            opt.selected = true;
        }
        lineSelect.appendChild(opt);
    });
    lineSelect.disabled = false;
}

// Populate on page load if a team is already selected
if (manageTableSelect && manageTableSelect.value) {
    populateLineSelect(manageTableSelect.value);
}

// Re-populate when team changes — reset line selection
if (manageTableSelect) {
    manageTableSelect.addEventListener('change', function () {
        if (lineSelect) lineSelect.value = '';
        populateLineSelect(this.value);
    });
}

// ── Days dropdown ───────────────────────────────────────────────
const daysToggleBtn  = document.getElementById('daysToggleBtn');
const daysDropdown   = document.getElementById('daysDropdownContent');
const selectAllDays  = document.getElementById('selectAllDays');

if (daysToggleBtn && daysDropdown) {
    daysToggleBtn.addEventListener('click', e => {
        e.stopPropagation();
        daysDropdown.style.display = daysDropdown.style.display === 'block' ? 'none' : 'block';
    });
    daysDropdown.addEventListener('click', e => e.stopPropagation());
    document.addEventListener('click', e => {
        if (!daysDropdown.contains(e.target) && e.target !== daysToggleBtn && !daysToggleBtn.contains(e.target)) {
            daysDropdown.style.display = 'none';
        }
    });
}
if (selectAllDays) {
    selectAllDays.addEventListener('change', function () {
        document.querySelectorAll('.day-checkbox').forEach(cb => cb.checked = this.checked);
    });
}

// ── Export ──────────────────────────────────────────────────────
function exportToExcel() {
    const form   = document.getElementById('filterForm');
    const params = new URLSearchParams(new FormData(form));
    params.append('export', 'excel');
    window.location = '?' + params.toString();
}

// ── Row selection ───────────────────────────────────────────────
const editBtn   = document.getElementById('editRowBtn');
const deleteBtn = document.getElementById('deleteRowBtn');
let   selectedRow = null;

function clearSelection() {
    if (selectedRow) { selectedRow.classList.remove('selected'); selectedRow = null; }
    if (editBtn)   editBtn.disabled   = true;
    if (deleteBtn) deleteBtn.disabled = true;
}

function attachRowListeners() {
    // Viewers cannot select rows — edit/delete controls not rendered
    if (window.AE_isViewer) return;
    document.querySelectorAll('#manageTable tbody tr').forEach(row => {
        row.addEventListener('click', function () {
            clearSelection();
            selectedRow = this;
            selectedRow.classList.add('selected');
            if (editBtn)   editBtn.disabled   = false;
            if (deleteBtn) deleteBtn.disabled = false;
        });
    });
}
attachRowListeners();

document.addEventListener('click', e => {
    if (!e.target.closest('#manageTable') && !e.target.closest('.btn-edit') && !e.target.closest('.btn-delete')) {
        clearSelection();
    }
});

// ── Reset overflow on load in case bfcache restored a stale state ──
document.body.style.overflow = '';

// ═══════════════════════════════════════════════════════════════
// EDIT MODAL (central modal)
// ═══════════════════════════════════════════════════════════════
const editModal       = document.getElementById('editModal');
const modalTitle      = document.getElementById('editModalTitle');
const modalLineSelect = document.getElementById('modal_LINE_select');
const modalSkuSelect  = document.getElementById('modal_SKU_CODE');
const modalSkuDesc    = document.getElementById('modal_SKU_DESCRIPTION');
const modalUom        = document.getElementById('modal_UOM');
const modalLiveTotal  = document.getElementById('modalLiveTotal');

function resetModalForm() {
    const form = document.getElementById('editModalForm');
    if (!form) return;
    form.querySelectorAll('input:not([type="hidden"]), select').forEach(el => {
        if (el.tagName === 'SELECT') el.selectedIndex = 0;
        else el.value = '';
    });
    if (modalTitle) modalTitle.textContent = 'Edit Record';
    if (modalLiveTotal) modalLiveTotal.textContent = '0';
    const shiftContainer = document.getElementById('modalShiftFields');
    if (shiftContainer) shiftContainer.innerHTML = '';
}

function openEditModal() {
    if (!editModal) return;
    editModal.classList.add('active');
    document.body.style.overflow = 'hidden'; // lock background scroll
}

function closeEditModal() {
    if (!editModal) return;
    editModal.classList.remove('active');
    document.body.style.overflow = '';
    clearSelection();
    resetModalForm();
}

// ── Fix D: Monday/Sunday snap + future-day re-lock on modal date change ────
function _snapModalDates() {
    const startEl = document.getElementById('modal_OPERATING_DAYS_START');
    const endEl   = document.getElementById('modal_OPERATING_DAYS_END');
    const fmt = dt =>
        dt.getFullYear()
        + '-' + String(dt.getMonth() + 1).padStart(2, '0')
        + '-' + String(dt.getDate()).padStart(2, '0');

    if (startEl && startEl.value) {
        const d   = new Date(startEl.value + 'T00:00:00');
        const dow = d.getDay();
        d.setDate(d.getDate() - ((dow + 6) % 7)); // snap to Monday
        startEl.value = fmt(d);
        if (endEl) {
            const sun = new Date(d);
            sun.setDate(d.getDate() + 6);          // auto-set Sunday
            endEl.value = fmt(sun);
        }
    } else if (endEl && endEl.value) {
        const d   = new Date(endEl.value + 'T00:00:00');
        const dow = d.getDay();
        d.setDate(d.getDate() + (dow === 0 ? 0 : 7 - dow)); // snap to Sunday
        endEl.value = fmt(d);
    }
}

function _relockModalShiftFields() {
    const startEl = document.getElementById('modal_OPERATING_DAYS_START');
    if (!startEl || !startEl.value) return;
    const startDate     = new Date(startEl.value + 'T00:00:00');
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    document.querySelectorAll('#modalShiftFields .panel-shift-day-row').forEach((row, idx) => {
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + idx);
        const isFuture = dayDate > todayMidnight;
        row.querySelectorAll('input[type="number"]').forEach(inp => {
            if (isFuture) {
                inp.value    = '0';
                inp.readOnly = true;
                inp.classList.add('shift-input-locked');
            } else {
                inp.readOnly = false;
                inp.classList.remove('shift-input-locked');
            }
        });
    });
    recalcModalTotal();
}

// Attach listeners once after DOM ready
document.addEventListener('DOMContentLoaded', function () {
    const modalStartEl = document.getElementById('modal_OPERATING_DAYS_START');
    const modalEndEl   = document.getElementById('modal_OPERATING_DAYS_END');
    [modalStartEl, modalEndEl].forEach(function (el) {
        if (!el) return;
        el.addEventListener('change', function () {
            _snapModalDates();
            _relockModalShiftFields();
        });
    });
});

// Populate line dropdown in modal based on team
function populateModalLineDropdown(team) {
    if (!modalLineSelect) return;
    modalLineSelect.innerHTML = '<option value="">-- Select Line --</option>';
    if (team && window.AE_linesByTeam && window.AE_linesByTeam[team]) {
        window.AE_linesByTeam[team].forEach(line => {
            const opt = document.createElement('option');
            opt.value = line; opt.textContent = line;
            modalLineSelect.appendChild(opt);
        });
    }
}

// Filter SKU options in modal dropdown based on selected team/line
function filterModalSKUOptions() {
    if (!modalSkuSelect) return;
    const team = document.getElementById('modal_TEAM')?.value;
    const line = modalLineSelect?.value;
    const opts = modalSkuSelect.querySelectorAll('option');
    let firstValid = null;
    opts.forEach(opt => {
        if (!opt.value) return;
        const show = (!team || opt.dataset.team === team) && (!line || opt.dataset.line === line);
        opt.style.display = show ? '' : 'none';
        if (show && !firstValid) firstValid = opt;
    });
    const sel = modalSkuSelect.selectedOptions[0];
    if (sel && sel.style.display === 'none') modalSkuSelect.value = firstValid ? firstValid.value : '';
    updateModalDescription();
}

function updateModalDescription() {
    if (!modalSkuSelect || !modalSkuDesc) return;
    const sel = modalSkuSelect.selectedOptions[0];
    modalSkuDesc.value = (sel && sel.dataset.desc) ? sel.dataset.desc : '';
}

// Live cumulative total in modal
function recalcModalTotal() {
    let sum = 0;
    document.querySelectorAll('#modalShiftFields input[type="number"]').forEach(inp => {
        const v = parseInt(inp.value, 10);
        if (!isNaN(v) && v > 0) sum += v;
    });
    if (modalLiveTotal) modalLiveTotal.textContent = sum.toLocaleString();
}

// ── Edit Selected Row (opens modal) ────────────────────────────
function editSelectedRow() {
    if (!selectedRow) return;
    const id    = selectedRow.dataset.id;
    const table = document.getElementById('modal_table')?.value || window.AE_manageTable;
    if (!id || !table) return;

    // Disable edit button to prevent multiple clicks
    const editBtn = document.getElementById('editRowBtn');
    if (editBtn) editBtn.disabled = true;

    if (modalTitle) modalTitle.textContent = 'Loading…';
    resetModalForm(); // Clear previous data
    openEditModal(); // Show modal immediately with loading state

    fetch(`api/api_get_record.php?id=${encodeURIComponent(id)}&table=${encodeURIComponent(table)}`)
        .then(r => r.json())
        .then(resp => {
            if (resp.status !== 'ok') {
                showToast('Could not load record: ' + (resp.message || 'Unknown error'), 'error');
                if (editBtn) editBtn.disabled = false;
                return;
            }
            const rec = resp; // flattened

            if (modalTitle) modalTitle.textContent = 'Edit Record #' + id;

            // Hidden ID
            document.getElementById('modal_id').value = id;

            // Scalar fields
            const scalarFields = ['TEAM','MONTH','YEAR','LINE','SKU_CODE','SKU_DESCRIPTION','QUANTITY','UOM','OPERATING_DAYS_START','OPERATING_DAYS_END'];
            scalarFields.forEach(f => {
                const el = document.getElementById('modal_' + f);
                if (!el) return;
                if (f === 'LINE') return; // handled via dropdown
                if (f === 'SKU_CODE') return; // handled via dropdown
                if (f === 'SKU_DESCRIPTION') return; // auto-filled
                if (f === 'UOM') return; // auto-set below
                el.value = rec[f] ?? '';
            });

            // UOM – prefer the record's own UOM, fallback based on table
            if (modalUom) {
                modalUom.value = rec['UOM'] || ((table === 'b_summary_line') ? 'PCS' : 'SET');
            }

            // Team → populate line dropdown → set line → filter SKU
            const team = rec['TEAM'] || '';
            populateModalLineDropdown(team);
            // Slight delay to ensure options are rendered
            setTimeout(() => {
                if (modalLineSelect) {
                    modalLineSelect.value = rec['LINE'] || '';
                    filterModalSKUOptions();
                    if (modalSkuSelect) {
                        modalSkuSelect.value = rec['SKU_CODE'] || '';
                        updateModalDescription();
                        // Fallback: if SKU code not found in options, retry after a bit
                        if (modalSkuSelect.value !== rec['SKU_CODE']) {
                            setTimeout(() => {
                                filterModalSKUOptions();
                                modalSkuSelect.value = rec['SKU_CODE'] || '';
                                updateModalDescription();
                            }, 150);
                        }
                    }
                }
            }, 50);

            // Shift fields — Fix C: lock inputs whose day date is in the future
            const shiftContainer = document.getElementById('modalShiftFields');
            if (shiftContainer) {
                shiftContainer.innerHTML = '';

                const opsStart      = rec['OPERATING_DAYS_START'] || '';
                const startDate     = opsStart ? new Date(opsStart + 'T00:00:00') : null;
                const todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);

                for (let d = 1; d <= 7; d++) {
                    const dayRow = document.createElement('div');
                    dayRow.className = 'panel-shift-day-row';

                    // Compute this day's actual calendar date (Day 1 = opsStart, Day 2 = opsStart+1, …)
                    let isFuture = false;
                    if (startDate) {
                        const dayDate = new Date(startDate);
                        dayDate.setDate(startDate.getDate() + (d - 1));
                        isFuture = dayDate > todayMidnight;
                    }

                    const lockedAttr = isFuture ? ' readonly class="panel-shift-input shift-input-locked"' : ' class="panel-shift-input"';
                    const lockedLabel = isFuture ? ' <span class="shift-future-badge">future</span>' : '';
                    dayRow.innerHTML = `<div class="panel-shift-day-label">Day ${d}${lockedLabel}</div>`;

                    for (let s = 1; s <= 3; s++) {
                        const suffix = s === 1 ? '1ST' : s === 2 ? '2ND' : '3RD';
                        const fname  = `${suffix}_SHIFT_DAY_${d}`;
                        const val    = isFuture ? 0 : (rec[fname] ?? 0);
                        const cell   = document.createElement('div');
                        cell.className = 'panel-shift-cell';
                        cell.innerHTML = `<label>${suffix.replace('ST','st').replace('ND','nd').replace('RD','rd')} Shift</label>
                            <input type="number" name="${fname}" id="modal_${fname}" value="${val}" min="0"${lockedAttr}>`;
                        dayRow.appendChild(cell);
                    }
                    shiftContainer.appendChild(dayRow);
                }
                // Clone to remove previous listeners, attach live total
                const fresh = shiftContainer.cloneNode(true);
                shiftContainer.parentNode.replaceChild(fresh, shiftContainer);
                fresh.addEventListener('input', recalcModalTotal);
                recalcModalTotal();
            }

            if (editBtn) editBtn.disabled = false;
        })
        .catch(err => {
            console.error(err);
            showToast('Network error loading record.', 'error');
            if (editBtn) editBtn.disabled = false;
        });
}

// ── Modal Update (AJAX) ─────────────────────────────────────────
function updateModalRecord() {
    const form     = document.getElementById('editModalForm');
    const formData = new FormData(form);
    formData.append('csrf_token', window.AE_csrfToken);
    formData.append('table',      window.AE_manageTable);

    const btn = document.getElementById('modalUpdateBtn');
    if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

    fetch('update_record.php', { method: 'POST', body: formData })
        .then(r => r.json())
        .then(resp => {
            if (resp.status === 'success') {
                closeEditModal();
                showToast(resp.message, 'success');
                setTimeout(() => location.reload(), 900);
            } else {
                showToast(resp.message || 'Update failed.', 'error');
            }
        })
        .catch(() => showToast('Network error. Please try again.', 'error'))
        .finally(() => { if (btn) { btn.disabled = false; btn.textContent = 'Update'; } });
}

// ── Modal Delete ───────────────────────────────────────────────
function deleteModalRecord() {
    const id    = document.getElementById('modal_id')?.value;
    const table = window.AE_manageTable;
    if (!id || !table) { showToast('No record selected.', 'error'); return; }
    if (!confirm('Are you sure you want to delete this record?')) return;

    fetch('delete_record.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'id=' + encodeURIComponent(id) + '&table=' + encodeURIComponent(table) + '&csrf_token=' + encodeURIComponent(window.AE_csrfToken)
    })
    .then(r => r.text())
    .then(msg => {
        closeEditModal();
        showToast(msg, 'success');
        setTimeout(() => location.reload(), 900);
    })
    .catch(() => showToast('Delete failed.', 'error'));
}

// ── Escape key closes modal ────────────────────────────────────
document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && editModal && editModal.classList.contains('active')) {
        closeEditModal();
    }
});

// ── Close modal when clicking the blurred overlay ─────────────
if (editModal) {
    editModal.addEventListener('click', function (e) {
        if (e.target === editModal) closeEditModal();
    });
}

// ── Toast notification ──────────────────────────────────────────
function showToast(message, type = 'success') {
    let toast = document.getElementById('ae-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'ae-toast';
        document.body.appendChild(toast);
    }
    toast.className = 'ae-toast ae-toast-' + type;
    toast.textContent = message;
    toast.classList.add('ae-toast-show');
    setTimeout(() => toast.classList.remove('ae-toast-show'), 3000);
}

// ── Delete confirm modal (toolbar) ──────────────────────────────
function confirmDeleteRow() {
    if (!selectedRow) return;
    document.getElementById('deleteConfirmModal').classList.add('active');
}
function closeDeleteModal() {
    document.getElementById('deleteConfirmModal').classList.remove('active');
}
function executeDelete() {
    closeDeleteModal();
    const id    = selectedRow?.dataset?.id;
    const table = window.AE_manageTable;
    if (!id || !table) return;
    fetch('delete_record.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'id=' + encodeURIComponent(id) + '&table=' + encodeURIComponent(table) + '&csrf_token=' + encodeURIComponent(window.AE_csrfToken)
    })
    .then(r => r.text())
    .then(msg => {
        closeEditModal(); // close edit modal if open
        showToast(msg, 'success');
        setTimeout(() => location.reload(), 900);
    })
    .catch(() => showToast('Delete failed.', 'error'));
}

// ── Logout modal ────────────────────────────────────────────────
function openLogoutModal()  { document.getElementById('logoutModal').style.display = 'flex'; }
function closeLogoutModal() { document.getElementById('logoutModal').style.display = 'none'; }
function confirmLogout()    { document.getElementById('logoutForm').submit(); }
const logoutModal = document.getElementById('logoutModal');
if (logoutModal) logoutModal.addEventListener('click', e => { if (e.target === logoutModal) closeLogoutModal(); });

// ── Expose onclick-called functions to global scope ──────────────
window.exportToExcel      = exportToExcel;
window.openLogoutModal    = openLogoutModal;
window.closeLogoutModal   = closeLogoutModal;
window.confirmLogout      = confirmLogout;

// Mutating functions — not exposed for viewers (modal + modals not rendered for them)
if (!window.AE_isViewer) {
    window.editSelectedRow   = editSelectedRow;
    window.closeEditModal    = closeEditModal;
    window.updateModalRecord = updateModalRecord;
    window.deleteModalRecord = deleteModalRecord;
    window.confirmDeleteRow  = confirmDeleteRow;
    window.closeDeleteModal  = closeDeleteModal;
    window.executeDelete     = executeDelete;
}

// ── Sidebar toggle (hamburger) ───────────────────────────────────
(function () {
    'use strict';

    const STORAGE_KEY  = 'ae_sidebar_collapsed';
    const MOBILE_BP    = 900; // px — must match CSS breakpoint

    const sidebar      = document.getElementById('appSidebar');
    const toggleBtn    = document.getElementById('sidebarToggleBtn');
    const closeBtn     = document.getElementById('sidebarCloseBtn');
    const overlay      = document.getElementById('sidebarOverlay');

    if (!sidebar || !toggleBtn) return;

    function isMobile() { return window.innerWidth < MOBILE_BP; }

    // ── Desktop: collapsed ↔ expanded ──────────────────────────
    function desktopCollapse() {
        sidebar.classList.add('sidebar-collapsed');
        toggleBtn.setAttribute('aria-expanded', 'false');
        localStorage.setItem(STORAGE_KEY, '1');
    }
    function desktopExpand() {
        sidebar.classList.remove('sidebar-collapsed');
        toggleBtn.setAttribute('aria-expanded', 'true');
        localStorage.setItem(STORAGE_KEY, '0');
    }

    // ── Mobile: slide in ↔ slide out ───────────────────────────
    function mobileOpen() {
        sidebar.classList.add('sidebar-open');
        if (overlay) { overlay.classList.add('active'); }
        document.body.classList.add('sidebar-open');
        toggleBtn.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }
    function mobileClose() {
        sidebar.classList.remove('sidebar-open');
        if (overlay) { overlay.classList.remove('active'); }
        document.body.classList.remove('sidebar-open');
        toggleBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    // ── Hamburger click ────────────────────────────────────────
    toggleBtn.addEventListener('click', function () {
        if (isMobile()) {
            sidebar.classList.contains('sidebar-open') ? mobileClose() : mobileOpen();
        } else {
            sidebar.classList.contains('sidebar-collapsed') ? desktopExpand() : desktopCollapse();
        }
    });

    // ── Close button inside sidebar (mobile) ───────────────────
    if (closeBtn) {
        closeBtn.addEventListener('click', mobileClose);
    }

    // ── Overlay click closes on mobile ─────────────────────────
    if (overlay) {
        overlay.addEventListener('click', mobileClose);
    }

    // ── Escape key closes sidebar ──────────────────────────────
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (isMobile() && sidebar.classList.contains('sidebar-open')) mobileClose();
        }
    });

    // ── Nav link click on mobile → auto close ─────────────────
    sidebar.querySelectorAll('a').forEach(function (link) {
        link.addEventListener('click', function () {
            if (isMobile()) mobileClose();
        });
    });

    // ── Resize: clean up stale states ─────────────────────────
    window.addEventListener('resize', function () {
        if (!isMobile()) {
            // Restore proper desktop state — remove mobile-open classes
            sidebar.classList.remove('sidebar-open');
            document.body.classList.remove('sidebar-open');
            if (overlay) overlay.classList.remove('active');
            document.body.style.overflow = '';
            // Restore desktop collapsed preference
            if (localStorage.getItem(STORAGE_KEY) === '1') {
                sidebar.classList.add('sidebar-collapsed');
                toggleBtn.setAttribute('aria-expanded', 'false');
            } else {
                sidebar.classList.remove('sidebar-collapsed');
                toggleBtn.setAttribute('aria-expanded', 'true');
            }
        }
    });

    // ── On load: restore desktop preference ───────────────────
    if (!isMobile() && localStorage.getItem(STORAGE_KEY) === '1') {
        sidebar.classList.add('sidebar-collapsed');
        toggleBtn.setAttribute('aria-expanded', 'false');
    }

})();

})();