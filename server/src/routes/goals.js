import { Router } from 'express';
import { run, all, get } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const goals = await all(`
      SELECT g.*,
        COALESCE((SELECT SUM(duration_seconds) FROM sessions WHERE goal_id = g.id), 0) AS tracked_seconds,
        (SELECT COUNT(*) FROM milestones WHERE goal_id = g.id) AS milestone_count,
        (SELECT COUNT(*) FROM milestones WHERE goal_id = g.id AND completed = 1) AS milestone_done
      FROM goals g WHERE g.user_id = ? ORDER BY g.created_at DESC
    `, [req.user.id]);
    res.json(goals);
  } catch (e) { next(e); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const goal = await get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!goal) return res.status(404).json({ error: 'Not found' });
    const milestones = await all('SELECT * FROM milestones WHERE goal_id = ? ORDER BY due_date', [req.params.id]);
    const sessions = await all('SELECT * FROM sessions WHERE goal_id = ? ORDER BY started_at DESC LIMIT 20', [req.params.id]);
    res.json({ ...goal, milestones, sessions });
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { title, description, target_hours, start_date, end_date } = req.body;
    if (!title || !start_date || !end_date) return res.status(400).json({ error: 'Missing fields' });
    const goal = await get(
      `INSERT INTO goals (user_id, title, description, target_hours, start_date, end_date)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING *`,
      [req.user.id, title, description || '', target_hours || 0, start_date, end_date]
    );
    res.status(201).json(goal);
  } catch (e) { next(e); }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const goal = await get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!goal) return res.status(404).json({ error: 'Not found' });
    const { title, description, target_hours, start_date, end_date, status } = req.body;
    const updated = await get(`UPDATE goals SET
      title = COALESCE(?, title),
      description = COALESCE(?, description),
      target_hours = COALESCE(?, target_hours),
      start_date = COALESCE(?, start_date),
      end_date = COALESCE(?, end_date),
      status = COALESCE(?, status)
      WHERE id = ? AND user_id = ? RETURNING *`,
      [title ?? null, description ?? null, target_hours ?? null, start_date ?? null,
       end_date ?? null, status ?? null, req.params.id, req.user.id]
    );
    res.json(updated);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const goal = await get('SELECT * FROM goals WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!goal) return res.status(404).json({ error: 'Not found' });
    // Meilensteine und Einheiten räumt Postgres per CASCADE selbst weg
    await run('DELETE FROM goals WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
