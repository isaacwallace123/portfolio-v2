import { requireAdmin } from "@/features/auth/model/session";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  FolderOpen, 
  Settings, 
  FileText,
  ArrowRight,
  Clock,
  CheckCircle2
} from "lucide-react";

export default async function AdminDashboard() {
  const user = await requireAdmin();

  const quickActions = [
    {
      title: "Projects",
      description: "Manage your portfolio projects",
      icon: FolderOpen,
      href: "/admin/projects",
      badge: "Coming Soon",
    },
    {
      title: "Content",
      description: "Edit pages and sections",
      icon: FileText,
      href: "/admin/content",
      badge: "Coming Soon",
    },
    {
      title: "Settings",
      description: "Configure your portfolio",
      icon: Settings,
      href: "/admin/settings",
      badge: "Coming Soon",
    },
  ];

  const recentActivity = [
    { action: "Logged in", time: "Just now", status: "success" },
    { action: "System configured", time: "Today", status: "success" },
    { action: "Auth enabled", time: "Today", status: "success" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-background/80 backdrop-blur dark:bg-background/60 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
              </div>
              <span className="text-2xl font-bold">Active</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">System operational</p>
          </CardContent>
        </Card>

        <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground mt-2">Published projects</p>
          </CardContent>
        </Card>

        <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Role</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user.role}</div>
            <p className="text-xs text-muted-foreground mt-2">Full access</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Quick Actions</h2>
        </div>
        
        <div className="grid gap-4 md:grid-cols-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card 
                key={action.title}
                className="group relative overflow-hidden bg-background/80 backdrop-blur dark:bg-background/60 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {action.badge && (
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between group-hover:text-primary"
                    disabled={action.badge === "Coming Soon"}
                  >
                    {action.badge === "Coming Soon" ? "Coming Soon" : "Open"}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest actions on this admin panel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((item, index) => (
              <div 
                key={index}
                className="flex items-center justify-between border-b border-border/50 pb-4 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-500/10 p-1.5">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.action}</p>
                    <p className="text-xs text-muted-foreground">{item.time}</p>
                  </div>
                </div>
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                  Success
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started */}
      <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
        <CardHeader>
          <CardTitle>Todo list for portfolio lol</CardTitle>
          <CardDescription>Set up your portfolio in a few steps</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Authentication configured</p>
              <p className="text-xs text-muted-foreground">Your admin panel is now secure with AES-256 encryption</p>
            </div>
          </div>
          <div className="flex items-start gap-3 opacity-50">
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Add your first project</p>
              <p className="text-xs text-muted-foreground">Showcase your work (coming soon)</p>
            </div>
          </div>
          <div className="flex items-start gap-3 opacity-50">
            <div className="h-5 w-5 rounded-full border-2 border-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium text-sm">Customize your content</p>
              <p className="text-xs text-muted-foreground">Edit pages and sections (coming soon)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}