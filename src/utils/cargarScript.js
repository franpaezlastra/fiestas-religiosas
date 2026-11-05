const cargados = new Map();

/** Carga un script externo una sola vez (por ejemplo, Cloudflare Turnstile). */
export function cargarScript(src) {
  if (!cargados.has(src)) {
    cargados.set(
      src,
      new Promise((resolve, reject) => {
        const s = document.createElement("script");
        s.src = src;
        s.async = true;
        s.defer = true;
        s.onload = () => resolve();
        s.onerror = () => {
          cargados.delete(src);
          reject(new Error(`No se pudo cargar ${src}`));
        };
        document.head.appendChild(s);
      }),
    );
  }
  return cargados.get(src);
}
