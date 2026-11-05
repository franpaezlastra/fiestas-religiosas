import { Link } from "react-router-dom";
import { estadoPedido, formatPrecio } from "../../utils/tienda";

/** Campo de formulario con <label> y error asociado por aria-describedby. */
export function Campo({
  id,
  label,
  error,
  hint,
  required = false,
  as = "input",
  className = "",
  children,
  ...props
}) {
  const describedBy = [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
    .filter(Boolean)
    .join(" ");
  const Control = as;
  return (
    <div className={className}>
      <label htmlFor={id} className="text-sm font-medium text-azul-petroleo">
        {label}
        {required ? <span aria-hidden> *</span> : null}
      </label>
      <Control
        id={id}
        name={id}
        className="campo-input"
        aria-invalid={error ? "true" : undefined}
        aria-describedby={describedBy || undefined}
        aria-required={required || undefined}
        {...props}
      >
        {children}
      </Control>
      {hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="campo-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function SelectorCantidad({ value, max, onChange, label = "Cantidad", disabled = false }) {
  const tope = max == null ? Infinity : max;
  return (
    <div className="inline-flex items-center border border-azul-logo/35" role="group" aria-label={label}>
      <button
        type="button"
        className="h-10 w-10 text-lg text-azul-petroleo disabled:opacity-35"
        onClick={() => onChange(value - 1)}
        disabled={disabled || value <= 1}
        aria-label="Restar uno"
      >
        −
      </button>
      <span className="min-w-10 text-center font-medium text-azul-petroleo" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="h-10 w-10 text-lg text-azul-petroleo disabled:opacity-35"
        onClick={() => onChange(value + 1)}
        disabled={disabled || value >= tope}
        aria-label="Sumar uno"
      >
        +
      </button>
    </div>
  );
}

export function EstadoPedido({ status }) {
  const { label, tono } = estadoPedido(status);
  return <span className={`estado-pedido is-${tono}`}>{label}</span>;
}

export function TarjetaProducto({ product }) {
  const image = product.images?.[0];
  const digital = product.fulfillment === "digital";
  return (
    <article className="card-hover flex h-full flex-col border border-azul-logo/15 bg-blanco">
      <Link
        to={`/tienda/${product.slug}`}
        className="flex h-full flex-col focus-visible:outline-offset-[-2px]"
      >
        <div className="foto-libro aspect-[4/3]">
          {image ? <img src={image.url} alt={image.alt || product.name} loading="lazy" /> : null}
        </div>
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="font-display text-xs uppercase tracking-wide text-celeste-cielo">
            {product.category?.name}
            {digital ? " · Descarga digital" : ""}
          </p>
          <h3 className="font-display text-lg leading-snug text-azul-petroleo">{product.name}</h3>
          <p className="text-sm leading-snug">{product.shortDescription}</p>
          <div className="mt-auto flex items-end justify-between gap-2 pt-2">
            <p className="font-medium text-azul-petroleo">
              {product.variants.length > 1 ? <span className="text-sm font-normal">Desde </span> : null}
              {formatPrecio(product.priceFrom)}
            </p>
            {!product.available ? (
              <span className="text-sm font-medium text-naranja-libro">Sin stock</span>
            ) : null}
          </div>
        </div>
      </Link>
    </article>
  );
}

export function SkeletonTarjeta() {
  return (
    <div className="border border-azul-logo/10 bg-blanco" aria-hidden>
      <div className="tienda-skeleton aspect-[4/3]" />
      <div className="flex flex-col gap-2 p-4">
        <div className="tienda-skeleton h-3 w-1/3" />
        <div className="tienda-skeleton h-5 w-4/5" />
        <div className="tienda-skeleton h-4 w-full" />
        <div className="tienda-skeleton mt-3 h-5 w-1/4" />
      </div>
    </div>
  );
}

/** Mensaje de estado vacío o error, con acción opcional. */
export function MensajeTienda({ titulo, texto, accion, tono = "info" }) {
  return (
    <div
      className={`border px-6 py-12 text-center ${
        tono === "error" ? "border-[#b42318]/30 bg-[#fef3f2]" : "border-azul-logo/15 bg-blanco"
      }`}
      role={tono === "error" ? "alert" : "status"}
    >
      <p className="subtitulo-seccion">{titulo}</p>
      {texto ? <p className="mx-auto mt-2 max-w-md">{texto}</p> : null}
      {accion ? <div className="mt-5 flex justify-center">{accion}</div> : null}
    </div>
  );
}

/** Encabezado de las páginas de tienda (más compacto que Portadilla). */
export function EncabezadoTienda({ titulo, kicker, children }) {
  return (
    <div className="bg-papel px-4 pt-8 pb-6 md:pt-12">
      <div className="mx-auto max-w-6xl">
        {kicker ? (
          <p className="font-display text-xs uppercase tracking-wide text-celeste-cielo">{kicker}</p>
        ) : null}
        <h1 className="titulo-seccion">{titulo}</h1>
        {children}
      </div>
    </div>
  );
}
