import { useEffect, useId, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { toggleLike } from "../../redux/slices/communitySlice";
import { Boton } from "../ui/Boton";
import { ESTADOS_PUBLICACION, formatHace, mensajeError, plural } from "../../utils/comunidad";

/* ---------- Avatar con iniciales de respaldo ---------- */

const TAMANOS_AVATAR = { sm: "h-8 w-8 text-xs", md: "h-10 w-10 text-sm", lg: "h-20 w-20 text-2xl", xl: "h-28 w-28 text-3xl" };

export function Avatar({ user, size = "md", className = "" }) {
  const nombre = user?.displayName || user?.username || "?";
  const iniciales = nombre
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
  const cls = `inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-azul-logo/15 font-display text-azul-petroleo ${TAMANOS_AVATAR[size]} ${className}`;
  if (user?.avatarUrl) {
    return (
      <span className={cls}>
        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return (
    <span className={cls} aria-hidden>
      {iniciales}
    </span>
  );
}

export function EstadoPublicacion({ status }) {
  const e = ESTADOS_PUBLICACION[status] || { label: status, tono: "info" };
  return <span className={`estado-pedido is-${e.tono}`}>{e.label}</span>;
}

/* ---------- Texto plano: párrafos separados por línea en blanco, sin HTML ---------- */

export function TextoPlano({ texto, className = "" }) {
  const parrafos = String(texto || "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {parrafos.map((p, i) => (
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}

/* ---------- Diálogo accesible (foco atrapado, Escape, devuelve el foco) ---------- */

export function Dialogo({ open, onClose, titulo, children, ancho = "max-w-md" }) {
  const panelRef = useRef(null);
  const tituloId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return undefined;
    const previo = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusables = () =>
      [...panel.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex='-1'])")];
    window.setTimeout(() => (panel.querySelector("[data-autofocus]") || focusables()[0] || panel).focus(), 0);

    function onKey(e) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
      }
      if (e.key === "Tab") {
        const list = focusables();
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previo?.focus?.();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-azul-petroleo/50" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        tabIndex={-1}
        className={`relative max-h-[92svh] w-full overflow-y-auto bg-blanco p-5 shadow-xl focus:outline-none sm:p-6 ${ancho}`}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 id={tituloId} className="font-display text-xl text-azul-petroleo">
            {titulo}
          </h2>
          <button type="button" onClick={onClose} className="px-1 text-xl leading-none text-azul-petroleo" aria-label="Cerrar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/** Invita a ingresar y después vuelve al mismo lugar (state.from). */
export function ModalIngresar({ open, onClose, motivo = "Para participar en la comunidad" }) {
  const location = useLocation();
  const from = { pathname: location.pathname, search: location.search, hash: location.hash };
  return (
    <Dialogo open={open} onClose={onClose} titulo="Sumate a la comunidad">
      <p>{motivo}, ingresá con tu cuenta o creá una nueva. Es gratis.</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Link
          to="/comunidad/ingresar"
          state={{ from }}
          data-autofocus
          className="boton-sitio inline-flex items-center justify-center bg-azul-petroleo px-6 py-3 text-sm font-medium text-blanco hover:bg-celeste-cielo"
        >
          Ingresar
        </Link>
        <Link
          to="/comunidad/registro"
          state={{ from }}
          className="boton-sitio inline-flex items-center justify-center border border-azul-petroleo px-6 py-3 text-sm font-medium text-azul-petroleo hover:bg-azul-petroleo hover:text-blanco"
        >
          Crear cuenta
        </Link>
      </div>
    </Dialogo>
  );
}

/* ---------- Me gusta (optimista) ---------- */

export function BotonMeGusta({ post, compacto = false }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.userAuth.user);
  const [pedirSesion, setPedirSesion] = useState(false);
  const [aviso, setAviso] = useState(null);
  const avisoId = useId();

  useEffect(() => {
    if (!aviso) return undefined;
    const t = window.setTimeout(() => setAviso(null), 5000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  if (post.status && post.status !== "PUBLISHED") return null;

  async function click() {
    if (!user) {
      setPedirSesion(true);
      return;
    }
    try {
      await dispatch(toggleLike({ id: post.id, liked: post.likedByMe })).unwrap();
    } catch (err) {
      setAviso(mensajeError(err));
    }
  }

  const etiqueta = plural(post.likeCount, "me gusta", "me gusta");
  return (
    <span className="relative inline-flex flex-col">
      <button
        type="button"
        onClick={click}
        aria-pressed={Boolean(post.likedByMe)}
        aria-label={`${post.likedByMe ? "Quitar me gusta" : "Me gusta"} (${etiqueta})`}
        aria-describedby={aviso ? avisoId : undefined}
        className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-sm transition-colors ${
          post.likedByMe
            ? "border-naranja-libro bg-naranja-libro/10 text-naranja-libro"
            : "border-azul-logo/30 text-azul-petroleo hover:border-naranja-libro hover:text-naranja-libro"
        } ${compacto ? "px-2 py-1" : ""}`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden fill={post.likedByMe ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
          <path d="M12 21s-7.5-4.6-9.5-9.3C1.2 8.4 3.3 5 6.8 5c2 0 3.6 1.1 4.4 2.6h1.6C13.6 6.1 15.2 5 17.2 5c3.5 0 5.6 3.4 4.3 6.7C19.5 16.4 12 21 12 21z" strokeLinejoin="round" />
        </svg>
        <span aria-hidden>{post.likeCount}</span>
      </button>
      {aviso ? (
        <span id={avisoId} role="status" className="absolute top-full left-0 z-10 mt-1 w-64 border border-[#b42318]/30 bg-[#fef3f2] p-2 text-xs text-[#b42318]">
          {aviso}
        </span>
      ) : null}
      <ModalIngresar open={pedirSesion} onClose={() => setPedirSesion(false)} motivo="Para dar me gusta" />
    </span>
  );
}

/* ---------- Tarjeta del feed ---------- */

export function ChipFiltro({ to, children }) {
  return (
    <Link to={to} className="filtro-chip inline-flex text-xs">
      {children}
    </Link>
  );
}

export function TarjetaPublicacion({ post, mostrarEstado = false }) {
  const url = `/comunidad/p/${post.slug}`;
  return (
    <article className="card-hover flex h-full flex-col border border-azul-logo/15 bg-blanco">
      {post.cover ? (
        <Link to={url} tabIndex={-1} aria-hidden className="foto-libro block aspect-[4/3]">
          <img src={post.cover.url} alt="" loading="lazy" />
        </Link>
      ) : null}
      <div className="flex flex-1 flex-col gap-2 p-4">
        {mostrarEstado && post.status !== "PUBLISHED" ? (
          <div>
            <EstadoPublicacion status={post.status} />
          </div>
        ) : null}
        <h3 className="font-display text-lg leading-snug text-azul-petroleo">
          <Link to={url} className="hover:text-celeste-cielo">
            {post.title}
          </Link>
        </h3>
        <p className="text-sm leading-snug">{post.excerpt}</p>
        {post.celebration || post.province ? (
          <div className="flex flex-wrap gap-1.5">
            {post.celebration ? (
              <ChipFiltro to={`/comunidad?fiesta=${post.celebration.slug}`}>{post.celebration.name}</ChipFiltro>
            ) : null}
            {post.province ? (
              <ChipFiltro to={`/comunidad?provincia=${post.province.slug}`}>{post.province.name}</ChipFiltro>
            ) : null}
          </div>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-2 border-t border-azul-logo/10 pt-3">
          {post.author ? (
            <Link to={`/comunidad/u/${post.author.username}`} className="flex min-w-0 items-center gap-2 text-sm hover:text-celeste-cielo">
              <Avatar user={post.author} size="sm" />
              <span className="truncate">{post.author.displayName}</span>
            </Link>
          ) : (
            <span className="text-sm">Cuenta eliminada</span>
          )}
          <div className="flex shrink-0 items-center gap-2">
            <BotonMeGusta post={post} compacto />
            <Link
              to={`${url}#comentarios`}
              className="inline-flex items-center gap-1 text-sm text-azul-petroleo hover:text-celeste-cielo"
              aria-label={plural(post.commentCount, "comentario", "comentarios")}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M4 5h16v11H8l-4 4z" strokeLinejoin="round" />
              </svg>
              <span aria-hidden>{post.commentCount}</span>
            </Link>
          </div>
        </div>
        {post.publishedAt ? <p className="text-xs">Publicado {formatHace(post.publishedAt)}</p> : null}
      </div>
    </article>
  );
}

export function SkeletonPublicacion() {
  return (
    <div className="border border-azul-logo/10 bg-blanco" aria-hidden>
      <div className="tienda-skeleton aspect-[4/3]" />
      <div className="flex flex-col gap-2 p-4">
        <div className="tienda-skeleton h-5 w-4/5" />
        <div className="tienda-skeleton h-4 w-full" />
        <div className="tienda-skeleton h-4 w-2/3" />
        <div className="tienda-skeleton mt-3 h-8 w-1/2" />
      </div>
    </div>
  );
}

export function ContadorCaracteres({ id, actual, max, min }) {
  const cerca = actual > max * 0.9;
  const pasado = actual > max;
  return (
    <p id={id} className={`mt-1 text-right text-xs ${pasado ? "text-[#b42318]" : cerca ? "text-naranja-libro" : ""}`} aria-live="polite">
      {actual.toLocaleString("es-AR")} / {max.toLocaleString("es-AR")}
      {min && actual < min ? ` · mínimo ${min}` : ""}
    </p>
  );
}

/** "Ver más" con cursor. */
export function BotonVerMas({ onClick, cargando, hayMas, error }) {
  if (!hayMas && !error) return null;
  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      {error ? (
        <p className="campo-error" role="alert">
          {error}
        </p>
      ) : null}
      <Boton variante="secundario" onClick={onClick} disabled={cargando} className="disabled:opacity-60">
        {cargando ? "Cargando…" : error ? "Reintentar" : "Ver más"}
      </Boton>
    </div>
  );
}
