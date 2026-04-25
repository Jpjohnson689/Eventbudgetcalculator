import { Router } from 'express';
import { RunStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { executeRun } from '../services/orchestrator.js';
import { runQueue } from '../services/runQueue.js';

export const executeRouter = Router();

executeRouter.post('/sync', async (req, res) => {
  const agent = await prisma.agent.findUnique({ where: { apiKey: req.header('x-agent-api-key') } });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const session = await ensureSession(agent.id, agent.clientId, req.body.sessionId);
  const run = await prisma.run.create({
    data: {
      agentId: agent.id,
      sessionId: session.id,
      prompt: req.body.prompt,
      status: RunStatus.QUEUED
    }
  });

  const output = await executeRun({ runId: run.id, agent, sessionId: session.id, prompt: req.body.prompt });
  res.json({ ...output, sessionId: session.id });
});

executeRouter.post('/async', async (req, res) => {
  const agent = await prisma.agent.findUnique({ where: { apiKey: req.header('x-agent-api-key') } });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const session = await ensureSession(agent.id, agent.clientId, req.body.sessionId);
  const run = await prisma.run.create({
    data: {
      agentId: agent.id,
      sessionId: session.id,
      prompt: req.body.prompt,
      status: RunStatus.QUEUED
    }
  });

  await runQueue.add('execute', { runId: run.id });
  res.status(202).json({ runId: run.id, sessionId: session.id, status: run.status });
});

executeRouter.get('/runs/:id', async (req, res) => {
  const run = await prisma.run.findUnique({ where: { id: req.params.id } });
  if (!run) return res.status(404).json({ error: 'Run not found' });
  res.json(run);
});

async function ensureSession(agentId: string, clientId: string, sessionId?: string) {
  if (sessionId) {
    const existing = await prisma.session.findUnique({ where: { id: sessionId } });
    if (existing && existing.expiresAt > new Date()) {
      return existing;
    }
  }

  return prisma.session.create({
    data: {
      agentId,
      clientId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    }
  });
}
