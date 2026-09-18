/** URL de media admin/pública (Cloudinary o url absoluta). */
export function mediaUrl(mediaOrImage) {
  const media = mediaOrImage?.media || mediaOrImage;
  if (!media) return null;
  if (media.url) return media.url;
  if (media.storageKey) {
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "duuwqmpmn";
    return `https://res.cloudinary.com/${cloud}/image/upload/${media.storageKey}`;
  }
  return null;
}

export function primaryImageOf(item) {
  if (!item) return null;
  const img =
    item.images?.find((i) => i.isPrimary) ||
    item.images?.[0] ||
    item.primaryImage ||
    null;
  return img;
}

export function thumbUrl(item) {
  return mediaUrl(primaryImageOf(item)) || mediaUrl(item);
}
