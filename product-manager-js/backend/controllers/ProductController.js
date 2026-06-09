// MVC: Controller handles HTTP requests and coordinates Model/View
class ProductController {
    constructor(productModel) {
        this.productModel = productModel;
    }
    
    // Helper for JSON responses
    jsonResponse(res, data, statusCode = 200) {
        res.status(statusCode).json(data);
    }
    
    // REST API: GET /api/products
    async getAll(req, res) {
        try {
            const products = await this.productModel.findAll();
            this.jsonResponse(res, {
                success: true,
                count: products.length,
                data: products
            });
        } catch (error) {
            this.jsonResponse(res, { success: false, error: error.message }, 500);
        }
    }
    
    // REST API: GET /api/products/:id
    async getOne(req, res) {
        try {
            const product = await this.productModel.findById(req.params.id);
            if (!product) {
                return this.jsonResponse(res, { success: false, error: 'Product not found' }, 404);
            }
            this.jsonResponse(res, { success: true, data: product });
        } catch (error) {
            this.jsonResponse(res, { success: false, error: error.message }, 500);
        }
    }
    
    // REST API: POST /api/products
    async create(req, res) {
        try {
            const { name, description, price, stock } = req.body;
            
            // Validation
            if (!name || !price) {
                return this.jsonResponse(res, { 
                    success: false, 
                    error: 'Name and price are required' 
                }, 400);
            }
            
            const id = await this.productModel.save({ name, description, price, stock });
            this.jsonResponse(res, { 
                success: true, 
                message: 'Product created successfully',
                id: id 
            }, 201);
        } catch (error) {
            this.jsonResponse(res, { success: false, error: error.message }, 500);
        }
    }
    
    // REST API: PUT /api/products/:id
    async update(req, res) {
        try {
            const { name, description, price, stock } = req.body;
            const success = await this.productModel.save(
                { name, description, price, stock }, 
                req.params.id
            );
            
            if (!success) {
                return this.jsonResponse(res, { success: false, error: 'Product not found' }, 404);
            }
            
            this.jsonResponse(res, { 
                success: true, 
                message: 'Product updated successfully' 
            });
        } catch (error) {
            this.jsonResponse(res, { success: false, error: error.message }, 500);
        }
    }
    
    // REST API: DELETE /api/products/:id
    async delete(req, res) {
        try {
            const success = await this.productModel.delete(req.params.id);
            if (!success) {
                return this.jsonResponse(res, { success: false, error: 'Product not found' }, 404);
            }
            this.jsonResponse(res, { 
                success: true, 
                message: 'Product deleted successfully' 
            });
        } catch (error) {
            this.jsonResponse(res, { success: false, error: error.message }, 500);
        }
    }
    
    // Additional optimized endpoints
    async search(req, res) {
        try {
            const { q } = req.query;
            if (!q) {
                return this.jsonResponse(res, { success: false, error: 'Search query required' }, 400);
            }
            const products = await this.productModel.searchByName(q);
            this.jsonResponse(res, { success: true, data: products });
        } catch (error) {
            this.jsonResponse(res, { success: false, error: error.message }, 500);
        }
    }
    
    async getLowStock(req, res) {
        try {
            const threshold = req.query.threshold || 5;
            const products = await this.productModel.getLowStock(threshold);
            this.jsonResponse(res, { success: true, data: products });
        } catch (error) {
            this.jsonResponse(res, { success: false, error: error.message }, 500);
        }
    }
    
    async getPaginated(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const result = await this.productModel.getPaginated(page, limit);
            this.jsonResponse(res, { success: true, ...result });
        } catch (error) {
            this.jsonResponse(res, { success: false, error: error.message }, 500);
        }
    }
}

module.exports = ProductController;