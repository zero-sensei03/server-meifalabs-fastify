import { type Static, Type } from "@sinclair/typebox";
import { UserRole, UserStatus } from "../../generated/prisma/enums.js";

export const createUserSchema = Type.Object(
{
    username: Type.String({ minLength: 3, maxLength: 48 }),
    password: Type.String({ minLength: 8, maxLength: 128 }),
    role: Type.Enum(UserRole),
    email: Type.Optional(Type.String({ format: "email", minLength: 5, maxLength: 128 })),
},
{ additionalProperties: false },
)
export const updateUserSchema = Type.Partial(createUserSchema)

export type CreateUserType = Static<typeof createUserSchema>;
export type UpdateUserType = Static<typeof updateUserSchema>;

export const statusUserSchema = Type.Object(
{
    status: Type.Enum(UserStatus),
    password: Type.String({ minLength: 8, maxLength: 128 }),
},
{ additionalProperties: false },
)
export type StatusUserType = Static<typeof statusUserSchema>;


export const getUserQuerySchema = Type.Object({
    limit: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    page: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    status: Type.Optional(Type.Union([Type.String()])),
    role: Type.Optional(Type.Union([Type.String()])),
    search: Type.Optional(Type.Union([Type.String()])),
}, { additionalProperties: false });

export type GetUserQueryType = Static<typeof getUserQuerySchema>;