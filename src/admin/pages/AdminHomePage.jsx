import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { AdminPageHeader, AdminStatCard } from "../components/AdminForm";
import { fetchAdminCelebrations } from "../../redux/slices/celebrationsSlice";
import { fetchAdminPeople } from "../../redux/slices/peopleSlice";
import { fetchAdminTimelines } from "../../redux/slices/timelinesSlice";
import { fetchAdminVideos } from "../../redux/slices/videosSlice";
import { fetchAdminBooks } from "../../redux/slices/booksSlice";
import { fetchAdminSocial } from "../../redux/slices/socialSlice";
import { fetchAdminMedia } from "../../redux/slices/mediaSlice";

const CARDS = [
  {
    to: "/admin/celebraciones",
    title: "Fiestas",
    text: "Nombre, ubicación, fechas, mapa, calendario e imagen.",
    key: "celebrations",
  },
  {
    to: "/admin/personas",
    title: "Personas",
    text: "Santos, beatos y figuras destacadas.",
    key: "people",
  },
  {
    to: "/admin/cronologias",
    title: "Cronologías",
    text: "Líneas de tiempo (Francisco y otras).",
    key: "timelines",
  },
  {
    to: "/admin/videos",
    title: "Videos",
    text: "IDs de YouTube del sitio.",
    key: "videos",
  },
  {
    to: "/admin/libros",
    title: "Libros",
    text: "ISBN, título, editorial y estado.",
    key: "books",
  },
  {
    to: "/admin/redes",
    title: "Redes",
    text: "Instagram, Facebook y YouTube.",
    key: "social",
  },
  {
    to: "/admin/media",
    title: "Imágenes",
    text: "Biblioteca Cloudinary.",
    key: "media",
  },
];

export function AdminHomePage() {
  const dispatch = useDispatch();
  const celebrations = useSelector((s) => s.celebrations.adminItems);
  const people = useSelector((s) => s.people.adminItems);
  const timelines = useSelector((s) => s.timelines.adminItems);
  const videos = useSelector((s) => s.videos.adminItems);
  const books = useSelector((s) => s.books.adminItems);
  const social = useSelector((s) => s.social.adminItems);
  const media = useSelector((s) => s.media.items);

  useEffect(() => {
    dispatch(fetchAdminCelebrations());
    dispatch(fetchAdminPeople());
    dispatch(fetchAdminTimelines());
    dispatch(fetchAdminVideos());
    dispatch(fetchAdminBooks());
    dispatch(fetchAdminSocial());
    dispatch(fetchAdminMedia());
  }, [dispatch]);

  const counts = {
    celebrations: celebrations.length,
    people: people.length,
    timelines: timelines.length,
    videos: videos.length,
    books: books.length,
    social: social.length,
    media: media.length,
  };

  const publishedFiestas = celebrations.filter((c) => c.status === "PUBLISHED").length;

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Contenido conectado al backend (docs API). Lo publicado alimenta el sitio público."
      />

      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <AdminStatCard
          label="Total fiestas"
          value={counts.celebrations}
          hint={`${publishedFiestas} publicadas`}
        />
        <AdminStatCard label="Imágenes" value={counts.media} accent="naranja" />
        <AdminStatCard label="Personas" value={counts.people} accent="petroleo" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {CARDS.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group border border-azul-logo/15 bg-blanco p-5 shadow-[0_8px_24px_rgb(3_62_96/0.04)] transition hover:-translate-y-0.5 hover:border-celeste-cielo hover:shadow-[0_14px_28px_rgb(3_62_96/0.1)]"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-display text-xl text-azul-petroleo group-hover:text-celeste-cielo">
                {card.title}
              </p>
              <span className="font-display text-2xl text-celeste-cielo/80">
                {counts[card.key] ?? 0}
              </span>
            </div>
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
