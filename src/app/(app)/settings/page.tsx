import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-xl">
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>
      <div className="space-y-3">
        <Link href="/settings/strava">
          <Card className="hover:bg-gray-50 cursor-pointer transition-colors">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">Strava integration</CardTitle>
              <CardDescription>
                Connect Strava to auto-sync your surf sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-sm text-primary">Configure →</span>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
