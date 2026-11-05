import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { fetchCelebrationSummary } from "../../redux/slices/communitySlice";
import { plural } from "../../utils/comunidad";

/** "Lo que comparte la comunidad" en el detalle de una fiesta (mapa, calendario y galería). */
export function BloqueComunidadFiesta({ slug, nombre, compacto = false }) {
  const dispatch = useDispatch();
  const resumen = useSelector((s) => (slug ? s.community.resumenes[slug] : null));
  const postsById = useSelector((s) => s.community.postsById);
  const posts = useMemo(() => (resumen?.ids || []).map((id) => postsById[id]).filter(Boolean), [resumen, postsById]);

  useEffect(() => {
    if (slug) dispatch(fetchCelebrationSummary(slug));
  }, [dispatch, slug]);

  if (!slug) return null;
  const tituloId = `comunidad-${slug}`;

  return (
    <section aria-labelledby={tituloId} className={`border-t border-azul-logo/15 ${compacto ? "mt-3 pt-3" : "mt-8 pt-6"}`}>
      <h3 id={tituloId} className={`font-display text-azul-petroleo ${compacto ? "text-sm" : "text-xl"}`}>
        Lo que comparte la comunidad
      </h3>
      {!resumen || resumen.status === "loading" ? (
        <div className="mt-2 flex flex-col gap-2" aria-busy="true">
          <div className="tienda-skeleton h-12 w-full" />
          <div className="tienda-skeleton h-12 w-full" />
        </div>
      ) : resumen.status === "failed" ? (
        <p className="mt-2 text-xs">No pudimos cargar las publicaciones de la comunidad.</p>
      ) : posts.length === 0 ? (
        <p className="mt-2 text-sm">
          Todavía nadie compartió nada sobre esta fiesta.{" "}
          <Link to={`/comunidad/publicar?fiesta=${slug}`} className="font-medium text-celeste-cielo underline">
            ¡Sé el primero!
          </Link>
        </p>
      ) : (
        <>
          <ul className={`mt-2 grid gap-2 ${compacto ? "" : "sm:grid-cols-3"}`}>
            {posts.map((p) => (
              <li key={p.id}>
                <Link to={`/comunidad/p/${p.slug}`} className="group flex gap-2 border border-azul-logo/15 bg-blanco p-2 hover:border-celeste-cielo">
                  <span className="foto-libro block h-12 w-16 shrink-0">{p.cover ? <img src={p.cover.url} alt="" loading="lazy" /> : null}</span>
                  <span className="min-w-0">
                    <span className="line-clamp-2 text-sm leading-snug text-azul-petroleo group-hover:text-celeste-cielo">{p.title}</span>
                    <span className="block truncate text-xs">por {p.author?.displayName || "Cuenta eliminada"}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            to={`/comunidad?fiesta=${slug}`}
            className="mt-2 inline-block text-xs font-medium uppercase tracking-wide text-celeste-cielo"
            aria-label={`Ver ${plural(resumen.postCount, "publicación", "publicaciones")} sobre ${nombre}`}
          >
            Ver {plural(resumen.postCount, "publicación", "publicaciones")} →
          </Link>
        </>
      )}
    </section>
  );
}
