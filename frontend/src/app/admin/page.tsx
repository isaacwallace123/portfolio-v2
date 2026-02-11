import { requireAdmin } from "@/features/auth/model/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LayoutDashboard } from "lucide-react";
import { GitHubSettingsCard } from "@/features/settings/ui/GitHubSettingsCard";

async function getStats() {
  const [projectTotal, projectPublished, testimonialTotal, testimonialPending, skillCount, contactTotal, contactUnread, experienceCount] =
    await Promise.all([
      prisma.project.count(),
      prisma.project.count({ where: { published: true } }),
      prisma.testimonial.count(),
      prisma.testimonial.count({ where: { status: 'pending' } }),
      prisma.skill.count(),
      prisma.contactMessage.count(),
      prisma.contactMessage.count({ where: { status: 'unread' } }),
      prisma.experience.count(),
    ]);

  return { projectTotal, projectPublished, testimonialTotal, testimonialPending, skillCount, contactTotal, contactUnread, experienceCount };
}

export default async function AdminDashboard() {
  const user = await requireAdmin();
  const stats = await getStats();

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-primary" />
          Dashboard
        </h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{user.email}</span>
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
        <Link href="/admin/projects">
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.projectPublished}</div>
              <p className="text-xs text-muted-foreground mt-1">
                published of {stats.projectTotal} total
              </p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/testimonials">
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Testimonials</CardTitle>
                {stats.testimonialPending > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {stats.testimonialPending} pending
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.testimonialTotal}</div>
              <p className="text-xs text-muted-foreground mt-1">total testimonials</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/skills">
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.skillCount}</div>
              <p className="text-xs text-muted-foreground mt-1">skill badges on globe</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/experience">
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Experience</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.experienceCount}</div>
              <p className="text-xs text-muted-foreground mt-1">total entries</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/contacts">
          <Card className="bg-background/80 backdrop-blur dark:bg-background/60 hover:border-primary/30 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Contacts</CardTitle>
                {stats.contactUnread > 0 && (
                  <Badge variant="secondary" className="text-[10px]">
                    {stats.contactUnread} unread
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.contactTotal}</div>
              <p className="text-xs text-muted-foreground mt-1">total messages</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* GitHub Settings */}
      <GitHubSettingsCard />
    </div>
  );
}
