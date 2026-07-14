import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { run, get } from '../db/database.js';
import { signToken, requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
    if (username.trim().length < 3)
      return res.status(400).json({ error: 'Benutzername muss mindestens 3 Zeichen haben' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen haben' });

    const existing = await get('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing) return res.status(409).json({ error: 'Benutzername ist bereits vergeben' });

    const hash = bcrypt.hashSync(password, 10);
    const user = await get(
      'INSERT INTO users (username, password_hash) VALUES (?, ?) RETURNING id, username',
      [username.trim(), hash]
    );
    res.status(201).json({ token: signToken(user), user });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password)
      return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });

    const user = await get('SELECT * FROM users WHERE username = ?', [username.trim()]);
    if (!user) return res.status(401).json({ error: 'Benutzername oder Passwort falsch' });

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) return res.status(401).json({ error: 'Benutzername oder Passwort falsch' });

    res.json({ token: signToken(user), user: { id: user.id, username: user.username } });
  } catch (e) { next(e); }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
