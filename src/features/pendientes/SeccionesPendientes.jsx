import { useSelector } from "react-redux";
import { Pendiente } from "../../components/ui/Pendiente";
import { Portadilla } from "../../components/ui/Portadilla";

export function SeccionShop() {
  return (
    <section>
      <Portadilla id="shop" titulo="Comprar el libro" kicker="Buy the book" />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <p className="font-light leading-relaxed">
          Edición bilingüe español/inglés. 324 páginas. Tirada de 1000 ejemplares. ISBN
          978-631-01-7027-5.
        </p>
        <div className="mt-8">
          <Pendiente titulo="Pendiente — Amazon y entrega en todo el país">
            Falta el link de Amazon (o el canal de venta que corresponda) y confirmar la política de
            entrega en todo el país que el cliente quiere mostrar.
          </Pendiente>
        </div>
      </div>
    </section>
  );
}

export function SeccionVideo() {
  const videos = useSelector((state) => state.videos.publicItems);
  const published = videos.filter((v) => v.status === "PUBLISHED" || v.externalId);

  return (
    <section>
      <Portadilla
        id="video"
        titulo="Video resumen de las fiestas"
        kicker="Festival summary video"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {published.length === 0 ? (
          <>
            <Pendiente titulo="Pendiente — YouTube">
              Todavía no hay videos publicados en el backend. Cargalos desde el panel admin.
            </Pendiente>
            <div className="mt-6 aspect-video w-full border border-dashed border-azul-logo/40 bg-papel" />
          </>
        ) : (
          <div className="flex flex-col gap-8">
            {published.map((video) => {
              const title =
                video.translation?.title ||
                video.translations?.find((t) => t.locale === "es")?.title ||
                "Video";
              return (
                <div key={video.id}>
                  <h3 className="subtitulo-seccion">{title}</h3>
                  <div className="mt-4 aspect-video w-full overflow-hidden bg-papel">
                    <iframe
                      title={title}
                      src={`https://www.youtube.com/embed/${video.externalId}`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export function SeccionPapaLeon() {
  return (
    <section>
      <Portadilla
        id="papa-leon"
        titulo="Entrega al papa León XIV"
        kicker="Presenting the book to Pope Leo XIV"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <Pendiente titulo="Pendiente — fotografía">
          La foto de la entrega del libro al papa León XIV en Argentina no está en el PDF. Hay que
          pedirla al cliente.
        </Pendiente>
        <div className="mt-6 aspect-[4/3] w-full border border-dashed border-azul-logo/40 bg-papel" />
      </div>
    </section>
  );
}

export function SeccionRedes() {
  const links = useSelector((state) => state.social.publicItems);

  return (
    <section>
      <Portadilla id="redes" titulo="Redes" kicker="Instagram and Facebook" />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {links.length === 0 ? (
          <>
            <Pendiente titulo="Pendiente — cuentas">
              Todavía no hay redes cargadas. Agregalas desde el panel admin.
            </Pendiente>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <span className="border border-dashed border-azul-logo/50 px-4 py-3 text-azul-logo">
                Instagram
              </span>
              <span className="border border-dashed border-azul-logo/50 px-4 py-3 text-azul-logo">
                Facebook
              </span>
            </div>
          </>
        ) : (
          <div className="mt-2 flex flex-col gap-3 sm:flex-row">
            {links.map((link) => (
              <a
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="border border-azul-petroleo px-4 py-3 text-azul-petroleo transition hover:bg-azul-petroleo hover:text-blanco"
              >
                {link.platform}
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
