<?php
session_start();
require 'db.php';
require 'auth_check.php';
require 'audit_helper.php';

// ── Pending badge (system_admin only) ─────────────────────────
$pendingUsersCount = 0;
if ($_SESSION['role'] === 'system_admin') {
    $res = $conn->query("SELECT COUNT(*) AS cnt FROM users WHERE approval_status = 'pending'");
    if ($res) $pendingUsersCount = (int)$res->fetch_assoc()['cnt'];
}

// ── CSRF ───────────────────────────────────────────────────────
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrf_token = $_SESSION['csrf_token'];

// ── Viewer: redirect to manage view ───────────────────────────
if ($_SESSION['role'] === 'viewer') {
    $a = $_GET['action'] ?? '';
    $t = $_GET['type']   ?? '';
    if ($a !== 'manage' || $t !== 'summary') {
        header("Location: add_edit.php?action=manage&type=summary");
        exit();
    }
}

function buildLineIn(array $lines): array {
    if (empty($lines)) return ['', [], ''];
    $placeholders = implode(',', array_fill(0, count($lines), '?'));
    return [" AND LINE IN ($placeholders)", array_values($lines), str_repeat('s', count($lines))];
}

$message = '';
$error   = '';
$months  = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
            'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
$currentYear      = date('Y');
$currentMonthName = strtoupper(date('F'));

// ══════════════════════════════════════════════════════════════
// ADD RECORD — POST HANDLER
// ══════════════════════════════════════════════════════════════
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_production'])) {

    if (!isset($_POST['csrf_token']) || $_POST['csrf_token'] !== $csrf_token) {
        $error = "Invalid CSRF token.";
    } else {
        $table         = $_POST['target_table'] ?? '';
        $allowedTables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];

        if (!in_array($table, $allowedTables)) {
            $error = "Invalid target table selected.";
        } elseif (!in_array($_SESSION['role'], ['system_admin', 'admin', 'data_entry'])) {
            $error = "You do not have permission to add records.";
        } else {
            $postedTeam = trim($_POST['TEAM']      ?? '');
            $postedLine = trim($_POST['LINE']      ?? '');
            $postedSKU  = trim($_POST['SKU_CODE']  ?? '');
            $opsStart   = trim($_POST['OPERATING_DAYS_START'] ?? '');
            $opsEnd     = trim($_POST['OPERATING_DAYS_END']   ?? '');

            if ($_SESSION['role'] === 'data_entry' && auth_is_scoped()) {
                if ($postedTeam !== $_SESSION['team']) {
                    $error = "You are not permitted to add records for Team "
                           . htmlspecialchars($postedTeam) . ".";
                } elseif ($postedLine !== $_SESSION['line']) {
                    $error = "You are not permitted to add records for "
                           . htmlspecialchars($postedLine) . ".";
                }
            }

            if (!$error && $_SESSION['role'] === 'data_entry' && auth_is_scoped()) {
                $skuChk = $conn->prepare(
                    "SELECT id FROM sku_master
                     WHERE SKU_CODE = ? AND TEAM = ? AND LINE = ? LIMIT 1"
                );
                $skuChk->bind_param('sss', $postedSKU, $_SESSION['team'], $_SESSION['line']);
                $skuChk->execute();
                if ($skuChk->get_result()->num_rows === 0) {
                    $error = "SKU \"" . htmlspecialchars($postedSKU)
                           . "\" is not valid for your assigned line.";
                }
                $skuChk->close();
            }

            if (!$error) {
                if (empty($opsStart) || empty($opsEnd)) {
                    $error = "Operating Days Start and End are required.";
                } elseif ($opsStart > $opsEnd) {
                    $error = "Operating Days Start cannot be after Operating Days End.";
                }
            }

            if (!$error && auth_is_scoped()) {
                $expectedEnd = date('Y-m-d', strtotime($opsStart . ' +6 days'));
                if ($opsEnd !== $expectedEnd) {
                    $error = "Operating days must be a full 7-day week (Monday to Sunday).";
                }
            }

            // Fix E: server-side Mon/Sun enforcement for admin and system_admin
            // (JS enforcement is bypassable via DevTools — validate on server too)
            if (!$error && in_array($_SESSION['role'], ['admin', 'system_admin'])) {
                $startDow = (int)date('N', strtotime($opsStart)); // 1=Mon … 7=Sun
                $endDow   = (int)date('N', strtotime($opsEnd));
                if ($startDow !== 1) {
                    $error = "Operating Days Start must be a Monday (selected: "
                           . date('l, M j, Y', strtotime($opsStart)) . ").";
                } elseif ($endDow !== 7) {
                    $error = "Operating Days End must be a Sunday (selected: "
                           . date('l, M j, Y', strtotime($opsEnd)) . ").";
                } elseif ($opsEnd !== date('Y-m-d', strtotime($opsStart . ' +6 days'))) {
                    $error = "Operating Days Start and End must form a complete Mon–Sun week.";
                }
            }

            if (!$error) {
                $dupChk = $conn->prepare(
                    "SELECT id FROM `$table`
                     WHERE TEAM = ? AND LINE = ? AND SKU_CODE = ?
                       AND OPERATING_DAYS_START = ? AND OPERATING_DAYS_END = ?
                     LIMIT 1"
                );
                $dupChk->bind_param('sssss', $postedTeam, $postedLine, $postedSKU, $opsStart, $opsEnd);
                $dupChk->execute();
                if ($dupChk->get_result()->num_rows > 0) {
                    $error = "A record for SKU \"" . htmlspecialchars($postedSKU)
                           . "\" on " . htmlspecialchars($postedLine)
                           . " with operating days "
                           . date('M j, Y', strtotime($opsStart)) . " – "
                           . date('M j, Y', strtotime($opsEnd))
                           . " already exists. Use Edit to update the existing record instead.";
                }
                $dupChk->close();
            }

            if (!$error) {
                $columns = [
                    'TEAM','MONTH','YEAR','LINE','SKU_CODE','SKU_DESCRIPTION',
                    'QUANTITY','UOM','OPERATING_DAYS_START','OPERATING_DAYS_END',
                    '1ST_SHIFT_DAY_1','2ND_SHIFT_DAY_1','3RD_SHIFT_DAY_1',
                    '1ST_SHIFT_DAY_2','2ND_SHIFT_DAY_2','3RD_SHIFT_DAY_2',
                    '1ST_SHIFT_DAY_3','2ND_SHIFT_DAY_3','3RD_SHIFT_DAY_3',
                    '1ST_SHIFT_DAY_4','2ND_SHIFT_DAY_4','3RD_SHIFT_DAY_4',
                    '1ST_SHIFT_DAY_5','2ND_SHIFT_DAY_5','3RD_SHIFT_DAY_5',
                    '1ST_SHIFT_DAY_6','2ND_SHIFT_DAY_6','3RD_SHIFT_DAY_6',
                    '1ST_SHIFT_DAY_7','2ND_SHIFT_DAY_7','3RD_SHIFT_DAY_7',
                ];
                $fields = $placeholders = $params = [];
                $types  = '';
                foreach ($columns as $col) {
                    $fields[]       = "`$col`";
                    $placeholders[] = '?';
                    $isShift = strpos($col, 'SHIFT') !== false;
                    $isInt   = in_array($col, ['YEAR','QUANTITY']) || $isShift;
                    if ($isShift) {
                        $params[] = isset($_POST[$col]) && $_POST[$col] !== '' ? (int)$_POST[$col] : 0;
                    } else {
                        $params[] = $_POST[$col] ?? '';
                    }
                    $types .= $isInt ? 'i' : 's';
                }
                $sql  = "INSERT INTO `$table` ("
                      . implode(', ', $fields)
                      . ") VALUES ("
                      . implode(', ', $placeholders) . ")";
                    $stmt = $conn->prepare($sql);
                    if ($stmt) {
                        $stmt->bind_param($types, ...$params);
                        if ($stmt->execute()) {
                            $message = "Record successfully added.";
                            log_action('add_record', $table, (int)$stmt->insert_id,
                                "Added SKU {$postedSKU} to {$postedLine}");
                        } elseif ($conn->errno === 1062) {
                            $error = "Duplicate record: this SKU already exists "
                                   . "for this operating days range.";
                        } else {
                            $error = "Insert failed: " . $stmt->error;
                        }
                        $stmt->close();
                    } else {
                        $error = "Prepare failed: " . $conn->error;
                    }
            }
        }
    }
}

// ══════════════════════════════════════════════════════════════
// EXCEL EXPORT
// ══════════════════════════════════════════════════════════════
$manageTable  = $_GET['manage_table'] ?? '';
$filterMonth  = $_GET['month']        ?? '';
$filterLines  = isset($_GET['line'])
    ? (is_array($_GET['line']) ? array_filter($_GET['line'])
                               : array_filter([$_GET['line']]))
    : [];
$selectedDays = isset($_GET['days'])
    ? (is_array($_GET['days']) ? $_GET['days'] : explode(',', $_GET['days']))
    : [1,2,3,4,5,6,7];

if (auth_is_scoped()) {
    $scopedTeam  = $_SESSION['team'] ?? '';
    $manageTable = match($scopedTeam) {
        'A' => 'a_summary_line', 'B' => 'b_summary_line',
        'C' => 'c_summary_line', default => ''
    };
    $filterLines = !empty($_SESSION['line']) ? [$_SESSION['line']] : [];
}

if (isset($_GET['export']) && $_GET['export'] === 'excel'
    && in_array($manageTable, ['a_summary_line','b_summary_line','c_summary_line'])) {

    $baseCols  = ['TEAM','MONTH','YEAR','LINE','SKU_CODE','SKU_DESCRIPTION',
                  'QUANTITY','UOM','CUMULATIVE_OUTPUT',
                  'OPERATING_DAYS_START','OPERATING_DAYS_END'];
    $shiftCols = [];
    for ($d = 1; $d <= 7; $d++) {
        if (in_array($d, $selectedDays)) {
            $shiftCols[] = "1ST_SHIFT_DAY_{$d}";
            $shiftCols[] = "2ND_SHIFT_DAY_{$d}";
            $shiftCols[] = "3RD_SHIFT_DAY_{$d}";
        }
    }
    $allCols = array_merge($baseCols, $shiftCols);
    $where = []; $params = []; $types = '';

    if (!empty($filterMonth)) { $where[] = "MONTH = ?"; $params[] = $filterMonth; $types .= 's'; }
    [$lineInClause, $lineInParams, $lineInTypes] = buildLineIn($filterLines);
    if ($lineInClause) {
        $where[] = substr($lineInClause, 5);
        $params  = array_merge($params, $lineInParams);
        $types  .= $lineInTypes;
    }
    if (auth_is_scoped()) {
        $where[] = "TEAM = ?"; $params[] = $_SESSION['team']; $types .= 's';
        $where[] = "LINE = ?"; $params[] = $_SESSION['line']; $types .= 's';
    }
    $sql = "SELECT " . implode(',', array_map(fn($c) => "`$c`", $allCols))
         . " FROM `$manageTable`";
    if (!empty($where)) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY YEAR DESC, MONTH DESC";
    $stmt = $conn->prepare($sql);
    if (!empty($params)) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="production_export_' . date('Y-m-d') . '.csv"');
    $out = fopen('php://output', 'w');
    fputcsv($out, $allCols);
    while ($row = $result->fetch_assoc()) fputcsv($out, $row);
    fclose($out);
    exit;
}

// ══════════════════════════════════════════════════════════════
// SHARED DATA — SKU options + lines by team
// ══════════════════════════════════════════════════════════════
$sku_options = [];
if (auth_is_scoped()) {
    $skuStmt = $conn->prepare(
        "SELECT DISTINCT SKU_CODE, SKU_DESCRIPTION, UOM, LINE, TEAM
         FROM sku_master WHERE TEAM = ? AND LINE = ? ORDER BY SKU_CODE"
    );
    $skuStmt->bind_param('ss', $_SESSION['team'], $_SESSION['line']);
    $skuStmt->execute();
    $skuRes = $skuStmt->get_result();
    while ($r = $skuRes->fetch_assoc()) $sku_options[] = $r;
} else {
    $skuRes = $conn->query(
        "SELECT DISTINCT SKU_CODE, SKU_DESCRIPTION, UOM, LINE, TEAM
         FROM sku_master ORDER BY SKU_CODE"
    );
    if ($skuRes) while ($r = $skuRes->fetch_assoc()) $sku_options[] = $r;
}

$lines_by_team = ['A' => [], 'B' => [], 'C' => []];
if (auth_is_scoped()) {
    $lines_by_team[$_SESSION['team']] = [$_SESSION['line']];
} else {
    $lineRes = $conn->query(
        "SELECT DISTINCT TEAM, LINE FROM sku_master
         WHERE LINE IS NOT NULL AND LINE != '' ORDER BY LINE"
    );
    if ($lineRes) {
        while ($r = $lineRes->fetch_assoc()) {
            if (in_array($r['TEAM'], ['A','B','C'])) $lines_by_team[$r['TEAM']][] = $r['LINE'];
        }
    }
}
$lines_json = json_encode($lines_by_team);

$isScoped          = auth_is_scoped();
$sessionTeam       = $_SESSION['team'] ?? '';
$sessionLine       = $_SESSION['line'] ?? '';
$lockedTargetTable = match($sessionTeam) {
    'A' => 'a_summary_line', 'B' => 'b_summary_line',
    'C' => 'c_summary_line', default => ''
};

$userRoleIcons  = [
    'system_admin' => 'fa-shield', 'admin'      => 'fa-user-secret',
    'data_entry'   => 'fa-pencil', 'viewer'     => 'fa-eye',
];
$userRoleLabels = [
    'system_admin' => 'System Admin', 'admin'    => 'Admin',
    'data_entry'   => 'Data Entry',   'viewer'   => 'Viewer',
];
$currentRoleIcon  = $userRoleIcons[$_SESSION['role']]  ?? 'fa-user';
$currentRoleLabel = $userRoleLabels[$_SESSION['role']] ?? ucfirst($_SESSION['role'] ?? '');

$action = $_GET['action'] ?? 'add';
$type   = $_GET['type']   ?? 'summary';
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Production Line Records</title>
    <link rel="stylesheet" href="css/mainpage.css">
    <link rel="icon" href="images/p_icon.png" type="image/png">
    <link rel="stylesheet" href="css/add_edit.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
<div class="page-bg">
    <?php include __DIR__ . '/templates/loader.php'; ?>

    <header class="header">
        <div class="header-left">
            <button type="button" id="sidebarToggleBtn" class="sidebar-toggle-btn"
                    aria-label="Toggle sidebar" aria-expanded="true" aria-controls="appSidebar">
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
                <span class="hamburger-bar"></span>
            </button>
            <h1>
                <img src="images/pioneerlogo.png" alt="Logo"
                     style="height:1.2em;vertical-align:middle;margin-right:8px;">
                Manage Production Records
            </h1>
        </div>
        <form id="logoutForm" method="post" action="logout.php" style="display:none;">
            <input type="hidden" name="logout" value="1">
        </form>
        <button type="button" class="logout-btn" onclick="openLogoutModal()">Logout</button>
    </header>

    <nav class="navbar user-welcome">
        <span>
            <i class="fa fa-user-circle"></i>
            Welcome, <?php echo htmlspecialchars(auth_display_name()); ?>
            &nbsp;|&nbsp;
            <i class="fa <?php echo $currentRoleIcon; ?>"></i>
            <?php echo $currentRoleLabel; ?>
            <?php if ($isScoped): ?>
                &nbsp;|&nbsp;
                <i class="fa fa-map-marker"></i>
                Team <?php echo htmlspecialchars($sessionTeam); ?>
                &mdash; <?php echo htmlspecialchars($sessionLine); ?>
            <?php endif; ?>
        </span>
    </nav>

    <nav class="navbar">
        <div class="dropdown">
            <button class="dropbtn">Line Production <i class="fa fa-caret-down"></i></button>
            <div class="dropdown-content">
                <?php if ($_SESSION['role'] !== 'viewer'): ?>
                    <a href="?action=add&type=summary">
                        <i class="fa fa-plus-circle"></i> Add Record
                    </a>
                <?php endif; ?>
                <a href="?action=manage&type=summary">
                    <i class="fa fa-table"></i> Manage Production Records
                </a>
            </div>
        </div>
    </nav>

    <div class="wrapper">
        <!-- Overlay — covers main content when sidebar open on mobile -->
        <div id="sidebarOverlay" class="sidebar-overlay"></div>

        <aside class="sidebar sticky-sidebar" id="appSidebar">
            <!-- Close button visible on mobile only -->
            <button type="button" id="sidebarCloseBtn" class="sidebar-close-btn"
                    aria-label="Close sidebar">
                <i class="fa fa-times"></i>
            </button>
            <ul>
                <li><a href="mainpage.php" data-tooltip="Dashboard">
                    <i class="fa fa-tachometer"></i> <span class="sidebar-text">Dashboard Page</span>
                </a></li>
                <li class="active"><a href="add_edit.php" data-tooltip="Production Records">
                    <i class="fa fa-table"></i> <span class="sidebar-text">Manage Production Records</span>
                </a></li>
                <li><a href="manage_report.php" data-tooltip="Line Report">
                    <i class="fa fa-file-text-o"></i> <span class="sidebar-text">Line Report &amp; LIPAS VOLPAS</span>
                </a></li>
                <?php if (in_array($_SESSION['role'], ['system_admin','admin'])): ?>
                    <li class="admin-section-label"><span class="sidebar-text">Admin Access</span></li>
                    <?php if ($_SESSION['role'] === 'system_admin'): ?>
                        <li>
                            <a href="manage_users.php" data-tooltip="User Management">
                                <i class="fa fa-users"></i> <span class="sidebar-text">User Management</span>
                                <?php if ($pendingUsersCount > 0): ?>
                                    <span class="mu-nav-badge">
                                        <?php echo $pendingUsersCount; ?>
                                    </span>
                                <?php endif; ?>
                            </a>
                        </li>
                    <?php endif; ?>
                    <li><a href="import_data.php" data-tooltip="Import Records">
                        <i class="fa fa-upload"></i> <span class="sidebar-text">Import Records</span>
                    </a></li>
                    <?php if ($_SESSION['role'] === 'system_admin'): ?>
                        <li><a href="audit_log.php" data-tooltip="Audit Trail">
                            <i class="fa fa-history"></i> <span class="sidebar-text">Audit Trail</span>
                        </a></li>
                    <?php endif; ?>
                <?php endif; ?>
            </ul>
        </aside>

        <main class="main-content">

            <?php
            if (!empty($message))
                echo '<div class="message success"><i class="fa fa-check-circle"></i> '
                   . htmlspecialchars($message) . '</div>';
            if (!empty($error))
                echo '<div class="message error"><i class="fa fa-exclamation-triangle"></i> '
                   . htmlspecialchars($error) . '</div>';
            ?>

            <?php if ($action === 'add' && $type === 'summary'): ?>
            <!-- ════════════════════════════════════════
                 ADD RECORD FORM
            ════════════════════════════════════════ -->
            <h2>Add Line Production Record</h2>

            <?php if ($isScoped): ?>
            <div class="ae-context-card">
                <i class="fa fa-map-marker"></i>
                Team <strong><?php echo htmlspecialchars($sessionTeam); ?></strong>
                &nbsp;&middot;&nbsp;
                <strong><?php echo htmlspecialchars($sessionLine); ?></strong>
                &nbsp;&middot;&nbsp;
                <?php echo date('F Y'); ?>
            </div>
            <?php endif; ?>

            <form method="post"
                      action="add_edit.php?action=add&type=summary"
                      id="productionForm">
                    <input type="hidden" name="add_production" value="1">
                    <input type="hidden" name="csrf_token"
                           value="<?php echo htmlspecialchars($csrf_token); ?>">

                    <?php if ($isScoped): ?>
                        <input type="hidden" name="target_table"
                               value="<?php echo htmlspecialchars($lockedTargetTable); ?>">
                        <input type="hidden" name="TEAM"
                               value="<?php echo htmlspecialchars($sessionTeam); ?>">
                        <input type="hidden" name="LINE"
                               value="<?php echo htmlspecialchars($sessionLine); ?>">
                    <?php else: ?>
                        <div class="form-group">
                            <label for="target_table">Target Team *</label>
                            <select name="target_table" id="target_table" required>
                                <option value="">-- Select Team --</option>
                                <option value="a_summary_line">Team A</option>
                                <option value="b_summary_line">Team B</option>
                                <option value="c_summary_line">Team C</option>
                            </select>
                        </div>
                    <?php endif; ?>

                    <div class="form-row">
                        <?php if (!$isScoped): ?>
                        <div class="form-group">
                            <label for="TEAM">Team *</label>
                            <input type="text" name="TEAM" id="TEAM" readonly required>
                        </div>
                        <?php endif; ?>
                        <div class="form-group">
                            <label for="MONTH">Month *</label>
                            <select name="MONTH" id="MONTH" required>
                                <option value="">-- Select Month --</option>
                                <?php foreach ($months as $m): ?>
                                    <option value="<?php echo $m; ?>">
                                        <?php echo $m; ?>
                                    </option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="YEAR">Year *</label>
                            <input type="text" name="YEAR" id="YEAR"
                                   value="<?php echo $currentYear; ?>" readonly required>
                        </div>
                    </div>

                    <?php if (!$isScoped): ?>
                    <div class="form-row">
                        <div class="form-group">
                            <label for="LINE_select">Line *</label>
                            <select name="LINE" id="LINE_select" required disabled>
                                <option value="">-- Select Line --</option>
                            </select>
                        </div>
                    </div>
                    <?php endif; ?>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="SKU_CODE">SKU Code *</label>
                            <div class="sku-combo-wrap">
                                <input type="text" name="SKU_CODE" id="SKU_CODE"
                                       placeholder="Type or select SKU code"
                                       autocomplete="off"
                                       <?php echo (!$isScoped) ? 'disabled' : ''; ?>
                                       required>
                                <button type="button" id="skuDropdownBtn"
                                        class="sku-combo-btn"
                                        <?php echo (!$isScoped) ? 'disabled' : ''; ?>
                                        tabindex="-1"
                                        title="Show SKU list">
                                    <i class="fa fa-chevron-down" id="skuChevron"></i>
                                </button>
                                <ul class="sku-autocomplete-list" id="sku_code_list"></ul>
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="SKU_DESCRIPTION">SKU Description</label>
                            <input type="text" name="SKU_DESCRIPTION"
                                   id="SKU_DESCRIPTION"
                                   placeholder="Auto-filled from SKU Code"
                                   readonly>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="QUANTITY">Quantity</label>
                            <input type="number" name="QUANTITY" id="QUANTITY"
                                   min="0" placeholder="Enter quantity">
                        </div>
                        <div class="form-group">
                            <label for="UOM">UOM</label>
                            <input type="text" name="UOM" id="UOM"
                                   readonly placeholder="Auto-filled">
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="OPERATING_DAYS_START">
                                Operating Days Start *
                            </label>
                            <input type="date" name="OPERATING_DAYS_START"
                                   id="OPERATING_DAYS_START" required
                                   <?php echo $isScoped ? 'readonly' : ''; ?>>
                        </div>
                        <div class="form-group">
                            <label for="OPERATING_DAYS_END">
                                Operating Days End *
                            </label>
                            <input type="date" name="OPERATING_DAYS_END"
                                   id="OPERATING_DAYS_END" required
                                   <?php echo $isScoped ? 'readonly' : ''; ?>>
                        </div>
                    </div>

                    <div id="duplicateWarning" class="ae-duplicate-warning"
                         style="display:none;" role="alert">
                        <i class="fa fa-exclamation-triangle"></i>
                        <span id="duplicateWarningMsg"></span>
                    </div>

                    <div class="cumulative-preview">
                        <h3>Cumulative Output (Live Total):</h3>
                        <span class="total-value" id="liveTotal">0</span>
                    </div>

                    <div id="shiftSection" style="display:none;">
                        <div class="ae-shift-heading">
                            <h3>Shift Production Quantities</h3>
                            <span class="ae-day-badge" id="todayDayLabel"></span>
                        </div>
                        <div class="shift-table-wrap">
                        <table class="shift-table">
                            <thead>
                                <tr>
                                    <th>Day</th>
                                    <th>1st Shift</th>
                                    <th>2nd Shift</th>
                                    <th>3rd Shift</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php
                                $dayNames = [
                                    1=>'Monday',2=>'Tuesday',3=>'Wednesday',
                                    4=>'Thursday',5=>'Friday',6=>'Saturday',7=>'Sunday'
                                ];
                                for ($day = 1; $day <= 7; $day++): ?>
                                <tr data-day="<?php echo $day; ?>" style="display:none;">
                                    <td>
                                        Day <?php echo $day; ?>
                                        <small class="ae-day-name">
                                            <?php echo $dayNames[$day]; ?>
                                        </small>
                                    </td>
                                    <td>
                                        <input type="number"
                                               name="1ST_SHIFT_DAY_<?php echo $day; ?>"
                                               class="shift-input" min="0"
                                               placeholder="0">
                                    </td>
                                    <td>
                                        <input type="number"
                                               name="2ND_SHIFT_DAY_<?php echo $day; ?>"
                                               class="shift-input" min="0"
                                               placeholder="0">
                                    </td>
                                    <td>
                                        <input type="number"
                                               name="3RD_SHIFT_DAY_<?php echo $day; ?>"
                                               class="shift-input" min="0"
                                               placeholder="0">
                                    </td>
                                </tr>
                                <?php endfor; ?>
                            </tbody>
                        </table>
                        </div>
                    </div>

                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary"
                                id="submitBtn" disabled>
                            <i class="fa fa-plus"></i> Add Record
                        </button>
                        <button type="button" class="btn btn-secondary"
                            onclick="window.location.href=
                                'add_edit.php?action=add&type=summary'">
                            <i class="fa fa-undo"></i> Reset
                        </button>
                    </div>
                </form>

            <div id="validationModal" class="modal">
                <div class="modal-box" style="max-width:450px;">
                    <h3>
                        <i class="fa fa-exclamation-triangle"
                           style="color:#ef4444;"></i> Invalid Entry
                    </h3>
                    <p id="validationMessage" style="margin-bottom:20px;"></p>
                    <div class="modal-actions">
                        <button type="button" class="btn-cancel"
                                onclick="AddEditForm.closeValidationModal()">
                            OK
                        </button>
                    </div>
                </div>
            </div>

            <script>
            var AE_Config = {
                isScoped    : <?php echo json_encode($isScoped); ?>,
                sessionTeam : <?php echo json_encode($sessionTeam); ?>,
                sessionLine : <?php echo json_encode($sessionLine); ?>,
                lockedTable : <?php echo json_encode($lockedTargetTable); ?>,
                linesByTeam : <?php echo $lines_json; ?>,
                skuOptions  : <?php echo json_encode($sku_options); ?>,
                currentMonth: <?php echo json_encode($currentMonthName); ?>,
                currentYear : <?php echo json_encode($currentYear); ?>,
                csrfToken   : <?php echo json_encode($csrf_token); ?>,
                role        : <?php echo json_encode($_SESSION['role']); ?>
            };
            </script>
            <script src="js/add_edit_form.js"></script>
            <script src="js/add_edit.js"></script>

            <?php elseif ($action === 'manage' && $type === 'summary'): ?>
                <?php include __DIR__ . '/view/add_edit.tpl.php'; ?>
            <?php endif; ?>

        </main>
    </div>

    <footer class="footer">
        <p>&copy; <?php echo date('Y'); ?> Production Monitoring System</p>
    </footer>
</div><!-- .page-bg -->

<!-- ═══════════════════════════════════════════════════════════════
     MODALS (placed at the very end of body, outside main content)
     to avoid stacking context conflicts.
     ═══════════════════════════════════════════════════════════════ -->

<?php if ($action === 'manage' && $type === 'summary' && $_SESSION['role'] !== 'viewer'): ?>
<!-- Edit Modal -->
<div id="editModal" class="modal">
    <div class="modal-box" style="max-width:740px; padding:28px 32px;">
        <h3 id="editModalTitle">Edit Record</h3>

        <form id="editModalForm" autocomplete="off">
            <input type="hidden" name="id"    id="modal_id">
            <input type="hidden" name="table" id="modal_table" value="<?php echo htmlspecialchars($manageTable); ?>">

            <div class="form-row">
                <div class="form-group">
                    <label for="modal_TEAM">Team</label>
                    <input type="text" name="TEAM" id="modal_TEAM" readonly>
                </div>
                <div class="form-group">
                    <label for="modal_MONTH">Month</label>
                    <select name="MONTH" id="modal_MONTH">
                        <?php foreach ($months as $m): ?>
                            <option value="<?php echo $m; ?>"><?php echo $m; ?></option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="modal_YEAR">Year</label>
                    <input type="number" name="YEAR" id="modal_YEAR">
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="modal_LINE_select">Line</label>
                    <select name="LINE" id="modal_LINE_select" required>
                        <option value="">-- Select Line --</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="modal_SKU_CODE">SKU Code *</label>
                    <select name="SKU_CODE" id="modal_SKU_CODE" required>
                        <option value="">-- Select SKU --</option>
                        <?php foreach ($sku_options as $opt): ?>
                            <option value="<?php echo htmlspecialchars($opt['SKU_CODE']); ?>"
                                    data-desc="<?php echo htmlspecialchars($opt['SKU_DESCRIPTION']); ?>"
                                    data-line="<?php echo htmlspecialchars($opt['LINE']); ?>"
                                    data-team="<?php echo htmlspecialchars($opt['TEAM']); ?>">
                                <?php echo htmlspecialchars($opt['SKU_CODE']); ?>
                            </option>
                        <?php endforeach; ?>
                    </select>
                </div>
                <div class="form-group">
                    <label for="modal_SKU_DESCRIPTION">SKU Description</label>
                    <input type="text" name="SKU_DESCRIPTION" id="modal_SKU_DESCRIPTION" readonly>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="modal_QUANTITY">Quantity</label>
                    <input type="number" name="QUANTITY" id="modal_QUANTITY" min="0">
                </div>
                <div class="form-group">
                    <label for="modal_UOM">UOM</label>
                    <input type="text" name="UOM" id="modal_UOM" readonly>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="modal_OPERATING_DAYS_START">Ops. Days Start *</label>
                    <input type="date" name="OPERATING_DAYS_START" id="modal_OPERATING_DAYS_START" required>
                </div>
                <div class="form-group">
                    <label for="modal_OPERATING_DAYS_END">Ops. Days End *</label>
                    <input type="date" name="OPERATING_DAYS_END" id="modal_OPERATING_DAYS_END" required>
                </div>
            </div>

            <div class="cumulative-preview" style="margin-bottom: 16px;">
                <h3>Cumulative Output (Live Total):</h3>
                <span class="total-value" id="modalLiveTotal">0</span>
            </div>

            <h4>Shift Production Quantities</h4>
            <div id="modalShiftFields" class="panel-shift-grid"></div>
        </form>

        <div class="modal-actions">
            <button type="button" id="modalUpdateBtn" class="btn-update" onclick="updateModalRecord()">
                <i class="fa fa-check"></i> Update
            </button>
            <button type="button" class="btn-delete" onclick="deleteModalRecord()">
                <i class="fa fa-trash"></i> Delete
            </button>
            <button type="button" class="btn-cancel" onclick="closeEditModal()">
                <i class="fa fa-times"></i> Cancel
            </button>
        </div>
    </div>
</div>

<!-- Delete Confirmation Modal (toolbar delete) -->
<div id="deleteConfirmModal" class="modal">
    <div class="modal-box" style="max-width: 420px;">
        <h3><i class="fa fa-exclamation-triangle" style="color:#ef4444;"></i> Confirm Delete</h3>
        <p>Are you sure you want to delete this record? This cannot be undone.</p>
        <div class="modal-actions">
            <button type="button" class="btn-cancel" onclick="closeDeleteModal()"><i class="fa fa-times"></i> Cancel</button>
            <button type="button" class="btn-delete" onclick="executeDelete()"><i class="fa fa-trash"></i> Delete</button>
        </div>
    </div>
</div>
<?php endif; ?>

<!-- LOGOUT MODAL -->
<div id="logoutModal" class="logout-modal-overlay" style="display:none;">
    <div class="logout-modal-box">
        <h3><i class="fa fa-sign-out"></i> Confirm Logout</h3>
        <p>Are you sure you want to logout?</p>
        <div class="logout-modal-actions">
            <button class="btn-cancel" onclick="closeLogoutModal()">
                <i class="fa fa-times"></i> No
            </button>
            <button class="btn-logout-yes" onclick="confirmLogout()">
                <i class="fa fa-check"></i> Yes
            </button>
        </div>
    </div>
</div>

<?php if ($action === 'manage' && $type === 'summary'): ?>
    <script src="js/add_edit.js"></script>
<?php endif; ?>

</body>
</html>