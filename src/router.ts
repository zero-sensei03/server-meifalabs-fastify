
import type { FastifyInstance } from 'fastify';
import { authRoute } from './features/auth/auth.route.js';
import { categoryPublicRoute, categoryRoute } from './features/modules/category/category.route.js';
import { moduleRoute } from './features/modules/module.route.js';
import { userRoute } from './features/user/user.route.js';

export async function registerRoutes(
  app: FastifyInstance,
): Promise<void> {
  await app.register(authRoute, { prefix: '/api/v1/auth' });
  await app.register(categoryRoute, { prefix: '/api/v1/module-category' });
  await app.register(moduleRoute, { prefix: '/api/v1/modules' });
  await app.register(userRoute, { prefix: '/api/v1/users' });


  await app.register(categoryPublicRoute, { prefix: '/api/v1/public/module-category' });
}
