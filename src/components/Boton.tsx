import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

const BASE =
  "boton-sitio inline-flex items-center justify-center font-body font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-celeste-cielo";

const VARIANTES = {
  primario:
    "bg-azul-petroleo text-blanco hover:bg-celeste-cielo hover:shadow-[0_8px_22px_rgb(3_62_96/0.18)]",
  secundario:
    "border border-azul-petroleo bg-blanco/85 text-azul-petroleo hover:bg-azul-petroleo hover:text-blanco hover:shadow-[0_8px_22px_rgb(3_62_96/0.12)]",
};

const TAMANOS = {
  md: "px-6 py-3 text-sm",
  sm: "px-3 py-1.5 text-xs",
};

type Props = {
  children: ReactNode;
  variante?: keyof typeof VARIANTES;
  tamano?: keyof typeof TAMANOS;
  className?: string;
  to?: string;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className">;

export function Boton({
  children,
  variante = "primario",
  tamano = "md",
  className = "",
  to,
  type = "button",
  ...rest
}: Props) {
  const cls = `${BASE} ${VARIANTES[variante]} ${TAMANOS[tamano]} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls}>
        {children}
      </Link>
    );
  }

  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  );
}
