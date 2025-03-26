import * as z from "zod";

export const newTransactionAgentSchema = z.object({
  firstname: z
    .string()
    .nonempty({ message: "الاسم مطلوب" })
    .min(2, { message: "الاسم يجب أن يتكون من حرفين على الأقل." }),
  lastname: z
    .string()
    .nonempty({ message: "اللّقب مطلوب" })
    .min(2, { message: "يجب أن يتكون اللقب من حرفين على الأقل." }),
  email: z
    .string()
    .nonempty({ message: "البريد الألكتروني مطلوب" })
    .email({ message: "عنوان البريد الإلكتروني غير صالح." }),
  phone: z
    .string()
    .nonempty({ message: "رقم الهاتف مطلوب" })
    .min(8, { message: "يجب أن يكون رقم الهاتف مكونًا من 8 أرقام على الأقل" }),
  address: z.string().nonempty({ message: "العنوان مطلوب" }),
});

export const newTransactionPriceSchema = z.object({
  totalPrice: z.coerce
    .number({ message: "رقم السعر غير صالح" })
    .nonnegative({ message: "السعر يجب أن يكون رقمًا موجبًا." })
    .min(1, { message: "المبلغ يجب أن يكون 1" }),
  selectedCurrency: z.object({
    sign: z.string(),
    name: z.string(),
    country: z.string(),
    flag: z.string(),
    toDollarRate: z.number(),
  }),
  isPaidFull: z.boolean(),
  firstInstallment: z.number().optional(),
});

export const newTransactionSchema = z.object({
  sender: newTransactionAgentSchema,
  receiver: newTransactionAgentSchema,
  price: newTransactionPriceSchema,
});

export type NewTransactionAgentSchemaType = z.infer<
  typeof newTransactionAgentSchema
>;
export type NewTransactionPriceSchemaType = z.infer<
  typeof newTransactionPriceSchema
>;

export type NewTransactionType = z.infer<typeof newTransactionSchema>;

export const newAgentSchema = z.object({
  firstname: z
    .string()
    .nonempty({ message: "الاسم مطلوب" })
    .min(2, { message: "الاسم يجب أن يتكون من حرفين على الأقل." }),
  lastname: z
    .string()
    .nonempty({ message: "اللّقب مطلوب" })
    .min(2, { message: "يجب أن يتكون اللقب من حرفين على الأقل." }),
  email: z
    .string()
    .nonempty({ message: "البريد الألكتروني مطلوب" })
    .email({ message: "عنوان البريد الإلكتروني غير صالح." }),
  phone: z
    .string()
    .nonempty({ message: "رقم الهاتف مطلوب" })
    .min(8, { message: "يجب أن يكون رقم الهاتف مكونًا من 8 أرقام على الأقل" }),
  address: z.string().nonempty({ message: "العنوان مطلوب" }),
});

export type NewAgentType = z.infer<typeof newAgentSchema>;

export const loginSchema = z.object({
  email: z
    .string()
    .nonempty({ message: "مطلوب" })
    .email({ message: "بريد ألكتروني غير صحيح" }),
  password: z.string().nonempty({ message: "مطلوب" }),
});

export type LoginSchemaType = z.infer<typeof loginSchema>;

export const updateCurrencyRateSchema = z.object({
  currencyRate: z.coerce
    .number({ message: "رقم غير صالح" })
    .nonnegative({ message: "المعدل ليس إيجابيا" })
    .min(0, { message: "المعدل يجب أن يكون أكبر من 0" }),
});

export type UpdateCurrencyRateSchemaType = z.infer<
  typeof updateCurrencyRateSchema
>;
