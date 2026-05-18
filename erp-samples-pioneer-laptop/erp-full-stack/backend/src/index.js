require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const auth = require('./middleware/auth');

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));

// Public routes
app.use('/api/auth', require('./routes/auth'));

// Protected routes
app.use('/api/dashboard', auth, require('./routes/dashboard'));
app.use('/api/inventory', auth, require('./routes/inventory'));
app.use('/api/expenses', auth, require('./routes/expenses'));
app.use('/api/contacts', auth, require('./routes/contacts'));

app.get('/health', (_, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`BizlERP API running on port ${PORT}`));
