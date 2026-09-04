import { useState } from "react";
import { NavLink } from "react-router-dom";
import { NAV_LIBRO, NAV_PRINCIPAL } from "../lib/nav";
import { Logo } from "./Logo";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `font-body text-sm font-medium ${isActive ? "text-celeste-cielo" : "text-blanco hover:text-celeste-cielo"}`;

export function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [libroAbierto, setLibroAbierto] = useState(false);

  function cerrar() {
    setMenuAbierto(false);
    setLibroAbierto(false);
  }

  return (
    <header className="sticky top-0 z-40 bg-black text-blanco">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5">
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
              className="font-body text-sm font-medium hover:text-celeste-cielo"
              aria-expanded={libroAbierto}
              onClick={() => setLibroAbierto((v) => !v)}
            >
              El libro
            </button>
            {libroAbierto ? (
              <div className="absolute right-0 top-full z-50 mt-2 min-w-48 border border-celeste-cielo/30 bg-black py-2">
                {NAV_LIBRO.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className="block px-4 py-2 text-sm hover:bg-azul-petroleo hover:text-celeste-cielo"
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
        <nav className="border-t border-celeste-cielo/20 px-4 py-4 lg:hidden">
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
