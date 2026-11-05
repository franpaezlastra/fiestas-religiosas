import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { fetchNovedad, fetchNovedades } from "../../redux/slices/novedadesSlice";
import { Portadilla } from "../../components/ui/Portadilla";
import { Boton } from "../../components/ui/Boton";
import { MensajeTienda } from "../../components/tienda/TiendaUI";
import { TextoPlano } from "../../components/comunidad/ComunidadUI";
import { LightboxComunidad } from "../../components/comunidad/Interaccion";
import { useMetaPagina } from "../../hooks/useMetaPagina";
import { plural } from "../../utils/comunidad";
import { TIPOS_NOVEDAD, formatFechaNovedad, lugarNovedad, ordenarNovedades } from "../../utils/novedades";

/* ---------- Piezas ---------- */

function Meta({ n }) {
  return (
    <p className="font-display text-xs uppercase tracking-wide text-celeste-cielo">
      {TIPOS_NOVEDAD[n.type]} · {formatFechaNovedad(n)}
    </p>
  );
}

/** La publicación más reciente, grande y horizontal. */
function Destacada({ n }) {
  return (
    <article className="card-hover grid border border-azul-logo/15 bg-blanco md:grid-cols-2">
      {n.cover ? (
        <Link to={`/novedades/${n.slug}`} tabIndex={-1} aria-hidden className="foto-libro block aspect-[4/3] md:aspect-auto md:min-h-80">
          <img src={n.cover.url} alt="" />
        </Link>
      ) : null}
      <div className="flex flex-col gap-3 p-5 md:p-8">
        <Meta n={n} />
        <h2 className="font-display text-2xl leading-snug text-azul-petroleo md:text-3xl">
          <Link to={`/novedades/${n.slug}`} className="hover:text-celeste-cielo">
            {n.title}
          </Link>
        </h2>
        {lugarNovedad(n) ? <p className="text-sm">{lugarNovedad(n)}</p> : null}
        {n.summary ? <p>{n.summary}</p> : null}
        <div className="mt-auto pt-2">
          <Boton to={`/novedades/${n.slug}`} tamano="sm">
            Leer más{n.images.length > 1 ? ` · ${plural(n.images.length, "foto", "fotos")}` : ""}
          </Boton>
        </div>
      </div>
    </article>
  );
}

function Tarjeta({ n }) {
  return (
    <article className="card-hover flex h-full flex-col border border-azul-logo/15 bg-blanco">
      {n.cover ? (
        <Link to={`/novedades/${n.slug}`} tabIndex={-1} aria-hidden className="foto-libro block aspect-[4/3]">
          <img src={n.cover.url} alt="" loading="lazy" />
        </Link>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        <Meta n={n} />
        <h3 className="font-display text-lg leading-snug text-azul-petroleo">
          <Link to={`/novedades/${n.slug}`} className="hover:text-celeste-cielo">
            {n.title}
          </Link>
        </h3>
        {n.summary ? <p className="text-sm leading-snug">{n.summary}</p> : null}
        {n.images.length > 1 ? <p className="mt-auto pt-2 text-xs">{plural(n.images.length, "foto", "fotos")}</p> : null}
      </div>
    </article>
  );
}

function Skeletons() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <span className="sr-only" role="status">
        Cargando novedades…
      </span>
      <div className="tienda-skeleton h-72 w-full" />
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="tienda-skeleton aspect-[4/3]" />
        ))}
      </div>
    </div>
  );
}

/* ---------- /novedades ---------- */

const FILTROS = [
  ["", "Todas"],
  ["PRESENTATION", "Presentaciones"],
  ["EXHIBITION", "Muestras"],
  ["PRESS", "Prensa"],
];

export function PaginaNovedades() {
  useMetaPagina({
    title: "Novedades del libro",
    description: "Presentaciones, muestras y notas de prensa de Peregrinos. 80 fiestas populares argentinas.",
  });
  const dispatch = useDispatch();
  const { publicItems, status, error } = useSelector((s) => s.novedades);
  const [tipo, setTipo] = useState("");

  useEffect(() => {
    dispatch(fetchNovedades());
  }, [dispatch]);

  const todas = useMemo(() => ordenarNovedades(publicItems), [publicItems]);
  const filtradas = tipo ? todas.filter((n) => n.type === tipo) : todas;
  const [destacada, ...resto] = filtradas;
  const cargando = status === "idle" || (status === "loading" && !publicItems.length);

  return (
    <section>
      <Portadilla id="novedades" titulo="Novedades del libro" />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {status === "failed" ? (
          <MensajeTienda
            tono="error"
            titulo="No pudimos cargar las novedades"
            texto={error}
            accion={<Boton onClick={() => dispatch(fetchNovedades())}>Reintentar</Boton>}
          />
        ) : cargando ? (
          <Skeletons />
        ) : todas.length === 0 ? (
          <MensajeTienda titulo="Todavía no hay novedades" texto="Pronto vamos a compartir presentaciones, muestras y notas sobre el libro." />
        ) : (
          <>
            <div role="group" aria-label="Filtrar por tipo" className="mb-6 flex flex-wrap gap-2">
              {FILTROS.map(([value, label]) => (
                <button
                  key={value || "todas"}
                  type="button"
                  className={`filtro-chip text-sm ${tipo === value ? "is-on" : ""}`}
                  aria-pressed={tipo === value}
                  onClick={() => setTipo(value)}
                >
                  {label}
                </button>
              ))}
            </div>
            {!destacada ? (
              <p>No hay novedades de este tipo todavía.</p>
            ) : (
              <>
                <Destacada n={destacada} />
                {resto.length ? (
                  <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {resto.map((n) => (
                      <li key={n.id}>
                        <Tarjeta n={n} />
                      </li>
                    ))}
                  </ul>
                ) : null}
              </>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/* ---------- /novedades/:slug ---------- */

export function PaginaNovedad() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const entry = useSelector((s) => s.novedades.bySlug[slug]);
  const n = entry?.item;
  const [lightbox, setLightbox] = useState(null);

  useMetaPagina({ title: n?.title || "Novedad", description: n?.summary, image: n?.cover?.url });

  useEffect(() => {
    dispatch(fetchNovedad(slug));
  }, [dispatch, slug]);

  if (!n && (!entry || entry.status === "loading")) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10" aria-busy="true">
        <span className="sr-only" role="status">
          Cargando…
        </span>
        <div className="tienda-skeleton h-10 w-4/5" />
        <div className="tienda-skeleton mt-6 aspect-[16/9] w-full" />
      </div>
    );
  }

  if (!n) {
    const noExiste = entry?.error?.code === "NOT_FOUND";
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <MensajeTienda
          tono={noExiste ? "info" : "error"}
          titulo={noExiste ? "Esta novedad no está disponible" : "No pudimos cargar la novedad"}
          texto={noExiste ? null : entry?.error?.message}
          accion={<Boton to="/novedades">Ver todas las novedades</Boton>}
        />
      </div>
    );
  }

  return (
    <article className="pb-12">
      <header className="bg-papel px-4 pt-8 pb-6 md:pt-12">
        <div className="mx-auto max-w-3xl">
          <nav aria-label="Migas de pan" className="mb-4 text-sm">
            <Link to="/novedades" className="text-celeste-cielo hover:text-azul-petroleo">
              Novedades del libro
            </Link>
          </nav>
          <Meta n={n} />
          <h1 className="titulo-seccion">{n.title}</h1>
          {lugarNovedad(n) ? <p className="mt-2">{lugarNovedad(n)}</p> : null}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4">
        {n.images.length ? (
          <div className={`mt-6 grid gap-2 ${n.images.length > 1 ? "grid-cols-2 sm:grid-cols-3" : ""}`}>
            {n.images.map((img, i) => (
              <button
                key={img.id}
                type="button"
                onClick={() => setLightbox(i)}
                className={`foto-libro block ${n.images.length === 1 ? "aspect-[16/10]" : i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square"}`}
                aria-label={`Ampliar foto ${i + 1} de ${n.images.length}${img.alt ? `: ${img.alt}` : ""}`}
              >
                <img src={img.url} alt="" loading={i === 0 ? "eager" : "lazy"} />
              </button>
            ))}
          </div>
        ) : null}

        {n.summary ? <p className="mt-8 text-lg font-medium text-azul-petroleo">{n.summary}</p> : null}
        {n.body ? <TextoPlano texto={n.body} className="mt-4 text-lg leading-relaxed" /> : null}

        {n.externalUrl ? (
          <div className="mt-6">
            <a
              href={n.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="boton-sitio inline-flex border border-azul-petroleo px-5 py-2.5 text-sm font-medium text-azul-petroleo hover:bg-azul-petroleo hover:text-blanco"
            >
              {n.type === "PRESS" ? "Leer la nota completa" : "Más información"}
              <span className="sr-only"> (se abre en otra pestaña)</span>
            </a>
          </div>
        ) : null}

        <div className="mt-10 border-t border-azul-logo/15 pt-6">
          <Boton variante="secundario" to="/novedades">
            ← Todas las novedades
          </Boton>
        </div>
      </div>

      <LightboxComunidad imagenes={n.images} indice={lightbox} onClose={() => setLightbox(null)} titulo={n.title} />
    </article>
  );
}
