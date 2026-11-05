import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import {
  changePassword,
  deleteAccount,
  deleteAvatar,
  updateProfile,
  uploadAvatar,
} from "../../../redux/slices/userAuthSlice";
import { MIS_PUBLICACIONES, deletePost, fetchMyPosts } from "../../../redux/slices/communitySlice";
import { meService, userAuthService } from "../../../services";
import { Boton } from "../../../components/ui/Boton";
import { Campo, EncabezadoTienda } from "../../../components/tienda/TiendaUI";
import { Avatar, BotonVerMas, ContadorCaracteres, Dialogo, EstadoPublicacion } from "../../../components/comunidad/ComunidadUI";
import { useDebounce, useOpcionesComunidad, usePostsDeLista } from "../../../hooks/useComunidad";
import { useMetaPagina } from "../../../hooks/useMetaPagina";
import { comprimirImagen } from "../../../utils/imagenes";
import {
  LIMITES,
  erroresDeCampos,
  formatHace,
  mensajeError,
  validarDisplayName,
  validarPassword,
  validarUsername,
} from "../../../utils/comunidad";
import { Alerta, IndicadorFuerza } from "./PaginasAcceso";

function Seccion({ id, titulo, children, descripcion }) {
  return (
    <section id={id} aria-labelledby={`${id}-titulo`} className="scroll-mt-28 border border-azul-logo/15 bg-blanco p-5 md:p-6">
      <h2 id={`${id}-titulo`} className="font-display text-xl text-azul-petroleo">
        {titulo}
      </h2>
      {descripcion ? <p className="mt-1 text-sm">{descripcion}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}

/* ---------- Perfil ---------- */

function FormPerfil({ user }) {
  const dispatch = useDispatch();
  const { provincias } = useOpcionesComunidad();
  const [form, setForm] = useState({
    displayName: user.displayName,
    username: user.username,
    bio: user.bio || "",
    provinceSlug: user.province?.slug || "",
  });
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [disponible, setDisponible] = useState(null);
  const usernameDebounced = useDebounce(form.username, 450);

  useEffect(() => {
    if (usernameDebounced === user.username || validarUsername(usernameDebounced)) {
      setDisponible(null);
      return undefined;
    }
    let vigente = true;
    userAuthService
      .checkUsername(usernameDebounced)
      .then((r) => vigente && setDisponible(Boolean(r.available)))
      .catch(() => vigente && setDisponible(null));
    return () => {
      vigente = false;
    };
  }, [usernameDebounced, user.username]);

  async function guardar(e) {
    e.preventDefault();
    const errs = {
      displayName: validarDisplayName(form.displayName),
      username: validarUsername(form.username) || (disponible === false ? "Ese nombre de usuario ya está en uso." : null),
      bio: form.bio.length > LIMITES.bio ? `Máximo ${LIMITES.bio} caracteres.` : null,
    };
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrores(errs);
    setEstado(null);
    if (Object.keys(errs).length) return;
    setGuardando(true);
    try {
      await dispatch(
        updateProfile({
          displayName: form.displayName.trim(),
          username: form.username.trim(),
          bio: form.bio.trim(),
          provinceSlug: form.provinceSlug || null,
        }),
      ).unwrap();
      setEstado({ tono: "ok", texto: "Guardamos tus cambios." });
    } catch (err) {
      if (err.code === "USERNAME_TAKEN") setErrores({ username: "Ese nombre de usuario ya está en uso." });
      else if (err.code === "INVALID_REQUEST") setErrores(erroresDeCampos(err));
      else setEstado({ tono: "error", texto: mensajeError(err) });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="grid gap-4 sm:grid-cols-2">
      <Campo id="displayName" label="Tu nombre" required maxLength={LIMITES.displayNameMax} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} error={errores.displayName} />
      <div>
        <Campo id="username" label="Nombre de usuario" required maxLength={LIMITES.usernameMax} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s+/g, "-") })} error={errores.username} />
        {disponible != null && !errores.username ? (
          <p className={`mt-1 text-xs ${disponible ? "text-[#166534]" : "text-[#b42318]"}`} aria-live="polite">
            {disponible ? "✓ Disponible" : "No disponible"}
          </p>
        ) : null}
      </div>
      <Campo id="provinceSlug" as="select" label="Provincia" value={form.provinceSlug} onChange={(e) => setForm({ ...form, provinceSlug: e.target.value })}>
        <option value="">Prefiero no decirlo</option>
        {provincias.map((p) => (
          <option key={p.slug} value={p.slug}>
            {p.name}
          </option>
        ))}
      </Campo>
      <div className="sm:col-span-2">
        <Campo id="bio" as="textarea" rows={3} label="Sobre vos (opcional)" value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} error={errores.bio} aria-describedby="bio-contador" />
        <ContadorCaracteres id="bio-contador" actual={form.bio.length} max={LIMITES.bio} />
      </div>
      {estado ? (
        <div className="sm:col-span-2">
          <Alerta tono={estado.tono}>{estado.texto}</Alerta>
        </div>
      ) : null}
      <div className="sm:col-span-2">
        <Boton type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : "Guardar perfil"}
        </Boton>
      </div>
    </form>
  );
}

/* ---------- Avatar ---------- */

function FormAvatar({ user }) {
  const dispatch = useDispatch();
  const inputRef = useRef(null);
  const [progreso, setProgreso] = useState(null);
  const [error, setError] = useState(null);

  async function elegir(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError(null);
    setProgreso(0);
    try {
      const comprimida = await comprimirImagen(file, { maxLado: 800, calidad: 0.85 });
      await dispatch(uploadAvatar({ file: comprimida, onProgress: setProgreso })).unwrap();
    } catch (err) {
      setError(err.code ? mensajeError(err) : err.message);
    } finally {
      setProgreso(null);
    }
  }

  async function quitar() {
    setError(null);
    try {
      await dispatch(deleteAvatar()).unwrap();
    } catch (err) {
      setError(mensajeError(err));
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-5">
      <Avatar user={user} size="xl" />
      <div className="flex flex-col gap-2">
        <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="avatar-input" onChange={elegir} />
        <div className="flex flex-wrap gap-2">
          <Boton variante="secundario" tamano="sm" onClick={() => inputRef.current?.click()} disabled={progreso != null}>
            {user.avatarUrl ? "Cambiar foto" : "Subir foto"}
          </Boton>
          {user.avatarUrl ? (
            <Boton variante="secundario" tamano="sm" onClick={quitar} disabled={progreso != null}>
              Quitar foto
            </Boton>
          ) : null}
        </div>
        {progreso != null ? (
          <progress value={progreso} max={1} className="w-48" aria-label="Subiendo foto de perfil" />
        ) : null}
        <p className="text-xs">JPG, PNG o WebP. La achicamos antes de subirla.</p>
        {error ? <p className="campo-error" role="alert">{error}</p> : null}
      </div>
    </div>
  );
}

/* ---------- Contraseña ---------- */

function FormPassword({ user }) {
  const dispatch = useDispatch();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "" });
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function guardar(e) {
    e.preventDefault();
    const errs = {
      currentPassword: user.hasPassword && !form.currentPassword ? "Escribí tu contraseña actual." : null,
      newPassword: validarPassword(form.newPassword),
    };
    Object.keys(errs).forEach((k) => !errs[k] && delete errs[k]);
    setErrores(errs);
    setEstado(null);
    if (Object.keys(errs).length) return;
    setGuardando(true);
    try {
      await dispatch(
        changePassword({
          currentPassword: user.hasPassword ? form.currentPassword : undefined,
          newPassword: form.newPassword,
        }),
      ).unwrap();
      setForm({ currentPassword: "", newPassword: "" });
      setEstado({ tono: "ok", texto: "Tu contraseña cambió." });
    } catch (err) {
      if (err.code === "INVALID_CREDENTIALS") setErrores({ currentPassword: "La contraseña actual no es correcta." });
      else setEstado({ tono: "error", texto: mensajeError(err) });
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar} noValidate className="flex max-w-md flex-col gap-4">
      {!user.hasPassword ? (
        <p className="text-sm">Tu cuenta todavía no tiene contraseña. Creá una para poder ingresar con tu email.</p>
      ) : (
        <Campo id="currentPassword" type="password" label="Contraseña actual" required autoComplete="current-password" value={form.currentPassword} onChange={(e) => setForm({ ...form, currentPassword: e.target.value })} error={errores.currentPassword} />
      )}
      <div>
        <Campo id="newPassword" type="password" label="Contraseña nueva" required autoComplete="new-password" value={form.newPassword} onChange={(e) => setForm({ ...form, newPassword: e.target.value })} error={errores.newPassword} hint={`Mínimo ${LIMITES.password} caracteres.`} />
        <IndicadorFuerza password={form.newPassword} id="nueva-fuerza" />
      </div>
      {estado ? <Alerta tono={estado.tono}>{estado.texto}</Alerta> : null}
      <div>
        <Boton type="submit" disabled={guardando}>
          {guardando ? "Guardando…" : user.hasPassword ? "Cambiar contraseña" : "Crear contraseña"}
        </Boton>
      </div>
    </form>
  );
}

/* ---------- Mis publicaciones ---------- */

function MisPublicaciones() {
  const dispatch = useDispatch();
  const lista = useSelector((s) => s.community.listas[MIS_PUBLICACIONES]);
  const posts = usePostsDeLista(MIS_PUBLICACIONES);
  const [borrar, setBorrar] = useState(null);
  const [error, setError] = useState(null);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    dispatch(fetchMyPosts());
  }, [dispatch]);

  async function confirmarBorrado() {
    setBorrando(true);
    setError(null);
    try {
      await dispatch(deletePost(borrar.id)).unwrap();
      setBorrar(null);
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setBorrando(false);
    }
  }

  if (!lista || lista.status === "loading") return <p className="text-sm" role="status">Cargando tus publicaciones…</p>;
  if (lista.status === "failed") return <Alerta>{lista.error}</Alerta>;
  if (!posts.length) {
    return (
      <div className="flex flex-col items-start gap-3">
        <p>Todavía no publicaste nada.</p>
        <Boton to="/comunidad/publicar">Contar mi primera fiesta</Boton>
      </div>
    );
  }

  return (
    <>
      <ul className="flex flex-col divide-y divide-azul-logo/10">
        {posts.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start">
            <div className="foto-libro h-16 w-24 shrink-0">{p.cover ? <img src={p.cover.url} alt="" /> : null}</div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <EstadoPublicacion status={p.status} />
                <span className="text-xs">{p.publishedAt ? `Publicada ${formatHace(p.publishedAt)}` : "Sin publicar"}</span>
              </div>
              <p className="mt-1 font-display text-lg leading-snug text-azul-petroleo">
                {p.status === "PUBLISHED" || p.status === "PENDING" || p.status === "REJECTED" ? (
                  <Link to={`/comunidad/p/${p.slug}`} className="hover:text-celeste-cielo">
                    {p.title}
                  </Link>
                ) : (
                  p.title
                )}
              </p>
              {p.status === "PENDING" ? <p className="text-sm">Está en revisión. Te avisamos por email cuando se publique.</p> : null}
              {p.status === "REJECTED" ? (
                <p className="text-sm">No fue aprobada. Entrá para ver el motivo, editala y se vuelve a revisar.</p>
              ) : null}
            </div>
            <div className="flex shrink-0 gap-2">
              <Boton variante="secundario" tamano="sm" to={`/comunidad/p/${p.slug}/editar`}>
                Editar
              </Boton>
              <Boton variante="secundario" tamano="sm" onClick={() => setBorrar(p)}>
                Borrar
              </Boton>
            </div>
          </li>
        ))}
      </ul>
      <BotonVerMas hayMas={Boolean(lista.nextCursor)} cargando={lista.loadingMore} onClick={() => dispatch(fetchMyPosts({ append: true }))} />
      <Dialogo open={Boolean(borrar)} onClose={() => setBorrar(null)} titulo="Borrar publicación">
        <p>¿Borrar “{borrar?.title}”? Se borran también sus fotos, me gusta y comentarios. No se puede deshacer.</p>
        {error ? <p className="campo-error" role="alert">{error}</p> : null}
        <div className="mt-5 flex flex-wrap gap-2">
          <Boton onClick={confirmarBorrado} disabled={borrando} className="!bg-[#b42318] hover:!bg-[#8f1c13]">
            {borrando ? "Borrando…" : "Sí, borrar"}
          </Boton>
          <Boton variante="secundario" onClick={() => setBorrar(null)} data-autofocus>
            Cancelar
          </Boton>
        </div>
      </Dialogo>
    </>
  );
}

/* ---------- Datos y baja ---------- */

function MisDatos() {
  const [estado, setEstado] = useState(null);
  async function exportar() {
    setEstado("loading");
    try {
      const data = await meService.exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mis-datos-comunidad-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setEstado("ok");
    } catch (err) {
      setEstado(mensajeError(err));
    }
  }
  return (
    <div className="flex flex-col items-start gap-2">
      <p className="text-sm">
        Descargá un archivo con tu perfil, publicaciones, comentarios y me gusta (derecho de acceso, Ley 25.326).
      </p>
      <Boton variante="secundario" tamano="sm" onClick={exportar} disabled={estado === "loading"}>
        {estado === "loading" ? "Preparando…" : "Descargar mis datos"}
      </Boton>
      {estado === "ok" ? <p className="text-sm" role="status">Listo, se descargó el archivo.</p> : null}
      {estado && !["ok", "loading"].includes(estado) ? <p className="campo-error">{estado}</p> : null}
    </div>
  );
}

function EliminarCuenta({ user }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [abierto, setAbierto] = useState(false);
  const [confirmacion, setConfirmacion] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [borrando, setBorrando] = useState(false);

  async function borrar(e) {
    e.preventDefault();
    if (confirmacion !== "ELIMINAR") {
      setError('Escribí ELIMINAR en mayúsculas para confirmar.');
      return;
    }
    setBorrando(true);
    setError(null);
    try {
      await dispatch(deleteAccount({ confirm: "ELIMINAR", password: user.hasPassword ? password : undefined })).unwrap();
      navigate("/comunidad", { replace: true, state: { cuentaEliminada: true } });
    } catch (err) {
      setBorrando(false);
      setError(err.code === "INVALID_CREDENTIALS" ? "La contraseña no es correcta." : mensajeError(err));
    }
  }

  return (
    <div>
      <p className="text-sm">
        Se borran tu perfil, tus publicaciones y tus fotos. Tus comentarios quedan como “Comentario eliminado” para no romper las conversaciones.
      </p>
      <Boton variante="secundario" tamano="sm" className="mt-3 !border-[#b42318] !text-[#b42318] hover:!bg-[#b42318] hover:!text-blanco" onClick={() => setAbierto(true)}>
        Eliminar mi cuenta
      </Boton>
      <Dialogo open={abierto} onClose={() => setAbierto(false)} titulo="Eliminar tu cuenta">
        <form onSubmit={borrar} noValidate className="flex flex-col gap-4">
          <p>Esta acción no se puede deshacer.</p>
          <Campo id="confirmacion" label='Escribí "ELIMINAR" para confirmar' value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} autoComplete="off" data-autofocus />
          {user.hasPassword ? (
            <Campo id="password-baja" type="password" label="Tu contraseña" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
          ) : null}
          {error ? <p className="campo-error" role="alert">{error}</p> : null}
          <div className="flex flex-wrap gap-2">
            <Boton type="submit" disabled={borrando || confirmacion !== "ELIMINAR"} className="!bg-[#b42318] hover:!bg-[#8f1c13] disabled:opacity-50">
              {borrando ? "Eliminando…" : "Eliminar definitivamente"}
            </Boton>
            <Boton variante="secundario" onClick={() => setAbierto(false)}>
              Cancelar
            </Boton>
          </div>
        </form>
      </Dialogo>
    </div>
  );
}

/* ---------- Página ---------- */

export function PaginaMiCuenta() {
  useMetaPagina({ title: "Mi cuenta" });
  const user = useSelector((s) => s.userAuth.user);

  if (!user) return null;

  const indice = [
    ["perfil", "Perfil"],
    ["mis-publicaciones", "Mis publicaciones"],
    ["seguridad", "Contraseña"],
    ["datos", "Mis datos"],
  ];

  return (
    <section>
      <EncabezadoTienda titulo="Mi cuenta" kicker="Comunidad">
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <Avatar user={user} size="sm" />
          <span>
            {user.email}
          </span>
          <Link to={`/comunidad/u/${user.username}`} className="text-celeste-cielo underline">
            Ver mi perfil público
          </Link>
        </div>
      </EncabezadoTienda>
      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[12rem_1fr]">
        <nav aria-label="Secciones de mi cuenta" className="lg:sticky lg:top-28 lg:self-start">
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {indice.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="filtro-chip inline-flex text-sm">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex min-w-0 flex-col gap-6">
          <Seccion id="perfil" titulo="Perfil">
            <div className="flex flex-col gap-6">
              <FormAvatar user={user} />
              <FormPerfil user={user} />
            </div>
          </Seccion>
          <Seccion id="mis-publicaciones" titulo="Mis publicaciones" descripcion="Incluye las que están en revisión o no fueron aprobadas.">
            <MisPublicaciones />
          </Seccion>
          <Seccion id="seguridad" titulo="Contraseña">
            <FormPassword user={user} />
          </Seccion>
          <Seccion id="datos" titulo="Mis datos">
            <div className="flex flex-col gap-6">
              <MisDatos />
              <div className="border-t border-azul-logo/15 pt-5">
                <h3 className="font-medium text-[#b42318]">Eliminar cuenta</h3>
                <EliminarCuenta user={user} />
              </div>
            </div>
          </Seccion>
        </div>
      </div>
    </section>
  );
}
