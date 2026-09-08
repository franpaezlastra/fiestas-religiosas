import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { NAV_LIBRO, NAV_PRINCIPAL } from "../lib/nav";
import { Logo } from "./Logo";

export function Header() {
  const { pathname } = useLocation();
  const esInicio = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [libroAbierto, setLibroAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
    setLibroAbierto(false);
  }, [pathname]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  const overlay = esInicio && !scrolled && !menuAbierto;

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `font-body text-sm font-medium transition-colors duration-200 ${
      isActive ? "text-celeste-cielo" : "text-azul-petroleo hover:text-celeste-cielo"
    }`;

  function cerrar() {
    setMenuAbierto(false);
    setLibroAbierto(false);
  }

  return (
    <header
      className={`site-header fixed top-0 z-40 w-full ${
        overlay
          ? "bg-transparent text-azul-petroleo"
          : "bg-blanco text-azul-petroleo shadow-[0_1px_0_rgb(65_93_130/0.12)]"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Logo />
        <nav className="hidden items-center gap-5 lg:flex">
          <NavLink to="/" end className={linkClass} onClick={cerrar}>
            Inicio
          </NavLink>
          {NAV_PRINCIPAL.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass} onClick={cerrar}>
              {l.to === "/mapa"
                ? "Mapa"
                : l.to === "/francisco"
                  ? "Francisco"
                  : l.to === "/santos"
                    ? "Santos"
                    : l.to === "/autor"
                      ? "Autor"
                      : l.to === "/shop"
                        ? "Comprar"
                        : l.label}
            </NavLink>
          ))}
          <div className="relative">
            <button
              type="button"
              className="font-body text-sm font-medium text-azul-petroleo transition-colors duration-200 hover:text-celeste-cielo"
              aria-expanded={libroAbierto}
              onClick={() => setLibroAbierto((v) => !v)}
            >
              El libro
            </button>
            {libroAbierto ? (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-48 border border-azul-logo/20 bg-blanco py-2 text-azul-petroleo">
                {NAV_LIBRO.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className="block px-4 py-2 text-sm hover:bg-papel hover:text-celeste-cielo"
                    onClick={cerrar}
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
        <button
          type="button"
          className="px-2 py-1 font-body text-sm lg:hidden"
          aria-expanded={menuAbierto}
          aria-label="Abrir menú"
          onClick={() => setMenuAbierto((v) => !v)}
        >
          {menuAbierto ? "Cerrar" : "Menú"}
        </button>
      </div>
      {menuAbierto ? (
        <nav className="border-t border-azul-logo/15 bg-blanco px-4 py-4 text-azul-petroleo lg:hidden">
          <ul className="flex flex-col gap-1">
            <li>
              <NavLink to="/" end className="block py-2 text-base" onClick={cerrar}>
                Inicio
              </NavLink>
            </li>
            {NAV_PRINCIPAL.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className="block py-2 text-base" onClick={cerrar}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-display text-xs uppercase tracking-wide text-celeste-cielo">El libro</p>
          <ul className="mt-1 flex flex-col gap-1">
            {NAV_LIBRO.map((l) => (
              <li key={l.to}>
                <NavLink to={l.to} className="block py-2 text-base" onClick={cerrar}>
                  {l.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </header>
  );
}
