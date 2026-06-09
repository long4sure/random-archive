<?php
// MVC Front Controller - Routes all requests
require_once 'config/database.php';
require_once 'controllers/ProductController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new ProductController($db);

$action = $_GET['action'] ?? 'index';
$id = $_GET['id'] ?? null;

// Route to appropriate controller method
switch ($action) {
    case 'store':
        $controller->store();
        break;
    case 'update':
        if ($id) $controller->update($id);
        else $controller->index();
        break;
    case 'delete':
        if ($id) $controller->delete($id);
        break;
    case 'index':
    default:
        $controller->index();
        break;
}
?>