import { Link } from "react-router-dom";
import { SliderPrincipal } from "../components/SliderPrincipal";
import { NAV_LIBRO, NAV_PRINCIPAL } from "../lib/nav";

export function Inicio() {
  return (
    <>
      <SliderPrincipal />

      <section className="mx-auto max-w-3xl px-4 py-12 md:py-16">
        <h2 className="font-display text-2xl text-azul-petroleo md:text-3xl">El libro, en la web</h2>
        <p className="mt-4 font-light leading-relaxed">
          Extensión digital de <em>Peregrinos. 80 Fiestas Populares Argentinas</em>. El título
          comercial habla de 80 fiestas; el autor relevó 95. Acá están el mapa, el calendario, el
          homenaje a Francisco y los créditos de quienes hicieron el libro.
        </p>
      </section>

      <section className="bg-papel px-4 py-12 md:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-2xl text-azul-petroleo">Recorrer el sitio</h2>
          <p className="mt-2 max-w-2xl font-light">
            Cada bloque abre su propia página. Empezá por el mapa si venís del QR del libro.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {NAV_PRINCIPAL.map((item) => (
              <li key={item.to}>
                <Link
                  to={item.to}
                  className="flex h-full flex-col border border-azul-logo/20 bg-blanco p-5"
                >
                  <span className="text-xs uppercase tracking-wide text-celeste-cielo">{item.kicker}</span>
                  <span className="mt-2 font-display text-xl text-azul-petroleo">{item.label}</span>
                  <span className="mt-2 flex-1 font-light text-sm">{item.resumen}</span>
                  <span className="mt-4 text-sm text-azul-logo">Abrir →</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <figure>
        <img
          src="/images/tapas-diarios-eleccion.jpg"
          alt="Portadas de diarios y revistas argentinas el día de la elección del papa Francisco"
          className="max-h-[56vh] w-full object-cover object-center"
        />
        <figcaption className="mx-auto max-w-6xl px-4 py-3 text-sm">
          Portadas. Diarios y revistas argentinas reflejan la elección del papa Francisco.
          <span className="caption-en block">
            Front pages. Argentine newspapers and magazines cover the election of Pope Francis.
          </span>
        </figcaption>
      </figure>

      <section className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <h2 className="font-display text-2xl text-azul-petroleo">También en el libro</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {NAV_LIBRO.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="flex items-baseline justify-between gap-4 border-b border-azul-logo/15 py-3"
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
