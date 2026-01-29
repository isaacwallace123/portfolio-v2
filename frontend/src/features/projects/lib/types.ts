export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  content: string;
  excerpt: string | null;
  published: boolean;
  featured: boolean;
  thumbnail: string | null;
  tags: string[];
  technologies: string[];
  liveUrl: string | null;
  githubUrl: string | null;
  startDate: Date | null;
  endDate: Date | null;
  order: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    email: string;
    role: string;
  };
}

export interface CreateProjectDto {
  title: string;
  slug: string;
  description?: string;
  content: string;
  excerpt?: string;
  featured?: boolean;
  published?: boolean;
  thumbnail?: string;
  tags?: string[];
  technologies?: string[];
  liveUrl?: string;
  githubUrl?: string;
  startDate?: string;
  endDate?: string;
  order?: number;
}

export interface UpdateProjectDto extends Partial<CreateProjectDto> {
  id: string;
}
