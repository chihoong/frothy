import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="p-6 max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Strava integration</h1>

      {params.connected && (
        <div className="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
          Strava connected! Your surf sessions will now sync automatically.
        </div>
      )}
      {params.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
          Connection failed: {params.error.replace(/_/g, " ")}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Strava</CardTitle>
          <CardDescription>
            Connect Strava to automatically import your surfing activities. New
            sessions sync within seconds via webhooks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stravaToken ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                Connected (athlete #{stravaToken.athleteId})
              </div>
              <p className="text-xs text-gray-500">
                Last updated: {stravaToken.updatedAt.toLocaleDateString("en-AU")}
              </p>
              <StravaConnectButton connected />
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                Not connected. Click below to authorise Frothy to read your
                Strava surfing activities.
              </p>
              <StravaConnectButton connected={false} />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
