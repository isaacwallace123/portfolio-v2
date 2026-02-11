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
