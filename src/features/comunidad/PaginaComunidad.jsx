import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useSearchParams } from "react-router-dom";
import { claveLista, fetchPosts } from "../../redux/slices/communitySlice";
import { Portadilla } from "../../components/ui/Portadilla";
import { Boton } from "../../components/ui/Boton";
import { MensajeTienda } from "../../components/tienda/TiendaUI";
import { BotonVerMas, SkeletonPublicacion, TarjetaPublicacion } from "../../components/comunidad/ComunidadUI";
import { useDebounce, useOpcionesComunidad, usePostsDeLista } from "../../hooks/useComunidad";
import { useMetaPagina } from "../../hooks/useMetaPagina";
import { plural } from "../../utils/comunidad";

/** Filtros en la URL (se pueden compartir y las etiquetas de cada publicación llevan acá). */
const PARAMS = { orden: "sort", fiesta: "celebration", provincia: "province", santo: "person", q: "q" };

function Selector({ id, label, value, onChange, opciones, todos }) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-azul-petroleo">
        {label}
      </label>
      <select id={id} className="campo-input" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">{todos}</option>
        {opciones.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function PaginaComunidad() {
  const dispatch = useDispatch();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = useSelector((s) => s.userAuth.user);
  const { fiestas, provincias, santos } = useOpcionesComunidad();

  const filtros = useMemo(() => {
    const out = {};
    Object.entries(PARAMS).forEach(([url, api]) => {
      const v = searchParams.get(url);
      if (v) out[api] = v;
    });
    if (out.sort !== "popular") delete out.sort;
    return out;
  }, [searchParams]);

  const [busqueda, setBusqueda] = useState(filtros.q || "");
  const busquedaDebounced = useDebounce(busqueda, 400);
  const key = claveLista(filtros);
  const lista = useSelector((s) => s.community.listas[key]);
  const posts = usePostsDeLista(key);

  useMetaPagina({
    title: "Comunidad",
    description: "Peregrinos de todo el país comparten sus fotos y experiencias en las fiestas populares argentinas.",
  });

  useEffect(() => {
    dispatch(fetchPosts({ params: filtros }));
  }, [dispatch, filtros]);

  useEffect(() => {
    if ((busquedaDebounced.trim() || "") === (searchParams.get("q") || "")) return;
    setFiltro("q", busquedaDebounced.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busquedaDebounced]);

  function setFiltro(nombre, valor) {
    const next = new URLSearchParams(searchParams);
    if (valor) next.set(nombre, valor);
    else next.delete(nombre);
    setSearchParams(next, { replace: nombre === "q" });
  }

  function limpiar() {
    setBusqueda("");
    setSearchParams({});
  }

  const hayFiltros = ["fiesta", "provincia", "santo", "q"].some((k) => searchParams.get(k));
  const fiestaActual = fiestas.find((f) => f.slug === filtros.celebration);
  const cargando = !lista || lista.status === "loading" || lista.status === "idle";
  const orden = filtros.sort === "popular" ? "popular" : "recent";

  return (
    <section>
      <Portadilla id="comunidad" titulo="Comunidad" />
      <div className="bg-papel px-4 pb-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <p className="max-w-2xl">
            Peregrinos de todo el país comparten lo que vivieron en las fiestas populares: fotos, promesas y recuerdos.
          </p>
          <Boton to="/comunidad/publicar" className="shrink-0">
            {user ? "Contar mi experiencia" : "Compartir una fiesta"}
          </Boton>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4">
          <div role="group" aria-label="Ordenar publicaciones" className="flex flex-wrap gap-2">
            {[
              ["recent", "Recientes"],
              ["popular", "Populares"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`filtro-chip text-sm ${orden === value ? "is-on" : ""}`}
                aria-pressed={orden === value}
                onClick={() => setFiltro("orden", value === "popular" ? "popular" : "")}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Selector
              id="filtro-fiesta"
              label="Fiesta"
              todos="Todas las fiestas"
              value={filtros.celebration || ""}
              onChange={(v) => setFiltro("fiesta", v)}
              opciones={fiestas.map((f) => ({ value: f.slug, label: f.nombre }))}
            />
            <Selector
              id="filtro-provincia"
              label="Provincia"
              todos="Todas las provincias"
              value={filtros.province || ""}
              onChange={(v) => setFiltro("provincia", v)}
              opciones={provincias.map((p) => ({ value: p.slug, label: p.name }))}
            />
            <Selector
              id="filtro-santo"
              label="Santo o beato"
              todos="Todos"
              value={filtros.person || ""}
              onChange={(v) => setFiltro("santo", v)}
              opciones={santos.map((s) => ({ value: s.slug, label: s.name }))}
            />
            <div>
              <label htmlFor="filtro-buscar" className="text-sm font-medium text-azul-petroleo">
                Buscar
              </label>
              <input
                id="filtro-buscar"
                type="search"
                className="campo-input"
                placeholder="Palabras del título o del texto"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
          </div>
          {hayFiltros ? (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              {lista?.status === "succeeded" ? (
                <p role="status">
                  {posts.length
                    ? `${plural(posts.length, "publicación", "publicaciones")}${lista.nextCursor ? " (hay más)" : ""}`
                    : "Sin resultados"}
                </p>
              ) : null}
              <button type="button" onClick={limpiar} className="text-celeste-cielo underline">
                Limpiar filtros
              </button>
            </div>
          ) : null}
        </div>

        <div className="mt-8">
          {location.state?.cuentaEliminada ? (
            <p className="mb-6 border border-azul-logo/20 bg-papel px-4 py-3 text-sm" role="status">
              Tu cuenta fue eliminada. Gracias por haber sido parte.
            </p>
          ) : null}
          {lista?.status === "failed" ? (
            <MensajeTienda
              tono="error"
              titulo="No pudimos cargar la comunidad"
              texto={lista.error}
              accion={<Boton onClick={() => dispatch(fetchPosts({ params: filtros }))}>Reintentar</Boton>}
            />
          ) : cargando && posts.length === 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              <span className="sr-only" role="status">
                Cargando publicaciones…
              </span>
              {[0, 1, 2].map((i) => (
                <SkeletonPublicacion key={i} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <MensajeTienda
              titulo={fiestaActual ? "Todavía nadie compartió nada sobre esta fiesta" : "No encontramos publicaciones"}
              texto={fiestaActual ? "¡Sé el primero en contar cómo la viviste!" : "Probá con otros filtros o con otra búsqueda."}
              accion={
                fiestaActual ? (
                  <Boton to={`/comunidad/publicar?fiesta=${fiestaActual.slug}`}>Compartir esta fiesta</Boton>
                ) : hayFiltros ? (
                  <Boton variante="secundario" onClick={limpiar}>
                    Ver todo
                  </Boton>
                ) : null
              }
            />
          ) : (
            <>
              <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {posts.map((p) => (
                  <li key={p.id}>
                    <TarjetaPublicacion post={p} />
                  </li>
                ))}
              </ul>
              <BotonVerMas
                hayMas={Boolean(lista?.nextCursor)}
                cargando={lista?.loadingMore}
                error={lista?.error}
                onClick={() => dispatch(fetchPosts({ params: filtros, append: true }))}
              />
            </>
          )}
        </div>
      </div>
    </section>
  );
}
