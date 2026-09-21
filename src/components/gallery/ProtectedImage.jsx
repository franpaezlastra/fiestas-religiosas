/**
 * Imagen de consulta: dificulta clic derecho, arrastre y "abrir en pestaña".
 * No es seguridad absoluta (nada en el navegador lo es), pero frena el uso casual.
 */
export function ProtectedImage({
  src,
  alt = "",
  className = "",
  fit = "cover",
}) {
  if (!src) return null;

  function block(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  }

  const fitClass = fit === "contain" ? "object-contain" : "object-cover";

  return (
    <span
      className={`protected-image ${className}`.trim()}
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
      />
      <span className="protected-image-shield" aria-hidden />
    </span>
  );
}
