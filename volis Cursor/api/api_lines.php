<?php
/**
 * api_lines.php
 * Returns distinct production lines from sku_master for a given team.
 *
 * GET params:
 *   team  — A | B | C | (empty = all teams)
 *
 * All three roles (admin, data_entry, viewer) can access this.
 *
 * Response:
 *   { "status": "success", "data": { "lines": ["LINE_06", "LINE_12", ...] } }
 */

require_once __DIR__ . '/api_auth.php';

require_auth();   // all roles permitted — no role restriction needed

$team = trim($_GET['team'] ?? '');

$allowedTeams = ['A', 'B', 'C', ''];
if (!in_array($team, $allowedTeams, true)) {
    api_error('Invalid team value');
}

if (!empty($team)) {
    $stmt = $conn->prepare(
        "SELECT DISTINCT LINE FROM sku_master
         WHERE TEAM = ? AND LINE IS NOT NULL AND LINE != ''
         ORDER BY LINE"
    );
    $stmt->bind_param('s', $team);
} else {
    $stmt = $conn->prepare(
        "SELECT DISTINCT LINE FROM sku_master
         WHERE LINE IS NOT NULL AND LINE != ''
         ORDER BY LINE"
    );
}

$stmt->execute();
$res   = $stmt->get_result();
$lines = [];
while ($row = $res->fetch_assoc()) {
    $lines[] = $row['LINE'];
}

api_response('success', ['lines' => $lines]);
