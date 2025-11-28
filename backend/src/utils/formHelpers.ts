export interface ReportPhoto {
  name?: string;
  url: string;
  type?: string;
  size?: number;
  originalName?: string;
  fieldId?: string;
}

export function extractPhotosFromFormData(formData: any): ReportPhoto[] {
  const photos: ReportPhoto[] = [];
  if (!formData || typeof formData !== "object") return photos;

  function recurse(obj: any) {
    if (!obj) return;
    if (Array.isArray(obj)) {
      obj.forEach((item) => recurse(item));
    } else if (typeof obj === "object") {
      // If it's array of objects that have url
      const keys = Object.keys(obj);
      if (keys.includes("url") && typeof obj.url === "string") {
        photos.push({
          url: obj.url,
          name: obj.name || obj.originalName || "",
          type: obj.type || "",
          size: obj.size || 0,
          originalName: obj.originalName || obj.name,
          fieldId: obj.fieldId,
        });
        return;
      }
      for (const k in obj) recurse(obj[k]);
    }
  }

  recurse(formData);
  // dedupe by url
  const unique: Record<string, ReportPhoto> = {};
  photos.forEach((p) => (unique[p.url] = p));
  return Object.values(unique);
}

export function extractPathFromUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathMatch = urlObj.pathname.match(/\/o\/(.+)$/);
    return pathMatch ? decodeURIComponent(pathMatch[1]) : url;
  } catch {
    return url;
  }
}

export default { extractPhotosFromFormData, extractPathFromUrl };
