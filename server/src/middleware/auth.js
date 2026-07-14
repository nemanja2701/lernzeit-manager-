import jwt from 'jsonwebtoken';

// Fallback nur für lokal. Auf dem Server muss JWT_SECRET gesetzt sein.
export const JWT_SECRET = process.env.JWT_SECRET || 'lernzeit-manager-dev-secret-2026';

export function signToken(user) {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '30d' });
}

export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Nicht angemeldet' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.id, username: payload.username };
    next();
  } catch {
    return res.status(401).json({ error: 'Ungültiger oder abgelaufener Token' });
  }
}
