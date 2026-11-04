import { FastifyReply, FastifyRequest } from "fastify";
import { CategoryPublicService, CategoryService } from "./category.service.js";
import { successResponse } from "../../../utils/response.js";
import { GetCategoryQueryType, PatchCategoryType } from "./category.validate.js";
import { requireCsrf, requireSession } from "../../auth/session.service.js";
import { AuditService } from "../../../services/audit.service.js";

export class CategoryPublicController {
    private categoryService: CategoryPublicService;

    constructor() {
        this.categoryService = new CategoryPublicService();
    }

    getAllCategory = async (req: FastifyRequest, res: FastifyReply) => {
        const categories = await this.categoryService.getAllActiveCategories();
        return res.send(
            successResponse("Successfully fetched all active categories", categories)
        )
    }
}

export class CategoryController {
    private categoryService: CategoryService;
    private session: (request: FastifyRequest) => Promise<{ user: any, session: any }>;
    private audit: AuditService;

    constructor() {
        this.categoryService = new CategoryService();
        this.session = async (request: FastifyRequest) => await requireSession(request);
        this.audit = new AuditService();
    }

    getAllCategory = async (
        req: FastifyRequest,
        res: FastifyReply
    ) => {
        let { limit, page, is_active, search } = req.query as GetCategoryQueryType;

        limit = limit ? Number(limit) : 10;
        page = page ? Number(page) : 1;
        is_active = is_active ? (is_active == 'true' ? true : false) : undefined;

        const categories = await this.categoryService.getAll(limit, page, is_active, search);
        return res.send(
            successResponse("Successfully fetched all categories", categories)
        )
    }

    getCategoryById = async (req: FastifyRequest, res: FastifyReply) => {
        const { code } = req.params as { code: string };
        const category = await this.categoryService.getById(code);
        return res.send(
            successResponse("Successfully fetched category by id", category)
        )
    }

    patchCategoryById = async (
        req: FastifyRequest, 
        res: FastifyReply
    ) => {
        const { session } = await this.session(req);
        await requireCsrf(req, session.csrf_hash);
        
        const { code } = req.params as { code: string };
        const body = req.body as PatchCategoryType;
        
        const result = await this.categoryService.updateById(code, body);

        await this.audit.createAudit({
            action: 'UPDATE',
            entity: 'MODULE_CATEGORY',
            entity_id: code,
            actor_id: session.user.id,
            old_data: result.oldData,
            new_data: result.newData,
            req
        })
        
        return res.send(
            successResponse("Successfully updated category", result.newData)
        )
    }
}