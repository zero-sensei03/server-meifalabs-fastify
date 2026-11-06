import { FastifyInstance } from "fastify";
import { CategoryController, CategoryPublicController } from "./category.controller.js";
import { getCategoryQuerySchema, patchCategorySchema } from "./category.validate.js";
import { authMiddleware } from "../../../middlewares/auth.middleware.js";
import { checkRole } from "../../../middlewares/role.moddleware.js";

export async function categoryPublicRoute(app: FastifyInstance): Promise<void> {
    const categoryPublicController = new CategoryPublicController();
    
    app.get(
        "/",
        categoryPublicController.getAllCategory
    )
}

export async function categoryRoute(app: FastifyInstance): Promise<void> {
    const categoryController = new CategoryController();
    
    app.get(
        "/",
        {
            preHandler: [ authMiddleware ],
            schema: { querystring: getCategoryQuerySchema }
        },  
        categoryController.getAllCategory
    )
    app.get(
        "/:code",
        { preHandler: [ authMiddleware ], },
        categoryController.getCategoryById
    )
    app.patch(
        "/:code",
        {
            preHandler: [
                authMiddleware,
                checkRole(["SUPERADMIN", "ADMIN"])
            ],
            schema: { body: patchCategorySchema }
        },
        categoryController.patchCategoryById
    )
}