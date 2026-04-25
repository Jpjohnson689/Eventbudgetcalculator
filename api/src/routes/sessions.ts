import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const sessionsRouter = Router();

sessionsRouter.post('/', async (req, res) => {
  const agent = await prisma.agent.findUnique({ where: { id: req.body.agentId } });
  if (!agent) return res.status(404).json({ error: 'Agent not found' });

  const session = await prisma.session.create({
    data: {
      agentId: agent.id,
      clientId: agent.clientId,
      externalRef: req.body.externalRef,
      expiresAt: new Date(Date.now() + agent.sessionExpiryDays * 24 * 60 * 60 * 1000)
    }
  });

  return res.status(201).json(session);
});

sessionsRouter.get('/:id/messages', async (req, res) => {
  const page = Number(req.query.page ?? 1);
  const pageSize = Number(req.query.pageSize ?? 50);
  const messages = await prisma.message.findMany({
    where: { sessionId: req.params.id },
    orderBy: { createdAt: 'asc' },
    skip: (page - 1) * pageSize,
    take: pageSize
  });
  res.json(messages);
});
