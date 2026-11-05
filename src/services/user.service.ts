import argon2 from 'argon2';
import { prisma } from "../db/prisma.js"
import { badRequest, notFound } from "../utils/errors.js"

export const CheckUserPassword = async (
    userId: string,
    password: string
) => {
    const user = await prisma.user.findUnique({
        where: {
            id: userId,
        },
        select: {
            password: true
        }
    })

    if (!user) throw notFound(`User with id ${userId} not found`)

    const password_check = await argon2.verify(user.password, password);
    if (!password_check) throw badRequest(`Invalid password`)
    
}