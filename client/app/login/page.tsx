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
  loginSchema,
  validateLoginField,
  type LoginFormData,
} from "@/lib/auth-schemas";

type FieldErrors = Partial<Record<keyof LoginFormData, string>>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState<Partial<Record<keyof LoginFormData, boolean>>>({});

  function getValues(): LoginFormData {
    return { email, password };
  }

  function clearFieldError(field: keyof LoginFormData) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validateField(field: keyof LoginFormData, markTouched = true) {
    if (markTouched) {
      setTouched((prev) => ({ ...prev, [field]: true }));
    }
    const message = validateLoginField(field, getValues());
    setFieldErrors((prev) => {
      const next = { ...prev };
      if (message) next[field] = message;
      else delete next[field];
      return next;
    });
    return !message;
  }

  function validateAll() {
    const parsed = loginSchema.safeParse(getValues());
    if (parsed.success) {
      setFieldErrors({});
      return true;
    }
    setFieldErrors(getZodFieldErrors(parsed.error));
    setTouched({ email: true, password: true });
    return false;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError("");

    if (!validateAll()) return;

    const parsed = loginSchema.safeParse(getValues());
    if (!parsed.success) return;

    setSubmitting(true);
    try {
      await login(parsed.data.email, parsed.data.password);
      router.push("/rooms");
    } catch (err) {
      setFormError(
        err instanceof ApiError ? err.message : "Login failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue to your conversations"
    >
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        {formError && <AuthError message={formError} />}

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
          autoComplete="current-password"
          placeholder="••••••••"
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
          {submitting ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-500">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="font-semibold text-indigo-600 hover:text-indigo-700"
        >
          Create one
        </Link>
      </p>
    </AuthLayout>
  );
}
