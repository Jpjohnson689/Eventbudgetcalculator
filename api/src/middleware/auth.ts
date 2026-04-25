import { NextFunction, Request, Response } from 'express';

export function adminAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== (process.env.ADMIN_JWT || 'local-admin-token')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
}

export function agentApiKeyAuth(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-agent-api-key'];
  if (!apiKey || typeof apiKey !== 'string') {
    return res.status(401).json({ error: 'Missing x-agent-api-key' });
  }
  (req as Request & { agentApiKey: string }).agentApiKey = apiKey;
  return next();
}
