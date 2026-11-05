import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ordersService } from "../../services";
import { Boton } from "../../components/ui/Boton";
import { EncabezadoTienda, EstadoPedido, MensajeTienda } from "../../components/tienda/TiendaUI";
import { estadoPedido, formatFecha, formatPrecio } from "../../utils/tienda";

function DatosEnvio({ shipping }) {
  if (!shipping) return null;
  return (
    <div className="border border-azul-logo/15 bg-blanco p-5">
      <h2 className="font-display text-lg text-azul-petroleo">Envío</h2>
      <p className="mt-2 text-sm">
        {shipping.optionName}
        {shipping.cost === 0 ? " · Sin cargo" : ` · ${formatPrecio(shipping.cost)}`}
      </p>
      <p className="text-sm">
        {shipping.type === "home" && shipping.address
          ? `${shipping.address.street} ${shipping.address.number}${
              shipping.address.apartment ? `, ${shipping.address.apartment}` : ""
            }, ${shipping.address.city}, ${shipping.address.province} (CP ${shipping.postalCode})`
          : shipping.type === "branch"
            ? `${shipping.branch?.name} — ${shipping.branch?.address}`
            : shipping.pickupAddress}
      </p>
      {shipping.trackingNumber ? (
        <div className="mt-4 bg-papel p-3">
          <p className="text-sm">Número de seguimiento de Andreani</p>
          <p className="font-display text-xl tracking-wide text-azul-petroleo">{shipping.trackingNumber}</p>
          <a
            href="https://www.andreani.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-celeste-cielo underline"
          >
            Seguir el envío en andreani.com
          </a>
        </div>
      ) : shipping.type !== "pickup" ? (
        <p className="mt-3 text-sm">El número de seguimiento aparece acá cuando despachemos el pedido.</p>
      ) : null}
    </div>
  );
}

export function PaginaPedido() {
  const { publicToken } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setOrder(await ordersService.get(publicToken));
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setCargando(false);
    }
  }, [publicToken]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando && !order) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12" aria-busy="true">
        <span className="sr-only" role="status">
          Cargando pedido…
        </span>
        <div className="tienda-skeleton h-10 w-1/2" />
        <div className="tienda-skeleton mt-4 h-40 w-full" />
      </div>
    );
  }

  if (error && !order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12">
        <MensajeTienda
          tono={error.code === "NOT_FOUND" ? "info" : "error"}
          titulo={error.code === "NOT_FOUND" ? "No encontramos ese pedido" : "No pudimos cargar el pedido"}
          texto={error.code === "NOT_FOUND" ? "Revisá el link del email de confirmación." : error.message}
          accion={error.code === "NOT_FOUND" ? null : <Boton onClick={cargar}>Reintentar</Boton>}
        />
      </div>
    );
  }

  const digitales = order.items.filter((i) => i.fulfillment === "digital");

  return (
    <section>
      <EncabezadoTienda titulo={`Pedido ${order.number}`} kicker="Seguimiento">
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <EstadoPedido status={order.status} />
          <span className="text-sm">Hecho el {formatFecha(order.createdAt)}</span>
          <button type="button" className="text-sm text-celeste-cielo underline" onClick={cargar} disabled={cargando}>
            {cargando ? "Actualizando…" : "Actualizar"}
          </button>
        </div>
      </EncabezadoTienda>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[1fr_20rem]">
        <div className="flex flex-col gap-6">
          <div className="border border-azul-logo/15 bg-blanco p-5">
            <h2 className="font-display text-lg text-azul-petroleo">Productos</h2>
            <ul className="mt-3 flex flex-col divide-y divide-azul-logo/10">
              {order.items.map((i) => (
                <li key={i.variantId} className="flex items-center gap-3 py-3">
                  <span className="foto-libro block h-14 w-14 shrink-0">
                    {i.image ? <img src={i.image} alt="" /> : null}
                  </span>
                  <span className="flex-1 text-sm">
                    <span className="block font-medium text-azul-petroleo">{i.productName}</span>
                    {i.quantity} × {formatPrecio(i.unitPrice)}
                    {i.variantName ? ` · ${i.variantName}` : ""}
                  </span>
                  <span className="text-sm font-medium">{formatPrecio(i.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-3 flex flex-col gap-1 border-t border-azul-logo/15 pt-3 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>{formatPrecio(order.subtotal)}</dd>
              </div>
              {order.shipping ? (
                <div className="flex justify-between">
                  <dt>Envío</dt>
                  <dd>{order.shippingCost === 0 ? "Sin cargo" : formatPrecio(order.shippingCost)}</dd>
                </div>
              ) : null}
              <div className="flex justify-between text-base font-medium text-azul-petroleo">
                <dt>Total</dt>
                <dd>{formatPrecio(order.total)}</dd>
              </div>
            </dl>
          </div>

          {digitales.length ? (
            <div className="border border-azul-logo/15 bg-blanco p-5">
              <h2 className="font-display text-lg text-azul-petroleo">Descargas</h2>
              {digitales.some((i) => i.download) ? (
                <ul className="mt-3 flex flex-col gap-3">
                  {digitales.map((i) =>
                    i.download ? (
                      <li key={i.variantId} className="flex flex-wrap items-center justify-between gap-3">
                        <span className="text-sm">
                          <span className="block font-medium text-azul-petroleo">{i.productName}</span>
                          Vence el {formatFecha(i.download.expiresAt)} · {i.download.remaining} descargas restantes
                        </span>
                        <a
                          href={i.download.url}
                          download
                          className="boton-sitio inline-flex bg-azul-petroleo px-4 py-2 text-sm font-medium text-blanco hover:bg-celeste-cielo"
                        >
                          Descargar
                        </a>
                      </li>
                    ) : null,
                  )}
                </ul>
              ) : (
                <p className="mt-2 text-sm">Los links de descarga aparecen acá cuando se aprueba el pago.</p>
              )}
            </div>
          ) : null}

          <DatosEnvio shipping={order.shipping} />
        </div>

        <aside className="h-fit border border-azul-logo/15 bg-papel p-5" aria-label="Historial del pedido">
          <h2 className="font-display text-lg text-azul-petroleo">Historial</h2>
          <ol className="mt-3 flex flex-col gap-3 border-l-2 border-celeste-cielo/40 pl-4 text-sm">
            {[...order.history].reverse().map((h, idx) => (
              <li key={`${h.at}-${idx}`}>
                <span className="block font-medium text-azul-petroleo">{h.note || estadoPedido(h.status).label}</span>
                {formatFecha(h.at)}
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </section>
  );
}
