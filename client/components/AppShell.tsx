"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { User } from "@/lib/api";
import { APP_LOGO_LETTER, APP_NAME, APP_TAGLINE } from "@/lib/brand";

interface AppShellContextValue {
  openMobileNav: () => void;
  closeMobileNav: () => void;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  return useContext(AppShellContext);
}

interface AppShellProps {
  user: User;
  onLogout: () => void;
  children: React.ReactNode;
  sidebar?: React.ReactNode;
}

function MenuIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface SidebarContentProps {
  user: User;
  onLogout: () => void;
  sidebar?: React.ReactNode;
  onRooms: boolean;
  onNavigate?: () => void;
  showCloseButton?: boolean;
  onClose?: () => void;
}

function SidebarContent({
  user,
  onLogout,
  sidebar,
  onRooms,
  onNavigate,
  showCloseButton,
  onClose,
}: SidebarContentProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Header — fixed at top */}
      <div className="relative shrink-0 border-b border-slate-800 px-4 py-4 sm:px-5 sm:py-5">
        {showCloseButton && onClose && (
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <CloseIcon />
          </button>
        )}
        <div className={`flex items-center gap-3 ${showCloseButton ? "pr-10" : ""}`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
            {APP_LOGO_LETTER}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-white">{APP_NAME}</p>
            <p className="truncate text-xs text-slate-400">{APP_TAGLINE}</p>
          </div>
        </div>
      </div>

      {/* Scrollable middle — nav + online users */}
      <div className="min-h-0 flex-1 overflow-y-auto chat-scroll">
        <nav className="px-3 py-3 sm:py-4">
          <Link
            href="/rooms"
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              onRooms
                ? "bg-indigo-500/15 text-indigo-300"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <span className="text-base">#</span>
            All rooms
          </Link>
        </nav>

        {sidebar && (
          <div className="border-t border-slate-800 px-3 py-3 sm:py-4">
            {sidebar}
          </div>
        )}
      </div>

      {/* Footer — user + sign out, always reachable via sidebar scroll */}
      <div className="shrink-0 border-t border-slate-800 p-3 sm:p-4">
        <div className="flex items-center gap-3 rounded-xl bg-slate-800/60 p-3">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ring-2 ring-slate-700"
            style={{ backgroundColor: user.avatarColor }}
          >
            {user.username.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">
              {user.username}
            </p>
            <p className="truncate text-xs text-slate-400">{user.email}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onNavigate?.();
            onLogout();
          }}
          className="mt-3 w-full rounded-lg px-3 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

export function AppShell({ user, onLogout, children, sidebar }: AppShellProps) {
  const pathname = usePathname();
  const onRooms = pathname === "/rooms";
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobileNav();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileNavOpen, closeMobileNav]);

  return (
    <AppShellContext.Provider value={{ openMobileNav, closeMobileNav }}>
      <div className="flex h-full overflow-hidden">
        {/* Desktop sidebar */}
        <aside className="hidden h-full w-64 shrink-0 flex-col overflow-hidden border-r border-slate-800 bg-slate-900 lg:flex">
          <SidebarContent
            user={user}
            onLogout={onLogout}
            sidebar={sidebar}
            onRooms={onRooms}
          />
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close menu"
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={closeMobileNav}
            />
            <aside className="relative flex h-full w-[min(88vw,20rem)] flex-col overflow-hidden bg-slate-900 shadow-2xl">
              <SidebarContent
                user={user}
                onLogout={onLogout}
                sidebar={sidebar}
                onRooms={onRooms}
                onNavigate={closeMobileNav}
                showCloseButton
                onClose={closeMobileNav}
              />
            </aside>
          </div>
        )}

        {/* Main */}
        <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden app-gradient">
          {children}
        </div>
      </div>
    </AppShellContext.Provider>
  );
}

interface MobileTopBarProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  user: User;
  onLogout: () => void;
  actions?: React.ReactNode;
  badge?: React.ReactNode;
}

export function MobileTopBar({
  title,
  subtitle,
  backHref,
  backLabel = "Back",
  user,
  onLogout,
  actions,
  badge,
}: MobileTopBarProps) {
  const shell = useAppShell();

  return (
    <header className="shrink-0 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
      <div className="flex h-11 items-center gap-1.5 px-2 sm:h-12 sm:gap-2 sm:px-4 lg:px-6">
        {shell && (
          <button
            type="button"
            aria-label="Open menu"
            onClick={shell.openMobileNav}
            className="shrink-0 rounded-md border border-slate-200 p-1.5 text-slate-600 transition hover:bg-slate-50 lg:hidden"
          >
            <MenuIcon />
          </button>
        )}

        {backHref && (
          <Link
            href={backHref}
            className="shrink-0 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 sm:text-xs lg:hidden"
          >
            ← {backLabel}
          </Link>
        )}

        <div className="flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden sm:gap-2">
          <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {title}
          </h1>
          {badge}
          {subtitle && (
            <>
              <span className="shrink-0 text-slate-300" aria-hidden>
                ·
              </span>
              <span className="truncate text-[11px] text-slate-500 sm:text-xs">
                {subtitle}
              </span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
          {actions}
          <div className="flex items-center gap-1 lg:hidden">
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold text-white sm:h-8 sm:w-8 sm:text-xs"
              style={{ backgroundColor: user.avatarColor }}
              title={user.username}
            >
              {user.username.charAt(0).toUpperCase()}
            </span>
            <button
              type="button"
              onClick={onLogout}
              className="hidden shrink-0 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50 sm:inline-block"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
