/**
 * Redimensiona y comprime imágenes en el navegador antes de subirlas.
 * La API está en Vercel, que corta requests de más de ~4,5 MB: cada imagen tiene que quedar por debajo de 4 MB.
 */
import { LIMITES } from "./comunidad";

const TIPOS_ACEPTADOS = ["image/jpeg", "image/png", "image/webp"];

let soportaWebp = null;

function webpDisponible() {
  if (soportaWebp == null) {
    try {
      soportaWebp = document.createElement("canvas").toDataURL("image/webp").startsWith("data:image/webp");
    } catch {
      soportaWebp = false;
    }
  }
  return soportaWebp;
}

async function decodificar(file) {
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* algunos navegadores no aceptan opciones: sigue con <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function aBlob(canvas, tipo, calidad) {
  return new Promise((resolve) => canvas.toBlob(resolve, tipo, calidad));
}

/**
 * @param {File} file
 * @param {{ maxLado?: number, calidad?: number }} [opts]
 * @returns {Promise<File>} imagen WebP (o JPEG) de hasta maxLado px y menos de 4 MB
 */
export async function comprimirImagen(file, { maxLado = 2000, calidad = 0.85 } = {}) {
  if (!TIPOS_ACEPTADOS.includes(file.type) && !/\.(jpe?g|png|webp|heic)$/i.test(file.name)) {
    throw new Error("Solo se aceptan imágenes JPG, PNG o WebP.");
  }
  let fuente;
  try {
    fuente = await decodificar(file);
  } catch {
    throw new Error("No pudimos leer esa imagen. Probá con otra en JPG o PNG.");
  }
  const ancho = fuente.width;
  const alto = fuente.height;
  const escala = Math.min(1, maxLado / Math.max(ancho, alto));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(ancho * escala);
  canvas.height = Math.round(alto * escala);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#ffffff"; // los PNG transparentes quedan con fondo blanco en JPEG
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(fuente, 0, 0, canvas.width, canvas.height);
  fuente.close?.();

  const tipo = webpDisponible() ? "image/webp" : "image/jpeg";
  let q = calidad;
  let blob = await aBlob(canvas, tipo, q);
  while (blob && blob.size > LIMITES.imagenBytes && q > 0.45) {
    q -= 0.1;
    blob = await aBlob(canvas, tipo, q);
  }
  if (!blob || blob.size > LIMITES.imagenBytes) {
    throw new Error("La imagen sigue pesando más de 4 MB después de comprimirla. Probá con otra.");
  }
  const nombre = file.name.replace(/\.[^.]+$/, "") + (tipo === "image/webp" ? ".webp" : ".jpg");
  return new File([blob], nombre, { type: tipo });
}
