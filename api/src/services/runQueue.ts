import { Queue, Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { prisma } from '../lib/prisma.js';
import { logger } from '../lib/logger.js';
import { executeRun } from './orchestrator.js';

const connection = redis.duplicate();
export const runQueue = new Queue('agent-runs', { connection });

export function startRunWorker() {
  const worker = new Worker('agent-runs', async (job) => {
    const { runId } = job.data as { runId: string };
    const run = await prisma.run.findUnique({ where: { id: runId }, include: { agent: true } });
    if (!run) return;

    await executeRun({
      runId,
      sessionId: run.sessionId,
      agent: run.agent,
      prompt: run.prompt
    });
  }, { connection });

  worker.on('failed', async (job, err) => {
    logger.error({ err, runId: job?.data?.runId }, 'run worker failed');
    if (job?.data?.runId) {
      await prisma.run.update({
        where: { id: job.data.runId },
        data: { status: 'FAILED', error: err.message, completedAt: new Date() }
      });
    }
  });

  return worker;
}
