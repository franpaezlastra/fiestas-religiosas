import { api, uploadImages } from "./apiClient";

export const authService = {
  login: (email, password) =>
    api("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  me: () => api("/auth/me"),
  logout: () => api("/auth/logout", { method: "POST" }),
};

export const celebrationsService = {
  publicList: (params = {}) => {
    const q = new URLSearchParams({ locale: "es", ...params });
    return api(`/public/celebrations?${q}`);
  },
  publicImages: (celebrationId) =>
    api(`/public/celebrations/${celebrationId}/images?locale=es`),
  adminList: () => api("/admin/celebrations"),
  adminGet: (id) => api(`/admin/celebrations/${id}`),
  create: (body) => api("/admin/celebrations", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    api(`/admin/celebrations/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  archive: (id) => api(`/admin/celebrations/${id}`, { method: "DELETE" }),
  /** Preferí /reorder; si el API no lo tiene (404), cae a PATCH displayOrder secuencial. */
  reorder: async (ids) => {
    try {
      return await api("/admin/celebrations/reorder", {
        method: "PUT",
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      if (err.status !== 404) throw err;
      for (let i = 0; i < ids.length; i += 1) {
        await api(`/admin/celebrations/${ids[i]}`, {
          method: "PATCH",
          body: JSON.stringify({ displayOrder: i }),
        });
      }
      return { ids };
    }
  },
  addImage: (id, body) =>
    api(`/admin/celebrations/${id}/images`, { method: "POST", body: JSON.stringify(body) }),
  updateImage: (celebrationId, imageId, body) =>
    api(`/admin/celebrations/${celebrationId}/images/${imageId}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  reorderImages: async (celebrationId, ids) => {
    try {
      return await api(`/admin/celebrations/${celebrationId}/images/reorder`, {
        method: "PUT",
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      if (err.status !== 404) throw err;
      for (let i = 0; i < ids.length; i += 1) {
        await api(`/admin/celebrations/${celebrationId}/images/${ids[i]}`, {
          method: "PATCH",
          body: JSON.stringify({ displayOrder: i }),
        });
      }
      return { ids };
    }
  },
  removeImage: (celebrationId, imageId) =>
    api(`/admin/celebrations/${celebrationId}/images/${imageId}`, { method: "DELETE" }),
  addBook: (celebrationId, body) =>
    api(`/admin/celebrations/${celebrationId}/books`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  removeBook: (celebrationId, bookId) =>
    api(`/admin/celebrations/${celebrationId}/books/${bookId}`, { method: "DELETE" }),
};

export const peopleService = {
  // Sin ?locale=es en list: Vercel CDN cacheó un HIT vacío en esa URL exacta
  publicList: (params = {}) => {
    const q = new URLSearchParams(params);
    const qs = q.toString();
    return api(`/public/people${qs ? `?${qs}` : ""}`);
  },
  /** Solo santos / beatos / causas (canonization). Preferido para /santos. */
  publicHoliness: (params = {}) => {
    const q = new URLSearchParams({ locale: "es", ...params });
    return api(`/public/people/holiness?${q}`);
  },
  /** Destacados (isFeatured): Maradona, Francisco, Messi, etc. */
  publicFeatured: (params = {}) => {
    const q = new URLSearchParams({ locale: "es", ...params });
    return api(`/public/people/featured?${q}`);
  },
  adminList: () => api("/admin/people"),
  adminGet: (id) => api(`/admin/people/${id}`),
  create: (body) => api("/admin/people", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    api(`/admin/people/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  archive: (id) => api(`/admin/people/${id}`, { method: "DELETE" }),
};

export const timelinesService = {
  publicList: () => api("/public/timelines"),
  adminList: () => api("/admin/timelines"),
  adminGet: (id) => api(`/admin/timelines/${id}`),
  create: (body) => api("/admin/timelines", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    api(`/admin/timelines/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  archive: (id) => api(`/admin/timelines/${id}`, { method: "DELETE" }),
  reorder: async (ids) => {
    try {
      return await api("/admin/timelines/reorder", {
        method: "PUT",
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      if (err.status !== 404) throw err;
      for (let i = 0; i < ids.length; i += 1) {
        await api(`/admin/timelines/${ids[i]}`, {
          method: "PATCH",
          body: JSON.stringify({ displayOrder: i }),
        });
      }
      return { ids };
    }
  },
};

export const videosService = {
  publicList: () => api("/public/videos?locale=es"),
  adminList: () => api("/admin/videos"),
  create: (body) => api("/admin/videos", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    api(`/admin/videos/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  archive: (id) => api(`/admin/videos/${id}`, { method: "DELETE" }),
  /** Preferí /reorder; si falta (404), dos fases con órdenes altos para no chocar UNIQUE. */
  reorder: async (ids) => {
    try {
      return await api("/admin/videos/reorder", {
        method: "PUT",
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      if (err.status !== 404) throw err;
      const base = 10000;
      for (let i = 0; i < ids.length; i += 1) {
        await api(`/admin/videos/${ids[i]}`, {
          method: "PATCH",
          body: JSON.stringify({ displayOrder: base + i }),
        });
      }
      for (let i = 0; i < ids.length; i += 1) {
        await api(`/admin/videos/${ids[i]}`, {
          method: "PATCH",
          body: JSON.stringify({ displayOrder: i }),
        });
      }
      return { ids };
    }
  },
};

export const booksService = {
  publicList: () => api("/public/books?locale=es"),
  adminList: () => api("/admin/books"),
  adminGet: (id) => api(`/admin/books/${id}`),
  create: (body) => api("/admin/books", { method: "POST", body: JSON.stringify(body) }),
  update: (id, body) =>
    api(`/admin/books/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  archive: (id) => api(`/admin/books/${id}`, { method: "DELETE" }),
  addPerson: (bookId, body) =>
    api(`/admin/books/${bookId}/people`, { method: "POST", body: JSON.stringify(body) }),
  removePerson: (bookId, personId) =>
    api(`/admin/books/${bookId}/people/${personId}`, { method: "DELETE" }),
};

export const socialService = {
  // footer-links: evita adblockers que cortan paths con "social"
  publicList: () => api("/public/footer-links"),
  /** Admin y public comparten la misma tabla. Si admin 404, cae a public. */
  adminList: async () => {
    try {
      const rows = await api("/admin/footer-links");
      return Array.isArray(rows) ? rows : [];
    } catch (err) {
      if (err.status !== 404) throw err;
      try {
        const rows = await api("/public/footer-links");
        return Array.isArray(rows) ? rows : [];
      } catch {
        const rows = await api("/public/social-links");
        return Array.isArray(rows) ? rows : [];
      }
    }
  },
  upsert: (body) =>
    api("/admin/footer-links", { method: "POST", body: JSON.stringify(body) }),
  remove: (id) => api(`/admin/footer-links/${id}`, { method: "DELETE" }),
  /** Preferí /reorder; si falta (404), dos fases vía upsert (displayOrder UNIQUE). */
  reorder: async (ids, items = []) => {
    try {
      return await api("/admin/footer-links/reorder", {
        method: "PUT",
        body: JSON.stringify({ ids }),
      });
    } catch (err) {
      if (err.status !== 404) throw err;
      const byId = new Map((items || []).map((item) => [item.id, item]));
      const ordered = ids.map((id) => byId.get(id)).filter(Boolean);
      if (ordered.length !== ids.length) throw err;
      const base = 10000;
      for (let i = 0; i < ordered.length; i += 1) {
        await api("/admin/footer-links", {
          method: "POST",
          body: JSON.stringify({
            platform: ordered[i].platform,
            url: ordered[i].url,
            displayOrder: base + i,
          }),
        });
      }
      for (let i = 0; i < ordered.length; i += 1) {
        await api("/admin/footer-links", {
          method: "POST",
          body: JSON.stringify({
            platform: ordered[i].platform,
            url: ordered[i].url,
            displayOrder: i,
          }),
        });
      }
      return { ids };
    }
  },
};

export const provincesService = {
  list: () => api("/public/provinces"),
};

export const mediaService = {
  list: () => api("/admin/media"),
  upload: uploadImages,
  update: (id, body) =>
    api(`/admin/media/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  remove: (id) => api(`/admin/media/${id}`, { method: "DELETE" }),
};
