import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import {
  clearCart,
  selectCartHasIssues,
  selectCartItems,
  selectCartSubtotal,
  validateCart,
} from "../../redux/slices/cartSlice";
import { Boton } from "../../components/ui/Boton";
import { EncabezadoTienda, MensajeTienda } from "../../components/tienda/TiendaUI";
import { formatPrecio } from "../../utils/tienda";
import { ListaCarrito } from "./ListaCarrito";

export function PaginaCarrito() {
  const dispatch = useDispatch();
  const { state } = useLocation();
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const hasIssues = useSelector(selectCartHasIssues);
  const validation = useSelector((s) => s.cart.validationStatus);

  /* Al entrar, revalida contra el catálogo (puede haber cambiado stock o precio). */
  useEffect(() => {
    dispatch(validateCart());
  }, [dispatch]);

  return (
    <section>
      <EncabezadoTienda titulo="Carrito" kicker="Tienda" />
      <div className="mx-auto max-w-6xl px-4 py-8">
        {state?.aviso ? (
          <p className="mb-6 border border-[#b42318]/30 bg-[#fef3f2] px-4 py-3 text-[#b42318]" role="alert">
            {state.aviso}
          </p>
        ) : null}

        {items.length === 0 ? (
          <MensajeTienda
            titulo="Tu carrito está vacío"
            texto="Mirá los libros disponibles."
            accion={<Boton to="/tienda">Ir a la tienda</Boton>}
          />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
            <div>
              <ListaCarrito items={items} />
              <button
                type="button"
                className="mt-4 text-sm text-celeste-cielo underline-offset-2 hover:underline"
                onClick={() => dispatch(clearCart())}
              >
                Vaciar carrito
              </button>
            </div>
            <aside className="h-fit border border-azul-logo/15 bg-papel p-5" aria-label="Resumen del carrito">
              <div className="flex justify-between font-medium text-azul-petroleo">
                <span>Subtotal</span>
                <span>{formatPrecio(subtotal)}</span>
              </div>
              <p className="mt-1 text-sm">El envío y el total final se calculan en el checkout.</p>
              {hasIssues ? (
                <p className="mt-4 text-sm font-medium text-[#b42318]" role="alert">
                  Hay productos marcados en rojo. Resolvelos para seguir.
                </p>
              ) : null}
              {validation === "failed" ? (
                <p className="mt-4 text-sm text-[#b42318]" role="alert">
                  No pudimos revisar el stock.{" "}
                  <button type="button" className="underline" onClick={() => dispatch(validateCart())}>
                    Reintentar
                  </button>
                </p>
              ) : null}
              <div className="mt-5 flex flex-col gap-2">
                {hasIssues || validation === "loading" ? (
                  <Boton disabled className="cursor-not-allowed opacity-50">
                    {validation === "loading" ? "Revisando stock…" : "Iniciar compra"}
                  </Boton>
                ) : (
                  <Boton to="/checkout">Iniciar compra</Boton>
                )}
                <Boton to="/tienda" variante="secundario">
                  Seguir comprando
                </Boton>
              </div>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}
