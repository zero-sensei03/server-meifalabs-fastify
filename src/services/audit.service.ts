import { FastifyRequest } from "fastify";
import { AuditAction } from "../generated/prisma/enums.js";
import { prisma } from "../db/prisma.js";

export class AuditService {
    async createAudit ({
        req,
        action,
        entity,
        entity_id,
        actor_id,
        old_data,
        new_data,
        request_id
    } : {
        req: FastifyRequest,
        action: AuditAction,
        entity: string,
        entity_id: string,
        actor_id?: string,
        old_data?: any,
        new_data?: any,
        request_id?: string
    }) {
        const ip = req.ip;
        const userAgent = req.headers['user-agent'] || null;

        const data = {
            ip_address: ip,
            user_agent: userAgent,
            action,
            entity,
            entity_id,
            actor_id,
            old_data,
            new_data,
            request_id
        }
        await prisma.auditLog.create({ data })
    }
}