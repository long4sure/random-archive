// ── Logout modal ─────────────────────────────────────────────
function openLogoutModal() { document.getElementById('logoutModal').style.display = 'flex'; }
function closeLogoutModal() { document.getElementById('logoutModal').style.display = 'none'; }
function confirmLogout() { document.getElementById('logoutForm').submit(); }
document.addEventListener('DOMContentLoaded', function() {
    var logoutModal = document.getElementById('logoutModal');
    if (logoutModal) logoutModal.addEventListener('click', function(e) { if (e.target === this) closeLogoutModal(); });
});

// ── Dropdown helpers ─────────────────────────────────────────
function toggleLineDropdown(e) { e.stopPropagation(); document.getElementById('lineDropdownPanel').classList.toggle('open'); }
function toggleAllLinesF(cb) { document.querySelectorAll('.line-checkbox-f').forEach(el => el.checked = cb.checked); }
document.addEventListener('click', function(e) {
    var btn = document.getElementById('lineDropdownBtn'), panel = document.getElementById('lineDropdownPanel');
    if (btn && panel && !btn.contains(e.target) && !panel.contains(e.target)) panel.classList.remove('open');
});

function toggleLineDropdown2(e) { e.stopPropagation(); document.getElementById('lineDropdownPanel2').classList.toggle('open'); }
function toggleAllLinesM(cb) { document.querySelectorAll('.line-checkbox-m').forEach(el => el.checked = cb.checked); }
document.addEventListener('click', function(e) {
    var btn = document.getElementById('lineDropdownBtn2'), panel = document.getElementById('lineDropdownPanel2');
    if (btn && panel && !btn.contains(e.target) && !panel.contains(e.target)) panel.classList.remove('open');
});

function toggleShiftDropdown(e) { e.stopPropagation(); document.getElementById('shiftDropdownPanel').classList.toggle('open'); }
function toggleAllShifts(cb) { document.querySelectorAll('.shift-checkbox').forEach(el => el.checked = cb.checked); }
function toggleShiftDropdown2(e) { e.stopPropagation(); document.getElementById('shiftDropdownPanel2').classList.toggle('open'); }
function toggleAllShifts2(cb) { document.querySelectorAll('.shift-checkbox2').forEach(el => el.checked = cb.checked); }
document.addEventListener('click', function(e) {
    ['shiftDropdownBtn','shiftDropdownPanel','shiftDropdownBtn2','shiftDropdownPanel2'].forEach(id => {
        var el = document.getElementById(id);
        if (el && el.classList.contains('filter-dropdown-panel') && !el.contains(e.target) && e.target !== document.getElementById(id.replace('Panel','Btn'))) el.classList.remove('open');
    });
});

// ── Export table ─────────────────────────────────────────────
function exportTableToExcel(tableId, fileName) {
    var table = document.getElementById(tableId); if (!table) return;
    var html = table.outerHTML; var blob = new Blob([html], { type: 'application/vnd.ms-excel' });
    var link = document.createElement('a'); link.href = URL.createObjectURL(blob);
    link.download = fileName + '_' + (typeof exportDateStamp !== 'undefined' ? exportDateStamp : '') + '.xls';
    link.click();
}

// ── Prod. Days change → constrain date input ────────────────
function handleOpsDaysChange(select) {
    var val = select.value;
    var dateInput = document.getElementById('asOfDateInput') || document.getElementById('asOfDateInput2');
    if (!dateInput) return;
    if (!val) {
        dateInput.min = ''; dateInput.max = ''; dateInput.disabled = true;
    } else {
        var parts = val.split('|');
        if (parts.length === 2) {
            dateInput.min = parts[0]; dateInput.max = parts[1];
            dateInput.disabled = false;
            var today = new Date().toISOString().slice(0,10);
            if (today >= parts[0] && today <= parts[1]) dateInput.value = today;
            else dateInput.value = parts[0];
        }
    }
    dateInput.form.submit();
}

// ── LIPAS button visibility ─────────────────────────────────
function toggleLipasBtn() {
    var dateVal = (document.getElementById('asOfDateInput') || document.getElementById('asOfDateInput2')).value;
    var btn = document.querySelector('.btn-add-lipas');
    if (!btn) return;
    if (!dateVal) { btn.style.display = 'none'; return; }
    var day = new Date(dateVal + 'T00:00:00').getDay();
    btn.style.display = (day === 0 || day === 6) ? 'inline-flex' : 'none';
}
document.addEventListener('DOMContentLoaded', function() {
    var dateInput = document.getElementById('asOfDateInput') || document.getElementById('asOfDateInput2');
    if (dateInput) dateInput.addEventListener('change', toggleLipasBtn);
    toggleLipasBtn();
});

// ── Save All Days to Report Line ────────────────────────────
function getDatesInRange(startStr, endStr) {
    var dates = [];
    var start = new Date(startStr + 'T00:00:00');
    var end = new Date(endStr + 'T00:00:00');
    for (var d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        dates.push(d.toISOString().slice(0,10));
    }
    return dates;
}

function saveAllDaysToReportLine() {
    var ops = document.getElementById('opsDaysSelect')?.value;
    if (!ops) { alert('Please select a Prod. Days range first.'); return; }
    var parts = ops.split('|');
    if (parts.length !== 2) { alert('Invalid Prod. Days format.'); return; }
    var dates = getDatesInRange(parts[0], parts[1]);

    var checkedShifts = document.querySelectorAll('.shift-checkbox:checked');
    if (checkedShifts.length === 0) { alert('Please select at least one shift.'); return; }
    var shifts = Array.from(checkedShifts).map(cb => cb.value);

    var checkedLines = document.querySelectorAll('.line-checkbox-f:checked');
    if (checkedLines.length === 0) { alert('Please select at least one line.'); return; }
    var lines = Array.from(checkedLines).map(cb => cb.value);

    var baseData = {
        team: manageReportData.filterTeam || '', year: manageReportData.filterYear || '',
        month: manageReportData.filterMonth || '', ops_days: ops
    };
    if (!baseData.team || !baseData.month) { alert('Please select Team and Month before saving.'); return; }

    var anyDuplicate = false;
    var promises = [];
    shifts.forEach(function(shift) {
        dates.forEach(function(date) {
            var shiftData = Object.assign({}, baseData, { shift: shift, as_of_date: date });
            var formData = new URLSearchParams(shiftData);
            lines.forEach(l => formData.append('line[]', l));
            formData.append('csrf_token', csrfToken);
            var p = fetch('api/api_save.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData })
                .then(res => res.json())
                .then(response => { if (response.status === 'duplicate') anyDuplicate = true; else if (response.status !== 'success') alert(response.message || 'Error'); });
            promises.push(p);
        });
    });

    Promise.all(promises).then(function() {
        if (anyDuplicate) {
            document.getElementById('confirmModal').classList.add('active');
            window.reportSaveAllData = { baseData, shifts, lines, dates };
        } else {
            alert('All selected shift reports saved successfully.');
        }
    }).catch(err => alert('Error: ' + err));
}

function confirmSaveAllDays() {
    var info = window.reportSaveAllData; if (!info) return;
    var { baseData, shifts, lines, dates } = info;
    var promises = [];
    shifts.forEach(function(shift) {
        dates.forEach(function(date) {
            var shiftData = Object.assign({}, baseData, { shift: shift, confirm: 1, as_of_date: date });
            var formData = new URLSearchParams(shiftData);
            lines.forEach(l => formData.append('line[]', l));
            formData.append('csrf_token', csrfToken);
            var p = fetch('api/api_save.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData })
                .then(res => res.json())
                .then(response => { if (response.status !== 'success') alert(response.message || 'Failed'); });
            promises.push(p);
        });
    });
    Promise.all(promises).then(function() {
        closeConfirmModal();
        alert('All days updated.');
    }).catch(err => { closeConfirmModal(); alert('Error: ' + err); });
}

function closeConfirmModal() { document.getElementById('confirmModal').classList.remove('active'); }

// ── LIPAS VOLPAS Week Modal ─────────────────────────────────
function openLvWeekModal() {
    var params = new URLSearchParams(window.location.search);
    var team = params.get('team'), month = params.get('month'), year = params.get('year'), ops_days = params.get('ops_days');
    if (!team || !month || !year) { alert('Please select Team, Month, and Year first.'); return; }
    if (!ops_days) { alert('Please select a Prod. Days range first.'); return; }

    var checkedLines = document.querySelectorAll('.line-checkbox-f:checked');
    if (checkedLines.length === 0) { alert('Please select at least one line.'); return; }

    var promises = Array.from(checkedLines).map(function(cb) {
        var lineVal = cb.value;
        return fetch('api/api_get_lv_data.php?team=' + team + '&month=' + month + '&year=' + year + '&line=' + lineVal + '&ops_days=' + ops_days)
            .then(res => res.json())
            .then(data => ({ line: lineVal, data }));
    });

    Promise.all(promises).then(function(results) {
        var container = document.getElementById('weekOptionsContainer');
        container.innerHTML = '';
        var weekPlans = { lipas: [0,0,0,0,0], volpas: [0,0,0,0,0] };
        var weekActuals = { lipas: [0,0,0,0,0], volpas: [0,0,0,0,0] };

        results.forEach(function(r) {
            for (var w = 1; w <= 5; w++) {
                weekPlans.lipas[w-1] += r.data.lipas ? (parseInt(r.data.lipas['OPERATING_DAYS_PLAN_'+w]) || 0) : 0;
                weekActuals.lipas[w-1] += r.data.lipas ? (parseInt(r.data.lipas['OPERATING_DAYS_ACTUAL_'+w]) || 0) : 0;
                weekPlans.volpas[w-1] += r.data.volpas ? (parseFloat(r.data.volpas['OPERATING_DAYS_PLAN_'+w]) || 0) : 0;
                weekActuals.volpas[w-1] += r.data.volpas ? (parseFloat(r.data.volpas['OPERATING_DAYS_ACTUAL_'+w]) || 0) : 0;
            }
        });

        for (var w = 1; w <= 5; w++) {
            var lipasPlan = weekPlans.lipas[w-1], lipasActual = weekActuals.lipas[w-1];
            var volpasPlan = weekPlans.volpas[w-1], volpasActual = weekActuals.volpas[w-1];
            var existing = (lipasPlan > 0 || lipasActual > 0 || volpasPlan > 0 || volpasActual > 0) ?
                '(LIPAS Plan: ' + lipasPlan + ', Actual: ' + lipasActual + ' | VOLPAS Plan: ' + volpasPlan.toFixed(0) + ', Actual: ' + volpasActual.toFixed(0) + ')' : '';
            container.innerHTML += '<label><input type="radio" name="lvWeek" value="' + w + '"> Day Slot ' + w + ' <span class="existing-data">' + existing + '</span></label>';
        }
        document.getElementById('lvWeekModal').classList.add('active');
    });
}

function closeLvWeekModal() { document.getElementById('lvWeekModal').classList.remove('active'); }

function submitLvWeek() {
    var weekRadio = document.querySelector('input[name="lvWeek"]:checked');
    if (!weekRadio) { alert('Please select a day slot.'); return; }
    var week = weekRadio.value;
    var params = new URLSearchParams(window.location.search);
    var data = {
        team: params.get('team') || '', month: params.get('month') || '',
        year: params.get('year') || '', ops_days: params.get('ops_days') || '', week: week
    };
    var lineCheckboxes = document.querySelectorAll('.line-checkbox-f:checked');
    var lines = Array.from(lineCheckboxes).map(cb => cb.value);
    if (lines.length === 0) { alert('Please select at least one line.'); return; }
    var formData = new URLSearchParams(data);
    lines.forEach(l => formData.append('line[]', l));
    formData.append('csrf_token', csrfToken);
    fetch('save_lipas_volpas.php', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: formData })
        .then(res => res.text())
        .then(msg => { alert(msg); closeLvWeekModal(); location.reload(); })
        .catch(err => alert('Error: ' + err));
}

// ── Line dropdown toggle (LIPAS/VOLPAS manage view) ─────────
var lineToggleBtn = document.getElementById('lineToggleBtn');
var lineDropdown = document.getElementById('lineDropdownContent');
if (lineToggleBtn) {
    lineToggleBtn.addEventListener('click', function(e) { e.stopPropagation(); lineDropdown.style.display = (lineDropdown.style.display === 'block') ? 'none' : 'block'; });
    document.addEventListener('click', function(e) { if (!lineDropdown.contains(e.target) && e.target !== lineToggleBtn && !lineToggleBtn.contains(e.target)) lineDropdown.style.display = 'none'; });
    lineDropdown.addEventListener('click', function(e) { e.stopPropagation(); });
    var selectAllLines = document.getElementById('selectAllLines');
    if (selectAllLines) selectAllLines.addEventListener('change', function() { document.querySelectorAll('.line-checkbox').forEach(cb => cb.checked = this.checked); });
}