// GitHub linguist language colors
const LANGUAGE_COLORS: Record<string, string> = {
  typescript: '#3178c6',
  javascript: '#f1e05a',
  python: '#3572a5',
  go: '#00add8',
  'c#': '#239120',
  'c++': '#f34b7d',
  c: '#555555',
  css: '#563d7c',
  scss: '#c6538c',
  html: '#e34c26',
  shell: '#89e051',
  kotlin: '#a97bff',
  java: '#b07219',
  ruby: '#701516',
  rust: '#dea584',
  php: '#4f5d95',
  swift: '#f05138',
  dockerfile: '#384d54',
  ejs: '#a91e50',
  hlsl: '#aace60',
  shaderlab: '#222c37',
  vue: '#41b883',
  dart: '#00b4ab',
  r: '#198ce7',
  lua: '#000080',
  elixir: '#6e4a7e',
  haskell: '#5e5086',
  scala: '#c22d40',
  powershell: '#012456',
  nix: '#7e7eff',
  makefile: '#427819',
  cmake: '#da3434',
  mdx: '#fcb32c',
};

export function getLanguageColor(lang: string): string {
  return LANGUAGE_COLORS[lang.toLowerCase()] ?? '#8b949e';
}

// Map from GitHub language name to devicon icon name
const DEVICON_MAP: Record<string, string> = {
  typescript: 'typescript',
  javascript: 'javascript',
  python: 'python',
  go: 'go',
  'c#': 'csharp',
  'c++': 'cplusplus',
  c: 'c',
  css: 'css3',
  scss: 'sass',
  html: 'html5',
  shell: 'bash',
  kotlin: 'kotlin',
  java: 'java',
  ruby: 'ruby',
  rust: 'rust',
  php: 'php',
  swift: 'swift',
  dockerfile: 'docker',
  vue: 'vuejs',
  react: 'react',
  'next.js': 'nextjs',
  nextjs: 'nextjs',
  'node.js': 'nodejs',
  nodejs: 'nodejs',
  postgresql: 'postgresql',
  postgres: 'postgresql',
  mysql: 'mysql',
  mongodb: 'mongodb',
  docker: 'docker',
  kubernetes: 'kubernetes',
  'tailwind css': 'tailwindcss',
  tailwindcss: 'tailwindcss',
  dart: 'dart',
  flutter: 'flutter',
  redis: 'redis',
  graphql: 'graphql',
  nginx: 'nginx',
  linux: 'linux',
  git: 'git',
  elixir: 'elixir',
  haskell: 'haskell',
  scala: 'scala',
  lua: 'lua',
  r: 'r',
};

export function getDeviconUrl(lang: string): string | null {
  const key = lang.toLowerCase().trim();
  const name = DEVICON_MAP[key];
  if (!name) return null;
  return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${name}/${name}-original.svg`;
}

/**
 * Maps GitHub-reported language names to their canonical skill equivalents.
 * Prevents duplicate skills when GitHub uses a different name for the same technology.
 * Key: GitHub language name (lowercase). Value: canonical skill label.
 */
const LANGUAGE_ALIASES: Record<string, string> = {
  // PostgreSQL procedural languages
  'plpgsql': 'PostgreSQL',
  'pl/pgsql': 'PostgreSQL',
  'plpython': 'PostgreSQL',
  'plperl': 'PostgreSQL',
  // Other SQL dialects → generic SQL (adjust if you have a specific skill)
  'plsql': 'SQL',
  'tsql': 'SQL',
  't-sql': 'SQL',
  'sqlpl': 'SQL',
  // Shell variants
  'batchfile': 'Batch',
  // Dockerfile → Docker skill
  'dockerfile': 'Docker',
  // Template languages
  'html+erb': 'Ruby',
  'html+django': 'Python',
  'jade': 'Pug',
  // Config/build languages that map to their tool
  'hcl': 'Terraform',
  'nix': 'Nix',
  // Markup
  'mdx': 'MDX',
  'roff': 'Roff',
  // C-family catch-alls
  'objective-c': 'Objective-C',
  'objective-c++': 'Objective-C++',
};

/**
 * Normalizes a raw GitHub language name to the canonical skill label that should
 * be stored or matched against the skills database.
 */
export function normalizeLanguageName(lang: string): string {
  return LANGUAGE_ALIASES[lang.toLowerCase().trim()] ?? lang;
}
