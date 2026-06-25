"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PulseLoader } from "@/components/ui/PulseLoader";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    refreshUser().finally(() => setChecking(false));
  }, [refreshUser]);

  useEffect(() => {
    if (!checking) {
      router.replace(user ? "/rooms" : "/login");
    }
  }, [checking, user, router]);

  return (
    <div className="flex h-full min-h-0 flex-1 items-center justify-center bg-slate-50">
      <PulseLoader />
    </div>
  );
}
