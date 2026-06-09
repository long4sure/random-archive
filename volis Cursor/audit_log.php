<?php
session_start();
require 'db.php';
require 'auth_check.php';   // session guard

// ── System Admin only ──────────────────────────────────────
if ($_SESSION['role'] !== 'system_admin') {
    header('Location: mainpage.php');
    exit;
}

// ── Pending users count for badge ──────────────────────────
$pendingUsersCount = 0;
$res = $conn->query("SELECT COUNT(*) AS cnt FROM users WHERE approval_status = 'pending'");
if ($res) $pendingUsersCount = (int)$res->fetch_assoc()['cnt'];

// ── Filters ─────────────────────────────────────────────────
$filterAction   = $_GET['action']   ?? '';
$filterUsername = $_GET['username'] ?? '';
$filterDateFrom = $_GET['date_from'] ?? '';
$filterDateTo   = $_GET['date_to']   ?? '';
$filterTable    = $_GET['table']    ?? '';

// ── Pagination ──────────────────────────────────────────────
$page     = max(1, (int)($_GET['page'] ?? 1));
$perPageOptions = [15,30,50,100];
$perPage  = (int)($_GET['per_page'] ?? 30);
if (!in_array($perPage, $perPageOptions, true)) $perPage = 30;
$offset   = ($page - 1) * $perPage;

// ── Sorting ─────────────────────────────────────────────────
$allowedSortCols = ['username','role','action','table_name','record_id','created_at'];
$sortColumn = $_GET['sort'] ?? 'created_at';
if (!in_array($sortColumn, $allowedSortCols, true)) $sortColumn = 'created_at';
$sortOrder  = strtoupper($_GET['order'] ?? 'DESC');
if ($sortOrder !== 'ASC' && $sortOrder !== 'DESC') $sortOrder = 'DESC';

// ── Export CSV ──────────────────────────────────────────────
if (isset($_GET['export']) && $_GET['export'] === 'csv') {

    $exportFilename = 'audit_log_export';
    if ($filterDateFrom && $filterDateTo) {
        $exportFilename .= '_' . $filterDateFrom . '_to_' . $filterDateTo;
    } elseif ($filterDateFrom) {
        $exportFilename .= '_from_' . $filterDateFrom;
    } elseif ($filterDateTo) {
        $exportFilename .= '_to_' . $filterDateTo;
    } else {
        $exportFilename .= '_' . date('Y-m-d_His');
    }

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $exportFilename . '.csv"');
    $output = fopen('php://output', 'w');
    fputcsv($output, ['ID', 'User', 'Role', 'Action', 'Table', 'Record ID', 'Description', 'Date/Time']);   // No IP

    $whereClauses = [];
    $params = []; $types = '';
    if ($filterAction !== '')   { $whereClauses[] = 'a.action = ?';   $params[] = $filterAction;   $types .= 's'; }
    if ($filterUsername !== '') { $whereClauses[] = 'a.username LIKE ?'; $params[] = "%$filterUsername%"; $types .= 's'; }
    if ($filterDateFrom !== '') { $whereClauses[] = 'a.created_at >= ?'; $params[] = $filterDateFrom . ' 00:00:00'; $types .= 's'; }
    if ($filterDateTo !== '')   { $whereClauses[] = 'a.created_at <= ?'; $params[] = $filterDateTo . ' 23:59:59'; $types .= 's'; }
    if ($filterTable !== '')    { $whereClauses[] = 'a.table_name = ?'; $params[] = $filterTable; $types .= 's'; }
    $whereSQL = $whereClauses ? 'WHERE ' . implode(' AND ', $whereClauses) : '';

    $sql = "SELECT a.id, a.username, a.role, a.action, a.table_name, a.record_id, a.description, a.created_at
            FROM audit_log a $whereSQL ORDER BY a.created_at DESC";
    $stmt = $conn->prepare($sql);
    if ($params) $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $res = $stmt->get_result();
    while ($row = $res->fetch_assoc()) {
        fputcsv($output, $row);
    }
    fclose($output);
    exit;
}

// ── Fetch data for display ─────────────────────────────────
$whereClauses = [];
$params = []; $types = '';
if ($filterAction !== '')   { $whereClauses[] = 'a.action = ?';   $params[] = $filterAction;   $types .= 's'; }
if ($filterUsername !== '') { $whereClauses[] = 'a.username LIKE ?'; $params[] = "%$filterUsername%"; $types .= 's'; }
if ($filterDateFrom !== '') { $whereClauses[] = 'a.created_at >= ?'; $params[] = $filterDateFrom . ' 00:00:00'; $types .= 's'; }
if ($filterDateTo !== '')   { $whereClauses[] = 'a.created_at <= ?'; $params[] = $filterDateTo . ' 23:59:59'; $types .= 's'; }
if ($filterTable !== '')    { $whereClauses[] = 'a.table_name = ?'; $params[] = $filterTable; $types .= 's'; }
$whereSQL = $whereClauses ? 'WHERE ' . implode(' AND ', $whereClauses) : '';

// Total records for pagination
$countSql = "SELECT COUNT(*) FROM audit_log a $whereSQL";
$countStmt = $conn->prepare($countSql);
if ($params) $countStmt->bind_param($types, ...$params);
$countStmt->execute();
$totalRecords = (int)$countStmt->get_result()->fetch_row()[0];
$totalPages   = ceil($totalRecords / $perPage);

// Data query (no IP column)
$dataSql = "SELECT a.id, a.username, a.role, a.action, a.table_name, a.record_id, a.description, a.created_at
            FROM audit_log a $whereSQL ORDER BY a.`$sortColumn` $sortOrder LIMIT ? OFFSET ?";
$dataParams   = $params;
$dataTypes    = $types . 'ii';
$dataParams[] = $perPage;
$dataParams[] = $offset;

$stmt = $conn->prepare($dataSql);
$stmt->bind_param($dataTypes, ...$dataParams);
$stmt->execute();
$logs = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);

// ── Distinct actions and tables for filter dropdowns ────────
$actionsList = [];
$res = $conn->query("SELECT DISTINCT action FROM audit_log ORDER BY action");
while ($r = $res->fetch_assoc()) $actionsList[] = $r['action'];

$tablesList = [];
$res = $conn->query("SELECT DISTINCT table_name FROM audit_log WHERE table_name IS NOT NULL ORDER BY table_name");
while ($r = $res->fetch_assoc()) $tablesList[] = $r['table_name'];

// ── CSRF token ──────────────────────────────────────────────
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}
$csrfToken = $_SESSION['csrf_token'];

// ── Summary cards data ──────────────────────────────────────
$todayStmt = $conn->prepare("SELECT COUNT(*) FROM audit_log WHERE DATE(created_at) = CURDATE()");
$todayStmt->execute();
$logsToday = (int)$todayStmt->get_result()->fetch_row()[0];

$weekStmt = $conn->prepare("SELECT COUNT(*) FROM audit_log WHERE created_at >= NOW() - INTERVAL 7 DAY");
$weekStmt->execute();
$logsWeek = (int)$weekStmt->get_result()->fetch_row()[0];

$topStmt = $conn->prepare("SELECT username, COUNT(*) AS cnt FROM audit_log GROUP BY username ORDER BY cnt DESC LIMIT 5");
$topStmt->execute();
$topUsers = $topStmt->get_result()->fetch_all(MYSQLI_ASSOC);

// ── Sort helper for table headers ──────────────────────────
$sortLink = function($col) use ($sortColumn, $sortOrder, $filterAction, $filterUsername, $filterTable, $filterDateFrom, $filterDateTo, $perPage) {
    $newOrder = ($sortColumn === $col && $sortOrder === 'ASC') ? 'DESC' : 'ASC';
    $arrow = ($sortColumn === $col) ? ($sortOrder === 'ASC' ? ' ▲' : ' ▼') : '';
    $params = array_filter([
        'action' => $filterAction,
        'username' => $filterUsername,
        'table' => $filterTable,
        'date_from' => $filterDateFrom,
        'date_to' => $filterDateTo,
        'per_page' => $perPage,
        'sort' => $col,
        'order' => $newOrder,
    ]);
    return '<a href="audit_log.php?' . http_build_query($params) . '" style="color:inherit; text-decoration:none;">'
           . htmlspecialchars(ucfirst(str_replace('_', ' ', $col))) . $arrow . '</a>';
};
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Audit Trail – Production Monitoring System</title>
    <link rel="icon" href="images/p_icon.png" type="image/png">
    <link rel="stylesheet" href="css/mainpage.css">
    <link rel="stylesheet" href="css/audit_log.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
<div class="page-bg">
    <?php include __DIR__ . '/templates/loader.php'; ?>

    <header class="header">
        <h1><img src="images/pioneerlogo.png" alt="Logo" style="height:1.2em; vertical-align:middle; margin-right:8px;">Audit Trail</h1>
        <form id="logoutForm" method="post" action="logout.php" style="display:none;">
            <input type="hidden" name="logout" value="1">
        </form>
        <button type="button" class="logout-btn" onclick="openLogoutModal()">Logout</button>
    </header>

    <nav class="navbar user-welcome">
        <span><i class="fa fa-user-circle"></i> Welcome, <?php echo htmlspecialchars($_SESSION['user']); ?> &nbsp;|&nbsp; <i class="fa fa-shield"></i> Admin</span>
    </nav>

    <div class="wrapper">
        <aside class="sidebar sticky-sidebar">
            <ul>
                <li><a href="mainpage.php"><i class="fa fa-tachometer"></i> Dashboard Page</a></li>
                <li><a href="add_edit.php"><i class="fa fa-table"></i> Manage Production Records</a></li>
                <li><a href="manage_report.php"><i class="fa fa-file-text-o"></i> Line Report Records & LIPAS VOLPAS</a></li>
                <li class="admin-section-label"><span>Admin Access</span></li>
                <li>
                    <a href="manage_users.php"><i class="fa fa-users"></i> User Management
                        <?php if ($pendingUsersCount > 0): ?>
                            <span class="mu-nav-badge"><?php echo $pendingUsersCount; ?></span>
                        <?php endif; ?>
                    </a>
                </li>
                <li><a href="import_data.php"><i class="fa fa-upload"></i> Import Records</a></li>
                <li class="active"><a href="audit_log.php"><i class="fa fa-history"></i> Audit Trail</a></li>
            </ul>
        </aside>

        <main class="main-content">
            <!-- Summary Cards -->
            <div class="kpi-grid audit-kpis">
                <div class="kpi-card">
                    <div class="label">Actions Today</div>
                    <div class="value"><?php echo number_format($logsToday); ?></div>
                </div>
                <div class="kpi-card">
                    <div class="label">Actions Last 7 Days</div>
                    <div class="value"><?php echo number_format($logsWeek); ?></div>
                </div>
                <?php if (!empty($topUsers)): ?>
                <div class="kpi-card">
                    <div class="label">Most Active Users</div>
                    <div class="value" style="font-size:16px; line-height:1.5;">
                        <?php foreach ($topUsers as $tu): ?>
                            <span style="white-space:nowrap;"><?php echo htmlspecialchars($tu['username']); ?> (<?php echo $tu['cnt']; ?>)</span><br>
                        <?php endforeach; ?>
                    </div>
                </div>
                <?php endif; ?>
            </div>

            <h2><i class="fa fa-history"></i> Activity Log</h2>

            <!-- Filter Form -->
            <div class="filter-card">
                <?php if ($filterAction || $filterUsername || $filterTable || $filterDateFrom || $filterDateTo): ?>
                <div class="filter-active-badge"><i class="fa fa-filter"></i> Filters active</div>
                <?php endif; ?>

                <form method="get" class="audit-filter-form">
                    <div class="filter-row">
                        <div class="filter-group">
                            <label>Action</label>
                            <select name="action">
                                <option value="">All Actions</option>
                                <?php foreach ($actionsList as $act): ?>
                                    <option value="<?php echo htmlspecialchars($act); ?>" <?php echo ($filterAction === $act) ? 'selected' : ''; ?>><?php echo htmlspecialchars($act); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>Username</label>
                            <input type="text" name="username" placeholder="Search username..." value="<?php echo htmlspecialchars($filterUsername); ?>">
                        </div>
                        <div class="filter-group">
                            <label>Table</label>
                            <select name="table">
                                <option value="">All Tables</option>
                                <?php foreach ($tablesList as $tbl): ?>
                                    <option value="<?php echo htmlspecialchars($tbl); ?>" <?php echo ($filterTable === $tbl) ? 'selected' : ''; ?>><?php echo htmlspecialchars($tbl); ?></option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="filter-group">
                            <label>From</label>
                            <input type="date" name="date_from" value="<?php echo htmlspecialchars($filterDateFrom); ?>">
                        </div>
                        <div class="filter-group">
                            <label>To</label>
                            <input type="date" name="date_to" value="<?php echo htmlspecialchars($filterDateTo); ?>">
                        </div>
                        <div class="filter-group">
                            <label>Show</label>
                            <select name="per_page" onchange="this.form.submit()">
                                <?php foreach ($perPageOptions as $ppo): ?>
                                    <option value="<?php echo $ppo; ?>" <?php echo ($perPage == $ppo) ? 'selected' : ''; ?>><?php echo $ppo; ?> rows</option>
                                <?php endforeach; ?>
                            </select>
                        </div>
                        <div class="filter-actions">
                            <button type="submit" class="btn-apply"><i class="fa fa-filter"></i> Apply</button>
                            <button type="button" class="btn-outline" onclick="window.location='audit_log.php'"><i class="fa fa-refresh"></i> Reset</button>
                            <a href="?<?php echo http_build_query(array_filter(['action' => $filterAction, 'username' => $filterUsername, 'table' => $filterTable, 'date_from' => $filterDateFrom, 'date_to' => $filterDateTo])) . '&export=csv'; ?>" class="btn-success"><i class="fa fa-file-excel-o"></i> Export CSV</a>
                        </div>
                    </div>
                </form>
            </div>

            <!-- Results Table -->
            <div class="table-container">
                <table class="data-table audit-table">
                    <thead>
                        <tr>
                            <th><?php echo $sortLink('username'); ?></th>
                            <th><?php echo $sortLink('role'); ?></th>
                            <th><?php echo $sortLink('action'); ?></th>
                            <th><?php echo $sortLink('table_name'); ?></th>
                            <th><?php echo $sortLink('record_id'); ?></th>
                            <th>Description</th>
                            <th><?php echo $sortLink('created_at'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php if (count($logs) > 0): ?>
                            <?php foreach ($logs as $log): ?>
                                <tr>
                                    <td><?php echo htmlspecialchars($log['username']); ?></td>
                                    <td><span class="role-badge role-<?php echo $log['role']; ?>"><?php echo htmlspecialchars($log['role']); ?></span></td>
                                    <td><?php echo htmlspecialchars($log['action']); ?></td>
                                    <td><?php echo htmlspecialchars($log['table_name'] ?? ''); ?></td>
                                    <td><?php echo $log['record_id'] ?? ''; ?></td>
                                    <td><?php echo htmlspecialchars(mb_strimwidth($log['description'] ?? '', 0, 60, '...')); ?></td>
                                    <td><?php echo htmlspecialchars($log['created_at']); ?></td>
                                </tr>
                            <?php endforeach; ?>
                        <?php else: ?>
                            <tr><td colspan="7" style="text-align:center; padding:30px;">No audit records found.</td></tr>
                        <?php endif; ?>
                    </tbody>
                </table>
            </div>

            <!-- Pagination -->
            <?php if ($totalPages > 1): ?>
            <div class="pagination">
                <?php
                $qp = $_GET;
                unset($qp['page']);
                $baseQuery = http_build_query(array_filter($qp));
                $baseUrl = "audit_log.php?" . ($baseQuery ? $baseQuery . '&' : '');
                ?>
                <?php if ($page > 1): ?>
                    <a href="<?php echo $baseUrl; ?>page=<?php echo $page-1; ?>" class="page-link">&laquo; Prev</a>
                <?php endif; ?>
                <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <a href="<?php echo $baseUrl; ?>page=<?php echo $i; ?>" class="page-link <?php echo ($i == $page) ? 'active' : ''; ?>"><?php echo $i; ?></a>
                <?php endfor; ?>
                <?php if ($page < $totalPages): ?>
                    <a href="<?php echo $baseUrl; ?>page=<?php echo $page+1; ?>" class="page-link">Next &raquo;</a>
                <?php endif; ?>

                <!-- Jump to page -->
                <form method="get" style="display:inline-block; margin-left:12px;">
                    <?php
                    $formParams = $_GET;
                    unset($formParams['page']);
                    foreach ($formParams as $key => $val) {
                        if (is_array($val)) {
                            foreach ($val as $v) echo '<input type="hidden" name="' . htmlspecialchars($key) . '[]" value="' . htmlspecialchars($v) . '">';
                        } else {
                            echo '<input type="hidden" name="' . htmlspecialchars($key) . '" value="' . htmlspecialchars($val) . '">';
                        }
                    }
                    ?>
                    <input type="number" name="page" min="1" max="<?php echo $totalPages; ?>" placeholder="Page" style="width:70px; padding:8px; border:1px solid #cbd5e1; border-radius:8px;">
                    <button type="submit" class="go-btn">Go</button>
                </form>
            </div>
            <?php endif; ?>
        </main>
    </div>

    <footer class="footer"><p>&copy; <?php echo date('Y'); ?> Production Monitoring System</p></footer>
</div>

<div id="logoutModal" class="logout-modal-overlay" style="display:none;">
    <div class="logout-modal-box">
        <h3><i class="fa fa-sign-out"></i> Confirm Logout</h3>
        <p>Are you sure you want to logout?</p>
        <div class="logout-modal-actions">
            <button class="btn-cancel" onclick="closeLogoutModal()"><i class="fa fa-times"></i> No</button>
            <button class="btn-logout-yes" onclick="confirmLogout()"><i class="fa fa-check"></i> Yes</button>
        </div>
    </div>
</div>

<script>
function openLogoutModal() { document.getElementById('logoutModal').style.display = 'flex'; }
function closeLogoutModal() { document.getElementById('logoutModal').style.display = 'none'; }
function confirmLogout() { document.getElementById('logoutForm').submit(); }
document.getElementById('logoutModal').addEventListener('click', function(e) { if (e.target === this) closeLogoutModal(); });
</script>
</body>
</html>