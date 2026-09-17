import { Link } from "react-router-dom";
import { AdminPageHeader } from "../components/AdminForm";

const CARDS = [
  {
    to: "/admin/celebraciones",
    title: "Fiestas",
    text: "Nombre, ubicación, fechas, mapa, calendario e imagen primaria.",
  },
  {
    to: "/admin/personas",
    title: "Personas",
    text: "Santos, beatos y figuras destacadas con biografía.",
  },
  {
    to: "/admin/cronologias",
    title: "Cronologías",
    text: "Líneas de tiempo del homenaje a Francisco y otras.",
  },
  {
    to: "/admin/videos",
    title: "Videos",
    text: "IDs de YouTube publicados en la sección Video.",
  },
  {
    to: "/admin/libros",
    title: "Libros",
    text: "Ficha del libro: ISBN, título, editorial y estado.",
  },
  {
    to: "/admin/redes",
    title: "Redes",
    text: "Instagram, Facebook y YouTube del proyecto.",
  },
  {
    to: "/admin/media",
    title: "Imágenes",
    text: "Biblioteca Cloudinary para asociar a fiestas y personas.",
  },
];

export function AdminHomePage() {
  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Elegí un módulo para cargar o publicar contenido. Lo publicado alimenta el sitio público."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group border border-azul-logo/15 bg-blanco p-5 shadow-[0_8px_24px_rgb(3_62_96/0.04)] transition hover:-translate-y-0.5 hover:border-celeste-cielo hover:shadow-[0_14px_28px_rgb(3_62_96/0.1)]"
          >
            <p className="font-display text-xl text-azul-petroleo group-hover:text-celeste-cielo">
              {card.title}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-texto/80">{card.text}</p>
            <p className="mt-4 text-xs font-medium tracking-wide text-celeste-cielo uppercase">
              Abrir →
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
