<?php
// MVC: Controller handles requests and coordinates Model/View
require_once 'models/Product.php';

class ProductController {
    private $productModel;
    
    public function __construct($db) {
        $this->productModel = new Product($db);
    }
    
    // Display all products (Web UI)
    public function index() {
        $products = $this->productModel->findAll();
        // Load view
        require_once 'views/products.php';
    }
    
    // Add product (from form submission)
    public function store() {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $success = $this->productModel->save($_POST);
            
            if ($success) {
                header('Location: /product-manager/?success=Product added');
            } else {
                header('Location: /product-manager/?error=Failed to add product');
            }
        }
    }
    
    // Update product
    public function update($id) {
        if ($_SERVER['REQUEST_METHOD'] === 'POST') {
            $success = $this->productModel->save($_POST, $id);
            
            if ($success) {
                header('Location: /product-manager/?success=Product updated');
            } else {
                header('Location: /product-manager/?error=Update failed');
            }
        }
    }
    
    // Delete product
    public function delete($id) {
        $success = $this->productModel->delete($id);
        header('Content-Type: application/json');
        echo json_encode(['success' => $success]);
    }
    
    // REST API METHODS
    
    // GET /api/products - List all products (REST)
    public function apiIndex() {
        $products = $this->productModel->findAll();
        $this->jsonResponse($products);
    }
    
    // GET /api/products/{id} - Get single product (REST)
    public function apiShow($id) {
        $product = $this->productModel->findById($id);
        if ($product) {
            $this->jsonResponse($product);
        } else {
            $this->jsonResponse(['error' => 'Product not found'], 404);
        }
    }
    
    // POST /api/products - Create product (REST)
    public function apiStore() {
        $data = json_decode(file_get_contents('php://input'), true);
        $success = $this->productModel->save($data);
        
        if ($success) {
            $this->jsonResponse(['message' => 'Product created', 'id' => $this->productModel->db->lastInsertId()], 201);
        } else {
            $this->jsonResponse(['error' => 'Creation failed'], 500);
        }
    }
    
    // PUT /api/products/{id} - Update product (REST)
    public function apiUpdate($id) {
        $data = json_decode(file_get_contents('php://input'), true);
        $success = $this->productModel->save($data, $id);
        
        if ($success) {
            $this->jsonResponse(['message' => 'Product updated']);
        } else {
            $this->jsonResponse(['error' => 'Update failed'], 500);
        }
    }
    
    // DELETE /api/products/{id} - Delete product (REST)
    public function apiDelete($id) {
        $success = $this->productModel->delete($id);
        
        if ($success) {
            $this->jsonResponse(['message' => 'Product deleted']);
        } else {
            $this->jsonResponse(['error' => 'Delete failed'], 500);
        }
    }
    
    // Helper: Send JSON response
    private function jsonResponse($data, $statusCode = 200) {
        http_response_code($statusCode);
        header('Content-Type: application/json');
        echo json_encode($data);
        exit;
    }
}
?>