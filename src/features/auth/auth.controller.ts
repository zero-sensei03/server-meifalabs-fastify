import { FastifyReply, FastifyRequest } from "fastify";
import { RegisterInput, ResendRegisterOtpInput, ResetPasswordInput, VerifyEmailInput } from "./auth.validation.js";
import { forgotPasswordOTP, registerUser, resendEmailOTPRegister, resetPassword, verifyForgotPassword, verifyUserEmail } from "./auth.service.js";
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

    return res.send(
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

    return res.send(
        successResponse(result.message, result.user),
    );
}

export const forgotPasswordOTPController = async (
    req: FastifyRequest<{ Body: ResendRegisterOtpInput }>,
    res: FastifyReply
) => {
    const result = await forgotPasswordOTP(req.body);

    return res.send(
        successResponse(result.message, result.user),
    );
}

export const verifyForgotPasswordOTPController = async (
    req: FastifyRequest<{ Body: VerifyEmailInput }>,
    res: FastifyReply
) => {
    const result = await verifyForgotPassword(req.body);

    return res.send(
        successResponse(result.message, {})
    )
}

export const resetPasswordController = async (
    req: FastifyRequest<{ Body: ResetPasswordInput }>,
    res: FastifyReply
) => {
    const result = await resetPassword(req.body)

    return res.send(
        successResponse(result.message, {})
    )
}