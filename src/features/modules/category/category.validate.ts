import { type Static, Type } from "@sinclair/typebox";

export const patchCategorySchema = Type.Partial(
  Type.Object(
    {
      name: Type.String({ minLength: 3, maxLength: 48 }),
      slug: Type.String({ minLength: 3, maxLength: 48 }),
      description: Type.String({}),
      icon: Type.String({ minLength: 1, maxLength: 128 }),
      order: Type.Number({ minimum: 1, maximum: 1000 }),
      is_active: Type.Boolean(),
    },
    { additionalProperties: false },
  )
);

export type PatchCategoryType = Static<typeof patchCategorySchema>;

export const getCategoryQuerySchema = Type.Object({
    limit: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    page: Type.Optional(Type.Union([Type.String(), Type.Number()])),
    is_active: Type.Optional(Type.Union([Type.String(), Type.Boolean()])),
    search: Type.Optional(Type.Union([Type.String()]))
}, { additionalProperties: false });

export type GetCategoryQueryType = Static<typeof getCategoryQuerySchema>;