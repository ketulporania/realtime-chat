"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { PulseLoader } from "@/components/ui/PulseLoader";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    refreshUser().finally(() => setChecking(false));
  }, [refreshUser]);

  useEffect(() => {
    if (!checking && !user) {
      router.replace("/login");
    }
  }, [checking, user, router]);

  if (checking) {
    return (
      <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-slate-50">
        <PulseLoader message="Checking session..." />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
}
