import { Pendiente } from "./Pendiente";
import { Portadilla } from "./Portadilla";

const ESCRITORES = [
  "Mons. cardenal Ángel Rossi, arzobispo de Córdoba",
  "Mons. cardenal Luis Héctor Villalba",
  "Mons. Marcelo Daniel Colombo, arzobispo de Mendoza y presidente de la CEA",
  "Mons. Carlos Sánchez, arzobispo de Tucumán",
  "Mons. Santiago Olivera, obispo castrense",
  "Mons. Adolfo Ramón Canecín, obispo de Goya",
  "Mons. José Larragain, OFM, arzobispo de Corrientes",
  "Mons. Jorge Torres Carbonell, obispo de Laferrère",
  "Teól. padre Carlos Galli",
  "Padre Lic. Oscar Tapia",
  "Padre Marcelo Barrionuevo",
  "Padre Pablo Pagano Fernández",
  "Padre Lucas García, rector del Santuario de Luján",
  "Padre Orlando Sánchez",
  "Cr. (r) Jaime Paz Tagle",
  "Valeria Paz de Lanati",
  "Teól. Lic. Verónica Talamé",
];

export function SeccionEscritores() {
  return (
    <section>
      <Portadilla
        id="escritores"
        titulo="Escritores del libro"
        kicker="The book’s contributing writers"
      />
      <div className="mx-auto max-w-6xl px-4 py-12 md:py-20">
        <p className="max-w-3xl font-light leading-relaxed">
          Cargos y títulos tal como figuran en los créditos y agradecimientos del libro. El pedido
          de un CV extenso de cada uno excede lo que provee la edición impresa.
        </p>
        <ol className="mt-12 columns-1 gap-x-12 sm:columns-2">
          {ESCRITORES.map((nombre, i) => (
            <li
              key={nombre}
              className="reveal-scroll mb-5 break-inside-avoid border-b border-azul-logo/15 pb-5 text-azul-petroleo"
            >
              <span className="mr-2 font-display text-sm text-celeste-cielo">{i + 1}.</span>
              {nombre}
            </li>
          ))}
        </ol>
        <div className="mt-14">
          {/* PENDIENTE: bios extensas de cada escritor */}
          <Pendiente titulo="Pendiente — CVs">
            Si el cliente quiere biografías más extensas de cada escritor, hay que pedírselas: el
            libro solo indica título o cargo.
          </Pendiente>
        </div>
      </div>
    </section>
  );
}
