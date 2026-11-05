import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { removeItem, setQuantity } from "../../redux/slices/cartSlice";
import { SelectorCantidad } from "../../components/tienda/TiendaUI";
import { formatPrecio } from "../../utils/tienda";

const AVISOS = {
  unavailable: "Este producto ya no está disponible. Quitalo para seguir.",
  out_of_stock: "Se quedó sin stock. Quitalo para seguir.",
  insufficient_stock: "No hay tantas unidades. Bajá la cantidad para seguir.",
};

/** Ítems del carrito (lo usan el drawer y la página /carrito). */
export function ListaCarrito({ items, compacto = false, onNavigate }) {
  const dispatch = useDispatch();

  return (
    <ul className="flex flex-col divide-y divide-azul-logo/15">
      {items.map((item) => {
        const digital = item.fulfillment === "digital";
        const max = digital ? 1 : item.stock;
        return (
          <li key={item.variantId} className={`flex gap-3 py-4 ${item.issue ? "bg-[#fef3f2] px-2" : ""}`}>
            <Link
              to={`/tienda/${item.slug}`}
              onClick={onNavigate}
              className={`foto-libro block shrink-0 ${compacto ? "h-16 w-16" : "h-20 w-20 md:h-24 md:w-24"}`}
              tabIndex={-1}
              aria-hidden
            >
              {item.image ? <img src={item.image} alt="" /> : null}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-start justify-between gap-2">
                <Link
                  to={`/tienda/${item.slug}`}
                  onClick={onNavigate}
                  className="font-medium leading-snug text-azul-petroleo hover:text-celeste-cielo"
                >
                  {item.name}
                </Link>
                <p className="shrink-0 font-medium text-azul-petroleo">
                  {formatPrecio(item.price * item.quantity)}
                </p>
              </div>
              <p className="text-sm">
                {[item.variantName, digital ? "Descarga digital" : null, `${formatPrecio(item.price)} c/u`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
              {item.issue ? (
                <p className="text-sm font-medium text-[#b42318]" role="alert">
                  {AVISOS[item.issue]}
                </p>
              ) : null}
              <div className="mt-1 flex flex-wrap items-center gap-3">
                {!digital && item.issue !== "unavailable" && item.issue !== "out_of_stock" ? (
                  <SelectorCantidad
                    value={item.quantity}
                    max={max}
                    label={`Cantidad de ${item.name}`}
                    onChange={(quantity) => dispatch(setQuantity({ variantId: item.variantId, quantity }))}
                  />
                ) : null}
                <button
                  type="button"
                  className="text-sm text-celeste-cielo underline-offset-2 hover:underline"
                  onClick={() => dispatch(removeItem(item.variantId))}
                  aria-label={`Quitar ${item.name} del carrito`}
                >
                  Quitar
                </button>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
