<?php
/**
 * api_report.php
 * Returns KPI card values and chart datasets for the admin dashboard.
 * Replaces the full-page PHP logic in admin_mainpage.php.
 * All three roles can read report data.
 *
 * GET params:
 *   report  — weekly | monthly | yearly
 *   year    — e.g. 2026
 *   month   — e.g. FEBRUARY  (optional for yearly; '' = all months for monthly)
 *   team    — A | B | C | '' (all teams)
 *   line[]  — array of line values e.g. line[]=LINE_06&line[]=LINE_12
 *   shift   — 1 | 2 | 3 | all
 *   ops_days — optional, e.g. 2026-06-29|2026-07-05  (replaces week filter)
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "kpis":            { skuCount, lipasCount, cumulative, quantity },
 *     "shiftChart":      { labels: [], datasets: [] },
 *     "cumulativeChart": { labels: [], datasets: [] }
 *   }
 * }
 */

require_once __DIR__ . '/api_auth.php';

require_auth();   // admin, data_entry, viewer all permitted

// ── Input ────────────────────────────────────────────────────────
$report      = trim($_GET['report'] ?? '');
$filterYear  = (int)($_GET['year']  ?? date('Y'));
$filterMonth = strtoupper(trim($_GET['month'] ?? ''));
$filterTeam  = trim($_GET['team']  ?? '');
$filterLines = isset($_GET['line']) && is_array($_GET['line'])
               ? array_values(array_filter($_GET['line']))
               : [];
$filterShift = trim($_GET['shift'] ?? 'all');
$opsDays     = trim($_GET['ops_days'] ?? '');   // NEW: operating days filter

$allowedReports = ['weekly', 'monthly', 'yearly'];
if (!in_array($report, $allowedReports, true)) {
    api_error('Invalid report type');
}

// ── Table map ────────────────────────────────────────────────────
$teamTableMap = [
    'A' => ['a_report_line'],
    'B' => ['b_report_line'],
    'C' => ['c_report_line'],
    ''  => ['a_report_line', 'b_report_line', 'c_report_line'],
];
if (!array_key_exists($filterTeam, $teamTableMap)) {
    api_error('Invalid team value');
}
$tables = $teamTableMap[$filterTeam];

// ── Shift colours ────────────────────────────────────────────────
$shiftColors = [
    1 => ['bg' => 'rgba(59,130,246,0.8)',  'border' => '#3b82f6'],
    2 => ['bg' => 'rgba(249,115,22,0.8)',  'border' => '#f97316'],
    3 => ['bg' => 'rgba(34,197,94,0.8)',   'border' => '#22c55e'],
];
$shiftsToQuery = ($filterShift === 'all' || $filterShift === '')
                 ? [1, 2, 3]
                 : [(int)$filterShift];

// ── Shared: build base WHERE per table ───────────────────────────
[$lineInClause, $lineInParams, $lineInTypes] = buildLineIn($filterLines);

function baseWhere(
    string $report,
    int    $year,
    string $month,
    string $opsDays,
    string $lineInClause,
    array  $lineInParams,
    string $lineInTypes
): array {
    $w = "YEAR = ?";
    $p = [$year];
    $t = 'i';

    if ($report === 'weekly' || $report === 'monthly') {
        if (!empty($month)) { $w .= " AND MONTH = ?"; $p[] = $month; $t .= 's'; }
    }
    // Use operating days filter instead of week
    if (!empty($opsDays)) {
        [$opsStart, $opsEnd] = explode('|', $opsDays, 2);
        if ($opsStart && $opsEnd) {
            $w .= " AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?";
            $p[] = $opsStart;
            $p[] = $opsEnd;
            $t .= 'ss';
        }
    }

    $w .= $lineInClause;
    $p  = array_merge($p, $lineInParams);
    $t .= $lineInTypes;
    return [$w, $p, $t];
}

// ════════════════════════════════════════════════════════════════
// KPI CARDS
// ════════════════════════════════════════════════════════════════
$kpiUnions = []; $kpiParams = []; $kpiTypes = '';
foreach ($tables as $tbl) {
    [$w, $p, $t] = baseWhere($report, $filterYear, $filterMonth, $opsDays, $lineInClause, $lineInParams, $lineInTypes);
    $kpiUnions[] = "SELECT SKU_CODE, QUANTITY, CUMULATIVE_OUTPUT, LIPAS_COUNT FROM `$tbl` WHERE $w";
    $kpiParams   = array_merge($kpiParams, $p);
    $kpiTypes   .= $t;
}
$kpiStmt = $conn->prepare(implode(' UNION ALL ', $kpiUnions));
if (!empty($kpiParams)) $kpiStmt->bind_param($kpiTypes, ...$kpiParams);
$kpiStmt->execute();
$kpiRes = $kpiStmt->get_result();

$skuSet = []; $lipasSkuSet = []; $cumSum = 0; $qtySum = 0;
while ($r = $kpiRes->fetch_assoc()) {
    if ($r['QUANTITY'] > 0) $skuSet[$r['SKU_CODE']] = true;
    if ($r['LIPAS_COUNT'] === 'Y') $lipasSkuSet[$r['SKU_CODE']] = true;
    $cumSum += (int)$r['CUMULATIVE_OUTPUT'];
    $qtySum += (int)$r['QUANTITY'];
}
$kpis = [
    'skuCount'   => count($skuSet),
    'lipasCount' => count($lipasSkuSet),
    'cumulative' => $cumSum,
    'quantity'   => $qtySum,
];

// ════════════════════════════════════════════════════════════════
// SHIFT OUTPUT CHART
// ════════════════════════════════════════════════════════════════
$xAxisCol = match($report) {
    'weekly'  => 'LINE',
    'monthly' => 'OPERATING_DAYS_START',   // use start date as x-axis
    'yearly'  => 'MONTH',
};

$sUnions = []; $sParams = []; $sTypes = '';
foreach ($tables as $tbl) {
    [$w, $p, $t] = baseWhere($report, $filterYear, $filterMonth, $opsDays, $lineInClause, $lineInParams, $lineInTypes);
    $sw = $w; $sp = $p; $st = $t;
    if (count($shiftsToQuery) === 1) {
        $sw .= " AND SHIFT_NUMBER = ?"; $sp[] = $shiftsToQuery[0]; $st .= 'i';
    }
    $sUnions[] = "SELECT `$xAxisCol` AS x_val, SHIFT_NUMBER, SUM(SHIFT_OUTPUT) AS total
                  FROM `$tbl` WHERE $sw GROUP BY `$xAxisCol`, SHIFT_NUMBER";
    $sParams   = array_merge($sParams, $sp);
    $sTypes   .= $st;
}

$allMonths = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
$orderClause = $report === 'yearly'
    ? "ORDER BY FIELD(x_val,'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'), SHIFT_NUMBER"
    : "ORDER BY x_val, SHIFT_NUMBER";

$sSql  = "SELECT x_val, SHIFT_NUMBER, SUM(total) AS total
          FROM (" . implode(' UNION ALL ', $sUnions) . ") AS sc
          GROUP BY x_val, SHIFT_NUMBER $orderClause";
$sStmt = $conn->prepare($sSql);
if (!empty($sParams)) $sStmt->bind_param($sTypes, ...$sParams);
$sStmt->execute();
$sRes = $sStmt->get_result();

$sRaw = []; $xSet = [];
while ($r = $sRes->fetch_assoc()) {
    $xVal  = $r['x_val'];
    $sNum  = (int)$r['SHIFT_NUMBER'];
    $sRaw[$sNum][$xVal] = (int)$r['total'];
    $xSet[$xVal] = true;
}

// Build ordered labels
if ($report === 'yearly') {
    $shiftLabels = array_map(fn($m) => ucfirst(strtolower($m)), $allMonths);
    $shiftKeys   = $allMonths;
} elseif ($report === 'monthly') {
    // For monthly, x_val is OPERATING_DAYS_START; we map them to "Week 1", "Week 2", etc.
    $shiftKeysRaw = array_keys($xSet);
    sort($shiftKeysRaw);
    $shiftLabels = [];
    foreach ($shiftKeysRaw as $index => $date) {
        $shiftLabels[] = 'Week ' . ($index + 1);
    }
    $shiftKeys = $shiftKeysRaw;
} else {
    $shiftKeys   = array_keys($xSet);
    $shiftLabels = $shiftKeys; // weekly uses LINE names
}

$shiftDatasets = [];
foreach ($shiftsToQuery as $sNum) {
    $data = [];
    foreach ($shiftKeys as $k) { $data[] = $sRaw[$sNum][$k] ?? 0; }
    $label = $sNum . ($sNum === 1 ? 'st' : ($sNum === 2 ? 'nd' : 'rd')) . ' Shift';
    $shiftDatasets[] = [
        'label'           => $label,
        'data'            => $data,
        'backgroundColor' => $shiftColors[$sNum]['bg'],
        'borderColor'     => $shiftColors[$sNum]['border'],
        'borderWidth'     => 1,
    ];
}
$shiftChart = ['labels' => $shiftLabels, 'datasets' => $shiftDatasets];

// ════════════════════════════════════════════════════════════════
// CUMULATIVE OUTPUT vs QUANTITY CHART
// ════════════════════════════════════════════════════════════════
$cUnions = []; $cParams = []; $cTypes = '';
foreach ($tables as $tbl) {
    [$w, $p, $t] = baseWhere($report, $filterYear, $filterMonth, $opsDays, $lineInClause, $lineInParams, $lineInTypes);
    $cUnions[] = "SELECT `$xAxisCol` AS x_val, SUM(CUMULATIVE_OUTPUT) AS c, SUM(QUANTITY) AS q
                  FROM `$tbl` WHERE $w GROUP BY `$xAxisCol`";
    $cParams   = array_merge($cParams, $p);
    $cTypes   .= $t;
}
$cOrderClause = $report === 'yearly'
    ? "ORDER BY FIELD(x_val,'JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER')"
    : "ORDER BY x_val";
$cSql  = "SELECT x_val, SUM(c) AS c, SUM(q) AS q
          FROM (" . implode(' UNION ALL ', $cUnions) . ") AS cc
          GROUP BY x_val $cOrderClause";
$cStmt = $conn->prepare($cSql);
if (!empty($cParams)) $cStmt->bind_param($cTypes, ...$cParams);
$cStmt->execute();
$cRes = $cStmt->get_result();

$cRaw = [];
while ($r = $cRes->fetch_assoc()) { $cRaw[$r['x_val']] = ['c' => (int)$r['c'], 'q' => (int)$r['q']]; }

$cumData = []; $qtyData = [];
foreach ($shiftKeys as $k) {
    $cumData[] = $cRaw[$k]['c'] ?? 0;
    $qtyData[] = $cRaw[$k]['q'] ?? 0;
}
$cumulativeChart = [
    'labels'   => $shiftLabels,
    'datasets' => [
        ['label' => 'Cumulative Output', 'data' => $cumData, 'backgroundColor' => 'rgba(59,130,246,0.8)', 'borderColor' => '#3b82f6', 'borderWidth' => 1],
        ['label' => 'Quantity',          'data' => $qtyData, 'backgroundColor' => 'rgba(239,68,68,0.7)',  'borderColor' => '#ef4444', 'borderWidth' => 1],
    ]
];

// ── Return all data ──────────────────────────────────────────────
api_response('success', [
    'kpis'            => $kpis,
    'shiftChart'      => $shiftChart,
    'cumulativeChart' => $cumulativeChart,
]);