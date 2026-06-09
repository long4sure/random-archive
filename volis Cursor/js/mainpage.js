// ── Logout modal functions ────────────────────────────────────────
function openLogoutModal() { document.getElementById('logoutModal').style.display = 'flex'; }
function closeLogoutModal() { document.getElementById('logoutModal').style.display = 'none'; }
function confirmLogout() { document.getElementById('logoutForm').submit(); }
document.addEventListener('DOMContentLoaded', function() {
    var logoutModal = document.getElementById('logoutModal');
    if (logoutModal) logoutModal.addEventListener('click', function(e) { if (e.target === this) closeLogoutModal(); });
});

// ── Cascading filter helpers ──────────────────────────────────────
function cascadeWeekly(trigger) {
    var form = trigger.form;
    var selects = {
        team:   form.querySelector('select[name="team"]'),
        year:   form.querySelector('select[name="year"]'),
        month:  form.querySelector('select[name="month"]'),
        shift:  form.querySelector('select[name="shift"]'),
    };
    var teamVal = selects.team.value;

    // Enable / disable based on previous selection
    selects.year.disabled = !teamVal;
    selects.month.disabled = !teamVal;
    if (!teamVal) {
        selects.month.value = '';
    }

    if (trigger.name === 'year') {
        // After year is chosen, month stays enabled; auto-set current month if not already
        if (selects.month.value === '' && selects.year.value) {
            selects.month.value = '<?php echo $currentMonthName; ?>';
        }
    }

    form.submit();
}

function cascadeMonthly(trigger) {
    var form = trigger.form;
    var selects = {
        team:   form.querySelector('select[name="team"]'),
        year:   form.querySelector('select[name="year"]'),
        month:  form.querySelector('select[name="month"]'),
        shift:  form.querySelector('select[name="shift"]'),
    };
    var teamVal  = selects.team.value;
    var yearVal  = selects.year.value;
    var monthVal = selects.month.value;

    selects.year.disabled  = !teamVal;
    selects.month.disabled = !yearVal;
    if (!yearVal) selects.month.value = '';

    form.submit();
}

function cascadeYearly(trigger) {
    var form = trigger.form;
    var selects = {
        team: form.querySelector('select[name="team"]'),
        year: form.querySelector('select[name="year"]'),
    };
    var teamVal = selects.team.value;

    selects.year.disabled = !teamVal;
    form.submit();
}

// ── Generic dropdown toggle helpers ───────────────────────────────
function toggleDropdownPanel(panelId, wrapperId, e) {
    e.stopPropagation();
    document.querySelectorAll('.filter-dropdown-panel.open').forEach(function(p) {
        if (p.id !== panelId) p.classList.remove('open');
    });
    document.getElementById(panelId).classList.toggle('open');
}

function toggleAllInPanel(panelId) {
    return function(cb) {
        var inputs = document.querySelectorAll('#' + panelId + ' input[name="line[]"], #' + panelId + ' input[name="ops_days[]"]');
        inputs.forEach(function(b){ b.checked = cb.checked; });
        var firstInput = inputs[0];
        if (firstInput) firstInput.closest('form').submit();
    };
}

// ── Close any open dropdown when clicking outside ─────────────────
document.addEventListener('click', function(e) {
    document.querySelectorAll('.filter-dropdown').forEach(function(wrap) {
        if (!wrap.contains(e.target)) {
            var panel = wrap.querySelector('.filter-dropdown-panel');
            if (panel) panel.classList.remove('open');
        }
    });
});

// ── Weekly Report ─────────────────────────────────────────────────
function toggleLineDropdown(e) { toggleDropdownPanel('lineDropdownPanel', 'lineDropdown', e); }
function toggleAllProdLines(cb) { toggleAllInPanel('lineDropdownPanel')(cb); }

function toggleOpsDaysDropdown(e) { toggleDropdownPanel('opsDaysDropdownPanel', 'opsDaysDropdown', e); }
function toggleAllOpsDays(cb) { toggleAllInPanel('opsDaysDropdownPanel')(cb); }

// ── Monthly Report ────────────────────────────────────────────────
function toggleMonthlyLineDropdown(e) { toggleDropdownPanel('monthlyLineDropdownPanel', 'monthlyLineDropdown', e); }
function toggleAllMonthlyLines(cb) { toggleAllInPanel('monthlyLineDropdownPanel')(cb); }

// ── Yearly Report ─────────────────────────────────────────────────
function toggleYearlyLineDropdown(e) { toggleDropdownPanel('yearlyLineDropdownPanel', 'yearlyLineDropdown', e); }
function toggleAllYearlyLines(cb) { toggleAllInPanel('yearlyLineDropdownPanel')(cb); }

// ── LIPAS VOLPAS ─────────────────────────────────────────────────
function lvHandlePeriodChange(sel) {
    var period = sel.value;
    document.getElementById('lvMonthGroup').style.display = (period === 'weekly') ? 'none' : '';
    document.getElementById('lvWeekGroup').style.display  = (period === 'weekly') ? ''     : 'none';
    sel.form.submit();
}

// ── Chart initialisation (runs after DOM is ready) ────────────────
document.addEventListener('DOMContentLoaded', function() {
    var chartOpts = {
        responsive: true,
        plugins: { legend: { position: 'top' } },
        scales: { x: { stacked: false }, y: { beginAtZero: true, stacked: false } }
    };

    // Weekly – Cumulative vs Quantity
    if (document.getElementById('cumulativeChart') && typeof cumulativeChartData !== 'undefined') {
        new Chart(document.getElementById('cumulativeChart'), { type: 'bar', data: cumulativeChartData, options: chartOpts });
    }

    // Daily shift charts
    if (Array.isArray(dailyShiftChartData) && dailyShiftChartData.length) {
        dailyShiftChartData.forEach(function(entry, idx) {
            var canvas = document.getElementById('dailyShiftChart_' + idx);
            if (canvas) {
                new Chart(canvas, {
                    type: 'bar',
                    data: entry.chartData,
                    options: {
                        responsive: true,
                        plugins: { legend: { position: 'top' } },
                        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
                    }
                });
            }
        });
    }

    // Monthly charts
    if (document.getElementById('monthlyShiftChart') && typeof monthlyChartData !== 'undefined') {
        new Chart(document.getElementById('monthlyShiftChart'), { type: 'bar', data: monthlyChartData, options: chartOpts });
    }
    if (document.getElementById('monthlyCumChart') && typeof monthlyCumChartData !== 'undefined') {
        new Chart(document.getElementById('monthlyCumChart'), { type: 'bar', data: monthlyCumChartData, options: chartOpts });
    }

    // Yearly charts
    if (document.getElementById('yearlyShiftChart') && typeof yearlyChartData !== 'undefined') {
        new Chart(document.getElementById('yearlyShiftChart'), { type: 'bar', data: yearlyChartData, options: chartOpts });
    }
    if (document.getElementById('yearlyCumChart') && typeof yearlyCumChartData !== 'undefined') {
        new Chart(document.getElementById('yearlyCumChart'), { type: 'bar', data: yearlyCumChartData, options: chartOpts });
    }

    // LIPAS/VOLPAS charts (bar/pie only)
    if (typeof lvChartType !== 'undefined') {
        var lvOpts = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: { legend: { position: 'top' } }
        };
        if (lvChartType !== 'pie') {
            lvOpts.scales = { x: { stacked: false }, y: { beginAtZero: true, stacked: false } };
        }

        if (lvDataset !== 'volpas' && document.getElementById('lvLipasChart') && typeof lipasChartData !== 'undefined') {
            new Chart(document.getElementById('lvLipasChart'), { type: lvChartType, data: lipasChartData, options: lvOpts });
        }

        if (lvDataset !== 'lipas' && document.getElementById('lvVolpasChart') && typeof volpasChartData !== 'undefined') {
            new Chart(document.getElementById('lvVolpasChart'), { type: lvChartType, data: volpasChartData, options: lvOpts });
        }
    }
});