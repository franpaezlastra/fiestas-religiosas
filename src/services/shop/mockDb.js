/**
 * "Base de datos" de la simulación de tienda (solo con VITE_USE_MOCKS=true).
 * Vive en localStorage para que el flujo sobreviva a la redirección del pago
 * y para que los cambios del admin se vean en la tienda pública.
 */
/* v2: la tienda vende solo libros por ahora (la v1 tenía fotos y postales de ejemplo) */
const DB_KEY = "fr-mock-shop-v2";

const CATEGORIES = [
  { id: "cat-libros", slug: "libros", name: "Libros", displayOrder: 0 },
];

const BOOK_DIMENSIONS = { lengthCm: 30, widthCm: 24, heightCm: 3 };

const PRODUCTS = [
  {
    id: "prod-peregrinos",
    slug: "peregrinos-80-fiestas-populares-argentinas",
    name: "Peregrinos. 80 fiestas populares argentinas",
    type: "book",
    fulfillment: "physical",
    categoryId: "cat-libros",
    status: "PUBLISHED",
    shortDescription: "El libro de Federico Lanati. Edición bilingüe español / inglés.",
    description:
      "Un recorrido fotográfico por 80 fiestas religiosas y populares de la Argentina. Edición bilingüe (español / English), editada por Juan Travnik y Gustavo Tarchini. ISBN 978-631-01-7027-5.",
    images: [
      { url: "/images/slider-02-portada.webp", alt: "Tapa del libro Peregrinos" },
      { url: "/images/tapa-tipografica.jpg", alt: "Tapa tipográfica del libro" },
      { url: "/images/galeria/p020.jpg", alt: "Página interior del libro" },
      { url: "/images/galeria/p050.jpg", alt: "Página interior del libro" },
    ],
    variants: [
      {
        id: "var-peregrinos",
        name: "Edición bilingüe",
        sku: "LIB-PER-001",
        price: 45000,
        stock: 12,
        lowStockThreshold: 5,
        weightGrams: 1800,
        dimensions: BOOK_DIMENSIONS,
        digital: null,
      },
    ],
  },
  {
    id: "prod-fiestas-norte",
    slug: "fiestas-religiosas-del-norte-argentino-y-lujan",
    name: "Fiestas religiosas del norte argentino y Luján (ejemplo)",
    type: "book",
    fulfillment: "physical",
    categoryId: "cat-libros",
    status: "PUBLISHED",
    shortDescription: "Producto de ejemplo sin stock, para ver cómo se muestra.",
    description:
      "Producto de ejemplo de la simulación: está sin stock para mostrar el estado \"Sin stock\" en la tienda.",
    images: [{ url: "/images/slider-catamarca.jpg", alt: "Fiesta religiosa en Catamarca" }],
    variants: [
      {
        id: "var-fiestas-norte",
        name: "Edición 2020",
        sku: "LIB-FRN-001",
        price: 30000,
        stock: 0,
        lowStockThreshold: 3,
        weightGrams: 1500,
        dimensions: BOOK_DIMENSIONS,
        digital: null,
      },
    ],
  },
];

function seed() {
  return {
    categories: CATEGORIES,
    products: PRODUCTS,
    orders: [],
    stockMovements: [],
    withdrawals: [],
    settings: {
      pickupEnabled: false,
      pickupAddress: "Dirección a definir (placeholder)",
      freeShippingThreshold: null,
    },
    seq: 1000,
  };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* localStorage bloqueado: arranca de cero */
  }
  return clone(seed());
}

export function saveDb(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

export function resetDb() {
  const db = clone(seed());
  saveDb(db);
  return db;
}
