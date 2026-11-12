"use client";

import type { Session } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { DataProvider } from "@/components/DataProvider";
import { LifeProvider } from "@/components/LifeProvider";
import { supabase } from "@/lib/supabase";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // undefined = encara comprovant; null = sense sessió
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (!s) router.replace("/login");
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  if (!session) return <div className="grid min-h-dvh place-items-center text-muted">Carregant…</div>;
  return (
    <DataProvider session={session}>
      <LifeProvider session={session}>
        <AppShell>{children}</AppShell>
      </LifeProvider>
    </DataProvider>
  );
}
