import { api, uploadWithProgress } from "../apiClient";
import { cloudinaryUploadUrl, normalizeCloudinaryUrl } from "../../utils/cloudinary";

/** Novedades contra el backend real (docs/NOVEDADES_API_CONTRATO.md). Mismas firmas que novedadesMock.js. */

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const novedadesService = {
  list: () => api("/public/book-news?locale=es"),
  get: (slug) => api(`/public/book-news/${encodeURIComponent(slug)}?locale=es`),
};

export const adminNovedadesService = {
  list: () => api("/admin/book-news"),
  create: (body) => api("/admin/book-news", json("POST", body)),
  update: (id, body) => api(`/admin/book-news/${id}`, json("PATCH", body)),
  archive: (id) => api(`/admin/book-news/${id}`, { method: "DELETE" }),
  /** Usa la biblioteca de Imágenes que ya existe (POST /admin/media, campo "images"). */
  uploadImage: async (file, onProgress) => {
    const form = new FormData();
    form.append("images", file, file.name || "imagen");
    const res = await uploadWithProgress("/admin/media", form, onProgress);
    const media = Array.isArray(res) ? res[0] : res;
    const url = media.url ? normalizeCloudinaryUrl(media.url) : cloudinaryUploadUrl(media.storageKey);
    return { imageId: media.id, url, width: media.width, height: media.height };
  },
};

/** Solo existe en la simulación. */
export const novedadesMockControls = null;
