import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const metricsRouter = Router();

metricsRouter.get('/costs', async (req, res) => {
  const clientId = req.query.clientId as string;
  const totals = await prisma.costLog.groupBy({
    by: ['clientId'],
    where: clientId ? { clientId } : undefined,
    _sum: { amountUsd: true, inputTokens: true, outputTokens: true }
  });
  res.json(totals);
});
