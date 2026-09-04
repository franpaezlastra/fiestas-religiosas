import { Link } from "react-router-dom";
import { NAV_LIBRO, NAV_PRINCIPAL } from "../lib/nav";
import { Logo } from "./Logo";

type Props = {
  displayFont: "comfortaa" | "baloo";
  onDisplayFont: (font: "comfortaa" | "baloo") => void;
};

export function Footer({ displayFont, onDisplayFont }: Props) {
  return (
    <footer className="bg-black text-blanco">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-4">
        <div>
          <Logo size="foot" />
          <p className="mt-3 text-sm font-light">Peregrinos. 80 fiestas populares argentinas</p>
          <p className="mt-2 text-sm">Federico Lanati · 2026</p>
          <p className="mt-1 text-sm">ISBN 978-631-01-7027-5</p>
        </div>
        <div className="text-sm">
          <p className="font-display text-xs uppercase tracking-wide text-celeste-cielo">Recorrer</p>
          <ul className="mt-3 flex flex-col gap-2">
            {NAV_PRINCIPAL.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-celeste-cielo">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-display text-xs uppercase tracking-wide text-celeste-cielo">El libro</p>
          <ul className="mt-3 flex flex-col gap-2">
            {NAV_LIBRO.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-celeste-cielo">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-medium">Edición bilingüe</p>
          <p className="mt-1 font-light">Español / English · 1000 ejemplares</p>
          <p className="mt-3 font-light">Editores: Juan Travnik y Gustavo Tarchini</p>
          <p className="mt-4 font-medium">Tipografía de títulos</p>
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              className={`border px-3 py-1 ${displayFont === "comfortaa" ? "border-blanco bg-blanco text-black" : "border-blanco/50"}`}
              onClick={() => onDisplayFont("comfortaa")}
            >
              Comfortaa
            </button>
            <button
              type="button"
              className={`border px-3 py-1 ${displayFont === "baloo" ? "border-blanco bg-blanco text-black" : "border-blanco/50"}`}
              onClick={() => onDisplayFont("baloo")}
            >
              Baloo 2
            </button>
          </div>
        </div>
      </div>
      <p className="border-t border-blanco/15 px-4 py-4 text-center text-xs font-light">
        No se permite la reproducción total o parcial de este libro sin permiso escrito del editor.
      </p>
    </footer>
  );
}
