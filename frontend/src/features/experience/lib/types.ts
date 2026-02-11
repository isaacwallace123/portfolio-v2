export type ExperienceType = 'WORK' | 'EDUCATION' | 'CERTIFICATION' | 'VOLUNTEER';

export type ExperienceMedia = {
  id: string;
  experienceId: string;
  url: string;
  caption: string | null;
  captionFr: string | null;
  order: number;
  createdAt: string;
};

export type Experience = {
  id: string;
  type: ExperienceType;
  title: string;
  titleFr: string | null;
  organization: string;
  organizationFr: string | null;
  description: string | null;
  descriptionFr: string | null;
  location: string | null;
  locationFr: string | null;
  jobType: string | null;
  jobTypeFr: string | null;
  cause: string | null;
  causeFr: string | null;
  startDate: string | null;
  endDate: string | null;
  credentialId: string | null;
  credentialUrl: string | null;
  skills: string[];
  logo: string | null;
  order: number;
  media: ExperienceMedia[];
  createdAt: string;
  updatedAt: string;
};

export interface CreateExperienceDto {
  type: ExperienceType;
  title: string;
  organization: string;
  description?: string;
  location?: string;
  jobType?: string;
  cause?: string;
  startDate?: string;
  endDate?: string;
  credentialId?: string;
  credentialUrl?: string;
  skills?: string[];
  logo?: string;
  order?: number;
  media?: { url: string; caption?: string; order?: number }[];
}

export type UpdateExperienceDto = Partial<CreateExperienceDto>;
