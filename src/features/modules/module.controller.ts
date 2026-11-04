import { FastifyReply, FastifyRequest } from "fastify";
import { ModuleService } from "./module.service.js";
import { GetModuleQueryType, PatchModuleType } from "./module.validation.js";
import { successResponse } from "../../utils/response.js";
import { AuditService } from "../../services/audit.service.js";
import { requireCsrf, requireSession } from "../auth/session.service.js";

export class ModuleController {

    private moduleService: ModuleService;
    private session: (request: FastifyRequest) => Promise<{ user: any, session: any }>;
    private audit: AuditService;


    constructor() {
        this.moduleService = new ModuleService();
        this.session = async (request: FastifyRequest) => await requireSession(request);
        this.audit = new AuditService();
    }

    getAllModules = async (req: FastifyRequest, res: FastifyReply) => {
        let { limit, page, is_active, search, start_pricing, end_pricing } = req.query as GetModuleQueryType;

        limit = limit ? Number(limit) : 10;
        page = page ? Number(page) : 1;
        is_active = is_active ? (is_active == 'true' ? true : false) : undefined;
        start_pricing = start_pricing ? Number(start_pricing) : undefined;
        end_pricing = end_pricing ? Number(end_pricing) : undefined;
        

        const result = await this.moduleService.getAllModules(limit, page, is_active, search, start_pricing, end_pricing);
        res.send(
            successResponse("Modules retrieved successfully", result)
        )
    }

    getModuleById = async (req: FastifyRequest, res: FastifyReply) => {
        const { code } = req.params as { code: string };
        const result = await this.moduleService.getModuleById(code);
        res.send(
            successResponse("Module retrieved successfully", result)
        )
    }

    patchModuleById = async (req: FastifyRequest, res: FastifyReply) => {
        const { session } = await this.session(req);
        await requireCsrf(req, session.csrf_hash);

        const { code } = req.params as { code: string };
        const data = req.body as PatchModuleType;
        const result = await this.moduleService.patchModule(code, data);

        await this.audit.createAudit({
            action: 'UPDATE',
            entity: 'MODULE_CATEGORY',
            entity_id: code,
            actor_id: session.user.id,
            old_data: result.old_data,
            new_data: result.new_data,
            req
        })

        res.send(
            successResponse("Module updated successfully", result.new_data)
        )
    }
}