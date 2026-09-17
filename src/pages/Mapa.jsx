import { useState } from "react";
import { Calendario } from "../components/calendar/Calendario";
import { MapaFiestas } from "../components/map/MapaFiestas";
import { Portadilla } from "../components/ui/Portadilla";


export function PaginaMapa() {
  const [fiestaActiva, setFiestaActiva] = useState(null);

  return (
    <>
      <Portadilla
        id="mapa"
        titulo="Mapa y calendario"
        kicker="Map and calendar of popular festivals" />
      
      <MapaFiestas fiestaActiva={fiestaActiva} onActiva={setFiestaActiva} />
      <Calendario fiestaActiva={fiestaActiva} onActiva={(id) => setFiestaActiva(id)} />
    </>);

}