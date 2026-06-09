CREATE DATABASE product_manager;
USE product_manager;

-- Optimized table structure
CREATE TABLE products (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- DATABASE OPTIMIZATION: Indexes on frequently queried columns
    INDEX idx_name (name),           -- For searching by name
    INDEX idx_price (price),         -- For sorting/filtering by price
    INDEX idx_created_at (created_at) -- For date range queries
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Sample data
INSERT INTO products (name, description, price, stock) VALUES
('Laptop', 'High-performance laptop', 999.99, 10),
('Mouse', 'Wireless mouse', 25.50, 50),
('Keyboard', 'Mechanical keyboard', 89.99, 30);