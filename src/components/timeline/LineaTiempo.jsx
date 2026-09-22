import { useEffect, useMemo, useRef, useState } from "react";

/** Línea vertical bajo el eje sticky: ahí se decide el año activo. */
const FOCO_Y_RATIO = 0.32;

export function LineaTiempo({ id, variante, hitos, ejeAnios }) {
  const [activo, setActivo] = useState(hitos[0]?.id ?? "");
  const raiz = useRef(null);
  const pinnedId = useRef(null);
  const pinTimer = useRef(0);

  const hitosOrden = hitos;

  const chips = useMemo(() => {
    if (ejeAnios?.length) {
      return ejeAnios.map((anio) => ({
        clave: String(anio),
        etiqueta: String(anio),
        anio,
        tieneHito: hitosOrden.some(
          (h) => h.anio === anio || String(h.marca).includes(String(anio)),
        ),
      }));
    }
    const vistosMarca = new Set();
    return hitosOrden.flatMap((h) => {
      if (vistosMarca.has(h.marca)) return [];
      vistosMarca.add(h.marca);
      return [{ clave: h.marca, etiqueta: h.marca, anio: h.anio, tieneHito: true }];
    });
  }, [ejeAnios, hitosOrden]);

  useEffect(() => {
    const root = raiz.current;
    if (!root) return;
    const nodos = [...root.querySelectorAll("[data-hito]")];

    const syncActivo = () => {
      if (pinnedId.current) return;
      const focusY = window.innerHeight * FOCO_Y_RATIO;
      let best = null;
      let bestDist = Infinity;
      for (const n of nodos) {
        const r = n.getBoundingClientRect();
        if (r.bottom < focusY - 80 || r.top > focusY + 220) continue;
        const mid = (r.top + Math.min(r.bottom, r.top + 160)) / 2;
        const dist = Math.abs(mid - focusY);
        if (dist < bestDist) {
          bestDist = dist;
          best = n;
        }
      }
      if (best?.id) setActivo(best.id);
    };

    const foco = new IntersectionObserver(syncActivo, {
      rootMargin: "-25% 0px -45% 0px",
      threshold: [0, 0.15, 0.4, 0.75, 1],
    });

    nodos.forEach((n) => foco.observe(n));
    window.addEventListener("scroll", syncActivo, { passive: true });
    syncActivo();

    return () => {
      foco.disconnect();
      window.removeEventListener("scroll", syncActivo);
      window.clearTimeout(pinTimer.current);
    };
  }, [hitosOrden]);

  function irA(clave, anio) {
    const hito =
      hitosOrden.find((h) => h.marca === clave) ??
      hitosOrden.find((h) => h.anio === anio);
    if (!hito) return;

    pinnedId.current = hito.id;
    setActivo(hito.id);
    window.clearTimeout(pinTimer.current);
    document.getElementById(hito.id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    // Suelta el pin cuando termina el smooth scroll (aprox.)
    pinTimer.current = window.setTimeout(() => {
      if (pinnedId.current === hito.id) pinnedId.current = null;
    }, 900);
  }

  const activoHito = hitosOrden.find((h) => h.id === activo);

  return (
    <div ref={raiz} id={id} className={`linea-tiempo linea-tiempo--${variante}`}>
      <div className="linea-eje" role="navigation" aria-label="Años de la línea de tiempo">
        {chips.map((c) => {
          const on = Boolean(
            activoHito &&
              (activoHito.marca === c.clave ||
                (ejeAnios && activoHito.anio === c.anio)),
          );
          return (
            <button
              key={c.clave}
              type="button"
              className={`linea-chip${on ? " is-on" : ""}${c.tieneHito ? "" : " is-hueco"}`}
              disabled={!c.tieneHito}
              aria-current={on ? "true" : undefined}
              onClick={() => irA(c.clave, c.anio)}
            >
              {c.etiqueta}
            </button>
          );
        })}
      </div>

      <ol className="linea-eje-lista">
        {hitosOrden.map((h, i) => (
          <li
            key={h.id}
            id={h.id}
            data-hito
            className={`linea-hito${i % 2 === 0 ? " is-izq" : " is-der"}${
              activo === h.id ? " is-activo" : ""
            }${h.destacado ? ` is-${h.destacado}` : ""}`}
          >
            <p className="linea-marca">{h.marca}</p>
            <span className="linea-nodo" aria-hidden />
            <article className={`linea-ficha${h.foto ? " has-foto" : ""}`}>
              {h.foto ? (
                <img
                  src={h.foto}
                  alt={h.fotoAlt ?? ""}
                  loading="lazy"
                  decoding="async"
                  className={`linea-foto${h.fotoForma === "logo" ? " is-logo" : ""}`}
                />
              ) : null}
              <div className="linea-ficha-cuerpo">
                {h.fecha ? <p className="linea-fecha">{h.fecha}</p> : null}
                <h4 className="linea-titulo">{h.titulo}</h4>
                <p className="linea-lugar">{h.lugar}</p>
                <p className="linea-texto">{h.texto}</p>
              </div>
            </article>
          </li>
        ))}
      </ol>
    </div>
  );
}
