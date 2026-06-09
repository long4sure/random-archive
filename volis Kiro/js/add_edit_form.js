/**
 * js/add_edit_form.js
 * ─────────────────────────────────────────────────────────────
 * Handles all Add Record form interactivity. Separated from
 * add_edit.js (which owns the manage table / side panel) to
 * keep concerns isolated and the file sizes manageable.
 *
 * Requires AE_Config (set inline by add_edit.php) with:
 *   isScoped, sessionTeam, sessionLine, lockedTable,
 *   linesByTeam, skuOptions, currentMonth, currentYear,
 *   csrfToken, role
 *
 * Implements:
 *   Fix 3  — shift section hidden until SKU selected
 *   Fix 4  — chevron dropdown button on SKU combobox
 *   Fix 5  — day-of-week logic: only today's shift row shown
 *   Fix 7  — dropdown button as the trigger (not focus)
 *   Fix 8  — data-day targeting for shift rows
 *   Sug. B — "Today is Day N" label
 *   Sug. C — validate today within ops-days range on submit
 *   Sug. D — submit disabled until required fields filled
 *   Sug. F — "No SKUs found" empty state in dropdown
 *   Async duplicate check via api/api_check_duplicate.php
 * ─────────────────────────────────────────────────────────────
 */
var AddEditForm = (function () {

    'use strict';

    // ── DOM refs ──────────────────────────────────────────────
    var cfg            = window.AE_Config || {};
    var tableSelect    = document.getElementById('target_table');
    var teamInput      = document.getElementById('TEAM');
    var lineSelect     = document.getElementById('LINE_select');
    var monthSelect    = document.getElementById('MONTH');
    var skuInput       = document.getElementById('SKU_CODE');
    var skuDescInput   = document.getElementById('SKU_DESCRIPTION'); // readonly — auto-filled only
    var skuDropBtn     = document.getElementById('skuDropdownBtn');
    var skuChevron     = document.getElementById('skuChevron');
    var skuCodeList    = document.getElementById('sku_code_list');
    var quantityInput  = document.getElementById('QUANTITY');
    var uomInput       = document.getElementById('UOM');
    var opsStartInput  = document.getElementById('OPERATING_DAYS_START');
    var opsEndInput    = document.getElementById('OPERATING_DAYS_END');
    var shiftSection   = document.getElementById('shiftSection');
    var todayDayLabel  = document.getElementById('todayDayLabel');
    var liveTotal      = document.getElementById('liveTotal');
    var submitBtn      = document.getElementById('submitBtn');
    var dupWarning     = document.getElementById('duplicateWarning');
    var dupWarningMsg  = document.getElementById('duplicateWarningMsg');
    var validationModal = document.getElementById('validationModal');
    var validationMsg   = document.getElementById('validationMessage');
    var form           = document.getElementById('productionForm');

    // ── Data from PHP ─────────────────────────────────────────
    var skuOptions    = cfg.skuOptions   || [];
    var linesByTeam   = cfg.linesByTeam  || {};
    var isScoped      = !!cfg.isScoped;

    // Build a fast lookup: SKU_CODE → { SKU_DESCRIPTION, UOM, LINE, TEAM }
    var skuMap = {};
    skuOptions.forEach(function (o) {
        if (!skuMap[o.SKU_CODE]) {
            skuMap[o.SKU_CODE] = o;
        }
    });

    // Current filtered SKU list (changes when team+line changes)
    var currentSKUs = [];

    // Duplicate check state
    var _dupCheckTimer    = null;
    var _dupCheckAbort    = null;
    var _isDuplicate      = false;
    var _skuValid         = false;

    // ── Day-of-week mapping ───────────────────────────────────
    // JS getDay(): 0=Sun, 1=Mon ... 6=Sat
    // Our Day 1=Mon, Day 2=Tue, ... Day 7=Sun
    var jsDayToShiftDay = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 0:7 };
    var dayNames = {
        1:'Monday', 2:'Tuesday', 3:'Wednesday', 4:'Thursday',
        5:'Friday', 6:'Saturday', 7:'Sunday'
    };

    function getTodayShiftDay() {
        return jsDayToShiftDay[new Date().getDay()];
    }

    // ── Shift section ─────────────────────────────────────────
    // Returns array of Day numbers (1–7) that fall within a date range.
    // Day 1 = Monday … Day 7 = Sunday (matches data-day attributes).
    function _getDaysInRange(startStr, endStr) {
        if (!startStr || !endStr) return [];
        var jsDayToShiftDay = { 1:1, 2:2, 3:3, 4:4, 5:5, 6:6, 0:7 };
        var start = new Date(startStr + 'T00:00:00');
        var end   = new Date(endStr   + 'T00:00:00');
        var days  = [];
        var cur   = new Date(start);
        while (cur <= end && days.length <= 7) {
            days.push(jsDayToShiftDay[cur.getDay()]);
            cur.setDate(cur.getDate() + 1);
        }
        return days;
    }

    // Fix 3 / R3 + Fix A: reveal shift section.
    // - data_entry (isScoped): show Day 1 (Monday) through today inclusive.
    // - admin / system_admin: show ALL rows in the selected date range,
    //   but lock (readonly + force 0) any row whose date is in the future.
    function revealShiftSection() {
        var rows = shiftSection.querySelectorAll('tr[data-day]');
        rows.forEach(function (tr) { tr.style.display = 'none'; });

        // First unlock all inputs so we start from a clean slate each call
        shiftSection.querySelectorAll('.shift-input').forEach(function (inp) {
            inp.readOnly = false;
            inp.classList.remove('shift-input-locked');
        });

        if (isScoped) {
            // data_entry — show Mon (Day 1) through today inclusive
            var today = getTodayShiftDay(); // 1=Mon … 7=Sun
            for (var d = 1; d <= today; d++) {
                var r = shiftSection.querySelector('tr[data-day="' + d + '"]');
                if (r) r.style.display = '';
            }
            if (todayDayLabel) {
                var label = today === 1
                    ? 'Today: ' + dayNames[today] + ' — Day ' + today
                    : 'Days 1–' + today + ' shown (today: ' + dayNames[today] + ')';
                todayDayLabel.textContent = label;
            }
        } else {
            // admin / system_admin — show ALL rows in the date range,
            // then lock any row whose actual calendar date is after today.
            var start      = opsStartInput ? opsStartInput.value : '';
            var end        = opsEndInput   ? opsEndInput.value   : '';
            var activeDays = _getDaysInRange(start, end);

            if (activeDays.length === 0) {
                // No valid range yet — fall back to showing only today's row
                var fb    = getTodayShiftDay();
                var fbRow = shiftSection.querySelector('tr[data-day="' + fb + '"]');
                if (fbRow) fbRow.style.display = '';
                if (todayDayLabel) {
                    todayDayLabel.textContent = 'Today is ' + dayNames[fb] + ' — Day ' + fb;
                }
            } else {
                var todayMidnight = new Date();
                todayMidnight.setHours(0, 0, 0, 0);
                var startDate = new Date(start + 'T00:00:00');

                activeDays.forEach(function (d, idx) {
                    var r = shiftSection.querySelector('tr[data-day="' + d + '"]');
                    if (!r) return;
                    r.style.display = '';

                    // Compute the actual calendar date for this day slot
                    var dayDate = new Date(startDate);
                    dayDate.setDate(startDate.getDate() + idx);

                    if (dayDate > todayMidnight) {
                        // Future day — lock all shift inputs in this row to 0
                        r.querySelectorAll('.shift-input').forEach(function (inp) {
                            inp.value    = '0';
                            inp.readOnly = true;
                            inp.classList.add('shift-input-locked');
                        });
                    }
                });

                if (todayDayLabel) {
                    var lockedCount = activeDays.filter(function (d, idx) {
                        var dayDate = new Date(startDate);
                        dayDate.setDate(startDate.getDate() + idx);
                        return dayDate > todayMidnight;
                    }).length;
                    var editableCount = activeDays.length - lockedCount;
                    var rangeLabel = activeDays.length === 7 ? 'All 7 days' : activeDays.length + ' day(s) selected';
                    if (lockedCount > 0) {
                        rangeLabel += ' (' + editableCount + ' editable, ' + lockedCount + ' future — locked)';
                    }
                    todayDayLabel.textContent = rangeLabel;
                }
            }
        }

        shiftSection.style.display = 'block';
        calculateTotal();
    }

    function hideShiftSection() {
        shiftSection.style.display = 'none';
        if (todayDayLabel) todayDayLabel.textContent = '';
    }

    // ── Cumulative total ──────────────────────────────────────
    function calculateTotal() {
        var sum = 0;
        var inputs = form.querySelectorAll('.shift-input');
        inputs.forEach(function (inp) {
            var v = parseInt(inp.value, 10);
            if (!isNaN(v) && v > 0) sum += v;
        });
        if (liveTotal) liveTotal.textContent = sum;
    }

    // ── Line dropdown ─────────────────────────────────────────
    function populateLineDropdown(team) {
        if (!lineSelect) return;
        lineSelect.innerHTML = '<option value="">-- Select Line --</option>';
        var lines = linesByTeam[team] || [];
        lines.forEach(function (line) {
            var o = document.createElement('option');
            o.value = line; o.textContent = line;
            lineSelect.appendChild(o);
        });
        _filterSKUs();
    }

    // ── SKU filtering ─────────────────────────────────────────
    function _getTeam() {
        if (isScoped) return cfg.sessionTeam;
        return teamInput ? teamInput.value : '';
    }
    function _getLine() {
        if (isScoped) return cfg.sessionLine;
        return lineSelect ? lineSelect.value : '';
    }

    function _filterSKUs() {
        var t = _getTeam(), l = _getLine();
        if (!t || !l) { currentSKUs = []; return; }
        currentSKUs = skuOptions.filter(function (o) {
            return o.TEAM === t && o.LINE === l;
        });
    }

    // ── SKU Autocomplete list ─────────────────────────────────
    function _buildSKUList(listEl, items, onSelect) {
        listEl.innerHTML = '';

        if (!items.length) {
            // Suggestion F: no-results state
            var li = document.createElement('li');
            li.className    = 'sku-no-results';
            li.textContent  = 'No SKUs found for this line';
            listEl.appendChild(li);
            listEl.style.display = 'block';
            return;
        }

        items.forEach(function (item) {
            var li = document.createElement('li');
            li.textContent = item;
            li.addEventListener('mousedown', function (e) {
                e.preventDefault(); // prevent blur before click
                onSelect(item);
                _closeAllLists();
            });
            listEl.appendChild(li);
        });
        listEl.style.display = 'block';
    }

    function _closeAllLists() {
        [skuCodeList].forEach(function (l) {
            if (l) l.style.display = 'none';
        });
        if (skuChevron) {
            skuChevron.className = 'fa fa-chevron-down';
        }
        _skuDropOpen = false;
    }

    var _skuDropOpen = false;

    function _onSKUCodeSelect(code) {
        if (!skuInput) return;
        skuInput.value = code;
        var entry = skuMap[code];
        if (entry) {
            // Auto-fill description (readonly) and UOM from sku_master
            if (skuDescInput) skuDescInput.value = entry.SKU_DESCRIPTION || '';
            if (uomInput)     uomInput.value     = entry.UOM             || '';
        }
        _skuValid = true;
        revealShiftSection();
        _updateSubmitState();
        _triggerDuplicateCheck();
    }

    // Fix 4: toggle dropdown on chevron button click
    function _toggleSKUDropdown() {
        if (_skuDropOpen) {
            _closeAllLists();
            return;
        }
        _filterSKUs();
        var codes = currentSKUs.map(function (o) { return o.SKU_CODE; });
        _buildSKUList(skuCodeList, codes, _onSKUCodeSelect);
        _skuDropOpen = true;
        if (skuChevron) skuChevron.className = 'fa fa-chevron-up';
        if (skuInput) skuInput.focus();
    }

    // Type-to-filter in the SKU code input
    function _onSKUCodeInput() {
        _skuValid = false;
        hideShiftSection();
        _updateSubmitState();
        _hideDuplicateWarning();

        var q = skuInput.value.trim().toLowerCase();
        if (!q) { _closeAllLists(); return; }
        var matches = currentSKUs
            .filter(function (o) { return o.SKU_CODE.toLowerCase().includes(q); })
            .map(function (o) { return o.SKU_CODE; });
        _buildSKUList(skuCodeList, matches, _onSKUCodeSelect);
        _skuDropOpen = true;
    }

    // ── Operating days auto-fill ──────────────────────────────
    function setOperatingDaysToCurrentWeek() {
        var today = new Date();
        var dow   = today.getDay();
        var mon   = new Date(today);
        mon.setDate(today.getDate() - ((dow + 6) % 7)); // Monday
        var sun = new Date(mon);
        sun.setDate(mon.getDate() + 6);                 // Sunday
        var fmt = function (d) {
            return d.getFullYear()
                + '-' + String(d.getMonth() + 1).padStart(2, '0')
                + '-' + String(d.getDate()).padStart(2, '0');
        };
        if (opsStartInput) opsStartInput.value = fmt(mon);
        if (opsEndInput)   opsEndInput.value   = fmt(sun);
    }

    // ── Table change (admin / system_admin only) ──────────────
    function _updateUIForTable(tv) {
        if (!teamInput) return;
        teamInput.value = tv === 'a_summary_line' ? 'A'
                        : tv === 'b_summary_line' ? 'B'
                        : tv === 'c_summary_line' ? 'C' : '';
        if (lineSelect) lineSelect.disabled = !tv;
        populateLineDropdown(teamInput.value);
        if (tv) {
            if (monthSelect) monthSelect.value = cfg.currentMonth || '';
            setOperatingDaysToCurrentWeek();
        }
    }

    // ── Line change ───────────────────────────────────────────
    function _onLineChange() {
        var ok = lineSelect && lineSelect.value !== '';
        if (skuInput)   skuInput.disabled   = !ok;
        if (skuDropBtn) skuDropBtn.disabled = !ok;
        if (!ok) {
            _filterSKUs();
            _closeAllLists();
            _skuValid = false;
            hideShiftSection();
        } else {
            _filterSKUs();
        }
        _updateSubmitState();
    }

    // ── Duplicate check ───────────────────────────────────────
    var _dupDebounceMs = 500;

    function _triggerDuplicateCheck() {
        if (_dupCheckTimer) clearTimeout(_dupCheckTimer);
        if (_dupCheckAbort) _dupCheckAbort.abort();

        var table    = isScoped ? cfg.lockedTable
                     : (tableSelect ? tableSelect.value : '');
        var team     = _getTeam();
        var line     = _getLine();
        var sku      = skuInput    ? skuInput.value.trim()    : '';
        var start    = opsStartInput ? opsStartInput.value    : '';
        var end      = opsEndInput   ? opsEndInput.value      : '';

        if (!table || !team || !line || !sku || !start || !end) return;

        _dupCheckTimer = setTimeout(function () {
            var ctrl = new AbortController();
            _dupCheckAbort = ctrl;

            var url = 'api/api_check_duplicate.php'
                    + '?table='     + encodeURIComponent(table)
                    + '&team='      + encodeURIComponent(team)
                    + '&line='      + encodeURIComponent(line)
                    + '&sku_code='  + encodeURIComponent(sku)
                    + '&ops_start=' + encodeURIComponent(start)
                    + '&ops_end='   + encodeURIComponent(end);

            fetch(url, { signal: ctrl.signal })
                .then(function (r) { return r.json(); })
                .then(function (data) {
                    if (data.duplicate) {
                        _isDuplicate = true;
                        _showDuplicateWarning(data.message);
                    } else {
                        _isDuplicate = false;
                        _hideDuplicateWarning();
                    }
                    _updateSubmitState();
                })
                .catch(function (err) {
                    if (err.name !== 'AbortError') console.warn('Duplicate check error:', err);
                });
        }, _dupDebounceMs);
    }

    function _showDuplicateWarning(msg) {
        if (!dupWarning || !dupWarningMsg) return;
        dupWarningMsg.textContent = msg;
        dupWarning.style.display  = 'flex';
    }
    function _hideDuplicateWarning() {
        if (!dupWarning) return;
        dupWarning.style.display = 'none';
        if (dupWarningMsg) dupWarningMsg.textContent = '';
    }

    // ── Submit guard ──────────────────────────────────────────
    // Suggestion D: enable submit only when all required fields are filled
    // and no duplicate is detected.
    function _updateSubmitState() {
        if (!submitBtn) return;

        var team    = _getTeam();
        var line    = _getLine();
        var month   = monthSelect    ? monthSelect.value.trim()    : '';
        var sku     = skuInput       ? skuInput.value.trim()       : '';
        var start   = opsStartInput  ? opsStartInput.value.trim()  : '';
        var end     = opsEndInput    ? opsEndInput.value.trim()     : '';

        var allFilled = team && line && month && sku && start && end;
        var ready     = allFilled && !_isDuplicate;

        submitBtn.disabled = !ready;
    }

    // ── SKU validation on submit ──────────────────────────────
    function _validateSKU() {
        var code = skuInput ? skuInput.value.trim() : '';
        var t    = _getTeam(), l = _getLine();
        if (!t || !l || !code) return true;

        var validCode = currentSKUs.some(function (o) { return o.SKU_CODE === code; });
        if (validCode) return true;

        _showValidationModal('Incorrect SKU Code "' + code + '" — please select a valid SKU from the list.');
        return false;
    }

    // Suggestion C: validate today is within the operating days range
    function _validateOpsDateRange() {
        var start = opsStartInput ? opsStartInput.value : '';
        var end   = opsEndInput   ? opsEndInput.value   : '';
        if (!start || !end) return true;

        var startDate = new Date(start + 'T00:00:00');
        var endDate   = new Date(end   + 'T00:00:00');
        var today     = new Date();
        today.setHours(0, 0, 0, 0);

        if (today < startDate || today > endDate) {
            _showValidationModal(
                "Today's date (" + today.toLocaleDateString() + ") "
                + "is outside the selected operating days range "
                + "(" + startDate.toLocaleDateString()
                + " – " + endDate.toLocaleDateString() + "). "
                + "Please select a range that includes today."
            );
            return false;
        }
        return true;
    }

    // ── Validation modal ──────────────────────────────────────
    function _showValidationModal(msg) {
        if (!validationModal || !validationMsg) return;
        validationMsg.textContent = msg;
        validationModal.classList.add('active');
    }

    function closeValidationModal() {
        if (validationModal) validationModal.classList.remove('active');
    }

    // ── Initialisation ────────────────────────────────────────
    function _init() {

        // For data_entry (scoped), the form is pre-locked —
        // immediately filter SKUs and set the initial state.
        if (isScoped) {
            _filterSKUs();
            setOperatingDaysToCurrentWeek();
            if (monthSelect) monthSelect.value = cfg.currentMonth || '';
            // Enable SKU input since team+line are already known
            if (skuInput)   skuInput.disabled   = false;
            if (skuDropBtn) skuDropBtn.disabled  = false;
        } else {
            // admin/system_admin: start with line+SKU disabled
            if (lineSelect)  lineSelect.disabled  = true;
            if (skuInput)    skuInput.disabled     = true;
            if (skuDropBtn)  skuDropBtn.disabled   = true;
        }

        // Shift section starts hidden (Fix 3)
        hideShiftSection();

        // Calculate initial total
        calculateTotal();

        // ── Table select (admin/system_admin) ─────────────────
        if (tableSelect) {
            tableSelect.addEventListener('change', function () {
                _updateUIForTable(this.value);
                _skuValid = false;
                hideShiftSection();
                _updateSubmitState();
            });
            if (tableSelect.value) _updateUIForTable(tableSelect.value);
        }

        // ── Month select ──────────────────────────────────────
        if (monthSelect) {
            monthSelect.addEventListener('change', function () {
                // data_entry always snaps to the current week.
                // admin/system_admin: do NOT auto-snap — they may be backdating.
                // Just refresh shift visibility if the section is already open.
                if (isScoped) {
                    setOperatingDaysToCurrentWeek();
                } else {
                    if (shiftSection && shiftSection.style.display !== 'none') {
                        revealShiftSection();
                    }
                }
                _triggerDuplicateCheck();
                _updateSubmitState();
            });
        }

        // ── Line select (admin/system_admin) ──────────────────
        if (lineSelect) {
            lineSelect.addEventListener('change', _onLineChange);
        }

        // ── SKU Code input ────────────────────────────────────
        if (skuInput) {
            skuInput.addEventListener('input', _onSKUCodeInput);
            skuInput.addEventListener('blur', function () {
                setTimeout(_closeAllLists, 200);
            });
        }

        // Fix 4: Chevron dropdown button
        if (skuDropBtn) {
            skuDropBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                _toggleSKUDropdown();
            });
        }

        // ── Operating days change ─────────────────────────────
        if (opsStartInput) {
            opsStartInput.addEventListener('change', function () {
                if (!isScoped && this.value) {
                    // Snap to Monday of the selected week
                    var d   = new Date(this.value + 'T00:00:00');
                    var dow = d.getDay(); // 0=Sun … 6=Sat
                    var diff = (dow + 6) % 7; // days back to Monday
                    d.setDate(d.getDate() - diff);
                    var fmt = function (dt) {
                        return dt.getFullYear()
                            + '-' + String(dt.getMonth() + 1).padStart(2, '0')
                            + '-' + String(dt.getDate()).padStart(2, '0');
                    };
                    this.value = fmt(d);
                    // Auto-set end to Sunday (+6 days)
                    var sun = new Date(d);
                    sun.setDate(d.getDate() + 6);
                    if (opsEndInput) opsEndInput.value = fmt(sun);
                }
                if (!isScoped && shiftSection && shiftSection.style.display !== 'none') {
                    revealShiftSection();
                }
                _triggerDuplicateCheck();
                _updateSubmitState();
            });
        }
        if (opsEndInput) {
            opsEndInput.addEventListener('change', function () {
                if (!isScoped && this.value) {
                    // Snap to Sunday of the selected week
                    var d   = new Date(this.value + 'T00:00:00');
                    var dow = d.getDay(); // 0=Sun
                    var diff = dow === 0 ? 0 : 7 - dow; // days forward to Sunday
                    d.setDate(d.getDate() + diff);
                    var fmt = function (dt) {
                        return dt.getFullYear()
                            + '-' + String(dt.getMonth() + 1).padStart(2, '0')
                            + '-' + String(dt.getDate()).padStart(2, '0');
                    };
                    this.value = fmt(d);
                }
                if (!isScoped && shiftSection && shiftSection.style.display !== 'none') {
                    revealShiftSection();
                }
                _triggerDuplicateCheck();
                _updateSubmitState();
            });
        }

        // ── Shift inputs ──────────────────────────────────────
        form.querySelectorAll('.shift-input').forEach(function (inp) {
            inp.addEventListener('input', function () {
                calculateTotal();
                _updateSubmitState();
            });
        });

        // ── Form submit ───────────────────────────────────────
        if (form) {
            form.addEventListener('submit', function (e) {
                // Ensure all blank shift inputs send "0"
                form.querySelectorAll('.shift-input').forEach(function (inp) {
                    if (inp.value.trim() === '') inp.value = '0';
                });

                if (!_validateSKU())                              { e.preventDefault(); return; }
                // data_entry must submit within current week; admin/system_admin can backdate
                if (isScoped && !_validateOpsDateRange())         { e.preventDefault(); return; }
                if (_isDuplicate)                                  { e.preventDefault(); return; }
            });
        }

        // ── Close lists on outside click ──────────────────────
        document.addEventListener('click', function (e) {
            var inSKU = skuInput && (skuInput.contains(e.target)
                                  || skuCodeList.contains(e.target)
                                  || (skuDropBtn && skuDropBtn.contains(e.target)));
            if (!inSKU) {
                if (skuCodeList) skuCodeList.style.display = 'none';
                _skuDropOpen = false;
                if (skuChevron) skuChevron.className = 'fa fa-chevron-down';
            }
        });

        // Initial submit state
        _updateSubmitState();
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', _init);
    } else {
        _init();
    }

    // ── Public API ────────────────────────────────────────────
    return {
        closeValidationModal: closeValidationModal
    };

})();

// ── Logout modal (add form path — add_edit.js not loaded here) ──
function openLogoutModal()  { document.getElementById('logoutModal').style.display = 'flex'; }
function closeLogoutModal() { document.getElementById('logoutModal').style.display = 'none'; }
function confirmLogout()    { document.getElementById('logoutForm').submit(); }
(function () {
    var m = document.getElementById('logoutModal');
    if (m) m.addEventListener('click', function (e) { if (e.target === m) closeLogoutModal(); });
})();