<?php
/**
 * save_lipas_volpas.php
 * Inserts or updates LIPAS & VOLPAS records for a single operating‑days range.
 * Now uses OPERATING_DAYS_START / OPERATING_DAYS_END and the renamed
 * OPERATING_DAYS_PLAN_1 … OPERATING_DAYS_ACTUAL_5 columns.
 */

session_start();
require 'db.php';

// ── Auth & role ──────────────────────────────────────────────────
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    exit('Unauthorized');
}
if (!in_array($_SESSION['role'], ['system_admin', 'data_entry'])) {
    http_response_code(403);
    exit('Forbidden');
}

// ── CSRF protection ──────────────────────────────────────────────
$csrfToken = $_POST['csrf_token'] ?? '';
if (!isset($_SESSION['csrf_token']) || $csrfToken !== $_SESSION['csrf_token']) {
    http_response_code(403);
    exit('Invalid CSRF token');
}

header('Content-Type: text/plain; charset=utf-8');

// ── Input ────────────────────────────────────────────────────────
$team     = trim($_POST['team']     ?? '');
$month    = strtoupper(trim($_POST['month'] ?? ''));
$year     = (int)($_POST['year']    ?? 0);
$line     = $_POST['line']          ?? [];
$opsDays  = trim($_POST['ops_days'] ?? '');   // "START|END"
$week     = (int)($_POST['week']    ?? 0);

// ── Validate ─────────────────────────────────────────────────────
if (!in_array($team, ['A','B','C'], true)) {
    http_response_code(400);
    exit('Invalid team.');
}
if (!in_array($month, ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'])) {
    http_response_code(400);
    exit('Invalid month.');
}
if ($year < 2000 || $year > 2099) {
    http_response_code(400);
    exit('Invalid year.');
}
if ($week < 1 || $week > 5) {
    http_response_code(400);
    exit('Invalid week (must be 1‑5).');
}

// ── Extract operating days ───────────────────────────────────────
$opsStart = null;
$opsEnd   = null;
if (!empty($opsDays)) {
    [$opsStart, $opsEnd] = explode('|', $opsDays, 2);
    if (!$opsStart || !$opsEnd) {
        http_response_code(400);
        exit('Invalid ops_days format.');
    }
} else {
    http_response_code(400);
    exit('Operating days range is required.');
}

// ── Normalise lines to array ─────────────────────────────────────
if (is_array($line)) {
    $lines = array_filter(array_map('trim', $line));
} else {
    $lines = array_filter([trim($line)]);
}
if (empty($lines)) {
    http_response_code(400);
    exit('No lines selected.');
}

// ── Determine summary table ──────────────────────────────────────
$summaryTable = match($team) {
    'A' => 'a_summary_line',
    'B' => 'b_summary_line',
    'C' => 'c_summary_line',
};

// ── Fetch aggregated data per line ──────────────────────────────
$where = "YEAR = ? AND MONTH = ? AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?";
$params = [$year, $month, $opsStart, $opsEnd];
$types  = 'isss';

$linePlaceholders = implode(',', array_fill(0, count($lines), '?'));
$where .= " AND LINE IN ($linePlaceholders)";
$params = array_merge($params, $lines);
$types .= str_repeat('s', count($lines));

$sql = "SELECT LINE,
               COUNT(DISTINCT CASE WHEN QUANTITY > 0 THEN SKU_CODE END) AS sku_count,
               SUM(QUANTITY) AS total_qty,
               SUM(CUMULATIVE_OUTPUT) AS total_cum,
               SUM(CASE WHEN CUMULATIVE_OUTPUT >= QUANTITY AND QUANTITY > 0 THEN 1 ELSE 0 END) AS lipas_actual
        FROM `$summaryTable`
        WHERE $where
        GROUP BY LINE";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$res = $stmt->get_result();

$perLine = [];
while ($row = $res->fetch_assoc()) {
    $perLine[$row['LINE']] = [
        'plan'       => (int)$row['sku_count'],
        'actual'     => (int)$row['lipas_actual'],
        'qty_plan'   => (float)$row['total_qty'],
        'qty_actual' => (float)$row['total_cum'],
    ];
}
$stmt->close();

if (empty($perLine)) {
    http_response_code(400);
    exit('No data found for the given filters. Nothing to save.');
}

// ── Update or insert for each line ─────────────────────────────
$conn->begin_transaction();

try {
    foreach ($perLine as $lineName => $data) {
        // ----- LIPAS -----
        $chk = $conn->prepare("SELECT id FROM lipas_record
                               WHERE TEAM = ? AND MONTH = ? AND YEAR = ? AND LINE = ?
                                 AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?");
        $chk->bind_param('ssisss', $team, $month, $year, $lineName, $opsStart, $opsEnd);
        $chk->execute();
        $existing = $chk->get_result()->fetch_assoc();
        $chk->close();

        $weekPlanCol   = "OPERATING_DAYS_PLAN_{$week}";
        $weekActualCol = "OPERATING_DAYS_ACTUAL_{$week}";

        if ($existing) {
            // Update the specific slot
            $upd = $conn->prepare("UPDATE lipas_record SET `$weekPlanCol` = ?, `$weekActualCol` = ? WHERE id = ?");
            $upd->bind_param('iii', $data['plan'], $data['actual'], $existing['id']);
            $upd->execute();
            $upd->close();
        } else {
            // Insert a new row with zeros for all slots, including the operating days
            $ins = $conn->prepare("INSERT INTO lipas_record
                (TEAM, MONTH, YEAR, OPERATING_DAYS_START, OPERATING_DAYS_END, LINE,
                 OPERATING_DAYS_PLAN_1, OPERATING_DAYS_ACTUAL_1,
                 OPERATING_DAYS_PLAN_2, OPERATING_DAYS_ACTUAL_2,
                 OPERATING_DAYS_PLAN_3, OPERATING_DAYS_ACTUAL_3,
                 OPERATING_DAYS_PLAN_4, OPERATING_DAYS_ACTUAL_4,
                 OPERATING_DAYS_PLAN_5, OPERATING_DAYS_ACTUAL_5,
                 TOTAL_PLAN, TOTAL_ACTUAL, PERCENTAGE)
                VALUES (?, ?, ?, ?, ?, ?, 0,0,0,0,0,0,0,0,0,0, 0,0,0)");
            $ins->bind_param('ssisss', $team, $month, $year, $opsStart, $opsEnd, $lineName);
            $ins->execute();
            $newId = $conn->insert_id;
            $ins->close();

            // Then set the selected week's columns
            $upd = $conn->prepare("UPDATE lipas_record SET `$weekPlanCol` = ?, `$weekActualCol` = ? WHERE id = ?");
            $upd->bind_param('iii', $data['plan'], $data['actual'], $newId);
            $upd->execute();
            $upd->close();
        }

        // ----- VOLPAS (same logic, different table) -----
        $chk2 = $conn->prepare("SELECT id FROM volpas_record
                                WHERE TEAM = ? AND MONTH = ? AND YEAR = ? AND LINE = ?
                                  AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?");
        $chk2->bind_param('ssisss', $team, $month, $year, $lineName, $opsStart, $opsEnd);
        $chk2->execute();
        $existing2 = $chk2->get_result()->fetch_assoc();
        $chk2->close();

        if ($existing2) {
            $upd2 = $conn->prepare("UPDATE volpas_record SET `$weekPlanCol` = ?, `$weekActualCol` = ? WHERE id = ?");
            $upd2->bind_param('ddi', $data['qty_plan'], $data['qty_actual'], $existing2['id']);
            $upd2->execute();
            $upd2->close();
        } else {
            $ins2 = $conn->prepare("INSERT INTO volpas_record
                (TEAM, MONTH, YEAR, OPERATING_DAYS_START, OPERATING_DAYS_END, LINE,
                 OPERATING_DAYS_PLAN_1, OPERATING_DAYS_ACTUAL_1,
                 OPERATING_DAYS_PLAN_2, OPERATING_DAYS_ACTUAL_2,
                 OPERATING_DAYS_PLAN_3, OPERATING_DAYS_ACTUAL_3,
                 OPERATING_DAYS_PLAN_4, OPERATING_DAYS_ACTUAL_4,
                 OPERATING_DAYS_PLAN_5, OPERATING_DAYS_ACTUAL_5,
                 TOTAL_PLAN, TOTAL_ACTUAL, PERCENTAGE)
                VALUES (?, ?, ?, ?, ?, ?, 0,0,0,0,0,0,0,0,0,0, 0,0,0)");
            $ins2->bind_param('ssisss', $team, $month, $year, $opsStart, $opsEnd, $lineName);
            $ins2->execute();
            $newId2 = $conn->insert_id;
            $ins2->close();

            $upd2 = $conn->prepare("UPDATE volpas_record SET `$weekPlanCol` = ?, `$weekActualCol` = ? WHERE id = ?");
            $upd2->bind_param('ddi', $data['qty_plan'], $data['qty_actual'], $newId2);
            $upd2->execute();
            $upd2->close();
        }

        // Recalculate totals and percentage for this line (both tables)
        foreach (['lipas_record','volpas_record'] as $tbl) {
            $calc = $conn->prepare("SELECT
                (OPERATING_DAYS_PLAN_1 + OPERATING_DAYS_PLAN_2 + OPERATING_DAYS_PLAN_3 + OPERATING_DAYS_PLAN_4 + OPERATING_DAYS_PLAN_5) AS total_p,
                (OPERATING_DAYS_ACTUAL_1 + OPERATING_DAYS_ACTUAL_2 + OPERATING_DAYS_ACTUAL_3 + OPERATING_DAYS_ACTUAL_4 + OPERATING_DAYS_ACTUAL_5) AS total_a
                FROM `$tbl`
                WHERE TEAM=? AND MONTH=? AND YEAR=? AND LINE=? AND OPERATING_DAYS_START=? AND OPERATING_DAYS_END=?");
            $calc->bind_param('ssisss', $team, $month, $year, $lineName, $opsStart, $opsEnd);
            $calc->execute();
            $tot = $calc->get_result()->fetch_assoc();
            $calc->close();

            $totalP = (float)($tot['total_p'] ?? 0);
            $totalA = (float)($tot['total_a'] ?? 0);
            $pct = ($totalP > 0) ? round(($totalA / $totalP) * 100, 2) : 0;

            $updTot = $conn->prepare("UPDATE `$tbl`
                                      SET TOTAL_PLAN = ?, TOTAL_ACTUAL = ?, PERCENTAGE = ?
                                      WHERE TEAM=? AND MONTH=? AND YEAR=? AND LINE=? AND OPERATING_DAYS_START=? AND OPERATING_DAYS_END=?");
            $updTot->bind_param('dddssisss', $totalP, $totalA, $pct, $team, $month, $year, $lineName, $opsStart, $opsEnd);
            $updTot->execute();
            $updTot->close();
        }
    }

    $conn->commit();
    echo "Data for week $week saved successfully.";
} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo 'Error: ' . $e->getMessage();
}