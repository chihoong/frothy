import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { NavUser } from "@/components/NavUser";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "var(--font-mono), monospace" }}>
      {/* Sidebar */}
      <aside className="hidden w-52 flex-shrink-0 flex-col border-r border-border bg-background md:flex">
        {/* Logo */}
        <div className="flex h-12 items-center gap-2 border-b border-border px-4">
          <span className="text-xs tracking-widest uppercase font-medium">FROTHY</span>
          <span className="text-border text-xs">|</span>
          <span className="text-xs tracking-wider text-muted-foreground uppercase">SFC</span>
        </div>

        {/* Nav */}
        <nav className="flex flex-1 flex-col gap-px p-2 pt-3">
          <p className="px-2 pb-1 text-[10px] tracking-widest uppercase text-muted-foreground/60">Navigation</p>
          {[
            { href: "/dashboard", label: "Dashboard", code: "01" },
            { href: "/sessions", label: "Sessions", code: "02" },
            { href: "/quiver", label: "Quiver", code: "03" },
            { href: "/upload", label: "Upload GPX", code: "04" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 px-2 py-2 text-xs tracking-wide uppercase hover:bg-muted transition-colors border border-transparent hover:border-border"
            >
              <span className="text-muted-foreground text-[10px] font-light">{item.code}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User + version */}
        <div className="border-t border-border p-3 space-y-2">
          <NavUser user={session.user} />
          <p className="px-1 text-[10px] tracking-widest uppercase text-muted-foreground/40">v0.1.0</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-auto bg-background">{children}</main>
    </div>
  );
}
