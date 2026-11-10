"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, ErrorNote, Field, inputClass, useAction } from "@/components/ui";
import { supabase } from "@/lib/supabase";

const MESSAGES: Record<string, string> = {
  "Invalid login credentials": "Correu o contrasenya incorrectes.",
  "Email not confirmed": "Encara no has confirmat el correu. Revisa la safata d'entrada.",
  "User already registered": "Ja existeix un compte amb aquest correu.",
};

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const { busy, error, run } = useAction();

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) router.replace("/");
    });
    return () => data.subscription.unsubscribe();
  }, [router]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setNotice("");
    void run(async () => {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error(MESSAGES[error.message] ?? error.message);
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw new Error(MESSAGES[error.message] ?? error.message);
        if (!data.session) setNotice("T'hem enviat un correu de confirmació. Obre l'enllaç i després inicia sessió.");
      }
    });
  };

  return (
    <main className="grid min-h-dvh place-items-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6">
        <p className="text-3xl" aria-hidden>💶</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Control de diners</h1>
        <p className="mt-1 text-sm text-muted">{mode === "login" ? "Inicia sessió per veure les teves finances." : "Crea el teu compte."}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Correu electrònic">
            <input type="email" autoComplete="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
          </Field>
          <Field label="Contrasenya" hint={mode === "signup" ? "Mínim 8 caràcters." : undefined}>
            <input type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={8} className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <ErrorNote message={error} />
          {notice && <p role="status" className="rounded-lg bg-income/10 px-3 py-2 text-sm text-income">{notice}</p>}
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Un moment…" : mode === "login" ? "Iniciar sessió" : "Crear compte"}
          </Button>
        </form>
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="mt-4 w-full text-center text-sm text-primary hover:underline">
          {mode === "login" ? "No tens compte? Crea'n un" : "Ja tens compte? Inicia sessió"}
        </button>
      </div>
    </main>
  );
}
