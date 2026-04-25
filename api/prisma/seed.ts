import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const client = await prisma.client.upsert({
    where: { slug: 'onebridge-internal' },
    update: {},
    create: { name: 'OneBridge Internal', slug: 'onebridge-internal' }
  });

  await prisma.agent.upsert({
    where: { apiKey: 'ob_internal_example_key' },
    update: {},
    create: {
      clientId: client.id,
      name: 'Onboarding Assistant',
      apiKey: 'ob_internal_example_key',
      systemPrompt: 'You are the default OneBridge onboarding assistant.',
      toolList: ['webFetch', 'knowledgeSearch', 'webhookCall']
    }
  });
}

main().finally(() => prisma.$disconnect());
