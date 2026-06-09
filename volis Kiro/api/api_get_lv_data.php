<?php
/**
 * api_get_lv_data.php
 * Returns existing LIPAS & VOLPAS records for a specific LINE and a
 * specific operating‑days range, so the week‑picker modal can show
 * current Plan / Actual values.
 *
 * GET params:
 *   team      – A | B | C
 *   month     – e.g. JANUARY
 *   year      – e.g. 2026
 *   line      – e.g. LINE_06
 *   ops_days  – "START|END"   (optional, but now used to filter by range)
 *
 * Response:
 * {
 *   "status": "success",
 *   "data": {
 *     "lipas": { ... } | null,
 *     "volpas": { ... } | null
 *   }
 * }
 */

require_once __DIR__ . '/api_auth.php';
require_auth();

$team     = trim($_GET['team']     ?? '');
$month    = strtoupper(trim($_GET['month'] ?? ''));
$year     = (int)($_GET['year']    ?? 0);
$line     = trim($_GET['line']     ?? '');
$opsDays  = trim($_GET['ops_days'] ?? '');   // "START|END"

if (!in_array($team, ['A','B','C'], true) || !$month || !$year || !$line) {
    api_error('Missing or invalid parameters.');
}

// ── Extract operating days if provided ─────────────────────────
$opsStart = null;
$opsEnd   = null;
if (!empty($opsDays)) {
    [$opsStart, $opsEnd] = explode('|', $opsDays, 2);
    if (!$opsStart || !$opsEnd) {
        api_error('Invalid ops_days format.');
    }
}

// ── Build WHERE clause ─────────────────────────────────────────
$where  = "TEAM = ? AND MONTH = ? AND YEAR = ? AND LINE = ?";
$params = [$team, $month, $year, $line];
$types  = 'ssis';

if ($opsStart && $opsEnd) {
    $where .= " AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?";
    $params[] = $opsStart;
    $params[] = $opsEnd;
    $types   .= 'ss';
}

// ── Fetch LIPAS record ────────────────────────────────────────
$lipas = null;
$stmt = $conn->prepare("SELECT * FROM lipas_record WHERE $where");
$stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();
if ($res && $res->num_rows > 0) {
    $lipas = $res->fetch_assoc();
}
$stmt->close();

// ── Fetch VOLPAS record ─────────────────────────────────────
$volpas = null;
$stmt2 = $conn->prepare("SELECT * FROM volpas_record WHERE $where");
$stmt2->bind_param($types, ...$params);
$stmt2->execute();
$res2 = $stmt2->get_result();
if ($res2 && $res2->num_rows > 0) {
    $volpas = $res2->fetch_assoc();
}
$stmt2->close();

// ── Return ────────────────────────────────────────────────────
api_response('success', [
    'lipas'  => $lipas,
    'volpas' => $volpas,
]);