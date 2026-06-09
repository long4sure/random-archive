// API Integration: Frontend calling REST API
const API_BASE = 'http://localhost:3000/api';

// Load all products on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
});

// REST API Integration: GET all products
async function loadProducts() {
    try {
        const response = await fetch(`${API_BASE}/products`);
        const result = await response.json();
        
        if (result.success) {
            displayProducts(result.data);
            updateStats(result.data);
        } else {
            showError('Failed to load products');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showError('Network error. Is the server running?');
    }
}

// Display products using Bootstrap cards
function displayProducts(products) {
    const grid = document.getElementById('productsGrid');
    
    if (products.length === 0) {
        grid.innerHTML = `
            <div class="col-12">
                <div class="alert alert-info text-center">
                    <i class="fas fa-info-circle"></i> No products found
                </div>
            </div>
        `;
        return;
    }
    
    grid.innerHTML = products.map(product => `
        <div class="col-md-4 col-lg-3 mb-4">
            <div class="card product-card h-100 ${product.stock < 5 ? 'low-stock' : ''}">
                <div class="card-body">
                    <h5 class="card-title">${escapeHtml(product.name)}</h5>
                    <p class="card-text text-muted small">${escapeHtml(product.description || 'No description')}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <span class="h4 text-primary">$${parseFloat(product.price).toFixed(2)}</span>
                        <span class="badge ${product.stock > 0 ? 'bg-success' : 'bg-danger'}">
                            Stock: ${product.stock}
                        </span>
                    </div>
                </div>
                <div class="card-footer bg-transparent">
                    <button class="btn btn-sm btn-warning me-2" onclick="editProduct(${product.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(${product.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Calculate and update stats cards (DATABASE OPTIMIZATION: Using aggregated data)
function updateStats(products) {
    const total = products.length;
    const lowStock = products.filter(p => p.stock < 5).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock), 0);
    const avgPrice = total > 0 ? products.reduce((sum, p) => sum + p.price, 0) / total : 0;
    
    document.getElementById('totalProducts').textContent = total;
    document.getElementById('lowStockCount').textContent = lowStock;
    document.getElementById('totalValue').textContent = `$${totalValue.toFixed(2)}`;
    document.getElementById('avgPrice').textContent = `$${avgPrice.toFixed(2)}`;
}

// REST API Integration: POST create product
async function addProduct() {
    const product = {
        name: document.getElementById('add_name').value,
        description: document.getElementById('add_description').value,
        price: parseFloat(document.getElementById('add_price').value),
        stock: parseInt(document.getElementById('add_stock').value)
    };
    
    if (!product.name || !product.price) {
        alert('Name and price are required');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/products`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        
        const result = await response.json();
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('addModal')).hide();
            document.getElementById('addForm').reset();
            loadProducts();
            showSuccess('Product added successfully');
        } else {
            showError(result.error);
        }
    } catch (error) {
        console.error('Error adding product:', error);
        showError('Failed to add product');
    }
}

// REST API Integration: PUT update product
async function updateProduct() {
    const id = document.getElementById('edit_id').value;
    const product = {
        name: document.getElementById('edit_name').value,
        description: document.getElementById('edit_description').value,
        price: parseFloat(document.getElementById('edit_price').value),
        stock: parseInt(document.getElementById('edit_stock').value)
    };
    
    try {
        const response = await fetch(`${API_BASE}/products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(product)
        });
        
        const result = await response.json();
        
        if (result.success) {
            bootstrap.Modal.getInstance(document.getElementById('editModal')).hide();
            loadProducts();
            showSuccess('Product updated successfully');
        } else {
            showError(result.error);
        }
    } catch (error) {
        console.error('Error updating product:', error);
        showError('Failed to update product');
    }
}

// REST API Integration: DELETE product
async function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        try {
            const response = await fetch(`${API_BASE}/products/${id}`, {
                method: 'DELETE'
            });
            
            const result = await response.json();
            
            if (result.success) {
                loadProducts();
                showSuccess('Product deleted successfully');
            } else {
                showError(result.error);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            showError('Failed to delete product');
        }
    }
}

// REST API Integration: Search with query parameter
async function searchProducts() {
    const query = document.getElementById('searchInput').value;
    
    if (!query.trim()) {
        loadProducts();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`);
        const result = await response.json();
        
        if (result.success) {
            displayProducts(result.data);
        } else {
            showError(result.error);
        }
    } catch (error) {
        console.error('Error searching:', error);
        showError('Search failed');
    }
}

// Edit product - fetch and populate modal
async function editProduct(id) {
    try {
        const response = await fetch(`${API_BASE}/products/${id}`);
        const result = await response.json();
        
        if (result.success) {
            const product = result.data;
            document.getElementById('edit_id').value = product.id;
            document.getElementById('edit_name').value = product.name;
            document.getElementById('edit_description').value = product.description || '';
            document.getElementById('edit_price').value = product.price;
            document.getElementById('edit_stock').value = product.stock;
            
            new bootstrap.Modal(document.getElementById('editModal')).show();
        } else {
            showError('Product not found');
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        showError('Failed to load product');
    }
}

// Test REST API
async function testAPI() {
    new bootstrap.Modal(document.getElementById('apiModal')).show();
}

async function callAPI(method, endpoint) {
    const responseDiv = document.getElementById('apiResponse');
    responseDiv.textContent = 'Loading...';
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`);
        const data = await response.json();
        responseDiv.textContent = JSON.stringify(data, null, 2);
    } catch (error) {
        responseDiv.textContent = `Error: ${error.message}`;
    }
}

async function testSearchAPI() {
    await callAPI('GET', '/products/search?q=lap');
}

// Helper functions
function showSuccess(message) {
    // Could implement toast notifications here
    alert('✅ ' + message);
}

function showError(message) {
    alert('❌ ' + message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}