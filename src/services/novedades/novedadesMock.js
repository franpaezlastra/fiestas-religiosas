import { ApiError } from "../apiClient";
import { PROVINCIAS_REF } from "../../utils/comunidad";
import { LIMITES_NOVEDAD, TIPOS_NOVEDAD } from "../../utils/novedades";
import { slugify } from "../../utils/slugify";
import { loadDb, removeImage, resetDb, resolveUrl, saveDb, saveImage } from "./mockDb";

/** Novedades simuladas. Mismas firmas y respuestas que novedadesApi.js (docs/NOVEDADES_API_CONTRATO.md). */

function delay(ms = 200 + Math.random() * 300) {
  return new Promise((r) => window.setTimeout(r, ms));
}

function fail(code, message, status = 400, details) {
  throw new ApiError({ code, message, details }, status);
}

async function run(fn) {
  await delay();
  const db = loadDb();
  const result = fn(db);
  saveDb(db);
  return JSON.parse(JSON.stringify(result ?? null));
}

function provinceOf(slug) {
  const p = PROVINCIAS_REF.find((x) => x.slug === slug);
  return p ? { slug: p.slug, name: p.name } : null;
}

function toNovedad(n, { admin = false } = {}) {
  const images = [...n.images]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((i) => ({ ...i, url: resolveUrl(i.url) }));
  const cover = images.find((i) => i.id === n.coverImageId) || images[0] || null;
  const out = {
    id: n.id,
    slug: n.slug,
    type: n.type,
    title: n.title,
    summary: n.summary,
    body: n.body,
    date: n.date,
    place: n.place,
    city: n.city,
    province: provinceOf(n.provinceSlug),
    externalUrl: n.externalUrl,
    images,
    cover: cover ? { url: cover.url, width: cover.width, height: cover.height, alt: cover.alt } : null,
    coverImageId: cover?.id || null,
    publishedAt: n.publishedAt,
  };
  if (admin) Object.assign(out, { status: n.status, createdAt: n.createdAt, updatedAt: n.updatedAt });
  return out;
}

function validar(body) {
  const issues = [];
  const add = (field, message) => issues.push({ path: [field], message });
  const title = String(body.title || "").trim();
  if (title.length < LIMITES_NOVEDAD.titleMin || title.length > LIMITES_NOVEDAD.titleMax) {
    add("title", `Entre ${LIMITES_NOVEDAD.titleMin} y ${LIMITES_NOVEDAD.titleMax} caracteres.`);
  }
  if (!TIPOS_NOVEDAD[body.type]) add("type", "Tipo inválido.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(body.date || ""))) add("date", "Elegí una fecha.");
  if (String(body.summary || "").length > LIMITES_NOVEDAD.summaryMax) add("summary", `Máximo ${LIMITES_NOVEDAD.summaryMax} caracteres.`);
  if (String(body.body || "").length > LIMITES_NOVEDAD.bodyMax) add("body", "Texto demasiado largo.");
  if (body.externalUrl && !/^https?:\/\/\S+\.\S+/.test(body.externalUrl)) add("externalUrl", "Tiene que empezar con http:// o https://");
  if ((body.images || []).length > LIMITES_NOVEDAD.imagenes) add("images", `Máximo ${LIMITES_NOVEDAD.imagenes} fotos.`);
  if (issues.length) fail("INVALID_REQUEST", "Invalid request", 400, issues);
}

function aplicar(db, n, body) {
  const prev = new Map(n.images.map((i) => [i.id, i]));
  const uploads = db.uploads || [];
  n.type = body.type;
  n.status = ["DRAFT", "PUBLISHED"].includes(body.status) ? body.status : n.status || "DRAFT";
  n.title = body.title.trim();
  n.summary = String(body.summary || "").trim();
  n.body = String(body.body || "").trim();
  n.date = body.date;
  n.place = body.place?.trim() || null;
  n.city = body.city?.trim() || null;
  n.provinceSlug = body.provinceSlug || null;
  n.externalUrl = body.externalUrl?.trim() || null;
  n.images = (body.images || []).map((img, i) => {
    const anterior = prev.get(img.imageId);
    const subida = uploads.find((u) => u.id === img.imageId);
    if (!anterior && !subida) fail("INVALID_REQUEST", "Alguna foto no es válida. Subila de nuevo.", 400);
    return {
      id: img.imageId,
      url: anterior?.url || `mock-img:${img.imageId}`,
      width: anterior?.width || subida.width,
      height: anterior?.height || subida.height,
      alt: String(img.alt || "").trim(),
      displayOrder: i,
    };
  });
  for (const id of prev.keys()) {
    if (!n.images.some((i) => i.id === id)) removeImage(id);
  }
  db.uploads = uploads.filter((u) => !n.images.some((i) => i.id === u.id));
  n.coverImageId = n.images.some((i) => i.id === body.coverImageId) ? body.coverImageId : n.images[0]?.id || null;
  n.updatedAt = new Date().toISOString();
  if (n.status === "PUBLISHED" && !n.publishedAt) n.publishedAt = n.updatedAt;
}

function slugUnico(db, title, id) {
  const base = slugify(title).slice(0, 80) || "novedad";
  let slug = base;
  let i = 2;
  while (db.novedades.some((n) => n.slug === slug && n.id !== id)) slug = `${base}-${i++}`;
  return slug;
}

export const novedadesService = {
  list: () =>
    run((db) =>
      db.novedades
        .filter((n) => n.status === "PUBLISHED")
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((n) => toNovedad(n)),
    ),
  get: (slug) =>
    run((db) => {
      const n = db.novedades.find((x) => x.slug === slug && x.status === "PUBLISHED");
      if (!n) fail("NOT_FOUND", "No encontramos esa novedad.", 404);
      return toNovedad(n);
    }),
};

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

async function medidas(file) {
  try {
    const bmp = await createImageBitmap(file);
    const out = { width: bmp.width, height: bmp.height };
    bmp.close?.();
    return out;
  } catch {
    return { width: 1600, height: 1067 };
  }
}

export const adminNovedadesService = {
  list: () =>
    run((db) =>
      db.novedades
        .filter((n) => n.status !== "ARCHIVED")
        .sort((a, b) => b.date.localeCompare(a.date))
        .map((n) => toNovedad(n, { admin: true })),
    ),

  create: (body) =>
    run((db) => {
      validar(body);
      db.seq += 1;
      const n = {
        id: `nov-${db.seq}-${Math.random().toString(36).slice(2, 7)}`,
        slug: slugUnico(db, body.title),
        images: [],
        createdAt: new Date().toISOString(),
        publishedAt: null,
      };
      aplicar(db, n, body);
      db.novedades.unshift(n);
      return toNovedad(n, { admin: true });
    }),

  update: (id, body) =>
    run((db) => {
      const n = db.novedades.find((x) => x.id === id);
      if (!n) fail("NOT_FOUND", "Novedad no encontrada.", 404);
      validar(body);
      aplicar(db, n, body);
      return toNovedad(n, { admin: true });
    }),

  archive: (id) =>
    run((db) => {
      const n = db.novedades.find((x) => x.id === id);
      if (!n) fail("NOT_FOUND", "Novedad no encontrada.", 404);
      n.status = "ARCHIVED";
      return null;
    }),

  /** Simula el progreso y guarda la foto en el navegador. Devuelve { imageId, url }. */
  uploadImage: async (file, onProgress) => {
    if (file.size > 4 * 1024 * 1024) {
      await delay(150);
      fail("MEDIA_UPLOAD_LIMIT", "La imagen supera los 4 MB.", 400);
    }
    for (const p of [0.2, 0.5, 0.8]) {
      onProgress?.(p);
      await delay(150);
    }
    const [dataUrl, size] = await Promise.all([fileToDataUrl(file), medidas(file)]);
    onProgress?.(1);
    return run((db) => {
      db.seq += 1;
      const id = `nimg-${db.seq}-${Math.random().toString(36).slice(2, 7)}`;
      if (!saveImage(id, dataUrl)) {
        fail("MEDIA_UPLOAD_LIMIT", "El navegador no tiene más espacio para la simulación. Reiniciá los datos.", 400);
      }
      db.uploads = [...(db.uploads || []), { id, ...size }];
      return { imageId: id, url: dataUrl, ...size };
    });
  },
};

export const novedadesMockControls = {
  reset: () => resetDb(),
};
