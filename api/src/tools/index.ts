import { knowledgeSearchTool } from './knowledgeSearch.js';
import { ToolDefinition } from './types.js';
import { webFetchTool } from './webFetch.js';
import { webhookCallTool } from './webhookCall.js';

const registry = new Map<string, ToolDefinition>([
  [webFetchTool.name, webFetchTool],
  [knowledgeSearchTool.name, knowledgeSearchTool],
  [webhookCallTool.name, webhookCallTool]
]);

export function getTool(name: string): ToolDefinition | undefined {
  return registry.get(name);
}
