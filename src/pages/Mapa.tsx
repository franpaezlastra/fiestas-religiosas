import { useState } from "react";
import { Calendario } from "../components/Calendario";
import { MapaFiestas } from "../components/MapaFiestas";
import { Portadilla } from "../components/Portadilla";
import type { FiestaActiva } from "../lib/types";

export function PaginaMapa() {
  const [fiestaActiva, setFiestaActiva] = useState<FiestaActiva>(null);

  return (
    <>
      <Portadilla
        id="mapa"
        titulo="Mapa y calendario"
        kicker="Map and calendar of popular festivals"
      />
      <MapaFiestas fiestaActiva={fiestaActiva} onActiva={setFiestaActiva} />
      <Calendario fiestaActiva={fiestaActiva} onActiva={(id) => setFiestaActiva(id)} />
    </>
  );
}
