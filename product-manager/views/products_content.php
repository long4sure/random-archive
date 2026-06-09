<div class="row">
    <div class="col-md-4">
        <!-- Add Product Form -->
        <div class="card shadow-sm">
            <div class="card-header bg-primary text-white">
                <h4 class="mb-0"><i class="fas fa-plus"></i> Add New Product</h4>
            </div>
            <div class="card-body">
                <form method="POST" action="/product-manager/index.php?action=store">
                    <div class="mb-3">
                        <label class="form-label">Product Name</label>
                        <input type="text" name="name" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Description</label>
                        <textarea name="description" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Price ($)</label>
                        <input type="number" step="0.01" name="price" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Stock</label>
                        <input type="number" name="stock" class="form-control" required>
                    </div>
                    <button type="submit" class="btn btn-primary w-100">
                        <i class="fas fa-save"></i> Add Product
                    </button>
                </form>
            </div>
        </div>
        
        <!-- API Test Panel -->
        <div class="card shadow-sm mt-4">
            <div class="card-header bg-info text-white">
                <h5 class="mb-0"><i class="fas fa-code"></i> REST API Test</h5>
            </div>
            <div class="card-body">
                <button class="btn btn-sm btn-outline-info w-100 mb-2" onclick="testAPI()">
                    <i class="fas fa-database"></i> GET /api/products
                </button>
                <pre id="apiResult" class="bg-light p-2 mt-2" style="font-size: 12px;">Click button to test API</pre>
            </div>
        </div>
    </div>
    
    <div class="col-md-8">
        <!-- Products List -->
        <div class="card shadow-sm">
            <div class="card-header bg-success text-white">
                <h4 class="mb-0"><i class="fas fa-boxes"></i> Products List</h4>
            </div>
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Price</th>
                                <th>Stock</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <?php foreach ($products as $product): ?>
                            <tr>
                                <td><?= $product['id'] ?></td>
                                <td><?= htmlspecialchars($product['name']) ?></td>
                                <td><?= htmlspecialchars(substr($product['description'] ?? '', 0, 50)) ?></td>
                                <td>$<?= number_format($product['price'], 2) ?></td>
                                <td>
                                    <span class="badge <?= $product['stock'] > 0 ? 'bg-success' : 'bg-danger' ?>">
                                        <?= $product['stock'] ?>
                                    </span>
                                </td>
                                <td>
                                    <button class="btn btn-sm btn-warning" onclick="editProduct(<?= $product['id'] ?>)">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-sm btn-danger" onclick="deleteProduct(<?= $product['id'] ?>)">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                            <?php endforeach; ?>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Edit Product Modal (Bootstrap) -->
<div class="modal fade" id="editModal" tabindex="-1">
    <div class="modal-dialog">
        <div class="modal-content">
            <div class="modal-header bg-warning">
                <h5 class="modal-title"><i class="fas fa-edit"></i> Edit Product</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <form method="POST" id="editForm">
                <div class="modal-body">
                    <input type="hidden" id="edit_id" name="id">
                    <div class="mb-3">
                        <label>Product Name</label>
                        <input type="text" name="name" id="edit_name" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label>Description</label>
                        <textarea name="description" id="edit_description" class="form-control" rows="3"></textarea>
                    </div>
                    <div class="mb-3">
                        <label>Price ($)</label>
                        <input type="number" step="0.01" name="price" id="edit_price" class="form-control" required>
                    </div>
                    <div class="mb-3">
                        <label>Stock</label>
                        <input type="number" name="stock" id="edit_stock" class="form-control" required>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Update Product</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script>
// REST API Integration - Frontend calling the API
async function testAPI() {
    const resultDiv = document.getElementById('apiResult');
    resultDiv.innerHTML = 'Loading...';
    
    try {
        const response = await fetch('/product-manager/api/index.php?action=list');
        const data = await response.json();
        resultDiv.innerHTML = JSON.stringify(data, null, 2);
    } catch (error) {
        resultDiv.innerHTML = 'Error: ' + error.message;
    }
}

async function deleteProduct(id) {
    if (confirm('Are you sure?')) {
        const response = await fetch(`/product-manager/index.php?action=delete&id=${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        if (result.success) {
            location.reload();
        }
    }
}

function editProduct(id) {
    // Fetch product data via API
    fetch(`/product-manager/api/index.php?action=get&id=${id}`)
        .then(response => response.json())
        .then(product => {
            document.getElementById('edit_id').value = product.id;
            document.getElementById('edit_name').value = product.name;
            document.getElementById('edit_description').value = product.description;
            document.getElementById('edit_price').value = product.price;
            document.getElementById('edit_stock').value = product.stock;
            document.getElementById('editForm').action = `/product-manager/index.php?action=update&id=${id}`;
            
            const modal = new bootstrap.Modal(document.getElementById('editModal'));
            modal.show();
        });
}
</script>