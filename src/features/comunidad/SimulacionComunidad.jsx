import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { communityMockControls } from "../../services";
import { loginUser, logoutUser } from "../../redux/slices/userAuthSlice";
import { formatHace, mensajeError } from "../../utils/comunidad";

const TRUCOS = [
  ["La palabra “bloqueada” en un texto", "CONTENT_BLOCKED"],
  ["Más de 3 comentarios en un minuto", "RATE_LIMITED"],
  ["Entrar como Ana", "email sin confirmar → EMAIL_NOT_VERIFIED al publicar"],
  ["Entrar como Roberto", "cuenta suspendida → ACCOUNT_SUSPENDED"],
  ["Denunciar con 3 cuentas distintas", "el contenido se oculta solo"],
  ["?mockError=CODIGO en la URL", "fuerza ese error en la próxima llamada"],
];

/** Pestaña Comunidad del panel de simulación (VITE_COMMUNITY_MOCKS=true). */
export function SimulacionComunidad() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.userAuth.user);
  const [emails, setEmails] = useState(() => communityMockControls.outbox());
  const [usuarios] = useState(() => communityMockControls.testUsers());
  const [estado, setEstado] = useState(null);

  async function entrar(email) {
    setEstado(null);
    try {
      if (user) await dispatch(logoutUser()).unwrap();
      await dispatch(loginUser({ email, password: communityMockControls.password })).unwrap();
      setEstado(`Entraste como ${email}.`);
    } catch (err) {
      setEstado(mensajeError(err));
    }
  }

  function reiniciar() {
    communityMockControls.reset();
    try {
      localStorage.removeItem("fr-borrador-publicacion");
    } catch {
      /* ignore */
    }
    window.location.assign("/comunidad");
  }

  return (
    <>
      <p className="text-xs">
        La comunidad usa datos de prueba guardados en este navegador. El captcha se reemplaza por una casilla de prueba.
      </p>

      <p className="mt-3 font-medium text-azul-petroleo">Cuentas de prueba</p>
      <p className="text-xs">
        Contraseña de todas: <code className="bg-papel px-1">{communityMockControls.password}</code>
      </p>
      <ul className="mt-1 flex flex-col gap-1">
        {usuarios.map((u) => (
          <li key={u.email} className="flex items-center justify-between gap-2 text-xs">
            <span>
              <strong>{u.displayName}</strong> · {u.nota}
            </span>
            <button
              type="button"
              className="shrink-0 border border-azul-petroleo px-2 py-0.5 text-azul-petroleo hover:bg-azul-petroleo hover:text-blanco disabled:opacity-40"
              disabled={user?.email === u.email}
              onClick={() => entrar(u.email)}
            >
              {user?.email === u.email ? "Activa" : "Entrar"}
            </button>
          </li>
        ))}
      </ul>
      {estado ? <p className="mt-1 text-xs" role="status">{estado}</p> : null}

      <div className="mt-3 flex items-center justify-between">
        <p className="font-medium text-azul-petroleo">Emails enviados</p>
        <button type="button" className="text-xs text-celeste-cielo underline" onClick={() => setEmails(communityMockControls.outbox())}>
          Actualizar
        </button>
      </div>
      {emails.length ? (
        <ul className="mt-1 flex flex-col gap-2">
          {emails.slice(0, 6).map((m) => (
            <li key={m.id} className="border border-azul-logo/15 p-2 text-xs">
              <p>
                <strong>{m.subject}</strong>
              </p>
              <p>
                Para {m.to} · {formatHace(m.createdAt)}
              </p>
              {m.link ? (
                <Link to={m.link} className="text-celeste-cielo underline">
                  Abrir el link del email
                </Link>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-xs">Todavía no se mandó ninguno. Registrate o pedí recuperar la contraseña.</p>
      )}

      <p className="mt-3 font-medium text-azul-petroleo">Para probar errores</p>
      <ul className="mt-1 flex flex-col gap-1.5 text-xs">
        {TRUCOS.map(([que, resultado]) => (
          <li key={que}>
            <strong>{que}</strong> → {resultado}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs">
        Para moderar: entrá al admin con tu usuario de siempre → <strong>Comunidad</strong>.
      </p>

      <button
        type="button"
        className="mt-4 w-full border border-azul-petroleo px-3 py-2 text-azul-petroleo hover:bg-azul-petroleo hover:text-blanco"
        onClick={reiniciar}
      >
        Reiniciar datos de la comunidad
      </button>
    </>
  );
}
