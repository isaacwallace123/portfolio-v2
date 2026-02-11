import { requireAdmin } from "@/features/auth/model/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  FolderOpen,
  Settings,
  FileText,
  MessageSquare,
  HardDrive,
  ArrowRight,
  Clock,
  CheckCircle2
} from "lucide-react";

async function getProjectStats() {
  const total = await prisma.project.count();
  const published = await prisma.project.count({ where: { published: true } });

  return { total, published };
}

async function getTestimonialStats() {
  const total = await prisma.testimonial.count();
  const pending = await prisma.testimonial.count({ where: { status: 'pending' } });

  return { total, pending };
}

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const { total, published } = await getProjectStats();
  const { total: testimonialTotal, pending: testimonialPending } = await getTestimonialStats();

  const recentActivity = [
    { action: "Logged in", time: "Just now", status: "success" },
    { action: "System configured", time: "Today", status: "success" },
    { action: "Auth enabled", time: "Today", status: "success" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-8 space-y-8">
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

        <Link href="/admin/projects">
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60 cursor-pointer hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{published}</div>
              <p className="text-xs text-muted-foreground mt-2">
                {published} published of {total} total
              </p>
            </CardContent>
          </Card>
        </Link>

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
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Link href="/admin/projects">
            <Card className="group relative overflow-hidden bg-background/80 backdrop-blur dark:bg-background/60 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-lg">Projects</CardTitle>
                <CardDescription>Manage your portfolio projects</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full justify-between group-hover:text-primary"
                >
                  Open
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/skills">
            <Card className="group relative overflow-hidden bg-background/80 backdrop-blur dark:bg-background/60 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-lg">Skills</CardTitle>
                <CardDescription>Manage your skill badges and globe</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between group-hover:text-primary"
                >
                  Open
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/testimonials">
            <Card className="group relative overflow-hidden bg-background/80 backdrop-blur dark:bg-background/60 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  {testimonialPending > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      {testimonialPending} pending
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg">Testimonials</CardTitle>
                <CardDescription>Review and manage testimonials</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between group-hover:text-primary"
                >
                  Open
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>

          <Link href="/admin/uploads">
            <Card className="group relative overflow-hidden bg-background/80 backdrop-blur dark:bg-background/60 transition-all hover:-translate-y-1 hover:shadow-lg hover:border-primary/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="rounded-lg bg-primary/10 p-2">
                    <HardDrive className="h-5 w-5 text-primary" />
                  </div>
                </div>
                <CardTitle className="text-lg">Uploads</CardTitle>
                <CardDescription>Manage images and documents</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-between group-hover:text-primary"
                >
                  Open
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
              </CardContent>
            </Card>
          </Link>
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
    </div>
  );
}