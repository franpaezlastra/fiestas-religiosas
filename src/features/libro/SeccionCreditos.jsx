import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Pendiente } from "../../components/ui/Pendiente";
import { Portadilla } from "../../components/ui/Portadilla";
import { SectionLoader } from "../../components/ui/SectionLoader";
import { SoftImage } from "../../components/ui/SoftImage";
import { fetchPublicBooks } from "../../redux/slices/booksSlice";
import { optimizeCloudinaryUrl } from "../../utils/celebrationsAdapter";
import { isPublicLoading } from "../../utils/preload";

function bookTitle(book) {
  return (
    book.translation?.title ||
    book.translations?.find((t) => t.locale === "es")?.title ||
    book.isbn
  );
}

function bookCoverUrl(book) {
  if (!book) return null;
  const imgs = book.images || [];
  const cover =
    imgs.find((i) => i.imageRole === "COVER") ||
    imgs.find((i) => i.isPrimary) ||
    imgs[0];
  const media = cover?.media || cover;
  if (!media) return null;
  let url = null;
  if (media.url) url = media.url;
  else if (media.storageKey) {
    const cloud = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || "duuwqmpmn";
    url = `https://res.cloudinary.com/${cloud}/image/upload/${media.storageKey}`;
  }
  return optimizeCloudinaryUrl(url, 800);
}

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
  const dispatch = useDispatch();
  const books = useSelector((s) => s.books.publicItems);
  const publicStatus = useSelector((s) => s.books.publicStatus);
  const loading = isPublicLoading(publicStatus);
  const book = useMemo(() => {
    const list = Array.isArray(books) ? books : [];
    return (
      list.find((b) => String(b.isbn || "").includes("978-631-01-7027")) ||
      list.find((b) => b.status === "PUBLISHED") ||
      list[0] ||
      null
    );
  }, [books]);

  useEffect(() => {
    dispatch(fetchPublicBooks());
  }, [dispatch]);

  const cover = bookCoverUrl(book);
  const tr =
    book?.translation ||
    book?.translations?.find((t) => t.locale === "es") ||
    book?.translations?.[0];

  return (
    <section>
      <Portadilla
        id="tapa"
        titulo="Tapa, contratapa e ISBN"
        kicker="Cover, back cover and ISBN"
      />

      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {loading ? (
          <SectionLoader
            texto="Cargando el libro…"
            hint="Buscamos la tapa y los datos de edición."
          />
        ) : (
          <>
            <p className="font-light leading-relaxed">
              {tr?.description ||
                "ISBN 978-631-01-7027-5. La foto de tapa es la Virgen del Valle en Catamarca, cada 8 de diciembre."}
            </p>
            {book ? (
              <p className="mt-4 text-sm font-light">
                <span className="font-medium text-azul-petroleo">{bookTitle(book)}</span>
                {book.isbn ? ` · ISBN ${book.isbn}` : null}
                {book.publisher ? ` · ${book.publisher}` : null}
                {book.pageCount ? ` · ${book.pageCount} pág.` : null}
              </p>
            ) : null}
            <figure className="mt-10">
              <div className="foto-libro mx-auto max-w-xl aspect-[3/4]">
                <SoftImage
                  src={cover || "/images/tapa-tipografica.jpg"}
                  alt={
                    cover
                      ? `Tapa de ${bookTitle(book)}`
                      : "Página de título tipográfica del libro Peregrinos"
                  }
                  eager
                  className="h-full w-full"
                  imgClassName="h-full w-full object-cover"
                />
              </div>
              <figcaption className="mt-2 text-sm">
                {cover
                  ? "Tapa del libro (API)."
                  : "Página de título del interior. La tapa ilustrada con la foto de la Virgen del Valle no forma parte de este PDF de interiores."}
                <span className="caption-en block">
                  {cover
                    ? "Book cover from the API."
                    : "Interior title page. The photographic cover is not included in this interior PDF."}
                </span>
              </figcaption>
            </figure>
            {!book ? (
              <div className="mt-8">
                <Pendiente titulo="Pendiente — libro en el API">
                  Todavía no hay un libro publicado en /public/books. Cargalo desde el admin (ISBN
                  978-631-01-7027-5) o corré el seed.
                </Pendiente>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}

