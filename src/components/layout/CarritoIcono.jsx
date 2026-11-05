import { useDispatch, useSelector } from "react-redux";
import { openDrawer, selectCartCount } from "../../redux/slices/cartSlice";

export function CarritoIcono() {
  const dispatch = useDispatch();
  const count = useSelector(selectCartCount);
  const label = count === 0 ? "Carrito vacío" : `Carrito: ${count} ${count === 1 ? "producto" : "productos"}`;

  return (
    <button
      type="button"
      className="relative inline-flex h-10 w-10 items-center justify-center text-azul-petroleo transition-colors duration-200 hover:text-celeste-cielo"
      onClick={() => dispatch(openDrawer())}
      aria-label={label}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.9a1 1 0 0 0 1-.8L20 8H6.2" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="9.5" cy="19.5" r="1.3" />
        <circle cx="17" cy="19.5" r="1.3" />
      </svg>
      {count > 0 ? (
        <span
          className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-naranja-libro px-1 text-[11px] font-bold leading-none text-blanco"
          aria-hidden
        >
          {count > 99 ? "99+" : count}
        </span>
      ) : null}
    </button>
  );
}
