/**
 * Preloader de sección (datos / imágenes). Reutiliza estilos .galeria-loader*.
 */
export function SectionLoader({
  texto = "Cargando…",
  hint,
  className = "",
  compact = false,
}) {
  return (
    <div
      className={`galeria-loader${compact ? " is-compact" : ""} ${className}`.trim()}
      role="status"
      aria-live="polite"
    >
      <span className="galeria-loader-spin" aria-hidden />
      <p className="galeria-loader-texto">{texto}</p>
      {hint ? <p className="galeria-loader-hint">{hint}</p> : null}
    </div>
  );
}

/** Fallback liviano para Suspense de rutas / chunks */
export function PageLoader({ texto = "Cargando…" }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 bg-papel px-4">
      <span className="galeria-loader-spin" aria-hidden />
      <p className="galeria-loader-texto text-base">{texto}</p>
    </div>
  );
}
