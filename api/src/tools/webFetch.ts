import { ToolDefinition } from './types.js';

export const webFetchTool: ToolDefinition<{ url: string }> = {
  name: 'webFetch',
  async execute(input) {
    const response = await fetch(input.url);
    const body = await response.text();
    return {
      status: response.status,
      body: body.slice(0, 4000)
    };
  }
};
