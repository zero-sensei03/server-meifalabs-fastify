import { prisma } from "../../../db/prisma.js";
import { conflict, notFound } from "../../../utils/errors.js";
import { PatchCategoryType } from "./category.validate.js";

export class CategoryPublicService {
    async getAllActiveCategories () {
        const category = await prisma.moduleCategory.findMany({
            where: {
                is_active: true,
                modules: {
                    every: {
                        is_active: true
                    }
                }
            },
            orderBy: {
                order: 'asc'
            },
            select: {
                code: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
                order: true,

                modules: {
                    where: {
                        is_active: true
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
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        })
        return category.map((category) => {
            return {
                ...category,
                modules: category.modules.map((module) => {
                    return {
                        ...module,
                        price_monthly: module.price_monthly ? module.price_monthly.toNumber() : null,
                        price_yearly: module.price_yearly ? module.price_yearly.toNumber() : null,
                        discount_monthly: module.discount_monthly ? module.discount_monthly.toNumber() : null,
                        discount_yearly: module.discount_yearly ? module.discount_yearly.toNumber() : null,
                    }
                })
            }
        });
    }
}

export class CategoryService {
    async getAll (
        limit: number = 10,
        page: number = 1,
        is_active?: boolean,
        search?: string
    ) {
        const where: any = {};
        if (is_active !== undefined) {
            where.is_active = is_active;
        }
        if (search) {
            where.OR = [
                {
                    name: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
                {
                    slug: {
                        contains: search,
                        mode: 'insensitive'
                    }
                },
            ]
        }

        const [ data, total ] = await prisma.$transaction([
            prisma.moduleCategory.findMany({
                where,
                orderBy: {
                    order: 'asc'
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.moduleCategory.count({ where })
        ]);

        return {
            items: data,
            pagination: {
                limit,
                page,
                total_pages: Math.ceil(total / limit),
                total_data: total,
            }
        }
    }

    async getById (code: string) {
        const category = await prisma.moduleCategory.findUnique({
            where: {
                code
            },
            select: {
                code: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
                order: true,
                is_active: true,

                modules: {
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
                    },
                    orderBy: {
                        order: 'asc'
                    }
                }
            }
        });

        if (!category) throw notFound(`Category with code ${code} not found`);

        return {
            ...category,
            modules: category.modules.map((module) => {
                return {
                    ...module,
                    price_monthly: module.price_monthly ? module.price_monthly.toNumber() : null,
                    price_yearly: module.price_yearly ? module.price_yearly.toNumber() : null,
                    discount_monthly: module.discount_monthly ? module.discount_monthly.toNumber() : null,
                    discount_yearly: module.discount_yearly ? module.discount_yearly.toNumber() : null,
                }
            })
        };
    }

    async updateById (code: string, data: PatchCategoryType) {

        const oldData = await prisma.moduleCategory.findUnique({
            where: {
                code
            },
            select: {
                code: true,
                name: true,
                slug: true,
                description: true,
                icon: true,
                order: true,
                is_active: true,
            }
        });

        if (!oldData) throw notFound(`Category with code ${code} not found`);

        try {

            if (data.order) {
                if (oldData.order !== data.order) {
                    const existingCategory = await prisma.moduleCategory.findFirst({
                        where: {
                            order: data.order
                        }
                    });

                    if (existingCategory) throw conflict(`Category with order ${data.order} already exists`);
                }
            }

            const newData = await prisma.moduleCategory.update({
                where: {
                    code
                },
                data,
                select: {
                    code: true,
                    name: true,
                    slug: true,
                    description: true,
                    icon: true,
                    order: true,
                    is_active: true,
                }
            });

            return {
                oldData,
                newData
            }
        } catch (error) {
            throw error;
        }
    }
}