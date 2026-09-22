import { Link } from "react-router-dom";
import { SliderPrincipal } from "../features/home/SliderPrincipal";
import { NAV_LIBRO, NAV_PRINCIPAL } from "../utils/nav";

const CIFRAS = [
  { valor: "95", etiqueta: "fiestas relevadas" },
  { valor: "10", etiqueta: "capítulos" },
  { valor: "Bilingüe", etiqueta: "Español/English" },
  { valor: "1.000", etiqueta: "ejemplares" },
];

export function Inicio() {
  return (
    <>
      <SliderPrincipal />

      <section className="bg-[color-mix(in_srgb,var(--color-celeste-cielo)_6%,white)] px-4 py-16 md:py-24">
        <blockquote className="mx-auto max-w-3xl text-center">
          <p className="font-display text-[1.65rem] leading-snug text-azul-petroleo md:text-[2.15rem] md:leading-tight">
            «Peregrinos no es un catálogo de celebraciones.
            <br className="hidden sm:block" /> Peregrinos es el trazado de un mapa de la
            persistencia.»
          </p>
          <footer className="mt-8 text-sm font-light text-texto md:text-base">
            — Juan Travnik, fotógrafo, del ensayo «El rito de la mirada»
          </footer>
        </blockquote>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-16 md:py-24">
        <h2 className="titulo-seccion">Sobre el libro</h2>
        <div className="mt-5 space-y-5 font-light leading-relaxed">
          <p>
            Hace más de 20 años, Federico Lanati comenzó a fotografiar las fiestas religiosas del
            norte argentino. Convencido de que la fe del pueblo está en cada rincón del país,
            siguió viajando durante los últimos seis años — incluso durante la pandemia — hasta
            reunir el registro de 95 celebraciones populares en todo el territorio argentino.
          </p>
          <p>
            El resultado es <em>Peregrinos. 80 fiestas populares argentinas</em>, con prólogo del
            cardenal Ángel Rossi, edición de Juan Travnik y Gustavo Tarchini, y el respaldo de la
            Conferencia Episcopal Argentina.
          </p>
          <p>
            El título sigue el lema del Año Jubilar 2025:{" "}
            <em>«Peregrinos de la Esperanza»</em>.
          </p>
        </div>
      </section>

      <section className="border-y border-azul-logo/15 bg-papel px-4 py-12 md:py-16">
        <ul className="mx-auto grid max-w-5xl grid-cols-2 gap-8 md:grid-cols-4 md:gap-6">
          {CIFRAS.map((item) => (
            <li key={item.etiqueta} className="text-center">
              <p className="font-display text-3xl text-azul-petroleo md:text-4xl">{item.valor}</p>
              <p className="mt-2 text-xs font-light uppercase tracking-wide text-azul-logo md:text-sm">
                {item.etiqueta}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-papel px-4 py-16 md:py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="titulo-seccion">Recorrer el sitio</h2>
          <p className="mt-3 max-w-2xl font-light">
            Cada bloque abre su propia página. Empezá por el mapa si venís del QR del libro.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NAV_PRINCIPAL.map((item) => (
              <li key={item.to} className="reveal-scroll">
                <Link
                  to={item.to}
                  className="card-hover flex h-full flex-col border border-azul-logo/20 bg-blanco p-5"
                >
                  <span className="text-xs uppercase tracking-wide text-celeste-cielo">
                    {item.kicker}
                  </span>
                  <span className="mt-2 font-display text-xl text-azul-petroleo">{item.label}</span>
                  <span className="mt-2 flex-1 text-sm font-light">{item.resumen}</span>
                  <span className="mt-4 text-sm text-azul-logo">Abrir →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 md:py-24">
        <h2 className="titulo-seccion">También en el libro</h2>
        <ul className="mt-8 grid gap-1 sm:grid-cols-2">
          {NAV_LIBRO.map((item) => (
            <li key={item.to} className="reveal-scroll">
              <Link
                to={item.to}
                className="card-hover flex items-baseline justify-between gap-4 border border-transparent border-b-azul-logo/15 px-3 py-4"
              >
                <span>
                  <span className="block font-medium text-azul-petroleo">{item.label}</span>
                  <span className="text-sm font-light">{item.resumen}</span>
                </span>
                <span className="shrink-0 text-sm text-azul-logo">→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
