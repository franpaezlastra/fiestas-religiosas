import { useEffect, useState } from "react";
import { ARGENTINOS_FAMOSOS } from "../data/argentinos";
import { ANIOS_PAPADO, HITOS_ARGENTINA, HITOS_PAPADO } from "../data/bergoglio";
import { LineaTiempo } from "./LineaTiempo";
import { Pendiente } from "./Pendiente";
import { Portadilla } from "./Portadilla";

type Tramo = "argentina" | "papado";

function irA(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function SeccionBergoglio() {
  const [tramo, setTramo] = useState<Tramo>("argentina");

  useEffect(() => {
    function sync() {
      const papado = document.getElementById("papado-2013");
      if (!papado) return;
      setTramo(papado.getBoundingClientRect().top <= 140 ? "papado" : "argentina");
    }

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <section>
      <Portadilla
        id="bergoglio"
        titulo="Un papa argentino para el mundo"
        kicker="An Argentine Pope for the World"
      />

      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <p className="max-w-3xl font-light leading-relaxed">
          Infografías de Daniel Fontanarrosa. Primero los 76 años en Argentina; después, los 12 años
          de papado.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            className={`tramo-btn text-left ${tramo === "argentina" ? "is-on" : ""}`}
            onClick={() => irA("argentina-1936")}
          >
            <p className="text-xs uppercase tracking-wide text-celeste-cielo">1936 — 2013</p>
            <p className="mt-1 font-display text-xl text-azul-petroleo">76 años en Argentina</p>
            <p className="mt-2 text-sm font-light">De Flores al arzobispado.</p>
          </button>
          <button
            type="button"
            className={`tramo-btn text-left ${tramo === "papado" ? "is-on" : ""}`}
            onClick={() => irA("papado-2013")}
          >
            <p className="text-xs uppercase tracking-wide text-naranja-libro">2013 — 2025</p>
            <p className="mt-1 font-display text-xl text-azul-petroleo">12 años de papado</p>
            <p className="mt-2 text-sm font-light">Del cónclave a la Pascua de 2025.</p>
          </button>
        </div>
      </div>

      <div className="linea-tramos" role="navigation" aria-label="Tramo en pantalla">
        <div className="mx-auto flex w-full max-w-5xl px-4">
          <button
            type="button"
            className={tramo === "argentina" ? "is-on" : ""}
            onClick={() => irA("argentina-1936")}
          >
            Argentina
          </button>
          <button
            type="button"
            className={tramo === "papado" ? "is-on" : ""}
            onClick={() => irA("papado-2013")}
          >
            Papado
          </button>
        </div>
      </div>

      <div id="argentina-1936" className="scroll-mt-28">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
          <h3 className="titulo-seccion text-[1.75rem] md:text-[2rem]">
            Vida y acción pastoral
          </h3>
          <p className="caption-en mt-1 text-sm">Life and pastoral work of Jorge Mario Bergoglio</p>
          <div className="mt-8">
            <LineaTiempo id="linea-argentina" variante="argentina" hitos={HITOS_ARGENTINA} />
          </div>
        </div>
      </div>

      <div id="papado-2013" className="scroll-mt-28">
        <Portadilla
          titulo="Principales acciones del papa Francisco"
          kicker="Main actions of Pope Francis"
        />
        <div className="bg-papel">
          <div className="mx-auto max-w-5xl px-4 py-12 md:py-20">
            <p className="font-display text-sm text-azul-petroleo">Realizó 47 viajes a 66 países</p>
            <div className="mt-8">
              <LineaTiempo
                id="linea-papado"
                variante="papado"
                hitos={HITOS_PAPADO}
                ejeAnios={ANIOS_PAPADO}
              />
            </div>
            <p className="mt-8 text-center font-display text-sm text-azul-logo">21 de abril de 2025</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        {/* PENDIENTE: texto de historia de Bergoglio en Argentina — confirmar con el cliente si lo redactamos o si lo provee */}
        <Pendiente titulo="Pendiente — texto adicional">
          El libro no trae un capítulo biográfico en prosa de Bergoglio: el homenaje es visual. Falta
          confirmar si se redacta una historia de Bergoglio en Argentina aparte o si el cliente provee
          ese texto.
        </Pendiente>
      </div>
    </section>
  );
}

export function SeccionTresArgentinos() {
  return (
    <section>
      <Portadilla
        id="tres-argentinos"
        titulo="Los argentinos más famosos"
        kicker="The most famous Argentines of all time"
      />
      <div className="mx-auto max-w-4xl px-4 py-12 md:py-20">
        <figure>
          <div className="foto-libro bg-papel [&_img]:h-auto [&_img]:object-contain">
            <img
              src="/images/argentinos-mas-famosos.jpg"
              alt="Vitral con Diego Maradona, el papa Francisco y Lionel Messi"
            />
          </div>
          <figcaption className="mt-3 text-sm">
            Los argentinos más famosos de todos los tiempos.
            <span className="caption-en block">The most famous Argentines of all time.</span>
          </figcaption>
        </figure>
        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {ARGENTINOS_FAMOSOS.map((a) => (
            <li
              key={a.id}
              className="reveal-scroll border border-azul-logo/20 bg-papel px-4 py-6 text-center"
            >
              <p className="font-display text-lg text-azul-petroleo">{a.nombre}</p>
              <p className="mt-2 text-sm font-light">{a.rol}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
