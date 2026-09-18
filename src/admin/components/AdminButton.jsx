import { Link } from "react-router-dom";

/**
 * Botón del panel admin (sistema de diseño propio, no el Boton del sitio).
 */
export function AdminButton({
  children,
  variante = "primary",
  tamano = "md",
  className = "",
  to,
  type = "button",
  ...props
}) {
  const variantClass =
    variante === "secundario" || variante === "secondary"
      ? "admin-btn--secondary"
      : variante === "danger"
        ? "admin-btn--danger"
        : variante === "danger-solid"
          ? "admin-btn--danger-solid"
          : variante === "ghost"
            ? "admin-btn--ghost"
            : "admin-btn--primary";

  const sizeClass =
    tamano === "sm" ? "admin-btn--sm" : tamano === "icon" ? "admin-btn--icon" : "";

  const cls = `admin-btn ${variantClass} ${sizeClass} ${className}`.trim();

  if (to) {
    return (
      <Link to={to} className={cls} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} {...props}>
      {children}
    </button>
  );
}
