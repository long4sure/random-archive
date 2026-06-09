<?php
/**
 * api/api_check_duplicate.php
 * ─────────────────────────────────────────────────────────────
 * Checks whether a given combination of
 *   TABLE + TEAM + LINE + SKU_CODE + OPERATING_DAYS_START + OPERATING_DAYS_END
 * already exists in the target *_summary_line table.
 *
 * Called by the Add form in real-time (on SKU select and on
 * operating days date change) to give instant feedback before
 * the user submits — without a full page reload.
 *
 * Method : GET
 * Params :
 *   table    (string) — a_summary_line | b_summary_line | c_summary_line
 *   team     (string) — A | B | C
 *   line     (string) — e.g. LINE_06
 *   sku_code (string) — e.g. 1APC2019
 *   ops_start(string) — YYYY-MM-DD
 *   ops_end  (string) — YYYY-MM-DD
 *   exclude_id(int)   — optional: record id to exclude from the
 *                        check (used when editing an existing row
 *                        so it doesn't flag itself as a duplicate)
 *
 * Returns JSON:
 *   {
 *     status:    'ok',
 *     duplicate: true | false,
 *     count:     0 | N,
 *     message:   '...'   (only present when duplicate: true)
 *   }
 *
 * Auth: system_admin, admin, data_entry (viewer has no Add form)
 * ─────────────────────────────────────────────────────────────
 */

require_once __DIR__ . '/api_auth.php';
require_role('system_admin', 'admin', 'data_entry');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    api_error('Method not allowed', 405);
}

// ── Input ─────────────────────────────────────────────────────
$table      = trim($_GET['table']     ?? '');
$team       = strtoupper(trim($_GET['team']      ?? ''));
$line       = trim($_GET['line']      ?? '');
$skuCode    = trim($_GET['sku_code']  ?? '');
$opsStart   = trim($_GET['ops_start'] ?? '');
$opsEnd     = trim($_GET['ops_end']   ?? '');
$excludeId  = (int)($_GET['exclude_id'] ?? 0);

// ── Validate ──────────────────────────────────────────────────
$allowedTables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];

if (!in_array($table, $allowedTables, true)) {
    api_error('Invalid table. Must be one of: ' . implode(', ', $allowedTables));
}
if (!in_array($team, ['A', 'B', 'C'], true)) {
    api_error('Invalid team. Must be A, B, or C.');
}
if (empty($line)) {
    api_error('Missing line parameter.');
}
if (empty($skuCode)) {
    api_error('Missing sku_code parameter.');
}
if (empty($opsStart) || empty($opsEnd)) {
    api_error('Missing ops_start or ops_end parameter.');
}

// Basic date format guard (YYYY-MM-DD)
$datePattern = '/^\d{4}-\d{2}-\d{2}$/';
if (!preg_match($datePattern, $opsStart) || !preg_match($datePattern, $opsEnd)) {
    api_error('Invalid date format. Use YYYY-MM-DD.');
}
if ($opsStart > $opsEnd) {
    api_error('ops_start cannot be after ops_end.');
}

// ── data_entry scope enforcement ──────────────────────────────
// data_entry users can only check combinations within their own
// TEAM and LINE — they cannot probe other lines for duplicates.
if ($_SESSION['role'] === 'data_entry') {
    $sessionTeam = $_SESSION['team'] ?? null;
    $sessionLine = $_SESSION['line'] ?? null;

    if (!$sessionTeam || !$sessionLine) {
        api_error('Your account has no team or line assignment. Contact an administrator.', 403);
    }
    if ($team !== $sessionTeam || $line !== $sessionLine) {
        api_error('Forbidden — you may only check records for your assigned team and line.', 403);
    }
}

// ── Duplicate check query ─────────────────────────────────────
// The UNIQUE KEY added in Phase 1 covers the same columns, but
// this endpoint provides a friendlier message before the INSERT.
//
// exclude_id: when editing an existing record, exclude the
// record itself so it doesn't flag as its own duplicate.
if ($excludeId > 0) {
    $stmt = $conn->prepare(
        "SELECT id, SKU_DESCRIPTION FROM `$table`
         WHERE TEAM = ?
           AND LINE = ?
           AND SKU_CODE = ?
           AND OPERATING_DAYS_START = ?
           AND OPERATING_DAYS_END = ?
           AND id != ?
         LIMIT 1"
    );
    $stmt->bind_param('sssssi', $team, $line, $skuCode, $opsStart, $opsEnd, $excludeId);
} else {
    $stmt = $conn->prepare(
        "SELECT id, SKU_DESCRIPTION FROM `$table`
         WHERE TEAM = ?
           AND LINE = ?
           AND SKU_CODE = ?
           AND OPERATING_DAYS_START = ?
           AND OPERATING_DAYS_END = ?
         LIMIT 1"
    );
    $stmt->bind_param('sssss', $team, $line, $skuCode, $opsStart, $opsEnd);
}

$stmt->execute();
$existing = $stmt->get_result()->fetch_assoc();
$stmt->close();

// ── Response ──────────────────────────────────────────────────
if ($existing) {
    // Format dates for the human-readable message
    $startLabel = date('M j, Y', strtotime($opsStart));
    $endLabel   = date('M j, Y', strtotime($opsEnd));

    api_response('ok', [
        'duplicate'   => true,
        'existing_id' => (int)$existing['id'],
        'count'       => 1,
        'message'     => sprintf(
            'SKU "%s" (%s) on %s already has a record for the operating days %s – %s. '
            . 'Use Edit to update the existing record instead of adding a duplicate.',
            $skuCode,
            $existing['SKU_DESCRIPTION'] ?? '',
            $line,
            $startLabel,
            $endLabel
        ),
    ]);
} else {
    api_response('ok', [
        'duplicate' => false,
        'count'     => 0,
    ]);
}
