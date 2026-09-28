import { useEffect, useState } from "react";
import { alternateCloudinaryUrl } from "../../utils/cloudinary";

/**
 * Imagen con fondo placeholder hasta onLoad (evita cajas vacías).
 * Si Cloudinary responde 404 en una cuenta, reintenta en la otra.
 */
export function SoftImage({
  src,
  alt = "",
  className = "",
  imgClassName = "",
  eager = false,
  onError,
}) {
  const [currentSrc, setCurrentSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setCurrentSrc(src);
    setLoaded(false);
    setFailed(false);
  }, [src]);

  if (!currentSrc || failed) return null;

  return (
    <span className={`soft-image${loaded ? " is-loaded" : ""} ${className}`.trim()}>
      <img
        src={currentSrc}
        alt={alt}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={imgClassName}
        onLoad={() => setLoaded(true)}
        onError={(e) => {
          const next = alternateCloudinaryUrl(currentSrc);
          if (next && next !== currentSrc) {
            setCurrentSrc(next);
            setLoaded(false);
            return;
          }
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
