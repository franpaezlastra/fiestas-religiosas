/**
 * "Base de datos" de la Comunidad simulada (solo con VITE_COMMUNITY_MOCKS=true).
 * Vive en localStorage. Las imágenes subidas se guardan aparte (una clave por imagen)
 * para no reescribir todo el JSON en cada cambio.
 */
import { FIESTAS_REF, PROVINCIAS_REF, SANTOS_REF, provinciaSlugDeNombre } from "../../utils/comunidad";

const DB_KEY = "fr-mock-community-v1";
const IMG_PREFIX = "fr-mock-community-img-";

export const PASSWORD_PRUEBA = "peregrina2026";

const HORA = 3600000;
const DIA = 24 * HORA;

function hace(ms) {
  return new Date(Date.now() - ms).toISOString();
}

function fiesta(numero) {
  const f = FIESTAS_REF.find((x) => x.id === `local-${numero}`);
  return { id: f.id, slug: f.slug, name: f.nombre, provinciaNombre: f.provincia };
}

function provincia(slug) {
  const p = PROVINCIAS_REF.find((x) => x.slug === slug);
  return p ? { slug: p.slug, name: p.name } : null;
}

function santo(slug) {
  const p = SANTOS_REF.find((x) => x.slug === slug);
  return { slug: p.slug, displayName: p.name };
}

function imagenes(postId, paginas, alts) {
  return paginas.map((p, i) => ({
    id: `${postId}-img-${i}`,
    url: `/images/galeria/p${String(p).padStart(3, "0")}.jpg`,
    width: 1600,
    height: 1067,
    alt: alts[i] || alts[0],
    displayOrder: i,
  }));
}

const seedUsers = () => [
  {
    id: "u-maria",
    email: "maria@prueba.com",
    username: "maria-gomez",
    displayName: "María Gómez",
    bio: "Peregrina desde chica. Voy al Milagro todos los septiembres con mi familia.",
    provinceSlug: "salta",
    canPublishDirectly: true,
    approvedPostsCount: 6,
    emailVerified: true,
    createdAt: hace(220 * DIA),
  },
  {
    id: "u-lucia",
    email: "lucia@prueba.com",
    username: "lucia-fernandez",
    displayName: "Lucía Fernández",
    bio: "Fotógrafa aficionada. Me gusta retratar las procesiones del Litoral.",
    provinceSlug: "corrientes",
    canPublishDirectly: true,
    approvedPostsCount: 4,
    emailVerified: true,
    createdAt: hace(150 * DIA),
  },
  {
    id: "u-carlos",
    email: "carlos@prueba.com",
    username: "carlos-ruiz",
    displayName: "Carlos Ruiz",
    bio: "Catamarqueño. Promesante de la Virgen del Valle.",
    provinceSlug: "catamarca",
    canPublishDirectly: true,
    approvedPostsCount: 3,
    emailVerified: true,
    createdAt: hace(90 * DIA),
  },
  {
    id: "u-juan",
    email: "juan@prueba.com",
    username: "juan-perez",
    displayName: "Juan Pérez",
    bio: "",
    provinceSlug: "tucuman",
    canPublishDirectly: false,
    approvedPostsCount: 0,
    emailVerified: true,
    createdAt: hace(5 * DIA),
  },
  {
    id: "u-ana",
    email: "ana@prueba.com",
    username: "ana-sosa",
    displayName: "Ana Sosa",
    bio: "",
    provinceSlug: "buenos-aires",
    canPublishDirectly: false,
    approvedPostsCount: 0,
    emailVerified: false,
    createdAt: hace(1 * DIA),
  },
  {
    id: "u-roberto",
    email: "roberto@prueba.com",
    username: "roberto-diaz",
    displayName: "Roberto Díaz",
    bio: "",
    provinceSlug: "cordoba",
    canPublishDirectly: false,
    approvedPostsCount: 0,
    emailVerified: true,
    status: "SUSPENDED",
    suspendedUntil: new Date(Date.now() + 7 * DIA).toISOString(),
    suspensionReason: "Publicidad repetida en comentarios",
    createdAt: hace(30 * DIA),
  },
].map((u) => ({
  password: PASSWORD_PRUEBA,
  avatarUrl: null,
  role: "USER",
  status: "ACTIVE",
  suspendedUntil: null,
  suspensionReason: null,
  ...u,
}));

function post({
  id,
  slug,
  authorId,
  title,
  body,
  numeroFiesta,
  provinciaSlug,
  santos = [],
  yearAttended = null,
  paginas = [],
  alts = [],
  status = "PUBLISHED",
  moderationNote = null,
  edad,
  likes = [],
}) {
  const f = numeroFiesta ? fiesta(numeroFiesta) : null;
  const imgs = imagenes(id, paginas, alts);
  return {
    id,
    slug,
    authorId,
    title,
    body,
    celebration: f ? { id: f.id, slug: f.slug, name: f.name } : null,
    province: provincia(provinciaSlug || (f ? provinciaSlugDeNombre(f.provinciaNombre) : null)),
    people: santos.map(santo),
    yearAttended,
    images: imgs,
    coverUploadId: imgs[0]?.id || null,
    status,
    moderationNote,
    likes,
    reportCount: 0,
    createdAt: hace(edad),
    publishedAt: status === "PUBLISHED" ? hace(edad - HORA) : null,
    editedAt: null,
    history: [{ action: "CREATED", note: null, at: hace(edad) }],
  };
}

const seedPosts = () => [
  post({
    id: "p-milagro",
    slug: "la-fiesta-del-milagro-que-vivi-este-ano-a1b2c3",
    authorId: "u-maria",
    title: "La fiesta del Milagro que viví este año",
    body: "Llegamos a Salta el 12 de septiembre a la madrugada, después de tres días de caminata desde Cachi. La ciudad entera estaba en la calle.\n\nLo que más me emocionó fue el Pacto de Fidelidad frente a la Catedral: miles de personas en silencio y, de golpe, todos cantando juntos. Mi abuela venía todos los años y este fue el primero sin ella.\n\nSi van por primera vez, lleven abrigo para la noche y agua para el día. Y pidan permiso para sacar fotos a los peregrinos: casi todos dicen que sí y te cuentan su promesa.",
    numeroFiesta: 55,
    yearAttended: 2026,
    paginas: [56, 60, 61],
    alts: [
      "Procesión del Señor y la Virgen del Milagro frente a la Catedral de Salta",
      "Peregrinos con banderas llegando a la plaza",
      "Imagen del Señor del Milagro rodeada de flores",
    ],
    edad: 2 * DIA,
    likes: ["u-lucia", "u-carlos", "u-juan"],
  }),
  post({
    id: "p-valle",
    slug: "subiendo-a-la-gruta-de-choya-d4e5f6",
    authorId: "u-carlos",
    title: "Subiendo a la gruta de Choya con mi familia",
    body: "Este año hicimos la caminata a la Gruta de Choya el día anterior a la bajada de la Virgen. Somos cuatro generaciones de promesantes y mi hijo de seis años hizo todo el camino.\n\nEn la Catedral Basílica había fila desde temprano para subir al camarín. Vale la pena la espera: es un momento muy íntimo.\n\nLes dejo algunas fotos de la procesión del domingo.",
    numeroFiesta: 73,
    santos: ["fray-mamerto-esquiu-7"],
    yearAttended: 2025,
    paginas: [100, 101, 102, 103],
    alts: [
      "Procesión de Nuestra Señora del Valle por las calles de Catamarca",
      "Fieles con velas en la Catedral Basílica",
      "Banda de música acompañando la procesión",
      "Imagen de la Virgen del Valle en andas",
    ],
    edad: 6 * DIA,
    likes: ["u-maria", "u-lucia"],
  }),
  post({
    id: "p-itati",
    slug: "itati-de-noche-g7h8i9",
    authorId: "u-lucia",
    title: "Itatí de noche: la llegada de los peregrinos a caballo",
    body: "Fui a fotografiar la llegada de las peregrinaciones a caballo a la Basílica de Itatí. Las columnas llegan desde Corrientes capital después de dos días de marcha.\n\nLa luz de la tarde sobre el río Paraná y los jinetes con sus ponchos fue algo que no voy a olvidar.",
    numeroFiesta: 39,
    yearAttended: 2025,
    paginas: [110, 111],
    alts: ["Jinetes llegando a la Basílica de Itatí al atardecer", "Fieles dentro de la Basílica de Itatí"],
    edad: 10 * DIA,
    likes: ["u-maria", "u-carlos", "u-juan", "u-ana"],
  }),
  post({
    id: "p-gauchito",
    slug: "gauchito-gil-en-mercedes-j1k2l3",
    authorId: "u-lucia",
    title: "Gauchito Gil en Mercedes: rojo por todas partes",
    body: "El 8 de enero Mercedes se llena de banderas rojas. Más allá de lo que cada uno crea, impresiona la cantidad de gente que llega a agradecer.\n\nHay mucha música, chamamé y comida en la ruta. Recomiendo ir temprano para evitar el calor.",
    numeroFiesta: 2,
    yearAttended: 2026,
    paginas: [274, 275, 276],
    alts: [
      "Santuario del Gauchito Gil cubierto de banderas rojas",
      "Promesantes con cintas rojas",
      "Músicos tocando chamamé junto a la ruta",
    ],
    edad: 18 * DIA,
    likes: ["u-carlos"],
  }),
  post({
    id: "p-brochero",
    slug: "cabalgata-brocheriana-m4n5o6",
    authorId: "u-maria",
    title: "La Cabalgata Brocheriana por las Altas Cumbres",
    body: "Tres días a caballo desde Córdoba hasta Villa Cura Brochero siguiendo el camino que hacía el santo. El cruce de las Altas Cumbres con niebla fue durísimo pero hermoso.\n\nLa llegada a la plaza de Villa Cura Brochero, con la gente aplaudiendo, me hizo llorar.",
    numeroFiesta: 13,
    santos: ["san-jose-gabriel-brochero-4"],
    yearAttended: 2024,
    paginas: [144, 152, 153],
    alts: [
      "Jinetes de la cabalgata cruzando las Altas Cumbres",
      "Llegada de la cabalgata a Villa Cura Brochero",
      "Imagen del Santo Cura Brochero",
    ],
    edad: 35 * DIA,
    likes: ["u-lucia", "u-carlos"],
  }),
  post({
    id: "p-ceferino",
    slug: "chimpay-tierra-de-ceferino-p7q8r9",
    authorId: "u-carlos",
    title: "Chimpay, tierra de Ceferino",
    body: "Viajamos desde Catamarca hasta Chimpay para la fiesta de Ceferino Namuncurá. Es un pueblo chico que en esos días recibe a miles de personas, muchas de comunidades mapuches.\n\nMe llamó la atención cómo se mezclan las tradiciones: la misa, las rogativas y los fogones a la noche.",
    numeroFiesta: 49,
    santos: ["ceferino-namuncura-3"],
    yearAttended: 2025,
    paginas: [148, 150],
    alts: ["Peregrinos en el santuario de Ceferino en Chimpay", "Misa al aire libre en Chimpay"],
    edad: 50 * DIA,
    likes: ["u-maria"],
  }),
  post({
    id: "p-lujan",
    slug: "peregrinacion-juvenil-a-lujan-s1t2u3",
    authorId: "u-maria",
    title: "60 kilómetros caminando a Luján",
    body: "Hice la Peregrinación Juvenil a Luján con un grupo de la parroquia. Salimos del Santuario de San Cayetano en Liniers el sábado al mediodía y llegamos el domingo a la mañana.\n\nLos puestos de ayuda en el camino, con mate cocido y curitas, son lo mejor de la peregrinación.",
    numeroFiesta: 65,
    yearAttended: 2023,
    paginas: [88, 89],
    alts: ["Multitud de jóvenes caminando por la ruta hacia Luján", "Basílica de Luján al amanecer"],
    edad: 80 * DIA,
    likes: [],
  }),
  post({
    id: "p-mailin",
    slug: "mailin-v4w5x6",
    authorId: "u-lucia",
    title: "Señor de los Milagros de Mailín, sin fotos de la procesión",
    body: "Esta vez no saqué fotos de la procesión porque me pareció un momento muy íntimo para la gente. Les comparto solo el santuario vacío al día siguiente.\n\nEs una de las fiestas más lindas de Santiago del Estero y todavía poco conocida fuera de la provincia.",
    numeroFiesta: 34,
    yearAttended: 2025,
    paginas: [62],
    alts: ["Santuario del Señor de los Milagros de Mailín"],
    edad: 120 * DIA,
    likes: ["u-carlos", "u-maria"],
  }),
  post({
    id: "p-punta-corral",
    slug: "bajada-de-punta-corral-y7z8a9",
    authorId: "u-juan",
    title: "Bajada de la Virgen de Punta Corral",
    body: "Primera vez que subo a Punta Corral. La bajada con las bandas de sikuris fue impresionante, nunca había escuchado algo así.\n\nComparto algunas fotos que saqué con el celular.",
    numeroFiesta: 18,
    yearAttended: 2026,
    paginas: [188, 190],
    alts: ["Bandas de sikuris bajando desde Punta Corral", "Peregrinos en la quebrada"],
    status: "PENDING",
    edad: 5 * HORA,
  }),
  post({
    id: "p-sannicolas",
    slug: "san-nicolas-con-mis-viejos-b1c2d3",
    authorId: "u-juan",
    title: "San Nicolás con mis viejos",
    body: "Fuimos a San Nicolás de los Arroyos el 25 de septiembre. Había muchísima gente en el Campito y en el santuario.",
    numeroFiesta: 58,
    yearAttended: 2025,
    paginas: [214],
    alts: ["Fieles en el Santuario de San Nicolás"],
    status: "PENDING",
    edad: 2 * HORA,
  }),
  post({
    id: "p-rechazada",
    slug: "promo-excursiones-e4f5g6",
    authorId: "u-juan",
    title: "Excursiones a fiestas religiosas con descuento",
    body: "Escribime por WhatsApp al 381 555-0000 y te paso precios de excursiones a todas las fiestas del norte. Cupos limitados.",
    numeroFiesta: 1,
    status: "REJECTED",
    moderationNote:
      "No se permiten publicidades ni datos de contacto. Si querés contar tu experiencia en una fiesta, podés volver a publicarlo sin la promoción.",
    edad: 3 * DIA,
  }),
];

function comment(id, postId, authorId, body, edad, extra = {}) {
  return {
    id,
    postId,
    parentId: null,
    authorId,
    body,
    createdAt: hace(edad),
    editedAt: null,
    status: "VISIBLE",
    reportCount: 0,
    ...extra,
  };
}

const seedComments = () => [
  comment("c1", "p-milagro", "u-lucia", "¡Qué lindo relato! Yo fui en 2019 y todavía me acuerdo del Pacto de Fidelidad.", 40 * HORA),
  comment("c2", "p-milagro", "u-maria", "Gracias, Lucía. Este año había más gente que nunca.", 39 * HORA, { parentId: "c1" }),
  comment("c3", "p-milagro", "u-carlos", "¿Cuántos días caminaron desde Cachi?", 30 * HORA),
  comment("c4", "p-milagro", "u-maria", "Tres días, con paradas en Payogasta y en la Cuesta del Obispo.", 29 * HORA, { parentId: "c3" }),
  comment("c5", "p-milagro", "u-juan", "Me dieron ganas de ir el año que viene.", 20 * HORA, { parentId: "c3" }),
  comment("c6", "p-milagro", "u-ana", "Una pregunta: ¿hay lugar para acampar cerca?", 12 * HORA),
  comment("c7", "p-valle", "u-maria", "Hermosas fotos, Carlos. Cuatro generaciones de promesantes, ¡qué emoción!", 5 * DIA),
  comment("c8", "p-valle", null, null, 4 * DIA, { status: "DELETED" }),
  comment("c9", "p-valle", "u-lucia", "Igual, el camarín es lo más lindo de la visita.", 4 * DIA - HORA, { parentId: "c8" }),
  comment("c10", "p-itati", "u-carlos", "La luz de esa foto es increíble.", 9 * DIA),
  comment("c11", "p-gauchito", "u-roberto", "Visitá mi página de excursiones baratas, link en mi perfil!!!", 17 * DIA, {
    reportCount: 1,
  }),
];

const seedReports = () => [
  {
    id: "r1",
    reporterId: "u-maria",
    targetType: "COMMENT",
    targetId: "c11",
    reason: "SPAM",
    details: null,
    status: "OPEN",
    createdAt: hace(16 * DIA),
  },
  {
    id: "r2",
    reporterId: "u-carlos",
    targetType: "POST",
    targetId: "p-gauchito",
    reason: "DISRESPECTFUL_RELIGIOUS",
    details: "El Gauchito Gil no es un santo reconocido por la Iglesia.",
    status: "OPEN",
    createdAt: hace(15 * DIA),
  },
  {
    id: "r3",
    reporterId: "u-juan",
    targetType: "USER",
    targetId: "u-roberto",
    reason: "SPAM",
    details: null,
    status: "OPEN",
    createdAt: hace(14 * DIA),
  },
];

function seed() {
  const reports = seedReports();
  const posts = seedPosts();
  for (const r of reports) {
    if (r.targetType === "POST") {
      const p = posts.find((x) => x.id === r.targetId);
      if (p) p.reportCount += 1;
    }
  }
  return {
    users: seedUsers(),
    posts,
    comments: seedComments(),
    reports,
    uploads: [],
    blockedWords: ["bloqueada", "idiota", "estafa"],
    outbox: [],
    tokens: [],
    moderationLog: [],
    rate: {},
    session: null,
    seq: 100,
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
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(IMG_PREFIX))
      .forEach((k) => localStorage.removeItem(k));
  } catch {
    /* ignore */
  }
  const db = clone(seed());
  saveDb(db);
  return db;
}

/** Guarda una imagen subida (data URL). Devuelve false si el navegador no tiene espacio. */
export function saveImage(id, dataUrl) {
  try {
    localStorage.setItem(IMG_PREFIX + id, dataUrl);
    return true;
  } catch {
    return false;
  }
}

export function loadImage(id) {
  try {
    return localStorage.getItem(IMG_PREFIX + id);
  } catch {
    return null;
  }
}

export function removeImage(id) {
  try {
    localStorage.removeItem(IMG_PREFIX + id);
  } catch {
    /* ignore */
  }
}

/** URL "mock-img:<id>" → data URL guardada. Las rutas normales quedan igual. */
export function resolveUrl(url) {
  if (typeof url === "string" && url.startsWith("mock-img:")) return loadImage(url.slice(9)) || "";
  return url;
}
