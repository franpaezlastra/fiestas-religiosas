import { Pendiente } from "./Pendiente";
import { Portadilla } from "./Portadilla";

export function SeccionBergoglio() {
  return (
    <section>
      <Portadilla
        id="bergoglio"
        titulo="Un papa argentino para el mundo"
        kicker="An Argentine Pope for the World"
      />
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <p className="max-w-3xl font-light leading-relaxed">
          El libro incluye un homenaje al papa Francisco: infografías de Daniel Fontanarrosa sobre
          los 76 años de Jorge Bergoglio en Argentina y las principales acciones de los 12 años de
          papado, más la cobertura mediática argentina el día de su elección.
        </p>

        <figure className="mt-8">
          <img
            src="/images/timeline-bergoglio-argentina.jpg"
            alt="Línea de tiempo: vida y acción pastoral de Jorge Mario Bergoglio en Argentina, 1936–2013"
            className="w-full"
          />
          <figcaption className="mt-2 text-sm">
            Vida y acción pastoral de Jorge Mario Bergoglio. Lugares donde estuvo durante 76 años en
            Argentina.
            <span className="caption-en block">
              Life and pastoral work of Jorge Mario Bergoglio. Places where he lived during 76 years
              in Argentina.
            </span>
          </figcaption>
        </figure>

        <figure className="mt-10">
          <img
            src="/images/timeline-papado.jpg"
            alt="Línea de tiempo de las principales acciones del papa Francisco, 2013–2025"
            className="w-full"
          />
          <figcaption className="mt-2 text-sm">
            Principales acciones del papa Francisco.
            <span className="caption-en block">Main actions of Pope Francis.</span>
          </figcaption>
        </figure>

        <div className="mt-10">
          {/* PENDIENTE: texto de historia de Bergoglio en Argentina — confirmar con el cliente si lo redactamos o si lo provee */}
          <Pendiente titulo="Pendiente — texto adicional">
            El libro no trae un capítulo biográfico en prosa de Bergoglio: el homenaje es visual
            (estas infografías y las tapas de diarios). Falta confirmar si se redacta una historia
            de Bergoglio en Argentina aparte o si el cliente provee ese texto.
          </Pendiente>
        </div>
      </div>
    </section>
  );
}

export function SeccionTresArgentinos() {
  return (
    <section>
      <Portadilla
        id="tres-argentinos"
        titulo="Los tres argentinos más famosos"
        kicker="The three most famous Argentines"
      />
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        {/* PENDIENTE: confirmar terna con el cliente */}
        <Pendiente titulo="Pendiente — contenido del cliente">
          Esta sección no está en el libro. Hay que confirmar a quiénes se refiere exactamente
          (¿Francisco, Messi, Maradona? ¿Otra terna?) antes de armar el contenido.
        </Pendiente>
      </div>
    </section>
  );
}
