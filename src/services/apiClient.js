/**
 * API por entorno:
 * - localhost → VITE_API_URL (proxy Vite → api.fiestasreligiosas.com)
 * - preview.fiestasreligiosas.com → api-preview (mismo build DonWeb que prod)
 * - fiestasreligiosas.com → VITE_API_URL de producción
 */
const ENV_API_URL = import.meta.env.VITE_API_URL || "/api/v1";
const PREVIEW_API_URL =
  import.meta.env.VITE_API_URL_PREVIEW || "https://api-preview.fiestasreligiosas.com/api/v1";

function resolveApiUrl() {
  if (typeof window === "undefined") return ENV_API_URL;
  const host = window.location.hostname;
  if (host === "preview.fiestasreligiosas.com") return PREVIEW_API_URL;
  return ENV_API_URL;
}

const API_URL = resolveApiUrl();

export class ApiError extends Error {
  constructor(error, status) {
    super(error?.message || "Error de API");
    this.name = "ApiError";
    this.code = error?.code || "UNKNOWN";
    this.details = error?.details;
    this.status = status;
  }
}

export async function api(path, options = {}) {
  const headers = { ...options.headers };
  const isForm = typeof FormData !== "undefined" && options.body instanceof FormData;
  if (!isForm && options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 204) return null;

  let body = null;
  const text = await response.text();
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { error: { message: text } };
    }
  }

  if (!response.ok) {
    throw new ApiError(body?.error || { message: response.statusText }, response.status);
  }

  return body?.data ?? body;
}

/**
 * Subida con progreso (fetch no informa el avance del upload).
 * Mismo base URL, cookies y formato de error que api().
 */
export function uploadWithProgress(path, formData, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}${path}`);
    xhr.withCredentials = true;
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(e.loaded / e.total);
    };
    xhr.onload = () => {
      let body = null;
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : null;
      } catch {
        body = { error: { message: xhr.responseText } };
      }
      if (xhr.status >= 200 && xhr.status < 300) resolve(body?.data ?? body);
      else reject(new ApiError(body?.error || { message: xhr.statusText }, xhr.status));
    };
    xhr.onerror = () =>
      reject(new ApiError({ code: "NETWORK_ERROR", message: "No hay conexión con el servidor." }, 0));
    xhr.send(formData);
  });
}

export async function uploadImages(files, metadata = {}) {
  const formData = new FormData();
  [...files].forEach((file) => formData.append("images", file));
  Object.entries(metadata).forEach(([key, value]) => {
    if (value != null) formData.append(key, String(value));
  });
  return api("/admin/media", { method: "POST", body: formData });
}

export { API_URL };
