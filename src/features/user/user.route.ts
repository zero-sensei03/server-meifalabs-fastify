import { FastifyInstance } from "fastify";
import { authMiddleware } from "../../middlewares/auth.middleware.js";
import { checkRole } from "../../middlewares/role.moddleware.js";
import { createUserSchema, getUserQuerySchema, statusUserSchema, updateUserSchema } from "./user.validation.js";
import { createUserController, deleteUserController, getUserAllController, getUserbyIdController, updateStatusController, updateUserController } from "./user.controller.js";


export async function userRoute(app: FastifyInstance): Promise<void> {
    app.get(
        "/",
        {
            preHandler: [
                authMiddleware,
                checkRole(["SUPERADMIN", "ADMIN"])
            ],
            schema: { querystring: getUserQuerySchema }
        },
        getUserAllController
    )
    app.get(
        "/:id",
        {
            preHandler: [
                authMiddleware,
                checkRole(["SUPERADMIN", "ADMIN"])
            ]
        },
        getUserbyIdController
    )
    app.post(
        "/",
        {
            preHandler: [
                authMiddleware,
                checkRole(["SUPERADMIN", "ADMIN"])
            ],
            schema: { body: createUserSchema }
        },
        createUserController
    )
    app.put(
        "/:id",
        {
            preHandler: [
                authMiddleware,
                checkRole(["SUPERADMIN", "ADMIN"])
            ],
            schema: { body: updateUserSchema }
        },
        updateUserController
    )
    app.patch(
        "/:id/status",
        {
            preHandler: [
                authMiddleware,
                checkRole(["SUPERADMIN", "ADMIN"])
            ],
            schema: { body: statusUserSchema }
        },
        updateStatusController
    )
    app.delete(
        "/:id",
        {
            preHandler: [
                authMiddleware,
                checkRole(["SUPERADMIN"])
            ],
        },
        deleteUserController
    )
}