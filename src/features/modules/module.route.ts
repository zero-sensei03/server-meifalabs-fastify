import { FastifyInstance } from "fastify";
import { getModuleQuerySchema, patchModuleSchema } from "./module.validation.js";
import { ModuleController } from "./module.controller.js";
import { authMiddleware } from "../../middlewares/auth.middleware.js";


export async function moduleRoute(app: FastifyInstance): Promise<void> {
    const moduleController = new ModuleController();

    app.get(
        "/",
        {
            preHandler: [ authMiddleware ],
            schema: { querystring: getModuleQuerySchema }
        },
        moduleController.getAllModules
    )

    app.get(
        "/:code",
        { preHandler: [ authMiddleware ] },
        moduleController.getModuleById
    )

    app.patch(
        "/:code",
        {
            preHandler: [ authMiddleware ],
            schema: { body: patchModuleSchema }
        },
        moduleController.patchModuleById
    )
}