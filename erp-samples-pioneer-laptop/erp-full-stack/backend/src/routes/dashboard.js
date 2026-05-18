const router = require('express').Router();
const supabase = require('../lib/supabase');

router.get('/', async (req, res) => {
  const uid = req.user.id;

  const [invRes, expRes, conRes] = await Promise.all([
    supabase.from('inventory').select('stock, min_stock, cost_per_unit, name, unit').eq('user_id', uid),
    supabase.from('expenses').select('amount, category, status, date').eq('user_id', uid),
    supabase.from('contacts').select('id, type').eq('user_id', uid),
  ]);

  const inventory = invRes.data || [];
  const expenses = expRes.data || [];
  const contacts = conRes.data || [];

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const pendingAmount = expenses.filter(e => e.status === 'Pending' || e.status === 'Overdue').reduce((s, e) => s + Number(e.amount), 0);
  const lowStockItems = inventory.filter(i => Number(i.stock) <= Number(i.min_stock));
  const inventoryValue = inventory.reduce((s, i) => s + Number(i.stock) * Number(i.cost_per_unit), 0);

  const expenseByCategory = {};
  expenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + Number(e.amount); });

  const recentExpenses = [...expenses]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 5);

  res.json({
    metrics: {
      totalExpenses,
      pendingAmount,
      lowStockCount: lowStockItems.length,
      inventoryValue,
      totalContacts: contacts.length,
      supplierCount: contacts.filter(c => c.type === 'Supplier').length,
      customerCount: contacts.filter(c => c.type === 'Customer').length,
    },
    lowStockItems,
    recentExpenses,
    expenseByCategory,
  });
});

module.exports = router;
