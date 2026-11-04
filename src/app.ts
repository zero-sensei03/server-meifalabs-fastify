import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import cookie from '@fastify/cookie';

import { env } from './config/env.js';
import { healthRoute } from './routes/health.route.js';
import { mapError } from './utils/error-handler.js';
import { errorResponse } from './utils/response.js';
import { registerRoutes } from './router.js';

import prismaPlugin from './plugins/prisma.plugin.js';
import { registerAuthMiddleware } from './middlewares/auth.middleware.js';

export async function buildApp() {
  const app = Fastify({
    ajv: {
      customOptions: {
        allErrors: true,
      },
    },
    logger: {
      level: env.logLevel,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers["set-cookie"]',
          'req.body.password',
          'req.body.currentPassword',
          'req.body.newPassword',
          'req.body.token',
          'req.body.accessToken',
          'req.body.refreshToken',
        ],
        censor: '[REDACTED]',
      },
    },
    trustProxy: false,
    bodyLimit: 1_048_576,
    requestTimeout: 15_000,
    connectionTimeout: 10_000,
    keepAliveTimeout: 5_000,
    maxRequestsPerSocket: 1_000,
  });

  app.setNotFoundHandler(async (request, reply) => {
    return reply.code(404).send(
      errorResponse(
        'The requested endpoint was not found.',
        'ROUTE_NOT_FOUND',
        request.id,
      ),
    );
  });

  app.setErrorHandler((error, request, reply) => {
    const mapped = mapError(error);

    if (mapped.statusCode >= 500) {
      request.log.error({ err: error }, 'Request failed');
    }

    if (mapped.errors) {
      return reply.code(mapped.statusCode).send({
        success: false,
        message: mapped.message,
        errors: mapped.errors,
        request_id: request.id,
      });
    }

    return reply.code(mapped.statusCode).send(
      errorResponse(
        mapped.message,
        mapped.code,
        request.id,
      ),
    );
  });

  await app.register(helmet);

  await app.register(cors, {
    origin: env.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  await app.register(rateLimit, {
    global: true,
    max: env.rateLimitMax,
    timeWindow: env.rateLimitWindow,
  });

  await app.register(cookie);

  await app.register(prismaPlugin);

  registerAuthMiddleware(app);
  await app.register(healthRoute);
  await registerRoutes(app)

  return app;
}
