const API_URL = import.meta.env.VITE_API_URL || "/api/v1";

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

export async function uploadImages(files, metadata = {}) {
  const formData = new FormData();
  [...files].forEach((file) => formData.append("images", file));
  Object.entries(metadata).forEach(([key, value]) => {
    if (value != null) formData.append(key, String(value));
  });
  return api("/admin/media", { method: "POST", body: formData });
}

export { API_URL };
