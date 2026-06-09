<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Line Report Record & LIPAS VOLPAS Management</title>
    <link rel="icon" href="images/p_icon.png" type="image/png">
    <link rel="stylesheet" href="css/mainpage.css">
    <link rel="stylesheet" href="css/manage_users.css">
    <link rel="stylesheet" href="css/manage_report.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <style>
        .report-modal { display: none; position: fixed; z-index: 1000; inset: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); }
        .report-modal.active { display: block; }
        .report-modal-box { position: absolute; top: 50%; left: 50%; transform: translate(-50%,-50%); background: white; padding: 25px 30px; border-radius: 16px; max-width: 480px; width: 90%; box-shadow: 0 20px 40px rgba(0,0,0,0.2); animation: slideUp 0.25s ease-out; }
        .report-modal-box h3 { margin-top: 0; }
        .report-modal-actions { margin-top: 20px; display: flex; gap: 10px; justify-content: flex-end; }
        .btn-save-report { background: #8b5cf6; color: white; border: none; padding: 10px 20px; border-radius: 30px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; transition: all 0.3s; box-shadow: 0 4px 10px rgba(139, 92, 246, 0.3); }
        .btn-save-report:hover { background: #7c3aed; transform: translateY(-2px); }
        .btn-update { background: #3b82f6; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; }
        .btn-cancel { background: #64748b; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-weight: 600; cursor: pointer; }
        .btn-add-lipas { display: none; }
        .week-radio-group { margin: 16px 0; }
        .week-radio-group label { display: block; padding: 8px 0; cursor: pointer; }
        .week-radio-group input { margin-right: 8px; }
        .existing-data { font-size: 0.9em; color: #64748b; }
    </style>
</head>
<body>
<div class="page-bg">
    <?php include __DIR__ . '/../templates/loader.php'; ?>

    <header class="header">
        <h1><img src="images/pioneerlogo.png" alt="Logo" style="height:1.2em; vertical-align:middle; margin-right:8px;">Line Report & LIPAS VOLPAS Management</h1>
        <form id="logoutForm" method="post" action="logout.php" style="display:none;">
            <input type="hidden" name="logout" value="1">
        </form>
        <button type="button" class="logout-btn" onclick="openLogoutModal()">Logout</button>
    </header>

    <nav class="navbar user-welcome">
        <?php
        $userRoleIcons = ['system_admin' => 'fa-shield', 'data_entry' => 'fa-pencil', 'viewer' => 'fa-eye'];
        $userRoleLabels = ['system_admin' => 'System Admin', 'data_entry' => 'Data Entry', 'viewer' => 'Viewer'];
        $currentRoleIcon = $userRoleIcons[$_SESSION['role']] ?? 'fa-user';
        $currentRoleLabel = $userRoleLabels[$_SESSION['role']] ?? ucfirst($_SESSION['role'] ?? '');
        ?>
        <span><i class="fa fa-user-circle"></i> Welcome, <?php echo htmlspecialchars($_SESSION['user']); ?> &nbsp;|&nbsp;
              <i class="fa <?php echo $currentRoleIcon; ?>"></i> <?php echo $currentRoleLabel; ?></span>
    </nav>

    <nav class="navbar">
        <div class="dropdown">
            <button class="dropbtn">Line Report & LIPAS VOLPAS <i class="fa fa-caret-down"></i></button>
            <div class="dropdown-content">
                <?php if ($_SESSION['role'] !== 'viewer'): ?>
                <a href="?action=add&type=report"><i class="fa fa-plus-circle"></i> Formulate Line Report</a>
                <?php endif; ?>
                <a href="?action=manage&type=line_report"><i class="fa fa-file-text-o"></i> Manage Line Report</a>
                <a href="?action=manage&type=report"><i class="fa fa-table"></i> Manage Lipas Volpas</a>
            </div>
        </div>
    </nav>

    <div class="wrapper">
        <aside class="sidebar sticky-sidebar">
            <ul>
                <li><a href="mainpage.php"><i class="fa fa-tachometer"></i>Dashboard Page</a></li>
                <li><a href="add_edit.php"><i class="fa fa-table"></i> Manage Production Records</a></li>
                <li class="active"><a href="manage_report.php"><i class="fa fa-file-text-o"></i> Line Report Records & LIPAS VOLPAS</a></li>
                <?php if ($_SESSION['role'] === 'system_admin'): ?>
                    <li class="admin-section-label"><span>Admin Access</span></li>
                    <li>
                        <a href="manage_users.php"><i class="fa fa-users"></i> User Management
                            <?php if ($pendingUsersCount > 0): ?><span class="mu-nav-badge"><?php echo $pendingUsersCount; ?></span><?php endif; ?>
                        </a>
                    </li>
                    <li><a href="import_data.php"><i class="fa fa-upload"></i> Import Records</a></li>
                    <li><a href="audit_log.php"><i class="fa fa-history"></i> Audit Trail</a></li>
                <?php endif; ?>
            </ul>
        </aside>

        <main class="main-content">
            <?php if ($action == 'add' && $type == 'report'): ?>
                <!-- ===== FORMULATE LINE REPORT ===== -->
                <div class="page-header">
                    <h2>Formulate Line Report</h2>
                    <p class="text-muted">Select filters and click Apply. Reports are generated per selected day.</p>
                </div>

                <div class="filter-card">
                    <form method="get" id="reportForm">
                        <input type="hidden" name="action" value="add">
                        <input type="hidden" name="type" value="report">
                        <div class="filter-row">
                            <div class="filter-group"><label>Team</label><select name="team" onchange="this.form.submit()"><option value="">-- Select Team --</option><option value="A" <?php echo $filterTeam == 'A' ? 'selected' : ''; ?>>Team A (<?php echo $teamCounts['A'] ?? 0 ?>)</option><option value="B" <?php echo $filterTeam == 'B' ? 'selected' : ''; ?>>Team B (<?php echo $teamCounts['B'] ?? 0 ?>)</option><option value="C" <?php echo $filterTeam == 'C' ? 'selected' : ''; ?>>Team C (<?php echo $teamCounts['C'] ?? 0 ?>)</option></select></div>
                            <div class="filter-group"><label>Year</label><select name="year" <?php echo $filterTeam ? '' : 'disabled'; ?>><?php for ($y = date('Y')-2; $y <= date('Y')+2; $y++): $cnt = $yearCounts[$y] ?? 0; ?><option value="<?php echo $y; ?>" <?php echo $filterYear == $y ? 'selected' : ''; ?>><?php echo $y; ?> (<?php echo $cnt ?>)</option><?php endfor; ?></select></div>
                            <div class="filter-group"><label>Month</label><select name="month" <?php echo $filterTeam ? '' : 'disabled'; ?>><option value="">All</option><?php foreach ($months as $m): $cnt = $monthCounts[$m] ?? 0; ?><option value="<?php echo $m; ?>" <?php echo $filterMonth == $m ? 'selected' : ''; ?>><?php echo $m; ?> (<?php echo $cnt ?>)</option><?php endforeach; ?></select></div>
                            <div class="filter-group"><label>Prod. Days</label><select name="ops_days" id="opsDaysSelect" onchange="handleOpsDaysChange(this)" <?php echo ($filterTeam && $filterMonth) ? '' : 'disabled'; ?>><option value="">All</option><?php foreach ($opsDaysOptions as $od): $val = $od['OPERATING_DAYS_START'] . '|' . $od['OPERATING_DAYS_END']; $label = date('M d', strtotime($od['OPERATING_DAYS_START'])) . ' – ' . date('M d, Y', strtotime($od['OPERATING_DAYS_END'])); ?><option value="<?php echo $val; ?>" <?php echo $selectedOpsDays == $val ? 'selected' : ''; ?>><?php echo $label; ?></option><?php endforeach; ?></select></div>
                            <div class="filter-group"><label>Line</label><div class="filter-dropdown" id="lineDropdown"><button type="button" class="filter-dropdown-btn" id="lineDropdownBtn" onclick="toggleLineDropdown(event)" <?php echo $filterTeam ? '' : 'disabled'; ?>><?php echo !empty($filterLines) ? (count($filterLines) === 1 ? htmlspecialchars($filterLines[0]) : count($filterLines) . ' lines') : 'All Lines'; ?> <span class="arrow">▾</span></button><div class="filter-dropdown-panel" id="lineDropdownPanel"><label class="filter-checkbox-item select-all-item"><input type="checkbox" id="selectAllLinesF" onclick="toggleAllLinesF(this)"> <span>Select All</span></label><hr class="filter-divider"><?php foreach ($linesFromMaster as $ln): ?><label class="filter-checkbox-item"><input type="checkbox" name="line[]" value="<?php echo htmlspecialchars($ln); ?>" class="line-checkbox-f" <?php echo in_array($ln, $filterLines) ? 'checked' : ''; ?>><span><?php echo htmlspecialchars($ln); ?></span></label><?php endforeach; ?></div></div></div>
                            <div class="filter-group"><label>Day</label><input type="date" name="as_of_date" id="asOfDateInput" value="<?php echo htmlspecialchars($asOfDate); ?>" <?php echo ($filterTeam && !empty($selectedOpsDays)) ? '' : 'disabled'; ?>></div>
                            <div class="filter-group"><label>Shift</label><div class="filter-dropdown" id="shiftDropdown"><button type="button" class="filter-dropdown-btn" id="shiftDropdownBtn" onclick="toggleShiftDropdown(event)" <?php echo $filterTeam ? '' : 'disabled'; ?>><?php echo count($selectedShifts) === 3 ? 'All Shifts' : (count($selectedShifts) === 1 ? $selectedShifts[0] . ($selectedShifts[0]==1?'st':($selectedShifts[0]==2?'nd':'rd')).' Shift' : count($selectedShifts).' shifts'); ?> <span class="arrow">▾</span></button><div class="filter-dropdown-panel" id="shiftDropdownPanel"><label class="filter-checkbox-item select-all-item"><input type="checkbox" id="selectAllShifts" onclick="toggleAllShifts(this)"> <span>Select All</span></label><hr class="filter-divider"><label class="filter-checkbox-item"><input type="checkbox" name="shift[]" value="1" class="shift-checkbox" <?php echo in_array(1,$selectedShifts)?'checked':''; ?>><span>1st Shift (6AM‑2PM)</span></label><label class="filter-checkbox-item"><input type="checkbox" name="shift[]" value="2" class="shift-checkbox" <?php echo in_array(2,$selectedShifts)?'checked':''; ?>><span>2nd Shift (2PM‑10PM)</span></label><label class="filter-checkbox-item"><input type="checkbox" name="shift[]" value="3" class="shift-checkbox" <?php echo in_array(3,$selectedShifts)?'checked':''; ?>><span>3rd Shift (10PM‑6AM)</span></label></div></div></div>
                            <div class="filter-actions"><button type="submit" class="btn-apply"><i class="fa fa-filter"></i> Apply</button><button type="button" class="btn-outline" onclick="window.location='?action=add&type=report'"><i class="fa fa-refresh"></i> Reset</button></div>
                        </div>
                    </form>
                    <div class="filter-hint"><i class="fa fa-info-circle"></i> Select Team, Month, Prod. Days, and a Day to formulate the report.</div>
                </div>

                <?php if (!empty($shiftsData)): ?>
                    <?php foreach ($selectedShifts as $shiftNum): ?>
                        <?php $sdata = $shiftsData[$shiftNum]; $rows = $sdata['rows']; $totals = $sdata['totals']; $skuCnt = $sdata['skuCount'];
                              $lipasPct = ($skuCnt > 0) ? min(100, round(($totals['lipasCount'] / $skuCnt) * 100)) : 0;
                              $volpasPct = ($totals['quantity'] > 0) ? min(100, round(($totals['cumulative'] / $totals['quantity']) * 100)) : 0;
                              $shiftLabel = $shiftNum . ($shiftNum==1?'st':($shiftNum==2?'nd':'rd')).' Shift'; ?>
                        <h3><?php echo $shiftLabel; ?> Report – <?php echo date('M d, Y', strtotime($asOfDate)); ?></h3>
                        <div class="table-card" style="margin-bottom:30px;">
                            <div class="table-header"><span><strong><?php echo $shiftLabel; ?></strong> – <?php echo count($rows); ?> SKUs</span><button type="button" class="btn-success" onclick="exportTableToExcel('shiftTable<?php echo $shiftNum; ?>', <?php echo json_encode($filterTeam.'_'.$filterMonth.'_'.$shiftLabel); ?>)"><i class="fa fa-file-excel-o"></i> Export</button></div>
                            <div class="table-responsive"><table class="data-table" id="shiftTable<?php echo $shiftNum; ?>"><thead><tr><th>TEAM</th><th>LINE</th><th>SKU CODE</th><th>SKU DESCRIPTION</th><th>QUANTITY</th><th>UOM</th><th>SHIFT OUTPUT</th><th>CUMULATIVE</th><th>OPS START</th><th>OPS END</th><th>LIPAS</th><th>VOLPAS</th></tr></thead><tbody><?php foreach ($rows as $r): ?><tr><td><?php echo $r['TEAM']; ?></td><td><?php echo htmlspecialchars($r['LINE']); ?></td><td><?php echo htmlspecialchars($r['SKU_CODE']); ?></td><td><?php echo htmlspecialchars($r['SKU_DESCRIPTION']); ?></td><td><?php echo number_format($r['QUANTITY']); ?></td><td><?php echo $r['UOM']; ?></td><td><?php echo number_format($r['SHIFT_OUTPUT']); ?></td><td><?php echo number_format($r['CUMULATIVE_OUTPUT']); ?></td><td><?php echo htmlspecialchars($r['OPERATING_DAYS_START'] ?? ''); ?></td><td><?php echo htmlspecialchars($r['OPERATING_DAYS_END'] ?? ''); ?></td><td><?php echo $r['LIPAS_COUNT']; ?></td><td><?php echo $r['VOLPAS']; ?></td></tr><?php endforeach; ?></tbody></table></div></div>
                        <div class="summary-stats" style="margin-bottom:20px;"><div class="stat-item"><label>QUANTITY</label><input type="text" readonly value="<?php echo number_format($totals['quantity']); ?>"></div><div class="stat-item"><label>CUMULATIVE</label><input type="text" readonly value="<?php echo number_format($totals['cumulative']); ?>"></div><div class="stat-item"><label>SKU COUNT</label><input type="text" readonly value="<?php echo $skuCnt; ?>"></div><div class="stat-item lipas-group"><label>LIPAS COUNT</label><div class="lipas-inputs"><input type="text" readonly value="<?php echo $totals['lipasCount']; ?>" style="width:60px;"><span class="lipas-divider">/</span><input type="text" readonly value="<?php echo $lipasPct; ?>%" style="width:80px;"></div></div><div class="stat-item"><label>VOLPAS</label><input type="text" readonly value="<?php echo $volpasPct; ?>%"></div><div class="stat-item"><label>SHIFT OUTPUT</label><input type="text" readonly value="<?php echo number_format($totals['shiftOutput']); ?>"></div></div>
                    <?php endforeach; ?>

                    <div style="margin-top:10px; display:flex; gap:10px;">
                        <button type="button" class="btn-save-report" onclick="saveAllDaysToReportLine()"><i class="fa fa-save"></i> Save All Days</button>
                        <button type="button" class="btn-add-lipas" onclick="openLvWeekModal()"><i class="fa fa-database"></i> Add to LIPAS VOLPAS Data</button>
                    </div>

                <?php elseif ($summaryTable && $filterMonth): ?>
                    <div class="table-card"><div class="table-header"><h3>No records found</h3></div><div class="empty-state"><p>No production data for the selected filters.</p></div></div>
                <?php else: ?>
                    <div class="table-card"><div class="table-header"><h3>Production Records</h3></div><div class="empty-state"><i class="fa fa-database"></i><p>Select a Team to get started.</p></div></div>
                <?php endif; ?>

                <!-- Confirm Modal -->
                <div id="confirmModal" class="report-modal"><div class="report-modal-box"><h3>Data already exists</h3><p>Report data for this month already exists. Overwrite?</p><div class="report-modal-actions"><button class="btn-cancel" onclick="closeConfirmModal()">Cancel</button><button class="btn-update" onclick="confirmSaveAllDays()">Yes, Overwrite</button></div></div></div>

                <!-- LIPAS VOLPAS Week Modal (unchanged) -->
                <div id="lvWeekModal" class="report-modal"><div class="report-modal-box"><h3>Add to LIPAS VOLPAS Data</h3><p>Select a slot to save the current plan & actual values.</p><div class="week-radio-group" id="weekOptionsContainer"></div><div class="report-modal-actions"><button class="btn-cancel" onclick="closeLvWeekModal()">Cancel</button><button class="btn-update" onclick="submitLvWeek()">Save</button></div></div></div>

            <?php elseif ($action == 'manage' && $type == 'line_report'): ?>
                <!-- ===== MANAGE LINE REPORT ===== -->
                <div class="page-header"><h2>Manage Line Report Records</h2><p class="text-muted">View saved line report data.</p></div>
                <div class="filter-card">
                    <form method="get" id="manageReportForm"><input type="hidden" name="action" value="manage"><input type="hidden" name="type" value="line_report">
                        <div class="filter-row">
                            <div class="filter-group"><label>Team</label><select name="team" onchange="this.form.submit()"><option value="">All Teams</option><option value="A" <?php echo $reportFilterTeam == 'A' ? 'selected' : ''; ?>>Team A (<?php echo $mngTeamCounts['A'] ?? 0 ?>)</option><option value="B" <?php echo $reportFilterTeam == 'B' ? 'selected' : ''; ?>>Team B (<?php echo $mngTeamCounts['B'] ?? 0 ?>)</option><option value="C" <?php echo $reportFilterTeam == 'C' ? 'selected' : ''; ?>>Team C (<?php echo $mngTeamCounts['C'] ?? 0 ?>)</option></select></div>
                            <div class="filter-group"><label>Year</label><select name="year" <?php echo $reportFilterTeam ? '' : 'disabled'; ?>><?php for ($y = date('Y')-2; $y <= date('Y')+2; $y++): $cnt = $mngYearCounts[$y] ?? 0; ?><option value="<?php echo $y; ?>" <?php echo $reportFilterYear == $y ? 'selected' : ''; ?>><?php echo $y; ?> (<?php echo $cnt ?>)</option><?php endfor; ?></select></div>
                            <div class="filter-group"><label>Month</label><select name="month" <?php echo $reportFilterTeam ? '' : 'disabled'; ?>><option value="">All</option><?php foreach ($months as $m): $cnt = $mngMonthCounts[$m] ?? 0; ?><option value="<?php echo $m; ?>" <?php echo $reportFilterMonth == $m ? 'selected' : ''; ?>><?php echo $m; ?> (<?php echo $cnt ?>)</option><?php endforeach; ?></select></div>
                            <div class="filter-group"><label>Prod. Days</label><select name="ops_days" onchange="this.form.submit()" <?php echo ($reportFilterTeam && $reportFilterMonth) ? '' : 'disabled'; ?>><option value="">All</option><?php foreach ($opsDaysOptions as $od): $val = $od['OPERATING_DAYS_START'] . '|' . $od['OPERATING_DAYS_END']; $label = date('M d', strtotime($od['OPERATING_DAYS_START'])) . ' – ' . date('M d, Y', strtotime($od['OPERATING_DAYS_END'])); ?><option value="<?php echo $val; ?>" <?php echo $selectedOpsDays == $val ? 'selected' : ''; ?>><?php echo $label; ?></option><?php endforeach; ?></select></div>
                            <div class="filter-group"><label>Line</label><div class="filter-dropdown" id="lineDropdown2"><button type="button" class="filter-dropdown-btn" id="lineDropdownBtn2" onclick="toggleLineDropdown2(event)" <?php echo $reportFilterTeam ? '' : 'disabled'; ?>><?php echo !empty($reportFilterLines) ? (count($reportFilterLines) === 1 ? htmlspecialchars($reportFilterLines[0]) : count($reportFilterLines).' lines') : 'All Lines'; ?> <span class="arrow">▾</span></button><div class="filter-dropdown-panel" id="lineDropdownPanel2"><label class="filter-checkbox-item select-all-item"><input type="checkbox" id="selectAllLinesM" onclick="toggleAllLinesM(this)"> <span>Select All</span></label><hr class="filter-divider"><?php $manageLinesFromMaster = []; if ($reportFilterTeam) { $stmt = $conn->prepare("SELECT DISTINCT LINE FROM sku_master WHERE TEAM = ? AND LINE IS NOT NULL AND LINE != '' ORDER BY LINE"); $stmt->bind_param('s', $reportFilterTeam); $stmt->execute(); $res = $stmt->get_result(); while ($lr = $res->fetch_assoc()) $manageLinesFromMaster[] = $lr['LINE']; } foreach ($manageLinesFromMaster as $ln): ?><label class="filter-checkbox-item"><input type="checkbox" name="line[]" value="<?php echo htmlspecialchars($ln); ?>" class="line-checkbox-m" <?php echo in_array($ln, $reportFilterLines) ? 'checked' : ''; ?>><span><?php echo htmlspecialchars($ln); ?></span></label><?php endforeach; ?></div></div></div>
                            <div class="filter-group"><label>Day</label><input type="date" name="as_of_date" id="asOfDateInput2" value="<?php echo htmlspecialchars($reportAsOfDate); ?>" <?php echo $reportFilterTeam ? '' : 'disabled'; ?>></div>
                            <div class="filter-group"><label>Shift</label><div class="filter-dropdown" id="shiftDropdown2"><button type="button" class="filter-dropdown-btn" id="shiftDropdownBtn2" onclick="toggleShiftDropdown2(event)" <?php echo $reportFilterTeam ? '' : 'disabled'; ?>><?php echo count($selectedShifts) === 3 ? 'All Shifts' : (count($selectedShifts) === 1 ? $selectedShifts[0] . ($selectedShifts[0]==1?'st':($selectedShifts[0]==2?'nd':'rd')).' Shift' : count($selectedShifts).' shifts'); ?> <span class="arrow">▾</span></button><div class="filter-dropdown-panel" id="shiftDropdownPanel2"><label class="filter-checkbox-item select-all-item"><input type="checkbox" id="selectAllShifts2" onclick="toggleAllShifts2(this)"> <span>Select All</span></label><hr class="filter-divider"><label class="filter-checkbox-item"><input type="checkbox" name="shift[]" value="1" class="shift-checkbox2" <?php echo in_array(1,$selectedShifts)?'checked':''; ?>><span>1st Shift (6AM‑2PM)</span></label><label class="filter-checkbox-item"><input type="checkbox" name="shift[]" value="2" class="shift-checkbox2" <?php echo in_array(2,$selectedShifts)?'checked':''; ?>><span>2nd Shift (2PM‑10PM)</span></label><label class="filter-checkbox-item"><input type="checkbox" name="shift[]" value="3" class="shift-checkbox2" <?php echo in_array(3,$selectedShifts)?'checked':''; ?>><span>3rd Shift (10PM‑6AM)</span></label></div></div></div>
                            <div class="filter-actions"><button type="submit" class="btn-apply"><i class="fa fa-filter"></i> Apply</button><button type="button" class="btn-outline" onclick="window.location='?action=manage&type=line_report'"><i class="fa fa-refresh"></i> Reset</button></div>
                        </div>
                    </form>
                    <div class="filter-hint"><i class="fa fa-info-circle"></i> View saved report line data.</div>
                </div>

                <?php if (!empty($reportShiftsData)): ?>
                    <?php foreach ($selectedShifts as $shiftNum): ?>
                        <?php $sdata = $reportShiftsData[$shiftNum] ?? ['rows' => [], 'totals' => [], 'skuCount' => 0]; $rows = $sdata['rows']; $totals = $sdata['totals']; $skuCnt = $sdata['skuCount'];
                              $lipasPct = ($skuCnt > 0) ? min(100, round(($totals['lipasCount'] / $skuCnt) * 100)) : 0;
                              $volpasPct = ($totals['quantity'] > 0) ? min(100, round(($totals['cumulative'] / $totals['quantity']) * 100)) : 0;
                              $shiftLabel = $shiftNum . ($shiftNum==1?'st':($shiftNum==2?'nd':'rd')).' Shift'; ?>
                        <h3><?php echo $shiftLabel; ?> Report (Saved)</h3>
                        <div class="table-card" style="margin-bottom:30px;"><div class="table-header"><span><strong><?php echo $shiftLabel; ?></strong> – <?php echo count($rows); ?> SKUs</span><button type="button" class="btn-success" onclick="exportTableToExcel('reportShiftTable<?php echo $shiftNum; ?>', <?php echo json_encode($reportFilterTeam.'_'.$reportFilterMonth.'_Saved_'.$shiftLabel); ?>)"><i class="fa fa-file-excel-o"></i> Export</button></div><div class="table-responsive"><table class="data-table" id="reportShiftTable<?php echo $shiftNum; ?>"><thead><tr><th>TEAM</th><th>LINE</th><th>SKU CODE</th><th>SKU DESCRIPTION</th><th>QUANTITY</th><th>UOM</th><th>SHIFT OUTPUT</th><th>CUMULATIVE</th><th>OPS START</th><th>OPS END</th><th>LIPAS</th><th>VOLPAS</th></tr></thead><tbody><?php foreach ($rows as $r): ?><tr><td><?php echo $r['TEAM']; ?></td><td><?php echo htmlspecialchars($r['LINE']); ?></td><td><?php echo htmlspecialchars($r['SKU_CODE']); ?></td><td><?php echo htmlspecialchars($r['SKU_DESCRIPTION']); ?></td><td><?php echo number_format($r['QUANTITY']); ?></td><td><?php echo $r['UOM']; ?></td><td><?php echo number_format($r['SHIFT_OUTPUT']); ?></td><td><?php echo number_format($r['CUMULATIVE_OUTPUT']); ?></td><td><?php echo htmlspecialchars($r['OPERATING_DAYS_START'] ?? ''); ?></td><td><?php echo htmlspecialchars($r['OPERATING_DAYS_END'] ?? ''); ?></td><td><?php echo $r['LIPAS_COUNT']; ?></td><td><?php echo $r['VOLPAS']; ?></td></tr><?php endforeach; ?></tbody></table></div></div>
                        <div class="summary-stats" style="margin-bottom:20px;"><div class="stat-item"><label>QUANTITY</label><input type="text" readonly value="<?php echo number_format($totals['quantity']); ?>"></div><div class="stat-item"><label>CUMULATIVE</label><input type="text" readonly value="<?php echo number_format($totals['cumulative']); ?>"></div><div class="stat-item"><label>SKU COUNT</label><input type="text" readonly value="<?php echo $skuCnt; ?>"></div><div class="stat-item lipas-group"><label>LIPAS COUNT</label><div class="lipas-inputs"><input type="text" readonly value="<?php echo $totals['lipasCount']; ?>" style="width:60px;"><span class="lipas-divider">/</span><input type="text" readonly value="<?php echo $lipasPct; ?>%" style="width:80px;"></div></div><div class="stat-item"><label>VOLPAS</label><input type="text" readonly value="<?php echo $volpasPct; ?>%"></div><div class="stat-item"><label>SHIFT OUTPUT</label><input type="text" readonly value="<?php echo number_format($totals['shiftOutput']); ?>"></div></div>
                    <?php endforeach; ?>
                <?php elseif ($reportFilterYear && $reportFilterMonth): ?>
                    <div class="table-card"><div class="table-header"><h3>No records found</h3></div><div class="empty-state"><p>No saved report data.</p></div></div>
                <?php else: ?>
                    <div class="table-card"><div class="table-header"><h3>Saved Report Records</h3></div><div class="empty-state"><i class="fa fa-database"></i><p>Select filters and Apply.</p></div></div>
                <?php endif; ?>

            <?php elseif ($action == 'manage' && $type == 'report'): ?>
                <!-- ===== MANAGE LIPAS VOLPAS (unchanged, but refactored) ===== -->
                <h2>Manage LIPAS & VOLPAS Records</h2>
                <p class="text-muted">Plan vs Actual records, grouped by operating days.</p>

                <div class="filter-card" style="margin-bottom:20px;">
                    <form method="get">
                        <input type="hidden" name="action" value="manage"><input type="hidden" name="type" value="report">
                        <div class="filter-row">
                            <div class="filter-group"><label>Team</label><select name="team_manage"><option value="">All Teams</option><option value="A" <?php echo $filterTeamManage == 'A' ? 'selected' : ''; ?>>Team A</option><option value="B" <?php echo $filterTeamManage == 'B' ? 'selected' : ''; ?>>Team B</option><option value="C" <?php echo $filterTeamManage == 'C' ? 'selected' : ''; ?>>Team C</option></select></div>
                            <div class="filter-group"><label>Year</label><select name="year_manage"><?php for ($y = date('Y')-2; $y <= date('Y')+2; $y++): ?><option value="<?php echo $y; ?>" <?php echo $filterYearManage == $y ? 'selected' : ''; ?>><?php echo $y; ?></option><?php endfor; ?></select></div>
                            <div class="filter-group"><label>Month</label><select name="month_manage"><option value="all">All Months</option><?php foreach ($months as $m): ?><option value="<?php echo $m; ?>" <?php echo $filterMonthManage == $m ? 'selected' : ''; ?>><?php echo $m; ?></option><?php endforeach; ?></select></div>
                            <div class="filter-group"><label>Prod. Days</label><select name="ops_days_manage"><option value="">All (aggregated)</option><?php $opsOptions = []; $opsRes = $conn->query("SELECT DISTINCT OPERATING_DAYS_START, OPERATING_DAYS_END FROM lipas_record WHERE OPERATING_DAYS_START IS NOT NULL ORDER BY OPERATING_DAYS_START"); while ($od = $opsRes->fetch_assoc()) { $opsOptions[] = $od; } foreach ($opsOptions as $od): $val = $od['OPERATING_DAYS_START'] . '|' . $od['OPERATING_DAYS_END']; ?><option value="<?php echo $val; ?>" <?php echo ($filterOpsDaysManage == $val) ? 'selected' : ''; ?>><?php echo date('M d', strtotime($od['OPERATING_DAYS_START'])) . ' – ' . date('M d, Y', strtotime($od['OPERATING_DAYS_END'])); ?></option><?php endforeach; ?></select></div>
                            <div class="filter-group"><label>Line</label><button type="button" id="lineToggleBtn" class="btn-outline" style="padding:8px 16px;"><i class="fa fa-filter"></i> Select Lines ▼</button><div id="lineDropdownContent" class="days-dropdown-content" style="display:none; position:absolute; z-index:300;"><label><input type="checkbox" id="selectAllLines"> Select All</label><hr><?php foreach ($availableLines as $al): ?><label><input type="checkbox" name="lines[]" value="<?php echo htmlspecialchars($al); ?>" class="line-checkbox" <?php echo in_array($al, $selectedLinesManage) ? 'checked' : ''; ?>> <?php echo htmlspecialchars($al); ?></label><?php endforeach; ?></div></div>
                            <div class="filter-actions"><button type="submit" class="btn-apply"><i class="fa fa-filter"></i> Apply</button><button type="button" class="btn-outline" onclick="window.location='?action=manage&type=report'"><i class="fa fa-refresh"></i> Reset</button></div>
                        </div>
                    </form>
                </div>

                <?php if (!empty($lipasRecords) || !empty($volpasRecords)):
                    function renderPivotTable(string $title, string $icon, string $iconColor, string $badge, array $pivotData, array $pivotRanges, bool $isVolpas): void {
                        $tableClass = $isVolpas ? 'volpas-table' : 'lipas-table'; ?>
                        <div class="table-card lv-pivot-card" style="margin-bottom:30px;">
                            <div class="table-header"><h3><i class="fa <?php echo $icon; ?>" style="color:<?php echo $iconColor; ?>;"></i> <?php echo htmlspecialchars($title); ?></h3><span class="badge"><?php echo htmlspecialchars($badge); ?></span></div>
                            <div class="table-responsive"><table class="data-table <?php echo $tableClass; ?>"><thead><tr class="lv-thead-row1"><th class="lv-th-identity" rowspan="2">TEAM</th><th class="lv-th-identity" rowspan="2">MONTH</th><th class="lv-th-identity" rowspan="2">LINE</th><?php foreach ($pivotRanges as $rng): ?><th class="lv-th-range" colspan="2"><?php echo htmlspecialchars($rng['label']); ?></th><?php endforeach; ?><th class="lv-th-total" colspan="2">TOTAL</th><th class="lv-th-pct" rowspan="2">%</th></tr><tr class="lv-thead-row2"><?php foreach ($pivotRanges as $rng): ?><th class="lv-th-plan">Plan</th><th class="lv-th-actual">Actual</th><?php endforeach; ?><th class="lv-th-total-sub">Plan</th><th class="lv-th-total-sub">Actual</th></tr></thead><tbody><?php foreach ($pivotData as $row): $rowTotalPlan = $rowTotalActual = 0; foreach ($pivotRanges as $rk => $rng) { $rowTotalPlan += $row['ranges'][$rk]['plan'] ?? 0; $rowTotalActual += $row['ranges'][$rk]['actual'] ?? 0; } $rowPct = ($rowTotalPlan > 0) ? min(100, round(($rowTotalActual / $rowTotalPlan) * 100, 1)) : 0; $pctClass = $rowPct >= 100 ? 'pct-green' : ($rowPct >= 75 ? 'pct-amber' : 'pct-red'); ?><tr><td class="lv-td-identity"><?php echo htmlspecialchars($row['TEAM']); ?></td><td class="lv-td-identity"><?php echo htmlspecialchars(ucfirst(strtolower($row['MONTH']))); ?></td><td class="lv-td-identity"><?php echo htmlspecialchars($row['LINE']); ?></td><?php $colIdx = 0; foreach ($pivotRanges as $rk => $rng): $cell = $row['ranges'][$rk] ?? null; $groupCls = ($colIdx % 2 === 0) ? 'lv-td-range-a' : 'lv-td-range-b'; $colIdx++; ?><td class="lv-td-num <?php echo $groupCls; ?>"><?php echo $cell !== null ? ($isVolpas ? number_format($cell['plan']) : (int)$cell['plan']) : '<span class="lv-dash">—</span>'; ?></td><td class="lv-td-num <?php echo $groupCls; ?>"><?php echo $cell !== null ? ($isVolpas ? number_format($cell['actual']) : (int)$cell['actual']) : '<span class="lv-dash">—</span>'; ?></td><?php endforeach; ?><td class="lv-td-total"><?php echo $isVolpas ? number_format($rowTotalPlan) : (int)$rowTotalPlan; ?></td><td class="lv-td-total"><?php echo $isVolpas ? number_format($rowTotalActual) : (int)$rowTotalActual; ?></td><td class="lv-td-pct <?php echo $pctClass; ?>"><?php echo number_format($rowPct, 1); ?>%</td></tr><?php endforeach; ?></tbody></table></div></div>
                    <?php } ?>

                    <?php if (!$showDetailed):
                        renderPivotTable('LIPAS Summary', 'fa-check-circle', '#3b82f6', 'Plan vs Actual SKUs', $lipasPivot, $pivotRanges, false);
                        renderPivotTable('VOLPAS Summary', 'fa-bar-chart', '#10b981', 'Plan vs Actual Quantity', $volpasPivot, $pivotRanges, true);
                    else: ?>
                        <div class="table-card lv-pivot-card" style="margin-bottom:30px;"><div class="table-header"><h3><i class="fa fa-check-circle" style="color:#3b82f6;"></i> LIPAS Summary</h3><span class="badge">Plan vs Actual SKUs</span></div><div class="table-responsive"><table class="data-table lipas-table"><thead><tr class="lv-thead-row1"><th class="lv-th-identity">TEAM</th><th class="lv-th-identity">LINE</th><th class="lv-th-identity">Prod. Days</th><th class="lv-th-range" colspan="2">Days 1</th><th class="lv-th-range" colspan="2">Days 2</th><th class="lv-th-range" colspan="2">Days 3</th><th class="lv-th-range" colspan="2">Days 4</th><th class="lv-th-range" colspan="2">Days 5</th><th class="lv-th-total" colspan="2">TOTAL</th><th class="lv-th-pct">%</th></tr><tr class="lv-thead-row2"><th></th><th></th><th></th><th class="lv-th-plan">Plan</th><th class="lv-th-actual">Actual</th><th class="lv-th-plan">Plan</th><th class="lv-th-actual">Actual</th><th class="lv-th-plan">Plan</th><th class="lv-th-actual">Actual</th><th class="lv-th-plan">Plan</th><th class="lv-th-actual">Actual</th><th class="lv-th-plan">Plan</th><th class="lv-th-actual">Actual</th><th class="lv-th-total-sub">Plan</th><th class="lv-th-total-sub">Actual</th><th></th></tr></thead><tbody><?php foreach ($lipasRecords as $r): $dPct = min(100, (float)($r['PERCENTAGE'] ?? 0)); $dPctCls = $dPct >= 100 ? 'pct-green' : ($dPct >= 75 ? 'pct-amber' : 'pct-red'); ?><tr><td class="lv-td-identity"><?php echo htmlspecialchars($r['TEAM']); ?></td><td class="lv-td-identity"><?php echo htmlspecialchars($r['LINE']); ?></td><td class="lv-td-identity"><?php echo (!empty($r['OPERATING_DAYS_START']) && !empty($r['OPERATING_DAYS_END'])) ? date('M d', strtotime($r['OPERATING_DAYS_START'])) . ' – ' . date('M d, Y', strtotime($r['OPERATING_DAYS_END'])) : '—'; ?></td><td class="lv-td-num lv-td-range-a"><?php echo (int)round($r['OPERATING_DAYS_PLAN_1']); ?></td><td class="lv-td-num lv-td-range-a"><?php echo (int)round($r['OPERATING_DAYS_ACTUAL_1']); ?></td><td class="lv-td-num lv-td-range-b"><?php echo (int)round($r['OPERATING_DAYS_PLAN_2']); ?></td><td class="lv-td-num lv-td-range-b"><?php echo (int)round($r['OPERATING_DAYS_ACTUAL_2']); ?></td><td class="lv-td-num lv-td-range-a"><?php echo (int)round($r['OPERATING_DAYS_PLAN_3']); ?></td><td class="lv-td-num lv-td-range-a"><?php echo (int)round($r['OPERATING_DAYS_ACTUAL_3']); ?></td><td class="lv-td-num lv-td-range-b"><?php echo (int)round($r['OPERATING_DAYS_PLAN_4']); ?></td><td class="lv-td-num lv-td-range-b"><?php echo (int)round($r['OPERATING_DAYS_ACTUAL_4']); ?></td><td class="lv-td-num lv-td-range-a"><?php echo (int)round($r['OPERATING_DAYS_PLAN_5']); ?></td><td class="lv-td-num lv-td-range-a"><?php echo (int)round($r['OPERATING_DAYS_ACTUAL_5']); ?></td><td class="lv-td-total"><?php echo (int)round($r['TOTAL_PLAN']); ?></td><td class="lv-td-total"><?php echo (int)round($r['TOTAL_ACTUAL']); ?></td><td class="lv-td-pct <?php echo $dPctCls; ?>"><?php echo number_format($dPct, 1); ?>%</td></tr><?php endforeach; ?></tbody></table></div></div>
                        <div class="table-card" style="margin-bottom:30px;"><div class="table-header"><h3><i class="fa fa-bar-chart" style="color:#10b981;"></i> VOLPAS Summary</h3><span class="badge">Plan vs Actual Quantity</span></div><div class="table-responsive"><table class="data-table volpas-table"><thead><tr><th>TEAM</th><th>LINE</th><th>Prod. Days</th><th colspan="2">Days 1</th><th colspan="2">Days 2</th><th colspan="2">Days 3</th><th colspan="2">Days 4</th><th colspan="2">Days 5</th><th colspan="2">TOTAL</th><th>%</th></tr><tr><th></th><th></th><th></th><th>Plan</th><th>Actual</th><th>Plan</th><th>Actual</th><th>Plan</th><th>Actual</th><th>Plan</th><th>Actual</th><th>Plan</th><th>Actual</th><th>Plan</th><th>Actual</th><th></th></tr></thead><tbody><?php foreach ($volpasRecords as $r): ?><tr><td><?php echo htmlspecialchars($r['TEAM']); ?></td><td><?php echo htmlspecialchars($r['LINE']); ?></td><td><?php echo (!empty($r['OPERATING_DAYS_START']) && !empty($r['OPERATING_DAYS_END'])) ? date('M d', strtotime($r['OPERATING_DAYS_START'])) . ' – ' . date('M d, Y', strtotime($r['OPERATING_DAYS_END'])) : '—'; ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_PLAN_1'])); ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_ACTUAL_1'])); ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_PLAN_2'])); ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_ACTUAL_2'])); ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_PLAN_3'])); ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_ACTUAL_3'])); ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_PLAN_4'])); ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_ACTUAL_4'])); ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_PLAN_5'])); ?></td><td><?php echo number_format(round($r['OPERATING_DAYS_ACTUAL_5'])); ?></td><td><?php echo number_format(round($r['TOTAL_PLAN'])); ?></td><td><?php echo number_format(round($r['TOTAL_ACTUAL'])); ?></td><td><?php echo number_format(min(100, $r['PERCENTAGE']), 1); ?>%</td></tr><?php endforeach; ?></tbody></table></div></div>
                    <?php endif; ?>

                    <div class="totals-lipas-volpas"><h3><i class="fa fa-calculator"></i> Totals of LIPAS VOLPAS</h3><div class="totals-grid"><div class="total-card lipas-total"><div class="total-label">LIPAS Total Plan</div><div class="total-value"><?php echo number_format($lipasTotalPlan); ?></div></div><div class="total-card lipas-total"><div class="total-label">LIPAS Total Actual</div><div class="total-value"><?php echo number_format($lipasTotalActual); ?></div></div><div class="total-card lipas-total"><div class="total-label">LIPAS Percentage</div><div class="total-value"><?php echo number_format($lipasGrandPercent, 1); ?>%</div></div><div class="total-card volpas-total"><div class="total-label">VOLPAS Total Plan</div><div class="total-value"><?php echo number_format($volpasTotalPlan); ?></div></div><div class="total-card volpas-total"><div class="total-label">VOLPAS Total Actual</div><div class="total-value"><?php echo number_format($volpasTotalActual); ?></div></div><div class="total-card volpas-total"><div class="total-label">VOLPAS Percentage</div><div class="total-value"><?php echo number_format($volpasGrandPercent, 1); ?>%</div></div></div></div>
                <?php else: ?>
                    <div class="table-card"><div class="empty-state"><i class="fa fa-database"></i><p>No LIPAS/VOLPAS records found.</p></div></div>
                <?php endif; ?>
            <?php endif; ?>
        </main>
    </div>

    <footer class="footer"><p>&copy; <?php echo date('Y'); ?> Production Monitoring System</p></footer>
</div>

<!-- LOGOUT MODAL -->
<div id="logoutModal" class="logout-modal-overlay" style="display:none;">
    <div class="logout-modal-box"><h3><i class="fa fa-sign-out"></i> Confirm Logout</h3><p>Are you sure you want to logout?</p><div class="logout-modal-actions"><button class="btn-cancel" onclick="closeLogoutModal()">No</button><button class="btn-logout-yes" onclick="confirmLogout()">Yes</button></div></div>
</div>

<script>
// Pass PHP data to JS
var csrfToken = <?php echo json_encode($csrfToken); ?>;
var exportDateStamp = <?php echo json_encode(date('Ymd')); ?>; 
var manageReportData = {
    opsDaysValue: <?php echo json_encode($selectedOpsDays); ?>,
    asOfDate: <?php echo json_encode($asOfDate); ?>,
    filterTeam: <?php echo json_encode($filterTeam); ?>,
    filterMonth: <?php echo json_encode($filterMonth); ?>,
    filterYear: <?php echo json_encode($filterYear); ?>,
    filterLines: <?php echo json_encode(array_values($filterLines)); ?>,
    selectedShifts: <?php echo json_encode($selectedShifts); ?>
};
</script>
<script src="js/manage_report.js"></script>
</body>
</html>