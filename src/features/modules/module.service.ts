import { prisma } from "../../db/prisma.js";
import { conflict, notFound } from "../../utils/errors.js";
import { PatchModuleType } from "./module.validation.js";

export class ModuleService {
    async getAllModules(
        limit: number = 10,
        page: number = 1,
        is_active?: boolean,
        search?: string,
        start_pricing?: number,
        end_pricing?: number
    ) {
        const where: any = {};
        if (is_active !== undefined) {
            where.is_active = is_active;
        }
        if (search) {
            where.OR = [
                { module_name: { contains: search, mode: 'insensitive' } },
                { slug: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (start_pricing !== undefined && end_pricing !== undefined) {
            where.price_monthly = { gte: start_pricing, lte: end_pricing };
        } else if (start_pricing !== undefined) {
            where.price_monthly = { gte: start_pricing };
        } else if (end_pricing !== undefined) {
            where.price_monthly = { lte: end_pricing };
        }

        const [data, total] = await prisma.$transaction([
            prisma.module.findMany({
                where,
                skip: (page - 1) * limit,
                take: limit,
                orderBy: {
                    order: 'asc'
                },
                select: {
                    code: true,
                    module_name: true,
                    slug: true,
                    description: true,
                    order: true,
                    price_monthly: true,
                    price_yearly: true,
                    discount_monthly: true,
                    discount_yearly: true,
                    is_active: true,
                    is_sellable: true,

                    category: {
                        select: {
                            code: true,
                            name: true,
                            slug: true,
                            description: true,
                            icon: true,
                            order: true,
                            is_active: true,
                        }
                    }
                }
            }),

            prisma.module.count({ where })
        ]);

        const items = data.map((module) => {
            return {
                ...module,
                price_monthly: module.price_monthly ? module.price_monthly.toNumber() : null,
                price_yearly: module.price_yearly ? module.price_yearly.toNumber() : null,
                discount_monthly: module.discount_monthly ? module.discount_monthly.toNumber() : null,
                discount_yearly: module.discount_yearly ? module.discount_yearly.toNumber() : null,
            }
        });

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

    async getModuleById(code: string) {
        const module = await prisma.module.findUnique({
            where: {
                code
            },
            select: {
                code: true,
                module_name: true,
                slug: true,
                description: true,
                order: true,
                price_monthly: true,
                price_yearly: true,
                discount_monthly: true,
                discount_yearly: true,
                is_active: true,
                is_sellable: true,

                category: {
                    select: {
                        code: true,
                        name: true,
                        slug: true,
                        description: true,
                        icon: true,
                        order: true,
                        is_active: true,
                    }
                }
            }
        });

        if (!module) throw notFound(`Module with code ${code} not found`);

        return {
            ...module,
            price_monthly: module.price_monthly ? module.price_monthly.toNumber() : null,
            price_yearly: module.price_yearly ? module.price_yearly.toNumber() : null,
            discount_monthly: module.discount_monthly ? module.discount_monthly.toNumber() : null,
            discount_yearly: module.discount_yearly ? module.discount_yearly.toNumber() : null,
        }
    }

    async patchModule(code: string, data: PatchModuleType) {
        const old_data = await prisma.module.findUnique({
            where: {
                code
            },
            select: {
                code: true,
                module_name: true,
                slug: true,
                description: true,
                order: true,
                price_monthly: true,
                price_yearly: true,
                discount_monthly: true,
                discount_yearly: true,
                is_active: true,
                is_sellable: true,
            }
        });

        if (!old_data) throw notFound(`Module with code ${code} not found`);

        try {
            if (data.order) {
                if (data.order !== old_data.order) {
                    const existingModule = await prisma.module.findFirst({
                        where: {
                            order: data.order
                        }
                    });

                    if (existingModule) throw conflict(`Module with order ${data.order} already exists`);
                }
            }

            const new_data = await prisma.module.update({
                where: {
                    code
                },
                data,
                select: {
                    code: true,
                    module_name: true,
                    slug: true,
                    description: true,
                    order: true,
                    price_monthly: true,
                    price_yearly: true,
                    discount_monthly: true,
                    discount_yearly: true,
                    is_active: true,
                    is_sellable: true,
                }
            });

            return {
                old_data: {
                    ...old_data,
                    price_monthly: old_data.price_monthly ? old_data.price_monthly.toNumber() : null,
                    price_yearly: old_data.price_yearly ? old_data.price_yearly.toNumber() : null,
                    discount_monthly: old_data.discount_monthly ? old_data.discount_monthly.toNumber() : null,
                    discount_yearly: old_data.discount_yearly ? old_data.discount_yearly.toNumber() : null,
                },
                new_data: {
                    ...new_data,
                    price_monthly: new_data.price_monthly ? new_data.price_monthly.toNumber() : null,
                    price_yearly: new_data.price_yearly ? new_data.price_yearly.toNumber() : null,
                    discount_monthly: new_data.discount_monthly ? new_data.discount_monthly.toNumber() : null,
                    discount_yearly: new_data.discount_yearly ? new_data.discount_yearly.toNumber() : null,
                }
            }
        } catch (error) {
            throw error;
        }
    }
}