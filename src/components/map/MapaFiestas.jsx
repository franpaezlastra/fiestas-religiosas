import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import Map, { Marker, NavigationControl } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { Link } from "react-router-dom";
import { ESTILO_FISICO_POLITICO } from "../../utils/estiloMapa";
import { capituloLabel, clusterFiestas, pinesSeparados } from "../../utils/geo";
import { fotoPortada, fotosDe } from "../../utils/galeria";
import { fiestaNumero, selectFiestasForUi } from "../../utils/celebrationsAdapter";
import {
  coincideFiltro,
  MESES,
  MES_NOMBRE,
  provinciasDe,
  TIPOS_MAPA,
} from "../../utils/fiestaFiltros";
import { fetchPublicCelebrations } from "../../redux/slices/celebrationsSlice";
import { Boton } from "../../components/ui/Boton";
import { ProtectedImage } from "../../components/gallery/ProtectedImage";

const ARG_MAX_BOUNDS = [
  [-88, -62],
  [-40, -12],
];

const CARD_W = 248;
const CARD_H = 210;
const PIN_GAP = 18;

function idsDe(activa) {
  if (activa == null) return [];
  return Array.isArray(activa) ? activa : [activa];
}

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

function Detalle({ fiestas, onPick }) {
  if (!fiestas.length) {
    return (
      <p className="text-sm">
        Elegí un pin en el mapa o una fiesta de la lista para ver el detalle.
      </p>
    );
  }
  return (
    <ul className="flex flex-col gap-3">
      {fiestas.map((f) => {
        const cap = capituloLabel(f.capitulo);
        const portada = fotoPortada(f);
        const hayFotos = fotosDe(f).length > 0;
        return (
          <li key={f.id} className="detalle-fiesta overflow-hidden border border-azul-logo/30">
            {portada ? (
              <div className="detalle-fiesta-portada">
                <ProtectedImage src={portada} alt="" className="h-full w-full" />
              </div>
            ) : null}
            <div className="p-3">
              <button type="button" className="w-full text-left" onClick={() => onPick(f.id)}>
                <p className="font-display text-lg text-azul-petroleo">
                  <span className="mr-2 font-body text-sm">
                    {String(fiestaNumero(f)).padStart(2, "0")}
                  </span>
                  {f.nombre}
                </p>
                <p className="mt-1 text-sm">
                  {f.lugar}
                  {f.provincia && f.lugar !== f.provincia ? `, ${f.provincia}` : ""}
                </p>
                {f.fecha ? <p className="mt-1 text-sm">{f.fecha}</p> : null}
              </button>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {cap ? (
                  <span className="bg-azul-petroleo px-2 py-0.5 text-xs text-blanco">{cap}</span>
                ) : null}
                {f.tipo === "movil" ? (
                  <span className="border border-dashed border-azul-petroleo px-2 py-0.5 text-xs">
                    Fiesta móvil
                  </span>
                ) : null}
                {hayFotos ? (
                  <Link
                    to={`/galeria?fiesta=${fiestaNumero(f) || f.id}`}
                    className="text-xs font-medium uppercase tracking-wide text-celeste-cielo"
                  >
                    Ver en galería
                  </Link>
                ) : f.enLibro ? (
                  <span className="border border-azul-logo px-2 py-0.5 text-xs">En el libro</span>
                ) : (
                  <span className="border border-naranja-libro px-2 py-0.5 text-xs text-naranja-libro">
                    Próximamente
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function Pin({ fiesta, abierto, onClick, onEnter, onLeave }) {
  const cls = [
    "map-pin",
    abierto ? "is-open" : "",
    fiesta.tipo === "movil" ? "is-movil" : "",
    fiesta.tipo === "pendiente" ? "is-pendiente" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={`map-pin-wrap${abierto ? " is-open" : ""}`}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
    >
      <button
        type="button"
        className={cls}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
        aria-label={`${fiestaNumero(fiesta)}. ${fiesta.nombre}`}
      >
        {fiestaNumero(fiesta)}
      </button>
    </div>
  );
}

/** Card fuera del canvas MapLibre (evita overflow:hidden del mapa). */
function FloatCard({ fiesta, style, onEnter, onLeave }) {
  if (!fiesta) return null;
  const portada = fotoPortada(fiesta);
  const hayFotos = fotosDe(fiesta).length > 0;

  return (
    <div
      className="map-float-card"
      style={style}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      role="dialog"
      aria-label={`${fiestaNumero(fiesta)}. ${fiesta.nombre}`}
    >
      {portada ? (
        <div className="map-float-card-img">
          <ProtectedImage src={portada} alt="" className="h-full w-full" />
        </div>
      ) : null}
      <div className="map-float-card-cuerpo">
        <strong>
          {fiestaNumero(fiesta)}. {fiesta.nombre}
        </strong>
        <p>
          {fiesta.lugar}
          {fiesta.provincia && fiesta.lugar !== fiesta.provincia ? ` / ${fiesta.provincia}` : ""}
        </p>
        {fiesta.fecha ? <p>{fiesta.fecha}</p> : null}
        {hayFotos ? (
          <Link to={`/galeria?fiesta=${fiestaNumero(fiesta) || fiesta.id}`} className="ver-galeria">
            Ver en galería
          </Link>
        ) : null}
      </div>
    </div>
  );
}

export function MapaFiestas({ fiestaActiva, onActiva }) {
  const mapRef = useRef(null);
  const wrapRef = useRef(null);
  const FIESTAS = useFiestas();
  const [provincia, setProvincia] = useState("todas");
  const [tipo, setTipo] = useState("todos");
  const [mes, setMes] = useState("todos");
  const [q, setQ] = useState("");
  const [sheet, setSheet] = useState(false);
  const [hoverId, setHoverId] = useState(null);
  const [cardLayout, setCardLayout] = useState(null);
  const leaveTimer = useRef(null);

  const PROVINCIAS = useMemo(() => provinciasDe(FIESTAS), [FIESTAS]);
  const haySeleccion = fiestaActiva != null;

  useEffect(() => {
    if (fiestaActiva != null) setSheet(true);
  }, [fiestaActiva]);

  // Con selección fija, el hover no compite con la card abierta
  useEffect(() => {
    if (!haySeleccion) return;
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
    setHoverId(null);
  }, [haySeleccion, fiestaActiva]);

  const filtradas = useMemo(
    () => FIESTAS.filter((f) => coincideFiltro(f, { provincia, tipo, mes, q })),
    [FIESTAS, provincia, tipo, mes, q],
  );
  const nacionales = filtradas.filter((f) => f.tipo === "nacional");
  const pines = useMemo(
    () =>
      pinesSeparados(
        clusterFiestas(
          filtradas.filter((f) => f.showOnMap !== false && f.lat != null && f.lng != null),
        ),
      ),
    [filtradas],
  );
  const activaIds = idsDe(fiestaActiva);
  const detalle = FIESTAS.filter((f) => activaIds.includes(f.id));

  const cardFiesta = useMemo(() => {
    // Seleccionada → solo esa. Sin selección → preview por hover.
    const id = haySeleccion
      ? activaIds.length === 1
        ? activaIds[0]
        : null
      : hoverId;
    if (!id) return null;
    const pin = pines.find((p) => p.fiesta.id === id);
    return pin?.fiesta ?? FIESTAS.find((f) => f.id === id) ?? null;
  }, [haySeleccion, hoverId, activaIds, pines, FIESTAS]);

  const syncCardLayout = useCallback(() => {
    const mapInst = mapRef.current;
    const map = mapInst?.getMap?.() ?? mapInst;
    const wrap = wrapRef.current;
    if (!map || !wrap || !cardFiesta || cardFiesta.lat == null || cardFiesta.lng == null) {
      setCardLayout(null);
      return;
    }
    if (typeof map.project !== "function") {
      setCardLayout(null);
      return;
    }
    const pin = pines.find((p) => p.fiesta.id === cardFiesta.id);
    const lng = pin?.lng ?? cardFiesta.lng;
    const lat = pin?.lat ?? cardFiesta.lat;
    const pt = map.project([lng, lat]);
    const w = wrap.clientWidth;
    const h = wrap.clientHeight;
    const placeBelow = pt.y < CARD_H + 36 && h - pt.y >= Math.min(CARD_H, 140);
    let x = pt.x;
    const half = CARD_W / 2;
    x = Math.min(Math.max(x, half + 8), w - half - 8);
    const y = placeBelow ? pt.y + PIN_GAP : pt.y - PIN_GAP;
    setCardLayout({
      left: x,
      top: y,
      transform: placeBelow ? "translate(-50%, 0)" : "translate(-50%, -100%)",
      maxHeight: placeBelow ? Math.max(120, h - y - 12) : Math.max(120, y - 12),
    });
  }, [cardFiesta, pines]);

  useEffect(() => {
    syncCardLayout();
  }, [syncCardLayout, fiestaActiva, hoverId]);

  useEffect(() => {
    const mapInst = mapRef.current;
    const map = mapInst?.getMap?.() ?? mapInst;
    const ids = idsDe(fiestaActiva);
    const f = FIESTAS.find((x) => ids.includes(x.id) && x.lat != null && x.lng != null);
    if (!f || !map?.flyTo) return;
    map.flyTo({
      center: [f.lng, f.lat],
      zoom: Math.max(typeof map.getZoom === "function" ? map.getZoom() : 6.2, 6.2),
      padding: { top: 200, bottom: 80, left: 48, right: 48 },
      duration: 900,
    });
  }, [FIESTAS, fiestaActiva]);

  function clearLeaveTimer() {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current);
      leaveTimer.current = null;
    }
  }

  function enterPin(id) {
    if (haySeleccion) return;
    clearLeaveTimer();
    setHoverId(id);
  }

  function leavePin() {
    if (haySeleccion) return;
    clearLeaveTimer();
    leaveTimer.current = setTimeout(() => setHoverId(null), 160);
  }

  function clickPin(f) {
    const next = fiestaActiva === f.id ? null : f.id;
    clearLeaveTimer();
    setHoverId(null);
    onActiva(next);
    if (next != null) setSheet(true);
  }

  function clickLista(f) {
    clearLeaveTimer();
    setHoverId(null);
    if (fiestaActiva === f.id) {
      onActiva(null);
      return;
    }
    onActiva(f.id);
    setSheet(true);
  }

  function deseleccionar() {
    clearLeaveTimer();
    setHoverId(null);
    onActiva(null);
  }

  function verArgentina() {
    const mapInst = mapRef.current;
    const map = mapInst?.getMap?.() ?? mapInst;
    map?.fitBounds?.(
      [
        [-73.6, -55.3],
        [-53.5, -21.7],
      ],
      { padding: 100, duration: 800, maxZoom: 3.2 },
    );
  }

  return (
    <div className="bg-blanco px-4 py-12 md:py-20">
      <div className="mx-auto max-w-6xl">
        <p className="max-w-3xl font-light leading-relaxed">
          95 celebraciones relevadas por Federico Lanati. Las 82 primeras están fotografiadas en el
          libro; las 13 últimas son fiestas que el autor intentará visitar. Podés acercar, alejar y
          mover el mapa.
        </p>

        {nacionales.length > 0 ? (
          <div className="mt-6">
            <p className="font-display text-sm text-azul-petroleo">En todo el país</p>
            <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
              {nacionales.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => clickLista(f)}
                  className={`filtro-chip shrink-0 text-left text-sm ${
                    activaIds.includes(f.id) ? "is-on" : ""
                  }`}
                >
                  <span className="mr-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-naranja-libro text-[11px] text-blanco">
                    {fiestaNumero(f)}
                  </span>
                  {f.nombre}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
              value={provincia}
              onChange={(e) => setProvincia(e.target.value)}
              className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
            >
              {PROVINCIAS.map((r) => (
                <option key={r} value={r}>
                  {r === "todas" ? "Todas" : r}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            Tipo
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1 w-full border border-azul-logo/40 bg-blanco px-3 py-2"
            >
              {TIPOS_MAPA.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
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

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="bg-papel p-2 md:p-3">
            <div ref={wrapRef} className="mapa-libre relative">
              <Map
                ref={mapRef}
                mapStyle={ESTILO_FISICO_POLITICO}
                initialViewState={{ longitude: -64.8, latitude: -38.5, zoom: 3 }}
                maxBounds={ARG_MAX_BOUNDS}
                cooperativeGestures
                attributionControl
                style={{ width: "100%", height: "100%" }}
                onLoad={verArgentina}
                onMove={syncCardLayout}
                onClick={deseleccionar}
              >
                <NavigationControl position="top-right" showCompass={false} />
                {pines.map((p) => (
                  <Marker
                    key={p.fiesta.id}
                    longitude={p.lng}
                    latitude={p.lat}
                    anchor="center"
                    offset={p.offset}
                  >
                    <Pin
                      fiesta={p.fiesta}
                      abierto={activaIds.includes(p.fiesta.id)}
                      onClick={() => clickPin(p.fiesta)}
                      onEnter={() => enterPin(p.fiesta.id)}
                      onLeave={leavePin}
                    />
                  </Marker>
                ))}
              </Map>

              {cardLayout && cardFiesta ? (
                <FloatCard
                  fiesta={cardFiesta}
                  style={{
                    left: cardLayout.left,
                    top: cardLayout.top,
                    transform: cardLayout.transform,
                    maxHeight: cardLayout.maxHeight,
                  }}
                  onEnter={clearLeaveTimer}
                  onLeave={leavePin}
                />
              ) : null}

              <Boton
                variante="secundario"
                tamano="sm"
                className="absolute bottom-8 left-2 z-10"
                onClick={verArgentina}
              >
                Ver todo el país
              </Boton>
            </div>
            <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-azul-petroleo" /> Lugar
                puntual
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-azul-petroleo" />{" "}
                Fiesta móvil
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full border border-dashed border-azul-petroleo bg-transparent" />{" "}
                Próxima a visitar
              </li>
              <li className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-naranja-libro" /> En todo el
                país
              </li>
            </ul>
          </div>

          <div className="flex min-h-[420px] flex-col border border-azul-logo/20">
            <div className="border-b border-azul-logo/20 px-3 py-2 text-sm">
              {filtradas.length} fiestas
            </div>
            <div className="max-h-[280px] overflow-y-auto lg:max-h-[360px]">
              <ul>
                {filtradas.map((f) => {
                  const active = activaIds.includes(f.id);
                  return (
                    <li key={f.id} className="border-b border-azul-logo/10">
                      <button
                        type="button"
                        onClick={() => clickLista(f)}
                        onMouseEnter={() => enterPin(f.id)}
                        onMouseLeave={leavePin}
                        className={`ctrl-fila flex w-full items-start gap-3 px-3 py-2 text-left ${
                          active ? "is-on" : ""
                        }`}
                      >
                        <span
                          className={`mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                            f.tipo === "nacional"
                              ? "bg-naranja-libro text-blanco"
                              : f.tipo === "pendiente"
                                ? "border border-dashed border-azul-petroleo text-azul-petroleo"
                                : "bg-azul-petroleo text-blanco"
                          }`}
                        >
                          {fiestaNumero(f)}
                        </span>
                        <span>
                          <span className="block text-sm font-medium text-azul-petroleo">
                            {f.nombre}
                          </span>
                          <span className="block text-xs">
                            {f.lugar}
                            {f.provincia ? ` · ${f.provincia}` : ""}
                            {f.fecha ? ` · ${f.fecha}` : ""}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            <div className="hidden flex-1 overflow-y-auto border-t border-azul-logo/20 p-3 lg:block">
              <Detalle fiestas={detalle} onPick={(id) => onActiva(id)} />
            </div>
          </div>
        </div>
      </div>

      {sheet && detalle.length > 0 ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-azul-petroleo/45"
            aria-label="Cerrar detalle"
            onClick={() => setSheet(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-y-auto border-t-4 border-azul-petroleo bg-blanco px-4 py-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="font-display text-azul-petroleo">Detalle</p>
              <Boton variante="secundario" tamano="sm" onClick={() => setSheet(false)}>
                Cerrar
              </Boton>
            </div>
            <Detalle fiestas={detalle} onPick={(id) => onActiva(id)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}
