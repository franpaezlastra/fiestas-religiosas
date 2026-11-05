import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { logoutUser, resendVerification } from "../../redux/slices/userAuthSlice";
import { PageLoader } from "../ui/SectionLoader";
import { Avatar } from "./ComunidadUI";
import { mensajeError } from "../../utils/comunidad";

/** Equivalente público de RequireAuth: sin sesión, manda a ingresar y guarda de dónde venía. */
export function RequiereUsuario() {
  const { user, checked } = useSelector((s) => s.userAuth);
  const location = useLocation();
  if (!checked) return <PageLoader texto="Comprobando sesión…" />;
  if (!user) {
    return (
      <Navigate
        to="/comunidad/ingresar"
        replace
        state={{ from: { pathname: location.pathname, search: location.search, hash: location.hash } }}
      />
    );
  }
  return <Outlet />;
}

/** Aviso persistente mientras el email no esté confirmado. */
export function AvisoVerificarEmail() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.userAuth.user);
  const [estado, setEstado] = useState("idle");
  const [error, setError] = useState(null);

  if (!user || user.emailVerified) return null;

  async function reenviar() {
    setEstado("loading");
    setError(null);
    try {
      await dispatch(resendVerification()).unwrap();
      setEstado("sent");
    } catch (err) {
      setEstado("idle");
      setError(mensajeError(err));
    }
  }

  return (
    <div className="border-b border-naranja-libro/40 bg-[#fffaeb] px-4 py-3 text-sm text-azul-petroleo" role="status">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p>
          <strong>Confirmá tu email para poder publicar y comentar.</strong> Te mandamos un link a {user.email}.
        </p>
        {estado === "sent" ? (
          <p>Listo, te mandamos otro email.</p>
        ) : (
          <button
            type="button"
            onClick={reenviar}
            disabled={estado === "loading"}
            className="border border-azul-petroleo px-3 py-1 font-medium hover:bg-azul-petroleo hover:text-blanco disabled:opacity-60"
          >
            {estado === "loading" ? "Enviando…" : "Reenviar email"}
          </button>
        )}
        {error ? <p className="w-full text-[#b42318]">{error}</p> : null}
      </div>
    </div>
  );
}

/** Header: "Ingresar" o el avatar con su menú. */
export function MenuUsuario() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, checked } = useSelector((s) => s.userAuth);
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => setAbierto(false), [pathname]);

  useEffect(() => {
    if (!abierto) return undefined;
    function fuera(e) {
      if (!ref.current?.contains(e.target)) setAbierto(false);
    }
    function esc(e) {
      if (e.key === "Escape") {
        setAbierto(false);
        ref.current?.querySelector("button")?.focus();
      }
    }
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  if (!checked) return <span className="inline-block h-8 w-8" aria-hidden />;

  if (!user) {
    return (
      <Link
        to="/comunidad/ingresar"
        state={{ from: { pathname } }}
        className="px-1 font-body text-sm font-medium text-azul-petroleo hover:text-celeste-cielo"
      >
        Ingresar
      </Link>
    );
  }

  async function salir() {
    setAbierto(false);
    await dispatch(logoutUser());
    navigate("/comunidad");
  }

  const item = "block w-full px-4 py-2 text-left text-sm hover:bg-papel hover:text-celeste-cielo";
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="true"
        aria-label={`Menú de ${user.displayName}`}
        className="flex items-center rounded-full p-0.5 hover:ring-2 hover:ring-celeste-cielo"
      >
        <Avatar user={user} size="sm" />
      </button>
      {abierto ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 border border-azul-logo/20 bg-blanco py-2 text-azul-petroleo shadow-md">
          <p className="truncate px-4 pb-2 text-xs">
            Hola, <strong>{user.displayName}</strong>
          </p>
          <Link to={`/comunidad/u/${user.username}`} className={item}>
            Mi perfil
          </Link>
          <Link to="/comunidad/publicar" className={item}>
            Publicar
          </Link>
          <Link to="/comunidad/mi-cuenta" className={item}>
            Mi cuenta
          </Link>
          <button type="button" onClick={salir} className={`${item} border-t border-azul-logo/10`}>
            Salir
          </button>
        </div>
      ) : null}
    </div>
  );
}
