import { ApiError } from "../apiClient";
import { loadDb, resetDb, saveDb } from "./mockDb";

/**
 * Servicios simulados de la tienda. Mismas firmas y mismas respuestas que shopApi.js.
 *
 * Errores que se pueden forzar:
 * - Código postal 9999                → SHIPPING_UNAVAILABLE
 * - Email que contenga "+sinstock"    → OUT_OF_STOCK al crear la orden
 * - Simulador de pago                 → aprobado / rechazado / pendiente
 * - ?mockError=CODIGO en la URL       → cualquier código en la próxima llamada
 */

const LATENCY_MS = [250, 650];
const PENDING_AUTO_APPROVE_MS = 12000;
const DOWNLOAD_TTL_DAYS = 7;
const DOWNLOAD_MAX = 3;

function delay() {
  const [min, max] = LATENCY_MS;
  return new Promise((r) => window.setTimeout(r, min + Math.random() * (max - min)));
}

function clone(value) {
  return value == null ? value : JSON.parse(JSON.stringify(value));
}

function fail(code, message, status = 400, details) {
  throw new ApiError({ code, message, details }, status);
}

/** ?mockError=CODIGO fuerza un error en la próxima llamada (y se consume). */
function forcedError() {
  try {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("mockError");
    if (!code) return;
    params.delete("mockError");
    const qs = params.toString();
    window.history.replaceState(null, "", `${window.location.pathname}${qs ? `?${qs}` : ""}`);
    fail(code, `Error simulado: ${code}`, 400);
  } catch (err) {
    if (err instanceof ApiError) throw err;
  }
}

async function run(fn) {
  await delay();
  forcedError();
  const db = loadDb();
  const result = fn(db);
  saveDb(db);
  return clone(result);
}

function randomToken(len = 24) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < len; i += 1) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function nowIso() {
  return new Date().toISOString();
}

/* ---------- Catálogo ---------- */

function categoryOf(db, id) {
  const c = db.categories.find((x) => x.id === id);
  return c ? { id: c.id, slug: c.slug, name: c.name } : null;
}

function variantAvailable(product, variant) {
  if (product.status !== "PUBLISHED") return false;
  if (product.fulfillment === "digital") return true;
  return (variant.stock ?? 0) > 0;
}

function toPublicProduct(db, product) {
  const variants = product.variants.map((v) => ({
    id: v.id,
    name: v.name,
    sku: v.sku,
    price: v.price,
    stock: product.fulfillment === "digital" ? null : v.stock,
    available: variantAvailable(product, v),
    digital: v.digital || null,
  }));
  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    type: product.type,
    fulfillment: product.fulfillment,
    category: categoryOf(db, product.categoryId),
    shortDescription: product.shortDescription,
    description: product.description,
    images: product.images,
    variants,
    priceFrom: Math.min(...variants.map((v) => v.price)),
    available: variants.some((v) => v.available),
  };
}

function findVariant(db, variantId) {
  for (const product of db.products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return null;
}

export const shopService = {
  listCategories: () =>
    run((db) => [...db.categories].sort((a, b) => a.displayOrder - b.displayOrder)),

  listProducts: ({ category, q } = {}) =>
    run((db) => {
      const query = String(q || "").trim().toLowerCase();
      return db.products
        .filter((p) => p.status === "PUBLISHED")
        .filter((p) => !category || categoryOf(db, p.categoryId)?.slug === category)
        .filter(
          (p) =>
            !query ||
            p.name.toLowerCase().includes(query) ||
            String(p.shortDescription || "").toLowerCase().includes(query),
        )
        .map((p) => toPublicProduct(db, p));
    }),

  getProduct: (slug) =>
    run((db) => {
      const product = db.products.find((p) => p.slug === slug && p.status === "PUBLISHED");
      if (!product) fail("NOT_FOUND", "No encontramos ese producto.", 404);
      return toPublicProduct(db, product);
    }),

  /** Revalida el carrito contra el catálogo actual (existencia, stock, precio). */
  validateCart: (items = []) =>
    run((db) => ({
      items: items.map(({ variantId, quantity }) => {
        const found = findVariant(db, variantId);
        if (!found || found.product.status !== "PUBLISHED") {
          return { variantId, status: "unavailable", stock: 0, price: null };
        }
        const { product, variant } = found;
        const stock = product.fulfillment === "digital" ? null : variant.stock;
        let status = "ok";
        if (stock != null && stock <= 0) status = "out_of_stock";
        else if (stock != null && quantity > stock) status = "insufficient_stock";
        return { variantId, status, stock, price: variant.price };
      }),
    })),
};

/* ---------- Envíos ---------- */

const POSTAL_RE = /^(\d{4}|[A-Za-z]\d{4}[A-Za-z]{3})$/;

function postalDigits(postalCode) {
  const value = String(postalCode || "").trim();
  return value.length === 4 ? value : value.slice(1, 5);
}

function quoteFor(db, { postalCode, items = [] }) {
  if (!POSTAL_RE.test(String(postalCode || "").trim())) {
    fail("VALIDATION_ERROR", "El código postal no es válido.", 422, {
      fields: { postalCode: "Ingresá 4 números (ej. 4000) o el CPA completo." },
    });
  }
  const digits = postalDigits(postalCode);
  if (digits === "9999") {
    fail("SHIPPING_UNAVAILABLE", "No hacemos envíos a ese código postal por ahora.", 422);
  }

  let weight = 0;
  let subtotal = 0;
  for (const { variantId, quantity } of items) {
    const found = findVariant(db, variantId);
    if (!found) continue;
    subtotal += found.variant.price * quantity;
    if (found.product.fulfillment === "physical") {
      weight += (found.variant.weightGrams || 500) * quantity;
    }
  }

  const amba = Number(digits) < 2000;
  const base = (amba ? 5200 : 7800) + Math.ceil(weight / 1000) * 1300;
  const { freeShippingThreshold, pickupEnabled, pickupAddress } = db.settings;
  const free = freeShippingThreshold != null && subtotal >= freeShippingThreshold;

  const options = [
    {
      id: "andreani-domicilio",
      type: "home",
      carrier: "Andreani",
      name: "Envío a domicilio",
      price: free ? 0 : base,
      etaDays: { min: amba ? 2 : 3, max: amba ? 4 : 6 },
    },
    {
      id: "andreani-sucursal",
      type: "branch",
      carrier: "Andreani",
      name: "Retiro en sucursal Andreani",
      price: free ? 0 : Math.round(base * 0.7),
      etaDays: { min: amba ? 2 : 3, max: amba ? 4 : 6 },
    },
  ];
  if (pickupEnabled) {
    options.push({
      id: "retiro-sin-cargo",
      type: "pickup",
      carrier: null,
      name: "Retiro sin cargo",
      price: 0,
      etaDays: null,
      address: pickupAddress,
    });
  }

  return { postalCode: String(postalCode).trim(), options, freeShippingThreshold, subtotal };
}

const BRANCH_NAMES = ["Centro", "Terminal", "Norte", "Shopping"];

function branchesFor(postalCode) {
  const digits = postalDigits(postalCode);
  return BRANCH_NAMES.map((name, i) => ({
    id: `suc-${digits}-${i + 1}`,
    name: `Sucursal ${name} (simulada)`,
    address: `Calle Ejemplo ${100 + i * 250}`,
    city: `Localidad CP ${digits}`,
    province: "",
    hours: i % 2 === 0 ? "Lun a vie 9 a 18 h · Sáb 9 a 13 h" : "Lun a vie 8 a 17 h",
  }));
}

export const shippingService = {
  quote: (body) => run((db) => quoteFor(db, body)),
  branches: ({ postalCode }) => run(() => branchesFor(postalCode)),
};

/* ---------- Órdenes ---------- */

function pushHistory(order, status, note) {
  order.status = status;
  order.history.push({ status, at: nowIso(), note: note || null });
}

function addMovement(db, { productId, variantId, delta, reason, orderNumber }) {
  const found = findVariant(db, variantId);
  if (!found || found.product.fulfillment === "digital") return;
  found.variant.stock = Math.max(0, (found.variant.stock ?? 0) + delta);
  db.stockMovements.unshift({
    id: `mov-${randomToken(10)}`,
    productId,
    variantId,
    delta,
    reason,
    orderNumber: orderNumber || null,
    stockAfter: found.variant.stock,
    at: nowIso(),
  });
}

function approve(db, order) {
  if (order.status !== "pending_payment") return;
  pushHistory(order, "paid", "Pago aprobado");
  order.paidAt = nowIso();
  order.payment = { ...order.payment, status: "approved" };
  for (const item of order.items) {
    if (item.fulfillment === "physical") {
      addMovement(db, {
        productId: item.productId,
        variantId: item.variantId,
        delta: -item.quantity,
        reason: "Venta",
        orderNumber: order.number,
      });
    } else {
      const expires = new Date(Date.now() + DOWNLOAD_TTL_DAYS * 86400000).toISOString();
      item.download = {
        url: item.image,
        expiresAt: expires,
        remaining: DOWNLOAD_MAX,
      };
    }
  }
}

/** Simula el webhook de Mercado Pago para pagos que quedaron pendientes. */
function settlePending(db, order) {
  if (
    order.status === "pending_payment" &&
    order.payment?.status === "in_process" &&
    order.payment.autoApproveAt &&
    Date.now() >= order.payment.autoApproveAt
  ) {
    approve(db, order);
  }
}

function toPublicOrder(order) {
  const { buyer, ...rest } = order;
  return {
    ...rest,
    buyer: { firstName: buyer.firstName, lastName: buyer.lastName, email: buyer.email },
  };
}

function createOrder(db, body) {
  const { buyer, items = [], shipping, acceptTerms } = body || {};
  if (!acceptTerms) {
    fail("VALIDATION_ERROR", "Tenés que aceptar los términos y condiciones.", 422, {
      fields: { acceptTerms: "Obligatorio" },
    });
  }
  if (!items.length) fail("VALIDATION_ERROR", "El carrito está vacío.", 422);

  const forceNoStock = String(buyer?.email || "").includes("+sinstock");
  const unavailable = [];
  const lines = [];

  for (const { variantId, quantity } of items) {
    const found = findVariant(db, variantId);
    if (!found || found.product.status !== "PUBLISHED") {
      unavailable.push({ variantId, available: 0 });
      continue;
    }
    const { product, variant } = found;
    const physical = product.fulfillment === "physical";
    const stock = physical ? variant.stock ?? 0 : null;
    if (physical && forceNoStock && !unavailable.length) {
      unavailable.push({ variantId, product, variant });
      continue;
    }
    if (physical && quantity > stock) {
      unavailable.push({ variantId, available: stock });
      continue;
    }
    const qty = physical ? quantity : 1;
    lines.push({
      productId: product.id,
      variantId: variant.id,
      productName: product.name,
      variantName: variant.name,
      fulfillment: product.fulfillment,
      image: product.images?.[0]?.url || null,
      unitPrice: variant.price,
      quantity: qty,
      total: variant.price * qty,
      download: null,
    });
  }

  if (unavailable.length) {
    /* "+sinstock": simula que otro comprador se llevó las últimas unidades (queda en 0 de verdad). */
    for (const u of unavailable) {
      if (!u.variant) continue;
      addMovement(db, {
        productId: u.product.id,
        variantId: u.variantId,
        delta: -(u.variant.stock ?? 0),
        reason: "Simulación: otro comprador se llevó el stock",
      });
      u.available = 0;
    }
    saveDb(db);
    fail("OUT_OF_STOCK", "Algunos productos ya no tienen stock suficiente.", 409, {
      items: unavailable.map(({ variantId, available }) => ({ variantId, available })),
    });
  }

  const hasPhysical = lines.some((l) => l.fulfillment === "physical");
  let shippingInfo = null;
  if (hasPhysical) {
    if (!shipping?.optionId || !shipping?.postalCode) {
      fail("VALIDATION_ERROR", "Elegí una opción de envío.", 422);
    }
    const quote = quoteFor(db, {
      postalCode: shipping.postalCode,
      items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
    });
    const option = quote.options.find((o) => o.id === shipping.optionId);
    if (!option) fail("SHIPPING_UNAVAILABLE", "La opción de envío ya no está disponible.", 422);
    let branch = null;
    if (option.type === "branch") {
      branch = branchesFor(shipping.postalCode).find((b) => b.id === shipping.branchId);
      if (!branch) fail("VALIDATION_ERROR", "Elegí una sucursal.", 422);
    }
    shippingInfo = {
      type: option.type,
      optionId: option.id,
      optionName: option.name,
      carrier: option.carrier,
      cost: option.price,
      postalCode: shipping.postalCode,
      address: option.type === "home" ? shipping.address : null,
      branch,
      pickupAddress: option.type === "pickup" ? option.address : null,
      trackingNumber: null,
      labelAvailable: false,
    };
  }

  const subtotal = lines.reduce((acc, l) => acc + l.total, 0);
  const shippingCost = shippingInfo?.cost || 0;
  db.seq += 1;
  const order = {
    id: `ord-${randomToken(10)}`,
    number: `FR-${db.seq}`,
    publicToken: randomToken(),
    status: "pending_payment",
    createdAt: nowIso(),
    paidAt: null,
    buyer,
    items: lines,
    shipping: shippingInfo,
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
    currency: "ARS",
    payment: { provider: "mercadopago", status: "created" },
    history: [],
  };
  pushHistory(order, "pending_payment", "Orden creada, esperando el pago");
  db.orders.unshift(order);

  return {
    orderId: order.id,
    number: order.number,
    publicToken: order.publicToken,
    total: order.total,
    checkoutUrl: `${window.location.origin}/simulacion/pago?order=${order.publicToken}`,
  };
}

function findByToken(db, token) {
  const order = db.orders.find((o) => o.publicToken === token);
  if (!order) fail("NOT_FOUND", "No encontramos ese pedido.", 404);
  return order;
}

export const ordersService = {
  create: (body) => run((db) => createOrder(db, body)),
  get: (publicToken) =>
    run((db) => {
      const order = findByToken(db, publicToken);
      settlePending(db, order);
      return toPublicOrder(order);
    }),
  requestWithdrawal: (body) =>
    run((db) => {
      const { orderNumber, email, fullName } = body || {};
      if (!orderNumber || !email || !fullName) {
        fail("VALIDATION_ERROR", "Completá nombre, email y número de pedido.", 422);
      }
      db.seq += 1;
      const request = {
        id: `arr-${randomToken(10)}`,
        requestNumber: `ARR-${db.seq}`,
        orderNumber,
        email,
        fullName,
        reason: body.reason || null,
        createdAt: nowIso(),
      };
      db.withdrawals.unshift(request);
      return { requestNumber: request.requestNumber, createdAt: request.createdAt };
    }),
};

/* ---------- Solo simulación: pago y controles ---------- */

export const paymentSimulator = {
  /** outcome: "approved" | "rejected" | "pending" */
  resolve: (publicToken, outcome) =>
    run((db) => {
      const order = findByToken(db, publicToken);
      if (order.status !== "pending_payment") return toPublicOrder(order);
      if (outcome === "approved") approve(db, order);
      else if (outcome === "rejected") {
        order.payment = { ...order.payment, status: "rejected" };
        pushHistory(order, "payment_rejected", "Pago rechazado");
      } else {
        order.payment = {
          ...order.payment,
          status: "in_process",
          autoApproveAt: Date.now() + PENDING_AUTO_APPROVE_MS,
        };
        order.history.push({ status: "pending_payment", at: nowIso(), note: "Pago en proceso" });
      }
      return toPublicOrder(order);
    }),
  getOrder: (publicToken) => run((db) => toPublicOrder(findByToken(db, publicToken))),
};

export const mockControls = {
  getSettings: () => loadDb().settings,
  updateSettings: (patch) => {
    const db = loadDb();
    db.settings = { ...db.settings, ...patch };
    saveDb(db);
    return db.settings;
  },
  reset: () => {
    resetDb();
  },
};

/* ---------- Admin ---------- */

function slugify(text) {
  return String(text || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toAdminProduct(db, product) {
  return { ...product, category: categoryOf(db, product.categoryId) };
}

function normalizeVariant(v, fulfillment) {
  const digital = fulfillment === "digital";
  return {
    id: v.id || `var-${randomToken(10)}`,
    name: String(v.name || "").trim() || "Única",
    sku: String(v.sku || "").trim(),
    price: Number(v.price) || 0,
    stock: digital ? null : Math.max(0, Number(v.stock) || 0),
    lowStockThreshold: digital ? null : Math.max(0, Number(v.lowStockThreshold) || 0),
    weightGrams: digital ? null : Number(v.weightGrams) || null,
    dimensions: digital ? null : v.dimensions || null,
    digital: digital ? v.digital || { resolution: "", license: "" } : null,
  };
}

function validateProduct(db, body, currentId) {
  if (!String(body.name || "").trim()) {
    fail("VALIDATION_ERROR", "El nombre es obligatorio.", 422, { fields: { name: "Obligatorio" } });
  }
  if (!body.variants?.length) {
    fail("VALIDATION_ERROR", "El producto necesita al menos una variante.", 422);
  }
  if (body.variants.some((v) => !(Number(v.price) > 0))) {
    fail("VALIDATION_ERROR", "Cada variante necesita un precio mayor a 0.", 422);
  }
  const slug = slugify(body.slug || body.name);
  if (db.products.some((p) => p.slug === slug && p.id !== currentId)) {
    fail("CONFLICT", "Ya existe un producto con ese slug.", 409, { fields: { slug: "Duplicado" } });
  }
  return slug;
}

export const adminShopService = {
  listProducts: () =>
    run((db) => db.products.filter((p) => p.status !== "ARCHIVED").map((p) => toAdminProduct(db, p))),

  createProduct: (body) =>
    run((db) => {
      const slug = validateProduct(db, body);
      const product = {
        id: `prod-${randomToken(10)}`,
        slug,
        name: body.name.trim(),
        type: body.type || "other",
        fulfillment: body.fulfillment || "physical",
        categoryId: body.categoryId || null,
        status: body.status || "DRAFT",
        shortDescription: body.shortDescription || "",
        description: body.description || "",
        images: body.images || [],
        variants: body.variants.map((v) => normalizeVariant(v, body.fulfillment)),
      };
      db.products.unshift(product);
      for (const v of product.variants) {
        if (v.stock) {
          db.stockMovements.unshift({
            id: `mov-${randomToken(10)}`,
            productId: product.id,
            variantId: v.id,
            delta: v.stock,
            reason: "Stock inicial",
            orderNumber: null,
            stockAfter: v.stock,
            at: nowIso(),
          });
        }
      }
      return toAdminProduct(db, product);
    }),

  /** El stock no se edita acá: se cambia con adjustStock (queda en el historial). */
  updateProduct: (id, body) =>
    run((db) => {
      const product = db.products.find((p) => p.id === id);
      if (!product) fail("NOT_FOUND", "Producto no encontrado.", 404);
      const slug = validateProduct(db, body, id);
      const fulfillment = body.fulfillment || product.fulfillment;
      const variants = body.variants.map((v) => {
        const prev = product.variants.find((x) => x.id === v.id);
        const next = normalizeVariant(v, fulfillment);
        if (prev && fulfillment === "physical") next.stock = prev.stock ?? 0;
        return next;
      });
      Object.assign(product, {
        slug,
        name: body.name.trim(),
        type: body.type,
        fulfillment,
        categoryId: body.categoryId || null,
        status: body.status,
        shortDescription: body.shortDescription || "",
        description: body.description || "",
        images: body.images || [],
        variants,
      });
      return toAdminProduct(db, product);
    }),

  archiveProduct: (id) =>
    run((db) => {
      const product = db.products.find((p) => p.id === id);
      if (!product) fail("NOT_FOUND", "Producto no encontrado.", 404);
      product.status = "ARCHIVED";
      return null;
    }),

  adjustStock: (variantId, { delta, reason }) =>
    run((db) => {
      const found = findVariant(db, variantId);
      if (!found) fail("NOT_FOUND", "Variante no encontrada.", 404);
      if (found.product.fulfillment === "digital") {
        fail("VALIDATION_ERROR", "Los productos digitales no manejan stock.", 422);
      }
      const amount = Number(delta);
      if (!Number.isInteger(amount) || amount === 0) {
        fail("VALIDATION_ERROR", "Ingresá una cantidad entera distinta de 0.", 422);
      }
      if ((found.variant.stock ?? 0) + amount < 0) {
        fail("VALIDATION_ERROR", "El stock no puede quedar negativo.", 422);
      }
      addMovement(db, {
        productId: found.product.id,
        variantId,
        delta: amount,
        reason: String(reason || "").trim() || "Ajuste manual",
      });
      return toAdminProduct(db, found.product);
    }),

  stockMovements: ({ productId } = {}) =>
    run((db) => db.stockMovements.filter((m) => !productId || m.productId === productId)),

  listCategories: () =>
    run((db) => [...db.categories].sort((a, b) => a.displayOrder - b.displayOrder)),

  createCategory: (body) =>
    run((db) => {
      const name = String(body?.name || "").trim();
      if (!name) fail("VALIDATION_ERROR", "El nombre es obligatorio.", 422);
      const slug = slugify(name);
      if (db.categories.some((c) => c.slug === slug)) {
        fail("CONFLICT", "Ya existe una categoría con ese nombre.", 409);
      }
      const category = { id: `cat-${randomToken(8)}`, slug, name, displayOrder: db.categories.length };
      db.categories.push(category);
      return category;
    }),
};

const STATUS_TRANSITIONS = {
  pending_payment: ["cancelled"],
  payment_rejected: ["cancelled"],
  paid: ["preparing", "delivered", "cancelled"],
  preparing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

function findOrder(db, id) {
  const order = db.orders.find((o) => o.id === id);
  if (!order) fail("NOT_FOUND", "Pedido no encontrado.", 404);
  settlePending(db, order);
  return order;
}

export const adminOrdersService = {
  list: ({ status, q } = {}) =>
    run((db) => {
      db.orders.forEach((o) => settlePending(db, o));
      const query = String(q || "").trim().toLowerCase();
      return db.orders
        .filter((o) => !status || o.status === status)
        .filter(
          (o) =>
            !query ||
            o.number.toLowerCase().includes(query) ||
            `${o.buyer.firstName} ${o.buyer.lastName}`.toLowerCase().includes(query) ||
            o.buyer.email.toLowerCase().includes(query),
        );
    }),

  get: (id) => run((db) => findOrder(db, id)),

  updateStatus: (id, { status, note }) =>
    run((db) => {
      const order = findOrder(db, id);
      if (!STATUS_TRANSITIONS[order.status]?.includes(status)) {
        fail("INVALID_STATUS_TRANSITION", "No se puede pasar el pedido a ese estado.", 409);
      }
      const wasPaid = ["paid", "preparing"].includes(order.status);
      pushHistory(order, status, note);
      if (status === "cancelled" && wasPaid) {
        for (const item of order.items) {
          if (item.fulfillment === "physical") {
            addMovement(db, {
              productId: item.productId,
              variantId: item.variantId,
              delta: item.quantity,
              reason: "Cancelación",
              orderNumber: order.number,
            });
          }
        }
      }
      return order;
    }),

  createShipment: (id) =>
    run((db) => {
      const order = findOrder(db, id);
      if (!order.shipping || order.shipping.type === "pickup") {
        fail("VALIDATION_ERROR", "Este pedido no lleva envío por Andreani.", 422);
      }
      if (!["paid", "preparing"].includes(order.status)) {
        fail("INVALID_STATUS_TRANSITION", "Solo se genera el envío de pedidos pagos.", 409);
      }
      if (order.shipping.trackingNumber) {
        fail("CONFLICT", "El envío ya fue generado.", 409);
      }
      order.shipping.trackingNumber = `36000${Math.floor(1e9 + Math.random() * 9e9)}`;
      order.shipping.labelAvailable = true;
      if (order.status === "paid") pushHistory(order, "preparing", "Envío Andreani generado");
      return order;
    }),

  /** Devuelve una URL descargable de la etiqueta. En la simulación es un .txt. */
  labelUrl: (id) =>
    run((db) => {
      const order = findOrder(db, id);
      if (!order.shipping?.labelAvailable) fail("NOT_FOUND", "Todavía no hay etiqueta.", 404);
      const s = order.shipping;
      const text = [
        "ETIQUETA SIMULADA — ANDREANI",
        `Pedido: ${order.number}`,
        `Seguimiento: ${s.trackingNumber}`,
        `Destinatario: ${order.buyer.firstName} ${order.buyer.lastName}`,
        s.address
          ? `Domicilio: ${s.address.street} ${s.address.number} ${s.address.apartment || ""}, ${s.address.city}, ${s.address.province} (${s.postalCode})`
          : `Sucursal: ${s.branch?.name} — ${s.branch?.address}`,
      ].join("\n");
      return URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    }),

  listWithdrawals: () => run((db) => db.withdrawals),
};
