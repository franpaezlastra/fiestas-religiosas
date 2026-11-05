import { useEffect, useId, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import {
  createComment,
  deleteComment,
  editComment,
  fetchComments,
  fetchReplies,
  reportContent,
} from "../../redux/slices/communitySlice";
import { Boton } from "../ui/Boton";
import { Avatar, BotonVerMas, ContadorCaracteres, Dialogo, ModalIngresar } from "./ComunidadUI";
import {
  LIMITES,
  MOTIVOS_DENUNCIA,
  formatHace,
  mensajeError,
  plural,
  puedeEditarComentario,
} from "../../utils/comunidad";

/* ---------- Denunciar ---------- */

const TITULOS_DENUNCIA = { POST: "Denunciar publicación", COMMENT: "Denunciar comentario", USER: "Denunciar usuario" };

export function BotonDenunciar({ targetType, targetId, className = "" }) {
  const user = useSelector((s) => s.userAuth.user);
  const [abierto, setAbierto] = useState(false);
  const [pedirSesion, setPedirSesion] = useState(false);
  return (
    <>
      <button
        type="button"
        className={`text-xs text-azul-petroleo underline hover:text-[#b42318] ${className}`}
        onClick={() => (user ? setAbierto(true) : setPedirSesion(true))}
      >
        Denunciar
      </button>
      <ModalDenuncia open={abierto} onClose={() => setAbierto(false)} targetType={targetType} targetId={targetId} />
      <ModalIngresar open={pedirSesion} onClose={() => setPedirSesion(false)} motivo="Para denunciar contenido" />
    </>
  );
}

export function ModalDenuncia({ open, onClose, targetType, targetId }) {
  const dispatch = useDispatch();
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);
  const errorId = useId();

  useEffect(() => {
    if (open) {
      setReason("");
      setDetails("");
      setError(null);
      setListo(false);
    }
  }, [open]);

  async function enviar(e) {
    e.preventDefault();
    if (!reason) return setError("Elegí un motivo.");
    if (reason === "OTHER" && !details.trim()) return setError("Contanos brevemente el motivo.");
    setEnviando(true);
    setError(null);
    try {
      await dispatch(reportContent({ targetType, targetId, reason, details: details.trim() || undefined })).unwrap();
      setListo(true);
    } catch (err) {
      if (err.code === "ALREADY_REPORTED") setListo("ya");
      else setError(mensajeError(err));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialogo open={open} onClose={onClose} titulo={TITULOS_DENUNCIA[targetType]}>
      {listo ? (
        <div className="flex flex-col gap-4">
          <p role="status">
            {listo === "ya"
              ? "Ya habías denunciado este contenido. Lo estamos revisando."
              : "Gracias por avisarnos. Vamos a revisarlo según las normas de la comunidad."}
          </p>
          <Boton onClick={onClose} data-autofocus>
            Cerrar
          </Boton>
        </div>
      ) : (
        <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
          <fieldset aria-describedby={error ? errorId : undefined}>
            <legend className="text-sm font-medium text-azul-petroleo">¿Qué pasa con este contenido?</legend>
            <div className="mt-2 flex flex-col gap-1.5">
              {Object.entries(MOTIVOS_DENUNCIA).map(([value, label]) => (
                <label key={value} className="opcion-radio !py-2 text-sm">
                  <input type="radio" name="motivo" value={value} checked={reason === value} onChange={() => setReason(value)} className="mt-0.5 accent-[#0098d4]" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="denuncia-detalle" className="text-sm font-medium text-azul-petroleo">
              Detalle {reason === "OTHER" ? "*" : "(opcional)"}
            </label>
            <textarea
              id="denuncia-detalle"
              className="campo-input"
              rows={3}
              maxLength={LIMITES.reportDetails}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              aria-describedby="denuncia-contador"
            />
            <ContadorCaracteres id="denuncia-contador" actual={details.length} max={LIMITES.reportDetails} />
          </div>
          {error ? (
            <p id={errorId} className="campo-error" role="alert">
              {error}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <Boton type="submit" disabled={enviando}>
              {enviando ? "Enviando…" : "Enviar denuncia"}
            </Boton>
            <Boton variante="secundario" onClick={onClose}>
              Cancelar
            </Boton>
          </div>
        </form>
      )}
    </Dialogo>
  );
}

/* ---------- Lightbox de imágenes ---------- */

export function LightboxComunidad({ imagenes, indice, onClose, titulo }) {
  const [i, setI] = useState(indice ?? 0);
  const open = indice != null;

  useEffect(() => {
    if (indice != null) setI(indice);
  }, [indice]);

  useEffect(() => {
    if (!open) return undefined;
    function onKey(e) {
      if (e.key === "ArrowRight") setI((n) => (n + 1) % imagenes.length);
      if (e.key === "ArrowLeft") setI((n) => (n - 1 + imagenes.length) % imagenes.length);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, imagenes.length]);

  if (!open || !imagenes.length) return null;
  const img = imagenes[i];
  return (
    <Dialogo open={open} onClose={onClose} titulo={`${titulo} · ${i + 1} de ${imagenes.length}`} ancho="max-w-5xl">
      <figure>
        <div className="flex items-center justify-center bg-azul-petroleo/5">
          <img src={img.url} alt={img.alt || ""} className="max-h-[70svh] w-auto object-contain" />
        </div>
        {img.alt ? <figcaption className="mt-2 text-sm">{img.alt}</figcaption> : null}
      </figure>
      {imagenes.length > 1 ? (
        <div className="mt-4 flex items-center justify-between gap-3">
          <Boton variante="secundario" tamano="sm" onClick={() => setI((n) => (n - 1 + imagenes.length) % imagenes.length)}>
            ← Anterior
          </Boton>
          <p className="text-xs" aria-live="polite">
            Imagen {i + 1} de {imagenes.length}. También podés usar las flechas del teclado.
          </p>
          <Boton variante="secundario" tamano="sm" onClick={() => setI((n) => (n + 1) % imagenes.length)} data-autofocus>
            Siguiente →
          </Boton>
        </div>
      ) : null}
    </Dialogo>
  );
}

/* ---------- Comentarios ---------- */

function FormComentario({ postId, parentId, inicial = "", onListo, onCancelar, editarId, etiqueta = "Escribí un comentario", autoFocus }) {
  const dispatch = useDispatch();
  const [texto, setTexto] = useState(inicial);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const id = useId();
  const ref = useRef(null);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  async function enviar(e) {
    e.preventDefault();
    const body = texto.trim();
    if (!body) return setError("Escribí algo antes de enviar.");
    if (body.length > LIMITES.comment) return setError(`Máximo ${LIMITES.comment} caracteres.`);
    setEnviando(true);
    setError(null);
    try {
      if (editarId) await dispatch(editComment({ id: editarId, body })).unwrap();
      else await dispatch(createComment({ postId, body, parentId })).unwrap();
      setTexto("");
      onListo?.();
    } catch (err) {
      setError(
        err.code === "RATE_LIMITED"
          ? `Esperá un momento antes de volver a comentar. ${mensajeError(err)}`
          : err.details?.reason === "EDIT_WINDOW_EXPIRED"
            ? "Pasaron más de 15 minutos: este comentario ya no se puede editar."
            : mensajeError(err),
      );
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-azul-petroleo">
        {etiqueta}
      </label>
      <textarea
        ref={ref}
        id={id}
        rows={parentId || editarId ? 2 : 3}
        className="campo-input"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={`${id}-contador${error ? ` ${id}-error` : ""}`}
      />
      <ContadorCaracteres id={`${id}-contador`} actual={texto.length} max={LIMITES.comment} />
      {error ? (
        <p id={`${id}-error`} className="campo-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="mt-1 flex flex-wrap gap-2">
        <Boton type="submit" tamano="sm" disabled={enviando}>
          {enviando ? "Enviando…" : editarId ? "Guardar" : parentId ? "Responder" : "Comentar"}
        </Boton>
        {onCancelar ? (
          <Boton tamano="sm" variante="secundario" onClick={onCancelar}>
            Cancelar
          </Boton>
        ) : null}
      </div>
    </form>
  );
}

function Comentario({ comment, post, esRespuesta }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.userAuth.user);
  const [respondiendo, setRespondiendo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [confirmarBorrar, setConfirmarBorrar] = useState(false);
  const [pedirSesion, setPedirSesion] = useState(false);
  const [error, setError] = useState(null);
  const [cargandoRespuestas, setCargandoRespuestas] = useState(false);

  const puedeBorrar = !comment.deleted && (comment.isMine || post.isMine);
  const faltan = (comment.replyCount || 0) - (comment.replies?.length || 0);

  async function borrar() {
    setError(null);
    try {
      await dispatch(deleteComment({ id: comment.id, postId: post.id })).unwrap();
    } catch (err) {
      setError(mensajeError(err));
      setConfirmarBorrar(false);
    }
  }

  async function verRespuestas() {
    setCargandoRespuestas(true);
    try {
      await dispatch(fetchReplies({ postId: post.id, commentId: comment.id })).unwrap();
    } catch (err) {
      setError(mensajeError(err));
    } finally {
      setCargandoRespuestas(false);
    }
  }

  return (
    <li id={`comentario-${comment.id}`} className={`scroll-mt-28 ${esRespuesta ? "border-l-2 border-celeste-cielo/30 pl-4" : ""}`}>
      {comment.deleted ? (
        <p className="py-2 text-sm italic">Comentario eliminado</p>
      ) : (
        <div className="flex gap-3 py-2">
          {comment.author ? (
            <Link to={`/comunidad/u/${comment.author.username}`} aria-hidden tabIndex={-1}>
              <Avatar user={comment.author} size="sm" />
            </Link>
          ) : (
            <Avatar user={null} size="sm" />
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm">
              {comment.author ? (
                <Link to={`/comunidad/u/${comment.author.username}`} className="font-medium text-azul-petroleo hover:text-celeste-cielo">
                  {comment.author.displayName}
                </Link>
              ) : (
                <span className="font-medium">Cuenta eliminada</span>
              )}{" "}
              <span className="text-xs">
                · {formatHace(comment.createdAt)}
                {comment.editedAt ? " · editado" : ""}
              </span>
            </p>
            {editando ? (
              <div className="mt-2">
                <FormComentario
                  editarId={comment.id}
                  inicial={comment.body}
                  etiqueta="Editar comentario"
                  autoFocus
                  onListo={() => setEditando(false)}
                  onCancelar={() => setEditando(false)}
                />
              </div>
            ) : (
              <p className="mt-1 whitespace-pre-line break-words">{comment.body}</p>
            )}
            {!editando ? (
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {!esRespuesta && post.status === "PUBLISHED" ? (
                  <button
                    type="button"
                    className="font-medium text-celeste-cielo hover:text-azul-petroleo"
                    onClick={() => (user ? setRespondiendo((v) => !v) : setPedirSesion(true))}
                    aria-expanded={respondiendo}
                  >
                    Responder
                  </button>
                ) : null}
                {puedeEditarComentario(comment) ? (
                  <button type="button" className="text-azul-petroleo underline" onClick={() => setEditando(true)}>
                    Editar
                  </button>
                ) : null}
                {puedeBorrar ? (
                  confirmarBorrar ? (
                    <span className="flex items-center gap-2" role="group" aria-label="Confirmar borrado">
                      ¿Borrar?
                      <button type="button" className="font-medium text-[#b42318] underline" onClick={borrar}>
                        Sí
                      </button>
                      <button type="button" className="underline" onClick={() => setConfirmarBorrar(false)}>
                        No
                      </button>
                    </span>
                  ) : (
                    <button type="button" className="text-azul-petroleo underline" onClick={() => setConfirmarBorrar(true)}>
                      Borrar
                    </button>
                  )
                ) : null}
                {!comment.isMine ? <BotonDenunciar targetType="COMMENT" targetId={comment.id} /> : null}
              </div>
            ) : null}
            {error ? <p className="campo-error" role="alert">{error}</p> : null}
          </div>
        </div>
      )}

      {!esRespuesta && (comment.replies?.length || respondiendo || faltan > 0) ? (
        <ul className="ml-4 flex flex-col sm:ml-11">
          {comment.replies?.map((r) => (
            <Comentario key={r.id} comment={r} post={post} esRespuesta />
          ))}
          {faltan > 0 ? (
            <li className="pl-4">
              <button type="button" className="py-1 text-xs font-medium text-celeste-cielo" onClick={verRespuestas} disabled={cargandoRespuestas}>
                {cargandoRespuestas ? "Cargando…" : `Ver ${plural(faltan, "respuesta más", "respuestas más")}`}
              </button>
            </li>
          ) : null}
          {respondiendo ? (
            <li className="border-l-2 border-celeste-cielo/30 py-2 pl-4">
              <FormComentario
                postId={post.id}
                parentId={comment.id}
                etiqueta={`Responder a ${comment.author?.displayName || "este comentario"}`}
                autoFocus
                onListo={() => setRespondiendo(false)}
                onCancelar={() => setRespondiendo(false)}
              />
            </li>
          ) : null}
        </ul>
      ) : null}
      <ModalIngresar open={pedirSesion} onClose={() => setPedirSesion(false)} motivo="Para responder" />
    </li>
  );
}

export function Comentarios({ post }) {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.userAuth.user);
  const estado = useSelector((s) => s.community.comentarios[post.id]);
  const [pedirSesion, setPedirSesion] = useState(false);

  useEffect(() => {
    if (post.status === "PUBLISHED") dispatch(fetchComments({ postId: post.id }));
  }, [dispatch, post.id, post.status]);

  /* Si se llega con #comentario-<id> o #comentarios, se hace scroll cuando cargan */
  useEffect(() => {
    if (estado?.status !== "succeeded" || !window.location.hash) return;
    const el = document.getElementById(window.location.hash.slice(1));
    el?.scrollIntoView({ block: "start" });
  }, [estado?.status]);

  if (post.status !== "PUBLISHED") return null;

  return (
    <section id="comentarios" aria-labelledby="comentarios-titulo" className="scroll-mt-28">
      <h2 id="comentarios-titulo" className="subtitulo-seccion">
        {plural(post.commentCount, "comentario", "comentarios")}
      </h2>

      <div className="mt-4">
        {user ? (
          <FormComentario postId={post.id} />
        ) : (
          <div className="flex flex-wrap items-center gap-3 border border-azul-logo/15 bg-papel p-4">
            <p className="text-sm">¿Estuviste en esta fiesta? Sumá tu comentario.</p>
            <Boton tamano="sm" onClick={() => setPedirSesion(true)}>
              Comentar
            </Boton>
          </div>
        )}
      </div>

      {!estado || estado.status === "loading" ? (
        <p className="mt-6 text-sm" role="status">
          Cargando comentarios…
        </p>
      ) : estado.status === "failed" ? (
        <div className="mt-6 flex items-center gap-3">
          <p className="campo-error" role="alert">
            {estado.error}
          </p>
          <Boton tamano="sm" variante="secundario" onClick={() => dispatch(fetchComments({ postId: post.id }))}>
            Reintentar
          </Boton>
        </div>
      ) : estado.items.length === 0 ? (
        <p className="mt-6 text-sm">Todavía no hay comentarios. ¡Sé el primero!</p>
      ) : (
        <ul className="mt-6 flex flex-col divide-y divide-azul-logo/10">
          {estado.items.map((c) => (
            <Comentario key={c.id} comment={c} post={post} />
          ))}
        </ul>
      )}
      {estado?.status === "succeeded" ? (
        <BotonVerMas
          hayMas={Boolean(estado.nextCursor)}
          cargando={estado.loadingMore}
          error={estado.error}
          onClick={() => dispatch(fetchComments({ postId: post.id, append: true }))}
        />
      ) : null}
      <ModalIngresar open={pedirSesion} onClose={() => setPedirSesion(false)} motivo="Para comentar" />
    </section>
  );
}
