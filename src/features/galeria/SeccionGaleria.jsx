import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { GaleriaModal } from "../../components/gallery/GaleriaModal";
import { ProtectedImage } from "../../components/gallery/ProtectedImage";
import { Portadilla } from "../../components/ui/Portadilla";
import { fetchPublicCelebrations, selectFiestasUi } from "../../redux/slices/celebrationsSlice";
import { celebrationsService } from "../../services";
import {
  celebrationImageUrls,
  fiestaNumero,
} from "../../utils/celebrationsAdapter";
import {
  coincideFiltro,
  filtrosActivos,
  MESES,
  MES_NOMBRE,
  mesesDe,
  provinciasDe,
} from "../../utils/fiestaFiltros";
import { fotoPortada, tieneFotosApi } from "../../utils/galeria";

function useFiestas() {
  const dispatch = useDispatch();
  const FIESTAS = useSelector(selectFiestasUi);

  useEffect(() => {
    dispatch(fetchPublicCelebrations());
  }, [dispatch]);

  return FIESTAS;
}

function leerFiltros(params) {
  return {
    q: params.get("q") || "",
    provincia: params.get("provincia") || "todas",
    mes: params.get("mes") || "todos",
  };
}

function labelProvincia(r) {
  if (r === "todas") return "Todas";
  if (r === "Argentina") return "Todo el país";
  return r;
}

function paramsIguales(a, b) {
  return a.toString() === b.toString();
}

export function SeccionGaleria() {
  const FIESTAS = useFiestas();
  const [searchParams, setSearchParams] = useSearchParams();
  const inicial = leerFiltros(searchParams);

  const [provincia, setProvincia] = useState(inicial.provincia);
  const [mes, setMes] = useState(inicial.mes);
  const [q, setQ] = useState(inicial.q);
  const [activaId, setActivaId] = useState(null);
  const [fotosAlbum, setFotosAlbum] = useState([]);
  const [cargandoAlbum, setCargandoAlbum] = useState(false);
  const [albumListo, setAlbumListo] = useState(false);
  const [errorAlbum, setErrorAlbum] = useState(null);
  const [lightbox, setLightbox] = useState(null);
  const [rotas, setRotas] = useState(() => new Set());

  // Solo fiestas con portada real del API (sin huecos vacíos)
  const conMedia = useMemo(
    () => FIESTAS.filter((f) => tieneFotosApi(f) && Boolean(fotoPortada(f))),
    [FIESTAS],
  );

  const PROVINCIAS = useMemo(() => provinciasDe(conMedia), [conMedia]);
  const MESES_OPTS = useMemo(() => {
    const disponibles = mesesDe(conMedia);
    return disponibles.length > 1 ? disponibles : MESES;
  }, [conMedia]);

  const filtradas = useMemo(
    () =>
      conMedia
        .filter((f) => coincideFiltro(f, { provincia, mes, q }))
        .filter((f) => !rotas.has(f.id)),
    [conMedia, provincia, mes, q, rotas],
  );

  const hayFiltros = filtrosActivos({ provincia, mes, q });
  const activa = useMemo(
    () => FIESTAS.find((f) => f.id === activaId) || null,
    [FIESTAS, activaId],
  );

  useEffect(() => {
    const next = new URLSearchParams();
    if (q.trim()) next.set("q", q.trim());
    if (provincia !== "todas") next.set("provincia", provincia);
    if (mes !== "todos") next.set("mes", mes);
    if (activaId) {
      const f = FIESTAS.find((x) => x.id === activaId);
      if (f) next.set("fiesta", String(fiestaNumero(f) || f.id));
    } else {
      // No borrar ?fiesta= mientras todavía no llegaron las celebraciones
      const pending = searchParams.get("fiesta");
      if (pending && FIESTAS.length === 0) next.set("fiesta", pending);
    }
    if (!paramsIguales(next, searchParams)) {
      setSearchParams(next, { replace: true });
    }
  }, [q, provincia, mes, activaId, FIESTAS, searchParams, setSearchParams]);

  useEffect(() => {
    const param = searchParams.get("fiesta");
    if (!param || !FIESTAS.length) return;
    const match = FIESTAS.find(
      (f) => String(f.id) === param || String(fiestaNumero(f)) === param || f.apiId === param,
    );
    if (match && tieneFotosApi(match)) setActivaId(match.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [FIESTAS]);

  // Álbum: depende de activaId (estable) para no cancelar el fetch en loop
  useEffect(() => {
    if (!activaId) {
      setFotosAlbum([]);
      setCargandoAlbum(false);
      setAlbumListo(false);
      setErrorAlbum(null);
      return;
    }

    const fiesta = FIESTAS.find((f) => f.id === activaId);
    if (!fiesta) return;

    const celebrationId = fiesta.apiId || activaId;
    let cancelled = false;

    setCargandoAlbum(true);
    setAlbumListo(false);
    setErrorAlbum(null);
    setFotosAlbum([]);

    celebrationsService
      .publicImages(celebrationId)
      .then((rows) => {
        if (cancelled) return;
        const list = Array.isArray(rows) ? rows : [];
        const urls = celebrationImageUrls({ images: list }, { maxWidth: 1200 });
        setFotosAlbum(urls);
        setCargandoAlbum(false);
        if (urls.length === 0) setAlbumListo(true);
      })
      .catch((err) => {
        if (cancelled) return;
        setFotosAlbum([]);
        setErrorAlbum(err?.message || "No se pudieron cargar las fotos");
        setCargandoAlbum(false);
        setAlbumListo(true);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activaId]);

  // Esperar a que bajen las imágenes antes de sacar el loader (evita el tramo vacío)
  useEffect(() => {
    if (cargandoAlbum || fotosAlbum.length === 0) return undefined;

    let pending = fotosAlbum.length;
    let cancelled = false;
    setAlbumListo(false);

    function done() {
      pending -= 1;
      if (!cancelled && pending <= 0) setAlbumListo(true);
    }

    const loaders = fotosAlbum.map((url) => {
      const img = new Image();
      img.onload = done;
      img.onerror = done;
      img.src = url;
      return img;
    });

    const failsafe = setTimeout(() => {
      if (!cancelled) setAlbumListo(true);
    }, 10000);

    return () => {
      cancelled = true;
      clearTimeout(failsafe);
      loaders.forEach((img) => {
        img.onload = null;
        img.onerror = null;
      });
    };
  }, [fotosAlbum, cargandoAlbum]);

  const mostrandoLoader = Boolean(activaId) && (cargandoAlbum || (fotosAlbum.length > 0 && !albumListo));

  function elegirFiesta(f) {
    setActivaId(f.id);
    setLightbox(null);
  }

  function volverIndice() {
    setActivaId(null);
    setLightbox(null);
    setFotosAlbum([]);
    setErrorAlbum(null);
    setCargandoAlbum(false);
    setAlbumListo(false);
  }

  function limpiarFiltros() {
    setQ("");
    setProvincia("todas");
    setMes("todos");
  }

  function marcarRota(id) {
    setRotas((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }

  const provinciaSelect = PROVINCIAS.includes(provincia) ? provincia : "todas";
  const mesSelect = MESES_OPTS.includes(mes) ? mes : "todos";

  return (
    <section>
      <Portadilla id="galeria" titulo="Galería" kicker="Photographs of the celebrations" />

      <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
        <p className="max-w-2xl font-light leading-relaxed">
          Preview de cada celebración. Elegí una fiesta para ver su galería completa. Filtrá por
          provincia o mes, o buscá por nombre. Las imágenes son de consulta: no se pueden descargar
          ni abrir en otra pestaña.
        </p>

        {!activa ? (
          <>
            <div className="galeria-filtros sticky top-16 z-30 mt-8 border border-azul-logo/15 bg-blanco/95 px-3 py-3 shadow-sm backdrop-blur-sm md:px-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <label className="text-sm">
                  Buscar
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
                    placeholder="Nombre, lugar, número…"
                  />
                </label>
                <label className="text-sm">
                  Provincia
                  <select
                    value={provinciaSelect}
                    onChange={(e) => setProvincia(e.target.value)}
                    className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
                  >
                    {PROVINCIAS.map((r) => (
                      <option key={r} value={r}>
                        {labelProvincia(r)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-sm">
                  Mes
                  <select
                    value={mesSelect}
                    onChange={(e) => setMes(e.target.value)}
                    className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
                  >
                    {MESES_OPTS.map((m) => (
                      <option key={m} value={m}>
                        {m === "todos" ? "Todos" : MES_NOMBRE[Number(m)] || m}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex items-end">
                  <button
                    type="button"
                    disabled={!hayFiltros}
                    onClick={limpiarFiltros}
                    className="w-full border border-azul-logo/40 px-3 py-2 text-sm text-azul-petroleo disabled:cursor-default disabled:opacity-40"
                  >
                    Limpiar filtros
                  </button>
                </div>
              </div>
              <p className="mt-3 text-sm text-azul-logo">
                {filtradas.length} fiesta{filtradas.length === 1 ? "" : "s"}
                {hayFiltros ? " con estos filtros" : ""}
                {provincia !== "todas" ? ` · ${labelProvincia(provincia)}` : ""}
                {mes !== "todos" ? ` · ${MES_NOMBRE[Number(mes)] || mes}` : ""}
              </p>
            </div>

            <ul className="galeria-indice mt-6">
              {filtradas.map((f) => {
                const portada = fotoPortada(f);
                if (!portada) return null;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="galeria-indice-card group w-full text-left"
                      onClick={() => elegirFiesta(f)}
                    >
                      <span className="galeria-indice-thumb">
                        <ProtectedImage
                          src={portada}
                          alt=""
                          fit="natural"
                          onError={() => marcarRota(f.id)}
                        />
                        <span className="galeria-indice-hover">
                          <span>Ver galería de {f.nombre}</span>
                        </span>
                      </span>
                      <span className="block px-1 pt-2.5">
                        <span className="font-display text-base text-azul-petroleo transition-colors group-hover:text-celeste-cielo">
                          <span className="mr-1.5 font-body text-xs tabular-nums opacity-70">
                            {String(fiestaNumero(f)).padStart(2, "0")}
                          </span>
                          {f.nombre}
                        </span>
                        <span className="mt-0.5 block text-xs font-light">
                          {f.lugar}
                          {f.provincia && f.lugar !== f.provincia ? `, ${f.provincia}` : ""}
                          {f.fecha ? ` · ${f.fecha}` : ""}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {filtradas.length === 0 ? (
              <p className="mt-10 text-sm">
                No hay fiestas con fotos para estos filtros.{" "}
                {hayFiltros ? (
                  <button
                    type="button"
                    className="text-celeste-cielo underline"
                    onClick={limpiarFiltros}
                  >
                    Limpiar
                  </button>
                ) : null}
              </p>
            ) : null}
          </>
        ) : (
          <div className="mt-8">
            <button
              type="button"
              className="text-sm font-medium uppercase tracking-wide text-celeste-cielo"
              onClick={volverIndice}
            >
              ← Todas las fiestas
            </button>

            <header className="mt-4 border-b border-azul-logo/20 pb-4">
              <h3 className="font-display text-2xl text-azul-petroleo md:text-3xl">
                <span className="mr-2 font-body text-base tabular-nums opacity-70">
                  {String(fiestaNumero(activa)).padStart(2, "0")}
                </span>
                {activa.nombre}
              </h3>
              <p className="mt-1 text-sm font-light">
                {activa.lugar}
                {activa.provincia && activa.lugar !== activa.provincia
                  ? `, ${activa.provincia}`
                  : ""}
                {activa.fecha ? ` · ${activa.fecha}` : ""}
                {!mostrandoLoader && !errorAlbum && fotosAlbum.length > 0
                  ? ` · ${fotosAlbum.length} foto${fotosAlbum.length === 1 ? "" : "s"}`
                  : null}
              </p>
            </header>

            {mostrandoLoader ? (
              <div className="galeria-loader" role="status" aria-live="polite">
                <span className="galeria-loader-spin" aria-hidden />
                <p className="galeria-loader-texto">Cargando fotos…</p>
                <p className="galeria-loader-hint">Un momento, estamos trayendo la galería.</p>
              </div>
            ) : null}

            {errorAlbum ? (
              <p className="mt-4 text-sm text-naranja-libro">{errorAlbum}</p>
            ) : null}

            {!mostrandoLoader && !errorAlbum && fotosAlbum.length > 0 ? (
              <ul className="galeria-album mt-4">
                {fotosAlbum.map((url, i) => (
                  <li key={`${url}-${i}`}>
                    <button
                      type="button"
                      className="galeria-album-thumb"
                      onClick={() => setLightbox(i)}
                      aria-label={`Ver foto ${i + 1}`}
                    >
                      <ProtectedImage src={url} alt="" fit="natural" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}

            {!mostrandoLoader && !errorAlbum && fotosAlbum.length === 0 ? (
              <p className="mt-4 text-sm">Esta celebración aún no tiene fotos reales en la galería.</p>
            ) : null}
          </div>
        )}
      </div>

      <GaleriaModal
        abierta={lightbox != null}
        titulo={activa ? `${fiestaNumero(activa)}. ${activa.nombre}` : ""}
        fotos={fotosAlbum}
        indiceInicial={lightbox ?? 0}
        onCerrar={() => setLightbox(null)}
      />
    </section>
  );
}
