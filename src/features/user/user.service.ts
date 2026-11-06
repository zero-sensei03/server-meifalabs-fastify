import { FastifyRequest } from "fastify";
import { prisma } from "../../db/prisma.js";
import { UserRole, UserStatus } from "../../generated/prisma/enums.js";
import { badRequest, notFound } from "../../utils/errors.js";
import { logout } from "../auth/session.service.js";
import { CreateUserType, UpdateUserType } from "./user.validation.js";
import argon2 from "argon2";

export const checkEmailUsernameExists = async ({
    username, email, userId
}: {
    username?: string, email?: string, userId?: string
}) => {
    if (!username && !email) return;

    const conditions: any[] = [];
    if (username) conditions.push({ username });
    if (email) conditions.push({ email });

    const existingUser = await prisma.user.findFirst({
        where: {
            OR: conditions,
            ...(userId ? { NOT: { id: userId } } : {}),
        },
    });

    if (existingUser) {
        if (username && existingUser.username === username) {
            throw badRequest("Username already exists");
        }
        if (email && existingUser.email === email) {
            throw badRequest("Email already exists");
        }
    }
}

export const getAllUser = async (
    limit: number = 10,
    page: number = 1,
    search?: string,
    status?: UserStatus,
    role?: UserRole
) => {
    const where: any = {};

    if (search) {
        where.OR = [
            { username: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
        ];
    }

    if (status) where.status = status
    if (role) where.role = role

    const [items, total] = await prisma.$transaction([
        prisma.user.findMany({
            where,
            skip: (page - 1) * limit,
            take: limit,
            orderBy: {
                created_at: 'desc'
            },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                status: true,
                verified_at: true,
                created_at: true,
            }
        }),

        prisma.user.count({ where })
    ]);

    return {
        items,
        pagination: {
            limit,
            page,
            total_pages: Math.ceil(total / limit),
            total_data: total,
        }
    }
}
export const getUserById = async (id: string) => {

    const data = await prisma.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            verified_at: true,
            created_at: true,
        }
    });

    if (!data) throw notFound('User not found');

    return data;
}

export const createUser = async (userData: CreateUserType) => {
    await checkEmailUsernameExists({ username: userData.username, email: userData.email });
    const passwordHash = await argon2.hash(userData.password, {
        type: argon2.argon2id,
    });

    userData.password = passwordHash

    return await prisma.user.create({
        data: {
            ...userData,
            verified_at: new Date(),
            status: "ACTIVE"
        },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            verified_at: true
        },
    })
}
export const updateUser = async (userId: string, userRole: UserRole, userData: UpdateUserType) => {
    await checkEmailUsernameExists({ username: userData.username, email: userData.email, userId });

    const userCheck = await prisma.user.findUnique({
        where: { id: userId }
    })

    if (!userCheck) throw notFound('User not found');

    if (userRole === "ADMIN" && userCheck.role === "SUPERADMIN") {
        throw badRequest("Admin can't update a SuperAdmin account")
    }

    if(userData.password) {
        const passwordHash = await argon2.hash(userData.password, {
            type: argon2.argon2id,
        });

        userData.password = passwordHash
    }

    const updateData = await prisma.user.update({
        where: { id: userId },
        data: {
            ...userData,
        },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            verified_at: true
        },
    })
    return {
        old_data: userCheck,
        new_data: updateData
    };
}

export const updateStatus = async (userId: string, userRole: UserRole, status: UserStatus) => {
    const userCheck = await prisma.user.findUnique({
        where: { id: userId },
        select: {
            id: true,
            status: true,
            role: true
        }
    })

    if (!userCheck) throw notFound('User not found');

    if (userRole === "ADMIN" && userCheck.role === "SUPERADMIN") {
        throw badRequest("Admin can't update a SuperAdmin account")
    }

    const updateUser = await prisma.user.update({
        where: { id: userId },
        data: {
            status
        },
        select: {
            id: true,
            status: true,
            role: true
        }
    })

    return {
        old_data: userCheck,
        new_data: updateUser
    }
}

export const deleteUserById = async (userId: string, id: string, req: FastifyRequest) => {

    const data = await prisma.user.findUnique({
        where: {
            id
        },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            status: true,
            verified_at: true,
            created_at: true,
        }
    });

    if (!data) throw notFound('User not found');

    if (data.id == userId) {
        await logout(req)
    }
    await prisma.user.delete({
        where: { id }
    });

    return data;
}