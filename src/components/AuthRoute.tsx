"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { LogIn } from "lucide-react";
import { resetPassword, signInWithEmail, signInWithGoogle, signUpWithEmail } from "@/lib/supabase";

type Mode = "login" | "signup" | "forgot";

export default function AuthRoute({ mode }: { mode: Mode }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "");
    const password = String(data.get("password") ?? "");
    const name = String(data.get("name") ?? "Leasify User");
    const city = String(data.get("city") ?? "");
    const phone = String(data.get("phone") ?? "");

    try {
      if (mode === "forgot") {
        await resetPassword(email);
        setMessage("Password reset flow started.");
      } else if (mode === "signup") {
        await signUpWithEmail(email, password, name, city, phone);
        setMessage("Account created. You can now continue into Leasify.");
      } else {
        await signInWithEmail(email, password);
        setMessage("Logged in. Session persistence is handled by Supabase when configured.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Auth action failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[var(--bg)] p-4 text-[var(--text)]">
      <form className="glass-panel w-full max-w-md p-6" onSubmit={submit}>
        <Link className="brand" href="/">Leas<span>ify</span></Link>
        <h1 className="mt-6 text-3xl font-black">
          {mode === "login" ? "Log in" : mode === "signup" ? "Sign up" : "Forgot password"}
        </h1>
        <p className="mt-2 text-sm text-[var(--muted)]">
          Sign in or create an account to start renting items and messaging owners.
        </p>
        {mode === "signup" && (
          <>
            <label className="label mt-5">Name<input className="input" name="name" required /></label>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <label className="label">City<input className="input" name="city" required /></label>
              <label className="label">Phone<input className="input" name="phone" type="tel" required /></label>
            </div>
          </>
        )}
        <label className="label mt-4">
          Email
          <input className="input" name="email" type="email" required />
        </label>
        {mode !== "forgot" && (
          <label className="label mt-4">
            Password
            <input className="input" name="password" type="password" required />
          </label>
        )}
        {message && <div className="mt-4 rounded-xl bg-orange-500/10 p-3 text-sm font-bold text-orange-600">{message}</div>}
        <button className="btn-primary mt-5 h-12 w-full justify-center" disabled={busy} type="submit">
          {busy ? "Working..." : "Continue"}
        </button>
        <button className="btn-secondary mt-3 h-12 w-full justify-center" type="button" onClick={() => signInWithGoogle()}>
          <LogIn size={16} />
          Continue with Google
        </button>
        <div className="mt-5 flex justify-between text-sm font-bold text-[var(--muted)]">
          <Link href={mode === "signup" ? "/login" : "/signup"}>{mode === "signup" ? "Log in" : "Create account"}</Link>
          <Link href="/forgot-password">Forgot password</Link>
        </div>
      </form>
    </main>
  );
}
