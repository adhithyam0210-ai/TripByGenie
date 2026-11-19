/**
 * Utility to resolve media URLs (images and videos) for proper browser playback.
 * Handles:
 * 1. Windows local file paths (e.g. C:\Users\... or "C:\Users\...") by routing through /api/media/stream
 * 2. Uploaded server media (/uploads/...)
 * 3. External HTTP/HTTPS URLs (Mixkit, Unsplash, etc.)
 * 4. Strips leading/trailing quotes automatically
 */
export const resolveMediaUrl = (url?: string): string => {
  if (!url) return '';
  
  // Clean surrounding whitespace and quotes
  let clean = url.trim().replace(/^["']|["']$/g, '').trim();
  if (!clean) return '';

  // Check if it's a local Windows filesystem path
  if (/^[a-zA-Z]:[\\/]/.test(clean) || clean.startsWith('\\\\')) {
    return `/api/media/stream?path=${encodeURIComponent(clean)}`;
  }

  return clean;
};
