const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./config/database');
const Product = require('./models/Product');
const ProductController = require('./controllers/ProductController');

// Initialize
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

// Database connection (OOP)
const db = new Database();
const productModel = new Product(db);
const productController = new ProductController(productModel);

// REST API Routes
app.get('/api/products', (req, res) => productController.getAll(req, res));
app.get('/api/products/:id', (req, res) => productController.getOne(req, res));
app.post('/api/products', (req, res) => productController.create(req, res));
app.put('/api/products/:id', (req, res) => productController.update(req, res));
app.delete('/api/products/:id', (req, res) => productController.delete(req, res));

// Additional optimized endpoints
app.get('/api/products/search', (req, res) => productController.search(req, res));
app.get('/api/products/low-stock', (req, res) => productController.getLowStock(req, res));
app.get('/api/products/paginated', (req, res) => productController.getPaginated(req, res));

// API root
app.get('/api', (req, res) => {
    res.json({
        name: 'Product Manager API',
        version: '1.0.0',
        endpoints: {
            'GET /api/products': 'Get all products',
            'GET /api/products/:id': 'Get single product',
            'POST /api/products': 'Create product',
            'PUT /api/products/:id': 'Update product',
            'DELETE /api/products/:id': 'Delete product',
            'GET /api/products/search?q={keyword}': 'Search products',
            'GET /api/products/low-stock?threshold={number}': 'Get low stock products',
            'GET /api/products/paginated?page=1&limit=10': 'Paginated products'
        }
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📦 API: http://localhost:${PORT}/api`);
    console.log(`🎨 Frontend: http://localhost:${PORT}`);
});