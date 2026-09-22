/**
 * Imagen de consulta: dificulta clic derecho, arrastre y "abrir en pestaña".
 * No es seguridad absoluta (nada en el navegador lo es), pero frena el uso casual.
 *
 * fit: "cover" | "contain" | "natural" (ancho 100%, alto según la foto)
 */
export function ProtectedImage({
  src,
  alt = "",
  className = "",
  fit = "cover",
  onError,
}) {
  if (!src) return null;

  function block(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  const fitClass =
    fit === "natural" ? "object-contain h-auto" : fit === "contain" ? "object-contain" : "object-cover";

  return (
    <span
      className={`protected-image ${fit === "natural" ? "is-natural" : ""} ${className}`.trim()}
      onContextMenu={block}
      onDragStart={block}
      role="img"
      aria-label={alt || undefined}
    >
      <img
        src={src}
        alt=""
        draggable={false}
        loading="lazy"
        decoding="async"
        className={fitClass}
        onContextMenu={block}
        onDragStart={block}
        onError={onError}
      />
      <span className="protected-image-shield" aria-hidden />
    </span>
  );
}
