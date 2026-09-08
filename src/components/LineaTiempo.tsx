import { useEffect, useMemo, useRef, useState } from "react";
import type { HitoBergoglio } from "../data/bergoglio";

type Props = {
  id: string;
  variante: "argentina" | "papado";
  hitos: HitoBergoglio[];
  ejeAnios?: number[];
};

export function LineaTiempo({ id, variante, hitos, ejeAnios }: Props) {
  const [activo, setActivo] = useState(hitos[0]?.id ?? "");
  const raiz = useRef<HTMLDivElement>(null);

  const hitosOrden = hitos;

  const chips = useMemo(() => {
    if (ejeAnios?.length) {
      return ejeAnios.map((anio) => ({
        clave: String(anio),
        etiqueta: String(anio),
        anio,
        tieneHito: hitosOrden.some((h) => h.anio === anio || h.marca.includes(String(anio))),
      }));
    }
    const vistosMarca = new Set<string>();
    return hitosOrden.flatMap((h) => {
      if (vistosMarca.has(h.marca)) return [];
      vistosMarca.add(h.marca);
      return [{ clave: h.marca, etiqueta: h.marca, anio: h.anio, tieneHito: true }];
    });
  }, [ejeAnios, hitosOrden]);

  useEffect(() => {
    const root = raiz.current;
    if (!root) return;
    const nodos = [...root.querySelectorAll<HTMLElement>("[data-hito]")];

    const foco = new IntersectionObserver(
      (entradas) => {
        const vista = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (vista?.target.id) setActivo(vista.target.id);
      },
      { rootMargin: "0px 0px -55% 0px", threshold: 0.15 },
    );

    nodos.forEach((n) => foco.observe(n));
    return () => foco.disconnect();
  }, [hitosOrden]);

  function irA(clave: string, anio: number) {
    const hito =
      hitosOrden.find((h) => h.marca === clave) ?? hitosOrden.find((h) => h.anio === anio);
    if (!hito) return;
    document.getElementById(hito.id)?.scrollIntoView({ behavior: "smooth", block: "center" });
    setActivo(hito.id);
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
              aria-current={on ? "step" : undefined}
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
