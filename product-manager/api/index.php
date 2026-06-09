<?php
// REST API endpoint
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json");

require_once '../config/database.php';
require_once '../controllers/ProductController.php';

$database = new Database();
$db = $database->getConnection();
$controller = new ProductController($db);

$action = $_GET['action'] ?? '';
$id = $_GET['id'] ?? null;

// REST routing
switch ($action) {
    case 'list':
        $controller->apiIndex();
        break;
    case 'get':
        if ($id) $controller->apiShow($id);
        else $controller->jsonResponse(['error' => 'ID required'], 400);
        break;
    case 'create':
        $controller->apiStore();
        break;
    case 'update':
        if ($id) $controller->apiUpdate($id);
        else $controller->jsonResponse(['error' => 'ID required'], 400);
        break;
    case 'delete':
        if ($id) $controller->apiDelete($id);
        else $controller->jsonResponse(['error' => 'ID required'], 400);
        break;
    default:
        echo json_encode([
            'message' => 'REST API is running',
            'endpoints' => [
                'GET /api/index.php?action=list' => 'Get all products',
                'GET /api/index.php?action=get&id={id}' => 'Get single product',
                'POST /api/index.php?action=create' => 'Create product',
                'PUT /api/index.php?action=update&id={id}' => 'Update product',
                'DELETE /api/index.php?action=delete&id={id}' => 'Delete product'
            ]
        ]);
}
?>