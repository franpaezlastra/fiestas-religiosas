import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { GaleriaModal } from "../../components/gallery/GaleriaModal";
import { ProtectedImage } from "../../components/gallery/ProtectedImage";
import { Portadilla } from "../../components/ui/Portadilla";
import { fetchPublicCelebrations } from "../../redux/slices/celebrationsSlice";
import { celebrationsService } from "../../services";
import {
  celebrationImageUrls,
  fiestaNumero,
  selectFiestasForUi,
} from "../../utils/celebrationsAdapter";
import { fotoPortada, fotosDe } from "../../utils/galeria";

const MESES = ["todos", "1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"];
const MES_NOMBRE = [
  "",
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

function useFiestas() {
  const dispatch = useDispatch();
  const { publicItems, localItems, source, status } = useSelector((s) => s.celebrations);

  useEffect(() => {
    if (status === "idle") dispatch(fetchPublicCelebrations());
  }, [dispatch, status]);

  return useMemo(
    () => selectFiestasForUi({ publicItems, localItems, source }),
    [publicItems, localItems, source],
  );
}

export function SeccionGaleria() {
  const FIESTAS = useFiestas();
  const [searchParams, setSearchParams] = useSearchParams();
  const [region, setRegion] = useState("todas");
  const [mes, setMes] = useState("todos");
  const [q, setQ] = useState("");
  const [activaId, setActivaId] = useState(null);
  const [fotosAlbum, setFotosAlbum] = useState([]);
  const [cargandoAlbum, setCargandoAlbum] = useState(false);
  const [lightbox, setLightbox] = useState(null);

  const REGIONES = useMemo(
    () => ["todas", ...[...new Set(FIESTAS.map((f) => f.region).filter(Boolean))]],
    [FIESTAS],
  );

  const conFotos = useMemo(
    () =>
      FIESTAS.filter((f) => fotosDe(f).length > 0).filter((f) => {
        if (region !== "todas" && f.region !== region) return false;
        if (mes !== "todos" && String(f.mes) !== mes) return false;
        if (q) {
          const hay = `${f.nombre} ${f.lugar} ${f.provincia} ${fiestaNumero(f)}`.toLowerCase();
          if (!hay.includes(q.toLowerCase())) return false;
        }
        return true;
      }),
    [FIESTAS, region, mes, q],
  );

  // Deep-link ?fiesta=numero o id
  useEffect(() => {
    const param = searchParams.get("fiesta");
    if (!param || !FIESTAS.length) return;
    const match = FIESTAS.find(
      (f) => String(f.id) === param || String(fiestaNumero(f)) === param || f.apiId === param,
    );
    if (match && fotosDe(match).length > 0) setActivaId(match.id);
  }, [FIESTAS, searchParams]);

  const activa = conFotos.find((f) => f.id === activaId) || null;

  useEffect(() => {
    if (!activa) {
      setFotosAlbum([]);
      return;
    }
    let cancel = false;
    setFotosAlbum(fotosDe(activa));
    setCargandoAlbum(Boolean(activa.apiId));

    async function load() {
      if (!activa.apiId) {
        setCargandoAlbum(false);
        return;
      }
      try {
        const imgs = await celebrationsService.publicImages(activa.apiId);
        const urls = celebrationImageUrls({
          images: Array.isArray(imgs) ? imgs : [],
        });
        if (!cancel && urls.length) setFotosAlbum(urls);
      } catch {
        /* fallback local ya cargado */
      } finally {
        if (!cancel) setCargandoAlbum(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [activa]);

  function elegirFiesta(f) {
    setActivaId(f.id);
    setSearchParams({ fiesta: String(fiestaNumero(f) || f.id) }, { replace: true });
    setLightbox(null);
  }

  function volverIndice() {
    setActivaId(null);
    setSearchParams({}, { replace: true });
    setLightbox(null);
  }

  return (
    <section>
      <Portadilla id="galeria" titulo="Galería" kicker="Photographs of the celebrations" />

      <div className="mx-auto max-w-6xl px-4 py-12 md:py-16">
        <p className="max-w-2xl font-light leading-relaxed">
          Las fotos del libro, organizadas por fiesta. Elegí una celebración para recorrer su álbum.
          Las imágenes son de consulta: no se pueden descargar ni abrir en otra pestaña.
        </p>

        {!activa ? (
          <>
            <div className="mt-8 grid gap-3 md:grid-cols-3">
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
                Región
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
                >
                  {REGIONES.map((r) => (
                    <option key={r} value={r}>
                      {r === "todas" ? "Todas" : r}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm">
                Mes
                <select
                  value={mes}
                  onChange={(e) => setMes(e.target.value)}
                  className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
                >
                  {MESES.map((m) => (
                    <option key={m} value={m}>
                      {m === "todos" ? "Todos" : MES_NOMBRE[Number(m)]}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <p className="mt-6 text-sm text-azul-logo">
              {conFotos.length} fiesta{conFotos.length === 1 ? "" : "s"} con fotos
            </p>

            <ul className="galeria-indice mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {conFotos.map((f) => {
                const portada = fotoPortada(f);
                const n = fotosDe(f).length;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      className="galeria-indice-card group w-full text-left"
                      onClick={() => elegirFiesta(f)}
                    >
                      <span className="galeria-indice-thumb">
                        <ProtectedImage src={portada} alt="" className="h-full w-full" />
                        <span className="galeria-indice-count">
                          {n} foto{n === 1 ? "" : "s"}
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
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {conFotos.length === 0 ? (
              <p className="mt-10 text-sm">No hay fiestas con fotos para estos filtros.</p>
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
                {cargandoAlbum ? " · cargando…" : ` · ${fotosAlbum.length} fotos`}
              </p>
            </header>

            <ul className="galeria-album mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 md:gap-3">
              {fotosAlbum.map((url, i) => (
                <li key={`${url}-${i}`}>
                  <button
                    type="button"
                    className="galeria-album-thumb"
                    onClick={() => setLightbox(i)}
                    aria-label={`Ver foto ${i + 1}`}
                  >
                    <ProtectedImage src={url} alt="" className="h-full w-full" />
                  </button>
                </li>
              ))}
            </ul>
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
