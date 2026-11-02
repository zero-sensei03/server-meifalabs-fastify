import { FastifyReply, FastifyRequest } from "fastify";
import { RegisterInput, ResendRegisterOtpInput, VerifyEmailInput } from "./auth.validation.js";
import { registerUser, resendEmailOTPRegister, verifyUserEmail } from "./auth.service.js";
import { successResponse } from "../../utils/response.js";
import { AuditService } from "../../services/audit.service.js";

const audit = new AuditService()

export const registerController = async (
    req: FastifyRequest<{ Body: RegisterInput }>,
    res: FastifyReply
) => {
    const result = await registerUser(req.body);

    await audit.createAudit({
        req,
        entity: "REGISTER",
        entity_id: result.user.id,
        action: "CREATE",
        new_data: result.user
    })

    return res.code(201).send(
        successResponse(result.message, result.user),
    );
}

export const resendOtpRegisterController = async (
    req: FastifyRequest<{ Body: ResendRegisterOtpInput }>,
    res: FastifyReply
) => {
    const result = await resendEmailOTPRegister(req.body);

    return res.code(201).send(
        successResponse(result.message, result.user),
    );
}

export const verifyRegisterController = async(
    req: FastifyRequest<{ Body: VerifyEmailInput }>,
    res: FastifyReply
) => {
    const result = await verifyUserEmail(req.body);

    await audit.createAudit({
        req,
        entity: "OTP_VERIFICATION",
        entity_id: result.user.id,
        action: "UPDATE",
        new_data: result.user,
        old_data: result.last_data
    })

    return res.code(201).send(
        successResponse(result.message, result.user),
    );
}