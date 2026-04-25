import Anthropic from '@anthropic-ai/sdk';
import { Agent, Message, Prisma, RunStatus } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { getTool } from '../tools/index.js';

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

export async function executeRun(params: {
  runId: string;
  agent: Agent;
  sessionId: string;
  prompt: string;
}) {
  const start = Date.now();
  await prisma.run.update({ where: { id: params.runId }, data: { status: RunStatus.RUNNING } });

  const history = await prisma.message.findMany({
    where: { sessionId: params.sessionId },
    orderBy: { createdAt: 'asc' },
    take: 50
  });

  const truncated = slidingWindow(history, 12000);
  const toolTrace: Prisma.JsonArray = [];

  let assistantText = '';
  if (params.agent.toolList.includes('knowledgeSearch')) {
    const tool = getTool('knowledgeSearch');
    if (tool) {
      const t0 = Date.now();
      const response = await tool.execute({ query: params.prompt }, {
        clientId: params.agent.clientId,
        agentId: params.agent.id,
        sessionId: params.sessionId
      });
      toolTrace.push({ tool: 'knowledgeSearch', response, latencyMs: Date.now() - t0 });
    }
  }

  if (anthropic) {
    const result = await anthropic.messages.create({
      model: params.agent.model,
      max_tokens: 1024,
      temperature: params.agent.temperature,
      system: params.agent.systemPrompt,
      messages: [
        ...truncated.map((message) => ({ role: message.role as 'user' | 'assistant', content: message.content })),
        { role: 'user', content: params.prompt }
      ]
    });
    assistantText = result.content.map((c) => (c.type === 'text' ? c.text : '')).join(' ').trim();
  } else {
    assistantText = `Mock response for prompt: ${params.prompt}`;
  }

  const latencyMs = Date.now() - start;
  const inputTokens = roughTokenCount(params.prompt) + truncated.reduce((sum, item) => sum + item.tokenEstimate, 0);
  const outputTokens = roughTokenCount(assistantText);
  const amountUsd = (inputTokens * 0.000003) + (outputTokens * 0.000015);

  await prisma.$transaction([
    prisma.message.create({
      data: { sessionId: params.sessionId, role: 'user', content: params.prompt, tokenEstimate: roughTokenCount(params.prompt) }
    }),
    prisma.message.create({
      data: { sessionId: params.sessionId, role: 'assistant', content: assistantText, tokenEstimate: outputTokens }
    }),
    prisma.run.update({
      where: { id: params.runId },
      data: {
        status: RunStatus.SUCCEEDED,
        response: assistantText,
        latencyMs,
        completedAt: new Date(),
        toolTrace
      }
    }),
    prisma.costLog.create({
      data: {
        clientId: params.agent.clientId,
        agentId: params.agent.id,
        sessionId: params.sessionId,
        runId: params.runId,
        inputTokens,
        outputTokens,
        amountUsd,
        latencyMs
      }
    })
  ]);

  return { runId: params.runId, output: assistantText, latencyMs, amountUsd };
}

function slidingWindow(messages: Message[], tokenLimit: number) {
  const selected: Message[] = [];
  let total = 0;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    total += message.tokenEstimate;
    if (total > tokenLimit) break;
    selected.unshift(message);
  }
  return selected;
}

export function roughTokenCount(text: string) {
  return Math.ceil(text.length / 4);
}
