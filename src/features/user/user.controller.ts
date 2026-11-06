import { FastifyReply, FastifyRequest } from "fastify";
import { AuditService } from "../../services/audit.service.js";
import { requireCsrf, requireSession } from "../auth/session.service.js";
import { CreateUserType, GetUserQueryType, StatusUserType, UpdateUserType } from "./user.validation.js";
import { badRequest } from "../../utils/errors.js";
import { CheckUserPassword } from "../../services/user.service.js";
import { createUser, deleteUserById, getAllUser, getUserById, updateStatus, updateUser } from "./user.service.js";
import { successResponse } from "../../utils/response.js";
import { UserRole, UserStatus } from "../../generated/prisma/enums.js";

const audit = new AuditService();

export const getUserAllController = async (
    req: FastifyRequest,
    res: FastifyReply
) => {
    let { limit, page, status, role, search } = req.query as GetUserQueryType;
    
    limit = limit ? Number(limit) : 10;
    page = page ? Number(page) : 1;

    if (status) {
        const validStatuses: string[] = Object.values(UserStatus);
        if (!validStatuses.includes(status.toUpperCase())) {
            throw badRequest(`Status ${status} not found`)
        }

        status = status.toUpperCase()
    }

    if (role) {
        const validRoles: string[] = Object.values(UserRole);
        if (!validRoles.includes(role.toUpperCase())) {
            throw badRequest(`Role ${role} not found`)
        }

        role = role.toUpperCase()
    }

    const result = await getAllUser(limit, page, search, status as UserStatus | undefined, role as UserRole | undefined)
    res.send(
        successResponse("User fetched successfully", result)
    )
}

export const getUserbyIdController = async (
    req: FastifyRequest,
    res: FastifyReply
) => {
    const { id } = req.params as { id: string }

    const result = await getUserById(id)
    res.send(
        successResponse("User fetched successfully", result)
    )
}

export const createUserController = async (
    req: FastifyRequest,
    res: FastifyReply
) => {
    const { session } = await requireSession(req);
    await requireCsrf(req, session.csrf_hash);

    const userId = session.user.id;
    const userRole = session.user.role;

    const userData = req.body as CreateUserType;

    if (userRole === "ADMIN" && userData.role === "SUPERADMIN") {
        throw badRequest("Admin can't create a SuperAdmin account")
    }

    const result = await createUser(userData);

    await audit.createAudit({
        req,
        action: "CREATE",
        entity: "USER",
        entity_id: result.id,
        actor_id: userId,
        new_data: result,
    });

    res.status(201).send(
        successResponse("User created successfully", result)
    )
}

export const updateUserController = async (
    req: FastifyRequest,
    res: FastifyReply
) => {
    const { session } = await requireSession(req);
    await requireCsrf(req, session.csrf_hash);

    const { id } = req.params as { id: string };
    const userId = session.user.id;
    const userRole = session.user.role;

    const userData = req.body as UpdateUserType;

    const result = await updateUser(id, userRole, userData);

    await audit.createAudit({
        req,
        action: "UPDATE",
        entity: "USER",
        entity_id: result.new_data.id,
        actor_id: userId,
        new_data: result.new_data,
        old_data: result.old_data,
    });

    res.send(
        successResponse("User updated successfully", result.new_data)
    )
}

export const updateStatusController = async (
    req: FastifyRequest,
    res: FastifyReply
) => {
    const { session } = await requireSession(req);
    await requireCsrf(req, session.csrf_hash);

    const { id } = req.params as { id: string };
    const userId = session.user.id;
    const userRole = session.user.role

    const { password, status } = req.body as StatusUserType;

    if (!password) {
        throw badRequest("Password is required for verification");
    }
    await CheckUserPassword(userId, password);

    const result = await updateStatus(id, userRole, status);

    await audit.createAudit({
        req,
        action: "UPDATE",
        entity: "USER",
        entity_id: result.new_data.id,
        actor_id: userId,
        new_data: result.new_data,
        old_data: result.old_data,
    });

    res.send(
        successResponse("Status updated successfully", result.new_data)
    )
}

export const deleteUserController = async (
    req: FastifyRequest,
    res: FastifyReply
) => {
    const { session } = await requireSession(req);
    await requireCsrf(req, session.csrf_hash);

    const { id } = req.params as { id: string };
    const userId = session.user.id;

    const result = await deleteUserById(userId, id, req);

    await audit.createAudit({
        req,
        action: "DELETE",
        entity: "USER",
        entity_id: result.id,
        actor_id: userId,
        old_data: result,
    });

    res.send(
        successResponse("User deleted successfully", null)
    )
}
