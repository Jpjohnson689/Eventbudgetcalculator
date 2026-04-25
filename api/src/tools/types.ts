export interface ToolContext {
  clientId: string;
  agentId: string;
  sessionId: string;
}

export interface ToolDefinition<TInput = Record<string, unknown>> {
  name: string;
  execute: (input: TInput, context: ToolContext) => Promise<unknown>;
}
