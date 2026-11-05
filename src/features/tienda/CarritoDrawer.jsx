import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import { closeDrawer, selectCartItems, selectCartSubtotal } from "../../redux/slices/cartSlice";
import { Boton } from "../../components/ui/Boton";
import { formatPrecio } from "../../utils/tienda";
import { ListaCarrito } from "./ListaCarrito";

/** Panel lateral del carrito: se abre al agregar un producto. */
export function CarritoDrawer() {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.cart.drawerOpen);
  const items = useSelector(selectCartItems);
  const subtotal = useSelector(selectCartSubtotal);
  const { pathname } = useLocation();
  const panelRef = useRef(null);
  const previousFocus = useRef(null);

  useEffect(() => {
    dispatch(closeDrawer());
  }, [pathname, dispatch]);

  useEffect(() => {
    if (!open) return undefined;
    previousFocus.current = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector("button, [href]")?.focus();

    function onKey(e) {
      if (e.key === "Escape") dispatch(closeDrawer());
      if (e.key !== "Tab" || !panelRef.current) return;
      const focusables = panelRef.current.querySelectorAll(
        "button:not([disabled]), [href], input:not([disabled])",
      );
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
      previousFocus.current?.focus?.();
    };
  }, [open, dispatch]);

  if (!open) return null;

  const cerrar = () => dispatch(closeDrawer());

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Cerrar carrito"
        tabIndex={-1}
        onClick={cerrar}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="carrito-drawer-titulo"
        className="carrito-drawer absolute top-0 right-0 flex h-full w-full max-w-md flex-col bg-blanco shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-azul-logo/15 px-5 py-4">
          <h2 id="carrito-drawer-titulo" className="subtitulo-seccion">
            Tu carrito
          </h2>
          <button
            type="button"
            className="px-2 py-1 text-sm text-azul-petroleo hover:text-celeste-cielo"
            onClick={cerrar}
            aria-label="Cerrar carrito"
          >
            Cerrar ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5">
          {items.length === 0 ? (
            <p className="py-10 text-center">Tu carrito está vacío.</p>
          ) : (
            <ListaCarrito items={items} compacto onNavigate={cerrar} />
          )}
        </div>

        {items.length > 0 ? (
          <footer className="border-t border-azul-logo/15 px-5 py-4">
            <div className="flex justify-between font-medium text-azul-petroleo">
              <span>Subtotal</span>
              <span>{formatPrecio(subtotal)}</span>
            </div>
            <p className="mt-1 text-xs">El envío se calcula en el checkout.</p>
            <div className="mt-4 flex flex-col gap-2">
              <Boton to="/checkout">Iniciar compra</Boton>
              <Boton to="/carrito" variante="secundario">
                Ver carrito
              </Boton>
            </div>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
