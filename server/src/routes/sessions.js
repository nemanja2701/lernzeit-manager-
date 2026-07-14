import { Router } from 'express';
import { run, all, get } from '../db/database.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    const sessions = await all(`
      SELECT s.*, g.title as goal_title
      FROM sessions s LEFT JOIN goals g ON s.goal_id = g.id
      WHERE s.user_id = ?
      ORDER BY s.started_at DESC LIMIT 50
    `, [req.user.id]);
    res.json(sessions);
  } catch (e) { next(e); }
});

router.post('/', async (req, res, next) => {
  try {
    const { goal_id, duration_seconds, note, date, started_at, ended_at } = req.body;
    if (!duration_seconds || duration_seconds < 1)
      return res.status(400).json({ error: 'duration_seconds required' });
    const now = new Date().toISOString();
    const session = await get(
      `INSERT INTO sessions (user_id, goal_id, duration_seconds, note, date, started_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      [req.user.id, goal_id || null, duration_seconds, note || '',
       date || now.split('T')[0], started_at || now, ended_at || now]
    );
    res.status(201).json(session);
  } catch (e) { next(e); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const s = await get('SELECT * FROM sessions WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!s) return res.status(404).json({ error: 'Not found' });
    await run('DELETE FROM sessions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (e) { next(e); }
});

router.get('/stats/summary', async (req, res, next) => {
  try {
    const uid = req.user.id;
    const t = await get('SELECT COALESCE(SUM(duration_seconds), 0)::int AS total FROM sessions WHERE user_id = ?', [uid]);
    const td = await get("SELECT COALESCE(SUM(duration_seconds), 0)::int AS total FROM sessions WHERE user_id = ? AND date::date = CURRENT_DATE", [uid]);
    const wk = await get("SELECT COALESCE(SUM(duration_seconds), 0)::int AS total FROM sessions WHERE user_id = ? AND date::date >= CURRENT_DATE - INTERVAL '6 days'", [uid]);
    const last7Days = await all(`
      SELECT date, COALESCE(SUM(duration_seconds), 0)::int as seconds
      FROM sessions WHERE user_id = ? AND date::date >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY date ORDER BY date
    `, [uid]);
    const byGoal = await all(`
      SELECT g.title, COALESCE(SUM(s.duration_seconds), 0)::int as seconds
      FROM sessions s JOIN goals g ON s.goal_id = g.id
      WHERE s.user_id = ?
      GROUP BY s.goal_id, g.title ORDER BY seconds DESC LIMIT 5
    `, [uid]);
    res.json({
      totalSeconds: t?.total || 0,
      todaySeconds: td?.total || 0,
      weekSeconds: wk?.total || 0,
      last7Days, byGoal
    });
  } catch (e) { next(e); }
});

export default router;
