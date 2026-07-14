import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import 'dotenv/config';
import { initDb } from './db/database.js';
import authRouter from './routes/auth.js';
import goalsRouter from './routes/goals.js';
import sessionsRouter from './routes/sessions.js';
import planningRouter from './routes/planning.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(morgan('dev'));
app.use(express.json());

// muss VOR dem planningRouter stehen, der hängt an /api und schluckt sonst /api/health
app.get('/api/health', (_, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRouter);
app.use('/api/goals', goalsRouter);
app.use('/api/sessions', sessionsRouter);
app.use('/api', planningRouter);
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ error: err.message }); });

initDb().then(() => {
  app.listen(PORT, () => console.log(`✅ Lernzeit-Manager Server running on http://localhost:${PORT}`));
}).catch(err => { console.error('DB init failed:', err); process.exit(1); });
