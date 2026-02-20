export type GithubRepo = {
  name: string;
  description: string | null;
  language: string | null;
  html_url: string;
  stars: number;
  forks: number;
  updated_at: string;
  private?: boolean;
  languages: string[];
  languageStats: { language: string; bytes: number; percentage: number }[];
};

export type LanguageStat = {
  language: string;
  bytes: number;
  percentage: number;
};

export type GithubStats = {
  repos: GithubRepo[];
  languages: LanguageStat[];
};
