import { Pendiente } from "./Pendiente";
import { Portadilla } from "./Portadilla";

export function SeccionCreditos() {
  return (
    <section>
      <Portadilla id="creditos" titulo="Créditos" kicker="Credits" />
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <dl className="space-y-3 text-sm leading-relaxed md:text-base">
          <div>
            <dt className="font-medium text-azul-petroleo">Idea, edición general y fotografías</dt>
            <dd>Federico Lanati</dd>
          </div>
          <div>
            <dt className="font-medium text-azul-petroleo">Editores</dt>
            <dd>Juan Travnik y Gustavo Tarchini</dd>
          </div>
          <div>
            <dt className="font-medium text-azul-petroleo">Corrección de estilo (español)</dt>
            <dd>Magena Valentié</dd>
          </div>
          <div>
            <dt className="font-medium text-azul-petroleo">Diseño</dt>
            <dd>Estudio Massolo — Fabio Massolo</dd>
          </div>
          <div>
            <dt className="font-medium text-azul-petroleo">Infografías</dt>
            <dd>Daniel Fontanarrosa</dd>
          </div>
          <div>
            <dt className="font-medium text-azul-petroleo">Ilustración</dt>
            <dd>Alfredo Sabat</dd>
          </div>
          <div>
            <dt className="font-medium text-azul-petroleo">Fotocromía</dt>
            <dd>Estudio Ricardo Farías</dd>
          </div>
          <div>
            <dt className="font-medium text-azul-petroleo">Impresión</dt>
            <dd>Akian Gráfica Editora</dd>
          </div>
          <div>
            <dt className="font-medium text-azul-petroleo">Traducción al inglés</dt>
            <dd>Florencia Paz</dd>
          </div>
          <div>
            <dt className="font-medium text-azul-petroleo">Revisión general</dt>
            <dd>Valeria Cangemi</dd>
          </div>
        </dl>

        <p className="mt-8 font-light">Edición bilingüe. Tirada: 1000 ejemplares.</p>

        <h3 className="mt-12 font-display text-xl text-azul-petroleo">Agradecimientos — Colaboradores</h3>
        <p className="mt-3 font-light leading-relaxed">
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

        <h3 className="mt-12 font-display text-xl text-azul-petroleo">Ficha catalográfica</h3>
        <p className="mt-3 text-sm font-light leading-relaxed">
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
      <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
        <p className="font-light leading-relaxed">
          ISBN 978-631-01-7027-5. La foto de tapa es la Virgen del Valle en Catamarca, cada 8 de
          diciembre.
        </p>
        <figure className="mt-8">
          <img
            src="/images/tapa-tipografica.jpg"
            alt="Página de título tipográfica del libro Peregrinos"
            className="mx-auto w-full max-w-xl"
          />
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
