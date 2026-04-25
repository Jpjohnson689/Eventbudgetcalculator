import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const agentsRouter = Router();

agentsRouter.get('/', async (req, res) => {
  const clientId = req.query.clientId as string | undefined;
  const agents = await prisma.agent.findMany({
    where: clientId ? { clientId } : undefined,
    orderBy: { createdAt: 'desc' }
  });
  res.json(agents);
});

agentsRouter.post('/', async (req, res) => {
  const created = await prisma.agent.create({
    data: {
      clientId: req.body.clientId,
      name: req.body.name,
      apiKey: req.body.apiKey,
      systemPrompt: req.body.systemPrompt,
      model: req.body.model ?? 'claude-sonnet-4-6',
      temperature: req.body.temperature ?? 0.2,
      toolList: req.body.toolList ?? ['webFetch'],
      sessionExpiryDays: req.body.sessionExpiryDays ?? 7,
      rateLimitPerMinute: req.body.rateLimitPerMinute ?? 60,
      maxUsageUsd: req.body.maxUsageUsd ?? 100
    }
  });

  res.status(201).json(created);
});

agentsRouter.patch('/:id', async (req, res) => {
  const updated = await prisma.agent.update({ where: { id: req.params.id }, data: req.body });
  res.json(updated);
});
