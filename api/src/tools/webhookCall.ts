import { ToolDefinition } from './types.js';

export const webhookCallTool: ToolDefinition<{ url: string; method?: string; body?: unknown }> = {
  name: 'webhookCall',
  async execute(input) {
    const response = await fetch(input.url, {
      method: input.method || 'POST',
      headers: { 'content-type': 'application/json' },
      body: input.body ? JSON.stringify(input.body) : undefined
    });

    return {
      status: response.status,
      body: await response.text()
    };
  }
};
