import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../redux/slices/authSlice";
import { Boton } from "../../components/ui/Boton";

const LINKS = [
  { to: "/admin", end: true, label: "Inicio" },
  { to: "/admin/celebraciones", label: "Fiestas" },
  { to: "/admin/personas", label: "Personas" },
  { to: "/admin/cronologias", label: "Cronologías" },
  { to: "/admin/videos", label: "Videos" },
  { to: "/admin/libros", label: "Libros" },
  { to: "/admin/redes", label: "Redes" },
  { to: "/admin/media", label: "Imágenes" },
];

export function AdminLayout() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const admin = useSelector((state) => state.auth.admin);

  async function onLogout() {
    await dispatch(logout());
    navigate("/admin/login");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7f3ec_0%,#ffffff_42%)] text-texto">
      <header className="sticky top-0 z-40 border-b border-azul-logo/15 bg-blanco/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 md:px-6">
          <div>
            <p className="font-display text-lg text-azul-petroleo">Panel administrador</p>
            <p className="text-xs text-texto/65">{admin?.email}</p>
          </div>
          <div className="flex items-center gap-2">
            <Boton variante="secundario" tamano="sm" to="/">
              Ver sitio
            </Boton>
            <Boton variante="secundario" tamano="sm" onClick={onLogout}>
              Salir
            </Boton>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3 md:px-6">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `shrink-0 px-3.5 py-2 text-sm transition ${
                  isActive
                    ? "bg-azul-petroleo text-blanco shadow-[0_6px_16px_rgb(3_62_96/0.18)]"
                    : "border border-azul-logo/20 bg-blanco text-azul-petroleo hover:border-celeste-cielo hover:text-celeste-cielo"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-10">
        <Outlet />
      </main>
    </div>
  );
}
