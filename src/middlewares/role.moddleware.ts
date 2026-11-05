import { FastifyReply, FastifyRequest } from "fastify";
import { forbidden, unauthorized } from "../utils/errors.js";

export function checkRole(allowedRoles: string[]) {
  return async (request: FastifyRequest, _reply: FastifyReply): Promise<void> => {
    if (!request.auth || !request.auth.user) {
      throw unauthorized('Authentication required');
    }

    const userRole = request.auth.user.role;

    if (!allowedRoles.includes(userRole)) {
      throw forbidden('Access denied: Insufficient permissions');
    }
  };
}