<?php
session_start();
require 'db.php';

// Global months array
$months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
$currentMonthName = strtoupper(date('F'));   // used for weekly month default

require 'auth_check.php'; // session security guard

// ── Pending count for admin badge ────────────────────────────
$pendingUsersCount = 0;
if ($_SESSION['role'] === 'system_admin') {
    $res = $conn->query("SELECT COUNT(*) AS cnt FROM users WHERE approval_status = 'pending'");
    if ($res) $pendingUsersCount = (int)$res->fetch_assoc()['cnt'];
}


/* =========================
   CURRENT REPORT VIEW
========================= */
$report = $_GET['report'] ?? 'weekly';   // default to weekly

// ---------- Global helper: build IN clause for multi-line filter ----------
function buildLineIn(array $lines): array {
    if (empty($lines)) return ['', [], ''];
    $placeholders = implode(',', array_fill(0, count($lines), '?'));
    return [" AND LINE IN ($placeholders)", array_values($lines), str_repeat('s', count($lines))];
}

// ----- Common filter parameters (used by all report types) -----
$filterYear   = (int)($_GET['year'] ?? date('Y'));
$filterMonth  = strtoupper(trim($_GET['month'] ?? ''));
$filterTeam   = $_GET['team']   ?? '';
$filterShift  = $_GET['shift']  ?? 'all';
$filterLines  = isset($_GET['line']) && is_array($_GET['line']) ? array_filter($_GET['line']) : [];

// ── Weekly: auto‑set month to current when year is selected ──
if ($report == 'weekly' && !empty($filterYear) && empty($filterMonth)) {
    $filterMonth = $currentMonthName;
}

// For weekly/monthly: multi‑checkbox prod. days (not used in yearly)
$selectedOpsDays = isset($_GET['ops_days']) && is_array($_GET['ops_days'])
    ? array_filter($_GET['ops_days'])
    : [];

function buildOpsDaysOr(array $selectedOpsDays): array {
    if (empty($selectedOpsDays)) return ['', [], ''];
    $clauses = [];
    $params  = [];
    $types   = '';
    foreach ($selectedOpsDays as $val) {
        $parts = explode('|', $val, 2);
        if (count($parts) === 2 && $parts[0] && $parts[1]) {
            $clauses[] = '(OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?)';
            $params[]  = $parts[0];
            $params[]  = $parts[1];
            $types    .= 'ss';
        }
    }
    if (empty($clauses)) return ['', [], ''];
    return [' AND (' . implode(' OR ', $clauses) . ')', $params, $types];
}

// Fetch operating‑day ranges for the weekly Prod. Days combobox
$opsDaysOptions = [];
if ($filterTeam && $filterYear && $filterMonth) {
    $opsTable = match($filterTeam) {
        'A' => 'a_summary_line',
        'B' => 'b_summary_line',
        'C' => 'c_summary_line',
        default => null
    };
    if ($opsTable) {
        $stmt = $conn->prepare("SELECT DISTINCT OPERATING_DAYS_START, OPERATING_DAYS_END
                                 FROM `$opsTable`
                                 WHERE YEAR = ? AND MONTH = ?
                                 ORDER BY OPERATING_DAYS_START");
        $stmt->bind_param('is', $filterYear, $filterMonth);
        $stmt->execute();
        $res = $stmt->get_result();
        while ($r = $res->fetch_assoc()) {
            $opsDaysOptions[] = $r;
        }
    }
}

// ── GLOBAL DEFAULTS FOR ALL CHART DATA ──────────────────────
$shiftChartData       = [];   // kept for template but not used (weekly shift chart removed)
$cumulativeChartData  = [];
$dailyShiftChartData  = [];
$monthlyChartData     = [];
$monthlyCumChartData  = [];
$yearlyChartData      = [];
$yearlyCumChartData   = [];
$lipasChartData       = ['labels' => [], 'datasets' => []];
$volpasChartData      = ['labels' => [], 'datasets' => []];
$lvDataset            = 'both';
$lvChartType          = 'bar';

// =============================================
// WEEKLY REPORT LOGIC
// =============================================
$weeklyKPIs = ['skuCount' => 0, 'lipasCount' => 0, 'cumulative' => 0, 'quantity' => 0];
$weeklyLineOptions = [];

if ($report == 'weekly') {
    // Fetch lines from sku_master for the line filter
    $weeklyLineOptions = [];
    if (!empty($filterTeam)) {
        $lineStmt = $conn->prepare("SELECT DISTINCT LINE FROM sku_master WHERE TEAM = ? AND LINE IS NOT NULL ORDER BY LINE");
        $lineStmt->bind_param('s', $filterTeam);
    } else {
        $lineStmt = $conn->prepare("SELECT DISTINCT LINE FROM sku_master WHERE LINE IS NOT NULL ORDER BY LINE");
    }
    $lineStmt->execute();
    $lineRes = $lineStmt->get_result();
    while ($lr = $lineRes->fetch_assoc()) {
        $weeklyLineOptions[] = $lr['LINE'];
    }

    [$lineInClause, $lineInParams, $lineInTypes] = buildLineIn($filterLines);

    // Determine tables
    if (empty($filterTeam)) {
        $reportTables  = ['a_report_line', 'b_report_line', 'c_report_line'];
        $summaryTables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];
    } elseif ($filterTeam === 'A') {
        $reportTables  = ['a_report_line'];
        $summaryTables = ['a_summary_line'];
    } elseif ($filterTeam === 'B') {
        $reportTables  = ['b_report_line'];
        $summaryTables = ['b_summary_line'];
    } elseif ($filterTeam === 'C') {
        $reportTables  = ['c_report_line'];
        $summaryTables = ['c_summary_line'];
    } else {
        $reportTables  = [];
        $summaryTables = [];
    }

    $shiftsToQuery = ($filterShift === 'all' || $filterShift === '') ? [1, 2, 3] : [(int)$filterShift];
    $shiftColors = [
        1 => ['bg' => 'rgba(59,130,246,0.8)',  'border' => '#3b82f6'],
        2 => ['bg' => 'rgba(249,115,22,0.8)',  'border' => '#f97316'],
        3 => ['bg' => 'rgba(34,197,94,0.8)',   'border' => '#22c55e'],
    ];

    // --- KPI part 1: SKU Count & LIPAS Count from report_line ---
    if (!empty($reportTables) && $filterMonth) {
        $unions = [];
        $params = [];
        $types  = '';
        foreach ($reportTables as $tbl) {
            $baseWhere  = "YEAR = ? AND MONTH = ?";
            $wParams    = [$filterYear, $filterMonth];
            $wTypes     = 'is';

            [$odClause, $odParams, $odTypes] = buildOpsDaysOr($selectedOpsDays);
            $baseWhere .= $odClause;
            $wParams    = array_merge($wParams, $odParams);
            $wTypes    .= $odTypes;

            $baseWhere .= $lineInClause;
            $wParams    = array_merge($wParams, $lineInParams);
            $wTypes    .= $lineInTypes;

            $outerWhere = preg_replace('/\b(YEAR|MONTH|LINE|OPERATING_DAYS_START|OPERATING_DAYS_END)\b/', 't.$1', $baseWhere);

            $unions[] = "
                SELECT t.SKU_CODE, t.LIPAS_COUNT
                FROM `$tbl` t
                INNER JOIN (
                    SELECT TEAM, LINE, SKU_CODE, OPERATING_DAYS_START, OPERATING_DAYS_END, MONTH, YEAR,
                           MAX(SHIFT_NUMBER) AS max_shift
                    FROM `$tbl`
                    WHERE $baseWhere
                    GROUP BY TEAM, LINE, SKU_CODE, OPERATING_DAYS_START, OPERATING_DAYS_END, MONTH, YEAR
                ) mx ON t.TEAM   = mx.TEAM
                     AND t.LINE   = mx.LINE
                     AND t.SKU_CODE = mx.SKU_CODE
                     AND t.OPERATING_DAYS_START = mx.OPERATING_DAYS_START
                     AND t.OPERATING_DAYS_END   = mx.OPERATING_DAYS_END
                     AND t.MONTH  = mx.MONTH
                     AND t.YEAR   = mx.YEAR
                     AND t.SHIFT_NUMBER = mx.max_shift
                WHERE $outerWhere";
            $params = array_merge($params, $wParams, $wParams);
            $types .= $wTypes . $wTypes;
        }
        $sql  = implode(' UNION ALL ', $unions);
        $stmt = $conn->prepare($sql);
        if (!empty($params)) $stmt->bind_param($types, ...$params);
        $stmt->execute();
        $result = $stmt->get_result();

        $skuSet      = [];
        $lipasSkuSet = [];
        while ($row = $result->fetch_assoc()) {
            $skuSet[$row['SKU_CODE']] = true;
            if ($row['LIPAS_COUNT'] === 'Y') $lipasSkuSet[$row['SKU_CODE']] = true;
        }

        $weeklyKPIs['skuCount']   = count($skuSet);
        $weeklyKPIs['lipasCount'] = count($lipasSkuSet);
    }

    // --- KPI part 2: Cumulative Output & Quantity from summary tables ---
    if (!empty($summaryTables) && $filterMonth) {
        $cumSum = 0;
        $qtySum = 0;
        foreach ($summaryTables as $tbl) {
            $whereParts = ['YEAR = ?', 'MONTH = ?'];
            $whereParams = [$filterYear, $filterMonth];
            $whereTypes  = 'is';
            if (!empty($filterTeam)) { $whereParts[] = 'TEAM = ?'; $whereParams[] = $filterTeam; $whereTypes .= 's'; }
            [$odClause, $odParams, $odTypes] = buildOpsDaysOr($selectedOpsDays);
            if (!empty($odClause)) {
                $whereParts[] = substr($odClause, 5);
                $whereParams  = array_merge($whereParams, $odParams);
                $whereTypes  .= $odTypes;
            }
            if (!empty($lineInClause)) {
                $whereParts[] = substr($lineInClause, 5);
                $whereParams = array_merge($whereParams, $lineInParams);
                $whereTypes .= $lineInTypes;
            }
            $whereStr = implode(' AND ', $whereParts);
            $sql = "SELECT SUM(QUANTITY) AS qty, SUM(CUMULATIVE_OUTPUT) AS cum FROM `$tbl` WHERE $whereStr";
            $stmt = $conn->prepare($sql);
            if (!empty($whereParams)) $stmt->bind_param($whereTypes, ...$whereParams);
            $stmt->execute();
            $row = $stmt->get_result()->fetch_assoc();
            $cumSum += (int)($row['cum'] ?? 0);
            $qtySum += (int)($row['qty'] ?? 0);
        }
        $weeklyKPIs['cumulative'] = $cumSum;
        $weeklyKPIs['quantity']   = $qtySum;
    }

    // ── Cumulative vs Quantity chart (from summary_line) ──
    if (!empty($summaryTables) && $filterMonth) {
        $cumRaw = [];
        foreach ($summaryTables as $tbl) {
            $whereParts = ['YEAR = ?', 'MONTH = ?'];
            $whereParams = [$filterYear, $filterMonth];
            $whereTypes  = 'is';
            if (!empty($filterTeam)) { $whereParts[] = 'TEAM = ?'; $whereParams[] = $filterTeam; $whereTypes .= 's'; }
            [$odClause, $odParams, $odTypes] = buildOpsDaysOr($selectedOpsDays);
            if (!empty($odClause)) {
                $whereParts[] = substr($odClause, 5);
                $whereParams  = array_merge($whereParams, $odParams);
                $whereTypes  .= $odTypes;
            }
            if (!empty($lineInClause)) {
                $whereParts[] = substr($lineInClause, 5);
                $whereParams = array_merge($whereParams, $lineInParams);
                $whereTypes .= $lineInTypes;
            }
            $whereStr = implode(' AND ', $whereParts);
            $sql = "SELECT LINE, SUM(QUANTITY) AS q, SUM(CUMULATIVE_OUTPUT) AS c FROM `$tbl` WHERE $whereStr GROUP BY LINE";
            $stmt = $conn->prepare($sql);
            if (!empty($whereParams)) $stmt->bind_param($whereTypes, ...$whereParams);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) {
                $l = $r['LINE'];
                $cumRaw[$l]['c'] = ($cumRaw[$l]['c'] ?? 0) + (int)$r['c'];
                $cumRaw[$l]['q'] = ($cumRaw[$l]['q'] ?? 0) + (int)$r['q'];
            }
        }
        $labels = array_keys($cumRaw);
        $cumVals = []; $qtyVals = [];
        foreach ($labels as $l) { $cumVals[] = $cumRaw[$l]['c']; $qtyVals[] = $cumRaw[$l]['q']; }
        $cumulativeChartData = [
            'labels'   => $labels,
            'datasets' => [
                ['label' => 'Cumulative Output', 'data' => $cumVals, 'backgroundColor' => 'rgba(59,130,246,0.8)', 'borderColor' => '#3b82f6', 'borderWidth' => 1],
                ['label' => 'Quantity',           'data' => $qtyVals, 'backgroundColor' => 'rgba(239,68,68,0.7)',  'borderColor' => '#ef4444', 'borderWidth' => 1]
            ]
        ];
    }

    // ── Daily Shift Output charts — one per selected prod. day range ──
    $dailyShiftChartData = [];
    $summaryTable = $filterTeam ? ($filterTeam === 'A' ? 'a_summary_line' : ($filterTeam === 'B' ? 'b_summary_line' : 'c_summary_line')) : '';
    if ($summaryTable && !empty($selectedOpsDays) && $filterMonth) {
        foreach ($selectedOpsDays as $rangeVal) {
            $parts = explode('|', $rangeVal, 2);
            if (count($parts) !== 2 || !$parts[0] || !$parts[1]) continue;
            [$opsStart, $opsEnd] = $parts;

            $days = 7;
            $dailySums = array_fill(1, $days, [1 => 0, 2 => 0, 3 => 0]);
            $sumWhere  = "YEAR = ? AND MONTH = ? AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?";
            $sumParams = [$filterYear, $filterMonth, $opsStart, $opsEnd];
            $sumTypes  = 'isss';
            if ($filterTeam) { $sumWhere .= " AND TEAM = ?"; $sumParams[] = $filterTeam; $sumTypes .= 's'; }
            [$lc, $lp, $lt] = buildLineIn($filterLines);
            $sumWhere .= $lc; $sumParams = array_merge($sumParams, $lp); $sumTypes .= $lt;

            $sumQuery = "SELECT
                `1ST_SHIFT_DAY_1`, `2ND_SHIFT_DAY_1`, `3RD_SHIFT_DAY_1`,
                `1ST_SHIFT_DAY_2`, `2ND_SHIFT_DAY_2`, `3RD_SHIFT_DAY_2`,
                `1ST_SHIFT_DAY_3`, `2ND_SHIFT_DAY_3`, `3RD_SHIFT_DAY_3`,
                `1ST_SHIFT_DAY_4`, `2ND_SHIFT_DAY_4`, `3RD_SHIFT_DAY_4`,
                `1ST_SHIFT_DAY_5`, `2ND_SHIFT_DAY_5`, `3RD_SHIFT_DAY_5`,
                `1ST_SHIFT_DAY_6`, `2ND_SHIFT_DAY_6`, `3RD_SHIFT_DAY_6`,
                `1ST_SHIFT_DAY_7`, `2ND_SHIFT_DAY_7`, `3RD_SHIFT_DAY_7`
                FROM `$summaryTable` WHERE $sumWhere";
            $stmt = $conn->prepare($sumQuery);
            if (!empty($sumParams)) $stmt->bind_param($sumTypes, ...$sumParams);
            $stmt->execute();
            $sumRes = $stmt->get_result();

            while ($row = $sumRes->fetch_assoc()) {
                for ($d = 1; $d <= $days; $d++) {
                    $dailySums[$d][1] += (int)($row["1ST_SHIFT_DAY_$d"] ?? 0);
                    $dailySums[$d][2] += (int)($row["2ND_SHIFT_DAY_$d"] ?? 0);
                    $dailySums[$d][3] += (int)($row["3RD_SHIFT_DAY_$d"] ?? 0);
                }
            }

            $dayLabels    = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
            $datasets     = [];
            $shiftsToShow = ($filterShift === 'all' || $filterShift === '') ? [1,2,3] : [(int)$filterShift];
            foreach ($shiftsToShow as $sNum) {
                $data = [];
                for ($d = 1; $d <= $days; $d++) $data[] = $dailySums[$d][$sNum] ?? 0;
                $label = $sNum . ($sNum==1?'st':($sNum==2?'nd':'rd')).' Shift';
                $datasets[] = ['label' => $label, 'data' => $data,
                    'backgroundColor' => $shiftColors[$sNum]['bg'],
                    'borderColor'     => $shiftColors[$sNum]['border'],
                    'borderWidth'     => 1];
            }
            $rangeLabel = date('M d', strtotime($opsStart)) . ' – ' . date('M d, Y', strtotime($opsEnd));
            $dailyShiftChartData[] = [
                'rangeLabel' => $rangeLabel,
                'chartData'  => ['labels' => $dayLabels, 'datasets' => $datasets],
            ];
        }
    }
}

// =============================================
// MONTHLY REPORT LOGIC
// =============================================
$monthlyKPIs = ['skuCount' => 0, 'lipasCount' => 0, 'cumulative' => 0, 'quantity' => 0];
$monthlyLineOptions = [];

if ($report == 'monthly') {
    $monthlyLineOptions = [];
    if (!empty($filterTeam)) {
        $mlStmt = $conn->prepare("SELECT DISTINCT LINE FROM sku_master WHERE TEAM = ? AND LINE IS NOT NULL ORDER BY LINE");
        $mlStmt->bind_param('s', $filterTeam);
    } else {
        $mlStmt = $conn->prepare("SELECT DISTINCT LINE FROM sku_master WHERE LINE IS NOT NULL ORDER BY LINE");
    }
    $mlStmt->execute();
    $mlRes = $mlStmt->get_result();
    while ($mlr = $mlRes->fetch_assoc()) { $monthlyLineOptions[] = $mlr['LINE']; }

    [$mLineInClause, $mLineInParams, $mLineInTypes] = buildLineIn($filterLines);

    if (empty($filterTeam)) {
        $reportTables  = ['a_report_line', 'b_report_line', 'c_report_line'];
        $summaryTables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];
    } elseif ($filterTeam === 'A') {
        $reportTables  = ['a_report_line'];
        $summaryTables = ['a_summary_line'];
    } elseif ($filterTeam === 'B') {
        $reportTables  = ['b_report_line'];
        $summaryTables = ['b_summary_line'];
    } elseif ($filterTeam === 'C') {
        $reportTables  = ['c_report_line'];
        $summaryTables = ['c_summary_line'];
    } else {
        $reportTables  = [];
        $summaryTables = [];
    }

    $shiftsToQuery = ($filterShift === 'all' || $filterShift === '') ? [1, 2, 3] : [(int)$filterShift];
    $shiftColors = [
        1 => ['bg' => 'rgba(59,130,246,0.8)',  'border' => '#3b82f6'],
        2 => ['bg' => 'rgba(249,115,22,0.8)',  'border' => '#f97316'],
        3 => ['bg' => 'rgba(34,197,94,0.8)',   'border' => '#22c55e'],
    ];

    // --- KPI part 1: SKU & LIPAS from report_line ---
    if (!empty($reportTables) && $filterMonth) {
        $unions = []; $params = []; $types = '';
        foreach ($reportTables as $tbl) {
            $mw = "YEAR = ? AND MONTH = ?";
            $mp = [$filterYear, $filterMonth]; $mt = 'is';
            [$odClause, $odParams, $odTypes] = buildOpsDaysOr($selectedOpsDays);
            $mw .= $odClause; $mp = array_merge($mp, $odParams); $mt .= $odTypes;
            $mw .= $mLineInClause; $mp = array_merge($mp, $mLineInParams); $mt .= $mLineInTypes;
            $outer = preg_replace('/\b(YEAR|MONTH|LINE|OPERATING_DAYS_START|OPERATING_DAYS_END)\b/', 't.$1', $mw);
            $unions[] = "
                SELECT t.SKU_CODE, t.LIPAS_COUNT
                FROM `$tbl` t
                INNER JOIN (
                    SELECT TEAM, LINE, SKU_CODE, OPERATING_DAYS_START, OPERATING_DAYS_END, MONTH, YEAR,
                           MAX(SHIFT_NUMBER) AS ms
                    FROM `$tbl` WHERE $mw
                    GROUP BY TEAM, LINE, SKU_CODE, OPERATING_DAYS_START, OPERATING_DAYS_END, MONTH, YEAR
                ) mx ON t.TEAM=mx.TEAM AND t.LINE=mx.LINE AND t.SKU_CODE=mx.SKU_CODE
                     AND t.OPERATING_DAYS_START=mx.OPERATING_DAYS_START AND t.OPERATING_DAYS_END=mx.OPERATING_DAYS_END
                     AND t.MONTH=mx.MONTH AND t.YEAR=mx.YEAR AND t.SHIFT_NUMBER=mx.ms
                WHERE $outer";
            $params = array_merge($params, $mp, $mp); $types .= $mt . $mt;
        }
        $stmt = $conn->prepare(implode(' UNION ALL ', $unions));
        if (!empty($params)) $stmt->bind_param($types, ...$params);
        $stmt->execute(); $res = $stmt->get_result();
        $skuSet = []; $lipasSet = [];
        while ($r = $res->fetch_assoc()) {
            $skuSet[$r['SKU_CODE']] = true;
            if ($r['LIPAS_COUNT'] === 'Y') $lipasSet[$r['SKU_CODE']] = true;
        }
        $monthlyKPIs['skuCount'] = count($skuSet);
        $monthlyKPIs['lipasCount'] = count($lipasSet);
    }

    // --- KPI part 2: Cumulative & Quantity from summary tables ---
    if (!empty($summaryTables) && $filterMonth) {
        $cumSum = 0; $qtySum = 0;
        foreach ($summaryTables as $tbl) {
            $whereParts = ['YEAR = ?', 'MONTH = ?'];
            $whereParams = [$filterYear, $filterMonth]; $whereTypes = 'is';
            if (!empty($filterTeam)) { $whereParts[] = 'TEAM = ?'; $whereParams[] = $filterTeam; $whereTypes .= 's'; }
            [$odClause, $odParams, $odTypes] = buildOpsDaysOr($selectedOpsDays);
            if (!empty($odClause)) { $whereParts[] = substr($odClause, 5); $whereParams = array_merge($whereParams, $odParams); $whereTypes .= $odTypes; }
            if (!empty($mLineInClause)) { $whereParts[] = substr($mLineInClause, 5); $whereParams = array_merge($whereParams, $mLineInParams); $whereTypes .= $mLineInTypes; }
            $whereStr = implode(' AND ', $whereParts);
            $sql = "SELECT SUM(QUANTITY) AS qty, SUM(CUMULATIVE_OUTPUT) AS cum FROM `$tbl` WHERE $whereStr";
            $stmt = $conn->prepare($sql);
            if (!empty($whereParams)) $stmt->bind_param($whereTypes, ...$whereParams);
            $stmt->execute(); $row = $stmt->get_result()->fetch_assoc();
            $cumSum += (int)($row['cum'] ?? 0); $qtySum += (int)($row['qty'] ?? 0);
        }
        $monthlyKPIs['cumulative'] = $cumSum;
        $monthlyKPIs['quantity']   = $qtySum;
    }

    // ── Shift Output by Week chart (now from summary_line) ──
    if (!empty($summaryTables) && $filterMonth) {
        $opsStartDates = [];
        $tempData = []; // will store [OPERATING_DAYS_START, LINE, total_cum]
        foreach ($summaryTables as $tbl) {
            $whereParts = ['YEAR = ?', 'MONTH = ?'];
            $whereParams = [$filterYear, $filterMonth];
            $whereTypes  = 'is';
            if (!empty($filterTeam)) { $whereParts[] = 'TEAM = ?'; $whereParams[] = $filterTeam; $whereTypes .= 's'; }
            if (!empty($mLineInClause)) {
                $whereParts[] = substr($mLineInClause, 5);
                $whereParams = array_merge($whereParams, $mLineInParams);
                $whereTypes .= $mLineInTypes;
            }
            $whereStr = implode(' AND ', $whereParts);
            $sql = "SELECT OPERATING_DAYS_START, LINE, SUM(CUMULATIVE_OUTPUT) AS total_cum
                    FROM `$tbl` WHERE $whereStr
                    GROUP BY OPERATING_DAYS_START, LINE";
            $stmt = $conn->prepare($sql);
            if (!empty($whereParams)) $stmt->bind_param($whereTypes, ...$whereParams);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) {
                $tempData[] = $r;
                $opsStartDates[$r['OPERATING_DAYS_START']] = true;
            }
        }

        $opsStartList = array_keys($opsStartDates);
        sort($opsStartList);
        $weekCount = min(count($opsStartList), 5);
        $opsStartList = array_slice($opsStartList, 0, $weekCount);

        // Build labels: "Week 1", "Week 2", etc. (or could use dates)
        $mLabels = [];
        for ($i = 1; $i <= $weekCount; $i++) $mLabels[] = 'Week ' . $i;

        // Group data per line
        $lineData = [];
        foreach ($tempData as $r) {
            $line = $r['LINE'];
            $idx = array_search($r['OPERATING_DAYS_START'], $opsStartList);
            if ($idx === false) continue;
            if (!isset($lineData[$line])) {
                $lineData[$line] = array_fill(0, $weekCount, 0);
            }
            $lineData[$line][$idx] += (int)$r['total_cum'];
        }

        $mDatasets = [];
        $colorIdx = 0;
        $colors = [
            ['bg' => 'rgba(59,130,246,0.7)', 'border' => '#3b82f6'],
            ['bg' => 'rgba(249,115,22,0.7)', 'border' => '#f97316'],
            ['bg' => 'rgba(34,197,94,0.7)',  'border' => '#22c55e'],
            ['bg' => 'rgba(168,85,247,0.7)', 'border' => '#a855f7'],
            ['bg' => 'rgba(236,72,153,0.7)', 'border' => '#ec4899'],
        ];
        foreach ($lineData as $line => $data) {
            $c = $colors[$colorIdx % count($colors)];
            $mDatasets[] = [
                'label'           => $line,
                'data'            => $data,
                'backgroundColor' => $c['bg'],
                'borderColor'     => $c['border'],
                'borderWidth'     => 1,
            ];
            $colorIdx++;
        }
        $monthlyChartData = ['labels' => $mLabels, 'datasets' => $mDatasets];
    }

    // ── Cumulative vs Quantity chart (from summary_line, grouped by OPERATING_DAYS_START) ──
    $monthlyCumChartData = [];
    if (!empty($summaryTables) && $filterMonth) {
        $tempData = []; $opsStartDates = [];
        foreach ($summaryTables as $tbl) {
            $whereParts = ['YEAR = ?', 'MONTH = ?'];
            $whereParams = [$filterYear, $filterMonth]; $whereTypes = 'is';
            if (!empty($filterTeam)) { $whereParts[] = 'TEAM = ?'; $whereParams[] = $filterTeam; $whereTypes .= 's'; }
            if (!empty($mLineInClause)) { $whereParts[] = substr($mLineInClause, 5); $whereParams = array_merge($whereParams, $mLineInParams); $whereTypes .= $mLineInTypes; }
            $whereStr = implode(' AND ', $whereParts);
            $sql = "SELECT OPERATING_DAYS_START, SUM(QUANTITY) AS q, SUM(CUMULATIVE_OUTPUT) AS c FROM `$tbl` WHERE $whereStr GROUP BY OPERATING_DAYS_START";
            $stmt = $conn->prepare($sql);
            if (!empty($whereParams)) $stmt->bind_param($whereTypes, ...$whereParams);
            $stmt->execute(); $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) { $tempData[] = $r; $opsStartDates[$r['OPERATING_DAYS_START']] = true; }
        }
        $opsStartDates = array_keys($opsStartDates); sort($opsStartDates);
        $weekCount = min(count($opsStartDates), 5); $opsStartDates = array_slice($opsStartDates, 0, 5);
        if ($weekCount > 0) {
            $dateToIdx = array_flip($opsStartDates);
            $cumData = array_fill(0, $weekCount, 0); $qtyData = array_fill(0, $weekCount, 0);
            foreach ($tempData as $r) {
                $idx = $dateToIdx[$r['OPERATING_DAYS_START']] ?? -1;
                if ($idx >= 0) { $cumData[$idx] += (int)$r['c']; $qtyData[$idx] += (int)$r['q']; }
            }
            $mLabels = []; for ($i = 1; $i <= $weekCount; $i++) $mLabels[] = 'Week ' . $i;
            $monthlyCumChartData = ['labels' => $mLabels, 'datasets' => [
                ['label' => 'Cumulative Output', 'data' => $cumData, 'backgroundColor' => 'rgba(59,130,246,0.8)', 'borderColor' => '#3b82f6', 'borderWidth' => 1],
                ['label' => 'Quantity',          'data' => $qtyData, 'backgroundColor' => 'rgba(239,68,68,0.7)', 'borderColor' => '#ef4444', 'borderWidth' => 1]
            ]];
        }
    }
}

// =============================================
// YEARLY REPORT LOGIC
// =============================================
$yearlyKPIs = ['skuCount' => 0, 'lipasCount' => 0, 'cumulative' => 0, 'quantity' => 0];
$yearlyLineOptions = [];

if ($report == 'yearly') {
    $yearlyLineOptions = [];
    if (!empty($filterTeam)) {
        $ylStmt = $conn->prepare("SELECT DISTINCT LINE FROM sku_master WHERE TEAM = ? AND LINE IS NOT NULL ORDER BY LINE");
        $ylStmt->bind_param('s', $filterTeam);
    } else {
        $ylStmt = $conn->prepare("SELECT DISTINCT LINE FROM sku_master WHERE LINE IS NOT NULL ORDER BY LINE");
    }
    $ylStmt->execute(); $ylRes = $ylStmt->get_result();
    while ($ylr = $ylRes->fetch_assoc()) { $yearlyLineOptions[] = $ylr['LINE']; }
    [$yLineInClause, $yLineInParams, $yLineInTypes] = buildLineIn($filterLines);

    if (empty($filterTeam)) {
        $reportTables  = ['a_report_line', 'b_report_line', 'c_report_line'];
        $summaryTables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];
    } elseif ($filterTeam === 'A') {
        $reportTables  = ['a_report_line'];
        $summaryTables = ['a_summary_line'];
    } elseif ($filterTeam === 'B') {
        $reportTables  = ['b_report_line'];
        $summaryTables = ['b_summary_line'];
    } elseif ($filterTeam === 'C') {
        $reportTables  = ['c_report_line'];
        $summaryTables = ['c_summary_line'];
    } else {
        $reportTables  = [];
        $summaryTables = [];
    }

    // --- KPI part 1: SKU & LIPAS from report_line ---
    if (!empty($reportTables)) {
        $unions = []; $params = []; $types = '';
        foreach ($reportTables as $tbl) {
            $yw = "YEAR = ?" . $yLineInClause;
            $yp = array_merge([$filterYear], $yLineInParams);
            $yt = 'i' . $yLineInTypes;
            $outer = preg_replace('/\b(YEAR|MONTH|LINE)\b/', 't.$1', $yw);
            $unions[] = "
                SELECT t.SKU_CODE, t.LIPAS_COUNT
                FROM `$tbl` t
                INNER JOIN (
                    SELECT TEAM, LINE, SKU_CODE, OPERATING_DAYS_START, OPERATING_DAYS_END, MONTH, YEAR,
                           MAX(SHIFT_NUMBER) AS ms
                    FROM `$tbl` WHERE $yw
                    GROUP BY TEAM, LINE, SKU_CODE, OPERATING_DAYS_START, OPERATING_DAYS_END, MONTH, YEAR
                ) mx ON t.TEAM=mx.TEAM AND t.LINE=mx.LINE AND t.SKU_CODE=mx.SKU_CODE
                     AND t.OPERATING_DAYS_START=mx.OPERATING_DAYS_START AND t.OPERATING_DAYS_END=mx.OPERATING_DAYS_END
                     AND t.MONTH=mx.MONTH AND t.YEAR=mx.YEAR AND t.SHIFT_NUMBER=mx.ms
                WHERE $outer";
            $params = array_merge($params, $yp, $yp); $types .= $yt . $yt;
        }
        $stmt = $conn->prepare(implode(' UNION ALL ', $unions));
        if (!empty($params)) $stmt->bind_param($types, ...$params);
        $stmt->execute(); $res = $stmt->get_result();
        $skuSet = []; $lipasSet = [];
        while ($r = $res->fetch_assoc()) {
            $skuSet[$r['SKU_CODE']] = true;
            if ($r['LIPAS_COUNT'] === 'Y') $lipasSet[$r['SKU_CODE']] = true;
        }
        $yearlyKPIs['skuCount'] = count($skuSet);
        $yearlyKPIs['lipasCount'] = count($lipasSet);
    }

    // --- KPI part 2: Cumulative & Quantity from summary tables ---
    if (!empty($summaryTables)) {
        $cumSum = 0; $qtySum = 0;
        foreach ($summaryTables as $tbl) {
            $whereParts  = ['YEAR = ?'];
            $whereParams = [$filterYear]; $whereTypes = 'i';
            if (!empty($filterTeam)) { $whereParts[] = 'TEAM = ?'; $whereParams[] = $filterTeam; $whereTypes .= 's'; }
            if (!empty($yLineInClause)) { $whereParts[] = substr($yLineInClause, 5); $whereParams = array_merge($whereParams, $yLineInParams); $whereTypes .= $yLineInTypes; }
            $whereStr = implode(' AND ', $whereParts);
            $sql = "SELECT SUM(QUANTITY) AS qty, SUM(CUMULATIVE_OUTPUT) AS cum FROM `$tbl` WHERE $whereStr";
            $stmt = $conn->prepare($sql);
            if (!empty($whereParams)) $stmt->bind_param($whereTypes, ...$whereParams);
            $stmt->execute(); $row = $stmt->get_result()->fetch_assoc();
            $cumSum += (int)($row['cum'] ?? 0); $qtySum += (int)($row['qty'] ?? 0);
        }
        $yearlyKPIs['cumulative'] = $cumSum;
        $yearlyKPIs['quantity']   = $qtySum;
    }

    // ── Cumulative Output by Month chart (from summary_line) ──
    $allMonths = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
    if (!empty($summaryTables)) {
        $lineData = [];
        foreach ($summaryTables as $tbl) {
            $whereParts  = ['YEAR = ?'];
            $whereParams = [$filterYear]; $whereTypes = 'i';
            if (!empty($filterTeam)) { $whereParts[] = 'TEAM = ?'; $whereParams[] = $filterTeam; $whereTypes .= 's'; }
            if (!empty($yLineInClause)) { $whereParts[] = substr($yLineInClause, 5); $whereParams = array_merge($whereParams, $yLineInParams); $whereTypes .= $yLineInTypes; }
            $whereStr = implode(' AND ', $whereParts);
            $sql = "SELECT MONTH, LINE, SUM(CUMULATIVE_OUTPUT) AS cum
                    FROM `$tbl` WHERE $whereStr
                    GROUP BY MONTH, LINE";
            $stmt = $conn->prepare($sql);
            if (!empty($whereParams)) $stmt->bind_param($whereTypes, ...$whereParams);
            $stmt->execute();
            $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) {
                $month = $r['MONTH'];
                $line  = $r['LINE'];
                if (!isset($lineData[$line])) {
                    $lineData[$line] = array_fill(0, 12, 0);
                }
                $idx = array_search($month, $allMonths);
                if ($idx !== false) {
                    $lineData[$line][$idx] += (int)$r['cum'];
                }
            }
        }
        $yLabels = array_map(fn($m) => ucfirst(strtolower($m)), $allMonths);
        $yDatasets = [];
        $colorIdx = 0;
        $colors = [
            ['bg' => 'rgba(59,130,246,0.7)', 'border' => '#3b82f6'],
            ['bg' => 'rgba(249,115,22,0.7)', 'border' => '#f97316'],
            ['bg' => 'rgba(34,197,94,0.7)',  'border' => '#22c55e'],
            ['bg' => 'rgba(168,85,247,0.7)', 'border' => '#a855f7'],
            ['bg' => 'rgba(236,72,153,0.7)', 'border' => '#ec4899'],
        ];
        foreach ($lineData as $line => $data) {
            $c = $colors[$colorIdx % count($colors)];
            $yDatasets[] = [
                'label'           => $line,
                'data'            => $data,
                'backgroundColor' => $c['bg'],
                'borderColor'     => $c['border'],
                'borderWidth'     => 1,
            ];
            $colorIdx++;
        }
        $yearlyChartData = ['labels' => $yLabels, 'datasets' => $yDatasets];
    }

    // ── Cumulative vs Quantity chart (from summary_line, grouped by month) ──
    if (!empty($summaryTables)) {
        $monthsData = array_fill_keys($allMonths, ['c' => 0, 'q' => 0]);
        foreach ($summaryTables as $tbl) {
            $whereParts  = ['YEAR = ?'];
            $whereParams = [$filterYear]; $whereTypes = 'i';
            if (!empty($filterTeam)) { $whereParts[] = 'TEAM = ?'; $whereParams[] = $filterTeam; $whereTypes .= 's'; }
            if (!empty($yLineInClause)) { $whereParts[] = substr($yLineInClause, 5); $whereParams = array_merge($whereParams, $yLineInParams); $whereTypes .= $yLineInTypes; }
            $whereStr = implode(' AND ', $whereParts);
            $sql = "SELECT MONTH, SUM(QUANTITY) AS q, SUM(CUMULATIVE_OUTPUT) AS c FROM `$tbl` WHERE $whereStr GROUP BY MONTH";
            $stmt = $conn->prepare($sql); if (!empty($whereParams)) $stmt->bind_param($whereTypes, ...$whereParams);
            $stmt->execute(); $res = $stmt->get_result();
            while ($r = $res->fetch_assoc()) { $monthsData[$r['MONTH']]['c'] += (int)$r['c']; $monthsData[$r['MONTH']]['q'] += (int)$r['q']; }
        }
        $yCumData = []; $yQtyData = [];
        foreach ($allMonths as $m) { $yCumData[] = $monthsData[$m]['c']; $yQtyData[] = $monthsData[$m]['q']; }
        $yMonthShortLabels = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        $yearlyCumChartData = ['labels' => $yMonthShortLabels, 'datasets' => [
            ['label' => 'Cumulative Output', 'data' => $yCumData, 'backgroundColor' => 'rgba(59,130,246,0.8)', 'borderColor' => '#3b82f6', 'borderWidth' => 1],
            ['label' => 'Quantity',          'data' => $yQtyData, 'backgroundColor' => 'rgba(239,68,68,0.7)', 'borderColor' => '#ef4444', 'borderWidth' => 1]
        ]];
    }
}

// =============================================
// LIPAS VOLPAS REPORT LOGIC
// =============================================
$lvSummaryData = [
    'lipasTotalPlan'   => 0,
    'lipasTotalActual' => 0,
    'lipasPercentage'  => 0,
    'volpasTotalPlan'  => 0,
    'volpasTotalActual'=> 0,
    'volpasPercentage' => 0,
];
$lvLineOptions    = [];

if ($report == 'lipas_volpas') {

    $lvAllMonths = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
                    'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

    $_lvPeriod   = $_GET['lv_period']    ?? 'monthly';
    $lvPeriod    = in_array($_lvPeriod,   ['weekly', 'monthly'], true) ? $_lvPeriod   : 'monthly';

    $_lvDataset  = $_GET['lv_dataset']   ?? 'both';
    $lvDataset   = in_array($_lvDataset,  ['both', 'lipas', 'volpas'], true) ? $_lvDataset  : 'both';

    // Chart type: only 'bar' and 'pie' (line removed)
    $_lvChartType = $_GET['lv_charttype'] ?? 'bar';
    $lvChartType  = in_array($_lvChartType, ['bar', 'pie'], true) ? $_lvChartType : 'bar';

    $lvYear  = (int)($_GET['lv_year'] ?? date('Y'));

    $lvMonthRaw = strtoupper(trim($_GET['lv_month'] ?? ''));
    $lvMonth    = in_array($lvMonthRaw, $lvAllMonths, true) ? $lvMonthRaw : '';

    $lvWeekRaw = $_GET['lv_week'] ?? 'all';
    $lvWeek    = ($lvWeekRaw === 'all' || (is_numeric($lvWeekRaw) && (int)$lvWeekRaw >= 1 && (int)$lvWeekRaw <= 5))
                    ? $lvWeekRaw
                    : 'all';

    $lvTeamRaw = $_GET['lv_team'] ?? '';
    $lvTeam    = in_array($lvTeamRaw, ['', 'A', 'B', 'C'], true) ? $lvTeamRaw : '';

    $lvLineRaw = trim($_GET['lv_line'] ?? '');

    if (!empty($lvTeam)) {
        $lvLineStmt = $conn->prepare("SELECT DISTINCT LINE FROM `lipas_record` WHERE TEAM = ? AND LINE IS NOT NULL AND LINE != '' ORDER BY LINE");
        $lvLineStmt->bind_param('s', $lvTeam);
    } else {
        $lvLineStmt = $conn->prepare("SELECT DISTINCT LINE FROM `lipas_record` WHERE LINE IS NOT NULL AND LINE != '' ORDER BY LINE");
    }
    $lvLineStmt->execute(); $lvLineRes = $lvLineStmt->get_result();
    while ($llr = $lvLineRes->fetch_assoc()) { $lvLineOptions[] = $llr['LINE']; }

    $lvLine = in_array($lvLineRaw, $lvLineOptions, true) ? $lvLineRaw : '';

    $lvBuildWhere = function() use ($lvPeriod, $lvYear, $lvMonth, $lvTeam, $lvLine) {
        $w = "YEAR = ?"; $p = [(int)$lvYear]; $t = 'i';
        if (!empty($lvTeam))  { $w .= " AND TEAM = ?";  $p[] = $lvTeam;  $t .= 's'; }
        if (!empty($lvLine))  { $w .= " AND LINE = ?";  $p[] = $lvLine;  $t .= 's'; }
        if ($lvPeriod === 'monthly' && !empty($lvMonth)) {
            $w .= " AND MONTH = ?"; $p[] = $lvMonth; $t .= 's';
        }
        return [$w, $p, $t];
    };

    [$lvWhere, $lvParams, $lvTypes] = $lvBuildWhere();

    $allMonthsOrder = $lvAllMonths;

    $fetchLvData = function($table, $isWeekly, $lvWeek, $lvWhere, $lvParams, $lvTypes, $conn) {
        if ($isWeekly) {
            if ($lvWeek === 'all') {
                $sql = "SELECT OPERATING_DAYS_PLAN_1, OPERATING_DAYS_ACTUAL_1,
                               OPERATING_DAYS_PLAN_2, OPERATING_DAYS_ACTUAL_2,
                               OPERATING_DAYS_PLAN_3, OPERATING_DAYS_ACTUAL_3,
                               OPERATING_DAYS_PLAN_4, OPERATING_DAYS_ACTUAL_4,
                               OPERATING_DAYS_PLAN_5, OPERATING_DAYS_ACTUAL_5
                        FROM `$table` WHERE $lvWhere";
            } else {
                $w = (int)$lvWeek;
                $sql = "SELECT OPERATING_DAYS_PLAN_{$w} AS operating_plan,
                               OPERATING_DAYS_ACTUAL_{$w} AS operating_actual
                        FROM `$table` WHERE $lvWhere";
            }
        } else {
            $sql = "SELECT MONTH, SUM(TOTAL_PLAN) AS plan, SUM(TOTAL_ACTUAL) AS actual
                    FROM `$table` WHERE $lvWhere GROUP BY MONTH";
        }
        $stmt = $conn->prepare($sql);
        if (!empty($lvParams)) $stmt->bind_param($lvTypes, ...$lvParams);
        $stmt->execute();
        return $stmt->get_result();
    };

    $lipasPlan = []; $lipasActual = []; $volpasPlan = []; $volpasActual = [];
    $weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];

    if ($lvPeriod === 'weekly') {
        if ($lvWeek === 'all') {
            $lipasPlan  = array_fill(0, 5, 0); $lipasActual  = array_fill(0, 5, 0);
            $volpasPlan = array_fill(0, 5, 0); $volpasActual = array_fill(0, 5, 0);
            if ($lvDataset !== 'volpas') {
                $res = $fetchLvData('lipas_record', true, 'all', $lvWhere, $lvParams, $lvTypes, $conn);
                while ($r = $res->fetch_assoc()) {
                    for ($w = 1; $w <= 5; $w++) {
                        $lipasPlan[$w-1]  += (int)($r["OPERATING_DAYS_PLAN_{$w}"]   ?? 0);
                        $lipasActual[$w-1] += (int)($r["OPERATING_DAYS_ACTUAL_{$w}"] ?? 0);
                    }
                }
            }
            if ($lvDataset !== 'lipas') {
                $res = $fetchLvData('volpas_record', true, 'all', $lvWhere, $lvParams, $lvTypes, $conn);
                while ($r = $res->fetch_assoc()) {
                    for ($w = 1; $w <= 5; $w++) {
                        $volpasPlan[$w-1]  += (float)($r["OPERATING_DAYS_PLAN_{$w}"]   ?? 0);
                        $volpasActual[$w-1] += (float)($r["OPERATING_DAYS_ACTUAL_{$w}"] ?? 0);
                    }
                }
            }
            $lvXLabels = $weekLabels;
        } else {
            $wNum = (int)$lvWeek;
            $lipasPlan  = [0]; $lipasActual  = [0];
            $volpasPlan = [0]; $volpasActual = [0];
            if ($lvDataset !== 'volpas') {
                $res = $fetchLvData('lipas_record', true, $lvWeek, $lvWhere, $lvParams, $lvTypes, $conn);
                while ($r = $res->fetch_assoc()) {
                    $lipasPlan[0]  += (int)($r['operating_plan']   ?? 0);
                    $lipasActual[0] += (int)($r['operating_actual'] ?? 0);
                }
            }
            if ($lvDataset !== 'lipas') {
                $res = $fetchLvData('volpas_record', true, $lvWeek, $lvWhere, $lvParams, $lvTypes, $conn);
                while ($r = $res->fetch_assoc()) {
                    $volpasPlan[0]  += (float)($r['operating_plan']   ?? 0);
                    $volpasActual[0] += (float)($r['operating_actual'] ?? 0);
                }
            }
            $lvXLabels = ["Week $wNum"];
        }

    } else {
        if (!empty($lvMonth)) {
            $monthKeys = [$lvMonth];
            $lvXLabels = [ucfirst(strtolower($lvMonth))];
            $numMonths = 1;
        } else {
            $monthKeys = $allMonthsOrder;
            $lvXLabels = [];
            foreach ($monthKeys as $m) { $lvXLabels[] = ucfirst(strtolower($m)); }
            $numMonths = 12;
        }
        $lipasPlan  = array_fill(0, $numMonths, 0); $lipasActual  = array_fill(0, $numMonths, 0);
        $volpasPlan = array_fill(0, $numMonths, 0); $volpasActual = array_fill(0, $numMonths, 0);
        if ($lvDataset !== 'volpas') {
            $res = $fetchLvData('lipas_record', false, 'all', $lvWhere, $lvParams, $lvTypes, $conn);
            while ($r = $res->fetch_assoc()) {
                $idx = array_search($r['MONTH'], $monthKeys);
                if ($idx !== false) { $lipasPlan[$idx] += (int)$r['plan']; $lipasActual[$idx] += (int)$r['actual']; }
            }
        }
        if ($lvDataset !== 'lipas') {
            $res = $fetchLvData('volpas_record', false, 'all', $lvWhere, $lvParams, $lvTypes, $conn);
            while ($r = $res->fetch_assoc()) {
                $idx = array_search($r['MONTH'], $monthKeys);
                if ($idx !== false) { $volpasPlan[$idx] += (float)$r['plan']; $volpasActual[$idx] += (float)$r['actual']; }
            }
        }
    }

    $lipasChartData = ['labels' => $lvXLabels, 'datasets' => [
        ['label' => 'LIPAS Plan',   'data' => $lipasPlan,   'backgroundColor' => 'rgba(59,130,246,0.5)', 'borderColor' => '#3b82f6', 'borderWidth' => 2, 'fill' => false],
        ['label' => 'LIPAS Actual', 'data' => $lipasActual, 'backgroundColor' => 'rgba(59,130,246,0.85)', 'borderColor' => '#1d4ed8', 'borderWidth' => 2, 'fill' => false]
    ]];
    $volpasChartData = ['labels' => $lvXLabels, 'datasets' => [
        ['label' => 'VOLPAS Plan',   'data' => $volpasPlan,   'backgroundColor' => 'rgba(234,179,8,0.5)', 'borderColor' => '#eab308', 'borderWidth' => 2, 'fill' => false],
        ['label' => 'VOLPAS Actual', 'data' => $volpasActual, 'backgroundColor' => 'rgba(234,179,8,0.85)', 'borderColor' => '#a16207', 'borderWidth' => 2, 'fill' => false]
    ]];
    $lvSummaryData = [
        'lipasTotalPlan'   => array_sum($lipasPlan), 'lipasTotalActual' => array_sum($lipasActual),
        'lipasPercentage'  => array_sum($lipasPlan) > 0 ? min(100, round((array_sum($lipasActual) / array_sum($lipasPlan)) * 100, 2)) : 0,
        'volpasTotalPlan'   => array_sum($volpasPlan), 'volpasTotalActual' => array_sum($volpasActual),
        'volpasPercentage'  => array_sum($volpasPlan) > 0 ? min(100, round((array_sum($volpasActual) / array_sum($volpasPlan)) * 100, 2)) : 0,
    ];

    if ($lvChartType === 'pie') {
        $lipasDataset = array(
            'data' => array(
                $lvSummaryData['lipasTotalPlan'],
                $lvSummaryData['lipasTotalActual']
            ),
            'backgroundColor' => array(
                'rgba(59,130,246,0.7)',
                'rgba(29,78,216,0.85)'
            ),
            'borderWidth' => 1
        );
        $lipasChartData = array(
            'labels' => array('LIPAS Plan', 'LIPAS Actual'),
            'datasets' => array($lipasDataset)
        );

        $volpasDataset = array(
            'data' => array(
                $lvSummaryData['volpasTotalPlan'],
                $lvSummaryData['volpasTotalActual']
            ),
            'backgroundColor' => array(
                'rgba(234,179,8,0.7)',
                'rgba(161,98,7,0.85)'
            ),
            'borderWidth' => 1
        );
        $volpasChartData = array(
            'labels' => array('VOLPAS Plan', 'VOLPAS Actual'),
            'datasets' => array($volpasDataset)
        );
    }
}

// ── Load the HTML template ──────────────────────────────────
require __DIR__ . '/view/mainpage.tpl.php';