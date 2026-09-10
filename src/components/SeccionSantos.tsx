import { SANTOS_BEATOS } from "../data/santos";
import { Pendiente } from "./Pendiente";
import { Portadilla } from "./Portadilla";

export function SeccionSantos() {
  return (
    <section>
      <Portadilla id="santos" titulo="Santos y beatos" kicker="Saints and blesseds in Argentina" />
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <figure>
          <img
            src="/images/santos-grupo-removebg-preview.png"
            alt="Retratos de santos y beatos en Argentina, ilustración del folleto"
            className="mx-auto w-full"
          />
          <figcaption className="mt-3 text-sm">
            Santos y beatos en Argentina. Los números coinciden con el mapa y las fichas.
            <span className="caption-en block">
              Saints and blesseds in Argentina. Numbers match the map and the profiles.
            </span>
          </figcaption>
        </figure>

        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[minmax(240px,0.85fr)_minmax(0,1.35fr)]">
          <aside className="lg:sticky lg:top-24">
            <img
              src="/images/mapa-santos.png"
              alt="Mapa de Argentina con la ubicación numerada de santos y beatos"
              className="mx-auto w-full max-w-xs lg:max-w-none"
            />
            <p className="mt-3 text-center text-sm">
              Mapa de referencia. Cada número señala una ficha.
              <span className="caption-en block">Reference map. Each number matches a profile.</span>
            </p>
          </aside>

          <ol>
            {SANTOS_BEATOS.map((s) => (
              <li
                key={s.id}
                className="reveal-scroll mb-7 border-b border-azul-logo/15 pb-6 last:mb-0 last:border-b-0"
              >
                <p className="font-medium text-azul-petroleo">
                  <span
                    className={`mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] ${
                      s.categoria === "santo"
                        ? "bg-azul-petroleo text-blanco"
                        : s.categoria === "siervo"
                          ? "border border-dashed border-azul-petroleo text-azul-petroleo"
                          : "bg-[#c4a574] text-blanco"
                    }`}
                  >
                    {s.id}
                  </span>
                  {s.nombre} <span className="font-light">({s.anios})</span>
                </p>
                <p className="mt-2 text-sm font-light leading-relaxed">{s.bio}</p>
              </li>
            ))}
          </ol>
        </div>

        <p className="mt-12 max-w-3xl text-sm font-light leading-relaxed">
          En Argentina a julio del 2026, según el Delegado para las Causas de los Santos de la CEA,
          Mons. Mauricio Landra, obispo auxiliar de Mercedes-Luján: 5 santos, 16 beatos (el papa
          León XIV aprobó el 18 de diciembre de 2025 el decreto de beatificación de Enrique Shaw,
          reconociendo el milagro por la curación inexplicable de un niño de 5 años), 8 venerables
          siervos de Dios, 43 siervos de Dios y 14 causas de inicio.
        </p>

        <div className="mt-12">
          <Pendiente titulo="Pendiente — CV de Alfredo Sabat">
            El CV de Alfredo Sabat no está en el libro. Hay que pedírselo al cliente (es caricaturista
            y colaborador histórico de Clarín).
          </Pendiente>
        </div>
      </div>
    </section>
  );
}
