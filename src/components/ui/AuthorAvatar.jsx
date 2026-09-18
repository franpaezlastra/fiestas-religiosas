/**
 * Avatar circular reutilizable para autores / personas.
 */
export function AuthorAvatar({ src, alt, size = "lg", className = "" }) {
  const sizeClass =
    size === "sm" ? "h-20 w-20" : size === "md" ? "h-28 w-28" : "h-36 w-36 md:h-40 md:w-40";

  return (
    <div
      className={`shrink-0 overflow-hidden rounded-full border-2 border-azul-logo/25 bg-papel ${sizeClass} ${className}`}
    >
      <img
        src={src}
        alt={alt}
        className="h-full w-full object-cover object-center"
        loading="lazy"
        decoding="async"
      />
    </div>
  );
}
