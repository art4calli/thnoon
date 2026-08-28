/**
 * Utility to parse and format image and video URLs, including Google Drive,
 * Dropbox, OneDrive, YouTube, Vimeo, and direct media URLs.
 */

export function extractGoogleDriveId(url: string): string | null {
  if (!url || typeof url !== "string") return null;

  // Patterns for Google Drive file URLs
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch && fileDMatch[1]) return fileDMatch[1];

  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (idMatch && idMatch[1]) return idMatch[1];

  const userContentMatch = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (userContentMatch && userContentMatch[1]) return userContentMatch[1];

  return null;
}

export function formatImageUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  let clean = url.trim().replace(/^['"]|['"]$/g, "");
  if (!clean || clean === "-" || clean === "لا يوجد") return "";

  // 1. Google Drive direct link conversion
  if (clean.includes("drive.google.com") || clean.includes("googleusercontent.com")) {
    const driveId = extractGoogleDriveId(clean);
    if (driveId) {
      return `https://lh3.googleusercontent.com/d/${driveId}`;
    }
  }

  // 2. Dropbox conversion to raw direct link
  if (clean.includes("dropbox.com")) {
    return clean
      .replace("www.dropbox.com", "dl.dropboxusercontent.com")
      .replace("?dl=0", "")
      .replace("?dl=1", "");
  }

  return clean;
}

export function isVideoUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com") ||
    lower.endsWith(".mp4") ||
    lower.endsWith(".webm") ||
    lower.endsWith(".mov")
  );
}
