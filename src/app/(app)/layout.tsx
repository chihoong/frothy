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
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-56 flex-shrink-0 flex-col border-r bg-gray-50 md:flex">
        <div className="flex h-14 items-center gap-2 border-b px-4">
          <span className="text-xl">🌊</span>
          <span className="font-bold tracking-tight">Frothy</span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {[
            { href: "/dashboard", label: "Dashboard", icon: "📊" },
            { href: "/sessions", label: "Sessions", icon: "🏄" },
            { href: "/upload", label: "Upload GPX", icon: "📤" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t p-3">
          <NavUser user={session.user} />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex flex-1 flex-col overflow-auto">{children}</main>
    </div>
  );
}
