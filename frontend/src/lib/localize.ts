type LocalizableProject = {
  title: string;
  description: string | null;
  content: string;
  excerpt: string | null;
  titleFr?: string | null;
  descriptionFr?: string | null;
  contentFr?: string | null;
  excerptFr?: string | null;
  [key: string]: unknown;
};

type LocalizableProjectPage = {
  title: string;
  content: string;
  titleFr?: string | null;
  contentFr?: string | null;
  [key: string]: unknown;
};

type LocalizableCategory = {
  name: string;
  nameFr?: string | null;
  [key: string]: unknown;
};

export function localizeProject<T extends LocalizableProject>(project: T, locale: string): T {
  if (locale !== 'fr') return project;
  return {
    ...project,
    title: project.titleFr || project.title,
    description: project.descriptionFr || project.description,
    content: project.contentFr || project.content,
    excerpt: project.excerptFr || project.excerpt,
  };
}

export function localizeProjectPage<T extends LocalizableProjectPage>(page: T, locale: string): T {
  if (locale !== 'fr') return page;
  return {
    ...page,
    title: page.titleFr || page.title,
    content: page.contentFr || page.content,
  };
}

export function localizeCategory<T extends LocalizableCategory>(category: T, locale: string): T {
  if (locale !== 'fr') return category;
  return {
    ...category,
    name: category.nameFr || category.name,
  };
}

type LocalizableExperience = {
  title: string;
  organization: string;
  description: string | null;
  location: string | null;
  jobType: string | null;
  cause: string | null;
  titleFr?: string | null;
  organizationFr?: string | null;
  descriptionFr?: string | null;
  locationFr?: string | null;
  jobTypeFr?: string | null;
  causeFr?: string | null;
  media?: LocalizableExperienceMedia[];
  [key: string]: unknown;
};

type LocalizableExperienceMedia = {
  caption: string | null;
  captionFr?: string | null;
  [key: string]: unknown;
};

export function localizeExperience<T extends LocalizableExperience>(exp: T, locale: string): T {
  if (locale !== 'fr') return exp;
  return {
    ...exp,
    title: exp.titleFr || exp.title,
    organization: exp.organizationFr || exp.organization,
    description: exp.descriptionFr || exp.description,
    location: exp.locationFr || exp.location,
    jobType: exp.jobTypeFr || exp.jobType,
    cause: exp.causeFr || exp.cause,
    media: exp.media?.map(m => localizeExperienceMedia(m, locale)),
  };
}

export function localizeExperienceMedia<T extends LocalizableExperienceMedia>(media: T, locale: string): T {
  if (locale !== 'fr') return media;
  return {
    ...media,
    caption: media.captionFr || media.caption,
  };
}
