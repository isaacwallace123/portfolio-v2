import { Suspense } from "react";
import { LoginForm } from "@/features/auth/ui/LoginForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="relative min-h-[calc(100vh-64px)]">
      {/* Background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-background" />
        <div className="absolute inset-0 opacity-[0.18] bg-[radial-gradient(hsl(var(--border))_1px,transparent_1px)] bg-size-[28px_28px]" />
        <div className="absolute left-1/2 top-35 h-130 w-130 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl dark:bg-primary/15" />
      </div>

      <div className="mx-auto flex min-h-[calc(100vh-64px)] w-full max-w-6xl items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md bg-background/80 backdrop-blur dark:bg-background/60">
          <CardHeader>
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Sign in to manage your portfolio content.</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
