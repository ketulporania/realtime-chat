import { APP_LOGO_LETTER, APP_NAME, APP_TAGLINE } from "@/lib/brand";

interface AuthLayoutProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="flex h-full min-h-0 flex-1 overflow-hidden">
      {/* Brand panel */}
      <div className="auth-gradient relative hidden min-h-0 w-[44%] shrink-0 flex-col justify-between overflow-hidden p-6 md:flex md:p-8 xl:p-12">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 text-lg font-bold text-white ring-1 ring-white/20 backdrop-blur">
              {APP_LOGO_LETTER}
            </div>
            <span className="text-lg font-semibold text-white">{APP_NAME}</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-white xl:text-3xl">
            Connect instantly with your team
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-indigo-100/90 xl:text-base">
            Real-time messaging, live presence, and organized rooms — everything
            you need for seamless collaboration.
          </p>
          <ul className="mt-6 space-y-3 text-sm text-indigo-100/80 xl:mt-8">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                ✓
              </span>
              Instant message delivery
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                ✓
              </span>
              See who&apos;s online in each room
            </li>
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400/20 text-emerald-300">
                ✓
              </span>
              Public and private rooms
            </li>
          </ul>
        </div>

        <p className="relative z-10 text-xs text-indigo-200/60">
          © {new Date().getFullYear()} {APP_NAME}
        </p>

        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-indigo-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-sky-500/10 blur-3xl" />
      </div>

      {/* Form panel — grid centering, clean scroll when zoomed */}
      <div className="grid min-h-0 min-w-0 flex-1 place-items-center overflow-y-auto bg-slate-50 overscroll-contain">
        <div className="w-full max-w-md px-4 py-5 sm:px-6 sm:py-8">
          <div className="mb-5 flex items-center gap-3 md:hidden">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-sm font-bold text-white shadow-lg shadow-indigo-600/30">
              {APP_LOGO_LETTER}
            </div>
            <div className="min-w-0">
              <span className="text-base font-semibold text-slate-900">
                {APP_NAME}
              </span>
              <p className="truncate text-xs text-slate-500">{APP_TAGLINE}</p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white p-5 card-shadow sm:p-7">
            <div className="mb-5 sm:mb-6">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                {title}
              </h1>
              <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

function AuthError({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
      <span className="mt-0.5 shrink-0" aria-hidden>
        ⚠
      </span>
      <p>{message}</p>
    </div>
  );
}

export { AuthError };
