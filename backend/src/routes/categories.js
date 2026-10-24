const router = require('express').Router();
const { auth } = require('../middleware/auth');
const Category = require('../models/Category');
router.use(auth);
router.get('/', async (req, res) => res.json(await Category.find({ user: req.user.id }).sort({ type: 1, name: 1 })));
router.post('/', async (req, res) => {
  try { res.status(201).json(await Category.create({ ...req.body, user: req.user.id })); }
  catch (e) { res.status(400).json({ message: 'Category already exists' }); }
});
router.delete('/:id', async (req, res) => { await Category.findOneAndDelete({ _id: req.params.id, user: req.user.id }); res.json({ message: 'Deleted' }); });
module.exports = router;
