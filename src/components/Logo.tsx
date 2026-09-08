import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

type Props = {
  className?: string;
  size?: "nav" | "hero" | "foot";
};

const SIZES = {
  nav: "h-14 w-auto md:h-16",
  hero: "h-20 w-auto md:h-28",
  foot: "h-12 w-auto",
};

export function Logo({ className = "", size = "nav" }: Props) {
  return (
    <Link to="/" className={`inline-flex items-center ${className}`} aria-label="Inicio — Fiestas Religiosas">
      <img src={logo} alt="Fiestas Religiosas" className={SIZES[size]} />
    </Link>
  );
}
