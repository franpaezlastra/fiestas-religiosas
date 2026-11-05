import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  markOutOfStock,
  selectCartHasPhysical,
  selectCartItems,
  selectCartSubtotal,
  validateCart,
} from "../../redux/slices/cartSlice";
import { ordersService } from "../../services";
import { Boton } from "../../components/ui/Boton";
import { EncabezadoTienda } from "../../components/tienda/TiendaUI";
import { ULTIMO_PEDIDO_KEY, formatPrecio } from "../../utils/tienda";
import { PasoComprador, validarComprador } from "./PasoComprador";
import { PasoEnvio, validarEnvio } from "./PasoEnvio";

const COMPRADOR_INICIAL = { firstName: "", lastName: "", email: "", phone: "", dni: "" };
const ENVIO_INICIAL = {
  postalCode: "",
  quote: null,
  optionId: "",
  branchId: "",
  address: { street: "", number: "", apartment: "", city: "", province: "" },
};

export function PaginaCheckout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const hasPhysical = useSelector(selectCartHasPhysical);

  const pasos = hasPhysical ? ["Tus datos", "Envío", "Resumen"] : ["Tus datos", "Resumen"];
  const [paso, setPaso] = useState(0);
  const [comprador, setComprador] = useState(COMPRADOR_INICIAL);
  const [envio, setEnvio] = useState(ENVIO_INICIAL);
  const [errores, setErrores] = useState({});
  const [terminos, setTerminos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState(null);
  const tituloRef = useRef(null);

  /* Si el carrito tiene problemas (stock, bajas), no se puede pagar. */
  useEffect(() => {
    dispatch(validateCart())
      .unwrap()
      .then((res) => {
        if (res.items.some((r) => r.status !== "ok")) {
          navigate("/carrito", {
            replace: true,
            state: { aviso: "Algunos productos cambiaron de stock. Revisalos antes de pagar." },
          });
        }
      })
      .catch(() => {});
  }, [dispatch, navigate]);

  useEffect(() => {
    tituloRef.current?.focus();
  }, [paso]);

  if (items.length === 0 && !enviando) return <Navigate to="/carrito" replace />;

  const nombrePaso = pasos[paso];
  const opcion = envio.quote?.options.find((o) => o.id === envio.optionId) || null;
  const costoEnvio = hasPhysical ? opcion?.price ?? null : 0;

  function siguiente() {
    const errs = nombrePaso === "Tus datos" ? validarComprador(comprador) : validarEnvio(envio);
    setErrores(errs);
    if (Object.keys(errs).length) {
      window.setTimeout(() => document.querySelector("[aria-invalid='true']")?.focus(), 0);
      return;
    }
    setPaso((p) => p + 1);
  }

  async function pagar(e) {
    e.preventDefault();
    if (enviando) return;
    if (!terminos) {
      setErrores({ terminos: "Tenés que aceptar los términos y condiciones para seguir." });
      return;
    }
    setEnviando(true);
    setErrorGeneral(null);
    try {
      const body = {
        buyer: { ...comprador, dni: comprador.dni.replace(/\./g, "") },
        items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
        shipping: hasPhysical
          ? {
              postalCode: envio.postalCode.trim(),
              optionId: envio.optionId,
              branchId: opcion?.type === "branch" ? envio.branchId : null,
              address: opcion?.type === "home" ? envio.address : null,
            }
          : null,
        acceptTerms: true,
      };
      const res = await ordersService.create(body);
      try {
        localStorage.setItem(ULTIMO_PEDIDO_KEY, res.publicToken);
      } catch {
        /* ignore */
      }
      window.location.assign(res.checkoutUrl);
    } catch (err) {
      setEnviando(false);
      if (err.code === "OUT_OF_STOCK") {
        dispatch(markOutOfStock(err.details?.items));
        navigate("/carrito", {
          state: { aviso: "Mientras completabas los datos, algún producto se quedó sin stock." },
        });
        return;
      }
      if (err.code === "SHIPPING_UNAVAILABLE") {
        setEnvio((v) => ({ ...v, quote: null, optionId: "" }));
        setPaso(pasos.indexOf("Envío"));
        setErrores({ postalCode: err.message });
        return;
      }
      setErrorGeneral(err.message || "No pudimos crear la orden. Probá de nuevo.");
    }
  }

  return (
    <section>
      <EncabezadoTienda titulo="Finalizar compra" kicker="Checkout" />
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <ol className="mb-6 flex flex-wrap gap-2 text-sm" aria-label="Pasos de la compra">
            {pasos.map((p, i) => (
              <li
                key={p}
                aria-current={i === paso ? "step" : undefined}
                className={`border px-3 py-1 ${
                  i === paso
                    ? "border-celeste-cielo bg-papel font-medium text-azul-petroleo"
                    : i < paso
                      ? "border-azul-logo/20 text-azul-petroleo"
                      : "border-azul-logo/15 opacity-70"
                }`}
              >
                {i + 1}. {p}
                {i < paso ? <span className="sr-only"> (completo)</span> : null}
              </li>
            ))}
          </ol>

          <h2 ref={tituloRef} tabIndex={-1} className="subtitulo-seccion focus:outline-none">
            {nombrePaso}
          </h2>

          {nombrePaso === "Tus datos" ? (
            <PasoComprador value={comprador} onChange={setComprador} errores={errores} />
          ) : null}

          {nombrePaso === "Envío" ? (
            <PasoEnvio
              value={envio}
              onChange={setEnvio}
              errores={errores}
              setErrores={setErrores}
              items={items}
            />
          ) : null}

          {nombrePaso === "Resumen" ? (
            <form onSubmit={pagar} className="mt-4 flex flex-col gap-5" noValidate>
              <dl className="grid gap-4 border border-azul-logo/15 bg-blanco p-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-medium text-azul-petroleo">Comprador</dt>
                  <dd>
                    {comprador.firstName} {comprador.lastName}
                    <br />
                    {comprador.email} · {comprador.phone}
                    <br />
                    DNI {comprador.dni}
                  </dd>
                  <button type="button" className="mt-1 text-celeste-cielo underline" onClick={() => setPaso(0)}>
                    Cambiar
                  </button>
                </div>
                {hasPhysical ? (
                  <div>
                    <dt className="font-medium text-azul-petroleo">Envío</dt>
                    <dd>
                      {opcion?.name}
                      <br />
                      {opcion?.type === "home"
                        ? `${envio.address.street} ${envio.address.number}${
                            envio.address.apartment ? `, ${envio.address.apartment}` : ""
                          }, ${envio.address.city}, ${envio.address.province} (CP ${envio.postalCode})`
                        : opcion?.type === "branch"
                          ? envio.branches?.find((b) => b.id === envio.branchId)?.name
                          : opcion?.address}
                    </dd>
                    <button
                      type="button"
                      className="mt-1 text-celeste-cielo underline"
                      onClick={() => setPaso(pasos.indexOf("Envío"))}
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <div>
                    <dt className="font-medium text-azul-petroleo">Entrega</dt>
                    <dd>Descarga digital: te mandamos el link por email después del pago.</dd>
                  </div>
                )}
              </dl>

              <div>
                <label className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={terminos}
                    onChange={(e) => {
                      setTerminos(e.target.checked);
                      setErrores({});
                    }}
                    className="mt-1 h-4 w-4 accent-celeste-cielo"
                    aria-invalid={errores.terminos ? "true" : undefined}
                    aria-describedby={errores.terminos ? "terminos-error" : undefined}
                  />
                  <span>
                    Leí y acepto los{" "}
                    <Link to="/terminos" target="_blank" className="text-celeste-cielo underline">
                      términos y condiciones
                    </Link>{" "}
                    y la{" "}
                    <Link to="/cambios-y-devoluciones" target="_blank" className="text-celeste-cielo underline">
                      política de cambios y devoluciones
                    </Link>
                    .
                  </span>
                </label>
                {errores.terminos ? (
                  <p id="terminos-error" className="campo-error">
                    {errores.terminos}
                  </p>
                ) : null}
              </div>

              {errorGeneral ? (
                <p className="border border-[#b42318]/30 bg-[#fef3f2] px-4 py-3 text-[#b42318]" role="alert">
                  {errorGeneral}
                </p>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <Boton type="submit" disabled={enviando} className="disabled:cursor-wait disabled:opacity-60">
                  {enviando ? "Creando tu orden…" : "Pagar con Mercado Pago"}
                </Boton>
                <Boton variante="secundario" onClick={() => setPaso((p) => p - 1)} disabled={enviando}>
                  Volver
                </Boton>
              </div>
              <p className="text-xs">
                Te vamos a redirigir a Mercado Pago para pagar. El total final lo confirma el sistema al
                crear la orden.
              </p>
            </form>
          ) : (
            <div className="mt-6 flex flex-wrap gap-3">
              <Boton onClick={siguiente}>Continuar</Boton>
              {paso > 0 ? (
                <Boton variante="secundario" onClick={() => setPaso((p) => p - 1)}>
                  Volver
                </Boton>
              ) : (
                <Boton variante="secundario" to="/carrito">
                  Volver al carrito
                </Boton>
              )}
            </div>
          )}
        </div>

        <aside className="h-fit border border-azul-logo/15 bg-papel p-5" aria-label="Resumen de la compra">
          <h2 className="font-display text-lg text-azul-petroleo">Tu compra</h2>
          <ul className="mt-3 flex flex-col gap-3 text-sm">
            {items.map((i) => (
              <li key={i.variantId} className="flex justify-between gap-3">
                <span>
                  {i.quantity} × {i.name}
                  {i.variantName ? ` (${i.variantName})` : ""}
                </span>
                <span className="shrink-0">{formatPrecio(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 flex flex-col gap-1 border-t border-azul-logo/15 pt-3 text-sm">
            <div className="flex justify-between">
              <dt>Subtotal</dt>
              <dd>{formatPrecio(subtotal)}</dd>
            </div>
            {hasPhysical ? (
              <div className="flex justify-between">
                <dt>Envío</dt>
                <dd>{costoEnvio == null ? "A calcular" : costoEnvio === 0 ? "Sin cargo" : formatPrecio(costoEnvio)}</dd>
              </div>
            ) : null}
            <div className="mt-2 flex justify-between text-base font-medium text-azul-petroleo">
              <dt>Total</dt>
              <dd>{formatPrecio(subtotal + (costoEnvio || 0))}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </section>
  );
}
