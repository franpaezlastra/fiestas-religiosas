import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchShopCategories, fetchShopProducts } from "../../redux/slices/shopSlice";
import { Boton } from "../../components/ui/Boton";
import {
  EncabezadoTienda,
  MensajeTienda,
  SkeletonTarjeta,
  TarjetaProducto,
} from "../../components/tienda/TiendaUI";

export function PaginaTienda() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoria = searchParams.get("categoria") || "";
  const q = searchParams.get("q") || "";
  const [busqueda, setBusqueda] = useState(q);

  const categories = useSelector((s) => s.shop.categories);
  const products = useSelector((s) => s.shop.products);
  const status = useSelector((s) => s.shop.productsStatus);
  const error = useSelector((s) => s.shop.productsError);

  useEffect(() => {
    dispatch(fetchShopCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchShopProducts({ category: categoria, q }));
  }, [dispatch, categoria, q]);

  /* Búsqueda con pequeña espera para no pedir en cada tecla */
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (busqueda.trim() === q) return;
      const next = new URLSearchParams(searchParams);
      if (busqueda.trim()) next.set("q", busqueda.trim());
      else next.delete("q");
      setSearchParams(next, { replace: true });
    }, 350);
    return () => window.clearTimeout(t);
  }, [busqueda, q, searchParams, setSearchParams]);

  function elegirCategoria(slug) {
    const next = new URLSearchParams(searchParams);
    if (slug) next.set("categoria", slug);
    else next.delete("categoria");
    setSearchParams(next);
  }

  const cargando = status === "loading" || status === "idle";

  return (
    <section>
      <EncabezadoTienda titulo="Tienda" kicker="Los libros de Federico Lanati">
        <p className="mt-2 max-w-2xl">Comprá el libro con envío a todo el país por Andreani.</p>
      </EncabezadoTienda>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          {/* Con una sola categoría (hoy, solo libros) el filtro no aporta */}
          {categories.length > 1 ? (
            <div role="group" aria-label="Filtrar por categoría" className="flex flex-wrap gap-2">
              <button
                type="button"
                className={`filtro-chip text-sm ${!categoria ? "is-on" : ""}`}
                aria-pressed={!categoria}
                onClick={() => elegirCategoria("")}
              >
                Todo
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={`filtro-chip text-sm ${categoria === c.slug ? "is-on" : ""}`}
                  aria-pressed={categoria === c.slug}
                  onClick={() => elegirCategoria(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>
          ) : (
            <div />
          )}
          <div className="w-full md:max-w-xs">
            <label htmlFor="tienda-buscar" className="text-sm font-medium text-azul-petroleo">
              Buscar
            </label>
            <input
              id="tienda-buscar"
              type="search"
              className="campo-input"
              placeholder="Título del libro"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-8">
          {status === "failed" ? (
            <MensajeTienda
              tono="error"
              titulo="No pudimos cargar la tienda"
              texto={error}
              accion={
                <Boton onClick={() => dispatch(fetchShopProducts({ category: categoria, q }))}>
                  Reintentar
                </Boton>
              }
            />
          ) : cargando ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true">
              <span className="sr-only" role="status">
                Cargando productos…
              </span>
              {[0, 1, 2].map((i) => (
                <SkeletonTarjeta key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <MensajeTienda
              titulo="No encontramos productos"
              texto={q ? `No hay resultados para “${q}”.` : "Todavía no hay productos en esta categoría."}
              accion={
                q || categoria ? (
                  <Boton
                    variante="secundario"
                    onClick={() => {
                      setBusqueda("");
                      setSearchParams({});
                    }}
                  >
                    Ver todo
                  </Boton>
                ) : null
              }
            />
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <li key={p.id}>
                  <TarjetaProducto product={p} />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
