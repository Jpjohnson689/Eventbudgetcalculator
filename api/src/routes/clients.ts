import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const clientsRouter = Router();

clientsRouter.get('/', async (_req, res) => {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(clients);
});

clientsRouter.post('/', async (req, res) => {
  const client = await prisma.client.create({
    data: {
      name: req.body.name,
      slug: req.body.slug,
      usageCapUsd: req.body.usageCapUsd ?? 500
    }
  });
  res.status(201).json(client);
});
