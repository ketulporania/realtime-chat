import { z } from "zod";

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required")
    .min(3, "Username must be at least 3 characters")
    .max(32, "Username must be at most 32 characters")
    .regex(
      /^[a-zA-Z0-9_]+$/,
      "Username may only contain letters, numbers, and underscores"
    ),
  email: z
    .string()
    .trim()
    .min(1, "Email is required")
    .email("Enter a valid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .min(6, "Password must be at least 6 characters")
    .max(128, "Password must be at most 128 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

export function getZodFieldErrors(
  error: z.ZodError
): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function validateLoginField(
  field: keyof LoginFormData,
  values: LoginFormData
): string | undefined {
  const shape = loginSchema.shape[field];
  const result = shape.safeParse(values[field]);
  return result.success ? undefined : result.error.issues[0]?.message;
}

export function validateRegisterField(
  field: keyof RegisterFormData,
  values: RegisterFormData
): string | undefined {
  const shape = registerSchema.shape[field];
  const result = shape.safeParse(values[field]);
  return result.success ? undefined : result.error.issues[0]?.message;
}
