import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { StravaConnectButton } from "@/components/StravaConnectButton";

export default async function StravaSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ connected?: string; error?: string }>;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");

  const params = await searchParams;
  const stravaToken = await db.stravaToken.findUnique({
    where: { userId: session.user.id },
    select: { athleteId: true, updatedAt: true, scope: true },
  });

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="border-b border-border px-6 py-3">
        <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground transition-colors">Settings</Link>
          {" / "}Strava
        </p>
        <h1 className="text-sm uppercase tracking-wide font-medium">Strava Integration</h1>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-lg space-y-4">
          {params.connected && (
            <div className="border border-border px-5 py-3">
              <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                Strava connected. Sessions will now sync automatically.
              </p>
            </div>
          )}
          {params.error && (
            <div className="border border-destructive/50 px-5 py-3">
              <p className="text-[10px] tracking-widest uppercase text-destructive">
                Connection failed: {params.error.replace(/_/g, " ")}
              </p>
            </div>
          )}

          {/* Status block */}
          <div className="border border-border">
            <div className="px-5 py-3 border-b border-border bg-muted/40">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground">Connection Status</p>
            </div>
            <div className="px-5 py-4 space-y-4">
              {stravaToken ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Athlete</p>
                      <p className="text-xs uppercase tracking-wide"># {stravaToken.athleteId}</p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Last Sync</p>
                      <p className="text-xs uppercase tracking-wide">
                        {stravaToken.updatedAt.toLocaleDateString("en-AU")}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] tracking-widest uppercase text-muted-foreground mb-1">Status</p>
                      <p className="text-[10px] tracking-widest uppercase text-foreground">● Active</p>
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <StravaConnectButton connected />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground">
                    Not connected. Authorise Frothy to read your Strava surfing activities.
                  </p>
                  <StravaConnectButton connected={false} />
                </>
              )}
            </div>
          </div>

          {/* Info block */}
          <div className="border border-border">
            <div className="px-5 py-3 border-b border-border bg-muted/40">
              <p className="text-[9px] tracking-widest uppercase text-muted-foreground">How It Works</p>
            </div>
            <div className="divide-y divide-border">
              {[
                ["Webhook", "New Strava activities trigger an instant sync"],
                ["Filtering", "Only activities tagged as surfing are imported"],
                ["Processing", "GPS tracks are analysed for wave detection"],
              ].map(([label, desc]) => (
                <div key={label} className="px-5 py-3 flex items-start gap-4">
                  <p className="text-[9px] tracking-widest uppercase text-muted-foreground/60 w-20 flex-shrink-0 pt-0.5">{label}</p>
                  <p className="text-[10px] tracking-widest uppercase text-muted-foreground">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
