import { Pendiente } from "./Pendiente";
import { Portadilla } from "./Portadilla";

export function SeccionSantos() {
  return (
    <section>
      <Portadilla
        id="santos"
        titulo="Santos y beatos"
        kicker="Saints and blesseds in Argentina"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <p className="max-w-3xl font-light leading-relaxed">
          Ilustración de Alfredo Sabat para el capítulo 6, con las figuras de santos y beatos
          argentinos retratados en el libro.
        </p>

        <figure className="mt-8">
          <img
            src="/images/ilustracion-sabat.jpg"
            alt="Ilustración de Alfredo Sabat: grupo de santos y beatos argentinos"
            className="w-full"
          />
          <figcaption className="mt-2 text-sm">
            Ilustración: Alfredo Sabat.
            <span className="caption-en block">Illustration by Alfredo Sabat.</span>
          </figcaption>
        </figure>

        <figure className="mt-8">
          <img
            src="/images/ilustracion-sabat-grupo.jpg"
            alt="Santos y beatos en Argentina, ilustración numerada de Alfredo Sabat con fichas 12 a 16"
            className="w-full"
          />
          <figcaption className="mt-2 text-sm">
            Santos y beatos en Argentina. Como de julio de 2026: 5 santos, 16 beatos, 8 venerables y
            43 siervos de Dios.
            <span className="caption-en block">
              Saints and blesseds in Argentina. As of July 2026: 5 saints, 16 blesseds, 8 venerables
              and 43 servants of God.
            </span>
          </figcaption>
        </figure>

        <figure className="mt-8">
          <img
            src="/images/mapa-santos-beatos.jpg"
            alt="Mapa de santos y beatos en Argentina, infografía del libro"
            className="w-full"
          />
          <figcaption className="mt-2 text-sm">
            Santos y beatos en Argentina. Infografía del libro.
            <span className="caption-en block">Saints and blesseds in Argentina. Book infographic.</span>
          </figcaption>
        </figure>

        <div className="mt-10">
          {/* PENDIENTE: CV de Alfredo Sabat — pedir al cliente */}
          <Pendiente titulo="Pendiente — CV de Alfredo Sabat">
            El CV de Alfredo Sabat no está en el libro. Hay que pedírselo al cliente (es caricaturista
            y colaborador histórico de Clarín).
          </Pendiente>
        </div>
      </div>
    </section>
  );
}
