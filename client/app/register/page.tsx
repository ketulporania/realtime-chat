"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthLayout, AuthError } from "@/components/AuthLayout";
import { FormField } from "@/components/ui/FormField";
import { useAuth } from "@/context/AuthContext";
import { ApiError } from "@/lib/api";
import {
  getZodFieldErrors,
  registerSchema,
  validateRegisterField,
  type RegisterFormData,
} from "@/lib/auth-schemas";
import { APP_NAME } from "@/lib/brand";

type FieldErrors = Partial<Record<keyof RegisterFormData, string>>;

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<
    Partial<Record<keyof RegisterFormData, boolean>>
  >({});

  function getValues(): RegisterFormData {
    return { username, email, password };
  }

  function clearFieldError(field: keyof RegisterFormData) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateField(field: keyof RegisterFormData, markTouched = true) {
    if (markTouched) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
    const message = validateRegisterField(field, getValues());
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
    return !message;
  }

  function validateAll() {
    const parsed = registerSchema.safeParse(getValues());
    if (parsed.success) {
      setFieldErrors({});
      return true;
    }
    setFieldErrors(getZodFieldErrors(parsed.error));
    setTouched({ username: true, email: true, password: true });
    return false;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!validateAll()) return;

    const parsed = registerSchema.safeParse(getValues());
    if (!parsed.success) return;

    setSubmitting(true);
    try {
      await register(
        parsed.data.username,
        parsed.data.email,
        parsed.data.password
      );
      router.push("/rooms");
    } catch (err) {
      setFormError(
        err instanceof ApiError
          ? err.message
          : "Registration failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle={`Join ${APP_NAME} and start messaging in seconds`}
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && <AuthError message={formError} />}

        <FormField
          id="username"
          label="Username"
          type="text"
          autoComplete="username"
          placeholder="alice"
          hint="3–32 characters · letters, numbers, underscores"
          value={username}
          onChange={(value) => {
            setUsername(value);
            clearFieldError("username");
            if (touched.username) validateField("username", false);
          }}
          onBlur={() => validateField("username")}
          error={touched.username ? fieldErrors.username : undefined}
          disabled={submitting}
        />

        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          onChange={(value) => {
            setEmail(value);
            clearFieldError("email");
            if (touched.email) validateField("email", false);
          }}
          onBlur={() => validateField("email")}
          error={touched.email ? fieldErrors.email : undefined}
          disabled={submitting}
        />

        <FormField
          id="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          hint="At least 6 characters"
          value={password}
          onChange={(value) => {
            setPassword(value);
            clearFieldError("password");
            if (touched.password) validateField("password", false);
          }}
          onBlur={() => validateField("password")}
          error={touched.password ? fieldErrors.password : undefined}
          disabled={submitting}
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? "Creating account..." : "Create account"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
}
