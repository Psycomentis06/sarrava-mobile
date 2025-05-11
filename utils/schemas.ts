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

export const newTransactionPriceSchema = z
  .object({
    totalPrice: z.coerce
      .number({ message: "رقم السعر غير صالح" })
      .nonnegative({ message: "السعر يجب أن يكون رقمًا موجبًا." })
      .min(1, { message: "المبلغ يجب أن يكون 1" }),
    selectedCurrency: z.any(),
    isPaidFull: z.boolean(),
    firstInstallment: z.coerce
      .number({ message: "رقم السعر غير صالح" })
      .nonnegative({ message: "السعر يجب أن يكون رقمًا موجبًا." })
      .optional(),
  })
  .refine(
    (data) => {
      console.log(data);

      if (!data.isPaidFull && !data.firstInstallment) {
        return false;
      }
      return true;
    },
    {
      message: "يجب تحديد الدفعة الأولى عندما لا يتم الدفع بالكامل.",
      path: ["firstInstallment"],
    }
  )
  .refine(
    (data) => {
      console.log(data);
      if (
        !data.isPaidFull &&
        data.firstInstallment &&
        data.firstInstallment > data.totalPrice
      ) {
        return false;
      }
      return true;
    },
    {
      message: "يجب أن تكون الدفعة الأولى أقل من أو تساوي السعر الإجمالي.",
      path: ["firstInstallment"],
    }
  );

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

export const newAgentSchema = z
  .object({
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
      .min(8, {
        message: "يجب أن يكون رقم الهاتف مكونًا من 8 أرقام على الأقل",
      }),
    address: z.string().nonempty({ message: "العنوان مطلوب" }),
    password: z
      .string()
      .nonempty({ message: "كلمة السرّ مطلوبة" })
      .min(2, "كلمة السر يجب أن تحتوي على حرفين على الأقل"),
    department: z
      .string()
      .uuid({ message: "لايمكن قبول بيانات الفرع" })
      .nullable()
      .optional(),
    department_role: z.string().nullable(),
  })
  .refine((data) => !(data.department !== null && !data.department_role), {
    message: "دور الفرع مطلوب عندما يتم تحديد فرع",
    path: ["department_role"],
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

export const newAgentDepartmentSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty("أسم الفرع إجباري")
    .max(50, "إسم الفرع طويل (أكثر من 50 حرف)"),
  country: z
    .object({
      code: z.string(),
      name: z.string(),
      dialCode: z.string(),
      name_ar: z.string(),
    })
    .refine(
      (data) =>
        data &&
        "code" in data &&
        "name" in data &&
        "dialCode" in data &&
        "name_ar" in data &&
        Object.values(data).every((val) => val !== ""),
      {
        message: "بلد الفرع إجباريّة",
      }
    ),
  city: z.string().trim().nonempty("مدينة الفرع إجباريّة"),
  zipcode: z
    .string()
    .trim()
    .nonempty("الرّمز البريدي إجباري")
    .max(10, "الرمز البريدي طويل (أكثر من 10 حرف)")
    .refine((val) => /^\d+$/.test(val), {
      message: "يجب أن يتكون الرمز البريدي من أرقام فقط",
    }),
  address: z.string().trim().nonempty("عنوان الفرع إجباري"),
});

export type NewAgentDepartmentSchemaType = z.infer<
  typeof newAgentDepartmentSchema
>;

export const newReportSchema = z
  .object({
    title: z.string().min(1, "العنوان مطلوب"),
    description: z.string().optional(),
    dateRangeType: z.enum([
      "custom",
      "today",
      "yesterday",
      "past7days",
      "past30days",
      "thisMonth",
      "lastMonth",
      "thisYear",
    ]),
    fromDate: z.date(),
    toDate: z.date(),
  })
  .refine((data) => data.fromDate <= data.toDate, {
    message: "تاريخ البداية يجب أن يكون قبل تاريخ النهاية",
    path: ["fromDate"],
  });

export type NewReportType = z.infer<typeof newReportSchema>;