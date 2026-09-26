/**
 * Cloudinary por hostname (mismo dist en DonWeb para prod y preview):
 * - preview.fiestasreligiosas.com → nube preview
 * - resto (prod / local apuntando a prod) → nube de producción
 */
const CLOUD_PROD =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "m6cqtqba";
const CLOUD_PREVIEW =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME_PREVIEW || "duuwqmpmn";

export function cloudinaryCloudName() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "preview.fiestasreligiosas.com") return CLOUD_PREVIEW;
  }
  return CLOUD_PROD;
}

/** Si viene URL de otro cloud, la reescribe al cloud del hostname actual. */
export function normalizeCloudinaryUrl(url) {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("res.cloudinary.com")) return url;
  const cloud = cloudinaryCloudName();
  return url.replace(
    /res\.cloudinary\.com\/[^/]+\//,
    `res.cloudinary.com/${cloud}/`,
  );
}

export function cloudinaryUploadUrl(storageKey) {
  if (!storageKey) return null;
  if (/^https?:\/\//i.test(storageKey)) return normalizeCloudinaryUrl(storageKey);
  return `https://res.cloudinary.com/${cloudinaryCloudName()}/image/upload/${storageKey}`;
}
