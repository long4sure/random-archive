// OOP: Database class with encapsulation
const mysql = require('mysql2');

class Database {
    constructor() {
        this.pool = mysql.createPool({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'product_manager',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            enableKeepAlive: true,
            keepAliveInitialDelay: 0
        }).promise();
    }
    
    // Get connection pool (optimized for performance)
    getConnection() {
        return this.pool;
    }
    
    // PREPARED STATEMENT wrapper (prevents SQL injection)
    async execute(query, params = []) {
        try {
            const [rows] = await this.pool.execute(query, params);
            return rows;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }
    
    // Simple query (for non-parameterized queries)
    async query(query) {
        try {
            const [rows] = await this.pool.query(query);
            return rows;
        } catch (error) {
            console.error('Database error:', error);
            throw error;
        }
    }
}

module.exports = Database;