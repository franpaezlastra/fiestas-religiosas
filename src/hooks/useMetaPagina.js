import { useEffect } from "react";

const SITIO = "Fiestas Religiosas";

function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  const previo = el ? el.getAttribute("content") : null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content || "");
  return () => {
    if (previo == null) el.remove();
    else el.setAttribute("content", previo);
  };
}

/**
 * Título, description y og:* de la página actual.
 * Ojo: WhatsApp, Facebook y X no ejecutan JavaScript; para vistas previas al compartir
 * hace falta que el servidor sirva estas meta (pendiente del backend).
 */
export function useMetaPagina({ title, description, image } = {}) {
  useEffect(() => {
    const tituloPrevio = document.title;
    const completo = title ? `${title} · ${SITIO}` : SITIO;
    document.title = completo;
    const restaurar = [
      setMeta("name", "description", description),
      setMeta("property", "og:title", completo),
      setMeta("property", "og:description", description),
      setMeta("property", "og:type", "website"),
      setMeta("property", "og:url", window.location.href),
    ];
    if (image) restaurar.push(setMeta("property", "og:image", new URL(image, window.location.origin).href));
    return () => {
      document.title = tituloPrevio;
      restaurar.forEach((fn) => fn());
    };
  }, [title, description, image]);
}
