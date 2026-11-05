import { ApiError, api } from "../apiClient";
import { FIESTAS_REF, LIMITES, PROVINCIAS_REF, SANTOS_REF } from "../../utils/comunidad";
import { slugify } from "../../utils/slugify";
import { PASSWORD_PRUEBA, loadDb, removeImage, resetDb, resolveUrl, saveDb, saveImage } from "./mockDb";

/**
 * Comunidad simulada. Mismas firmas y respuestas que communityApi.js
 * (docs/COMUNIDAD_API_CONTRATO.md + docs/COMUNIDAD_CAMBIOS_CONTRATO.md).
 *
 * Para probar errores:
 * - ana@prueba.com           → cuenta sin verificar (EMAIL_NOT_VERIFIED al publicar o comentar)
 * - roberto@prueba.com       → cuenta suspendida (ACCOUNT_SUSPENDED al ingresar)
 * - "bloqueada" en un texto  → CONTENT_BLOCKED
 * - más de 3 comentarios por minuto → RATE_LIMITED
 * - ?mockError=CODIGO en la URL     → ese error en la próxima llamada
 */

const LATENCY_MS = [200, 550];
const COMMENTS_PER_MINUTE = 3;
const APPROVALS_FOR_TRUST = 3;
const REPORTS_TO_HIDE = 3;
const RESERVED = ["admin", "administrador", "peregrinos", "soporte", "moderador", "api", "comunidad", "root"];

function delay(ms) {
  const [min, max] = LATENCY_MS;
  return new Promise((r) => window.setTimeout(r, ms ?? min + Math.random() * (max - min)));
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function fail(code, message, status = 400, details) {
  throw new ApiError({ code, message, details }, status);
}

function invalid(fields) {
  fail(
    "INVALID_REQUEST",
    "Invalid request",
    400,
    Object.entries(fields).map(([field, message]) => ({ path: [field], message })),
  );
}

function forcedError() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("mockError");
    if (!code) return;
    params.delete("mockError");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    fail(code, `Error simulado: ${code}`, 400, code === "RATE_LIMITED" ? { retryAfterSeconds: 30 } : undefined);
  } catch (err) {
    if (err instanceof ApiError) throw err;
  }
}

async function run(fn) {
  await delay();
  forcedError();
  const db = loadDb();
  try {
    const result = await fn(db);
    saveDb(db);
    return clone(result);
  } catch (err) {
    /* Algunos efectos (rate limit, ocultar por denuncias) se guardan aunque falle */
    saveDb(db);
    throw err;
  }
}

function newId(db, prefix) {
  db.seq += 1;
  return `${prefix}-${db.seq}-${Math.random().toString(36).slice(2, 7)}`;
}

function randomToken() {
  return Array.from({ length: 3 }, () => Math.random().toString(36).slice(2)).join("");
}

const now = () => new Date().toISOString();

/* ---------- Usuarios ---------- */

function provinceOf(slug) {
  const p = PROVINCIAS_REF.find((x) => x.slug === slug);
  return p ? { slug: p.slug, name: p.name } : null;
}

function isSuspended(u) {
  if (u.status !== "SUSPENDED") return false;
  return !u.suspendedUntil || new Date(u.suspendedUntil) > new Date();
}

function userStats(db, u) {
  const posts = db.posts.filter((p) => p.authorId === u.id && p.status === "PUBLISHED");
  return { posts: posts.length, likesReceived: posts.reduce((acc, p) => acc + p.likes.length, 0) };
}

function toUserPublic(db, u) {
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    avatarUrl: resolveUrl(u.avatarUrl) || null,
    province: provinceOf(u.provinceSlug),
    bio: u.bio || "",
    createdAt: u.createdAt,
    stats: userStats(db, u),
  };
}

function toMe(db, u) {
  return {
    ...toUserPublic(db, u),
    email: u.email,
    emailVerified: u.emailVerified,
    role: u.role,
    status: isSuspended(u) ? "SUSPENDED" : "ACTIVE",
    suspendedUntil: isSuspended(u) ? u.suspendedUntil : null,
    canPublishDirectly: u.canPublishDirectly,
    hasPassword: Boolean(u.password),
  };
}

function authorOf(db, id) {
  const u = db.users.find((x) => x.id === id);
  if (!u || u.status === "DELETED") return null;
  return { id: u.id, username: u.username, displayName: u.displayName, avatarUrl: resolveUrl(u.avatarUrl) || null };
}

function viewer(db) {
  const id = db.session?.userId;
  const u = id ? db.users.find((x) => x.id === id) : null;
  return u && u.status !== "DELETED" ? u : null;
}

function requireUser(db) {
  const u = viewer(db);
  if (!u) fail("UNAUTHENTICATED", "Tenés que iniciar sesión.", 401);
  if (isSuspended(u)) fail("ACCOUNT_SUSPENDED", "Tu cuenta está suspendida.", 403, { until: u.suspendedUntil });
  return u;
}

function requireVerified(db) {
  const u = requireUser(db);
  if (!u.emailVerified) fail("EMAIL_NOT_VERIFIED", "Confirmá tu email para continuar.", 403);
  return u;
}

function checkCaptcha(token) {
  if (token !== "mock-captcha-ok") fail("CAPTCHA_FAILED", "No pudimos verificar que no seas un robot.", 400);
}

function checkBlocked(db, ...texts) {
  const joined = texts.filter(Boolean).join(" ").toLowerCase();
  const hit = db.blockedWords.find((w) => w && new RegExp(`\\b${escapeRe(w.toLowerCase())}\\b`, "i").test(joined));
  if (hit) fail("CONTENT_BLOCKED", "El texto contiene palabras no permitidas.", 422);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function rateLimit(db, key, max, windowMs) {
  const t = Date.now();
  const hits = (db.rate[key] || []).filter((x) => t - x < windowMs);
  if (hits.length >= max) {
    db.rate[key] = hits;
    fail("RATE_LIMITED", "Demasiadas acciones seguidas.", 429, {
      retryAfterSeconds: Math.ceil((windowMs - (t - hits[0])) / 1000),
    });
  }
  hits.push(t);
  db.rate[key] = hits;
}

function sendMail(db, to, subject, text, link) {
  db.outbox.unshift({ id: newId(db, "mail"), to, subject, text, link, createdAt: now() });
  db.outbox = db.outbox.slice(0, 20);
}

function createToken(db, userId, type, ttlMinutes) {
  const token = randomToken();
  db.tokens.push({ token, userId, type, expiresAt: Date.now() + ttlMinutes * 60000, usedAt: null });
  return token;
}

function consumeToken(db, token, type) {
  const t = db.tokens.find((x) => x.token === token && x.type === type);
  if (!t || t.usedAt || t.expiresAt < Date.now()) fail("INVALID_TOKEN", "El link venció o ya se usó.", 400);
  t.usedAt = Date.now();
  return db.users.find((u) => u.id === t.userId);
}

function sendVerification(db, u) {
  const token = createToken(db, u.id, "EMAIL_VERIFICATION", 48 * 60);
  sendMail(
    db,
    u.email,
    "Confirmá tu cuenta en la Comunidad",
    `Hola ${u.displayName}, confirmá tu email para empezar a publicar.`,
    `/comunidad/verificar?token=${token}`,
  );
}

function validateProfile(db, body, currentId) {
  const errors = {};
  if (body.displayName != null) {
    const v = String(body.displayName).trim();
    if (v.length < LIMITES.displayNameMin || v.length > LIMITES.displayNameMax) {
      errors.displayName = `Entre ${LIMITES.displayNameMin} y ${LIMITES.displayNameMax} caracteres.`;
    }
  }
  if (body.username != null) {
    const v = String(body.username).trim().toLowerCase();
    if (!/^[a-z0-9-]{3,30}$/.test(v)) errors.username = "Entre 3 y 30 caracteres: minúsculas, números y guiones.";
  }
  if (body.bio != null && String(body.bio).length > LIMITES.bio) errors.bio = `Máximo ${LIMITES.bio} caracteres.`;
  if (Object.keys(errors).length) invalid(errors);
  if (body.username != null) {
    const v = String(body.username).trim().toLowerCase();
    if (RESERVED.includes(v) || db.users.some((u) => u.username === v && u.id !== currentId)) {
      fail("USERNAME_TAKEN", "Ese nombre de usuario ya está en uso.", 409);
    }
  }
}

function newUser(db, data) {
  const u = {
    id: newId(db, "u"),
    password: null,
    bio: "",
    avatarUrl: null,
    provinceSlug: null,
    role: "USER",
    status: "ACTIVE",
    suspendedUntil: null,
    suspensionReason: null,
    canPublishDirectly: false,
    approvedPostsCount: 0,
    emailVerified: false,
    createdAt: now(),
    ...data,
  };
  db.users.push(u);
  return u;
}

export const userAuthService = {
  me: () => run((db) => (viewer(db) ? toMe(db, viewer(db)) : null)),

  checkUsername: (username) =>
    run((db) => {
      const v = String(username || "").trim().toLowerCase();
      return { available: !RESERVED.includes(v) && !db.users.some((u) => u.username === v) };
    }),

  register: (body) =>
    run((db) => {
      rateLimit(db, "register", 5, 3600000);
      const errors = {};
      const email = String(body.email || "").trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = "Email inválido.";
      if (String(body.password || "").length < LIMITES.password) errors.password = "Mínimo 10 caracteres.";
      if (!body.acceptedTerms) errors.acceptedTerms = "Obligatorio.";
      if (!body.ageConfirmed) errors.ageConfirmed = "Obligatorio.";
      if (Object.keys(errors).length) invalid(errors);
      validateProfile(db, { displayName: body.displayName, username: body.username });
      checkCaptcha(body.captchaToken);
      if (db.users.some((u) => u.email === email)) fail("EMAIL_TAKEN", "Ese email ya tiene una cuenta.", 409);
      const u = newUser(db, {
        email,
        password: body.password,
        username: body.username.trim().toLowerCase(),
        displayName: body.displayName.trim(),
      });
      sendVerification(db, u);
      db.session = { userId: u.id };
      return toMe(db, u);
    }),

  login: (body) =>
    run((db) => {
      rateLimit(db, "login", 10, 15 * 60000);
      const email = String(body.email || "").trim().toLowerCase();
      const u = db.users.find((x) => x.email === email && x.status !== "DELETED");
      if (!u || !u.password || u.password !== body.password) {
        fail("INVALID_CREDENTIALS", "Email o contraseña incorrectos.", 401);
      }
      if (isSuspended(u)) fail("ACCOUNT_SUSPENDED", "Tu cuenta está suspendida.", 403, { until: u.suspendedUntil });
      db.session = { userId: u.id };
      return toMe(db, u);
    }),

  logout: () =>
    run((db) => {
      db.session = null;
      return null;
    }),

  verifyEmail: (token) =>
    run((db) => {
      const u = consumeToken(db, token, "EMAIL_VERIFICATION");
      u.emailVerified = true;
      return toMe(db, u);
    }),

  resendVerification: () =>
    run((db) => {
      const u = requireUser(db);
      rateLimit(db, `resend:${u.id}`, 3, 3600000);
      if (!u.emailVerified) sendVerification(db, u);
      return null;
    }),

  forgotPassword: (body) =>
    run((db) => {
      rateLimit(db, "forgot", 3, 3600000);
      checkCaptcha(body.captchaToken);
      const u = db.users.find((x) => x.email === String(body.email || "").trim().toLowerCase());
      if (u && u.status !== "DELETED") {
        const token = createToken(db, u.id, "PASSWORD_RESET", 60);
        sendMail(db, u.email, "Restablecé tu contraseña", "Pediste cambiar tu contraseña.", `/comunidad/restablecer?token=${token}`);
      }
      return null;
    }),

  resetPassword: (body) =>
    run((db) => {
      if (String(body.password || "").length < LIMITES.password) invalid({ password: "Mínimo 10 caracteres." });
      const u = consumeToken(db, body.token, "PASSWORD_RESET");
      u.password = body.password;
      if (db.session?.userId === u.id) db.session = null;
      return null;
    }),
};

/* ---------- Mi cuenta ---------- */

async function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function imageSize(file) {
  try {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close?.();
    return size;
  } catch {
    return { width: 1600, height: 1067 };
  }
}

/** Simula el progreso de subida y guarda la imagen en el navegador. */
async function storeUpload(file, onProgress) {
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > LIMITES.imagenBytes) {
    await delay(150);
    fail("MEDIA_UPLOAD_LIMIT", "La imagen supera los 4 MB o no es JPG, PNG o WebP.", 400);
  }
  for (const p of [0.15, 0.4, 0.7, 0.9]) {
    onProgress?.(p);
    await delay(120 + file.size / 40000);
  }
  const [dataUrl, size] = await Promise.all([fileToDataUrl(file), imageSize(file)]);
  onProgress?.(1);
  return { dataUrl, size };
}

function collectExport(db, u) {
  return {
    exportedAt: now(),
    profile: toMe(db, u),
    posts: db.posts.filter((p) => p.authorId === u.id).map((p) => toPost(db, p, u)),
    comments: db.comments
      .filter((c) => c.authorId === u.id && c.status !== "DELETED")
      .map((c) => ({ id: c.id, postId: c.postId, body: c.body, createdAt: c.createdAt })),
    likes: db.posts.filter((p) => p.likes.includes(u.id)).map((p) => ({ postId: p.id, title: p.title })),
    reports: db.reports
      .filter((r) => r.reporterId === u.id)
      .map(({ targetType, targetId, reason, createdAt }) => ({ targetType, targetId, reason, createdAt })),
  };
}

export const meService = {
  update: (body) =>
    run((db) => {
      const u = requireUser(db);
      validateProfile(db, body, u.id);
      if (body.displayName != null) u.displayName = body.displayName.trim();
      if (body.username != null) u.username = body.username.trim().toLowerCase();
      if (body.bio != null) u.bio = body.bio.trim();
      if (body.provinceSlug !== undefined) u.provinceSlug = body.provinceSlug || null;
      checkBlocked(db, u.displayName, u.bio);
      return toMe(db, u);
    }),

  uploadAvatar: async (file, onProgress) => {
    const { dataUrl } = await storeUpload(file, onProgress);
    return run((db) => {
      const u = requireUser(db);
      const id = newId(db, "avatar");
      if (!saveImage(id, dataUrl)) fail("MEDIA_UPLOAD_LIMIT", "El navegador no tiene más espacio. Reiniciá la simulación.", 400);
      if (u.avatarUrl?.startsWith("mock-img:")) removeImage(u.avatarUrl.slice(9));
      u.avatarUrl = `mock-img:${id}`;
      return toMe(db, u);
    });
  },

  deleteAvatar: () =>
    run((db) => {
      const u = requireUser(db);
      if (u.avatarUrl?.startsWith("mock-img:")) removeImage(u.avatarUrl.slice(9));
      u.avatarUrl = null;
      return toMe(db, u);
    }),

  changePassword: (body) =>
    run((db) => {
      const u = requireUser(db);
      if (u.password && u.password !== body.currentPassword) {
        fail("INVALID_CREDENTIALS", "La contraseña actual no es correcta.", 401);
      }
      if (String(body.newPassword || "").length < LIMITES.password) invalid({ newPassword: "Mínimo 10 caracteres." });
      u.password = body.newPassword;
      return null;
    }),

  myPosts: ({ status, cursor } = {}) =>
    run((db) => {
      const u = requireUser(db);
      const list = db.posts
        .filter((p) => p.authorId === u.id && p.status !== "REMOVED" && (!status || p.status === status))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return paginate(list, cursor, 30, (p) => toSummary(db, p, u));
    }),

  exportData: () => run((db) => collectExport(db, requireUser(db))),

  deleteAccount: (body) =>
    run((db) => {
      const u = requireUser(db);
      if (body?.confirm !== "ELIMINAR") invalid({ confirm: 'Escribí "ELIMINAR".' });
      if (u.password && u.password !== body.password) fail("INVALID_CREDENTIALS", "La contraseña no es correcta.", 401);
      const postIds = db.posts.filter((p) => p.authorId === u.id).map((p) => p.id);
      db.comments = db.comments.filter((c) => !postIds.includes(c.postId));
      for (const c of db.comments) {
        if (c.authorId === u.id) Object.assign(c, { authorId: null, body: null, status: "DELETED" });
      }
      for (const up of db.uploads.filter((x) => x.userId === u.id)) removeImage(up.id);
      db.uploads = db.uploads.filter((x) => x.userId !== u.id);
      db.posts = db.posts.filter((p) => p.authorId !== u.id);
      db.posts.forEach((p) => {
        p.likes = p.likes.filter((id) => id !== u.id);
      });
      if (u.avatarUrl?.startsWith("mock-img:")) removeImage(u.avatarUrl.slice(9));
      const short = u.id.slice(-6);
      Object.assign(u, {
        status: "DELETED",
        email: `deleted-${u.id}@invalid`,
        username: `deleted-${short}`,
        displayName: "Cuenta eliminada",
        password: null,
            bio: "",
        avatarUrl: null,
      });
      db.session = null;
      return null;
    }),
};

/* ---------- Publicaciones ---------- */

function excerptOf(body) {
  const plain = String(body || "").replace(/\s+/g, " ").trim();
  if (plain.length <= 220) return plain;
  return `${plain.slice(0, 220).replace(/\s+\S*$/, "")}…`;
}

function visibleComments(db, postId) {
  return db.comments.filter((c) => c.postId === postId && c.status === "VISIBLE");
}

function coverOf(p) {
  const img = p.images.find((i) => i.id === p.coverUploadId) || p.images[0];
  return img ? { url: resolveUrl(img.url), width: img.width, height: img.height, alt: img.alt } : null;
}

function toSummary(db, p, me = viewer(db)) {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: excerptOf(p.body),
    cover: coverOf(p),
    imageCount: p.images.length,
    celebration: p.celebration,
    province: p.province,
    people: p.people,
    yearAttended: p.yearAttended,
    author: authorOf(db, p.authorId),
    likeCount: p.likes.length,
    commentCount: visibleComments(db, p.id).length,
    likedByMe: Boolean(me && p.likes.includes(me.id)),
    isMine: Boolean(me && p.authorId === me.id),
    status: p.status,
    publishedAt: p.publishedAt,
  };
}

function toPost(db, p, me = viewer(db)) {
  const isMine = Boolean(me && p.authorId === me.id);
  return {
    ...toSummary(db, p, me),
    body: p.body,
    images: [...p.images]
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((i) => ({ ...i, url: resolveUrl(i.url) })),
    coverUploadId: p.coverUploadId,
    createdAt: p.createdAt,
    editedAt: p.editedAt,
    moderationNote: isMine ? p.moderationNote : null,
  };
}

function isPublic(p) {
  return p.status === "PUBLISHED" && !p.hidden;
}

function paginate(list, cursor, limit, map) {
  const start = Number(cursor) || 0;
  const size = Math.min(Number(limit) || 12, 30);
  const slice = list.slice(start, start + size);
  return {
    items: slice.map(map),
    nextCursor: start + size < list.length ? String(start + size) : null,
  };
}

function popularity(db, p) {
  const recent = Date.now() - new Date(p.publishedAt || p.createdAt).getTime() < 30 * 86400000;
  return (p.likes.length + visibleComments(db, p.id).length * 2) * (recent ? 2 : 1);
}

let celebrationsCache = null;

/** El backend real resuelve la fiesta por id. La simulación usa la API pública o fiestas.json. */
async function resolveCelebration(id) {
  if (!id) return null;
  const local = FIESTAS_REF.find((f) => f.id === id);
  if (local) return { id: local.id, slug: local.slug, name: local.nombre, provinciaNombre: local.provincia };
  if (!celebrationsCache) {
    try {
      const data = await api("/public/celebrations?locale=es");
      celebrationsCache = Array.isArray(data) ? data : data?.items || [];
    } catch {
      celebrationsCache = [];
    }
  }
  const c = celebrationsCache.find((x) => x.id === id);
  if (!c) return null;
  const tr = c.translation || c.translations?.find((t) => t.locale === "es") || c.translations?.[0];
  return { id: c.id, slug: tr?.slug, name: tr?.name, provinciaSlug: c.province?.slug, provinciaNombre: c.province?.name };
}

function validatePost(db, body, partial) {
  const errors = {};
  const title = body.title != null ? String(body.title).trim() : null;
  const text = body.body != null ? String(body.body).trim() : null;
  if (!partial || title != null) {
    if (!title || title.length < LIMITES.titleMin || title.length > LIMITES.titleMax) {
      errors.title = `El título tiene que tener entre ${LIMITES.titleMin} y ${LIMITES.titleMax} caracteres.`;
    }
  }
  if (!partial || text != null) {
    if (!text || text.length < LIMITES.bodyMin || text.length > LIMITES.bodyMax) {
      errors.body = `El texto tiene que tener entre ${LIMITES.bodyMin} y ${LIMITES.bodyMax.toLocaleString("es-AR")} caracteres.`;
    }
  }
  if ((body.images || []).length > LIMITES.imagenes) errors.images = `Máximo ${LIMITES.imagenes} imágenes.`;
  if ((body.personSlugs || []).length > LIMITES.santos) errors.personSlugs = `Máximo ${LIMITES.santos} santos.`;
  if (body.yearAttended != null) {
    const y = Number(body.yearAttended);
    if (!Number.isInteger(y) || y < 1900 || y > new Date().getFullYear()) {
      errors.yearAttended = `Ingresá un año entre 1900 y ${new Date().getFullYear()}.`;
    }
  }
  if (Object.keys(errors).length) invalid(errors);
  checkBlocked(db, title, text, ...(body.images || []).map((i) => i.alt));
}

async function applyPostFields(db, post, body, u) {
  if (body.title != null) post.title = body.title.trim();
  if (body.body != null) post.body = body.body.trim();
  if (body.yearAttended !== undefined) post.yearAttended = body.yearAttended ? Number(body.yearAttended) : null;
  if (body.personSlugs) {
    post.people = body.personSlugs
      .map((slug) => SANTOS_REF.find((s) => s.slug === slug))
      .filter(Boolean)
      .map((s) => ({ slug: s.slug, displayName: s.name }));
  }
  if (body.celebrationId !== undefined) {
    const c = await resolveCelebration(body.celebrationId);
    post.celebration = c ? { id: c.id, slug: c.slug, name: c.name } : null;
    if (c && !body.provinceSlug) {
      post.province =
        provinceOf(c.provinciaSlug) ||
        PROVINCIAS_REF.find((p) => slugify(p.name) === slugify(c.provinciaNombre || "")) ||
        post.province;
    }
  }
  if (body.provinceSlug !== undefined && body.provinceSlug) post.province = provinceOf(body.provinceSlug);
  else if (body.provinceSlug === null && !post.celebration) post.province = null;

  if (body.images) {
    const prevIds = post.images.map((i) => i.id);
    post.images = body.images.map((img, index) => {
      const up = db.uploads.find((x) => x.id === img.uploadId && x.userId === u.id);
      if (!up || (up.postId && up.postId !== post.id)) {
        fail("INVALID_REQUEST", "Alguna imagen no es válida. Subila de nuevo.", 400);
      }
      up.postId = post.id;
      return {
        id: up.id,
        url: `mock-img:${up.id}`,
        width: up.width,
        height: up.height,
        alt: String(img.alt || "").trim().slice(0, LIMITES.altMax),
        displayOrder: index,
      };
    });
    /* Las imágenes que se sacaron de la publicación se borran */
    for (const id of prevIds.filter((id) => !post.images.some((i) => i.id === id))) {
      db.uploads = db.uploads.filter((x) => x.id !== id);
      removeImage(id);
    }
  }
  if (body.coverUploadId !== undefined || body.images) {
    const wanted = body.coverUploadId ?? post.coverUploadId;
    post.coverUploadId = post.images.some((i) => i.id === wanted) ? wanted : post.images[0]?.id || null;
  }
}

function findPostById(db, id) {
  const p = db.posts.find((x) => x.id === id);
  if (!p) fail("NOT_FOUND", "No encontramos esa publicación.", 404);
  return p;
}

export const communityService = {
  listPosts: (params = {}) =>
    run((db) => {
      const q = String(params.q || "").trim().toLowerCase();
      const author = params.author ? db.users.find((u) => u.username === params.author) : null;
      let list = db.posts.filter(isPublic).filter((p) => {
        if (params.celebration && p.celebration?.slug !== params.celebration) return false;
        if (params.province && p.province?.slug !== params.province) return false;
        if (params.person && !p.people.some((x) => x.slug === params.person)) return false;
        if (params.author && p.authorId !== author?.id) return false;
        if (q && !`${p.title} ${p.body} ${p.celebration?.name || ""}`.toLowerCase().includes(q)) return false;
        return true;
      });
      list =
        params.sort === "popular"
          ? list.sort((a, b) => popularity(db, b) - popularity(db, a) || b.publishedAt.localeCompare(a.publishedAt))
          : list.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      return paginate(list, params.cursor, params.limit || 12, (p) => toSummary(db, p));
    }),

  getPost: (slug) =>
    run((db) => {
      const me = viewer(db);
      const p = db.posts.find((x) => x.slug === slug);
      const isMine = p && me && p.authorId === me.id;
      if (!p || p.status === "REMOVED" || (!isPublic(p) && !isMine)) {
        fail("NOT_FOUND", "No encontramos esa publicación.", 404);
      }
      return toPost(db, p, me);
    }),

  getUser: (username) =>
    run((db) => {
      const u = db.users.find((x) => x.username === username && x.status !== "DELETED");
      if (!u) fail("NOT_FOUND", "No encontramos ese perfil.", 404);
      return toUserPublic(db, u);
    }),

  celebrationSummary: (slug) =>
    run((db) => {
      const list = db.posts
        .filter((p) => isPublic(p) && p.celebration?.slug === slug)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
      return { postCount: list.length, latest: list.slice(0, 3).map((p) => toSummary(db, p)) };
    }),

  uploadImage: async (file, onProgress) => {
    await run((db) => {
      const u = requireVerified(db);
      rateLimit(db, `upload:${u.id}`, 30, 3600000);
    });
    const { dataUrl, size } = await storeUpload(file, onProgress);
    return run((db) => {
      const u = requireVerified(db);
      const id = newId(db, "up");
      if (!saveImage(id, dataUrl)) {
        fail("MEDIA_UPLOAD_LIMIT", "El navegador no tiene más espacio para la simulación. Reiniciá los datos.", 400);
      }
      db.uploads.push({ id, userId: u.id, postId: null, ...size, createdAt: now() });
      return { uploadId: id, url: dataUrl, ...size };
    });
  },

  createPost: (body) =>
    run(async (db) => {
      const u = requireVerified(db);
      validatePost(db, body, false);
      rateLimit(db, `post:${u.id}`, u.canPublishDirectly ? 5 : 2, 86400000);
      const id = newId(db, "p");
      const post = {
        id,
        slug: `${slugify(body.title).slice(0, 80)}-${Math.random().toString(36).slice(2, 8)}`,
        authorId: u.id,
        title: "",
        body: "",
        celebration: null,
        province: null,
        people: [],
        yearAttended: null,
        images: [],
        coverUploadId: null,
        status: u.canPublishDirectly ? "PUBLISHED" : "PENDING",
        moderationNote: null,
        likes: [],
        reportCount: 0,
        createdAt: now(),
        publishedAt: u.canPublishDirectly ? now() : null,
        editedAt: null,
        history: [{ action: "CREATED", note: null, at: now() }],
      };
      await applyPostFields(db, post, { ...body, images: body.images || [] }, u);
      db.posts.unshift(post);
      return toPost(db, post, u);
    }),

  updatePost: (id, body) =>
    run(async (db) => {
      const u = requireVerified(db);
      const post = findPostById(db, id);
      if (post.authorId !== u.id) fail("FORBIDDEN", "Solo el autor puede editar.", 403);
      if (post.status === "REMOVED") fail("NOT_FOUND", "No encontramos esa publicación.", 404);
      validatePost(db, body, true);
      await applyPostFields(db, post, body, u);
      post.editedAt = now();
      if (post.status === "REJECTED" || (post.status === "PUBLISHED" && !u.canPublishDirectly)) {
        post.status = "PENDING";
        post.moderationNote = null;
      }
      post.history.push({ action: "EDITED", note: null, at: now() });
      return toPost(db, post, u);
    }),

  deletePost: (id) =>
    run((db) => {
      const u = requireUser(db);
      const post = findPostById(db, id);
      if (post.authorId !== u.id) fail("FORBIDDEN", "Solo el autor puede borrar.", 403);
      for (const img of post.images) {
        db.uploads = db.uploads.filter((x) => x.id !== img.id);
        removeImage(img.id);
      }
      db.posts = db.posts.filter((p) => p.id !== id);
      db.comments = db.comments.filter((c) => c.postId !== id);
      return null;
    }),

  like: (id) =>
    run((db) => {
      const u = requireVerified(db);
      rateLimit(db, `like:${u.id}`, 120, 60000);
      const p = findPostById(db, id);
      if (!isPublic(p)) fail("NOT_FOUND", "No encontramos esa publicación.", 404);
      if (!p.likes.includes(u.id)) p.likes.push(u.id);
      return { liked: true, likeCount: p.likes.length };
    }),

  unlike: (id) =>
    run((db) => {
      const u = requireVerified(db);
      const p = findPostById(db, id);
      p.likes = p.likes.filter((x) => x !== u.id);
      return { liked: false, likeCount: p.likes.length };
    }),

  /* ---------- Comentarios ---------- */

  listComments: (postId, { cursor, limit = 20 } = {}) =>
    run((db) => {
      const me = viewer(db);
      const p = findPostById(db, postId);
      if (!isPublic(p) && p.authorId !== me?.id) fail("NOT_FOUND", "No encontramos esa publicación.", 404);
      const roots = db.comments
        .filter((c) => c.postId === postId && !c.parentId)
        .filter((c) => c.status === "VISIBLE" || (c.status === "DELETED" && repliesOf(db, c.id).length))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return paginate(roots, cursor, limit, (c) => toComment(db, c, me, 3));
    }),

  listReplies: (commentId, { cursor } = {}) =>
    run((db) => {
      const me = viewer(db);
      return paginate(repliesOf(db, commentId), cursor, 20, (c) => toComment(db, c, me));
    }),

  createComment: (postId, body) =>
    run((db) => {
      const u = requireVerified(db);
      const p = findPostById(db, postId);
      if (!isPublic(p)) fail("FORBIDDEN", "Solo se puede comentar en publicaciones publicadas.", 403);
      const text = String(body.body || "").trim();
      if (!text || text.length > LIMITES.comment) invalid({ body: `Entre 1 y ${LIMITES.comment} caracteres.` });
      if (body.parentId) {
        const parent = db.comments.find((c) => c.id === body.parentId);
        if (!parent || parent.postId !== postId || parent.parentId) {
          fail("INVALID_REQUEST", "Solo se puede responder a un comentario principal.", 400);
        }
      }
      checkBlocked(db, text);
      rateLimit(db, `comment:${u.id}`, COMMENTS_PER_MINUTE, 60000);
      const c = {
        id: newId(db, "c"),
        postId,
        parentId: body.parentId || null,
        authorId: u.id,
        body: text,
        createdAt: now(),
        editedAt: null,
        status: "VISIBLE",
        reportCount: 0,
      };
      db.comments.push(c);
      return toComment(db, c, u, 3);
    }),

  editComment: (id, body) =>
    run((db) => {
      const u = requireVerified(db);
      const c = db.comments.find((x) => x.id === id);
      if (!c || c.status === "DELETED") fail("NOT_FOUND", "No encontramos ese comentario.", 404);
      if (c.authorId !== u.id) fail("FORBIDDEN", "Solo el autor puede editar.", 403);
      if (Date.now() - new Date(c.createdAt).getTime() > LIMITES.edicionComentarioMin * 60000) {
        fail("FORBIDDEN", "Los comentarios se pueden editar solo durante 15 minutos.", 403, {
          reason: "EDIT_WINDOW_EXPIRED",
        });
      }
      const text = String(body.body || "").trim();
      if (!text || text.length > LIMITES.comment) invalid({ body: `Entre 1 y ${LIMITES.comment} caracteres.` });
      checkBlocked(db, text);
      c.body = text;
      c.editedAt = now();
      return toComment(db, c, u, 3);
    }),

  deleteComment: (id) =>
    run((db) => {
      const u = requireUser(db);
      const c = db.comments.find((x) => x.id === id);
      if (!c || c.status === "DELETED") fail("NOT_FOUND", "No encontramos ese comentario.", 404);
      const post = db.posts.find((p) => p.id === c.postId);
      if (c.authorId !== u.id && post?.authorId !== u.id) fail("FORBIDDEN", "No podés borrar este comentario.", 403);
      c.status = "DELETED";
      c.body = null;
      return null;
    }),

  /* ---------- Denuncias ---------- */

  report: (body) =>
    run((db) => {
      const u = requireUser(db);
      rateLimit(db, `report:${u.id}`, 20, 86400000);
      const { targetType, targetId, reason } = body || {};
      if (!["POST", "COMMENT", "USER"].includes(targetType)) invalid({ targetType: "Inválido." });
      if (reason === "OTHER" && !String(body.details || "").trim()) invalid({ details: "Contanos el motivo." });
      if (String(body.details || "").length > LIMITES.reportDetails) invalid({ details: "Máximo 500 caracteres." });
      const target = findTarget(db, targetType, targetId);
      if (!target) fail("NOT_FOUND", "No encontramos ese contenido.", 404);
      if ((target.authorId || target.id) === u.id) fail("FORBIDDEN", "No podés denunciar tu propio contenido.", 403);
      if (db.reports.some((r) => r.reporterId === u.id && r.targetType === targetType && r.targetId === targetId)) {
        fail("ALREADY_REPORTED", "Ya denunciaste este contenido.", 409);
      }
      const r = {
        id: newId(db, "r"),
        reporterId: u.id,
        targetType,
        targetId,
        reason,
        details: body.details?.trim() || null,
        status: "OPEN",
        createdAt: now(),
      };
      db.reports.push(r);
      const open = db.reports.filter((x) => x.targetType === targetType && x.targetId === targetId && x.status === "OPEN");
      const reporters = new Set(open.map((x) => x.reporterId));
      if (targetType === "POST") target.reportCount = open.length;
      if (reporters.size >= REPORTS_TO_HIDE) {
        if (targetType === "POST") target.hidden = true;
        if (targetType === "COMMENT" && target.status === "VISIBLE") target.status = "HIDDEN";
      }
      return { id: r.id };
    }),
};

function repliesOf(db, commentId) {
  return db.comments
    .filter((c) => c.parentId === commentId && c.status === "VISIBLE")
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function toComment(db, c, me, maxReplies) {
  const deleted = c.status === "DELETED";
  const replies = c.parentId ? null : repliesOf(db, c.id);
  return {
    id: c.id,
    postId: c.postId,
    parentId: c.parentId,
    body: deleted ? null : c.body,
    author: deleted ? null : authorOf(db, c.authorId),
    createdAt: c.createdAt,
    editedAt: c.editedAt,
    isMine: Boolean(me && !deleted && c.authorId === me.id),
    deleted,
    replies: replies ? replies.slice(0, maxReplies ?? replies.length).map((r) => toComment(db, r, me)) : [],
    replyCount: replies ? replies.length : 0,
  };
}

function findTarget(db, type, id) {
  if (type === "POST") return db.posts.find((p) => p.id === id);
  if (type === "COMMENT") return db.comments.find((c) => c.id === id);
  return db.users.find((u) => u.id === id && u.status !== "DELETED");
}

/* ---------- Admin ---------- */

function log(db, action, targetType, targetId, note) {
  db.moderationLog.unshift({ id: newId(db, "log"), action, targetType, targetId, note: note || null, at: now() });
}

function adminUser(db, u) {
  return {
    ...toUserPublic(db, u),
    email: u.email,
    emailVerified: u.emailVerified,
    status: isSuspended(u) ? "SUSPENDED" : u.status === "DELETED" ? "DELETED" : "ACTIVE",
    suspendedUntil: isSuspended(u) ? u.suspendedUntil : null,
    suspensionReason: isSuspended(u) ? u.suspensionReason : null,
    canPublishDirectly: u.canPublishDirectly,
    approvedPostsCount: u.approvedPostsCount,
    reportsReceived: reportsAgainstUser(db, u.id).length,
  };
}

function reportsAgainstUser(db, userId) {
  return db.reports.filter((r) => {
    if (r.targetType === "USER") return r.targetId === userId;
    const t = findTarget(db, r.targetType, r.targetId);
    return t?.authorId === userId;
  });
}

function adminPostSummary(db, p) {
  const author = db.users.find((u) => u.id === p.authorId);
  return {
    ...toSummary(db, p, null),
    author: { ...authorOf(db, p.authorId), email: author?.email },
    createdAt: p.createdAt,
    reportCount: db.reports.filter((r) => r.targetType === "POST" && r.targetId === p.id && r.status === "OPEN").length,
    hidden: Boolean(p.hidden),
  };
}

function reportOut(db, r) {
  const reporter = db.users.find((u) => u.id === r.reporterId);
  return {
    id: r.id,
    reason: r.reason,
    details: r.details,
    status: r.status,
    createdAt: r.createdAt,
    reporter: reporter ? { username: reporter.username, displayName: reporter.displayName } : null,
  };
}

function targetPreview(db, type, id) {
  const t = findTarget(db, type, id);
  if (!t) return { missing: true };
  if (type === "POST") {
    return {
      title: t.title,
      excerpt: excerptOf(t.body),
      url: `/comunidad/p/${t.slug}`,
      status: t.status,
      hidden: Boolean(t.hidden),
      author: authorOf(db, t.authorId),
    };
  }
  if (type === "COMMENT") {
    const post = db.posts.find((p) => p.id === t.postId);
    return {
      body: t.body,
      url: post ? `/comunidad/p/${post.slug}#comentario-${t.id}` : null,
      postTitle: post?.title || null,
      status: t.status,
      hidden: t.status === "HIDDEN",
      author: authorOf(db, t.authorId),
    };
  }
  return {
    username: t.username,
    displayName: t.displayName,
    url: `/comunidad/u/${t.username}`,
    status: isSuspended(t) ? "SUSPENDED" : "ACTIVE",
    author: authorOf(db, t.id),
  };
}

function findAdminUser(db, id) {
  const u = db.users.find((x) => x.id === id);
  if (!u) fail("NOT_FOUND", "Usuario no encontrado.", 404);
  return u;
}

function suspendUser(db, u, days, reason) {
  u.status = "SUSPENDED";
  u.suspendedUntil = days ? new Date(Date.now() + days * 86400000).toISOString() : null;
  u.suspensionReason = reason || null;
  if (db.session?.userId === u.id) db.session = null;
  sendMail(db, u.email, "Tu cuenta fue suspendida", reason || "Incumpliste las normas de la comunidad.", "/comunidad/normas");
  log(db, "SUSPEND_USER", "USER", u.id, reason);
}

function setTargetVisible(db, type, id) {
  const t = findTarget(db, type, id);
  if (!t) return;
  if (type === "POST") t.hidden = false;
  if (type === "COMMENT" && t.status === "HIDDEN") t.status = "VISIBLE";
}

function closeReports(db, type, id, status, note) {
  for (const r of db.reports) {
    if (r.targetType === type && r.targetId === id && r.status === "OPEN") {
      r.status = status;
      r.resolvedAt = now();
      r.resolutionNote = note || null;
    }
  }
  const post = type === "POST" ? db.posts.find((p) => p.id === id) : null;
  if (post) post.reportCount = 0;
}

export const communityAdminService = {
  stats: () =>
    run((db) => ({
      pendingPosts: db.posts.filter((p) => p.status === "PENDING").length,
      openReports: new Set(db.reports.filter((r) => r.status === "OPEN").map((r) => `${r.targetType}:${r.targetId}`)).size,
      newUsersThisWeek: db.users.filter((u) => Date.now() - new Date(u.createdAt).getTime() < 7 * 86400000).length,
    })),

  listPosts: ({ status = "PENDING", q } = {}) =>
    run((db) => {
      const query = String(q || "").toLowerCase();
      const list = db.posts
        .filter((p) => !status || p.status === status)
        .filter((p) => !query || p.title.toLowerCase().includes(query))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { items: list.map((p) => adminPostSummary(db, p)), nextCursor: null };
    }),

  getPost: (id) =>
    run((db) => {
      const p = findPostById(db, id);
      const author = db.users.find((u) => u.id === p.authorId);
      return {
        ...toPost(db, p, null),
        moderationNote: p.moderationNote,
        hidden: Boolean(p.hidden),
        author: author ? adminUser(db, author) : null,
        reports: db.reports.filter((r) => r.targetType === "POST" && r.targetId === p.id).map((r) => reportOut(db, r)),
        history: [
          ...p.history,
          ...db.moderationLog.filter((l) => l.targetType === "POST" && l.targetId === p.id).map((l) => ({
            action: l.action,
            note: l.note,
            at: l.at,
          })),
        ].sort((a, b) => b.at.localeCompare(a.at)),
      };
    }),

  approve: (id) =>
    run((db) => {
      const p = findPostById(db, id);
      p.status = "PUBLISHED";
      p.publishedAt = p.publishedAt || now();
      p.moderationNote = null;
      const author = db.users.find((u) => u.id === p.authorId);
      if (author) {
        author.approvedPostsCount += 1;
        if (author.approvedPostsCount >= APPROVALS_FOR_TRUST) author.canPublishDirectly = true;
        sendMail(db, author.email, "Tu publicación fue aprobada", `"${p.title}" ya está publicada.`, `/comunidad/p/${p.slug}`);
      }
      log(db, "APPROVE_POST", "POST", p.id);
      return adminPostSummary(db, p);
    }),

  reject: (id, { note } = {}) =>
    run((db) => {
      if (!String(note || "").trim()) invalid({ note: "Escribí el motivo para el autor." });
      const p = findPostById(db, id);
      p.status = "REJECTED";
      p.moderationNote = note.trim();
      const author = db.users.find((u) => u.id === p.authorId);
      if (author) sendMail(db, author.email, "Tu publicación no fue aprobada", note.trim(), "/comunidad/mi-cuenta#mis-publicaciones");
      log(db, "REJECT_POST", "POST", p.id, note);
      return adminPostSummary(db, p);
    }),

  remove: (id, { note } = {}) =>
    run((db) => {
      const p = findPostById(db, id);
      p.status = "REMOVED";
      closeReports(db, "POST", id, "ACTIONED", note);
      log(db, "REMOVE_POST", "POST", p.id, note);
      return adminPostSummary(db, p);
    }),

  restore: (id) =>
    run((db) => {
      const p = findPostById(db, id);
      p.status = "PUBLISHED";
      p.hidden = false;
      p.publishedAt = p.publishedAt || now();
      closeReports(db, "POST", id, "DISMISSED");
      log(db, "RESTORE_POST", "POST", p.id);
      return adminPostSummary(db, p);
    }),

  deleteComment: (id) =>
    run((db) => {
      const c = db.comments.find((x) => x.id === id);
      if (!c) fail("NOT_FOUND", "Comentario no encontrado.", 404);
      c.status = "DELETED";
      c.body = null;
      closeReports(db, "COMMENT", id, "ACTIONED");
      log(db, "DELETE_COMMENT", "COMMENT", id);
      return null;
    }),

  restoreComment: (id) =>
    run((db) => {
      const c = db.comments.find((x) => x.id === id);
      if (!c) fail("NOT_FOUND", "Comentario no encontrado.", 404);
      if (c.status === "HIDDEN") c.status = "VISIBLE";
      closeReports(db, "COMMENT", id, "DISMISSED");
      log(db, "RESTORE_COMMENT", "COMMENT", id);
      return null;
    }),

  /** Denuncias agrupadas por contenido (AdminReportGroup, ver COMUNIDAD_CAMBIOS_CONTRATO.md). */
  listReports: ({ status = "OPEN", targetType } = {}) =>
    run((db) => {
      const groups = new Map();
      for (const r of db.reports) {
        if (status && r.status !== status) continue;
        if (targetType && r.targetType !== targetType) continue;
        const key = `${r.targetType}:${r.targetId}`;
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(r);
      }
      const items = [...groups.values()].map((list) => {
        const sorted = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        const reasons = {};
        sorted.forEach((r) => {
          reasons[r.reason] = (reasons[r.reason] || 0) + 1;
        });
        return {
          id: sorted[0].id,
          targetType: sorted[0].targetType,
          targetId: sorted[0].targetId,
          target: targetPreview(db, sorted[0].targetType, sorted[0].targetId),
          count: sorted.length,
          reasons,
          reports: sorted.map((r) => reportOut(db, r)),
          firstReportedAt: sorted[0].createdAt,
          lastReportedAt: sorted[sorted.length - 1].createdAt,
        };
      });
      items.sort((a, b) => b.count - a.count || b.lastReportedAt.localeCompare(a.lastReportedAt));
      return { items, nextCursor: null };
    }),

  /** Resuelve todas las denuncias abiertas del mismo contenido. */
  resolveReport: (id, { action, note } = {}) =>
    run((db) => {
      const r = db.reports.find((x) => x.id === id);
      if (!r) fail("NOT_FOUND", "Denuncia no encontrada.", 404);
      const target = findTarget(db, r.targetType, r.targetId);
      if (action === "DISMISS") {
        setTargetVisible(db, r.targetType, r.targetId);
        closeReports(db, r.targetType, r.targetId, "DISMISSED", note);
      } else if (action === "REMOVE_CONTENT") {
        if (r.targetType === "USER") fail("INVALID_REQUEST", "Para un usuario, usá suspender.", 400);
        if (r.targetType === "POST" && target) target.status = "REMOVED";
        if (r.targetType === "COMMENT" && target) Object.assign(target, { status: "DELETED", body: null });
        closeReports(db, r.targetType, r.targetId, "ACTIONED", note);
      } else if (action === "SUSPEND_USER") {
        const userId = r.targetType === "USER" ? r.targetId : target?.authorId;
        const u = db.users.find((x) => x.id === userId);
        if (!u) fail("NOT_FOUND", "El autor ya no existe.", 404);
        suspendUser(db, u, 7, note || "Denuncias de la comunidad");
        closeReports(db, r.targetType, r.targetId, "ACTIONED", note);
      } else {
        invalid({ action: "Acción inválida." });
      }
      log(db, `REPORT_${action}`, r.targetType, r.targetId, note);
      return null;
    }),

  listUsers: ({ q, status } = {}) =>
    run((db) => {
      const query = String(q || "").toLowerCase();
      const items = db.users
        .filter((u) => u.status !== "DELETED")
        .map((u) => adminUser(db, u))
        .filter((u) => !status || u.status === status)
        .filter(
          (u) =>
            !query ||
            u.username.includes(query) ||
            u.displayName.toLowerCase().includes(query) ||
            u.email.includes(query),
        )
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return { items, nextCursor: null };
    }),

  getUser: (id) =>
    run((db) => {
      const u = findAdminUser(db, id);
      return {
        ...adminUser(db, u),
        posts: db.posts
          .filter((p) => p.authorId === u.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((p) => adminPostSummary(db, p)),
        comments: db.comments
          .filter((c) => c.authorId === u.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 20)
          .map((c) => {
            const post = db.posts.find((p) => p.id === c.postId);
            return { id: c.id, body: c.body, status: c.status, createdAt: c.createdAt, postTitle: post?.title, postSlug: post?.slug };
          }),
        reportsReceived: reportsAgainstUser(db, u.id).map((r) => ({ ...reportOut(db, r), targetType: r.targetType })),
      };
    }),

  suspend: (id, { days, reason } = {}) =>
    run((db) => {
      if (!String(reason || "").trim()) invalid({ reason: "Escribí el motivo." });
      const u = findAdminUser(db, id);
      suspendUser(db, u, days, reason.trim());
      return adminUser(db, u);
    }),

  reactivate: (id) =>
    run((db) => {
      const u = findAdminUser(db, id);
      Object.assign(u, { status: "ACTIVE", suspendedUntil: null, suspensionReason: null });
      log(db, "REACTIVATE_USER", "USER", id);
      return adminUser(db, u);
    }),

  updateUser: (id, { canPublishDirectly } = {}) =>
    run((db) => {
      const u = findAdminUser(db, id);
      u.canPublishDirectly = Boolean(canPublishDirectly);
      log(db, canPublishDirectly ? "TRUST_USER" : "UNTRUST_USER", "USER", id);
      return adminUser(db, u);
    }),

  getBlockedWords: () => run((db) => ({ words: db.blockedWords })),

  setBlockedWords: ({ words } = {}) =>
    run((db) => {
      db.blockedWords = [...new Set((words || []).map((w) => String(w).trim().toLowerCase()).filter(Boolean))].sort();
      return { words: db.blockedWords };
    }),
};

/* ---------- Solo simulación ---------- */

export const communityMockControls = {
  password: PASSWORD_PRUEBA,
  outbox: () => loadDb().outbox,
  testUsers: () =>
    loadDb()
      .users.filter((u) => u.status !== "DELETED" && u.password)
      .map((u) => ({ email: u.email, displayName: u.displayName, nota: notaPrueba(u) })),
  reset: () => {
    resetDb();
  },
};

function notaPrueba(u) {
  if (isSuspended(u)) return "suspendida";
  if (!u.emailVerified) return "email sin confirmar";
  if (!u.canPublishDirectly) return "nueva: publica con revisión";
  return "de confianza";
}
