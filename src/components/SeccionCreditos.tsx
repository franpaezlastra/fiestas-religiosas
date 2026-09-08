import { Pendiente } from "./Pendiente";
import { Portadilla } from "./Portadilla";

export function SeccionCreditos() {
  return (
    <section>
      <Portadilla id="creditos" titulo="Créditos" kicker="Credits" />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <dl className="divide-y divide-azul-logo/15 leading-relaxed">
          {[
            ["Idea, edición general y fotografías", "Federico Lanati"],
            ["Editores", "Juan Travnik y Gustavo Tarchini"],
            ["Corrección de estilo (español)", "Magena Valentié"],
            ["Diseño", "Estudio Massolo — Fabio Massolo"],
            ["Infografías", "Daniel Fontanarrosa"],
            ["Ilustración", "Alfredo Sabat"],
            ["Fotocromía", "Estudio Ricardo Farías"],
            ["Impresión", "Akian Gráfica Editora"],
            ["Traducción al inglés", "Florencia Paz"],
            ["Revisión general", "Valeria Cangemi"],
          ].map(([cargo, nombre]) => (
            <div key={cargo} className="reveal-scroll py-4">
              <dt className="font-medium text-azul-petroleo">{cargo}</dt>
              <dd>{nombre}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-8 font-light">Edición bilingüe. Tirada: 1000 ejemplares.</p>

        <h3 className="subtitulo-seccion mt-16">Agradecimientos — Colaboradores</h3>
        <p className="reveal-scroll mt-5 font-light leading-relaxed">
          Milagros Lanati, Florencia Lanati, Patricio Castellanos, Sebastián Robles Terán, Máximo
          Méndez, Giuliana Moisés, María Antonia Schanton, Padre obispo Juan Carlos Romanín,
          Monseñor Lucio Ruiz, Padre Lucas Salcedo, Padre Guillermo Benzi, Marcela Villares, Gerardo
          Irachet, María Elisa Benard, Silvana Firpo, Soraida Chaina, Aldo Calliera, Orlando
          Natiello, Valentina Medina, Víctor Valle, Silvia Bulla, Ana Pico, Vanesa Pedreira.
        </p>

        <p className="mt-8 font-light">
          Se terminó de imprimir el 27 de agosto de 2026, día del Beato Enrique Shaw.
        </p>

        <p className="mt-8 text-sm font-light leading-relaxed">
          No se permite la reproducción total o parcial, el almacenamiento, el alquiler, la
          transmisión o la transformación de este libro, en cualquier forma o por cualquier medio,
          sea electrónico o mecánico, mediante fotocopias, digitalización u otros métodos, sin el
          permiso previo y escrito del editor. Su infracción está penada por las leyes 11.723 y
          25.446.
        </p>

        <h3 className="subtitulo-seccion mt-16">Ficha catalográfica</h3>
        <p className="reveal-scroll mt-5 text-sm font-light leading-relaxed">
          Lanati, Federico. Peregrinos: 80 fiestas populares argentinas / Federico Lanati;
          Contribuciones de Marcelo Colombo... [et al.]; Editado por Juan Travnik; Gustavo Tarchini;
          Fotografías de Federico Lanati; Ilustrado por Alfredo Sabat; Prólogo de Cardenal Ángel
          Sixto Rossi SJ. — 1a ed. — Yerba Buena: Federico Lanati, 2026. 320 p.: il.; 21 x 30 cm.
          Traducción de: Florencia Paz. ISBN 978-631-01-7027-5. 1. Festividades Religiosas. 2.
          Cultura Popular. 3. Peregrinación. CDD 200.
        </p>
      </div>
    </section>
  );
}

export function SeccionTapa() {
  return (
    <section>
      <Portadilla
        id="tapa"
        titulo="Tapa, contratapa e ISBN"
        kicker="Cover, back cover and ISBN"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <p className="font-light leading-relaxed">
          ISBN 978-631-01-7027-5. La foto de tapa es la Virgen del Valle en Catamarca, cada 8 de
          diciembre.
        </p>
        <figure className="mt-10">
          <div className="foto-libro mx-auto max-w-xl aspect-[3/4]">
            <img
              src="/images/tapa-tipografica.jpg"
              alt="Página de título tipográfica del libro Peregrinos"
            />
          </div>
          <figcaption className="mt-2 text-sm">
            Página de título del interior. La tapa ilustrada con la foto de la Virgen del Valle no
            forma parte de este PDF de interiores.
            <span className="caption-en block">
              Interior title page. The photographic cover is not included in this interior PDF.
            </span>
          </figcaption>
        </figure>
        <div className="mt-8">
          {/* PENDIENTE: archivo de tapa/contratapa en alta resolución */}
          <Pendiente titulo="Pendiente — tapa y contratapa en alta">
            Confirmar con el cliente si tiene el archivo de tapa y contratapa (con QR e ISBN) en alta
            resolución, aparte del PDF interior.
          </Pendiente>
        </div>
      </div>
    </section>
  );
}
