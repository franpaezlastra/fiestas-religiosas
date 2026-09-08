import { SANTOS_BEATOS } from "../data/santos";
import { Pendiente } from "./Pendiente";
import { Portadilla } from "./Portadilla";

export function SeccionSantos() {
  return (
    <section>
      <Portadilla id="santos" titulo="Santos y beatos" kicker="Saints and blesseds in Argentina" />
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1.35fr)_minmax(0,0.85fr)]">
          <figure>
            <div className="foto-libro bg-papel [&_img]:h-auto [&_img]:object-contain">
              <img
                src="/images/santos-grupo.jpg"
                alt="Retratos de santos y beatos en Argentina, ilustración del folleto"
              />
            </div>
            <figcaption className="mt-3 text-sm">
              Santos y beatos en Argentina.
              <span className="caption-en block">Saints and blesseds in Argentina.</span>
            </figcaption>
          </figure>
          <figure>
            <div className="foto-libro mx-auto max-w-sm bg-papel [&_img]:h-auto [&_img]:object-contain">
              <img
                src="/images/mapa-santos-solo.jpg"
                alt="Mapa de Argentina con la ubicación de santos y beatos"
              />
            </div>
            <figcaption className="mt-3 text-sm">
              Mapa de santos y beatos.
              <span className="caption-en block">Map of saints and blesseds.</span>
            </figcaption>
          </figure>
        </div>

        <ol className="mt-16 columns-1 gap-x-12 sm:columns-2">
          {SANTOS_BEATOS.map((s) => (
            <li
              key={s.id}
              className="reveal-scroll mb-8 break-inside-avoid border-b border-azul-logo/15 pb-6"
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
