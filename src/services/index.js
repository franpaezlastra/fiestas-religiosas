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
  // Sin ?locale=es: Vercel CDN cacheó un HIT vacío en esa URL exacta
  publicList: (params = {}) => {
    const q = new URLSearchParams(params);
    const qs = q.toString();
    return api(`/public/people${qs ? `?${qs}` : ""}`);
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
  publicList: () => api("/public/social-links"),
  adminList: () => api("/admin/social-links"),
  upsert: (body) => api("/admin/social-links", { method: "POST", body: JSON.stringify(body) }),
  remove: (id) => api(`/admin/social-links/${id}`, { method: "DELETE" }),
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
