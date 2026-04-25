CREATE EXTENSION IF NOT EXISTS vector;

CREATE TYPE "RunStatus" AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');

CREATE TABLE "Client" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "usageCapUsd" DOUBLE PRECISION NOT NULL DEFAULT 500,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Agent" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "name" TEXT NOT NULL,
  "apiKey" TEXT NOT NULL UNIQUE,
  "model" TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  "systemPrompt" TEXT NOT NULL,
  "temperature" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "toolList" TEXT[] NOT NULL,
  "sessionExpiryDays" INTEGER NOT NULL DEFAULT 7,
  "rateLimitPerMinute" INTEGER NOT NULL DEFAULT 60,
  "maxUsageUsd" DOUBLE PRECISION NOT NULL DEFAULT 100,
  "isActive" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "Session" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "agentId" TEXT NOT NULL REFERENCES "Agent"("id") ON DELETE CASCADE,
  "externalRef" TEXT,
  "expiresAt" TIMESTAMP NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Session_agentId_createdAt_idx" ON "Session"("agentId", "createdAt");

CREATE TABLE "Message" (
  "id" TEXT PRIMARY KEY,
  "sessionId" TEXT NOT NULL REFERENCES "Session"("id") ON DELETE CASCADE,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "tokenEstimate" INTEGER NOT NULL DEFAULT 0,
  "metadata" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "Message_sessionId_createdAt_idx" ON "Message"("sessionId", "createdAt");

CREATE TABLE "Run" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL REFERENCES "Agent"("id") ON DELETE CASCADE,
  "sessionId" TEXT NOT NULL REFERENCES "Session"("id") ON DELETE CASCADE,
  "status" "RunStatus" NOT NULL DEFAULT 'QUEUED',
  "prompt" TEXT NOT NULL,
  "response" TEXT,
  "error" TEXT,
  "latencyMs" INTEGER,
  "toolTrace" JSONB,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMP
);

CREATE TABLE "CostLog" (
  "id" TEXT PRIMARY KEY,
  "clientId" TEXT NOT NULL REFERENCES "Client"("id") ON DELETE CASCADE,
  "agentId" TEXT,
  "sessionId" TEXT,
  "runId" TEXT,
  "inputTokens" INTEGER NOT NULL,
  "outputTokens" INTEGER NOT NULL,
  "amountUsd" DOUBLE PRECISION NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "CostLog_clientId_createdAt_idx" ON "CostLog"("clientId", "createdAt");

CREATE TABLE "ToolCallTrace" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "toolName" TEXT NOT NULL,
  "request" JSONB NOT NULL,
  "response" JSONB NOT NULL,
  "latencyMs" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX "ToolCallTrace_runId_idx" ON "ToolCallTrace"("runId");

CREATE TABLE "KnowledgeFile" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL REFERENCES "Agent"("id") ON DELETE CASCADE,
  "filename" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "sizeBytes" INTEGER NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE "KnowledgeChunk" (
  "id" TEXT PRIMARY KEY,
  "knowledgeFileId" TEXT NOT NULL REFERENCES "KnowledgeFile"("id") ON DELETE CASCADE,
  "chunkIndex" INTEGER NOT NULL,
  "textContent" TEXT NOT NULL,
  "embedding" vector(1536),
  "metadata" JSONB
);
CREATE INDEX "KnowledgeChunk_knowledgeFileId_chunkIndex_idx" ON "KnowledgeChunk"("knowledgeFileId", "chunkIndex");

CREATE TABLE "AgentApiKeyUsage" (
  "id" TEXT PRIMARY KEY,
  "agentId" TEXT NOT NULL REFERENCES "Agent"("id") ON DELETE CASCADE,
  "apiKey" TEXT NOT NULL,
  "requests" INTEGER NOT NULL DEFAULT 0,
  "tokens" INTEGER NOT NULL DEFAULT 0,
  "costUsd" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "periodStart" TIMESTAMP NOT NULL DEFAULT NOW(),
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("agentId", "apiKey", "periodStart")
);
