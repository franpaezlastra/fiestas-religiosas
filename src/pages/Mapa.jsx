import { lazy, Suspense, useState } from "react";
import { Portadilla } from "../components/ui/Portadilla";

const MapaFiestas = lazy(() =>
  import("../components/map/MapaFiestas").then((m) => ({ default: m.MapaFiestas })),
);
const Calendario = lazy(() =>
  import("../components/calendar/Calendario").then((m) => ({ default: m.Calendario })),
);

function MapFallback() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center px-4 text-sm text-azul-petroleo">
      Cargando mapa…
    </div>
  );
}

export function PaginaMapa() {
  const [fiestaActiva, setFiestaActiva] = useState(null);

  return (
    <>
      <Portadilla
        id="mapa"
        titulo="Mapa y calendario"
        kicker="Map and calendar of popular festivals"
      />
      <Suspense fallback={<MapFallback />}>
        <MapaFiestas fiestaActiva={fiestaActiva} onActiva={setFiestaActiva} />
        <Calendario fiestaActiva={fiestaActiva} onActiva={(id) => setFiestaActiva(id)} />
      </Suspense>
    </>
  );
}
