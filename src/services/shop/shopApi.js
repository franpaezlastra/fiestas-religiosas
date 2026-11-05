import { API_URL, api } from "../apiClient";

/**
 * Servicios reales de la tienda. Rutas relativas a VITE_API_URL (/api/v1).
 * Borrador hasta que exista docs/API_CONTRATO.md: si el contrato cambia una ruta,
 * se ajusta solo acá (shopMock.js tiene que devolver lo mismo).
 */

function withQuery(path, params = {}) {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null && value !== "") q.set(key, String(value));
  });
  const qs = q.toString();
  return qs ? `${path}?${qs}` : path;
}

const json = (method, body) => ({ method, body: JSON.stringify(body) });

export const shopService = {
  listCategories: () => api("/shop/categories"),
  listProducts: (params = {}) => api(withQuery("/shop/products", params)),
  getProduct: (slug) => api(`/shop/products/${encodeURIComponent(slug)}`),
  validateCart: (items) => api("/shop/cart/validate", json("POST", { items })),
};

export const shippingService = {
  quote: (body) => api("/shipping/quote", json("POST", body)),
  branches: (params) => api(withQuery("/shipping/branches", params)),
};

export const ordersService = {
  create: (body) => api("/orders", json("POST", body)),
  get: (publicToken) => api(`/orders/${encodeURIComponent(publicToken)}`),
  requestWithdrawal: (body) => api("/orders/withdrawals", json("POST", body)),
};

export const adminShopService = {
  listProducts: () => api("/admin/shop/products"),
  createProduct: (body) => api("/admin/shop/products", json("POST", body)),
  updateProduct: (id, body) => api(`/admin/shop/products/${id}`, json("PATCH", body)),
  archiveProduct: (id) => api(`/admin/shop/products/${id}`, { method: "DELETE" }),
  adjustStock: (variantId, body) =>
    api(`/admin/shop/variants/${variantId}/stock-adjustments`, json("POST", body)),
  stockMovements: (params = {}) => api(withQuery("/admin/shop/stock-movements", params)),
  listCategories: () => api("/admin/shop/categories"),
  createCategory: (body) => api("/admin/shop/categories", json("POST", body)),
};

export const adminOrdersService = {
  list: (params = {}) => api(withQuery("/admin/orders", params)),
  get: (id) => api(`/admin/orders/${id}`),
  updateStatus: (id, body) => api(`/admin/orders/${id}/status`, json("PATCH", body)),
  createShipment: (id) => api(`/admin/orders/${id}/shipment`, { method: "POST" }),
  /** La etiqueta es un PDF: se abre directo (la cookie de sesión viaja sola). */
  labelUrl: async (id) => `${API_URL}/admin/orders/${id}/shipment/label`,
  listWithdrawals: () => api("/admin/orders/withdrawals"),
};

/* Solo existen en la simulación */
export const paymentSimulator = null;
export const mockControls = null;
