import { api, uploadWithProgress } from "../apiClient";

/**
 * Comunidad contra el backend real (docs/COMUNIDAD_API_CONTRATO.md).
 * Mismas firmas que communityMock.js.
 */

const json = (method, body) => ({ method, body: body === undefined ? undefined : JSON.stringify(body) });

function qs(params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v != null && v !== "") q.set(k, String(v));
  });
  const s = q.toString();
  return s ? `?${s}` : "";
}

function imageForm(file, field = "image") {
  const form = new FormData();
  form.append(field, file, file.name || "imagen");
  return form;
}

export const userAuthService = {
  /** `{ data: null }` sin sesión: api() devolvería el body entero, así que se normaliza acá. */
  me: async () => {
    const res = await api("/users/auth/me");
    if (res && typeof res === "object" && "data" in res && !("username" in res)) return res.data;
    return res ?? null;
  },
  checkUsername: (username) => api(`/users/check-username${qs({ username })}`),
  register: (body) => api("/users/auth/register", json("POST", body)),
  login: (body) => api("/users/auth/login", json("POST", body)),
  logout: () => api("/users/auth/logout", { method: "POST" }),
  verifyEmail: (token) => api("/users/auth/verify-email", json("POST", { token })),
  resendVerification: () => api("/users/auth/resend-verification", { method: "POST" }),
  forgotPassword: (body) => api("/users/auth/forgot-password", json("POST", body)),
  resetPassword: (body) => api("/users/auth/reset-password", json("POST", body)),
};

export const meService = {
  update: (body) => api("/me", json("PATCH", body)),
  uploadAvatar: (file, onProgress) => uploadWithProgress("/me/avatar", imageForm(file), onProgress),
  deleteAvatar: () => api("/me/avatar", { method: "DELETE" }),
  changePassword: (body) => api("/me/password", json("POST", body)),
  myPosts: (params = {}) => api(`/me/posts${qs(params)}`),
  exportData: () => api("/me/export"),
  deleteAccount: (body) => api("/me", json("DELETE", body)),
};

export const communityService = {
  listPosts: (params = {}) => api(`/public/community/posts${qs(params)}`),
  getPost: (slug) => api(`/public/community/posts/${encodeURIComponent(slug)}`),
  getUser: (username) => api(`/public/community/users/${encodeURIComponent(username)}`),
  celebrationSummary: (slug) => api(`/public/community/celebrations/${encodeURIComponent(slug)}/summary`),
  uploadImage: (file, onProgress) => uploadWithProgress("/community/uploads", imageForm(file), onProgress),
  createPost: (body) => api("/community/posts", json("POST", body)),
  updatePost: (id, body) => api(`/community/posts/${id}`, json("PATCH", body)),
  deletePost: (id) => api(`/community/posts/${id}`, { method: "DELETE" }),
  like: (id) => api(`/community/posts/${id}/like`, { method: "PUT" }),
  unlike: (id) => api(`/community/posts/${id}/like`, { method: "DELETE" }),
  listComments: (postId, params = {}) => api(`/public/community/posts/${postId}/comments${qs(params)}`),
  listReplies: (commentId, params = {}) => api(`/public/community/comments/${commentId}/replies${qs(params)}`),
  createComment: (postId, body) => api(`/community/posts/${postId}/comments`, json("POST", body)),
  editComment: (id, body) => api(`/community/comments/${id}`, json("PATCH", body)),
  deleteComment: (id) => api(`/community/comments/${id}`, { method: "DELETE" }),
  report: (body) => api("/community/reports", json("POST", body)),
};

export const communityAdminService = {
  stats: () => api("/admin/community/stats"),
  listPosts: (params = {}) => api(`/admin/community/posts${qs(params)}`),
  getPost: (id) => api(`/admin/community/posts/${id}`),
  approve: (id) => api(`/admin/community/posts/${id}/approve`, { method: "POST" }),
  reject: (id, body) => api(`/admin/community/posts/${id}/reject`, json("POST", body)),
  remove: (id, body) => api(`/admin/community/posts/${id}/remove`, json("POST", body)),
  restore: (id) => api(`/admin/community/posts/${id}/restore`, { method: "POST" }),
  deleteComment: (id) => api(`/admin/community/comments/${id}`, { method: "DELETE" }),
  restoreComment: (id) => api(`/admin/community/comments/${id}/restore`, { method: "POST" }),
  listReports: (params = {}) => api(`/admin/community/reports${qs(params)}`),
  resolveReport: (id, body) => api(`/admin/community/reports/${id}/resolve`, json("POST", body)),
  listUsers: (params = {}) => api(`/admin/community/users${qs(params)}`),
  getUser: (id) => api(`/admin/community/users/${id}`),
  suspend: (id, body) => api(`/admin/community/users/${id}/suspend`, json("POST", body)),
  reactivate: (id) => api(`/admin/community/users/${id}/reactivate`, { method: "POST" }),
  updateUser: (id, body) => api(`/admin/community/users/${id}`, json("PATCH", body)),
  getBlockedWords: () => api("/admin/community/blocked-words"),
  setBlockedWords: (body) => api("/admin/community/blocked-words", json("PUT", body)),
};

/** Solo existe en la simulación. */
export const communityMockControls = null;
