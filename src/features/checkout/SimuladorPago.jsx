import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { paymentSimulator } from "../../services";
import { Boton } from "../../components/ui/Boton";
import { MensajeTienda } from "../../components/tienda/TiendaUI";
import { formatPrecio } from "../../utils/tienda";

const RESULTADOS = [
  { outcome: "approved", estado: "approved", label: "Aprobar el pago", variante: "primario" },
  { outcome: "pending", estado: "pending", label: "Dejarlo pendiente", variante: "secundario" },
  { outcome: "rejected", estado: "rejected", label: "Rechazar el pago", variante: "secundario" },
];

/**
 * Reemplaza a Checkout Pro solo en modo simulación (VITE_USE_MOCKS=true).
 * Hace lo mismo que Mercado Pago: resuelve el pago y vuelve a /checkout/resultado
 * con ?estado=…&order=… (las back_urls que configura el backend).
 */
export function SimuladorPago() {
  const [params] = useSearchParams();
  const token = params.get("order");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [procesando, setProcesando] = useState(null);

  useEffect(() => {
    if (!token) return;
    paymentSimulator
      .getOrder(token)
      .then(setOrder)
      .catch((err) => setError(err.message));
  }, [token]);

  async function resolver({ outcome, estado }) {
    setProcesando(outcome);
    try {
      await paymentSimulator.resolve(token, outcome);
      window.location.assign(`/checkout/resultado?estado=${estado}&order=${token}`);
    } catch (err) {
      setError(err.message);
      setProcesando(null);
    }
  }

  if (!token || error) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <MensajeTienda tono="error" titulo="No encontramos la orden" texto={error} />
      </div>
    );
  }

  return (
    <div className="bg-papel px-4 py-10">
      <div className="mx-auto max-w-lg border-2 border-dashed border-naranja-libro bg-blanco p-6">
        <p className="font-display text-xs uppercase tracking-wide text-naranja-libro">
          Simulación · no se cobra nada
        </p>
        <h1 className="mt-1 font-display text-2xl text-azul-petroleo">Pantalla de pago simulada</h1>
        <p className="mt-2 text-sm">
          Acá iría Mercado Pago (Checkout Pro). Elegí qué resultado querés simular: el sitio vuelve a
          la página de resultado igual que con el pago real.
        </p>

        {order ? (
          <dl className="mt-5 grid grid-cols-2 gap-2 border-y border-azul-logo/15 py-4 text-sm">
            <dt>Pedido</dt>
            <dd className="text-right font-medium text-azul-petroleo">{order.number}</dd>
            <dt>Comprador</dt>
            <dd className="text-right">{order.buyer.email}</dd>
            <dt>Total a pagar</dt>
            <dd className="text-right text-lg font-medium text-azul-petroleo">{formatPrecio(order.total)}</dd>
          </dl>
        ) : (
          <p className="mt-5 text-sm" role="status">
            Cargando la orden…
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          {RESULTADOS.map((r) => (
            <Boton
              key={r.outcome}
              variante={r.variante}
              onClick={() => resolver(r)}
              disabled={!order || procesando != null}
              className="disabled:opacity-50"
            >
              {procesando === r.outcome ? "Procesando…" : r.label}
            </Boton>
          ))}
        </div>
        <p className="mt-4 text-xs">
          “Pendiente” simula un pago en efectivo o en revisión: se aprueba solo a los ~12 segundos,
          así se ve cómo la página de resultado vuelve a consultar el estado.
        </p>
      </div>
    </div>
  );
}
