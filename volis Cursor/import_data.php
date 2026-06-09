<?php
/**
 * import_data.php
 * Imports production data from CSV or Excel files into a_summary_line,
 * b_summary_line, or c_summary_line tables.
 *
 * Features:
 * - Column‑name‑based mapping (order independent)
 * - Removes commas from numeric fields (e.g., "3,288" → 3288)
 * - Converts dates from Excel serials or string formats to YYYY-MM-DD
 * - Skips duplicate rows (based on TEAM, WEEK, MONTH, YEAR, LINE, SKU_CODE)
 * - Uses prepared statements for security
 */

session_start();
require 'db.php';
require 'vendor/autoload.php';
require 'auth_check.php';
$pendingUsersCount = 0;
if ($_SESSION['role'] === 'admin') {
    $res = $conn->query("SELECT COUNT(*) AS cnt FROM users WHERE approval_status = 'pending'");
    if ($res) $pendingUsersCount = (int)$res->fetch_assoc()['cnt'];
}

use PhpOffice\PhpSpreadsheet\IOFactory;
use PhpOffice\PhpSpreadsheet\Shared\Date as ExcelDate;

// Enable error reporting during development (remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Authentication check
if (!isset($_SESSION['user'])) {
    header("Location: login.php");
    exit();
}

$message = '';
$duplicate_rows = [];
$header = [];

// Handle file upload
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['upload'])) {
    $table = $_POST['table'] ?? '';
    $allowed_tables = ['a_summary_line', 'b_summary_line', 'c_summary_line'];

    if (!in_array($table, $allowed_tables)) {
        $message = "❌ Invalid table selected.";
    } elseif (empty($_FILES['csv_file']['name'])) {
        $message = "❌ Please select a file to upload.";
    } else {
        $file = $_FILES['csv_file']['tmp_name'];
        $file_name = $_FILES['csv_file']['name'];
        $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));

        // Columns to insert (CUMULATIVE_OUTPUT is auto‑calculated by trigger)
        $insert_columns = [
            'TEAM', 'WEEK', 'MONTH', 'YEAR', 'LINE', 'SKU_CODE', 'SKU_DESCRIPTION',
            'QUANTITY', 'UOM', 'OPERATING_DAYS_START', 'OPERATING_DAYS_END',
            '1ST_SHIFT_DAY_1', '2ND_SHIFT_DAY_1', '3RD_SHIFT_DAY_1',
            '1ST_SHIFT_DAY_2', '2ND_SHIFT_DAY_2', '3RD_SHIFT_DAY_2',
            '1ST_SHIFT_DAY_3', '2ND_SHIFT_DAY_3', '3RD_SHIFT_DAY_3',
            '1ST_SHIFT_DAY_4', '2ND_SHIFT_DAY_4', '3RD_SHIFT_DAY_4',
            '1ST_SHIFT_DAY_5', '2ND_SHIFT_DAY_5', '3RD_SHIFT_DAY_5',
            '1ST_SHIFT_DAY_6', '2ND_SHIFT_DAY_6', '3RD_SHIFT_DAY_6',
            '1ST_SHIFT_DAY_7', '2ND_SHIFT_DAY_7', '3RD_SHIFT_DAY_7'
        ];

        $row_count = 0;
        $duplicate_count = 0;
        $rows = [];
        $stop_processing = false;

        try {
            // --- Read file content ---
            if ($file_ext === 'csv') {
                $handle = fopen($file, 'r');
                if (!$handle) throw new Exception("Unable to open CSV file.");
                $header = fgetcsv($handle);
                while (($data = fgetcsv($handle, 10000, ',')) !== false) {
                    $rows[] = $data;
                }
                fclose($handle);
            } elseif (in_array($file_ext, ['xls', 'xlsx'])) {
                $spreadsheet = IOFactory::load($file);
                $worksheet = $spreadsheet->getActiveSheet();
                $rows = $worksheet->toArray();
                if (empty($rows)) throw new Exception("Excel file is empty.");
                $header = array_shift($rows);
            } else {
                throw new Exception("Unsupported file type. Please upload a CSV or Excel file (.xlsx, .xls).");
            }

            // --- Build header map (normalize: uppercase, spaces → underscores) ---
            $header_map = [];
            foreach ($header as $idx => $col_name) {
                $normalized = strtoupper(trim($col_name));
                $normalized = str_replace(' ', '_', $normalized);
                $header_map[$normalized] = $idx;
            }

            // --- Process each data row ---
            foreach ($rows as $row_index => $data) {
                if ($stop_processing) break;

                // Skip completely empty rows
                if (empty(array_filter($data, fn($v) => $v !== null && $v !== ''))) continue;

                // Build associative row using header map
                $row = [];
                foreach ($insert_columns as $col) {
                    $val = null;
                    $normalized_col = strtoupper($col);
                    if (isset($header_map[$normalized_col])) {
                        $idx = $header_map[$normalized_col];
                        $val = $data[$idx] ?? null;
                    }
                    // Treat '-' and empty strings as null
                    $val = ($val === null || $val === '' || $val === '-') ? null : trim($val);
                    $row[$col] = $val;
                }

                // --- Clean numeric fields: remove commas and non‑numeric characters ---
                $numeric_fields = array_merge(
                    ['WEEK', 'YEAR', 'QUANTITY'],
                    array_filter($insert_columns, fn($c) => strpos($c, 'SHIFT') !== false)
                );
                foreach ($numeric_fields as $field) {
                    if (isset($row[$field]) && $row[$field] !== null) {
                        // Keep only digits, minus sign, and decimal point
                        $cleaned = preg_replace('/[^0-9.-]/', '', $row[$field]);
                        $row[$field] = $cleaned;
                    }
                }

                // --- Convert date columns to YYYY-MM-DD ---
                foreach (['OPERATING_DAYS_START', 'OPERATING_DAYS_END'] as $date_col) {
                    $val = $row[$date_col];
                    if ($val !== null) {
                        if (is_numeric($val)) {
                            // Excel serial date
                            try {
                                $dateObj = ExcelDate::excelToDateTimeObject($val);
                                $val = $dateObj->format('Y-m-d');
                            } catch (Exception $e) {
                                $val = null;
                            }
                        } else {
                            // String date – attempt to parse
                            $timestamp = strtotime($val);
                            $val = ($timestamp !== false) ? date('Y-m-d', $timestamp) : null;
                        }
                    }
                    $row[$date_col] = $val;
                }

                // --- Duplicate check (unique key: TEAM, WEEK, MONTH, YEAR, LINE, SKU_CODE) ---
                $check_sql = "SELECT id FROM `$table` WHERE TEAM = ? AND WEEK = ? AND MONTH = ? AND YEAR = ? AND LINE = ? AND SKU_CODE = ?";
                $check_stmt = $conn->prepare($check_sql);
                $check_stmt->bind_param(
                    'sisiss',
                    $row['TEAM'],
                    $row['WEEK'],
                    $row['MONTH'],
                    $row['YEAR'],
                    $row['LINE'],
                    $row['SKU_CODE']
                );
                $check_stmt->execute();
                $check_result = $check_stmt->get_result();

                if ($check_result && $check_result->num_rows > 0) {
                    $duplicate_rows[] = $data;
                    $duplicate_count++;
                    continue;
                }

                // --- Prepare INSERT statement ---
                $placeholders = [];
                foreach ($insert_columns as $col) {
                    // For date columns, use NULLIF to avoid '0000-00-00'
                    $placeholders[] = in_array($col, ['OPERATING_DAYS_START', 'OPERATING_DAYS_END'])
                        ? "NULLIF(?, '')"
                        : '?';
                }
                $columns = implode('`, `', $insert_columns);
                $sql = "INSERT INTO `$table` (`$columns`) VALUES (" . implode(', ', $placeholders) . ')';
                $stmt = $conn->prepare($sql);
                if (!$stmt) throw new Exception("Prepare failed: " . $conn->error);

                // --- Bind parameters ---
                $types = '';
                $params = [];
                foreach ($insert_columns as $col) {
                    $val = $row[$col];
                    if (in_array($col, $numeric_fields)) {
                        $types .= 'i';
                        $params[] = is_numeric($val) ? (int)$val : 0;
                    } else {
                        $types .= 's';
                        $params[] = ($val === null) ? '' : $val;
                    }
                }
                $stmt->bind_param($types, ...$params);
                if ($stmt->execute()) $row_count++;
                $stmt->close();
            }

            // --- Build result message ---
            if (!$stop_processing) {
                if ($row_count > 0) $message = "✅ $row_count row(s) imported successfully.";
                if ($duplicate_count > 0) $message .= " ⚠️ $duplicate_count duplicate row(s) skipped.";
                if ($row_count === 0 && $duplicate_count === 0) $message = "ℹ️ No new rows were imported.";
                if ($row_count > 0) {
                    log_action('import', $table, null, "Imported $row_count rows from " . htmlspecialchars($_FILES['csv_file']['name']));
                }
            }
        } catch (Exception $e) {
            $message = "❌ Error: " . $e->getMessage();
        }
    }
}

// --- HTML output ---
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Import Production Records</title>
    <link rel="icon" href="images/pioneer_icon.png" type="image/png">
    <link rel="stylesheet" href="css/mainpage.css">
    <link rel="stylesheet" href="css/import_data.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
<div class="page-bg">
        <?php include __DIR__ . '/templates/loader.php'; ?>
    <header class="header">
        <h1><img src="images/pioneerlogo.png" alt="Logo" style="height:1.2em; vertical-align:middle; margin-right:8px;">Import Production Record</h1>
            <form id="logoutForm" method="post" action="logout.php" style="display:none;">
        <input type="hidden" name="logout" value="1">
    </form>
    <button type="button" class="logout-btn" onclick="openLogoutModal()">Logout</button>
    </header>

    <nav class="navbar user-welcome">
            <span><i class="fa fa-user-circle"></i> Welcome, <?php echo htmlspecialchars($_SESSION['user']); ?> &nbsp;|&nbsp; <i class="fa fa-shield"></i> Admin</span>
    </nav>

<div class="wrapper">
    <!-- Sidebar visible for all users, sticky class for future CSS -->
    <aside class="sidebar sticky-sidebar">
        <ul>
                <li><a href="mainpage.php"><i class="fa fa-tachometer"></i>Dashboard Page</a></li>
                <li><a href="add_edit.php"><i class="fa fa-table"></i> Manage Production Records</a></li>
                <li><a href="manage_report.php"><i class="fa fa-file-text-o"></i> Line Records & LIPAS VOLPAS</a></li>
            <?php if ($_SESSION['role'] === 'admin'): ?>
                <li class="admin-section-label"><span>Admin Access</span></li>
<li>
    <a href="manage_users.php">
        <i class="fa fa-users"></i> User Management
        <?php if ($pendingUsersCount > 0): ?>
            <span class="mu-nav-badge"><?php echo $pendingUsersCount; ?></span>
        <?php endif; ?>
    </a>
</li>
                <li class="active"><a href="import_data.php"><i class="fa fa-upload"></i> Import Records</a></li>
                <li><a href="audit_log.php"><i class="fa fa-history"></i> Audit Trail</a></li>
            <?php endif; ?>
        </ul>
    </aside>

        <main class="main-content">
            <h2>Upload CSV or Excel File</h2>

            <div class="form-container">
                <form method="post" enctype="multipart/form-data">
                    <div class="form-group">
                        <label for="table">Select Target Table</label>
                        <select name="table" id="table" required>
                            <option value="">-- Choose a table --</option>
                            <option value="a_summary_line">Team A Summary Line</option>
                            <option value="b_summary_line">Team B Summary Line</option>
                            <option value="c_summary_line">Team C Summary Line</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label for="csv_file">Choose File (CSV or Excel)</label>
                        <input type="file" name="csv_file" id="csv_file" accept=".csv,.xls,.xlsx" required>
                        <small>Columns expected: TEAM, WEEK, MONTH, YEAR, LINE, SKU_CODE, SKU_DESCRIPTION, QUANTITY, UOM, OPERATING_DAYS_START, OPERATING_DAYS_END, plus 21 shift columns. Extra columns are ignored.</small>
                    </div>

                    <div class="form-actions">
                        <button type="submit" name="upload" class="btn btn-primary">Import Data</button>
                    </div>
                </form>

                <?php if (!empty($message)): ?>
                    <div class="message <?php echo (strpos($message, '✅') !== false) ? 'success' : 'error'; ?>">
                        <?php echo htmlspecialchars($message); ?>
                    </div>
                <?php endif; ?>
            </div>

            <?php if (!empty($duplicate_rows)): ?>
                <h3 class="duplicate-title">Duplicate Rows Skipped</h3>
                <div class="table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
<?php foreach ($header as $col): ?>
    <th><?php echo htmlspecialchars($col ?? ''); ?></th>
<?php endforeach; ?>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($duplicate_rows as $dup): ?>
                                <tr>
                                    <?php foreach ($dup as $cell): ?>
                                        <td><?php echo htmlspecialchars($cell ?? ''); ?></td>
                                    <?php endforeach; ?>
                                </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            <?php endif; ?>
        </main>
    </div>

    <footer class="footer">
        <p>&copy; <?php echo date('Y'); ?> Production Monitoring System</p>
    </footer>
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
function openLogoutModal() {
    document.getElementById('logoutModal').style.display = 'flex';
}
function closeLogoutModal() {
    document.getElementById('logoutModal').style.display = 'none';
}
function confirmLogout() {
    document.getElementById('logoutForm').submit();
}
document.getElementById('logoutModal').addEventListener('click', function(e) {
    if (e.target === this) closeLogoutModal();
});
</script>
</body>
</html>