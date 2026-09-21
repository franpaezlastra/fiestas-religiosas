import { useEffect, useState } from "react";
import { ProtectedImage } from "./ProtectedImage";

export function GaleriaModal({ titulo, fotos, abierta, onCerrar, indiceInicial = 0 }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (abierta) setI(Math.min(Math.max(0, indiceInicial), Math.max(0, fotos.length - 1)));
  }, [abierta, fotos, indiceInicial]);

  useEffect(() => {
    if (!abierta) return;

    function onKey(e) {
      if (e.key === "Escape") onCerrar();
      if (e.key === "ArrowRight") setI((n) => (n + 1) % fotos.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + fotos.length) % fotos.length);
    }

    function blockKeys(e) {
      if ((e.ctrlKey || e.metaKey) && ["s", "S", "p", "P"].includes(e.key)) {
        e.preventDefault();
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("keydown", blockKeys);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keydown", blockKeys);
      document.body.style.overflow = prev;
    };
  }, [abierta, fotos.length, onCerrar]);

  if (!abierta || fotos.length === 0) return null;

  const actual = fotos[i];

  return (
    <div
      className="galeria-modal"
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onContextMenu={(e) => e.preventDefault()}
    >
      <button
        type="button"
        className="galeria-modal-fondo"
        aria-label="Cerrar galería"
        onClick={onCerrar}
      />
      <button type="button" className="galeria-modal-cerrar" onClick={onCerrar} aria-label="Cerrar">
        ×
      </button>
      {fotos.length > 1 ? (
        <button
          type="button"
          className="galeria-modal-flecha is-izq"
          aria-label="Foto anterior"
          onClick={() => setI((n) => (n - 1 + fotos.length) % fotos.length)}
        >
          ‹
        </button>
      ) : null}
      <figure className="galeria-modal-foto">
        <ProtectedImage
          src={actual}
          alt={`${titulo} — foto ${i + 1} de ${fotos.length}`}
          fit="contain"
          className="galeria-modal-protected"
        />
        <figcaption>
          {titulo}
          <span>
            {i + 1} / {fotos.length}
          </span>
        </figcaption>
      </figure>
      {fotos.length > 1 ? (
        <button
          type="button"
          className="galeria-modal-flecha is-der"
          aria-label="Foto siguiente"
          onClick={() => setI((n) => (n + 1) % fotos.length)}
        >
          ›
        </button>
      ) : null}
    </div>
  );
}
