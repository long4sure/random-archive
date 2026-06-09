<?php
// OOP: Database class with encapsulation
class Database {
    private $host = "localhost";
    private $db_name = "product_manager";
    private $username = "root";
    private $password = "";
    private $conn;
    
    // Get database connection
    public function getConnection() {
        $this->conn = null;
        
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            
            // DATABASE OPTIMIZATION: Set charset for better performance
            $this->conn->exec("SET NAMES utf8mb4");
        } catch(PDOException $e) {
            echo "Connection error: " . $e->getMessage();
        }
        
        return $this->conn;
    }
}
?>