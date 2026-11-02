
import type { FastifyInstance } from 'fastify';
import { authRoute } from './features/auth/auth.route.js';

export async function registerRoutes(
  app: FastifyInstance,
): Promise<void> {
  await app.register(authRoute, { prefix: '/api/v1/auth' });
}
