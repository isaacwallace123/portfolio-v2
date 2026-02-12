interface LogLevelRule {
  pattern: RegExp;
  className: string;
  badge: string;
  badgeClass: string;
}

const LOG_LEVEL_RULES: LogLevelRule[] = [
  { pattern: /\[ERROR\]|\[ERR\]|level=error|ERROR:|"level":"error"/i, className: 'text-red-400', badge: 'ERR', badgeClass: 'bg-red-500/20 text-red-400 border-red-500/30' },
  { pattern: /\[WARN\]|\[WARNING\]|level=warn|WARNING:|"level":"warn"/i, className: 'text-amber-400', badge: 'WRN', badgeClass: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  { pattern: /\[OK\]|\[SUCCESS\]|successfully|ready|started|seeded/i, className: 'text-green-400', badge: 'OK', badgeClass: 'bg-green-500/20 text-green-400 border-green-500/30' },
  { pattern: /\[INFO\]|level=info|INFO:|"level":"info"/i, className: 'text-cyan-400', badge: 'INF', badgeClass: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
  { pattern: /\[DEBUG\]|level=debug|DEBUG:|"level":"debug"/i, className: 'text-gray-500', badge: 'DBG', badgeClass: 'bg-gray-500/20 text-gray-500 border-gray-500/30' },
];

const TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T(\d{2}:\d{2}:\d{2})(\.\d+)?Z?\s*/;

export function getLogLineClassName(line: string): string {
  for (const rule of LOG_LEVEL_RULES) {
    if (rule.pattern.test(line)) {
      return rule.className;
    }
  }
  return 'text-foreground/70';
}

export function detectLogLevel(line: string): { badge: string; badgeClass: string } | null {
  for (const rule of LOG_LEVEL_RULES) {
    if (rule.pattern.test(line)) {
      return { badge: rule.badge, badgeClass: rule.badgeClass };
    }
  }
  return null;
}

export function splitTimestamp(line: string): { timestamp: string | null; rest: string } {
  const match = line.match(TIMESTAMP_PATTERN);
  if (match) {
    // Return only HH:MM:SS instead of the full ISO timestamp
    return { timestamp: match[1], rest: line.slice(match[0].length) };
  }
  return { timestamp: null, rest: line };
}
