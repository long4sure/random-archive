<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Manage Users – Production Monitoring System</title>
    <link rel="icon" href="images/p_icon.png" type="image/png">
    <link rel="stylesheet" href="css/mainpage.css">
    <link rel="stylesheet" href="css/manage_report.css">
    <link rel="stylesheet" href="css/manage_users.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.7.0/css/font-awesome.min.css">
</head>
<body>
<div class="page-bg">
    <?php include __DIR__ . '/../templates/loader.php'; ?>

<header class="header">
    <h1><img src="images/pioneerlogo.png" alt="Logo" style="height:1.2em; vertical-align:middle; margin-right:8px;">User Management</h1>
    <form id="logoutForm" method="post" action="logout.php" style="display:none;">
        <input type="hidden" name="logout" value="1">
    </form>
    <button type="button" class="logout-btn" onclick="openLogoutModal()">Logout</button>
</header>

<nav class="navbar user-welcome">
    <span><i class="fa fa-user-circle"></i> Welcome, <?php echo htmlspecialchars($_SESSION['user']); ?> &nbsp;|&nbsp; <i class="fa fa-shield"></i> System Admin</span>
</nav>

<nav class="navbar">
    <div class="dropdown">
        <button class="dropbtn"><i class="fa fa-users"></i> User Management <i class="fa fa-caret-down"></i></button>
        <div class="dropdown-content">
            <a href="#" onclick="ManageUsers.showApprovalView(); return false;"><i class="fa fa-check-circle"></i> Check Approval</a>
            <a href="#" onclick="ManageUsers.showAllUsersView(); return false;"><i class="fa fa-list"></i> Check User Management</a>
            <a href="#" onclick="ManageUsers.showAddUserForm(); return false;"><i class="fa fa-user-plus"></i> Add New User</a>
        </div>
    </div>
</nav>

<div class="wrapper">
    <aside class="sidebar sticky-sidebar">
        <ul>
                <li><a href="mainpage.php"><i class="fa fa-tachometer"></i>Dashboard Page</a></li>
                <li><a href="add_edit.php"><i class="fa fa-table"></i> Manage Production Records</a></li>
                <li><a href="manage_report.php"><i class="fa fa-file-text-o"></i> Line Report Records & LIPAS VOLPAS</a></li>
            <?php if ($_SESSION['role'] === 'system_admin'): ?>
                <li class="admin-section-label"><span>Admin Access</span></li>
                <li class="active">
                    <a href="manage_users.php">
                        <i class="fa fa-users"></i> User Management
                        <?php if ($pendingUsersCount > 0): ?>
                            <span class="mu-nav-badge"><?php echo $pendingUsersCount; ?></span>
                        <?php endif; ?>
                    </a>
                </li>
                <li><a href="import_data.php"><i class="fa fa-upload"></i> Import Records</a></li>
                <li><a href="audit_log.php"><i class="fa fa-history"></i> Audit Trail</a></li>
            <?php endif; ?>
        </ul>
    </aside>

    <main class="main-content">
        <?php
        // Fix 8: Define role maps at template scope — used in both approval and all-users tables
        $roleIcons  = ['system_admin' => 'fa-shield', 'admin' => 'fa-user-secret', 'data_entry' => 'fa-pencil', 'viewer' => 'fa-eye'];
        $roleLabels = ['system_admin' => 'Sys Admin', 'admin' => 'Admin', 'data_entry' => 'Data Entry', 'viewer' => 'Viewer'];
        ?>

        <!-- ===== ADD USER FORM (hidden by default) ===== -->
        <div id="addUserForm" style="display:none;">
            <div class="page-header">
                <h2><i class="fa fa-user-plus"></i> Add New User</h2>
            </div>

            <?php if ($success): ?>
            <div class="mu-alert mu-alert-success"><i class="fa fa-check-circle"></i> <?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>
            <?php if ($error): ?>
            <div class="mu-alert mu-alert-error"><i class="fa fa-exclamation-circle"></i> <?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <div class="filter-card">
                <form method="post">
                    <input type="hidden" name="action" value="add">
                    <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">
                    <div class="form-row">
                        <div class="form-group"><label>First Name *</label><input type="text" name="first_name" required></div>
                        <div class="form-group"><label>Last Name *</label><input type="text" name="last_name" required></div>
                    </div>
                    <div class="form-row">
                        <div class="form-group"><label>Username *</label><input type="text" name="new_username" required></div>
                        <div class="form-group">
                            <label>Password *</label>
                            <div class="mu-pw-wrap">
                                <input type="password" name="new_password" id="addPw" required minlength="6">
                                <button type="button" class="mu-btn-eye" onclick="togglePw('addPw', this)"><i class="fa fa-eye"></i></button>
                            </div>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Role *</label>
                            <!-- Fix 7b: admin is now a proper role option -->
                            <select name="new_role" id="addUserRole" required onchange="ManageUsers.onAddRoleChange(this)">
                                <option value="">-- Select Role --</option>
                                <option value="system_admin">System Administrator</option>
                                <option value="admin">Admin (Full Data Access)</option>
                                <option value="data_entry">Data Entry (Restricted)</option>
                                <option value="viewer">Viewer</option>
                            </select>
                        </div>
                        <!-- Fix 7b: Team and Line only shown for data_entry role -->
                        <div class="form-group" id="addTeamGroup" style="display:none;">
                            <label>Team *</label>
                            <select name="new_team" id="addUserTeam" onchange="ManageUsers.onAddTeamChange(this)">
                                <option value="">-- Select Team --</option>
                                <option value="A">Team A</option>
                                <option value="B">Team B</option>
                                <option value="C">Team C</option>
                            </select>
                        </div>
                        <div class="form-group" id="addLineGroup" style="display:none;">
                            <label>Line *</label>
                            <select name="new_line" id="addUserLine">
                                <option value="">-- Select Line --</option>
                            </select>
                        </div>
                    </div>
                    <div class="filter-actions">
                        <button type="submit" class="btn-apply"><i class="fa fa-plus-circle"></i> Create User</button>
                        <button type="button" class="btn-outline" onclick="ManageUsers.showApprovalView()">Cancel</button>
                    </div>
                </form>
            </div>
        </div>

        <!-- ===== APPROVAL VIEW ===== -->
        <div id="approvalView">
            <div class="page-header">
                <h2><i class="fa fa-check-circle"></i> User Approval Management</h2>
                <p class="text-muted">Review and approve user registration requests.</p>
            </div>

            <?php if ($success): ?>
            <div class="mu-alert mu-alert-success"><i class="fa fa-check-circle"></i> <?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>
            <?php if ($error): ?>
            <div class="mu-alert mu-alert-error"><i class="fa fa-exclamation-circle"></i> <?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <!-- Overview Cards -->
            <div class="totals-lipas-volpas" style="margin-bottom: 25px;">
                <h3><i class="fa fa-bar-chart"></i> Approval Overview</h3>
                <div class="totals-grid">
                    <div class="total-card mu-card-pending">
                        <div class="total-label"><i class="fa fa-clock-o"></i> Pending Approval</div>
                        <div class="total-value"><?php echo $statusCount['pending']; ?></div>
                    </div>
                    <div class="total-card mu-card-dataentry">
                        <div class="total-label"><i class="fa fa-check"></i> Approved</div>
                        <div class="total-value"><?php echo $statusCount['approved']; ?></div>
                    </div>
                    <div class="total-card" style="background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%); color: #991b1b;">
                        <div class="total-label"><i class="fa fa-times"></i> Rejected</div>
                        <div class="total-value"><?php echo $statusCount['rejected']; ?></div>
                    </div>
                    <div class="total-card">
                        <div class="total-label"><i class="fa fa-users"></i> Total Users</div>
                        <div class="total-value"><?php echo count($users); ?></div>
                    </div>
                </div>
            </div>

            <!-- Approval Tabs -->
            <div class="approval-tabs">
                <button class="approval-tab active" onclick="ManageUsers.switchApprovalTab(event, 'pending')">
                    <i class="fa fa-clock-o"></i> Pending <span class="badge"><?php echo $statusCount['pending']; ?></span>
                </button>
                <button class="approval-tab" onclick="ManageUsers.switchApprovalTab(event, 'approved')">
                    <i class="fa fa-check"></i> Approved <span class="badge"><?php echo $statusCount['approved']; ?></span>
                </button>
                <button class="approval-tab" onclick="ManageUsers.switchApprovalTab(event, 'rejected')">
                    <i class="fa fa-times"></i> Rejected <span class="badge"><?php echo $statusCount['rejected']; ?></span>
                </button>
                <button class="approval-tab" onclick="ManageUsers.switchApprovalTab(event, 'all')">
                    <i class="fa fa-list"></i> All <span class="badge"><?php echo count($users); ?></span>
                </button>
            </div>

            <?php
            $tabs = ['pending' => [], 'approved' => [], 'rejected' => [], 'all' => $users];
            foreach ($users as $u) {
                $tabs[$u['approval_status']][] = $u;
            }
            foreach (['pending','approved','rejected','all'] as $tab):
                $tabUsers = $tabs[$tab];
                $active   = ($tab === 'pending') ? ' active' : '';
            ?>
            <div id="tab-<?php echo $tab; ?>" class="approval-section<?php echo $active; ?>">
                <?php if (count($tabUsers) > 0): ?>
                <div class="user-table-wrapper">
                    <table class="user-table">
                        <thead>
                            <tr>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($tabUsers as $u): ?>
                            <tr id="user-row-<?php echo $u['id']; ?>">
                                <td><?php echo htmlspecialchars($u['first_name']); ?></td>
                                <td><?php echo htmlspecialchars($u['last_name']); ?></td>
                                <td><strong class="mu-username"><?php echo htmlspecialchars($u['username']); ?></strong></td>
                                <td>
                                    <?php
                                    $roleIcons  = ['system_admin' => 'fa-shield', 'admin' => 'fa-user-secret', 'data_entry' => 'fa-pencil', 'viewer' => 'fa-eye'];
                                    $roleLabels = ['system_admin' => 'Sys Admin', 'admin' => 'Admin', 'data_entry' => 'Data Entry', 'viewer' => 'Viewer'];
                                    ?>
                                    <span class="mu-role-badge mu-role-<?php echo $u['role']; ?>">
                                        <i class="fa <?php echo $roleIcons[$u['role']] ?? 'fa-user'; ?>"></i>
                                        <?php echo $roleLabels[$u['role']] ?? ucfirst($u['role']); ?>
                                    </span>
                                </td>
                                <td><span class="status-badge status-<?php echo $u['approval_status']; ?>"><?php echo ucfirst($u['approval_status']); ?></span></td>
                                <td><?php echo $u['created_at'] ? date('M d, Y', strtotime($u['created_at'])) : '—'; ?></td>
                                <td>
                                    <?php if ($tab === 'pending' || $tab === 'rejected'): ?>
                                    <button class="mu-btn-action" style="background:#10b981; color:white;" onclick="ManageUsers.openApproveModal(<?php echo $u['id']; ?>,'<?php echo htmlspecialchars($u['username'], ENT_QUOTES); ?>')"><i class="fa fa-check"></i> Approve</button>
                                    <?php endif; ?>
                                    <?php if ($tab === 'pending'): ?>
                                    <button class="mu-btn-action mu-btn-delete" onclick="ManageUsers.openRejectModal(<?php echo $u['id']; ?>,'<?php echo htmlspecialchars($u['username'], ENT_QUOTES); ?>')"><i class="fa fa-times"></i> Reject</button>
                                    <?php endif; ?>
                                    <?php if ($tab !== 'pending'): ?>
                                    <button class="mu-btn-action mu-btn-edit" onclick="ManageUsers.openEditModal(<?php echo $u['id']; ?>,'<?php echo htmlspecialchars($u['username'], ENT_QUOTES); ?>','<?php echo $u['role']; ?>','<?php echo htmlspecialchars($u['team'] ?? '', ENT_QUOTES); ?>','<?php echo htmlspecialchars($u['line'] ?? '', ENT_QUOTES); ?>')"><i class="fa fa-pencil"></i> Edit</button>
                                    <button class="mu-btn-action mu-btn-delete" onclick="ManageUsers.openDeleteModal(<?php echo $u['id']; ?>,'<?php echo htmlspecialchars($u['username'], ENT_QUOTES); ?>')"><i class="fa fa-trash"></i> Delete</button>
                                    <?php endif; ?>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
                <?php else: ?>
                <div class="empty-state"><i class="fa fa-users"></i><h3>No Users</h3></div>
                <?php endif; ?>
            </div>
            <?php endforeach; ?>
        </div>

        <!-- ===== ALL USERS VIEW ===== -->
        <div id="allUsersView" style="display: none;">
            <div class="page-header">
                <h2>User Management</h2>
                <p class="text-muted">Manage user accounts and roles.</p>
            </div>

            <?php if ($success): ?>
            <div class="mu-alert mu-alert-success"><i class="fa fa-check-circle"></i> <?php echo htmlspecialchars($success); ?></div>
            <?php endif; ?>
            <?php if ($error): ?>
            <div class="mu-alert mu-alert-error"><i class="fa fa-exclamation-circle"></i> <?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>

            <div class="user-section">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
                    <h3 style="color:#1e293b; font-size:16px; margin:0;"><i class="fa fa-list"></i> All Users</h3>
                    <div style="position:relative;">
                        <input type="text" id="userSearch" placeholder="Search by username..." onkeyup="filterTable()"
                            style="padding:8px 12px 8px 36px; border:1px solid #cbd5e1; border-radius:6px; font-size:14px; width:260px;">
                        <i class="fa fa-search" style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8;"></i>
                    </div>
                </div>

                <div class="user-table-wrapper">
                    <table class="user-table" id="userTable">
                        <thead>
                            <tr>
                                <th>First Name</th>
                                <th>Last Name</th>
                                <th>Username</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Created</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($users as $u): ?>
                            <tr>
                                <td><?php echo htmlspecialchars($u['first_name']); ?></td>
                                <td><?php echo htmlspecialchars($u['last_name']); ?></td>
                                <td><strong class="mu-username"><?php echo htmlspecialchars($u['username']); ?></strong></td>
                                <td><span class="mu-role-badge mu-role-<?php echo $u['role']; ?>"><i class="fa <?php echo $roleIcons[$u['role']] ?? 'fa-user'; ?>"></i> <?php echo $roleLabels[$u['role']] ?? ucfirst($u['role']); ?></span></td>
                                <td><span class="status-badge status-<?php echo $u['approval_status']; ?>"><?php echo ucfirst($u['approval_status']); ?></span></td>
                                <td><?php echo $u['created_at'] ? date('M d, Y', strtotime($u['created_at'])) : '—'; ?></td>
                                <td>
                                    <button class="mu-btn-action mu-btn-edit" onclick="ManageUsers.openEditModal(<?php echo $u['id']; ?>,'<?php echo htmlspecialchars($u['username'], ENT_QUOTES); ?>','<?php echo $u['role']; ?>','<?php echo htmlspecialchars($u['team'] ?? '', ENT_QUOTES); ?>','<?php echo htmlspecialchars($u['line'] ?? '', ENT_QUOTES); ?>')"><i class="fa fa-pencil"></i> Edit</button>
                                    <button class="mu-btn-action mu-btn-delete" onclick="ManageUsers.openDeleteModal(<?php echo $u['id']; ?>,'<?php echo htmlspecialchars($u['username'], ENT_QUOTES); ?>')"><i class="fa fa-trash"></i> Delete</button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </main>
</div>

<!-- ═══════════════════════════════════════════════
     Fix 4: Edit Modal (was missing — caused JS null errors)
═══════════════════════════════════════════════ -->
<div class="modal-overlay" id="editModal">
    <div class="modal" style="display:block; position:relative; top:auto; left:auto; transform:none; margin:60px auto;">
        <div class="mu-modal-header">
            <h3><i class="fa fa-pencil"></i> Edit User</h3>
            <button class="mu-modal-close" onclick="ManageUsers.closeEditModal()"><i class="fa fa-times"></i></button>
        </div>
        <form method="post" style="padding:24px;">
            <input type="hidden" name="action"      value="edit">
            <input type="hidden" name="csrf_token"  value="<?php echo htmlspecialchars($csrfToken); ?>">
            <input type="hidden" name="edit_id"     id="editUserId">
            <div class="form-row">
                <div class="form-group">
                    <label>Username</label>
                    <input type="text" id="editUsername" class="input-readonly" readonly>
                </div>
                <div class="form-group">
                    <label>Role *</label>
                    <select name="edit_role" id="editRole" onchange="ManageUsers.onEditRoleChange(this)">
                        <option value="system_admin">System Administrator</option>
                        <option value="admin">Admin (Full Data Access)</option>
                        <option value="data_entry">Data Entry (Restricted)</option>
                        <option value="viewer">Viewer</option>
                    </select>
                </div>
            </div>
            <!-- Fix 6: Team and Line fields added to edit modal -->
            <div class="form-row" id="editTeamRow" style="display:none;">
                <div class="form-group">
                    <label>Team *</label>
                    <select name="edit_team" id="editTeam" onchange="ManageUsers.onEditTeamChange(this)">
                        <option value="">-- Select Team --</option>
                        <option value="A">Team A</option>
                        <option value="B">Team B</option>
                        <option value="C">Team C</option>
                    </select>
                </div>
                <div class="form-group" id="editLineGroup">
                    <label>Line *</label>
                    <select name="edit_line" id="editLine">
                        <option value="">-- Select Line --</option>
                    </select>
                </div>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>New Password <span class="optional">(leave blank to keep current)</span></label>
                    <div class="mu-pw-wrap">
                        <input type="password" name="edit_password" id="editPw" minlength="6" placeholder="Leave blank to keep current">
                        <button type="button" class="mu-btn-eye" onclick="togglePw('editPw', this)"><i class="fa fa-eye"></i></button>
                    </div>
                </div>
            </div>
            <div class="delete-modal-actions">
                <button type="button" class="btn-outline" onclick="ManageUsers.closeEditModal()"><i class="fa fa-times"></i> Cancel</button>
                <button type="submit" class="btn-apply"><i class="fa fa-save"></i> Save Changes</button>
            </div>
        </form>
    </div>
</div>

<!-- ═══════════════════════════════════════════════
     Fix 4: Delete Modal (was missing)
═══════════════════════════════════════════════ -->
<div class="delete-modal-overlay" id="deleteModal">
    <div class="delete-modal-box">
        <form method="post">
            <input type="hidden" name="action"     value="delete">
            <input type="hidden" name="csrf_token" value="<?php echo htmlspecialchars($csrfToken); ?>">
            <input type="hidden" name="user_id"    id="deleteUserId">
            <h3><i class="fa fa-trash" style="color:#ef4444;"></i> Delete User</h3>
            <p>Are you sure you want to permanently delete <strong id="deleteUsername"></strong>? This cannot be undone.</p>
            <div class="delete-modal-actions">
                <button type="button" class="btn-outline" onclick="ManageUsers.closeDeleteModal()"><i class="fa fa-times"></i> Cancel</button>
                <button type="submit" class="mu-btn-danger"><i class="fa fa-trash"></i> Delete</button>
            </div>
        </form>
    </div>
</div>

<!-- ═══════════════════════════════════════════════
     Fix 10: Approve Modal (replaces confirm() dialog)
═══════════════════════════════════════════════ -->
<div class="delete-modal-overlay" id="approveModal">
    <div class="delete-modal-box">
        <h3><i class="fa fa-check-circle" style="color:#10b981;"></i> Approve User</h3>
        <p>Approve access for <strong id="approveUsername"></strong>? They will be able to log in immediately.</p>
        <div class="delete-modal-actions">
            <button type="button" class="btn-outline" onclick="ManageUsers.closeApproveModal()"><i class="fa fa-times"></i> Cancel</button>
            <button type="button" class="mu-btn-approve" onclick="ManageUsers.confirmApprove()"><i class="fa fa-check"></i> Approve</button>
        </div>
    </div>
</div>

<!-- ═══════════════════════════════════════════════
     Fix 10: Reject Modal (replaces confirm() dialog)
═══════════════════════════════════════════════ -->
<div class="delete-modal-overlay" id="rejectModal">
    <div class="delete-modal-box">
        <h3><i class="fa fa-times-circle" style="color:#ef4444;"></i> Reject User</h3>
        <p>Reject registration for <strong id="rejectUsername"></strong>? They will not be able to log in.</p>
        <div class="delete-modal-actions">
            <button type="button" class="btn-outline" onclick="ManageUsers.closeRejectModal()"><i class="fa fa-times"></i> Cancel</button>
            <button type="button" class="mu-btn-danger" onclick="ManageUsers.confirmReject()"><i class="fa fa-ban"></i> Reject</button>
        </div>
    </div>
</div>

<!-- Logout Modal -->
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

<footer class="footer"><p>&copy; <?php echo date('Y'); ?> Production Monitoring System</p></footer>
</div>

<!-- Pass data to JS -->
<script>
var csrfToken       = <?php echo json_encode($csrfToken); ?>;
var linesByTeamEdit = <?php echo $linesJSON; ?>;
</script>
<script src="js/manage_users.js"></script>
</body>
</html>