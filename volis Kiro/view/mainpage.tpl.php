<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Main Dashboard</title>
    <link rel="stylesheet" href="css/mainpage.css">
    <link rel="icon" href="images/p_icon.png" type="image/png">
    <link rel="stylesheet" href="css/add_edit.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="js/mainpage.js" defer></script>
    <style>
        .lv-chart-toggle { display: flex; gap: 5px; }
        .lv-toggle-btn { padding: 8px 16px; border: 1px solid #cbd5e1; border-radius: 20px; background: white; color: #475569; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-size: 14px; }
        .lv-toggle-btn.active { background: #3b82f6; color: white; border-color: #3b82f6; }
        .lv-toggle-btn:hover:not(.active) { background: #f1f5f9; border-color: #94a3b8; }
        .filter-dropdown-disabled .filter-dropdown-btn { opacity: 0.5; cursor: not-allowed; }
        .filter-group select:disabled,
        .filter-group input:disabled,
        .filter-dropdown-btn:disabled { background: #f1f5f9; color: #94a3b8; cursor: not-allowed; }
    </style>
</head>
<body>
<div class="page-bg">
    <?php include __DIR__ . '/../templates/loader.php'; ?>

<header class="header">
<h1>
    <img src="images/pioneerlogo.png" alt="Logo" style="height:1.2em; vertical-align:middle; margin-right:8px;">
     Production Dashboard
</h1>
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
    <span><i class="fa fa-user-circle"></i> Welcome, <?php echo htmlspecialchars($_SESSION['user']); ?> &nbsp;|&nbsp; <i class="fa <?php echo $currentRoleIcon; ?>"></i> <?php echo $currentRoleLabel; ?></span>
</nav>

<nav class="navbar">
    <div class="dropdown">
        <button class="dropbtn">Dashboard Reports <i class="fa fa-caret-down"></i></button>
        <div class="dropdown-content">
            <a href="?report=weekly"><i class="fa fa-bar-chart"></i> Weekly Report</a>
            <a href="?report=monthly"><i class="fa fa-line-chart"></i> Monthly Report</a>
            <a href="?report=yearly"><i class="fa fa-area-chart"></i> Yearly Report</a>
            <a href="?report=lipas_volpas"><i class="fa fa-pie-chart"></i> LIPAS VOLPAS Report</a>
        </div>
    </div>
</nav>

<div class="wrapper">
    <aside class="sidebar sticky-sidebar">
        <ul>
            <li class="active"><a href="mainpage.php"><i class="fa fa-tachometer"></i> Dashboard Page</a></li>
            <li><a href="add_edit.php"><i class="fa fa-table"></i> Manage Production Records</a></li>
            <li><a href="manage_report.php"><i class="fa fa-file-text-o"></i> Line Report Records & LIPAS VOLPAS</a></li>
            <?php if ($_SESSION['role'] === 'system_admin'): ?>
                <li class="admin-section-label"><span>Admin Access</span></li>
                <li>
                    <a href="manage_users.php">
                        <i class="fa fa-users"></i> User Management
                        <?php if ($pendingUsersCount > 0): ?>
                            <span class="mu-nav-badge"><?php echo $pendingUsersCount; ?></span>
                        <?php endif; ?>
                    </a>
                </li>
                <li><a href="import_data.php"><i class="fa fa-upload"></i> Import Records</a></li>
                <li><a href="audit_log.php"><i class="fa fa-history"></i> Audit Trail</a></li>
            <?php endif; ?>
        </ul>
    </aside>

    <main class="main-content">

        <?php if ($report == 'weekly'): ?>
            <h2>Weekly Report</h2>
            <div class="report-filters">
                <form method="get" id="weeklyForm">
                    <input type="hidden" name="report" value="weekly">
                    <div class="filter-group"><label>Team</label><select name="team" onchange="cascadeWeekly(this)"><option value="">All Teams</option><option value="A" <?php echo ($filterTeam == 'A') ? 'selected' : ''; ?>>Team A</option><option value="B" <?php echo ($filterTeam == 'B') ? 'selected' : ''; ?>>Team B</option><option value="C" <?php echo ($filterTeam == 'C') ? 'selected' : ''; ?>>Team C</option></select></div>
                    <div class="filter-group"><label>Year</label><select name="year" onchange="cascadeWeekly(this)" <?php echo empty($filterTeam) ? 'disabled' : ''; ?>><?php for ($y = date('Y')-2; $y <= date('Y')+2; $y++): ?><option value="<?php echo $y; ?>" <?php echo ($filterYear == $y) ? 'selected' : ''; ?>><?php echo $y; ?></option><?php endfor; ?></select></div>
                    <div class="filter-group"><label>Month</label><select name="month" onchange="cascadeWeekly(this)" <?php echo empty($filterYear) ? 'disabled' : ''; ?>><?php foreach ($months as $m): ?><option value="<?php echo $m; ?>" <?php echo ($filterMonth == $m) ? 'selected' : ''; ?>><?php echo $m; ?></option><?php endforeach; ?></select></div>
                    <div class="filter-group">
                        <label>Prod. Days</label>
                        <div class="filter-dropdown <?php echo (!$filterTeam || !$filterMonth) ? 'filter-dropdown-disabled' : ''; ?>" id="opsDaysDropdown">
                            <button type="button" class="filter-dropdown-btn" <?php echo (!$filterTeam || !$filterMonth) ? 'disabled' : ''; ?> onclick="toggleOpsDaysDropdown(event)">
                                <?php
                                    if (!empty($selectedOpsDays)) {
                                        $labels = [];
                                        foreach ($selectedOpsDays as $v) {
                                            $p = explode('|', $v, 2);
                                            $labels[] = $p[0] ? date('M d', strtotime($p[0])) . '–' . date('M d', strtotime($p[1])) : $v;
                                        }
                                        echo htmlspecialchars(implode(', ', $labels), ENT_QUOTES);
                                    } else {
                                        echo 'All';
                                    }
                                ?>
                                <span class="arrow">▾</span>
                            </button>
                            <div class="filter-dropdown-panel" id="opsDaysDropdownPanel">
                                <label class="filter-checkbox-item select-all-item"><input type="checkbox" id="selectAllOpsDays" onclick="toggleAllOpsDays(this)"> <span>Select All</span></label>
                                <hr class="filter-divider">
                                <?php foreach ($opsDaysOptions as $od):
                                    $val = $od['OPERATING_DAYS_START'] . '|' . $od['OPERATING_DAYS_END'];
                                    $lbl = date('M d', strtotime($od['OPERATING_DAYS_START'])) . ' – ' . date('M d, Y', strtotime($od['OPERATING_DAYS_END']));
                                ?>
                                <label class="filter-checkbox-item">
                                    <input type="checkbox" name="ops_days[]" value="<?php echo htmlspecialchars($val); ?>"
                                        <?php echo in_array($val, $selectedOpsDays) ? 'checked' : ''; ?>
                                        onchange="this.form.submit()">
                                    <span><?php echo htmlspecialchars($lbl); ?></span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <div class="filter-group">
                        <label>Line</label>
                        <div class="filter-dropdown <?php echo empty($opsDaysOptions) ? 'filter-dropdown-disabled' : ''; ?>" id="lineDropdown">
                            <button type="button" class="filter-dropdown-btn" <?php echo empty($opsDaysOptions) ? 'disabled' : ''; ?> onclick="toggleLineDropdown(event)">
                                <?php echo !empty($filterLines) ? htmlspecialchars(implode(', ', $filterLines), ENT_QUOTES) : 'All Lines'; ?> <span class="arrow">▾</span>
                            </button>
                            <div class="filter-dropdown-panel" id="lineDropdownPanel">
                                <label class="filter-checkbox-item select-all-item"><input type="checkbox" id="selectAllLines" onclick="toggleAllProdLines(this)"> <span>Select All</span></label>
                                <hr class="filter-divider">
                                <?php foreach ($weeklyLineOptions as $line): ?>
                                <label class="filter-checkbox-item"><input type="checkbox" name="line[]" value="<?php echo htmlspecialchars($line); ?>" <?php echo in_array($line, $filterLines) ? 'checked' : ''; ?> onchange="this.form.submit()"><span><?php echo htmlspecialchars($line); ?></span></label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <div class="filter-group"><label>Shift</label><select name="shift" onchange="this.form.submit()" <?php echo empty($filterLines) ? 'disabled' : ''; ?>><option value="all" <?php echo ($filterShift === 'all' || $filterShift === '') ? 'selected' : ''; ?>>All Shifts</option><option value="1" <?php echo ($filterShift == '1') ? 'selected' : ''; ?>>1st Shift</option><option value="2" <?php echo ($filterShift == '2') ? 'selected' : ''; ?>>2nd Shift</option><option value="3" <?php echo ($filterShift == '3') ? 'selected' : ''; ?>>3rd Shift</option></select></div>
                </form>
            </div>

            <div class="kpi-grid weekly">
                <div class="kpi-card"><div class="label">Total SKU Count</div><div class="value"><?php echo number_format($weeklyKPIs['skuCount']); ?></div></div>
                <div class="kpi-card"><div class="label">LIPAS Count</div><div class="value"><?php echo number_format($weeklyKPIs['lipasCount']); ?></div></div>
                <div class="kpi-card"><div class="label">VOLPAS Actual</div><div class="value"><?php echo number_format($weeklyKPIs['cumulative']); ?></div></div>
                <div class="kpi-card"><div class="label">VOLPAS Planned</div><div class="value"><?php echo number_format($weeklyKPIs['quantity']); ?></div></div>
            </div>

            <div class="chart-card">
                <h3>VOLPAS Actual vs VOLPAS Planned</h3>
                <canvas id="cumulativeChart"></canvas>
            </div>

            <?php foreach ($dailyShiftChartData as $dIdx => $dEntry): ?>
                <div class="chart-card-full" style="margin-top:20px;">
                    <h3>Daily Shift Output – <?php echo htmlspecialchars($dEntry['rangeLabel']); ?>, <?php echo htmlspecialchars($filterMonth); ?> – Team <?php echo htmlspecialchars($filterTeam ?: 'All'); ?></h3>
                    <canvas id="dailyShiftChart_<?php echo $dIdx; ?>"></canvas>
                </div>
            <?php endforeach; ?>

        <?php elseif ($report == 'monthly'): ?>
            <h2 class="report-heading-monthly">Monthly Report</h2>
            <div class="report-filters">
                <form method="get" id="monthlyForm">
                    <input type="hidden" name="report" value="monthly">
                    <div class="filter-group"><label>Team</label><select name="team" onchange="cascadeMonthly(this)"><option value="">All Teams</option><option value="A" <?php echo ($filterTeam == 'A') ? 'selected' : ''; ?>>Team A</option><option value="B" <?php echo ($filterTeam == 'B') ? 'selected' : ''; ?>>Team B</option><option value="C" <?php echo ($filterTeam == 'C') ? 'selected' : ''; ?>>Team C</option></select></div>
                    <div class="filter-group"><label>Year</label><select name="year" onchange="cascadeMonthly(this)" <?php echo empty($filterTeam) ? 'disabled' : ''; ?>><?php for ($y = date('Y')-2; $y <= date('Y')+2; $y++): ?><option value="<?php echo $y; ?>" <?php echo ($filterYear == $y) ? 'selected' : ''; ?>><?php echo $y; ?></option><?php endfor; ?></select></div>
                    <div class="filter-group"><label>Month</label><select name="month" onchange="cascadeMonthly(this)" <?php echo empty($filterYear) ? 'disabled' : ''; ?>><option value="" <?php echo ($filterMonth === '') ? 'selected' : ''; ?>>All Months</option><?php foreach ($months as $m): ?><option value="<?php echo $m; ?>" <?php echo ($filterMonth == $m) ? 'selected' : ''; ?>><?php echo ucfirst(strtolower($m)); ?></option><?php endforeach; ?></select></div>
                    <div class="filter-group">
                        <label>Line</label>
                        <div class="filter-dropdown <?php echo empty($filterMonth) ? 'filter-dropdown-disabled' : ''; ?>" id="monthlyLineDropdown">
                            <button type="button" class="filter-dropdown-btn" <?php echo empty($filterMonth) ? 'disabled' : ''; ?> onclick="toggleMonthlyLineDropdown(event)">
                                <?php echo !empty($filterLines) ? htmlspecialchars(implode(', ', $filterLines), ENT_QUOTES) : 'All Lines'; ?> <span class="arrow">▾</span>
                            </button>
                            <div class="filter-dropdown-panel" id="monthlyLineDropdownPanel">
                                <label class="filter-checkbox-item select-all-item"><input type="checkbox" id="selectAllMonthlyLines" onclick="toggleAllMonthlyLines(this)"> <span>Select All</span></label>
                                <hr class="filter-divider">
                                <?php foreach ($monthlyLineOptions as $line): ?>
                                <label class="filter-checkbox-item"><input type="checkbox" name="line[]" value="<?php echo htmlspecialchars($line); ?>" <?php echo in_array($line, $filterLines) ? 'checked' : ''; ?> onchange="this.form.submit()"><span><?php echo htmlspecialchars($line); ?></span></label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                    <div class="filter-group"><label>Shift</label><select name="shift" onchange="this.form.submit()" <?php echo empty($filterLines) ? 'disabled' : ''; ?>><option value="all" <?php echo ($filterShift === 'all' || $filterShift === '') ? 'selected' : ''; ?>>All Shifts</option><option value="1" <?php echo ($filterShift == '1') ? 'selected' : ''; ?>>1st Shift</option><option value="2" <?php echo ($filterShift == '2') ? 'selected' : ''; ?>>2nd Shift</option><option value="3" <?php echo ($filterShift == '3') ? 'selected' : ''; ?>>3rd Shift</option></select></div>
                </form>
            </div>

            <div class="kpi-grid monthly">
                <div class="kpi-card"><div class="label">Total SKU Count of the Month</div><div class="value"><?php echo number_format($monthlyKPIs['skuCount']); ?></div></div>
                <div class="kpi-card"><div class="label">LIPAS Count of the Month</div><div class="value"><?php echo number_format($monthlyKPIs['lipasCount']); ?></div></div>
                <div class="kpi-card"><div class="label">VOLPAS Actual of the Month</div><div class="value"><?php echo number_format($monthlyKPIs['cumulative']); ?></div></div>
                <div class="kpi-card"><div class="label">VOLPAS Planned of the Month</div><div class="value"><?php echo number_format($monthlyKPIs['quantity']); ?></div></div>
            </div>

            <div class="chart-grid-2col">
                <div class="chart-card monthly"><h3>Shift Output by Week – <?php echo htmlspecialchars($filterMonth) . ' ' . htmlspecialchars($filterYear); ?></h3><canvas id="monthlyShiftChart"></canvas></div>
                <div class="chart-card monthly"><h3>VOLPAS Actual vs VOLPAS Planned – <?php echo htmlspecialchars($filterMonth) . ' ' . htmlspecialchars($filterYear); ?></h3><canvas id="monthlyCumChart"></canvas></div>
            </div>

        <?php elseif ($report == 'yearly'): ?>
            <h2 class="report-heading-yearly">Yearly Report</h2>
            <div class="report-filters">
                <form method="get" id="yearlyForm">
                    <input type="hidden" name="report" value="yearly">
                    <div class="filter-group"><label>Team</label><select name="team" onchange="cascadeYearly(this)"><option value="">All Teams</option><option value="A" <?php echo ($filterTeam == 'A') ? 'selected' : ''; ?>>Team A</option><option value="B" <?php echo ($filterTeam == 'B') ? 'selected' : ''; ?>>Team B</option><option value="C" <?php echo ($filterTeam == 'C') ? 'selected' : ''; ?>>Team C</option></select></div>
                    <div class="filter-group"><label>Year</label><select name="year" onchange="cascadeYearly(this)" <?php echo empty($filterTeam) ? 'disabled' : ''; ?>><?php for ($y = date('Y')-2; $y <= date('Y')+2; $y++): ?><option value="<?php echo $y; ?>" <?php echo ($filterYear == $y) ? 'selected' : ''; ?>><?php echo $y; ?></option><?php endfor; ?></select></div>
                    <div class="filter-group">
                        <label>Line</label>
                        <div class="filter-dropdown <?php echo empty($filterYear) ? 'filter-dropdown-disabled' : ''; ?>" id="yearlyLineDropdown">
                            <button type="button" class="filter-dropdown-btn" <?php echo empty($filterYear) ? 'disabled' : ''; ?> onclick="toggleYearlyLineDropdown(event)">
                                <?php echo !empty($filterLines) ? htmlspecialchars(implode(', ', $filterLines), ENT_QUOTES) : 'All Lines'; ?> <span class="arrow">▾</span>
                            </button>
                            <div class="filter-dropdown-panel" id="yearlyLineDropdownPanel">
                                <label class="filter-checkbox-item select-all-item"><input type="checkbox" id="selectAllYearlyLines" onclick="toggleAllYearlyLines(this)"> <span>Select All</span></label>
                                <hr class="filter-divider">
                                <?php foreach ($yearlyLineOptions as $line): ?>
                                <label class="filter-checkbox-item"><input type="checkbox" name="line[]" value="<?php echo htmlspecialchars($line); ?>" <?php echo in_array($line, $filterLines) ? 'checked' : ''; ?> onchange="this.form.submit()"><span><?php echo htmlspecialchars($line); ?></span></label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    </div>
                </form>
            </div>

            <div class="kpi-grid yearly">
                <div class="kpi-card"><div class="label">Total SKU Count of the Year</div><div class="value"><?php echo number_format($yearlyKPIs['skuCount']); ?></div></div>
                <div class="kpi-card"><div class="label">LIPAS Count of the Year</div><div class="value"><?php echo number_format($yearlyKPIs['lipasCount']); ?></div></div>
                <div class="kpi-card"><div class="label">VOLPAS Actual of the Year</div><div class="value"><?php echo number_format($yearlyKPIs['cumulative']); ?></div></div>
                <div class="kpi-card"><div class="label">VOLPAS Planned of the Year</div><div class="value"><?php echo number_format($yearlyKPIs['quantity']); ?></div></div>
            </div>

            <div class="chart-grid-2col">
                <div class="chart-card yearly"><h3>Cumulative Output by Month – <?php echo htmlspecialchars($filterYear); ?></h3><canvas id="yearlyShiftChart"></canvas></div>
                <div class="chart-card yearly"><h3>VOLPAS Actual vs VOLPAS Planned – <?php echo htmlspecialchars($filterYear); ?></h3><canvas id="yearlyCumChart"></canvas></div>
            </div>

        <?php elseif ($report == 'lipas_volpas'): ?>
            <h2 class="report-heading-lv">LIPAS VOLPAS Report</h2>
            <div class="report-filters lv-filters">
                <form method="get" id="lvForm">
                    <input type="hidden" name="report" value="lipas_volpas">
                    <div class="filter-group"><label>Period</label><select name="lv_period" onchange="lvHandlePeriodChange(this)"><option value="weekly" <?php echo ($lvPeriod === 'weekly') ? 'selected' : ''; ?>>Weekly</option><option value="monthly" <?php echo ($lvPeriod === 'monthly') ? 'selected' : ''; ?>>Monthly</option></select></div>
                    <div class="filter-group"><label>Year</label><select name="lv_year" onchange="this.form.submit()"><?php for ($y = date('Y')-2; $y <= date('Y')+2; $y++): ?><option value="<?php echo $y; ?>" <?php echo ($lvYear == $y) ? 'selected' : ''; ?>><?php echo $y; ?></option><?php endfor; ?></select></div>
                    <div class="filter-group lv-month-group" id="lvMonthGroup" <?php echo ($lvPeriod === 'weekly') ? 'style="display:none"' : ''; ?>><label>Month</label><select name="lv_month" onchange="this.form.submit()"><option value="" <?php echo ($lvMonth === '') ? 'selected' : ''; ?>>All Months</option><?php foreach ($lvAllMonths as $m): ?><option value="<?php echo $m; ?>" <?php echo ($lvMonth === $m) ? 'selected' : ''; ?>><?php echo ucfirst(strtolower($m)); ?></option><?php endforeach; ?></select></div>
                    <div class="filter-group lv-week-group" id="lvWeekGroup" <?php echo ($lvPeriod !== 'weekly') ? 'style="display:none"' : ''; ?>><label>Week</label><select name="lv_week" onchange="this.form.submit()"><option value="all" <?php echo ($lvWeek === 'all') ? 'selected' : ''; ?>>All Weeks</option><?php for ($w = 1; $w <= 5; $w++): ?><option value="<?php echo $w; ?>" <?php echo ($lvWeek == $w) ? 'selected' : ''; ?>>Week <?php echo $w; ?></option><?php endfor; ?></select></div>
                    <div class="filter-group"><label>Team</label><select name="lv_team" onchange="this.form.submit()"><option value="" <?php echo ($lvTeam === '') ? 'selected' : ''; ?>>All Teams</option><option value="A" <?php echo ($lvTeam === 'A') ? 'selected' : ''; ?>>Team A</option><option value="B" <?php echo ($lvTeam === 'B') ? 'selected' : ''; ?>>Team B</option><option value="C" <?php echo ($lvTeam === 'C') ? 'selected' : ''; ?>>Team C</option></select></div>
                    <div class="filter-group"><label>Line</label><select name="lv_line" onchange="this.form.submit()"><option value="" <?php echo ($lvLine === '') ? 'selected' : ''; ?>>All Lines</option><?php foreach ($lvLineOptions as $ln): ?><option value="<?php echo htmlspecialchars($ln); ?>" <?php echo ($lvLine === $ln) ? 'selected' : ''; ?>><?php echo htmlspecialchars($ln); ?></option><?php endforeach; ?></select></div>
                    <div class="filter-group"><label>Dataset</label><select name="lv_dataset" onchange="this.form.submit()"><option value="both" <?php echo ($lvDataset === 'both') ? 'selected' : ''; ?>>LIPAS + VOLPAS</option><option value="lipas" <?php echo ($lvDataset === 'lipas') ? 'selected' : ''; ?>>LIPAS Only</option><option value="volpas" <?php echo ($lvDataset === 'volpas') ? 'selected' : ''; ?>>VOLPAS Only</option></select></div>
                    <div class="filter-group"><label>Chart Type</label><div class="lv-chart-toggle"><button type="submit" name="lv_charttype" value="bar" class="lv-toggle-btn <?php echo ($lvChartType === 'bar') ? 'active' : ''; ?>">Bar</button><button type="submit" name="lv_charttype" value="pie" class="lv-toggle-btn <?php echo ($lvChartType === 'pie') ? 'active' : ''; ?>">Pie</button></div></div>
                </form>
            </div>

            <?php
                $lvKpiContext = $lvYear;
                if ($lvPeriod === 'monthly') {
                    $lvKpiContext .= !empty($lvMonth) ? ' – ' . ucfirst(strtolower($lvMonth)) : '';
                    $lvKpiContext .= ' – Monthly';
                } else {
                    $lvKpiContext .= !empty($lvMonth) ? ' – ' . ucfirst(strtolower($lvMonth)) : '';
                    $lvKpiContext .= ' – Weekly';
                    $lvKpiContext .= ($lvWeek !== 'all') ? ' – Week ' . (int)$lvWeek : '';
                }
            ?>
            <div class="kpi-grid lv-kpi-grid">
                <?php if ($lvDataset !== 'volpas'): ?>
                <div class="kpi-card lv-lipas-card"><div class="label">LIPAS Plan <small>(<?php echo htmlspecialchars($lvKpiContext); ?>)</small></div><div class="value"><?php echo number_format($lvSummaryData['lipasTotalPlan'] ?? 0); ?></div></div>
                <div class="kpi-card lv-lipas-card"><div class="label">LIPAS Actual <small>(<?php echo htmlspecialchars($lvKpiContext); ?>)</small></div><div class="value"><?php echo number_format($lvSummaryData['lipasTotalActual'] ?? 0); ?></div><div class="lv-percentage <?php echo ($lvSummaryData['lipasPercentage'] ?? 0) >= 100 ? 'pct-green' : 'pct-red'; ?>"><?php echo number_format($lvSummaryData['lipasPercentage'] ?? 0, 2); ?>%</div></div>
                <?php endif; ?>
                <?php if ($lvDataset !== 'lipas'): ?>
                <div class="kpi-card lv-volpas-card"><div class="label">VOLPAS Plan <small>(<?php echo htmlspecialchars($lvKpiContext); ?>)</small></div><div class="value"><?php echo number_format($lvSummaryData['volpasTotalPlan'] ?? 0); ?></div></div>
                <div class="kpi-card lv-volpas-card"><div class="label">VOLPAS Actual <small>(<?php echo htmlspecialchars($lvKpiContext); ?>)</small></div><div class="value"><?php echo number_format($lvSummaryData['volpasTotalActual'] ?? 0); ?></div><div class="lv-percentage <?php echo ($lvSummaryData['volpasPercentage'] ?? 0) >= 100 ? 'pct-green' : 'pct-red'; ?>"><?php echo number_format($lvSummaryData['volpasPercentage'] ?? 0, 2); ?>%</div></div>
                <?php endif; ?>
            </div>

            <?php if ($lvDataset == 'both'): ?>
                <h3>LIPAS</h3><div class="chart-card lv"><canvas id="lvLipasChart"></canvas></div>
                <h3>VOLPAS</h3><div class="chart-card lv"><canvas id="lvVolpasChart"></canvas></div>
            <?php elseif ($lvDataset == 'lipas'): ?>
                <h3>LIPAS</h3><div class="chart-card lv"><canvas id="lvLipasChart"></canvas></div>
            <?php elseif ($lvDataset == 'volpas'): ?>
                <h3>VOLPAS</h3><div class="chart-card lv"><canvas id="lvVolpasChart"></canvas></div>
            <?php endif; ?>

        <?php endif; ?>
    </main>
</div>

<footer class="footer">
    <p>&copy; <?php echo date('Y'); ?> Production Monitoring System</p>
</footer>

</div>

<!-- LOGOUT CONFIRMATION MODAL -->
<div id="logoutModal" class="logout-modal-overlay" style="display:none;">
    <div class="logout-modal-box">
        <h3><i class="fa fa-sign-out"></i> Confirm Logout</h3>
        <p>Are you sure you want to logout?</p>
        <div class="logout-modal-actions">
            <button class="btn-cancel" onclick="closeLogoutModal()"><i class="fa fa-times"></i> No</button>
            <button class="btn-logout-yes" onclick="confirmLogout()"><i class="fa fa-check"></i> Yes</button>
        </div>
    </div>
</div>

<script>
// Dynamic data passed to the JS file
var cumulativeChartData = <?php echo json_encode($cumulativeChartData); ?>;
var dailyShiftChartData = <?php echo json_encode($dailyShiftChartData); ?>;
var monthlyChartData    = <?php echo json_encode($monthlyChartData); ?>;
var monthlyCumChartData = <?php echo json_encode($monthlyCumChartData); ?>;
var yearlyChartData     = <?php echo json_encode($yearlyChartData); ?>;
var yearlyCumChartData  = <?php echo json_encode($yearlyCumChartData); ?>;
var lipasChartData      = <?php echo json_encode($lipasChartData); ?>;
var volpasChartData     = <?php echo json_encode($volpasChartData); ?>;
var lvDataset           = <?php echo json_encode($lvDataset ?? 'both'); ?>;
var lvChartType         = <?php echo json_encode($lvChartType ?? 'bar'); ?>;
</script>
</body>
</html>