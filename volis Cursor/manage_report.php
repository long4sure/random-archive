<?php
session_start();
require 'db.php';

require 'auth_check.php';
$pendingUsersCount = 0;
if ($_SESSION['role'] === 'system_admin') {
    $res = $conn->query("SELECT COUNT(*) AS cnt FROM users WHERE approval_status = 'pending'");
    if ($res) $pendingUsersCount = (int)$res->fetch_assoc()['cnt'];
}

// ── Viewer role restriction ────────────────────────────────────────
if ($_SESSION['role'] === 'viewer') {
    $allowedActions = ['manage'];
    $allowedTypes   = ['line_report', 'report'];
    $currAction     = $_GET['action'] ?? '';
    $currType       = $_GET['type']   ?? '';
    if (!in_array($currAction, $allowedActions) || !in_array($currType, $allowedTypes)) {
        header("Location: manage_report.php?action=manage&type=line_report");
        exit();
    }
}

// ── CSRF token ────────────────────────────────────────
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

// Allowed tables
$allowedTables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];

// ----- Common filter parameters -----
$filterTeam   = $_GET['team']   ?? '';
$filterYear   = $_GET['year']   ?? date('Y');
$filterMonth  = $_GET['month']  ?? '';
$asOfDate     = $_GET['as_of_date'] ?? date('Y-m-d');
$selectedOpsDays = $_GET['ops_days'] ?? '';

// Handle line filter
$filterLines = [];
if (isset($_GET['line']) && is_array($_GET['line'])) {
    $filterLines = array_filter($_GET['line']);
}

// Selected shifts
$selectedShifts = [];
if (isset($_GET['shift'])) {
    if (is_array($_GET['shift'])) {
        $selectedShifts = array_map('intval', array_filter($_GET['shift']));
    } else {
        $selectedShifts = [intval($_GET['shift'])];
    }
}
$selectedShifts = array_intersect($selectedShifts, [1,2,3]);
if (empty($selectedShifts)) $selectedShifts = [1,2,3];
sort($selectedShifts);

// Determine summary table
$summaryTable = '';
if ($filterTeam === 'A') $summaryTable = 'a_summary_line';
elseif ($filterTeam === 'B') $summaryTable = 'b_summary_line';
elseif ($filterTeam === 'C') $summaryTable = 'c_summary_line';

$months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];

// Fetch lines from sku_master
$linesFromMaster = [];
if ($filterTeam) {
    $stmt = $conn->prepare("SELECT DISTINCT LINE FROM sku_master WHERE TEAM = ? AND LINE IS NOT NULL AND LINE != '' ORDER BY LINE");
    $stmt->bind_param('s', $filterTeam);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) $linesFromMaster[] = $r['LINE'];
}

function buildLineIn(array $lines): array {
    if (empty($lines)) return ['', [], ''];
    $placeholders = implode(',', array_fill(0, count($lines), '?'));
    return [" AND LINE IN ($placeholders)", array_values($lines), str_repeat('s', count($lines))];
}

// ---- Counts for cascading filters ----
$teamCounts  = []; $yearCounts = []; $monthCounts = [];
$teamCounts['A'] = $conn->query("SELECT COUNT(*) AS cnt FROM a_summary_line")->fetch_assoc()['cnt'];
$teamCounts['B'] = $conn->query("SELECT COUNT(*) AS cnt FROM b_summary_line")->fetch_assoc()['cnt'];
$teamCounts['C'] = $conn->query("SELECT COUNT(*) AS cnt FROM c_summary_line")->fetch_assoc()['cnt'];

if ($summaryTable) {
    $res = $conn->query("SELECT YEAR, COUNT(*) AS cnt FROM `$summaryTable` GROUP BY YEAR ORDER BY YEAR DESC");
    while ($row = $res->fetch_assoc()) $yearCounts[(int)$row['YEAR']] = $row['cnt'];
} else {
    $res = $conn->query("SELECT YEAR, SUM(cnt) AS cnt FROM (
        SELECT YEAR, COUNT(*) AS cnt FROM a_summary_line GROUP BY YEAR
        UNION ALL
        SELECT YEAR, COUNT(*) AS cnt FROM b_summary_line GROUP BY YEAR
        UNION ALL
        SELECT YEAR, COUNT(*) AS cnt FROM c_summary_line GROUP BY YEAR
    ) AS t GROUP BY YEAR ORDER BY YEAR DESC");
    while ($row = $res->fetch_assoc()) $yearCounts[(int)$row['YEAR']] = $row['cnt'];
}

if ($summaryTable && $filterYear) {
    $stmt = $conn->prepare("SELECT MONTH, COUNT(*) AS cnt FROM `$summaryTable` WHERE YEAR = ? GROUP BY MONTH");
    $stmt->bind_param('i', $filterYear);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) $monthCounts[$row['MONTH']] = $row['cnt'];
} elseif ($filterYear) {
    $stmt = $conn->prepare("SELECT MONTH, SUM(cnt) AS cnt FROM (
        SELECT MONTH, COUNT(*) AS cnt FROM a_summary_line WHERE YEAR = ?
        UNION ALL SELECT MONTH, COUNT(*) AS cnt FROM b_summary_line WHERE YEAR = ?
        UNION ALL SELECT MONTH, COUNT(*) AS cnt FROM c_summary_line WHERE YEAR = ?
    ) AS t GROUP BY MONTH");
    $stmt->bind_param('iii', $filterYear, $filterYear, $filterYear);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) $monthCounts[$row['MONTH']] = $row['cnt'];
}

// Operating-day ranges for dropdown
$opsDaysOptions = [];
if ($filterTeam && $filterYear && $filterMonth) {
    $opsTable = match($filterTeam) { 'A' => 'a_summary_line', 'B' => 'b_summary_line', 'C' => 'c_summary_line' };
    $stmt = $conn->prepare("SELECT DISTINCT OPERATING_DAYS_START, OPERATING_DAYS_END FROM `$opsTable` WHERE YEAR = ? AND MONTH = ? ORDER BY OPERATING_DAYS_START");
    $stmt->bind_param('is', $filterYear, $filterMonth);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($r = $res->fetch_assoc()) $opsDaysOptions[] = $r;
}

// Validate as_of_date against selected ops_days (if a range is chosen)
if (!empty($selectedOpsDays)) {
    [$opsStart, $opsEnd] = explode('|', $selectedOpsDays, 2);
    if ($opsStart && $opsEnd) {
        if ($asOfDate < $opsStart || $asOfDate > $opsEnd) {
            $asOfDate = (date('Y-m-d') >= $opsStart && date('Y-m-d') <= $opsEnd) ? date('Y-m-d') : $opsStart;
        }
    }
}

function calculateRemainingShifts($startDate, $endDate, $asOfDateTime, $shift) {
    $start = new DateTime($startDate);
    $end = new DateTime($endDate);
    $end->setTime(23, 59, 59);
    $asOf = new DateTime($asOfDateTime);
    $totalDays = $start->diff($end)->days + 1;
    if ($asOf > $end) {
        return ['remaining' => 0, 'dayIndex' => $totalDays,
                'shiftOutputCol' => $shift . ($shift == 1 ? 'ST' : ($shift == 2 ? 'ND' : 'RD')) . "_SHIFT_DAY_" . $totalDays];
    }
    $daysElapsed = $start->diff($asOf)->days;
    $hour = (int)$asOf->format('H');
    $shiftIndex = match(true) { $hour >= 6 && $hour < 14 => 0, $hour >= 14 && $hour < 22 => 1, default => 2 };
    $remaining = max(0, $totalDays * 3 - ($daysElapsed * 3 + $shiftIndex));
    return ['remaining' => $remaining, 'dayIndex' => $daysElapsed + 1,
            'shiftOutputCol' => $shift . ($shift == 1 ? 'ST' : ($shift == 2 ? 'ND' : 'RD')) . "_SHIFT_DAY_" . ($daysElapsed + 1)];
}

// ========== Multi-shift report (Formulate) – single day view ==========
$shiftsData = [];
$asOfObj = new DateTime($asOfDate); $asOfObj->setTime(0,0,0);
if ($summaryTable && $filterMonth) {
    $where = "YEAR = ? AND MONTH = ?";
    $params = [$filterYear, $filterMonth]; $types = 'is';
    if (!empty($selectedOpsDays)) {
        [$opsStart, $opsEnd] = explode('|', $selectedOpsDays, 2);
        if ($opsStart && $opsEnd) { $where .= " AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?"; $params[] = $opsStart; $params[] = $opsEnd; $types .= 'ss'; }
    }
    [$lineInClause, $lineInParams, $lineInTypes] = buildLineIn($filterLines);
    $where .= $lineInClause; $params = array_merge($params, $lineInParams); $types .= $lineInTypes;

    $sql = "SELECT * FROM `$summaryTable` WHERE $where ORDER BY LINE, SKU_CODE";
    $stmt = $conn->prepare($sql);
    if (!empty($params)) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    foreach ($selectedShifts as $s) $shiftsData[$s] = ['rows' => [], 'totals' => ['quantity' => 0, 'shiftOutput' => 0, 'cumulative' => 0, 'lipasCount' => 0], 'skuCount' => 0];

    while ($row = $result->fetch_assoc()) {
        $start = $row['OPERATING_DAYS_START']; $end = $row['OPERATING_DAYS_END'];
        $startObj = new DateTime($start); $endObj = new DateTime($end); $startObj->setTime(0,0,0); $endObj->setTime(23,59,59);
        if ($asOfObj < $startObj || $asOfObj > $endObj) continue;
        $quantity = (int)$row['QUANTITY']; $cumulative = (int)$row['CUMULATIVE_OUTPUT'];
        foreach ($selectedShifts as $sn) {
            $shiftHour = $sn == 1 ? '08:00:00' : ($sn == 2 ? '16:00:00' : '00:00:00');
            $calc = calculateRemainingShifts($start, $end, $asOfDate . ' ' . $shiftHour, $sn);
            $shiftOut = isset($row[$calc['shiftOutputCol']]) ? (int)$row[$calc['shiftOutputCol']] : 0;
            $lipasCount = ($cumulative >= $quantity && $quantity > 0) ? 'Y' : 'N';
            $volpas = ($quantity > 0) ? round($cumulative / $quantity, 4) : 0;
            $shiftsData[$sn]['rows'][] = [
                'TEAM' => $row['TEAM'], 'LINE' => $row['LINE'], 'SKU_CODE' => $row['SKU_CODE'],
                'SKU_DESCRIPTION' => $row['SKU_DESCRIPTION'], 'QUANTITY' => $quantity, 'UOM' => $row['UOM'],
                'SHIFT_OUTPUT' => $shiftOut, 'CUMULATIVE_OUTPUT' => $cumulative,
                'OPERATING_DAYS_START' => $row['OPERATING_DAYS_START'], 'OPERATING_DAYS_END' => $row['OPERATING_DAYS_END'],
                'LIPAS_COUNT' => $lipasCount, 'VOLPAS' => $volpas
            ];
            $shiftsData[$sn]['totals']['quantity'] += $quantity;
            $shiftsData[$sn]['totals']['shiftOutput'] += $shiftOut;
            $shiftsData[$sn]['totals']['cumulative'] += $cumulative;
            if ($lipasCount === 'Y') $shiftsData[$sn]['totals']['lipasCount']++;
            if ($quantity > 0) $shiftsData[$sn]['skuCount']++;
        }
    }
}

// ========== Manage LIPAS VOLPAS data ==========
$lipasRecords = []; $volpasRecords = []; $lipasPivot = []; $volpasPivot = []; $pivotRanges = [];
$filterMonthManage = $_GET['month_manage'] ?? $_GET['month'] ?? '';
$filterYearManage  = (int)($_GET['year_manage'] ?? $_GET['year'] ?? date('Y'));
$filterTeamManage  = $_GET['team_manage'] ?? $_GET['team'] ?? '';
$selectedLinesManage = $_GET['lines'] ?? [];
$filterOpsDaysManage = $_GET['ops_days_manage'] ?? '';
$useMonthFilter = ($filterMonthManage !== '' && $filterMonthManage !== 'all');

// --- FIX: initialise $lineFilterParams as an array ---
$lineFilterSql    = '';
$lineFilterParams = [];
$lineFilterTypes  = '';
if (!empty($selectedLinesManage) && is_array($selectedLinesManage)) {
    $placeholders = implode(',', array_fill(0, count($selectedLinesManage), '?'));
    $lineFilterSql = " AND LINE IN ($placeholders)";
    $lineFilterParams = $selectedLinesManage;
    $lineFilterTypes = str_repeat('s', count($selectedLinesManage));
}

$availableLines = [];
$linesRes = $conn->query("(SELECT DISTINCT LINE FROM lipas_record WHERE LINE IS NOT NULL AND LINE != '')
                           UNION (SELECT DISTINCT LINE FROM volpas_record WHERE LINE IS NOT NULL AND LINE != '') ORDER BY LINE");
while ($l = $linesRes->fetch_assoc()) $availableLines[] = $l['LINE'];

$buildLvWhere = function($extraOpsFilter = true) use (
    $filterYearManage, $useMonthFilter, $filterMonthManage,
    $filterTeamManage, $filterOpsDaysManage,
    $lineFilterSql, $lineFilterParams, $lineFilterTypes
) {
    $sql    = " WHERE YEAR = ?";
    $params = [$filterYearManage];
    $types  = 'i';
    if ($useMonthFilter)          { $sql .= " AND MONTH = ?";  $params[] = $filterMonthManage;  $types .= 's'; }
    if (!empty($filterTeamManage)){ $sql .= " AND TEAM = ?";   $params[] = $filterTeamManage;   $types .= 's'; }
    if ($extraOpsFilter && !empty($filterOpsDaysManage)) {
        [$s, $e] = explode('|', $filterOpsDaysManage, 2);
        if ($s && $e) {
            $sql    .= " AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?";
            $params[] = $s; $params[] = $e;
            $types  .= 'ss';
        }
    }
    $sql    .= $lineFilterSql;
    $params  = array_merge($params, $lineFilterParams);
    $types  .= $lineFilterTypes;
    return [$sql, $params, $types];
};

$showDetailed = !empty($filterOpsDaysManage);

if ($filterYearManage) {

    // ── LIPAS ──────────────────────────────────────────────────────────────
    [$lvWhere, $lvParams, $lvTypes] = $buildLvWhere(true);
    $lipasSql  = "SELECT * FROM `lipas_record`"  . $lvWhere . " ORDER BY TEAM, LINE, OPERATING_DAYS_START";
    $lipasStmt = $conn->prepare($lipasSql);
    if (!empty($lvParams)) $lipasStmt->bind_param($lvTypes, ...$lvParams);
    $lipasStmt->execute();
    $lipasResult = $lipasStmt->get_result();
    while ($row = $lipasResult->fetch_assoc()) $lipasRecords[] = $row;

    // ── VOLPAS ─────────────────────────────────────────────────────────────
    [$lvWhere, $lvParams, $lvTypes] = $buildLvWhere(true);
    $volpasSql  = "SELECT * FROM `volpas_record`" . $lvWhere . " ORDER BY TEAM, LINE, OPERATING_DAYS_START";
    $volpasStmt = $conn->prepare($volpasSql);
    if (!empty($lvParams)) $volpasStmt->bind_param($lvTypes, ...$lvParams);
    $volpasStmt->execute();
    $volpasResult = $volpasStmt->get_result();
    while ($row = $volpasResult->fetch_assoc()) $volpasRecords[] = $row;

    // ── Build pivot structures (only used when Prod. Days = All) ───────────
    if (!$showDetailed) {

        // Helper: pivot one record set into [teamLineMonth] x [rangeKey]
        $buildPivot = function(array $records) use (&$pivotRanges): array {
            $pivot = [];
            foreach ($records as $r) {
                $rangeKey = $r['OPERATING_DAYS_START'] . '|' . $r['OPERATING_DAYS_END'];

                // Register this range in the ordered list (keyed to preserve order)
                if (!isset($pivotRanges[$rangeKey])) {
                    $pivotRanges[$rangeKey] = [
                        'start' => $r['OPERATING_DAYS_START'],
                        'end'   => $r['OPERATING_DAYS_END'],
                        'label' => date('M d', strtotime($r['OPERATING_DAYS_START']))
                                 . ' – '
                                 . date('M d, Y', strtotime($r['OPERATING_DAYS_END'])),
                    ];
                }

                // Row identity: TEAM + LINE + MONTH (MONTH may vary if All Months)
                $rowKey = $r['TEAM'] . '||' . $r['LINE'] . '||' . $r['MONTH'];

                if (!isset($pivot[$rowKey])) {
                    $pivot[$rowKey] = [
                        'TEAM'  => $r['TEAM'],
                        'LINE'  => $r['LINE'],
                        'MONTH' => $r['MONTH'],
                        'ranges'=> [],
                    ];
                }

                $pivot[$rowKey]['ranges'][$rangeKey] = [
                    'plan'   => (float)($r['TOTAL_PLAN']   ?? 0),
                    'actual' => (float)($r['TOTAL_ACTUAL'] ?? 0),
                ];
            }
            return $pivot;
        };

        $lipasPivot  = $buildPivot($lipasRecords);
        // Reset pivotRanges between tables so VOLPAS can add its own ranges
        // then merge — we want a union of all ranges for consistent columns
        $volpasPivot = $buildPivot($volpasRecords);
        // pivotRanges is already the union (both closures write to the same ref)

        // Sort pivotRanges by OPERATING_DAYS_START ascending
        uasort($pivotRanges, function($a, $b) { return strcmp($a['start'], $b['start']); });
    }
}

// Grand totals (work for both detailed and pivot views)
$lipasTotalPlan   = 0; $lipasTotalActual  = 0;
$volpasTotalPlan  = 0; $volpasTotalActual = 0;
foreach ($lipasRecords  as $r) { $lipasTotalPlan  += (float)$r['TOTAL_PLAN'];  $lipasTotalActual  += (float)$r['TOTAL_ACTUAL']; }
foreach ($volpasRecords as $r) { $volpasTotalPlan += (float)$r['TOTAL_PLAN'];  $volpasTotalActual += (float)$r['TOTAL_ACTUAL']; }
$lipasGrandPercent  = ($lipasTotalPlan  > 0) ? min(100, round(($lipasTotalActual  / $lipasTotalPlan)  * 100, 1)) : 0;
$volpasGrandPercent = ($volpasTotalPlan > 0) ? min(100, round(($volpasTotalActual / $volpasTotalPlan) * 100, 1)) : 0;

// ========== Manage Line Report data ==========
$reportShiftsData = [];
$reportFilterTeam = $_GET['team'] ?? ''; $reportFilterYear = $_GET['year'] ?? date('Y'); $reportFilterMonth = $_GET['month'] ?? '';
$reportFilterLines = []; if (isset($_GET['line']) && is_array($_GET['line'])) $reportFilterLines = array_filter($_GET['line']);
$reportAsOfDate = $_GET['as_of_date'] ?? '';

$mngTeamCounts = ['A' => 0, 'B' => 0, 'C' => 0];
$mngTeamCounts['A'] = $conn->query("SELECT COUNT(*) AS cnt FROM a_report_line")->fetch_assoc()['cnt'];
$mngTeamCounts['B'] = $conn->query("SELECT COUNT(*) AS cnt FROM b_report_line")->fetch_assoc()['cnt'];
$mngTeamCounts['C'] = $conn->query("SELECT COUNT(*) AS cnt FROM c_report_line")->fetch_assoc()['cnt'];

$mngYearCounts = []; $mngMonthCounts = [];
$reportTableForTeam = match($reportFilterTeam) { 'A' => 'a_report_line', 'B' => 'b_report_line', 'C' => 'c_report_line', default => '' };
if ($reportTableForTeam) {
    $res = $conn->query("SELECT YEAR, COUNT(*) AS cnt FROM `$reportTableForTeam` GROUP BY YEAR ORDER BY YEAR DESC");
    while ($row = $res->fetch_assoc()) $mngYearCounts[(int)$row['YEAR']] = $row['cnt'];
} else {
    $res = $conn->query("SELECT YEAR, SUM(cnt) AS cnt FROM (SELECT YEAR, COUNT(*) AS cnt FROM a_report_line GROUP BY YEAR UNION ALL SELECT YEAR, COUNT(*) AS cnt FROM b_report_line GROUP BY YEAR UNION ALL SELECT YEAR, COUNT(*) AS cnt FROM c_report_line GROUP BY YEAR) t GROUP BY YEAR ORDER BY YEAR DESC");
    while ($row = $res->fetch_assoc()) $mngYearCounts[(int)$row['YEAR']] = $row['cnt'];
}
if ($reportTableForTeam && $reportFilterYear) {
    $stmt = $conn->prepare("SELECT MONTH, COUNT(*) AS cnt FROM `$reportTableForTeam` WHERE YEAR = ? GROUP BY MONTH");
    $stmt->bind_param('i', $reportFilterYear); $stmt->execute();
    $res = $stmt->get_result(); while ($row = $res->fetch_assoc()) $mngMonthCounts[$row['MONTH']] = $row['cnt'];
} elseif ($reportFilterYear) {
    $stmt = $conn->prepare("SELECT MONTH, SUM(cnt) AS cnt FROM (SELECT MONTH, COUNT(*) AS cnt FROM a_report_line WHERE YEAR = ? UNION ALL SELECT MONTH, COUNT(*) AS cnt FROM b_report_line WHERE YEAR = ? UNION ALL SELECT MONTH, COUNT(*) AS cnt FROM c_report_line WHERE YEAR = ?) t GROUP BY MONTH");
    $stmt->bind_param('iii', $reportFilterYear, $reportFilterYear, $reportFilterYear); $stmt->execute();
    $res = $stmt->get_result(); while ($row = $res->fetch_assoc()) $mngMonthCounts[$row['MONTH']] = $row['cnt'];
}

if (isset($_GET['action']) && $_GET['action'] === 'manage' && isset($_GET['type']) && $_GET['type'] === 'line_report') {
    $reportTables = [];
    if (empty($reportFilterTeam)) $reportTables = ['a_report_line','b_report_line','c_report_line'];
    elseif ($reportFilterTeam === 'A') $reportTables = ['a_report_line'];
    elseif ($reportFilterTeam === 'B') $reportTables = ['b_report_line'];
    elseif ($reportFilterTeam === 'C') $reportTables = ['c_report_line'];

    if (!empty($reportTables) && $reportFilterYear && $reportFilterMonth) {
        $where = "YEAR = ? AND MONTH = ?"; $params = [$reportFilterYear, $reportFilterMonth]; $types = 'is';
        if (!empty($selectedOpsDays)) {
            [$s, $e] = explode('|', $selectedOpsDays, 2);
            if ($s && $e) { $where .= " AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?"; $params[] = $s; $params[] = $e; $types .= 'ss'; }
        }
        [$rLineInClause, $rLineInParams, $rLineInTypes] = buildLineIn($reportFilterLines);
        $where .= $rLineInClause; $params = array_merge($params, $rLineInParams); $types .= $rLineInTypes;
        if (!empty($reportAsOfDate)) { $where .= " AND REPORT_DATE = ?"; $params[] = $reportAsOfDate; $types .= 's'; }

        foreach ($selectedShifts as $s) $reportShiftsData[$s] = ['rows' => [], 'totals' => ['quantity' => 0, 'shiftOutput' => 0, 'cumulative' => 0, 'lipasCount' => 0], 'skuCount' => 0];

        foreach ($reportTables as $tbl) {
            $shiftWhere = $where . " AND SHIFT_NUMBER = ?";
            foreach ($selectedShifts as $sn) {
                $shiftParams = array_merge($params, [$sn]); $shiftTypes = $types . 'i';
                $sql = "SELECT * FROM `$tbl` WHERE $shiftWhere ORDER BY LINE, SKU_CODE";
                $stmt = $conn->prepare($sql); $stmt->bind_param($shiftTypes, ...$shiftParams); $stmt->execute();
                $res = $stmt->get_result();
                while ($row = $res->fetch_assoc()) {
                    $reportShiftsData[$sn]['rows'][] = $row;
                    $reportShiftsData[$sn]['totals']['quantity'] += $row['QUANTITY'];
                    $reportShiftsData[$sn]['totals']['shiftOutput'] += $row['SHIFT_OUTPUT'];
                    $reportShiftsData[$sn]['totals']['cumulative'] += $row['CUMULATIVE_OUTPUT'];
                    if ($row['LIPAS_COUNT'] === 'Y') $reportShiftsData[$sn]['totals']['lipasCount']++;
                    if ($row['QUANTITY'] > 0) $reportShiftsData[$sn]['skuCount']++;
                }
            }
        }
    }
}

$action = $_GET['action'] ?? ($_SESSION['role'] === 'viewer' ? 'manage' : 'add');
$type   = $_GET['type']   ?? ($_SESSION['role'] === 'viewer' ? 'line_report' : 'report');

// ── Load the HTML template ──────────────────────────────────
require __DIR__ . '/view/manage_report.tpl.php';