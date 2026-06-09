<?php
/**
 * view/add_edit.tpl.php
 * Template for action=manage&type=summary
 * Rendered by add_edit.php — all PHP vars come from that file.
 * Contains the filter bar and data table ONLY.
 * (Edit modal and delete confirmation modal are now in add_edit.php,
 *  placed outside the main content area for better stacking context.)
 */
?>

<h2>Manage Line Production Records</h2>

<!-- ══════════════════════════════════════════════════════
     FILTER BAR
     ══════════════════════════════════════════════════════ -->
<div class="filter-container">
    <form method="get" id="filterForm" style="display: contents;">
        <input type="hidden" name="action" value="manage">
        <input type="hidden" name="type"   value="summary">

        <div class="filter-group">
            <label>Team</label>
            <?php if ($_SESSION['role'] === 'data_entry'): ?>
                <?php
                $teamLabels = ['a_summary_line'=>'Team A','b_summary_line'=>'Team B','c_summary_line'=>'Team C'];
                $teamLabel  = $teamLabels[$manageTable] ?? 'My Team';
                ?>
                <input type="hidden" name="manage_table" value="<?php echo htmlspecialchars($manageTable); ?>">
                <input type="text" value="<?php echo htmlspecialchars($teamLabel); ?>" readonly
                       style="background:var(--c-slate-50);color:var(--c-slate-500);cursor:default;border-color:var(--c-slate-300);">
            <?php else: ?>
                <select name="manage_table" id="manage_table" onchange="this.form.submit()">
                    <option value="">-- Select --</option>
                    <option value="a_summary_line" <?php echo ($manageTable == 'a_summary_line') ? 'selected' : ''; ?>>Team A</option>
                    <option value="b_summary_line" <?php echo ($manageTable == 'b_summary_line') ? 'selected' : ''; ?>>Team B</option>
                    <option value="c_summary_line" <?php echo ($manageTable == 'c_summary_line') ? 'selected' : ''; ?>>Team C</option>
                </select>
            <?php endif; ?>
        </div>

        <div class="filter-group">
            <label>Month</label>
            <select name="month" onchange="this.form.submit()">
                <option value="">All</option>
                <?php foreach ($months as $m):
                    $sel = ($filterMonth == $m) ? 'selected' : '';
                    echo "<option value=\"$m\" $sel>$m</option>";
                endforeach; ?>
            </select>
        </div>

        <div class="filter-group" id="lineFilterGroup">
            <label>Line</label>
            <?php if ($_SESSION['role'] === 'data_entry'): ?>
                <input type="hidden" name="line" value="<?php echo htmlspecialchars($_SESSION['line'] ?? ''); ?>">
                <input type="text" value="<?php echo htmlspecialchars($_SESSION['line'] ?? ''); ?>" readonly
                       style="background:var(--c-slate-50);color:var(--c-slate-500);cursor:default;border-color:var(--c-slate-300);">
            <?php else: ?>
                <select name="line" id="lineSelect" onchange="this.form.submit()"
                        <?php echo empty($manageTable) ? 'disabled' : ''; ?>>
                    <option value="">All Lines</option>
                </select>
            <?php endif; ?>
        </div>

        <div class="filter-group days-dropdown">
            <label>Days to Show</label>
            <button type="button" id="daysToggleBtn" class="btn-outline" style="padding: 8px 16px;">
                <i class="fa fa-calendar"></i> Select Days ▼
            </button>
            <div id="daysDropdownContent" class="days-dropdown-content" style="display: none; position: absolute; z-index: 200;">
                <label><input type="checkbox" id="selectAllDays"> Select All</label>
                <hr>
                <?php for ($d = 1; $d <= 7; $d++): ?>
                    <label>
                        <input type="checkbox" name="days[]" value="<?php echo $d; ?>"
                               class="day-checkbox" <?php echo in_array($d, $selectedDays) ? 'checked' : ''; ?>>
                        Day <?php echo $d; ?>
                    </label>
                <?php endfor; ?>
            </div>
        </div>

        <div class="filter-actions">
            <button type="submit" class="btn-apply"><i class="fa fa-filter"></i> Apply Filters</button>
            <button type="button" class="btn-reset" onclick="window.location='?action=manage&type=summary'">
                <i class="fa fa-refresh"></i> Reset
            </button>
            <?php if ($manageTable): ?>
            <button type="button" class="export-btn" onclick="exportToExcel()">
                <i class="fa fa-file-excel-o"></i> Export Excel
            </button>
            <?php if ($_SESSION['role'] !== 'viewer'): ?>
            <button type="button" class="btn-edit" id="editRowBtn" onclick="editSelectedRow()" disabled>
                <i class="fa fa-edit"></i> Edit
            </button>
            <button type="button" class="btn-delete" id="deleteRowBtn" onclick="confirmDeleteRow()" disabled>
                <i class="fa fa-trash"></i> Delete
            </button>
            <?php endif; ?>
            <?php endif; ?>
        </div>
    </form>
</div>

<?php $allCols = []; ?>
<?php if ($manageTable): ?>

<!-- ══════════════════════════════════════════════════════
     DATA TABLE
     ══════════════════════════════════════════════════════ -->
<div class="table-container">
    <?php
    $baseCols  = ['TEAM','MONTH','YEAR','LINE','SKU_CODE','SKU_DESCRIPTION','QUANTITY','UOM','CUMULATIVE_OUTPUT','OPERATING_DAYS_START','OPERATING_DAYS_END'];
    $shiftCols = [];
    for ($d = 1; $d <= 7; $d++) {
        if (in_array($d, $selectedDays)) {
            $shiftCols[] = "1ST_SHIFT_DAY_$d";
            $shiftCols[] = "2ND_SHIFT_DAY_$d";
            $shiftCols[] = "3RD_SHIFT_DAY_$d";
        }
    }
    $allCols = array_merge($baseCols, $shiftCols);

    $where  = []; $params = []; $types = '';

    if ($_SESSION['role'] === 'data_entry') {
        $where[]  = 'TEAM = ?'; $params[] = $_SESSION['team']; $types .= 's';
        $where[]  = 'LINE = ?'; $params[] = $_SESSION['line']; $types .= 's';
    }

    if (!empty($filterMonth)) { $where[] = "MONTH = ?"; $params[] = $filterMonth; $types .= 's'; }
    [$lineInClause, $lineInParams, $lineInTypes] = buildLineIn($filterLines);
    if ($lineInClause) { $where[] = substr($lineInClause, 5); $params = array_merge($params, $lineInParams); $types .= $lineInTypes; }

    $sql = "SELECT id, " . implode(',', $allCols) . " FROM `$manageTable`";
    if (!empty($where)) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY YEAR DESC, MONTH DESC";

    $stmt = $conn->prepare($sql);
    if (!empty($params)) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    echo '<table class="data-table" id="manageTable"><thead><tr>';
    foreach ($allCols as $col) echo '<th>' . htmlspecialchars(str_replace('_', ' ', $col)) . '</th>';
    echo '</tr></thead><tbody>';
    if ($result->num_rows > 0) {
        while ($row = $result->fetch_assoc()) {
            echo '<tr data-id="' . (int)$row['id'] . '">';
            foreach ($allCols as $col) echo '<td>' . htmlspecialchars($row[$col] ?? '') . '</td>';
            echo '</tr>';
        }
    } else {
        echo '<tr><td colspan="' . count($allCols) . '">No records found.</td></tr>';
    }
    echo '</tbody></table>';
    ?>
</div>

<!-- JS bootstrap: pass PHP vars to add_edit.js -->
<script>
    window.AE_csrfToken    = <?php echo json_encode($csrf_token); ?>;
    window.AE_manageTable  = <?php echo json_encode($manageTable); ?>;
    window.AE_linesByTeam  = <?php echo $lines_json; ?>;
    window.AE_selectedLine = <?php echo json_encode(!empty($filterLines) ? $filterLines[0] : ''); ?>;
    window.AE_isViewer     = <?php echo json_encode($_SESSION['role'] === 'viewer'); ?>;
</script>

<?php else: ?>
    <p>Please select a table to view records.</p>
<?php endif; ?>