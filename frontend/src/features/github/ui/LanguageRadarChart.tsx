'use client';

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useGithubStats } from '../hooks/useGithubStats';

const chartConfig = {
  percentage: {
    label: 'Usage',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function LanguageRadarChart() {
  const { stats, loading, error } = useGithubStats();

  if (loading) {
    return (
      <Card className="bg-background/80 backdrop-blur dark:bg-background/60">
        <CardHeader>
          <CardTitle>Languages</CardTitle>
          <CardDescription>Loading GitHub language stats...</CardDescription>
        </CardHeader>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="h-48 w-48 animate-pulse rounded-full bg-muted" />
        </CardContent>
      </Card>
    );
  }

  if (error || !stats || stats.languages.length === 0) {
    return null;
  }

  const abbreviations: Record<string, string> = {
    TypeScript: 'TS',
    JavaScript: 'JS',
    'Jupyter Notebook': 'Jupyter',
  };

  const data = stats.languages.slice(0, 8).map((l) => ({
    language: abbreviations[l.language] || l.language,
    percentage: l.percentage,
  }));

  return (
    <Card className="bg-background/80 backdrop-blur dark:bg-background/60 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle>Languages</CardTitle>
        <CardDescription>
          Most used languages across {stats.repos.length} repositories
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="mx-auto aspect-square max-w-72 lg:max-w-96">
          <RadarChart data={data} outerRadius="55%">
            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => `${value}%`}
                />
              }
            />
            <PolarAngleAxis dataKey="language" tick={{ fontSize: 11 }} />
            <PolarGrid />
            <Radar
              dataKey="percentage"
              fill="var(--color-percentage)"
              fillOpacity={0.5}
              stroke="var(--color-percentage)"
              strokeWidth={2}
            />
            </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
