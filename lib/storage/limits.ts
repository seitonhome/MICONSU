export const MAX_BRANDING_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_PATIENT_DOCUMENT_BYTES = 15 * 1024 * 1024;
export const MAX_RESOURCE_FILE_BYTES = 25 * 1024 * 1024;

export function formatMaxSize(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
