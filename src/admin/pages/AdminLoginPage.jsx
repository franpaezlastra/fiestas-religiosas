import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useLocation } from "react-router-dom";
import { clearAuthError, login } from "../../redux/slices/authSlice";
import { Boton } from "../../components/ui/Boton";
import { Campo, EncabezadoTienda } from "../../components/tienda/TiendaUI";
import { useMetaPagina } from "../../hooks/useMetaPagina";

/** Mensaje claro según la respuesta del backend (el mensaje crudo de la API puede venir en inglés). */
function mensajeLogin(error) {
  if (!error) return null;
  if (error.code === "INVALID_CREDENTIALS" || error.status === 401) {
    return "El email o la contraseña no son correctos.";
  }
  if (error.status === 429) return "Demasiados intentos seguidos. Esperá unos minutos y probá de nuevo.";
  if (error.status === 0 || error.code === "NETWORK_ERROR") return "No hay conexión con el servidor. Probá de nuevo.";
  return error.message || "No pudimos ingresar. Probá de nuevo.";
}

/**
 * Login del panel, con el mismo estilo que el "Ingresar" de la comunidad.
 * Por ahora las cuentas de admin y de la comunidad son distintas (ver docs/PROPUESTA_ROLES.md).
 */
export function AdminLoginPage() {
  useMetaPagina({ title: "Panel de administración" });
  const dispatch = useDispatch();
  const location = useLocation();
  const { admin, status, error, errorInfo } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errores, setErrores] = useState({});

  useEffect(() => {
    dispatch(clearAuthError());
  }, [dispatch]);

  if (admin) {
    const to = location.state?.from?.pathname || "/admin";
    return <Navigate to={to} replace />;
  }

  function onSubmit(e) {
    e.preventDefault();
    const errs = {};
    if (!email.trim()) errs.email = "Escribí tu email.";
    if (!password) errs.password = "Escribí tu contraseña.";
    setErrores(errs);
    if (Object.keys(errs).length) {
      window.setTimeout(() => document.querySelector("[aria-invalid='true']")?.focus(), 0);
      return;
    }
    dispatch(clearAuthError());
    dispatch(login({ email: email.trim(), password }));
  }

  const mensaje = error ? mensajeLogin(errorInfo || { message: error }) : null;

  return (
    <section>
      <EncabezadoTienda titulo="Panel de administración" kicker="Administración">
        <p className="mt-2 max-w-2xl text-sm">Acceso para quienes administran el contenido, la tienda y la comunidad del sitio.</p>
      </EncabezadoTienda>
      <div className="mx-auto max-w-md px-4 py-8 md:py-10">
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          {mensaje ? (
            <div className="border border-[#b42318]/30 bg-[#fef3f2] px-4 py-3 text-sm text-[#b42318]" role="alert">
              {mensaje}
            </div>
          ) : null}
          <Campo
            id="email"
            type="email"
            label="Email"
            required
            autoComplete="username"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errores.email}
          />
          <Campo
            id="password"
            type="password"
            label="Contraseña"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errores.password}
          />
          <Boton type="submit" disabled={status === "loading"} className="disabled:opacity-60">
            {status === "loading" ? "Ingresando…" : "Entrar al panel"}
          </Boton>
        </form>
        <p className="mt-6 border-t border-azul-logo/15 pt-5 text-center text-sm">
          ¿Querés participar en la comunidad?{" "}
          <Link to="/comunidad/ingresar" className="font-medium text-celeste-cielo underline">
            Ingresá acá
          </Link>
        </p>
      </div>
    </section>
  );
}
