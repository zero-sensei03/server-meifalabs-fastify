import { type Static, Type } from "@sinclair/typebox";

export const patchModuleSchema = Type.Partial(
  Type.Object(
    {
      category_id: Type.String({ minLength: 3, maxLength: 48 }),
      module_name: Type.String({ minLength: 3, maxLength: 128 }),
      slug: Type.String({ minLength: 3, maxLength: 128 }),
      description: Type.String({}),

      price_monthly: Type.Number({ minimum: 0, maximum: 100000 }),
      price_yearly: Type.Number({ minimum: 0, maximum: 100000 }),
      discount_monthly: Type.Number({ minimum: 0, maximum: 100 }),
      discount_yearly: Type.Number({ minimum: 0, maximum: 100 }),

      order: Type.Number({ minimum: 1, maximum: 1000 }),    

      is_active: Type.Boolean(),
      is_sellable: Type.Boolean(),

      password: Type.String({ minLength: 8, maxLength: 128 }),
    },
    { additionalProperties: false },
  )
);

export type PatchModuleType = Static<typeof patchModuleSchema>;

export const getModuleQuerySchema = Type.Object({
    limit: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    page: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    is_active: Type.Optional(Type.Union([Type.String(), Type.Boolean()])),
    search: Type.Optional(Type.Union([Type.String()])),
    start_pricing: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    end_pricing: Type.Optional(Type.Union([Type.String(), Type.Number()])),
}, { additionalProperties: false });

export type GetModuleQueryType = Static<typeof getModuleQuerySchema>;