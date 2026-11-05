import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { clearCart } from "../../redux/slices/cartSlice";
import { ordersService } from "../../services";
import { Boton } from "../../components/ui/Boton";
import { EncabezadoTienda, EstadoPedido, MensajeTienda } from "../../components/tienda/TiendaUI";
import { ULTIMO_PEDIDO_KEY, formatPrecio } from "../../utils/tienda";

const POLL_MS = 4000;
const POLL_MAX_MS = 2 * 60 * 1000;

/** Mensaje inicial según lo que dice la URL (todavía sin confirmar). */
const INICIAL = {
  approved: { titulo: "¡Gracias por tu compra!", texto: "Estamos confirmando el pago…" },
  pending: { titulo: "Tu pago está en proceso", texto: "Te avisamos apenas se acredite." },
  rejected: { titulo: "El pago no se pudo completar", texto: "Estamos revisando el estado…" },
};

function leerUltimoPedido() {
  try {
    return localStorage.getItem(ULTIMO_PEDIDO_KEY);
  } catch {
    return null;
  }
}

export function PaginaResultado() {
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const estadoUrl = params.get("estado") || "pending";
  const token = params.get("order") || leerUltimoPedido();

  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [agotado, setAgotado] = useState(false);

  /* Consulta el estado real; si sigue pendiente, reintenta cada pocos segundos. */
  useEffect(() => {
    if (!token) return undefined;
    let cancelado = false;
    let timer = null;
    const inicio = Date.now();

    async function consultar() {
      try {
        const data = await ordersService.get(token);
        if (cancelado) return;
        setOrder(data);
        setError(null);
        if (data.status === "pending_payment") {
          if (Date.now() - inicio < POLL_MAX_MS) timer = window.setTimeout(consultar, POLL_MS);
          else setAgotado(true);
        }
      } catch (err) {
        if (cancelado) return;
        setError(err);
        if (err.status !== 404 && Date.now() - inicio < POLL_MAX_MS) {
          timer = window.setTimeout(consultar, POLL_MS);
        }
      }
    }
    consultar();
    return () => {
      cancelado = true;
      window.clearTimeout(timer);
    };
  }, [token]);

  const aprobado = order && !["pending_payment", "payment_rejected", "cancelled"].includes(order.status);

  useEffect(() => {
    if (aprobado) dispatch(clearCart());
  }, [aprobado, dispatch]);

  if (!token) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <MensajeTienda
          titulo="No encontramos tu pedido"
          texto="Si ya pagaste, revisá el email de confirmación."
          accion={<Boton to="/tienda">Ir a la tienda</Boton>}
        />
      </div>
    );
  }

  let titulo = INICIAL[estadoUrl]?.titulo || INICIAL.pending.titulo;
  let texto = INICIAL[estadoUrl]?.texto || INICIAL.pending.texto;
  if (order?.status === "payment_rejected") {
    titulo = "El pago fue rechazado";
    texto = "No se hizo ningún cobro. Podés volver a intentarlo con otro medio de pago.";
  } else if (aprobado) {
    titulo = "¡Gracias por tu compra!";
    texto = `Tu pago fue aprobado. Te mandamos la confirmación a ${order.buyer.email}.`;
  } else if (order?.status === "pending_payment") {
    titulo = "Tu pago está en proceso";
    texto = agotado
      ? "Todavía no se acreditó. Cuando se confirme te llega un email; también podés ver el estado en la página del pedido."
      : "Estamos esperando la confirmación de Mercado Pago. Esta página se actualiza sola.";
  }

  return (
    <section>
      <EncabezadoTienda titulo={titulo} kicker="Resultado de la compra" />
      <div className="mx-auto max-w-3xl px-4 py-8" aria-live="polite">
        <p>{texto}</p>
        {error && !order ? (
          <p className="mt-4 text-[#b42318]" role="alert">
            No pudimos consultar el pedido: {error.message}
          </p>
        ) : null}

        {order ? (
          <div className="mt-6 border border-azul-logo/15 bg-blanco p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="font-medium text-azul-petroleo">Pedido {order.number}</p>
              <EstadoPedido status={order.status} />
            </div>
            <ul className="mt-4 flex flex-col gap-2 text-sm">
              {order.items.map((i) => (
                <li key={i.variantId} className="flex justify-between gap-3">
                  <span>
                    {i.quantity} × {i.productName}
                    {i.variantName ? ` (${i.variantName})` : ""}
                  </span>
                  <span>{formatPrecio(i.total)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 flex justify-between border-t border-azul-logo/15 pt-3 font-medium text-azul-petroleo">
              <span>Total</span>
              <span>{formatPrecio(order.total)}</span>
            </p>
          </div>
        ) : (
          <p className="mt-6 text-sm" role="status">
            Consultando el estado del pedido…
          </p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          {order ? <Boton to={`/pedido/${order.publicToken}`}>Ver mi pedido</Boton> : null}
          {order?.status === "payment_rejected" ? (
            <Boton to="/checkout" variante="secundario">
              Intentar de nuevo
            </Boton>
          ) : (
            <Boton to="/tienda" variante="secundario">
              Volver a la tienda
            </Boton>
          )}
        </div>
      </div>
    </section>
  );
}
