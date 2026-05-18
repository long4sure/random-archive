const router = require('express').Router();
const supabase = require('../lib/supabase');

router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('user_id', req.user.id)
    .order('date', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

router.post('/', async (req, res) => {
  const { description, date, amount, category, supplier, status } = req.body;
  if (!description || !amount) return res.status(400).json({ error: 'Description and amount required' });
  const { data, error } = await supabase
    .from('expenses')
    .insert({ user_id: req.user.id, description, date: date || new Date().toISOString().slice(0,10), amount, category, supplier, status: status || 'Paid' })
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data);
});

router.put('/:id', async (req, res) => {
  const { description, date, amount, category, supplier, status } = req.body;
  const { data, error } = await supabase
    .from('expenses')
    .update({ description, date, amount, category, supplier, status, updated_at: new Date().toISOString() })
    .eq('id', req.params.id)
    .eq('user_id', req.user.id)
    .select()
    .single();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

router.delete('/:id', async (req, res) => {
  const { error } = await supabase
    .from('expenses')
    .delete()
    .eq('id', req.params.id)
    .eq('user_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

module.exports = router;
