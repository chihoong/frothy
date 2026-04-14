"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn.email({ email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Sign in failed");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div
      className="flex min-h-screen flex-col bg-background text-foreground"
      style={{ fontFamily: "var(--font-mono), monospace" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-6 py-3">
        <span className="text-xs tracking-widest uppercase">FROTHY</span>
        <Link href="/register" className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
          Register →
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">— AUTHENTICATION</p>
            <h1 className="text-xl uppercase tracking-wide font-light">Sign In</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="email" className="block text-[10px] tracking-widest uppercase text-muted-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-card border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
                placeholder="user@example.com"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="password" className="block text-[10px] tracking-widest uppercase text-muted-foreground">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-2.5 text-xs tracking-widest uppercase font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Authenticating…" : "Sign In →"}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4 space-y-3">
            <button
              type="button"
              onClick={() => signIn.social({ provider: "google", callbackURL: "/dashboard" })}
              className="w-full bg-card border border-border py-2.5 text-xs tracking-widest uppercase text-foreground hover:border-foreground/50 transition-colors"
            >
              Continue with Google
            </button>
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
              No account?{" "}
              <Link href="/register" className="text-foreground hover:underline">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
