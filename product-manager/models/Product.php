<?php
require_once 'Model.php';

class Product extends Model {
    protected $table = 'products';
    
    public function __construct($db) {
        parent::__construct($db);
    }
    
    // DATABASE OPTIMIZATION: Specific query with index usage
    public function findByPriceRange($min, $max) {
        // Uses idx_price index for faster search
        $query = "SELECT * FROM {$this->table} 
                  WHERE price BETWEEN :min AND :max 
                  ORDER BY price";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':min' => $min, ':max' => $max]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Search with LIKE (uses idx_name index)
    public function searchByName($keyword) {
        $query = "SELECT * FROM {$this->table} 
                  WHERE name LIKE :keyword";
        $stmt = $this->db->prepare($query);
        $stmt->execute([':keyword' => "%$keyword%"]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }
    
    // Create or update product with prepared statements
    public function save($data, $id = null) {
        if ($id) {
            // UPDATE
            $query = "UPDATE {$this->table} 
                      SET name = :name, description = :description, 
                          price = :price, stock = :stock 
                      WHERE id = :id";
            $stmt = $this->db->prepare($query);
            return $stmt->execute([
                ':name' => $data['name'],
                ':description' => $data['description'],
                ':price' => $data['price'],
                ':stock' => $data['stock'],
                ':id' => $id
            ]);
        } else {
            // INSERT
            $query = "INSERT INTO {$this->table} (name, description, price, stock) 
                      VALUES (:name, :description, :price, :stock)";
            $stmt = $this->db->prepare($query);
            return $stmt->execute([
                ':name' => $data['name'],
                ':description' => $data['description'],
                ':price' => $data['price'],
                ':stock' => $data['stock']
            ]);
        }
    }
}
?>