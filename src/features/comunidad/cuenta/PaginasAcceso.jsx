import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  forgotPassword,
  loginUser,
  registerUser,
  resendVerification,
  resetPassword,
  verifyEmail,
} from "../../../redux/slices/userAuthSlice";
import { COMMUNITY_MOCKS, userAuthService } from "../../../services";
import { Boton } from "../../../components/ui/Boton";
import { Campo, EncabezadoTienda } from "../../../components/tienda/TiendaUI";
import { Captcha } from "../../../components/comunidad/AccesoExterno";
import { useDebounce } from "../../../hooks/useComunidad";
import { useMetaPagina } from "../../../hooks/useMetaPagina";
import {
  EDAD_MINIMA,
  LIMITES,
  erroresDeCampos,
  fuerzaPassword,
  mensajeError,
  sugerirUsername,
  validarDisplayName,
  validarPassword,
  validarUsername,
} from "../../../utils/comunidad";
import { validarEmail } from "../../../utils/tienda";

/* ---------- Piezas compartidas ---------- */

function Marco({ titulo, kicker = "Comunidad", children }) {
  return (
    <section>
      <EncabezadoTienda titulo={titulo} kicker={kicker} />
      <div className="mx-auto max-w-md px-4 py-8 md:py-10">{children}</div>
    </section>
  );
}

function Alerta({ tono = "error", children }) {
  const cls =
    tono === "ok"
      ? "border-[#166534]/30 bg-[#f0fdf4] text-[#166534]"
      : tono === "info"
        ? "border-azul-logo/20 bg-papel text-azul-petroleo"
        : "border-[#b42318]/30 bg-[#fef3f2] text-[#b42318]";
  return (
    <div className={`border px-4 py-3 text-sm ${cls}`} role={tono === "error" ? "alert" : "status"}>
      {children}
    </div>
  );
}

function IndicadorFuerza({ password, id }) {
  const { nivel, label } = fuerzaPassword(password);
  if (!password) return null;
  const colores = ["", "bg-[#b42318]", "bg-naranja-libro", "bg-celeste-cielo", "bg-[#166534]"];
  return (
    <div id={id} className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden>
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={`h-1.5 flex-1 ${n <= nivel ? colores[nivel] : "bg-azul-logo/15"}`} />
        ))}
      </div>
      <p className="mt-1 text-xs">Seguridad de la contraseña: {label}</p>
    </div>
  );
}

function Casilla({ id, checked, onChange, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="flex items-start gap-3 text-sm">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-4 w-4 accent-[#0098d4]"
          aria-invalid={error ? "true" : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <span>{children}</span>
      </label>
      {error ? (
        <p id={`${id}-error`} className="campo-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function enfocarPrimerError() {
  window.setTimeout(() => document.querySelector("[aria-invalid='true']")?.focus(), 0);
}

function useDestino() {
  const location = useLocation();
  const from = location.state?.from;
  return from ? `${from.pathname || "/comunidad"}${from.search || ""}${from.hash || ""}` : "/comunidad";
}

function CasillasLegales({ terminos, setTerminos, edad, setEdad, intentado, prefijo }) {
  return (
    <>
      <Casilla id={`${prefijo}-terminos`} checked={terminos} onChange={setTerminos} error={intentado && !terminos ? "Tenés que aceptarlas para seguir." : null}>
        Acepto las{" "}
        <Link to="/comunidad/normas" target="_blank" className="text-celeste-cielo underline">
          normas de la comunidad
        </Link>{" "}
        y la{" "}
        <Link to="/privacidad" target="_blank" className="text-celeste-cielo underline">
          política de privacidad
        </Link>
        .
      </Casilla>
      <Casilla id={`${prefijo}-edad`} checked={edad} onChange={setEdad} error={intentado && !edad ? "Tenés que confirmar tu edad." : null}>
        Tengo {EDAD_MINIMA} años o más.
      </Casilla>
    </>
  );
}

/* ---------- /comunidad/ingresar ---------- */

export function PaginaIngresar() {
  useMetaPagina({ title: "Ingresar", description: "Ingresá a la comunidad de Fiestas Religiosas." });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = useDestino();
  const user = useSelector((s) => s.userAuth.user);
  const [form, setForm] = useState({ email: "", password: "" });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  if (user && !enviando) return <Navigate to={destino} replace />;

  async function enviar(e) {
    e.preventDefault();
    const errs = {
      email: validarEmail(form.email),
      password: form.password ? null : "Escribí tu contraseña.",
    };
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrores(errs);
    setError(null);
    if (Object.keys(errs).length) return enfocarPrimerError();
    setEnviando(true);
    try {
      await dispatch(loginUser({ email: form.email.trim(), password: form.password })).unwrap();
      navigate(destino, { replace: true });
    } catch (err) {
      setEnviando(false);
      setError(err.code === "INVALID_CREDENTIALS" ? "El email o la contraseña no son correctos." : mensajeError(err));
    }
  }

  return (
    <Marco titulo="Ingresar">
        <>
          <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
            {error ? <Alerta>{error}</Alerta> : null}
            <Campo id="email" type="email" label="Email" required autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errores.email} />
            <Campo id="password" type="password" label="Contraseña" required autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errores.password} />
            <Link to="/comunidad/recuperar" className="-mt-2 self-end text-sm text-celeste-cielo underline">
              Olvidé mi contraseña
            </Link>
            <Boton type="submit" disabled={enviando} className="disabled:opacity-60">
              {enviando ? "Ingresando…" : "Ingresar"}
            </Boton>
          </form>
          <p className="mt-6 text-center text-sm">
            ¿Todavía no tenés cuenta?{" "}
            <Link to="/comunidad/registro" state={location.state} className="font-medium text-celeste-cielo underline">
              Creá una
            </Link>
          </p>
        </>
    </Marco>
  );
}

/* ---------- /comunidad/registro ---------- */

export function PaginaRegistro() {
  useMetaPagina({ title: "Crear cuenta", description: "Sumate a la comunidad y compartí tus fiestas populares." });
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = useDestino();
  const user = useSelector((s) => s.userAuth.user);
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "" });
  const [usernameTocado, setUsernameTocado] = useState(false);
  const [terminos, setTerminos] = useState(false);
  const [edad, setEdad] = useState(false);
  const [captcha, setCaptcha] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [intentado, setIntentado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [disponible, setDisponible] = useState(null); // null | "checking" | true | false

  const usernameDebounced = useDebounce(form.username, 450);

  useEffect(() => {
    if (validarUsername(usernameDebounced)) {
      setDisponible(null);
      return undefined;
    }
    let vigente = true;
    setDisponible("checking");
    userAuthService
      .checkUsername(usernameDebounced)
      .then((r) => vigente && setDisponible(Boolean(r.available)))
      .catch(() => vigente && setDisponible(null));
    return () => {
      vigente = false;
    };
  }, [usernameDebounced]);

  if (user && !enviando) return <Navigate to={destino} replace />;

  function set(campo, valor) {
    setForm((f) => {
      const next = { ...f, [campo]: valor };
      if (campo === "displayName" && !usernameTocado) next.username = sugerirUsername(valor);
      return next;
    });
  }

  async function enviar(e) {
    e.preventDefault();
    setIntentado(true);
    setError(null);
    const errs = {
      displayName: validarDisplayName(form.displayName),
      username: validarUsername(form.username) || (disponible === false ? "Ese nombre de usuario ya está en uso." : null),
      email: validarEmail(form.email),
      password: validarPassword(form.password),
      captcha: captcha ? null : "Completá la verificación.",
    };
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrores(errs);
    if (Object.keys(errs).length || !terminos || !edad) return enfocarPrimerError();
    setEnviando(true);
    try {
      await dispatch(
        registerUser({
          email: form.email.trim(),
          password: form.password,
          displayName: form.displayName.trim(),
          username: form.username.trim(),
          acceptedTerms: true,
          ageConfirmed: true,
          captchaToken: captcha,
        }),
      ).unwrap();
      navigate("/comunidad/verificar?enviado=1", { replace: true, state: location.state });
    } catch (err) {
      setEnviando(false);
      if (err.code === "EMAIL_TAKEN") setErrores({ email: "Ya hay una cuenta con ese email. ¿Querés ingresar?" });
      else if (err.code === "USERNAME_TAKEN") setErrores({ username: "Ese nombre de usuario ya está en uso." });
      else if (err.code === "CAPTCHA_FAILED") {
        setCaptcha(null);
        setCaptchaKey((k) => k + 1);
        setErrores({ captcha: "La verificación falló. Probá de nuevo." });
      } else if (err.code === "INVALID_REQUEST") setErrores(erroresDeCampos(err));
      else setError(mensajeError(err));
      enfocarPrimerError();
    }
  }

  const estadoUsername =
    disponible === "checking" ? "Comprobando…" : disponible === true ? "✓ Disponible" : disponible === false ? "No disponible" : null;

  return (
    <Marco titulo="Crear cuenta">
        <>
          <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
            {error ? <Alerta>{error}</Alerta> : null}
            <Campo id="displayName" label="Tu nombre" required autoComplete="name" maxLength={LIMITES.displayNameMax} value={form.displayName} onChange={(e) => set("displayName", e.target.value)} error={errores.displayName} hint="Así te van a ver los demás." />
            <div>
              <Campo
                id="username"
                label="Nombre de usuario"
                required
                autoComplete="username"
                maxLength={LIMITES.usernameMax}
                value={form.username}
                onChange={(e) => {
                  setUsernameTocado(true);
                  set("username", e.target.value.toLowerCase().replace(/\s+/g, "-"));
                }}
                error={errores.username}
                hint={`Tu perfil: /comunidad/u/${form.username || "tu-usuario"}. Minúsculas, números y guiones.`}
              />
              {estadoUsername && !errores.username ? (
                <p className={`mt-1 text-xs ${disponible === false ? "text-[#b42318]" : disponible === true ? "text-[#166534]" : ""}`} aria-live="polite">
                  {estadoUsername}
                </p>
              ) : null}
            </div>
            <Campo id="email" type="email" label="Email" required autoComplete="email" value={form.email} onChange={(e) => set("email", e.target.value)} error={errores.email} />
            <div>
              <Campo id="password" type="password" label="Contraseña" required autoComplete="new-password" value={form.password} onChange={(e) => set("password", e.target.value)} error={errores.password} hint={`Mínimo ${LIMITES.password} caracteres.`} />
              <IndicadorFuerza password={form.password} id="password-fuerza" />
            </div>
            <CasillasLegales terminos={terminos} setTerminos={setTerminos} edad={edad} setEdad={setEdad} intentado={intentado} prefijo="r" />
            <Captcha key={captchaKey} onToken={setCaptcha} error={errores.captcha} />
            <Boton type="submit" disabled={enviando} className="disabled:opacity-60">
              {enviando ? "Creando tu cuenta…" : "Crear cuenta"}
            </Boton>
          </form>
          <p className="mt-6 text-center text-sm">
            ¿Ya tenés cuenta?{" "}
            <Link to="/comunidad/ingresar" state={location.state} className="font-medium text-celeste-cielo underline">
              Ingresá
            </Link>
          </p>
        </>
    </Marco>
  );
}

/* ---------- /comunidad/verificar ---------- */

export function PaginaVerificar() {
  useMetaPagina({ title: "Confirmar email" });
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const token = params.get("token");
  const user = useSelector((s) => s.userAuth.user);
  const [estado, setEstado] = useState(token ? "loading" : "idle");
  const [error, setError] = useState(null);
  const [reenvio, setReenvio] = useState(null);
  const pedido = useRef(false);

  useEffect(() => {
    if (!token || pedido.current) return;
    pedido.current = true; // StrictMode monta dos veces: el token es de un solo uso
    dispatch(verifyEmail(token))
      .unwrap()
      .then(() => setEstado("ok"))
      .catch((err) => {
        setEstado("error");
        setError(err.code === "INVALID_TOKEN" ? "El link venció o ya se usó." : mensajeError(err));
      });
  }, [dispatch, token]);

  async function reenviar() {
    setReenvio("loading");
    try {
      await dispatch(resendVerification()).unwrap();
      setReenvio("ok");
    } catch (err) {
      setReenvio(mensajeError(err));
    }
  }

  return (
    <Marco titulo="Confirmá tu email">
      {estado === "loading" ? <Alerta tono="info">Confirmando tu email…</Alerta> : null}
      {estado === "ok" ? (
        <div className="flex flex-col gap-4">
          <Alerta tono="ok">¡Listo! Tu email quedó confirmado. Ya podés publicar y comentar.</Alerta>
          <div className="flex flex-wrap gap-2">
            <Boton to="/comunidad/publicar">Contar mi experiencia</Boton>
            <Boton to="/comunidad" variante="secundario">
              Ir a la comunidad
            </Boton>
          </div>
        </div>
      ) : null}
      {estado === "error" ? <Alerta>{error}</Alerta> : null}
      {estado === "idle" ? (
        <div className="flex flex-col gap-4">
          <Alerta tono="info">
            {user?.emailVerified
              ? "Tu email ya está confirmado."
              : `Te mandamos un email${user ? ` a ${user.email}` : ""} con un link para confirmar tu cuenta. Revisá también la carpeta de spam.`}
          </Alerta>
          {COMMUNITY_MOCKS && !user?.emailVerified ? (
            <p className="text-sm">
              <strong>Simulación:</strong> el email está en el panel “Modo simulación” (abajo a la izquierda), en la pestaña Comunidad.
            </p>
          ) : null}
        </div>
      ) : null}
      {(estado === "error" || estado === "idle") && user && !user.emailVerified ? (
        <div className="mt-4">
          <Boton variante="secundario" onClick={reenviar} disabled={reenvio === "loading"}>
            {reenvio === "loading" ? "Enviando…" : "Mandarme otro email"}
          </Boton>
          {reenvio === "ok" ? <p className="mt-2 text-sm" role="status">Te mandamos otro email.</p> : null}
          {reenvio && !["ok", "loading"].includes(reenvio) ? <p className="campo-error">{reenvio}</p> : null}
        </div>
      ) : null}
    </Marco>
  );
}

/* ---------- /comunidad/recuperar ---------- */

export function PaginaRecuperar() {
  useMetaPagina({ title: "Recuperar contraseña" });
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [captcha, setCaptcha] = useState(null);
  const [captchaKey, setCaptchaKey] = useState(0);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [enviado, setEnviado] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const errs = { email: validarEmail(email), captcha: captcha ? null : "Completá la verificación." };
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrores(errs);
    setError(null);
    if (Object.keys(errs).length) return enfocarPrimerError();
    setEnviando(true);
    try {
      await dispatch(forgotPassword({ email: email.trim(), captchaToken: captcha })).unwrap();
      setEnviado(true);
    } catch (err) {
      if (err.code === "CAPTCHA_FAILED") {
        setCaptcha(null);
        setCaptchaKey((k) => k + 1);
        setErrores({ captcha: "La verificación falló. Probá de nuevo." });
      } else setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Marco titulo="Recuperar contraseña">
      {enviado ? (
        <div className="flex flex-col gap-3">
          <Alerta tono="ok">
            Si hay una cuenta con {email}, te va a llegar un email con un link para elegir una contraseña nueva. El link vence en una hora.
          </Alerta>
          {COMMUNITY_MOCKS ? <p className="text-sm"><strong>Simulación:</strong> abrí el panel “Modo simulación” → Comunidad → Emails.</p> : null}
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <p className="text-sm">Escribí el email de tu cuenta y te mandamos un link para cambiar la contraseña.</p>
          {error ? <Alerta>{error}</Alerta> : null}
          <Campo id="email" type="email" label="Email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} error={errores.email} />
          <Captcha key={captchaKey} onToken={setCaptcha} error={errores.captcha} />
          <Boton type="submit" disabled={enviando}>
            {enviando ? "Enviando…" : "Mandarme el link"}
          </Boton>
          <Link to="/comunidad/ingresar" className="text-center text-sm text-celeste-cielo underline">
            Volver a ingresar
          </Link>
        </form>
      )}
    </Marco>
  );
}

/* ---------- /comunidad/restablecer ---------- */

export function PaginaRestablecer() {
  useMetaPagina({ title: "Nueva contraseña" });
  const dispatch = useDispatch();
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [errores, setErrores] = useState({});
  const [error, setError] = useState(null);
  const [listo, setListo] = useState(false);
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    const errs = {
      password: validarPassword(password),
      repetir: password === repetir ? null : "Las contraseñas no coinciden.",
    };
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrores(errs);
    if (Object.keys(errs).length) return enfocarPrimerError();
    setEnviando(true);
    setError(null);
    try {
      await dispatch(resetPassword({ token, password })).unwrap();
      setListo(true);
    } catch (err) {
      setError(err.code === "INVALID_TOKEN" ? "El link venció o ya se usó. Pedí uno nuevo." : mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Marco titulo="Elegí una contraseña nueva">
      {!token ? (
        <Alerta>
          Falta el link del email. <Link to="/comunidad/recuperar" className="underline">Pedí uno nuevo</Link>.
        </Alerta>
      ) : listo ? (
        <div className="flex flex-col gap-4">
          <Alerta tono="ok">Tu contraseña cambió. Por seguridad cerramos todas tus sesiones.</Alerta>
          <Boton to="/comunidad/ingresar">Ingresar</Boton>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          {error ? (
            <Alerta>
              {error} <Link to="/comunidad/recuperar" className="underline">Pedir otro link</Link>
            </Alerta>
          ) : null}
          <div>
            <Campo id="password" type="password" label="Contraseña nueva" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errores.password} hint={`Mínimo ${LIMITES.password} caracteres.`} />
            <IndicadorFuerza password={password} id="password-fuerza" />
          </div>
          <Campo id="repetir" type="password" label="Repetí la contraseña" required autoComplete="new-password" value={repetir} onChange={(e) => setRepetir(e.target.value)} error={errores.repetir} />
          <Boton type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Guardar contraseña"}
          </Boton>
        </form>
      )}
    </Marco>
  );
}

export { IndicadorFuerza, Alerta, Casilla };
