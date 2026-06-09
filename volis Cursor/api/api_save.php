<?php
/**
 * api_save.php
 * Saves shift report data into _report_line table.
 * Handles OPERATING_DAYS_START/END correctly (null-safe).
 */

require_once __DIR__ . '/api_auth.php';
require_role('system_admin', 'data_entry');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    api_error('Method not allowed', 405);
}

// ── Input ────────────────────────────────────────────────────────
$team     = trim($_POST['team']        ?? '');
$year     = (int)($_POST['year']       ?? 0);
$month    = strtoupper(trim($_POST['month']    ?? ''));
$line     = $_POST['line']             ?? '';   // may be string or array
$asOfDate = trim($_POST['as_of_date']  ?? '');
$shift    = (int)($_POST['shift']      ?? 1);
$confirm  = isset($_POST['confirm']) && $_POST['confirm'] === '1';
$opsDays  = trim($_POST['ops_days']    ?? '');   // NEW

// ── Validate ────────────────────────────────────────────────────
if (!in_array($team, ['A','B','C'], true))        api_error('Invalid team');
if (!$year)                                         api_error('Missing year');
if (!$month)                                        api_error('Missing month');
if (!$asOfDate)                                     api_error('Missing as_of_date');
if (!in_array($shift, [1,2,3], true))              api_error('Invalid shift (1–3)');

// ── Table map ────────────────────────────────────────────────────
$summaryTable = match($team) { 'A' => 'a_summary_line', 'B' => 'b_summary_line', 'C' => 'c_summary_line' };
$reportTable  = match($team) { 'A' => 'a_report_line',  'B' => 'b_report_line',  'C' => 'c_report_line'  };

// ── Normalise $line to an array ───────────────────────────────────
$lines = [];
if (is_array($line)) {
    $lines = array_filter(array_map('trim', $line));
} elseif (is_string($line) && $line !== '') {
    $lines = [trim($line)];
}

// ── Build LINE IN clause for CHECK/DELETE ───────────────────────
$lineCheckClause = '';
$lineCheckParams = [];
$lineCheckTypes  = '';
if (!empty($lines)) {
    $placeholders = implode(',', array_fill(0, count($lines), '?'));
    $lineCheckClause = " AND LINE IN ($placeholders)";
    $lineCheckParams = array_values($lines);
    $lineCheckTypes  = str_repeat('s', count($lines));
}

// ── Duplicate check ──────────────────────────────────────────────
$checkSql = "SELECT COUNT(*) AS cnt FROM `$reportTable`
             WHERE TEAM = ? AND MONTH = ? AND YEAR = ?
             AND REPORT_DATE = ? AND SHIFT_NUMBER = ?" . $lineCheckClause;
$checkParams = array_merge([$team, $month, $year, $asOfDate, $shift], $lineCheckParams);
$checkTypes  = 'ssisi' . $lineCheckTypes;
$checkStmt = $conn->prepare($checkSql);
$checkStmt->bind_param($checkTypes, ...$checkParams);
$checkStmt->execute();
$exists = (int)$checkStmt->get_result()->fetch_assoc()['cnt'] > 0;

if (!$confirm && $exists) {
    api_response('duplicate', null, 'Records already exist for this filter combination. Send confirm=1 to overwrite.');
}

// ── Calculation helper ───────────────────────────────────────────
function calculateRemainingShifts(string $startDate, string $endDate, string $asOfDateTime, int $shift): array {
    $start = new DateTime($startDate);
    $end   = new DateTime($endDate);
    $end->setTime(23, 59, 59);
    $asOf  = new DateTime($asOfDateTime);

    $totalDays   = $start->diff($end)->days + 1;
    $totalShifts = $totalDays * 3;

    if ($asOf > $end) {
        return [
            'remaining'      => 0,
            'dayIndex'       => $totalDays,
            'shiftOutputCol' => $shift . ($shift === 1 ? 'ST' : ($shift === 2 ? 'ND' : 'RD')) . '_SHIFT_DAY_' . $totalDays,
        ];
    }

    $daysElapsed = $start->diff($asOf)->days;
    $hour        = (int)$asOf->format('H');
    $shiftIndex  = match(true) {
        $hour >= 6  && $hour < 14 => 0,
        $hour >= 14 && $hour < 22 => 1,
        default                   => 2,
    };

    $remainingShifts = max(0, $totalShifts - ($daysElapsed * 3 + $shiftIndex));
    $dayIndex        = $daysElapsed + 1;

    return [
        'remaining'      => $remainingShifts,
        'dayIndex'       => $dayIndex,
        'shiftOutputCol' => $shift . ($shift === 1 ? 'ST' : ($shift === 2 ? 'ND' : 'RD')) . '_SHIFT_DAY_' . $dayIndex,
    ];
}

// ── Fetch from summary table (with optional operating‑days filter) ──
$fetchWhere  = "YEAR = ? AND MONTH = ?";
$fetchParams = [$year, $month];
$fetchTypes  = 'is';

if (!empty($opsDays)) {
    [$opsStart, $opsEnd] = explode('|', $opsDays, 2);
    if ($opsStart && $opsEnd) {
        $fetchWhere .= " AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?";
        $fetchParams[] = $opsStart;
        $fetchParams[] = $opsEnd;
        $fetchTypes  .= 'ss';
    }
}

if (!empty($lines)) {
    $placeholders = implode(',', array_fill(0, count($lines), '?'));
    $fetchWhere  .= " AND LINE IN ($placeholders)";
    $fetchParams  = array_merge($fetchParams, array_values($lines));
    $fetchTypes  .= str_repeat('s', count($lines));
}

$fetchStmt = $conn->prepare("SELECT * FROM `$summaryTable` WHERE $fetchWhere ORDER BY LINE, SKU_CODE");
$fetchStmt->bind_param($fetchTypes, ...$fetchParams);
$fetchStmt->execute();
$fetchRes = $fetchStmt->get_result();

$reportData = [];
$shiftHour  = match($shift) { 1 => '08:00:00', 2 => '16:00:00', default => '00:00:00' };
$asOfDT     = $asOfDate . ' ' . $shiftHour;

while ($row = $fetchRes->fetch_assoc()) {
    $quantity   = (int)$row['QUANTITY'];
    $cumulative = (int)$row['CUMULATIVE_OUTPUT'];
    $calc       = calculateRemainingShifts($row['OPERATING_DAYS_START'], $row['OPERATING_DAYS_END'], $asOfDT, $shift);
    $shiftOut   = isset($row[$calc['shiftOutputCol']]) ? (int)$row[$calc['shiftOutputCol']] : 0;

    // Sanitise date columns – convert empty strings / '0000-00-00' to null
    $opsStart = $row['OPERATING_DAYS_START'] ?? null;
    $opsEnd   = $row['OPERATING_DAYS_END']   ?? null;
    if (empty($opsStart) || $opsStart === '0000-00-00') $opsStart = null;
    if (empty($opsEnd)   || $opsEnd   === '0000-00-00') $opsEnd   = null;

    $reportData[] = [
        'TEAM'                => $team,
        'MONTH'               => $month,
        'YEAR'                => $year,
        'LINE'                => $row['LINE'],
        'SKU_CODE'            => $row['SKU_CODE'],
        'SKU_DESCRIPTION'     => $row['SKU_DESCRIPTION'],
        'QUANTITY'            => $quantity,
        'UOM'                 => $row['UOM'],
        'SHIFT_OUTPUT'        => $shiftOut,
        'CUMULATIVE_OUTPUT'   => $cumulative,
        'OPERATING_DAYS_START'=> $opsStart,
        'OPERATING_DAYS_END'  => $opsEnd,
        'TARGET_RUNRATE'      => $calc['remaining'] > 0 ? round($quantity / $calc['remaining'], 2) : 0,
        'WTG_RUNRATE'         => $calc['remaining'] > 0 ? round(($quantity - $cumulative) / $calc['remaining'], 2) : 0,
        'LIPAS_COUNT'         => ($cumulative >= $quantity && $quantity > 0) ? 'Y' : 'N',
        'VOLPAS'              => $quantity > 0 ? round($cumulative / $quantity, 4) : 0,
        'REPORT_DATE'         => $asOfDate,
        'SHIFT_NUMBER'        => $shift,
    ];
}

if (empty($reportData)) {
    api_error('No summary data found for the given filters. Nothing to save.');
}

// ── Delete existing records that match the same scope ────────────
$delSql    = "DELETE FROM `$reportTable`
              WHERE TEAM = ? AND MONTH = ? AND YEAR = ?
              AND REPORT_DATE = ? AND SHIFT_NUMBER = ?" . $lineCheckClause;
$delParams = array_merge([$team, $month, $year, $asOfDate, $shift], $lineCheckParams);
$delTypes  = 'ssisi' . $lineCheckTypes;
$delStmt   = $conn->prepare($delSql);
$delStmt->bind_param($delTypes, ...$delParams);
$delStmt->execute();

// ── Insert new rows ──────────────────────────────────────────────
$insSql = "INSERT INTO `$reportTable`
            (TEAM, MONTH, YEAR, LINE, SKU_CODE, SKU_DESCRIPTION, QUANTITY, UOM,
             SHIFT_OUTPUT, CUMULATIVE_OUTPUT, OPERATING_DAYS_START, OPERATING_DAYS_END,
             TARGET_RUNRATE, WTG_RUNRATE, LIPAS_COUNT,
             VOLPAS, REPORT_DATE, SHIFT_NUMBER)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

$insStmt = $conn->prepare($insSql);

foreach ($reportData as $r) {
    // CORRECTED type string: 'ssisssisiissddsdsi'
    // Column order: TEAM(s), MONTH(s), YEAR(i), LINE(s), SKU_CODE(s), SKU_DESCRIPTION(s),
    // QUANTITY(i), UOM(s), SHIFT_OUTPUT(i), CUMULATIVE_OUTPUT(i),
    // OPERATING_DAYS_START(s), OPERATING_DAYS_END(s),
    // TARGET_RUNRATE(d), WTG_RUNRATE(d), LIPAS_COUNT(s),
    // VOLPAS(d), REPORT_DATE(s), SHIFT_NUMBER(i)
    $insStmt->bind_param('ssisssisiissddsdsi',
        $r['TEAM'], $r['MONTH'], $r['YEAR'], $r['LINE'],
        $r['SKU_CODE'], $r['SKU_DESCRIPTION'], $r['QUANTITY'], $r['UOM'],
        $r['SHIFT_OUTPUT'], $r['CUMULATIVE_OUTPUT'],
        $r['OPERATING_DAYS_START'], $r['OPERATING_DAYS_END'],
        $r['TARGET_RUNRATE'], $r['WTG_RUNRATE'], $r['LIPAS_COUNT'], $r['VOLPAS'],
        $r['REPORT_DATE'], $r['SHIFT_NUMBER']
    );
    $insStmt->execute();
}

$rowsSaved = count($reportData);
log_action('save_report', $reportTable, null, "Saved $rowsSaved shift report rows for $month $year");
api_response('success', ['rows_saved' => $rowsSaved], 'Report data saved successfully.');