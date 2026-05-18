const router = require('express').Router();
const supabase = require('../lib/supabase');

// GET /api/inventory
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('inventory')
    .select('*')
    .eq('user_id', req.user.id)
    .order('name');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST /api/inventory
router.post('/', async (req, res) => {
  const { name, category, stock, unit, min_stock, cost_per_unit } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { data, error } = await supabase
    .from('inventory')
    .insert({ user_id: req.user.id, name, category, stock: stock || 0, unit, min_stock: min_stock || 0, cost_per_unit: cost_per_unit || 0 })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

// PUT /api/inventory/:id
router.put('/:id', async (req, res) => {
  const { name, category, stock, unit, min_stock, cost_per_unit } = req.body;
  const { data, error } = await supabase
    .from('inventory')
    .update({ name, category, stock, unit, min_stock, cost_per_unit, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// DELETE /api/inventory/:id
router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('inventory')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
