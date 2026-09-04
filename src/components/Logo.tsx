import { Link } from "react-router-dom";
import logo from "../assets/logo.webp";

type Props = {
  className?: string;
  size?: "nav" | "hero" | "foot";
};

const SIZES = {
  nav: "h-9 w-auto md:h-10",
  hero: "h-20 w-auto md:h-28",
  foot: "h-10 w-auto",
};

export function Logo({ className = "", size = "nav" }: Props) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label="Inicio — Fiestas Religiosas">
      <img
        src={logo}
        alt="Fiestas Religiosas"
        className={`${SIZES[size]} mix-blend-screen`}
      />
    </Link>
  );
}
