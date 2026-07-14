import { Router } from 'express';
import { run, all, get } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

async function goalBelongsToUser(goalId, userId) {
  if (!goalId) return true;
  const g = await get('SELECT id FROM goals WHERE id = ? AND user_id = ?', [goalId, userId]);
  return !!g;
}

router.get('/milestones', async (req, res, next) => {
  try {
    res.json(await all(`
      SELECT m.*, g.title as goal_title FROM milestones m
      JOIN goals g ON m.goal_id = g.id
      WHERE g.user_id = ? ORDER BY m.due_date
    `, [req.user.id]));
  } catch (e) { next(e); }
});

router.post('/milestones', async (req, res, next) => {
  try {
    const { goal_id, title, due_date } = req.body;
    if (!goal_id || !title || !due_date) return res.status(400).json({ error: 'Missing fields' });
    if (!(await goalBelongsToUser(goal_id, req.user.id)))
      return res.status(403).json({ error: 'Kein Zugriff auf dieses Ziel' });
    const m = await get(
      'INSERT INTO milestones (goal_id, title, due_date) VALUES (?, ?, ?) RETURNING *',
      [goal_id, title, due_date]
    );
    res.status(201).json(m);
  } catch (e) { next(e); }
});

router.patch('/milestones/:id', async (req, res, next) => {
  try {
    const m = await get(
      'SELECT m.* FROM milestones m JOIN goals g ON m.goal_id = g.id WHERE m.id = ? AND g.user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!m) return res.status(404).json({ error: 'Not found' });
    const { completed, title, due_date } = req.body;
    const completedAt = completed ? new Date().toISOString() : null;
    const upd = await get(
      `UPDATE milestones SET
         completed = COALESCE(?, completed),
         completed_at = COALESCE(?::timestamp, completed_at),
         title = COALESCE(?, title),
         due_date = COALESCE(?, due_date)
       WHERE id = ? RETURNING *`,
      [completed !== undefined ? (completed ? 1 : 0) : null, completedAt,
       title ?? null, due_date ?? null, req.params.id]
    );
    res.json(upd);
  } catch (e) { next(e); }
});

router.delete('/milestones/:id', async (req, res, next) => {
  try {
    const m = await get(
      'SELECT m.* FROM milestones m JOIN goals g ON m.goal_id = g.id WHERE m.id = ? AND g.user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!m) return res.status(404).json({ error: 'Not found' });
    await run('DELETE FROM milestones WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.get('/plan', async (req, res, next) => {
  try {
    const { month } = req.query;
    const rows = month
      ? await all(`SELECT p.*, g.title as goal_title FROM plan_entries p
                   LEFT JOIN goals g ON p.goal_id = g.id
                   WHERE p.user_id = ? AND to_char(p.planned_date::date, 'YYYY-MM') = ?
                   ORDER BY p.planned_date`, [req.user.id, month])
      : await all(`SELECT p.*, g.title as goal_title FROM plan_entries p
                   LEFT JOIN goals g ON p.goal_id = g.id
                   WHERE p.user_id = ? ORDER BY p.planned_date DESC LIMIT 100`, [req.user.id]);
    res.json(rows);
  } catch (e) { next(e); }
});

router.post('/plan', async (req, res, next) => {
  try {
    const { goal_id, title, planned_date, planned_hours } = req.body;
    if (!title || !planned_date) return res.status(400).json({ error: 'Missing fields' });
    if (!(await goalBelongsToUser(goal_id, req.user.id)))
      return res.status(403).json({ error: 'Kein Zugriff auf dieses Ziel' });
    const e = await get(
      `INSERT INTO plan_entries (user_id, goal_id, title, planned_date, planned_hours)
       VALUES (?, ?, ?, ?, ?) RETURNING *`,
      [req.user.id, goal_id || null, title, planned_date, planned_hours || 1]
    );
    res.status(201).json(e);
  } catch (e) { next(e); }
});

router.patch('/plan/:id', async (req, res, next) => {
  try {
    const e = await get('SELECT * FROM plan_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!e) return res.status(404).json({ error: 'Not found' });
    const { completed, title, planned_hours } = req.body;
    const upd = await get(
      `UPDATE plan_entries SET
         completed = COALESCE(?, completed),
         title = COALESCE(?, title),
         planned_hours = COALESCE(?, planned_hours)
       WHERE id = ? RETURNING *`,
      [completed !== undefined ? (completed ? 1 : 0) : null, title ?? null,
       planned_hours ?? null, req.params.id]
    );
    res.json(upd);
  } catch (e) { next(e); }
});

router.delete('/plan/:id', async (req, res, next) => {
  try {
    const e = await get('SELECT * FROM plan_entries WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!e) return res.status(404).json({ error: 'Not found' });
    await run('DELETE FROM plan_entries WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

export default router;
