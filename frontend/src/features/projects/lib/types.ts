export interface ProjectPage {
  id: string;
  projectId: string;
  slug: string;
  title: string;
  content: string;
  order: number;
  isStartPage: boolean;
  position: PagePosition | null | unknown;
  outgoingConnections?: PageConnection[];
  incomingConnections?: PageConnection[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PageConnection {
  id: string;
  sourcePageId: string;
  targetPageId: string;
  label: string | null;
  sourcePage?: ProjectPage;
  targetPage?: ProjectPage;
  createdAt: Date;
}

export interface PagePosition {
  x: number;
  y: number;
}

export interface CreateProjectPageDto {
  projectId: string;
  slug: string;
  title: string;
  content: string;
  order?: number;
  isStartPage?: boolean;
  position?: PagePosition;
}

export interface UpdateProjectPageDto {
  projectId?: string;
  slug?: string;
  title?: string;
  content?: string;
  order?: number;
  isStartPage?: boolean;
  position?: PagePosition;
}

export interface CreatePageConnectionDto {
  sourcePageId: string;
  targetPageId: string;
  label?: string;
}

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
  icon: string | null;
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
  authorId: string;
  author?: {
    id?: string;
    email: string;
    role: string;
  };
  pages?: ProjectPage[];
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
  icon?: string;
  tags?: string[];
  technologies?: string[];
  liveUrl?: string;
  githubUrl?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  order?: number;
}

export interface UpdateProjectDto {
  title?: string;
  slug?: string;
  description?: string;
  content?: string;
  excerpt?: string;
  featured?: boolean;
  published?: boolean;
  thumbnail?: string;
  icon?: string;
  tags?: string[];
  technologies?: string[];
  liveUrl?: string;
  githubUrl?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  order?: number;
}