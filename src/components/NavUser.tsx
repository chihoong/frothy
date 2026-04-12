"use client";

import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

type User = { name: string; email: string; image?: string | null };

export function NavUser({ user }: { user: User }) {
  const router = useRouter();
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  async function handleSignOut() {
    await signOut();
    router.push("/login");
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 px-1 py-1.5 hover:bg-muted transition-colors border border-transparent hover:border-border">
        <div className="flex h-6 w-6 items-center justify-center border border-border text-[9px] tracking-widest bg-muted flex-shrink-0">
          {initials}
        </div>
        <div className="flex-1 text-left overflow-hidden">
          <p className="text-[10px] tracking-wide uppercase font-medium truncate leading-none">{user.name}</p>
          <p className="text-[9px] text-muted-foreground truncate mt-0.5">{user.email}</p>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 bg-card border-border">
        <DropdownMenuItem render={<Link href="/settings" />} className="text-xs tracking-wide uppercase">
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/settings/strava" />} className="text-xs tracking-wide uppercase">
          Strava
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} variant="destructive" className="text-xs tracking-wide uppercase">
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
