import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { adminAuth } from './middleware/auth.js';
import { logger } from './lib/logger.js';
import { agentsRouter } from './routes/agents.js';
import { clientsRouter } from './routes/clients.js';
import { executeRouter } from './routes/execute.js';
import { knowledgeRouter } from './routes/knowledge.js';
import { metricsRouter } from './routes/metrics.js';
import { sessionsRouter } from './routes/sessions.js';

export const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '3mb' }));
app.use(pinoHttp({ logger }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/admin/clients', adminAuth, clientsRouter);
app.use('/admin/agents', adminAuth, agentsRouter);
app.use('/admin/sessions', adminAuth, sessionsRouter);
app.use('/admin/knowledge', adminAuth, knowledgeRouter);
app.use('/admin/metrics', adminAuth, metricsRouter);
app.use('/v1/execute', executeRouter);
