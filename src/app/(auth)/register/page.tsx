"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUp } from "@/lib/auth-client";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await signUp.email({ name, email, password });
    setLoading(false);
    if (error) {
      toast.error(error.message ?? "Registration failed");
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
        <Link href="/login" className="text-xs tracking-widest uppercase text-muted-foreground hover:text-foreground transition-colors">
          Sign In →
        </Link>
      </header>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">— NEW ACCOUNT</p>
            <h1 className="text-xl uppercase tracking-wide font-light">Register</h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="name" className="block text-[10px] tracking-widest uppercase text-muted-foreground">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-card border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
                placeholder="Your name"
              />
            </div>
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
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-border px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:border-foreground/50 transition-colors"
                placeholder="Min. 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-foreground text-background py-2.5 text-xs tracking-widest uppercase font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Creating account…" : "Create Account →"}
            </button>
          </form>

          <div className="mt-6 border-t border-border pt-4">
            <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
              Have an account?{" "}
              <Link href="/login" className="text-foreground hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
