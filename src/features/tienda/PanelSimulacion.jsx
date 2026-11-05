import { useState } from "react";
import { useDispatch } from "react-redux";
import { COMMUNITY_MOCKS, USE_MOCKS, mockControls } from "../../services";
import { clearCart } from "../../redux/slices/cartSlice";
import { SimulacionComunidad } from "../comunidad/SimulacionComunidad";

const TRUCOS = [
  ["Código postal 9999", "el envío no está disponible (SHIPPING_UNAVAILABLE)"],
  ["Email con +sinstock (ej. ana+sinstock@mail.com)", "al pagar, el libro se queda sin stock (OUT_OF_STOCK). Reiniciá para reponerlo"],
  ["Pantalla de pago simulada", "elegís aprobado, rechazado o pendiente"],
  ["Código postal menor a 2000", "AMBA: envío más barato y más rápido"],
  ["?mockError=CODIGO en la URL", "fuerza ese error en la próxima llamada"],
];

/** Contenido de la pestaña Tienda del panel de simulación (VITE_USE_MOCKS=true). */
export function SimulacionTienda() {
  const dispatch = useDispatch();
  const [settings, setSettings] = useState(() => mockControls.getSettings());
  const [umbral, setUmbral] = useState(settings.freeShippingThreshold ?? "");

  function actualizar(patch) {
    setSettings(mockControls.updateSettings(patch));
  }

  function reiniciar() {
    mockControls.reset();
    dispatch(clearCart());
    window.location.assign("/tienda");
  }

  return (
    <>
      <p className="text-xs">
        La tienda usa datos falsos guardados en este navegador. No hay backend ni cobros reales.
      </p>

      <p className="mt-3 font-medium text-azul-petroleo">Para probar errores</p>
      <ul className="mt-1 flex flex-col gap-1.5 text-xs">
        {TRUCOS.map(([que, resultado]) => (
          <li key={que}>
            <strong>{que}</strong> → {resultado}
          </li>
        ))}
      </ul>

      <p className="mt-3 font-medium text-azul-petroleo">Reglas de envío (sin definir todavía)</p>
      <label className="mt-1 flex items-center gap-2">
        <input
          type="checkbox"
          checked={settings.pickupEnabled}
          onChange={(e) => actualizar({ pickupEnabled: e.target.checked })}
          className="accent-celeste-cielo"
        />
        Ofrecer retiro sin cargo
      </label>
      <label htmlFor="sim-umbral" className="mt-2 block">
        Envío gratis desde ($, vacío = no)
      </label>
      <input
        id="sim-umbral"
        type="number"
        min="0"
        step="1000"
        className="campo-input !mt-1 !py-1.5"
        value={umbral}
        onChange={(e) => setUmbral(e.target.value)}
        onBlur={() => actualizar({ freeShippingThreshold: umbral === "" ? null : Number(umbral) })}
      />

      <button
        type="button"
        className="mt-4 w-full border border-azul-petroleo px-3 py-2 text-azul-petroleo hover:bg-azul-petroleo hover:text-blanco"
        onClick={reiniciar}
      >
        Reiniciar datos de la tienda
      </button>
    </>
  );
}

/** Panel flotante para probar las partes simuladas (tienda y/o comunidad). */
export function PanelSimulacion() {
  const pestanas = [
    USE_MOCKS ? { id: "tienda", label: "Tienda", Contenido: SimulacionTienda } : null,
    COMMUNITY_MOCKS ? { id: "comunidad", label: "Comunidad", Contenido: SimulacionComunidad } : null,
  ].filter(Boolean);
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(() =>
    window.location.pathname.startsWith("/comunidad") && COMMUNITY_MOCKS ? "comunidad" : pestanas[0]?.id,
  );
  if (!pestanas.length) return null;
  const actual = pestanas.find((p) => p.id === activa) || pestanas[0];
  const { Contenido } = actual;

  return (
    <div className="fixed bottom-4 left-4 z-40 max-w-[calc(100vw-2rem)] text-sm">
      {abierto ? (
        <div
          id="panel-simulacion"
          className="mb-2 max-h-[75svh] w-96 max-w-full overflow-y-auto border-2 border-dashed border-naranja-libro bg-blanco p-4 shadow-lg"
        >
          <p className="font-display text-base text-azul-petroleo">Modo simulación</p>
          {pestanas.length > 1 ? (
            <div role="tablist" aria-label="Simulaciones" className="mt-2 mb-3 flex gap-1 border-b border-azul-logo/20">
              {pestanas.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  role="tab"
                  aria-selected={p.id === actual.id}
                  onClick={() => setActiva(p.id)}
                  className={`-mb-px border-b-2 px-3 py-1.5 ${p.id === actual.id ? "border-celeste-cielo text-azul-petroleo" : "border-transparent"}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          ) : null}
          <div role="tabpanel">
            <Contenido />
          </div>
        </div>
      ) : null}
      <button
        type="button"
        className="border-2 border-dashed border-naranja-libro bg-blanco px-3 py-2 font-medium text-azul-petroleo shadow-md hover:bg-papel"
        aria-expanded={abierto}
        aria-controls="panel-simulacion"
        onClick={() => setAbierto((v) => !v)}
      >
        {abierto ? "Cerrar simulación" : "🧪 Modo simulación"}
      </button>
    </div>
  );
}
