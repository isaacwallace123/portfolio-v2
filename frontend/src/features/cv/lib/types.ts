export type CVLocale = 'en' | 'fr';

export type CVMetadata = {
  filePath: string;      // e.g., "/api/uploads/cv_en/resume.pdf"
  fileName: string;      // Original filename
  fileSize: number;      // Bytes
  uploadDate: string;    // ISO date string
  visible: boolean;      // Show on public site
};

export type CVData = {
  en: CVMetadata | null;
  fr: CVMetadata | null;
};
