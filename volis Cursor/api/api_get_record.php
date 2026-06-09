<?php
/**
 * api/api_get_record.php
 * ─────────────────────────────────────────────────────────────
 * Fetches a single *_summary_line record by id + table name.
 * Used by the add_edit side panel to pre-fill edit fields
 * directly from the DB — avoids reading from cell text which
 * breaks when columns are hidden by the Days filter.
 *
 * Method : GET
 * Params :
 *   id    (int)    — record primary key
 *   table (string) — one of: a_summary_line, b_summary_line,
 *                             c_summary_line
 *
 * Returns JSON:
 *   { status: 'ok', data: { ...all columns... } }
 *   { status: 'error', message: '...' }
 *
 * Auth:
 *   system_admin, admin — can fetch any record
 *   data_entry          — can only fetch records matching
 *                         their own TEAM + LINE assignment
 *   viewer              — read-only pages do not use this
 *                         endpoint but it still returns data
 *                         (no write actions stem from it)
 * ─────────────────────────────────────────────────────────────
 */

require_once __DIR__ . '/api_auth.php';

// Phase 2: sync team/line from session into api_auth scope
require_role('system_admin', 'admin', 'data_entry', 'viewer');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    api_error('Method not allowed', 405);
}

// ── Input validation ──────────────────────────────────────────
$id    = (int)($_GET['id']    ?? 0);
$table = trim($_GET['table']  ?? '');

$allowedTables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];

if ($id <= 0) {
    api_error('Missing or invalid id parameter.');
}
if (!in_array($table, $allowedTables, true)) {
    api_error('Invalid table. Must be one of: ' . implode(', ', $allowedTables));
}

// ── Fetch the record ──────────────────────────────────────────
$stmt = $conn->prepare("SELECT * FROM `$table` WHERE id = ? LIMIT 1");
$stmt->bind_param('i', $id);
$stmt->execute();
$row = $stmt->get_result()->fetch_assoc();
$stmt->close();

if (!$row) {
    api_error('Record not found.', 404);
}

// ── data_entry scope check ────────────────────────────────────
// data_entry users may only fetch records that belong to their
// assigned TEAM and LINE. Prevents fetching and side-loading
// another line's data via the panel.
if ($_SESSION['role'] === 'data_entry') {
    $sessionTeam = $_SESSION['team'] ?? null;
    $sessionLine = $_SESSION['line'] ?? null;

    if (!$sessionTeam || !$sessionLine) {
        api_error('Your account has no team or line assignment. Contact an administrator.', 403);
    }
    if ($row['TEAM'] !== $sessionTeam || $row['LINE'] !== $sessionLine) {
        api_error('Forbidden — this record does not belong to your assigned team and line.', 403);
    }
}

// ── Sanitise date columns ─────────────────────────────────────
// Convert MySQL '0000-00-00' to null so input[type=date] doesn't
// receive an invalid value and show a browser validation error.
foreach (['OPERATING_DAYS_START', 'OPERATING_DAYS_END'] as $dateCol) {
    if (isset($row[$dateCol]) && (empty($row[$dateCol]) || $row[$dateCol] === '0000-00-00')) {
        $row[$dateCol] = null;
    }
}

// ── Sanitise shift columns ────────────────────────────────────
// Ensure all shift day columns are returned as integers (not null)
// so JS can safely set input.value without type errors.
$shiftCols = [];
for ($day = 1; $day <= 7; $day++) {
    $shiftCols[] = "1ST_SHIFT_DAY_{$day}";
    $shiftCols[] = "2ND_SHIFT_DAY_{$day}";
    $shiftCols[] = "3RD_SHIFT_DAY_{$day}";
}
foreach ($shiftCols as $col) {
    if (array_key_exists($col, $row)) {
        $row[$col] = (int)($row[$col] ?? 0);
    }
}

// ── Return ────────────────────────────────────────────────────
api_response('ok', $row);