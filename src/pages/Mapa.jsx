import { lazy, Suspense, useState } from "react";
import { Portadilla } from "../components/ui/Portadilla";
import { PageLoader } from "../components/ui/SectionLoader";

const MapaFiestas = lazy(() =>
  import("../components/map/MapaFiestas").then((m) => ({ default: m.MapaFiestas })),
);
const Calendario = lazy(() =>
  import("../components/calendar/Calendario").then((m) => ({ default: m.Calendario })),
);

export function PaginaMapa() {
  const [fiestaActiva, setFiestaActiva] = useState(null);

  return (
    <>
      <Portadilla
        id="mapa"
        titulo="Mapa y calendario"
        kicker="Map and calendar of popular festivals"
      />
      <Suspense fallback={<PageLoader texto="Cargando mapa…" />}>
        <MapaFiestas fiestaActiva={fiestaActiva} onActiva={setFiestaActiva} />
        <Calendario fiestaActiva={fiestaActiva} onActiva={(id) => setFiestaActiva(id)} />
      </Suspense>
    </>
  );
}
