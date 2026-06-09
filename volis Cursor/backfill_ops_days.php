<?php
/**
 * backfill_ops_days.php
 * One‑time script: fill OPERATING_DAYS_START / END for existing
 * lipas_record and volpas_record rows.
 * SAFE TO RUN MULTIPLE TIMES – skips rows that already have dates.
 */
session_start();
require 'db.php';

// Only system_admin can run this
if ($_SESSION['role'] !== 'system_admin') {
    die('Access denied. System Admin only.');
}

// ── Helper: get a prod days range for a given team/line/month/year ──
function getProdDays($conn, $team, $line, $month, $year) {
    $table = match ($team) {
        'A' => 'a_summary_line',
        'B' => 'b_summary_line',
        'C' => 'c_summary_line',
        default => null
    };
    if (!$table) return null;

    $stmt = $conn->prepare("SELECT OPERATING_DAYS_START, OPERATING_DAYS_END
                             FROM `$table`
                             WHERE TEAM = ? AND LINE = ? AND MONTH = ? AND YEAR = ?
                             ORDER BY OPERATING_DAYS_START
                             LIMIT 1");
    $stmt->bind_param('sssi', $team, $line, $month, $year);
    $stmt->execute();
    $res = $stmt->get_result();
    if ($res && $res->num_rows > 0) {
        return $res->fetch_assoc();
    }
    return null;
}

// ── Backfill function ─────────────────────────────────────────────
function backfillTable($conn, $tableName) {
    $select = $conn->query("SELECT id, TEAM, LINE, MONTH, YEAR FROM `$tableName`
                            WHERE OPERATING_DAYS_START IS NULL OR OPERATING_DAYS_END IS NULL");
    $updated = 0;
    while ($row = $select->fetch_assoc()) {
        $ops = getProdDays($conn, $row['TEAM'], $row['LINE'], $row['MONTH'], (int)$row['YEAR']);
        if ($ops) {
            $upd = $conn->prepare("UPDATE `$tableName`
                                   SET OPERATING_DAYS_START = ?, OPERATING_DAYS_END = ?
                                   WHERE id = ?");
            $upd->bind_param('ssi', $ops['OPERATING_DAYS_START'], $ops['OPERATING_DAYS_END'], $row['id']);
            $upd->execute();
            $updated++;
        }
    }
    return $updated;
}

echo "<h3>Backfill started…</h3>";

$lipasCount = backfillTable($conn, 'lipas_record');
echo "<p>LIPAS rows updated: $lipasCount</p>";

$volpasCount = backfillTable($conn, 'volpas_record');
echo "<p>VOLPAS rows updated: $volpasCount</p>";

echo "<p><strong>Done.</strong> You can delete this file now.</p>";