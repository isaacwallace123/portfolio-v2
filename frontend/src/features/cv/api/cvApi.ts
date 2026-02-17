import { uploadsApi } from '@/features/uploads/api/uploadsApi';
import { settingsApi } from '@/features/settings/api/settingsApi';
import type { CVLocale, CVMetadata, CVData } from '../lib/types';

export const cvApi = {
  /**
   * Upload CV for a specific locale
   */
  async upload(file: File, locale: CVLocale): Promise<CVMetadata> {
    // Validate PDF only
    if (file.type !== 'application/pdf') {
      throw new Error('Only PDF files are allowed');
    }

    const folder = `cv_${locale}`;

    // Delete old CV if exists (cleanup)
    const current = await this.get(locale);
    if (current?.filePath) {
      try {
        const oldFilename = current.filePath.split('/').pop();
        if (oldFilename) {
          await uploadsApi.delete(`${folder}/${oldFilename}`);
        }
      } catch (err) {
        // Ignore error if file doesn't exist
        console.warn('Failed to delete old CV:', err);
      }
    }

    // Upload new CV
    const result = await uploadsApi.upload(file, folder);

    // Update settings with metadata
    const prefix = `cv_${locale}`;
    await settingsApi.update(`${prefix}_file_path`, result.url);
    await settingsApi.update(`${prefix}_file_name`, result.originalName);
    await settingsApi.update(`${prefix}_file_size`, result.size.toString());
    await settingsApi.update(`${prefix}_upload_date`, new Date().toISOString());
    await settingsApi.update(`${prefix}_visible`, 'true'); // Visible by default

    return {
      filePath: result.url,
      fileName: result.originalName,
      fileSize: result.size,
      uploadDate: new Date().toISOString(),
      visible: true,
    };
  },

  /**
   * Get CV metadata for a specific locale
   */
  async get(locale: CVLocale): Promise<CVMetadata | null> {
    try {
      const settingsData = await settingsApi.getAll();
      // Type assertion: settings API returns Record<string, string>
      const settings = settingsData as Record<string, string>;
      const prefix = `cv_${locale}`;

      const filePath = settings[`${prefix}_file_path`];
      if (!filePath) return null;

      return {
        filePath,
        fileName: settings[`${prefix}_file_name`] || 'resume.pdf',
        fileSize: parseInt(settings[`${prefix}_file_size`] || '0', 10),
        uploadDate: settings[`${prefix}_upload_date`] || new Date().toISOString(),
        visible: settings[`${prefix}_visible`] === 'true',
      };
    } catch (err) {
      console.error('Failed to get CV:', err);
      return null;
    }
  },

  /**
   * Get both English and French CVs
   */
  async getAll(): Promise<CVData> {
    const [en, fr] = await Promise.all([
      this.get('en'),
      this.get('fr'),
    ]);

    return { en, fr };
  },

  /**
   * Delete CV for a specific locale
   */
  async delete(locale: CVLocale): Promise<void> {
    const current = await this.get(locale);
    if (!current?.filePath) {
      throw new Error('No CV to delete');
    }

    // Delete file from filesystem
    const folder = `cv_${locale}`;
    const filename = current.filePath.split('/').pop();
    if (filename) {
      await uploadsApi.delete(`${folder}/${filename}`);
    }

    // Clear settings
    const prefix = `cv_${locale}`;
    await settingsApi.update(`${prefix}_file_path`, '');
    await settingsApi.update(`${prefix}_file_name`, '');
    await settingsApi.update(`${prefix}_file_size`, '');
    await settingsApi.update(`${prefix}_upload_date`, '');
    await settingsApi.update(`${prefix}_visible`, 'false');
  },

  /**
   * Toggle visibility for a specific locale
   */
  async setVisibility(locale: CVLocale, visible: boolean): Promise<void> {
    const prefix = `cv_${locale}`;
    await settingsApi.update(`${prefix}_visible`, visible.toString());
  },
};
