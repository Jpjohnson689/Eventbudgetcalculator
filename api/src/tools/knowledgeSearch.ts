import { prisma } from '../lib/prisma.js';
import { ToolDefinition } from './types.js';

export const knowledgeSearchTool: ToolDefinition<{ query: string }> = {
  name: 'knowledgeSearch',
  async execute(input, context) {
    const chunks = await prisma.$queryRaw<Array<{ textContent: string }>>`
      SELECT kc."textContent"
      FROM "KnowledgeChunk" kc
      JOIN "KnowledgeFile" kf ON kf.id = kc."knowledgeFileId"
      WHERE kf."agentId" = ${context.agentId}
      ORDER BY kc."chunkIndex" ASC
      LIMIT 5
    `;

    return {
      query: input.query,
      hits: chunks.map((chunk) => chunk.textContent)
    };
  }
};
