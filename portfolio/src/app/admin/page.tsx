import { requireAdmin } from "@/features/auth/model/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminDashboard() {
  const user = await requireAdmin();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>

      <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
        <CardHeader>
          <CardTitle>Welcome</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          <p>
            Signed in as <span className="font-medium text-foreground">{user.email}</span>
          </p>
          <p className="mt-1">Role: {user.role}</p>
        </CardContent>
      </Card>
    </div>
  );
}
