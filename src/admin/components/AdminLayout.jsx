import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";
import { logout } from "../../redux/slices/authSlice";
import { AdminButton } from "./AdminButton";
import { AdminToastProvider } from "./AdminToast";
import "../admin.css";

const LINKS = [
  { to: "/admin", end: true, label: "Inicio", icon: "⌂" },
  { to: "/admin/celebraciones", label: "Fiestas", icon: "◎" },
  { to: "/admin/personas", label: "Personas", icon: "☺" },
  { to: "/admin/cronologias", label: "Cronologías", icon: "☰" },
  { to: "/admin/videos", label: "Videos", icon: "▶" },
  { to: "/admin/libros", label: "Libros", icon: "▤" },
  { to: "/admin/redes", label: "Redes", icon: "☍" },
  { to: "/admin/media", label: "Imágenes", icon: "▣" },
];

const COLLAPSE_KEY = "fr-admin-sidebar-collapsed";

export function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const admin = useSelector((state) => state.auth.admin);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem(COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, [collapsed]);

  async function onLogout() {
    await dispatch(logout());
    navigate("/admin/login");
  }

  const nav = (compact) => (
    <nav className="flex flex-col gap-1 p-2">
      {LINKS.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={() => setMobileOpen(false)}
          title={compact ? link.label : undefined}
          className={({ isActive }) =>
            `admin-tooltip flex items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-[var(--admin-accent)] text-white"
                : "text-[var(--admin-text)] hover:bg-[var(--admin-bg)]"
            } ${compact ? "justify-center px-0" : ""}`
          }
          {...(compact ? { "data-tip": link.label } : {})}
        >
          <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center text-base leading-none">
            {link.icon}
          </span>
          {!compact ? <span className="truncate">{link.label}</span> : null}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="admin-shell">
      <AdminToastProvider>
      <div className="flex min-h-screen">
        <aside
          className="sticky top-0 hidden h-screen shrink-0 flex-col border-r border-[var(--admin-border)] bg-[var(--admin-surface)] md:flex"
          style={{
            width: collapsed ? "var(--admin-sidebar-w-collapsed)" : "var(--admin-sidebar-w)",
            transition: "width 200ms ease",
          }}
        >
          <div
            className={`border-b border-[var(--admin-border)] ${collapsed ? "px-2 py-4 text-center" : "px-4 py-5"}`}
          >
            {!collapsed ? (
              <>
                <p className="text-sm font-semibold text-[var(--admin-accent)]">Fiestas Religiosas</p>
                <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">Panel admin</p>
              </>
            ) : (
              <p className="text-sm font-semibold text-[var(--admin-accent)]">FR</p>
            )}
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden">{nav(collapsed)}</div>
          <div className="border-t border-[var(--admin-border)] p-2">
            {!collapsed ? (
              <p className="mb-2 truncate px-2 text-[11px] text-[var(--admin-text-muted)]">
                {admin?.email}
              </p>
            ) : null}
            <div className={`flex flex-col gap-1.5 ${collapsed ? "items-center" : ""}`}>
              {!collapsed ? (
                <>
                  <AdminButton variante="secondary" tamano="sm" to="/" className="!w-full">
                    Ver sitio
                  </AdminButton>
                  <AdminButton variante="secondary" tamano="sm" onClick={onLogout} className="!w-full">
                    Salir
                  </AdminButton>
                </>
              ) : null}
              <AdminButton
                variante="ghost"
                tamano={collapsed ? "icon" : "sm"}
                className={collapsed ? "" : "!w-full"}
                onClick={() => setCollapsed((v) => !v)}
                aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
                title={collapsed ? "Expandir" : "Colapsar"}
              >
                {collapsed ? "»" : "« Colapsar"}
              </AdminButton>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 md:hidden">
            <div>
              <p className="text-sm font-semibold text-[var(--admin-accent)]">Admin</p>
              <p className="text-[11px] text-[var(--admin-text-muted)]">{admin?.email}</p>
            </div>
            <AdminButton variante="secondary" tamano="sm" onClick={() => setMobileOpen((v) => !v)}>
              {mobileOpen ? "Cerrar" : "Menú"}
            </AdminButton>
          </header>

          {mobileOpen ? (
            <div className="border-b border-[var(--admin-border)] bg-[var(--admin-surface)] md:hidden">
              {nav(false)}
              <div className="flex gap-2 border-t border-[var(--admin-border)] p-3">
                <AdminButton variante="secondary" tamano="sm" to="/" onClick={() => setMobileOpen(false)}>
                  Ver sitio
                </AdminButton>
                <AdminButton variante="secondary" tamano="sm" onClick={onLogout}>
                  Salir
                </AdminButton>
              </div>
            </div>
          ) : null}

          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </main>
        </div>
      </div>
      </AdminToastProvider>
    </div>
  );
}
