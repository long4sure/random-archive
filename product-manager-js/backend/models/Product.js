const Model = require('./Model');

class Product extends Model {
    constructor(db) {
        super(db, 'products');
    }
    
    // DATABASE OPTIMIZATION: Uses idx_price index
    async findByPriceRange(minPrice, maxPrice) {
        const query = `
            SELECT * FROM products 
            WHERE price BETWEEN ? AND ? 
            ORDER BY price
        `;
        return await this.db.execute(query, [minPrice, maxPrice]);
    }
    
    // Uses idx_name index for fast search
    async searchByName(keyword) {
        const query = `
            SELECT * FROM products 
            WHERE name LIKE ? 
            LIMIT 20
        `;
        return await this.db.execute(query, [`%${keyword}%`]);
    }
    
    // Get low stock products (optimization: uses idx_stock)
    async getLowStock(threshold = 5) {
        const query = `
            SELECT * FROM products 
            WHERE stock <= ? 
            ORDER BY stock ASC
        `;
        return await this.db.execute(query, [threshold]);
    }
    
    // Save with PREPARED STATEMENT (INSERT or UPDATE)
    async save(data, id = null) {
        if (id) {
            // UPDATE
            const query = `
                UPDATE products 
                SET name = ?, description = ?, price = ?, stock = ? 
                WHERE id = ?
            `;
            const result = await this.db.execute(query, [
                data.name,
                data.description || null,
                data.price,
                data.stock,
                id
            ]);
            return result.affectedRows > 0;
        } else {
            // INSERT
            const query = `
                INSERT INTO products (name, description, price, stock) 
                VALUES (?, ?, ?, ?)
            `;
            const result = await this.db.execute(query, [
                data.name,
                data.description || null,
                data.price,
                data.stock
            ]);
            return result.insertId;
        }
    }
    
    // Pagination (DATABASE OPTIMIZATION: LIMIT + OFFSET)
    async getPaginated(page = 1, limit = 10) {
        const offset = (page - 1) * limit;
        const query = `
            SELECT * FROM products 
            ORDER BY id DESC 
            LIMIT ? OFFSET ?
        `;
        const products = await this.db.execute(query, [limit, offset]);
        const total = await this.count();
        
        return {
            products,
            total,
            page,
            totalPages: Math.ceil(total / limit)
        };
    }
}

module.exports = Product;