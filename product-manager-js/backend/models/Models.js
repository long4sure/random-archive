// OOP: Abstract base class with common CRUD operations
class Model {
    constructor(db, tableName, primaryKey = 'id') {
        this.db = db;
        this.table = tableName;
        this.primaryKey = primaryKey;
    }
    
    // Find all records
    async findAll() {
        const query = `SELECT * FROM ${this.table}`;
        return await this.db.query(query);
    }
    
    // Find by ID with PREPARED STATEMENT
    async findById(id) {
        const query = `SELECT * FROM ${this.table} WHERE ${this.primaryKey} = ?`;
        const results = await this.db.execute(query, [id]);
        return results[0] || null;
    }
    
    // Delete with PREPARED STATEMENT
    async delete(id) {
        const query = `DELETE FROM ${this.table} WHERE ${this.primaryKey} = ?`;
        const result = await this.db.execute(query, [id]);
        return result.affectedRows > 0;
    }
    
    // Count total records (optimization: COUNT(*) uses index)
    async count() {
        const query = `SELECT COUNT(*) as total FROM ${this.table}`;
        const result = await this.db.query(query);
        return result[0].total;
    }
}

module.exports = Model;