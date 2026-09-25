import { useEffect, useState } from "react";

/**
 * Imagen con fondo placeholder hasta onLoad (evita cajas vacías).
 */
export function SoftImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  eager = false,
  onError,
}) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (!src || failed) return null;

  return (
    <span className={`soft-image${loaded ? " is-loaded" : ""} ${className}`.trim()}>
      <img
        src={src}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={imgClassName}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          if (onError) {
            onError(e);
            return;
          }
          setFailed(true);
        }}
      />
    </span>
  );
}
