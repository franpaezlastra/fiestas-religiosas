/** Helpers de la tienda: formato, validaciones y estados de pedido. */

const precioFmt = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" });
const fechaFmt = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatPrecio(value) {
  return precioFmt.format(Number(value) || 0);
}

export function formatFecha(iso) {
  if (!iso) return "";
  return fechaFmt.format(new Date(iso));
}

export const PROVINCIAS = [
  "Buenos Aires",
  "Ciudad Autónoma de Buenos Aires",
  "Catamarca",
  "Chaco",
  "Chubut",
  "Córdoba",
  "Corrientes",
  "Entre Ríos",
  "Formosa",
  "Jujuy",
  "La Pampa",
  "La Rioja",
  "Mendoza",
  "Misiones",
  "Neuquén",
  "Río Negro",
  "Salta",
  "San Juan",
  "San Luis",
  "Santa Cruz",
  "Santa Fe",
  "Santiago del Estero",
  "Tierra del Fuego",
  "Tucumán",
];

/* ---------- Validaciones (devuelven el mensaje de error o null) ---------- */

export function validarRequerido(value, label = "Este campo") {
  return String(value ?? "").trim() ? null : `${label} es obligatorio.`;
}

export function validarEmail(value) {
  const v = String(value || "").trim();
  if (!v) return "El email es obligatorio.";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? null : "Revisá el email (ej. nombre@mail.com).";
}

export function validarDni(value) {
  const v = String(value || "").replace(/\./g, "").trim();
  if (!v) return "El DNI es obligatorio.";
  return /^\d{7,8}$/.test(v) ? null : "El DNI tiene que tener 7 u 8 números, sin puntos.";
}

export function validarTelefono(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "El teléfono es obligatorio.";
  return digits.length >= 8 && digits.length <= 15
    ? null
    : "Ingresá el teléfono con código de área (ej. 381 4123456).";
}

export function validarCodigoPostal(value) {
  const v = String(value || "").trim();
  if (!v) return "El código postal es obligatorio.";
  return /^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/.test(v)
    ? null
    : "Ingresá 4 números (ej. 4000) o el CPA completo (ej. T4000ABC).";
}

/* ---------- Estados de pedido ---------- */

export const ESTADOS_PEDIDO = {
  pending_payment: { label: "Esperando el pago", tono: "pendiente" },
  payment_rejected: { label: "Pago rechazado", tono: "error" },
  paid: { label: "Pago aprobado", tono: "ok" },
  preparing: { label: "En preparación", tono: "info" },
  shipped: { label: "Enviado", tono: "info" },
  delivered: { label: "Entregado", tono: "ok" },
  cancelled: { label: "Cancelado", tono: "error" },
};

export function estadoPedido(status) {
  return ESTADOS_PEDIDO[status] || { label: status, tono: "info" };
}

/** Transiciones que el admin puede hacer a mano (la validación real es del backend). */
export const TRANSICIONES_PEDIDO = {
  pending_payment: ["cancelled"],
  payment_rejected: ["cancelled"],
  paid: ["preparing", "delivered", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

/**
 * Por ahora la tienda vende solo libros (físicos, con envío).
 * Para sumar fotografías digitales u otros productos, poner en false: el carrito, el checkout
 * y el admin ya soportan productos digitales y variantes.
 */
export const TIENDA_SOLO_LIBROS = true;

export const TIPOS_PRODUCTO = {
  book: "Libro",
  photo: "Fotografía",
  other: "Otro",
};

export const ENTREGAS = {
  physical: "Físico (con envío)",
  digital: "Digital (descarga)",
};

/** Cuántas unidades hay en total de un producto físico (null si es digital). */
export function stockTotal(product) {
  if (product.fulfillment === "digital") return null;
  return product.variants.reduce((acc, v) => acc + (v.stock ?? 0), 0);
}

export function tieneStockBajo(product) {
  if (product.fulfillment === "digital") return false;
  return product.variants.some(
    (v) => v.lowStockThreshold != null && (v.stock ?? 0) <= v.lowStockThreshold,
  );
}

export const ULTIMO_PEDIDO_KEY = "fr-ultimo-pedido";
