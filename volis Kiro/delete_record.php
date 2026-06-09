<?php
/**
 * delete_record.php
 * ─────────────────────────────────────────────────────────────
 * Handles AJAX POST from the add_edit side panel / delete button
 * to permanently remove a single *_summary_line record.
 *
 * Phase 5 fixes applied:
 *   Fix 1 — admin added to allowed roles
 *   Fix 3 — data_entry ownership check before DELETE
 * ─────────────────────────────────────────────────────────────
 */

session_start();
require 'db.php';
require 'auth_check.php';   // Phase 2: session sync + helpers
require 'audit_helper.php'; // log_action() available

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
$id    = (int)($_POST['id']   ?? 0);
$table = trim($_POST['table'] ?? '');

$allowedTables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];

if ($id <= 0) {
    json_err('Missing or invalid record id.');
}
if (!in_array($table, $allowedTables, true)) {
    json_err('Invalid table specified.');
}

// ── Fetch existing record ─────────────────────────────────────
// Required for the ownership check and the audit log description.
// We SELECT only the columns we need to keep the query lean.
$fetchStmt = $conn->prepare(
    "SELECT id, TEAM, LINE, SKU_CODE, MONTH, YEAR
     FROM `$table` WHERE id = ? LIMIT 1"
);
$fetchStmt->bind_param('i', $id);
$fetchStmt->execute();
$existing = $fetchStmt->get_result()->fetch_assoc();
$fetchStmt->close();

if (!$existing) {
    json_err('Record not found.', 404);
}

// ── Ownership check — Fix 3: data_entry scope ─────────────────
// data_entry users may only delete records that belong to their
// own TEAM and LINE.
if ($_SESSION['role'] === 'data_entry' && auth_is_scoped()) {
    if ($existing['TEAM'] !== $_SESSION['team'] ||
        $existing['LINE'] !== $_SESSION['line']) {
        json_err(
            'Forbidden — this record does not belong to your '
          . 'assigned team and line.',
            403
        );
    }
}

// ── Execute DELETE ────────────────────────────────────────────
$stmt = $conn->prepare("DELETE FROM `$table` WHERE id = ?");
if (!$stmt) {
    json_err('Prepare failed: ' . $conn->error, 500);
}
$stmt->bind_param('i', $id);

if ($stmt->execute()) {
    log_action(
        'delete_record',
        $table,
        $id,
        "Deleted record id={$id} from {$table} "
        . "(SKU: {$existing['SKU_CODE']}, "
        . "LINE: {$existing['LINE']}, "
        . "MONTH: {$existing['MONTH']}, "
        . "YEAR: {$existing['YEAR']})"
    );
    json_ok('Record deleted successfully.', ['id' => $id]);
} else {
    json_err('Delete failed: ' . $stmt->error, 500);
}
$stmt->close();