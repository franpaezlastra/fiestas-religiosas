import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { NAV_LIBRO, NAV_PRINCIPAL } from "../../utils/nav";
import { Logo } from "../../components/ui/Logo";
import { fetchPublicSocial } from "../../redux/slices/socialSlice";

const PLATFORM_LABEL = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  YOUTUBE: "YouTube",
  WHATSAPP: "WhatsApp",
};

function IconInstagram({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10Zm0 8.2A3.2 3.2 0 1 1 12 8.8a3.2 3.2 0 0 1 0 6.4Z" />
      <path d="M17.5 6.3a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0Z" />
      <path d="M12 2.5c-2.6 0-2.9 0-3.9.1-2.6.1-4 1.5-4.1 4.1-.1 1-.1 1.3-.1 3.9s0 2.9.1 3.9c.1 2.6 1.5 4 4.1 4.1 1 .1 1.3.1 3.9.1s2.9 0 3.9-.1c2.6-.1 4-1.5 4.1-4.1.1-1 .1-1.3.1-3.9s0-2.9-.1-3.9c-.1-2.6-1.5-4-4.1-4.1-1-.1-1.3-.1-3.9-.1Zm0 1.8c2.5 0 2.8 0 3.8.1 1.8.1 2.7.9 2.8 2.8.1 1 .1 1.2.1 3.7s0 2.8-.1 3.8c-.1 1.8-.9 2.7-2.8 2.8-1 .1-1.2.1-3.8.1s-2.8 0-3.8-.1c-1.8-.1-2.7-.9-2.8-2.8-.1-1-.1-1.2-.1-3.8s0-2.8.1-3.8c.1-1.8 1-2.7 2.8-2.8 1-.1 1.3-.1 3.8-.1Z" />
    </svg>
  );
}

function IconFacebook({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M14.5 8.5V6.8c0-.6.1-1 .9-1h1.6V3h-2.5c-2.7 0-3.5 1.5-3.5 3.6v1.9H9v3h2v8h3.5v-8h2.3l.3-3H14.5Z" />
    </svg>
  );
}

function IconYoutube({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8ZM10 15.2V8.8L15.5 12 10 15.2Z" />
    </svg>
  );
}

function IconWhatsapp({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 3.1A8.9 8.9 0 0 0 5.2 17.4L4 20.9l3.6-1.1A8.9 8.9 0 1 0 12 3.1Zm0 16.2c-1.5 0-2.9-.4-4.1-1.1l-.3-.2-2.4.7.7-2.3-.2-.3a7.1 7.1 0 1 1 6.3 3.2Zm3.9-5.3c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1-.2.2-.6.7-.7.9-.1.1-.3.2-.5.1a5.8 5.8 0 0 1-2.8-2.4c-.2-.3.2-.3.5-.7.1-.1.1-.2.2-.4 0-.1 0-.3-.1-.4-.1-.1-.5-1.3-.7-1.7-.2-.5-.4-.4-.5-.4h-.4c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.3c.1.2 1.6 2.5 3.9 3.4.5.2 1 .4 1.3.5.6.2 1.1.1 1.5.1.5-.1 1.3-.5 1.5-1 .2-.5.2-.9.1-1-.1-.1-.2-.1-.4-.2Z" />
    </svg>
  );
}

const ICONS = {
  INSTAGRAM: IconInstagram,
  FACEBOOK: IconFacebook,
  YOUTUBE: IconYoutube,
  WHATSAPP: IconWhatsapp,
};

function SocialIconLink({ platform, url }) {
  const key = String(platform || "").toUpperCase();
  const label = PLATFORM_LABEL[key] || key;
  const Icon = ICONS[key];
  if (!Icon || !url) return null;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-blanco/25 text-celeste-cielo transition duration-200 hover:scale-105 hover:border-celeste-cielo hover:bg-blanco/10 hover:text-blanco focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-celeste-cielo"
    >
      <Icon className="h-5 w-5" />
    </a>
  );
}

export function Footer() {
  const dispatch = useDispatch();
  const links = useSelector((state) => state.social.publicItems);

  useEffect(() => {
    dispatch(fetchPublicSocial());
  }, [dispatch]);

  const sortedLinks = useMemo(() => {
    if (!Array.isArray(links) || links.length === 0) return [];
    return [...links]
      .filter((l) => l?.url && l?.platform)
      .sort((a, b) => (a.displayOrder ?? a.order ?? 0) - (b.displayOrder ?? b.order ?? 0));
  }, [links]);

  return (
    <footer className="bg-black text-blanco">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-3 md:py-16">
        <div>
          <Logo size="foot" />
          <p className="mt-3 text-sm font-light">Peregrinos. 80 fiestas populares argentinas</p>
          <p className="mt-2 text-sm">Federico Lanati · 2026</p>
          <p className="mt-1 text-sm">ISBN 978-631-01-7027-5</p>
          {sortedLinks.length > 0 ? (
            <nav className="mt-5 flex flex-wrap gap-3" aria-label="Redes sociales">
              {sortedLinks.map((link) => (
                <SocialIconLink
                  key={link.id || `${link.platform}-${link.url}`}
                  platform={link.platform}
                  url={link.url}
                />
              ))}
            </nav>
          ) : null}
        </div>
        <div className="text-sm">
          <p className="font-display text-xs uppercase tracking-wide text-celeste-cielo">Recorrer</p>
          <ul className="mt-3 flex flex-col gap-2">
            {NAV_PRINCIPAL.map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="transition-colors duration-200 hover:text-celeste-cielo">
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
                <Link to={l.to} className="transition-colors duration-200 hover:text-celeste-cielo">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-6 font-medium">Edición bilingüe</p>
          <p className="mt-1 font-light">Español / English · 1000 ejemplares</p>
          <p className="mt-3 font-light">Editores: Juan Travnik y Gustavo Tarchini</p>
        </div>
      </div>
      <p className="border-t border-blanco/15 px-4 py-4 text-center text-xs font-light">
        No se permite la reproducción total o parcial de este libro sin permiso escrito del editor.
      </p>
    </footer>
  );
}
