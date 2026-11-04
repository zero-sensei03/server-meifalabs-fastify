
import type { FastifyReply, FastifyRequest } from 'fastify';
import { requireSession } from '../features/auth/session.service.js';

export interface AuthContext {
  user: {
    id: string;
    username: string;
    email: string | null;
    role: string;
    status: string;
  };
  session: {
    id: string;
    user_id: string;
    csrf_hash: string;
    expires_at: Date;
  };
}

declare module 'fastify' {
  interface FastifyRequest {
    auth: AuthContext | null;
  }
}

export function registerAuthMiddleware(app: import('fastify').FastifyInstance) {
  app.decorateRequest('auth', null);
}

export async function authMiddleware(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  const { user, session } = await requireSession(request);

  request.auth = {
    user,
    session,
  };
}
