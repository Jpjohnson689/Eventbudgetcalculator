import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import { prisma } from '../lib/prisma.js';

export const knowledgeRouter = Router();

knowledgeRouter.post('/upload', async (req, res) => {
  const { agentId, filename, mimeType, content } = req.body;
  const text = String(content || '');

  const file = await prisma.knowledgeFile.create({
    data: {
      agentId,
      filename,
      mimeType,
      sizeBytes: Buffer.byteLength(text)
    }
  });

  const chunks = chunkText(text, 500);
  await prisma.$executeRawUnsafe(`
    INSERT INTO "KnowledgeChunk" ("id", "knowledgeFileId", "chunkIndex", "textContent", "embedding")
    VALUES ${chunks.map((_, idx) => `('${randomUUID()}', '${file.id}', ${idx}, $${idx + 1}, array_fill(0::float4, ARRAY[1536])::vector)`).join(',')}
  `, ...chunks);

  res.status(201).json({ fileId: file.id, chunkCount: chunks.length });
});

function chunkText(content: string, size: number) {
  const chunks: string[] = [];
  for (let i = 0; i < content.length; i += size) {
    chunks.push(content.slice(i, i + size));
  }
  return chunks.length ? chunks : [''];
}
