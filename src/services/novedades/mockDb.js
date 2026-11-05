/**
 * "Base de datos" de las Novedades simuladas (solo con VITE_NOVEDADES_MOCKS=true).
 * Los datos se arman recién al usarse (funciones), así no entran al build de producción.
 */
/* v2: blog de noticias (sin agenda de próximos eventos) */
const DB_KEY = "fr-mock-novedades-v2";
const IMG_PREFIX = "fr-mock-novedades-img-";

function enDias(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function imagenes(id, urls, alts) {
  return urls.map((url, i) => ({ id: `${id}-img-${i}`, url, width: 1600, height: 1067, alt: alts[i] || alts[0], displayOrder: i }));
}

const seedNovedades = () => {
  const lista = [
    {
      id: "nov-tucuman",
      slug: "presentacion-en-tucuman-ejemplo",
      type: "PRESENTATION",
      title: "Presentación en San Miguel de Tucumán (ejemplo)",
      summary: "Federico Lanati presentó Peregrinos en Tucumán, con una charla sobre los viajes y la firma de ejemplares.",
      body: "Publicación de ejemplo para la demostración.\n\nLa presentación incluyó una charla sobre los viajes por las fiestas del país, la proyección de una selección de fotografías y la firma de ejemplares.\n\nGracias a todos los que se acercaron.",
      date: enDias(-12),
      place: "Museo de Arte Sacro",
      city: "San Miguel de Tucumán",
      provinceSlug: "tucuman",
      externalUrl: null,
      images: imagenes(
        "nov-tucuman",
        ["/images/galeria/p110.jpg", "/images/galeria/p144.jpg"],
        ["Fotografía del libro proyectada en la presentación", "Fotografía de la cabalgata del Cura Brochero"],
      ),
      status: "PUBLISHED",
    },
    {
      id: "nov-salta",
      slug: "muestra-fotografica-en-salta-ejemplo",
      type: "EXHIBITION",
      title: "Muestra fotográfica en Salta (ejemplo)",
      summary: "Se inauguró en Salta una muestra con fotografías de las fiestas del norte incluidas en Peregrinos.",
      body: "Publicación de ejemplo para la demostración.\n\nLa muestra reúne fotografías de las fiestas del norte argentino incluidas en el libro.",
      date: enDias(-20),
      place: "Centro Cultural América",
      city: "Salta",
      provinceSlug: "salta",
      externalUrl: null,
      images: imagenes("nov-salta", ["/images/galeria/p056.jpg"], ["Fotografía de la fiesta del Señor y la Virgen del Milagro"]),
      status: "PUBLISHED",
    },
    {
      id: "nov-bsas",
      slug: "presentacion-del-libro-en-buenos-aires-ejemplo",
      type: "PRESENTATION",
      title: "Presentación del libro en Buenos Aires (ejemplo)",
      summary: "Una sala llena para la presentación de Peregrinos, con la participación de los editores y lectores de todo el país.",
      body: "Publicación de ejemplo para la demostración.\n\nGracias a todos los que se acercaron a la presentación. Fue una noche muy emotiva, con muchas preguntas sobre las fiestas y los viajes detrás de cada fotografía.\n\nCompartimos algunas imágenes del encuentro.",
      date: enDias(-30),
      place: "Sala de presentaciones",
      city: "Ciudad Autónoma de Buenos Aires",
      provinceSlug: "caba",
      externalUrl: null,
      images: imagenes(
        "nov-bsas",
        ["/images/slider-02-portada.webp", "/images/galeria/p088.jpg", "/images/galeria/p100.jpg", "/images/galeria/p214.jpg"],
        ["Tapa del libro Peregrinos", "Fotografía del libro proyectada durante la presentación", "Fotografía de la Virgen del Valle", "Fotografía del santuario de San Nicolás"],
      ),
      status: "PUBLISHED",
    },
    {
      id: "nov-prensa",
      slug: "nota-en-el-diario-ejemplo",
      type: "PRESS",
      title: "Peregrinos en la prensa (ejemplo)",
      summary: "Una nota sobre el libro y el recorrido de Federico Lanati por 80 fiestas populares argentinas.",
      body: "Publicación de ejemplo para la demostración.\n\nUn medio nacional publicó una nota sobre el libro, con entrevista al autor y una selección de fotografías.",
      date: enDias(-60),
      place: null,
      city: null,
      provinceSlug: null,
      externalUrl: "https://example.com/nota-de-ejemplo",
      images: imagenes("nov-prensa", ["/images/tapa-tipografica.jpg"], ["Tapa tipográfica del libro"]),
      status: "PUBLISHED",
    },
    {
      id: "nov-borrador",
      slug: "borrador-ejemplo",
      type: "OTHER",
      title: "Borrador sin publicar (ejemplo)",
      summary: "Este borrador no se ve en el sitio hasta que se publique desde el admin.",
      body: "Publicación de ejemplo en borrador.",
      date: enDias(-5),
      place: null,
      city: null,
      provinceSlug: null,
      externalUrl: null,
      images: [],
      status: "DRAFT",
    },
  ];
  const ahora = new Date().toISOString();
  return lista.map((n) => ({
    ...n,
    coverImageId: n.images[0]?.id || null,
    createdAt: ahora,
    updatedAt: ahora,
    publishedAt: n.status === "PUBLISHED" ? ahora : null,
  }));
};

function seed() {
  return { novedades: seedNovedades(), seq: 100 };
}

export function loadDb() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* localStorage bloqueado: arranca de cero */
  }
  return seed();
}

export function saveDb(db) {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    /* ignore */
  }
}

export function resetDb() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(IMG_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  saveDb(seed());
}

export function saveImage(id, dataUrl) {
  try {
    localStorage.setItem(IMG_PREFIX + id, dataUrl);
    return true;
  } catch {
    return false;
  }
}

export function removeImage(id) {
  try {
    localStorage.removeItem(IMG_PREFIX + id);
  } catch {
    /* ignore */
  }
}

/** "mock-img:<id>" → data URL guardada; las rutas normales quedan igual. */
export function resolveUrl(url) {
  if (typeof url === "string" && url.startsWith("mock-img:")) {
    try {
      return localStorage.getItem(IMG_PREFIX + url.slice(9)) || "";
    } catch {
      return "";
    }
  }
  return url;
}
