<?php
/**
 * update_record.php
 * ─────────────────────────────────────────────────────────────
 * Handles AJAX POST from the add_edit side panel to update
 * a single *_summary_line record.
 *
 * Phase 5 fixes applied:
 *   Fix 1  — admin added to allowed roles
 *   Fix 3  — audit_helper.php included (was missing)
 *   Fix 5  — WEEK column removed (does not exist in schema)
 *   Fix 5  — CUMULATIVE_OUTPUT excluded (DB trigger handles it)
 *   Fix 3  — data_entry ownership check before UPDATE
 * ─────────────────────────────────────────────────────────────
 */

session_start();
require 'db.php';
require 'auth_check.php';   // Phase 2: session sync + helpers
require 'audit_helper.php'; // Fix 3: log_action() available

header('Content-Type: application/json; charset=utf-8');

// ── Helpers ───────────────────────────────────────────────────
function json_ok(string $message, array $extra = []): void {
    echo json_encode(array_merge(['success' => true, 'message' => $message], $extra));
    exit;
}
function json_err(string $message, int $code = 400): void {
    http_response_code($code);
    echo json_encode(['success' => false, 'message' => $message]);
    exit;
}

// ── Method ────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_err('Method not allowed.', 405);
}

// ── CSRF ──────────────────────────────────────────────────────
$postedToken = $_POST['csrf_token'] ?? '';
if (empty($postedToken) || $postedToken !== ($_SESSION['csrf_token'] ?? '')) {
    json_err('Invalid CSRF token.', 403);
}

// ── Role check — Fix 1: admin added ───────────────────────────
$allowedRoles = ['system_admin', 'admin', 'data_entry'];
if (!in_array($_SESSION['role'], $allowedRoles, true)) {
    json_err('Forbidden — insufficient role.', 403);
}

// ── Input ─────────────────────────────────────────────────────
$id    = (int)($_POST['id']    ?? 0);
$table = trim($_POST['table']  ?? '');

$allowedTables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];

if ($id <= 0) {
    json_err('Missing or invalid record id.');
}
if (!in_array($table, $allowedTables, true)) {
    json_err('Invalid table specified.');
}

// ── Fetch existing record first ───────────────────────────────
// Needed for: ownership check, audit log description, and to
// detect if the row has changed team/line (not allowed).
$fetchStmt = $conn->prepare("SELECT * FROM `$table` WHERE id = ? LIMIT 1");
$fetchStmt->bind_param('i', $id);
$fetchStmt->execute();
$existing = $fetchStmt->get_result()->fetch_assoc();
$fetchStmt->close();

if (!$existing) {
    json_err('Record not found.', 404);
}

// ── Ownership check — Fix 3: data_entry scope ─────────────────
// data_entry users may only update records that belong to their
// own TEAM and LINE. Even if they craft a POST with a different
// id, this check blocks it.
if ($_SESSION['role'] === 'data_entry' && auth_is_scoped()) {
    if ($existing['TEAM'] !== $_SESSION['team'] ||
        $existing['LINE'] !== $_SESSION['line']) {
        json_err('Forbidden — this record does not belong to your '
               . 'assigned team and line.', 403);
    }
}

// ── Allowed columns for UPDATE ────────────────────────────────
// Fix 5: WEEK removed — column does not exist in any summary table.
// Fix 5: CUMULATIVE_OUTPUT excluded — the BEFORE UPDATE trigger
//        on each table recalculates it automatically. Including it
//        here would be overwritten anyway, but we exclude it to
//        keep the SQL clean and avoid confusion.
$allowedColumns = [
    'MONTH', 'YEAR', 'LINE', 'SKU_CODE', 'SKU_DESCRIPTION',
    'QUANTITY', 'UOM', 'OPERATING_DAYS_START', 'OPERATING_DAYS_END',
    '1ST_SHIFT_DAY_1', '2ND_SHIFT_DAY_1', '3RD_SHIFT_DAY_1',
    '1ST_SHIFT_DAY_2', '2ND_SHIFT_DAY_2', '3RD_SHIFT_DAY_2',
    '1ST_SHIFT_DAY_3', '2ND_SHIFT_DAY_3', '3RD_SHIFT_DAY_3',
    '1ST_SHIFT_DAY_4', '2ND_SHIFT_DAY_4', '3RD_SHIFT_DAY_4',
    '1ST_SHIFT_DAY_5', '2ND_SHIFT_DAY_5', '3RD_SHIFT_DAY_5',
    '1ST_SHIFT_DAY_6', '2ND_SHIFT_DAY_6', '3RD_SHIFT_DAY_6',
    '1ST_SHIFT_DAY_7', '2ND_SHIFT_DAY_7', '3RD_SHIFT_DAY_7',
];

// ── data_entry cannot change LINE, TEAM or target a different SKU
// outside their scope. We also block them from changing their
// assigned LINE to something else through the panel.
if ($_SESSION['role'] === 'data_entry' && auth_is_scoped()) {
    // Verify the SKU being set belongs to their line
    if (!empty($_POST['SKU_CODE'])) {
        $skuToSet = trim($_POST['SKU_CODE']);
        $skuChk   = $conn->prepare(
            "SELECT id FROM sku_master
             WHERE SKU_CODE = ? AND TEAM = ? AND LINE = ? LIMIT 1"
        );
        $skuChk->bind_param('sss', $skuToSet, $_SESSION['team'], $_SESSION['line']);
        $skuChk->execute();
        if ($skuChk->get_result()->num_rows === 0) {
            json_err('SKU "' . htmlspecialchars($skuToSet)
                   . '" is not valid for your assigned line.');
        }
        $skuChk->close();
    }
    // Force TEAM + LINE to remain unchanged
    unset($_POST['TEAM'], $_POST['LINE']);
}

// ── Build SET clause ──────────────────────────────────────────
$setParts = [];
$params   = [];
$types    = '';

foreach ($allowedColumns as $col) {
    if (!array_key_exists($col, $_POST)) continue;

    $value = $_POST[$col];

    // Shift columns and YEAR/QUANTITY are integers
    $isInt = in_array($col, ['YEAR', 'QUANTITY'])
          || strpos($col, 'SHIFT') !== false;

    $setParts[] = "`$col` = ?";
    $params[]   = $isInt ? (int)$value : $value;
    $types     .= $isInt ? 'i' : 's';
}

if (empty($setParts)) {
    json_err('No valid fields provided to update.');
}

// ── Duplicate check before updating ──────────────────────────
// If SKU_CODE, LINE, or operating days changed, verify the new
// combination doesn't clash with an existing different row.
$newSKU   = $_POST['SKU_CODE']              ?? $existing['SKU_CODE'];
$newLine  = $_POST['LINE']                  ?? $existing['LINE'];
$newTeam  = $existing['TEAM'];               // TEAM never changes
$newStart = $_POST['OPERATING_DAYS_START']  ?? $existing['OPERATING_DAYS_START'];
$newEnd   = $_POST['OPERATING_DAYS_END']    ?? $existing['OPERATING_DAYS_END'];

$dupChk = $conn->prepare(
    "SELECT id FROM `$table`
     WHERE TEAM = ? AND LINE = ? AND SKU_CODE = ?
       AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?
       AND id != ?
     LIMIT 1"
);
$dupChk->bind_param('sssssi', $newTeam, $newLine, $newSKU, $newStart, $newEnd, $id);
$dupChk->execute();
if ($dupChk->get_result()->num_rows > 0) {
    json_err(
        'A record for SKU "' . htmlspecialchars($newSKU)
        . '" on ' . htmlspecialchars($newLine)
        . ' with this operating days range already exists. '
        . 'Update cancelled to prevent a duplicate.'
    );
}
$dupChk->close();

// ── Execute UPDATE ────────────────────────────────────────────
$params[] = $id;
$types   .= 'i';

$sql  = "UPDATE `$table` SET " . implode(', ', $setParts) . " WHERE id = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    json_err('Prepare failed: ' . $conn->error, 500);
}
$stmt->bind_param($types, ...$params);

if ($stmt->execute()) {
    log_action(
        'update_record',
        $table,
        $id,
        "Updated record id={$id} in {$table} "
        . "(SKU: {$existing['SKU_CODE']}, LINE: {$existing['LINE']})"
    );
    json_ok('Record updated successfully.', ['id' => $id]);
} elseif ($conn->errno === 1062) {
    // DB-level unique constraint — layer 3
    json_err('Duplicate record: this SKU already exists for this operating days range.');
} else {
    json_err('Update failed: ' . $stmt->error, 500);
}
$stmt->close();