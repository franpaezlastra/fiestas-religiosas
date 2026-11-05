import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  adminDeleteComment,
  adminRestoreComment,
  approvePost,
  fetchAdminPostDetail,
  fetchAdminUserDetail,
  fetchBlockedWords,
  fetchCommunityUsers,
  fetchModerationPosts,
  fetchReports,
  reactivateCommunityUser,
  rejectPost,
  removePost,
  resolveReport,
  restorePost,
  saveBlockedWords,
  setUserTrusted,
  suspendCommunityUser,
} from "../../../redux/slices/communityAdminSlice";
import { useAdminPagination } from "../../hooks/useAdminPagination";
import { AdminButton } from "../AdminButton";
import { useAdminConfirm } from "../AdminConfirm";
import { useAdminToast } from "../AdminToast";
import { AdminModal } from "../AdminModal";
import {
  AdminAlert,
  AdminBadge,
  AdminField,
  AdminInput,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  AdminTable,
  AdminTextarea,
  AdminToolbar,
} from "../AdminForm";
import { MOTIVOS_DENUNCIA, formatFechaLarga, formatHace } from "../../../utils/comunidad";

const TIPO_DENUNCIA = { POST: "Publicación", COMMENT: "Comentario", USER: "Usuario" };
const ACCIONES_LOG = {
  CREATED: "Creada",
  EDITED: "Editada por el autor",
  APPROVE_POST: "Aprobada",
  REJECT_POST: "Rechazada",
  REMOVE_POST: "Dada de baja",
  RESTORE_POST: "Restaurada",
};

/** Abre la publicación en el sitio público en otra pestaña. */
function LinkSitio({ to, children }) {
  return (
    <a href={to} target="_blank" rel="noopener noreferrer" className="text-[var(--admin-accent)] underline">
      {children}
    </a>
  );
}

/* ---------- Nota obligatoria (rechazar / dar de baja / suspender) ---------- */

function ModalNota({ open, title, label, confirmLabel, onClose, onConfirm, children, layer }) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open) {
      setNote("");
      setError(null);
    }
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    if (!note.trim()) return setError("Escribí el motivo.");
    setSaving(true);
    try {
      await onConfirm(note.trim());
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminModal
      open={open}
      title={title}
      onClose={onClose}
      size="md"
      layer={layer}
      footer={
        <>
          <AdminButton variante="secondary" onClick={onClose}>
            Cancelar
          </AdminButton>
          <AdminButton variante="danger-solid" type="submit" form="modal-nota-form" disabled={saving}>
            {saving ? "Guardando…" : confirmLabel}
          </AdminButton>
        </>
      }
    >
      <form id="modal-nota-form" onSubmit={submit} className="flex flex-col gap-3">
        {children}
        <AdminField label={label} required>
          <AdminTextarea rows={4} value={note} onChange={(e) => setNote(e.target.value)} />
        </AdminField>
        {error ? <AdminAlert type="error">{error}</AdminAlert> : null}
      </form>
    </AdminModal>
  );
}

/* ---------- Cola de moderación ---------- */

const filterPosts = (list, q) =>
  !q ? list : list.filter((p) => p.title.toLowerCase().includes(q) || p.author?.username?.includes(q));

export function ModerationQueueTab() {
  const dispatch = useDispatch();
  const toast = useAdminToast();
  const { items, status, error } = useSelector((s) => s.communityAdmin.cola);
  const [estado, setEstado] = useState("PENDING");
  const [detalle, setDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [nota, setNota] = useState(null); // "reject" | "remove"
  const pagination = useAdminPagination(items, { filterFn: filterPosts });
  /* Descarta respuestas de un detalle que ya se cerró o se moderó */
  const pedido = useRef(0);

  const cargar = useCallback(() => dispatch(fetchModerationPosts({ status: estado })), [dispatch, estado]);
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function abrir(post) {
    const actual = ++pedido.current;
    setCargandoDetalle(true);
    setDetalle({ ...post, images: [] });
    try {
      const data = await dispatch(fetchAdminPostDetail(post.id)).unwrap();
      if (pedido.current === actual) setDetalle(data);
    } catch (err) {
      if (pedido.current !== actual) return;
      toast.push({ type: "error", message: err.message });
      setDetalle(null);
    } finally {
      if (pedido.current === actual) setCargandoDetalle(false);
    }
  }

  function cerrar() {
    pedido.current += 1;
    setDetalle(null);
    setCargandoDetalle(false);
  }

  async function accion(thunk, arg, mensaje) {
    try {
      await dispatch(thunk(arg)).unwrap();
      toast.push({ type: "success", message: mensaje });
      cerrar();
      setNota(null);
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }

  const columns = [
    {
      key: "title",
      label: "Publicación",
      render: (p) => (
        <button type="button" className="text-left" onClick={() => abrir(p)}>
          <span className="flex items-center gap-3">
            {p.cover ? <img src={p.cover.url} alt="" className="h-10 w-14 shrink-0 object-cover" style={{ borderRadius: "var(--radius-sm)" }} /> : null}
            <span>
              <span className="block font-medium text-[var(--admin-accent)] hover:underline">{p.title}</span>
              <span className="text-xs text-[var(--admin-text-muted)]">{p.celebration?.name || "Sin fiesta"} · {p.imageCount} fotos</span>
            </span>
          </span>
        </button>
      ),
    },
    {
      key: "author",
      label: "Autor",
      render: (p) => (
        <span>
          {p.author?.displayName}
          <span className="block text-xs text-[var(--admin-text-muted)]">@{p.author?.username}</span>
        </span>
      ),
    },
    { key: "createdAt", label: "Enviada", render: (p) => <span className="whitespace-nowrap">{formatHace(p.createdAt)}</span> },
    {
      key: "status",
      label: "Estado",
      render: (p) => (
        <span className="flex flex-col items-start gap-1">
          <AdminBadge status={p.status} />
          {p.hidden ? <span className="text-xs text-[var(--admin-danger)]">Oculta por denuncias</span> : null}
          {p.reportCount ? <span className="text-xs text-[var(--admin-warning)]">{p.reportCount} denuncias</span> : null}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "",
      render: (p) => (
        <AdminButton variante="secondary" tamano="sm" onClick={() => abrir(p)}>
          Revisar
        </AdminButton>
      ),
    },
  ];

  return (
    <div>
      <AdminToolbar search={<AdminSearch value={pagination.query} onChange={pagination.setQuery} placeholder="Buscar por título o autor…" />}>
        <AdminSelect value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado" className="!w-auto">
          <option value="PENDING">En revisión</option>
          <option value="PUBLISHED">Publicadas</option>
          <option value="REJECTED">Rechazadas</option>
          <option value="REMOVED">Dadas de baja</option>
        </AdminSelect>
        <AdminButton variante="secondary" onClick={cargar} disabled={status === "loading"}>
          Actualizar
        </AdminButton>
      </AdminToolbar>
      {status === "failed" ? <div className="mb-4"><AdminAlert type="error">{error}</AdminAlert></div> : null}
      <AdminTable
        columns={columns}
        rows={pagination.pageItems}
        empty={status === "loading" ? "Cargando…" : estado === "PENDING" ? "No hay publicaciones esperando revisión. ¡Al día!" : "No hay publicaciones en este estado."}
      />
      <AdminPagination {...pagination} onPageChange={pagination.setPage} />

      <AdminModal
        open={Boolean(detalle)}
        title={detalle?.title || ""}
        subtitle={detalle ? `@${detalle.author?.username} · ${formatFechaLarga(detalle.createdAt)}` : ""}
        onClose={cerrar}
        footer={
          detalle ? (
            <div className="flex w-full flex-wrap justify-between gap-2">
              <AdminButton variante="secondary" onClick={cerrar}>
                Cerrar
              </AdminButton>
              <fieldset disabled={cargandoDetalle} className="flex flex-wrap gap-2 disabled:opacity-60">
                {detalle.status === "PENDING" ? (
                  <>
                    <AdminButton variante="danger" onClick={() => setNota("reject")}>
                      Rechazar
                    </AdminButton>
                    <AdminButton onClick={() => accion(approvePost, detalle.id, "Publicación aprobada.")}>Aprobar y publicar</AdminButton>
                  </>
                ) : null}
                {detalle.status === "PUBLISHED" ? (
                  <>
                    {detalle.hidden ? (
                      <AdminButton variante="secondary" onClick={() => accion(restorePost, detalle.id, "Publicación visible de nuevo.")}>
                        Volver a mostrar
                      </AdminButton>
                    ) : null}
                    <AdminButton variante="danger" onClick={() => setNota("remove")}>
                      Dar de baja
                    </AdminButton>
                  </>
                ) : null}
                {["REMOVED", "REJECTED"].includes(detalle.status) ? (
                  <AdminButton variante="secondary" onClick={() => accion(restorePost, detalle.id, "Publicación restaurada.")}>
                    Restaurar y publicar
                  </AdminButton>
                ) : null}
              </fieldset>
            </div>
          ) : null
        }
      >
        {detalle ? (
          <div className="flex flex-col gap-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <AdminBadge status={detalle.status} />
              {detalle.author ? (
                <span className="text-[var(--admin-text-muted)]">
                  {detalle.author.displayName} · {detalle.author.email} ·{" "}
                  {detalle.author.canPublishDirectly ? "de confianza" : `${detalle.author.approvedPostsCount ?? 0} aprobadas`}
                </span>
              ) : null}
            </div>
            {detalle.moderationNote ? <AdminAlert>Nota enviada al autor: {detalle.moderationNote}</AdminAlert> : null}
            <p className="text-[var(--admin-text-muted)]">
              {[detalle.celebration?.name, detalle.province?.name, detalle.yearAttended ? `fue en ${detalle.yearAttended}` : null, ...(detalle.people || []).map((p) => p.displayName)]
                .filter(Boolean)
                .join(" · ") || "Sin etiquetas"}
            </p>
            {cargandoDetalle ? (
              <p>Cargando vista previa…</p>
            ) : (
              <>
                {detalle.images?.length ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {detalle.images.map((img) => (
                      <figure key={img.id}>
                        <img src={img.url} alt={img.alt} className="aspect-[4/3] w-full object-cover" style={{ borderRadius: "var(--radius-sm)" }} />
                        <figcaption className="mt-1 text-xs text-[var(--admin-text-muted)]">
                          {img.alt || <em className="text-[var(--admin-danger)]">Sin descripción</em>}
                          {img.id === detalle.coverUploadId ? " · portada" : ""}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : null}
                <div className="whitespace-pre-line leading-relaxed">{detalle.body}</div>
                {detalle.status === "PUBLISHED" ? <LinkSitio to={`/comunidad/p/${detalle.slug}`}>Ver en el sitio</LinkSitio> : null}
                {detalle.reports?.length ? (
                  <section>
                    <h3 className="mb-2 font-semibold">Denuncias</h3>
                    <ul className="flex flex-col gap-1">
                      {detalle.reports.map((r) => (
                        <li key={r.id}>
                          {MOTIVOS_DENUNCIA[r.reason]} — @{r.reporter?.username} · {formatHace(r.createdAt)} {r.status !== "OPEN" ? `(${r.status.toLowerCase()})` : ""}
                          {r.details ? <span className="block text-xs text-[var(--admin-text-muted)]">“{r.details}”</span> : null}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
                {detalle.history?.length ? (
                  <section>
                    <h3 className="mb-2 font-semibold">Historial</h3>
                    <ul className="flex flex-col gap-1 text-[var(--admin-text-muted)]">
                      {detalle.history.map((h, i) => (
                        <li key={`${h.at}-${i}`}>
                          {formatHace(h.at)} — {ACCIONES_LOG[h.action] || h.action}
                          {h.note ? `: ${h.note}` : ""}
                        </li>
                      ))}
                    </ul>
                  </section>
                ) : null}
              </>
            )}
          </div>
        ) : null}
      </AdminModal>

      <ModalNota
        open={nota === "reject"}
        layer="confirm"
        title="Rechazar publicación"
        label="Motivo para el autor (lo va a ver en su cuenta y por email)"
        confirmLabel="Rechazar"
        onClose={() => setNota(null)}
        onConfirm={(note) => accion(rejectPost, { id: detalle.id, note }, "Publicación rechazada. Le avisamos al autor.")}
      />
      <ModalNota
        open={nota === "remove"}
        layer="confirm"
        title="Dar de baja la publicación"
        label="Motivo (queda en el historial)"
        confirmLabel="Dar de baja"
        onClose={() => setNota(null)}
        onConfirm={(note) => accion(removePost, { id: detalle.id, note }, "Publicación dada de baja.")}
      />
    </div>
  );
}

/* ---------- Denuncias ---------- */

export function ReportsTab() {
  const dispatch = useDispatch();
  const toast = useAdminToast();
  const confirm = useAdminConfirm();
  const { items, status, error } = useSelector((s) => s.communityAdmin.reportes);
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("OPEN");
  const [suspender, setSuspender] = useState(null);

  const cargar = useCallback(() => dispatch(fetchReports({ status: estado, targetType: tipo || undefined })), [dispatch, estado, tipo]);
  useEffect(() => {
    cargar();
  }, [cargar]);

  async function resolver(grupo, action, note) {
    if (action === "REMOVE_CONTENT") {
      const ok = await confirm.ask({
        title: "Quitar contenido",
        message: `Se va a quitar ${grupo.targetType === "POST" ? "la publicación" : "el comentario"} y se cierran sus ${grupo.count} denuncias.`,
        confirmLabel: "Quitar",
      });
      if (!ok) return;
    }
    try {
      await dispatch(resolveReport({ id: grupo.id, action, note })).unwrap();
      toast.push({
        type: "success",
        message: action === "DISMISS" ? "Denuncias descartadas." : action === "SUSPEND_USER" ? "Usuario suspendido 7 días." : "Contenido quitado.",
      });
      setSuspender(null);
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }

  return (
    <div>
      {confirm.dialog}
      <AdminToolbar>
        <AdminSelect value={tipo} onChange={(e) => setTipo(e.target.value)} aria-label="Tipo de contenido" className="!w-auto">
          <option value="">Todo</option>
          <option value="POST">Publicaciones</option>
          <option value="COMMENT">Comentarios</option>
          <option value="USER">Usuarios</option>
        </AdminSelect>
        <AdminSelect value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Estado" className="!w-auto">
          <option value="OPEN">Abiertas</option>
          <option value="DISMISSED">Descartadas</option>
          <option value="ACTIONED">Resueltas con acción</option>
        </AdminSelect>
        <AdminButton variante="secondary" onClick={cargar}>
          Actualizar
        </AdminButton>
      </AdminToolbar>
      {status === "failed" ? <AdminAlert type="error">{error}</AdminAlert> : null}
      {status === "loading" && !items.length ? <p className="text-sm text-[var(--admin-text-muted)]">Cargando…</p> : null}
      {status === "succeeded" && !items.length ? (
        <AdminTable columns={[]} rows={[]} empty={estado === "OPEN" ? "No hay denuncias abiertas." : "No hay denuncias en este estado."} />
      ) : null}
      <ul className="flex flex-col gap-3">
        {items.map((g) => (
          <li key={g.id} className="border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 text-sm" style={{ borderRadius: "var(--radius-md)" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--admin-text-muted)]">
                  {TIPO_DENUNCIA[g.targetType]} · {g.count} {g.count === 1 ? "denuncia" : "denuncias"}
                  {g.target?.hidden ? <span className="ml-2 text-[var(--admin-danger)]">· oculto automáticamente</span> : null}
                </p>
                {g.target?.missing ? (
                  <p className="mt-1 italic">El contenido ya no existe.</p>
                ) : g.targetType === "POST" ? (
                  <p className="mt-1 font-medium">{g.target.title}</p>
                ) : g.targetType === "COMMENT" ? (
                  <p className="mt-1">“{g.target.body || "Comentario eliminado"}” <span className="text-[var(--admin-text-muted)]">en {g.target.postTitle}</span></p>
                ) : (
                  <p className="mt-1 font-medium">
                    {g.target.displayName} (@{g.target.username}) <AdminBadge status={g.target.status} />
                  </p>
                )}
                {g.target?.author && g.targetType !== "USER" ? (
                  <p className="text-xs text-[var(--admin-text-muted)]">Autor: @{g.target.author.username}</p>
                ) : null}
                <ul className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(g.reasons).map(([reason, n]) => (
                    <li key={reason} className="admin-badge admin-badge--draft">
                      {MOTIVOS_DENUNCIA[reason]} {n > 1 ? `×${n}` : ""}
                    </li>
                  ))}
                </ul>
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-[var(--admin-accent)]">Ver denuncias</summary>
                  <ul className="mt-1 flex flex-col gap-1 text-xs">
                    {g.reports.map((r) => (
                      <li key={r.id}>
                        @{r.reporter?.username} · {MOTIVOS_DENUNCIA[r.reason]} · {formatHace(r.createdAt)}
                        {r.details ? ` — “${r.details}”` : ""}
                      </li>
                    ))}
                  </ul>
                </details>
                {g.target?.url ? <p className="mt-2"><LinkSitio to={g.target.url}>Ver en el sitio</LinkSitio></p> : null}
              </div>
              {estado === "OPEN" ? (
                <div className="flex flex-wrap gap-2">
                  <AdminButton variante="secondary" tamano="sm" onClick={() => resolver(g, "DISMISS")}>
                    Descartar
                  </AdminButton>
                  {g.targetType !== "USER" && !g.target?.missing ? (
                    <AdminButton variante="danger" tamano="sm" onClick={() => resolver(g, "REMOVE_CONTENT")}>
                      Quitar contenido
                    </AdminButton>
                  ) : null}
                  <AdminButton variante="danger-solid" tamano="sm" onClick={() => setSuspender(g)}>
                    Suspender usuario
                  </AdminButton>
                </div>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
      <ModalNota
        open={Boolean(suspender)}
        title="Suspender usuario 7 días"
        label="Motivo (se le manda por email)"
        confirmLabel="Suspender"
        onClose={() => setSuspender(null)}
        onConfirm={(note) => resolver(suspender, "SUSPEND_USER", note)}
      >
        <p className="text-sm text-[var(--admin-text-muted)]">Para otra duración, usá la pestaña Usuarios.</p>
      </ModalNota>
    </div>
  );
}

/* ---------- Usuarios ---------- */

const filterUsers = (list, q) =>
  !q
    ? list
    : list.filter((u) => u.username.includes(q) || u.displayName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q));

export function CommunityUsersTab() {
  const dispatch = useDispatch();
  const toast = useAdminToast();
  const confirm = useAdminConfirm();
  const { items, status, error } = useSelector((s) => s.communityAdmin.usuarios);
  const [estado, setEstado] = useState("");
  const [detalle, setDetalle] = useState(null);
  const [suspender, setSuspender] = useState(null);
  const [dias, setDias] = useState("7");
  const filtrados = useMemo(() => (estado ? items.filter((u) => u.status === estado) : items), [items, estado]);
  const pagination = useAdminPagination(filtrados, { filterFn: filterUsers });

  useEffect(() => {
    dispatch(fetchCommunityUsers({}));
  }, [dispatch]);

  const pedidoUsuario = useRef(0);

  async function abrir(u) {
    const actual = ++pedidoUsuario.current;
    setDetalle({ ...u, posts: null });
    try {
      const data = await dispatch(fetchAdminUserDetail(u.id)).unwrap();
      if (pedidoUsuario.current === actual) setDetalle(data);
    } catch (err) {
      if (pedidoUsuario.current === actual) toast.push({ type: "error", message: err.message });
    }
  }

  async function refrescarDetalle(id) {
    if (detalle?.id === id) setDetalle(await dispatch(fetchAdminUserDetail(id)).unwrap());
  }

  async function confianza(u) {
    try {
      await dispatch(setUserTrusted({ id: u.id, canPublishDirectly: !u.canPublishDirectly })).unwrap();
      toast.push({ type: "success", message: u.canPublishDirectly ? "Sus publicaciones vuelven a revisión." : "Marcado como de confianza: publica sin revisión." });
      refrescarDetalle(u.id);
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }

  async function reactivar(u) {
    const ok = await confirm.ask({ title: "Reactivar cuenta", message: `¿Reactivar a @${u.username}?`, confirmLabel: "Reactivar", confirmVariant: "primary" });
    if (!ok) return;
    try {
      await dispatch(reactivateCommunityUser(u.id)).unwrap();
      toast.push({ type: "success", message: "Cuenta reactivada." });
      refrescarDetalle(u.id);
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }

  async function confirmarSuspension(reason) {
    try {
      await dispatch(suspendCommunityUser({ id: suspender.id, days: dias === "perm" ? null : Number(dias), reason })).unwrap();
      toast.push({ type: "success", message: `@${suspender.username} suspendido.` });
      refrescarDetalle(suspender.id);
      setSuspender(null);
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }

  async function moderarComentario(c) {
    try {
      if (c.status === "HIDDEN") await dispatch(adminRestoreComment(c.id)).unwrap();
      else await dispatch(adminDeleteComment(c.id)).unwrap();
      toast.push({ type: "success", message: c.status === "HIDDEN" ? "Comentario visible de nuevo." : "Comentario eliminado." });
      refrescarDetalle(detalle.id);
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }

  const columns = [
    {
      key: "user",
      label: "Usuario",
      render: (u) => (
        <button type="button" className="text-left" onClick={() => abrir(u)}>
          <span className="block font-medium text-[var(--admin-accent)] hover:underline">{u.displayName}</span>
          <span className="text-xs text-[var(--admin-text-muted)]">@{u.username} · {u.email}</span>
        </button>
      ),
    },
    { key: "createdAt", label: "Alta", render: (u) => <span className="whitespace-nowrap">{formatHace(u.createdAt)}</span> },
    { key: "posts", label: "Publicaciones", render: (u) => u.stats.posts },
    { key: "reports", label: "Denuncias", render: (u) => (u.reportsReceived ? <span className="text-[var(--admin-warning)]">{u.reportsReceived}</span> : 0) },
    {
      key: "status",
      label: "Estado",
      render: (u) => (
        <span className="flex flex-col items-start gap-1">
          <AdminBadge status={u.status} />
          {u.canPublishDirectly ? <span className="text-xs text-[var(--admin-success)]">De confianza</span> : null}
          {!u.emailVerified ? <span className="text-xs text-[var(--admin-text-muted)]">Email sin confirmar</span> : null}
        </span>
      ),
    },
    {
      key: "acciones",
      label: "",
      render: (u) => (
        <AdminButton variante="secondary" tamano="sm" onClick={() => abrir(u)}>
          Ver
        </AdminButton>
      ),
    },
  ];

  return (
    <div>
      {confirm.dialog}
      <AdminToolbar search={<AdminSearch value={pagination.query} onChange={pagination.setQuery} placeholder="Buscar por nombre, usuario o email…" />}>
        <AdminSelect value={estado} onChange={(e) => setEstado(e.target.value)} aria-label="Filtrar por estado" className="!w-auto">
          <option value="">Todos</option>
          <option value="ACTIVE">Activos</option>
          <option value="SUSPENDED">Suspendidos</option>
        </AdminSelect>
      </AdminToolbar>
      {status === "failed" ? <div className="mb-4"><AdminAlert type="error">{error}</AdminAlert></div> : null}
      <AdminTable columns={columns} rows={pagination.pageItems} empty={status === "loading" ? "Cargando…" : "No hay usuarios con esos filtros."} />
      <AdminPagination {...pagination} onPageChange={pagination.setPage} />

      <AdminModal
        open={Boolean(detalle)}
        title={detalle ? `${detalle.displayName} (@${detalle.username})` : ""}
        subtitle={detalle ? `${detalle.email} · alta ${formatFechaLarga(detalle.createdAt)}` : ""}
        onClose={() => setDetalle(null)}
        footer={
          detalle ? (
            <div className="flex w-full flex-wrap justify-between gap-2">
              <AdminButton variante="secondary" onClick={() => setDetalle(null)}>
                Cerrar
              </AdminButton>
              <div className="flex flex-wrap gap-2">
                <AdminButton variante="secondary" onClick={() => confianza(detalle)}>
                  {detalle.canPublishDirectly ? "Quitar “de confianza”" : "Marcar de confianza"}
                </AdminButton>
                {detalle.status === "SUSPENDED" ? (
                  <AdminButton onClick={() => reactivar(detalle)}>Reactivar</AdminButton>
                ) : (
                  <AdminButton variante="danger-solid" onClick={() => setSuspender(detalle)}>
                    Suspender
                  </AdminButton>
                )}
              </div>
            </div>
          ) : null
        }
      >
        {detalle ? (
          <div className="flex flex-col gap-5 text-sm">
            <div className="flex flex-wrap items-center gap-2">
              <AdminBadge status={detalle.status} />
              {detalle.status === "SUSPENDED" ? (
                <span className="text-[var(--admin-text-muted)]">
                  {detalle.suspendedUntil ? `hasta el ${formatFechaLarga(detalle.suspendedUntil)}` : "permanente"}
                  {detalle.suspensionReason ? ` · ${detalle.suspensionReason}` : ""}
                </span>
              ) : null}
              <span className="text-[var(--admin-text-muted)]">
                {detalle.canPublishDirectly ? "Publica sin revisión" : `Publica con revisión (${detalle.approvedPostsCount ?? 0} aprobadas)`}
              </span>
            </div>
            <LinkSitio to={`/comunidad/u/${detalle.username}`}>Ver perfil público</LinkSitio>
            {!detalle.posts ? (
              <p>Cargando…</p>
            ) : (
              <>
                <section>
                  <h3 className="mb-2 font-semibold">Publicaciones ({detalle.posts.length})</h3>
                  {detalle.posts.length ? (
                    <ul className="flex flex-col gap-1">
                      {detalle.posts.map((p) => (
                        <li key={p.id} className="flex flex-wrap items-center gap-2">
                          <AdminBadge status={p.status} /> {p.title}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[var(--admin-text-muted)]">Sin publicaciones.</p>
                  )}
                </section>
                <section>
                  <h3 className="mb-2 font-semibold">Últimos comentarios</h3>
                  {detalle.comments.length ? (
                    <ul className="flex flex-col gap-2">
                      {detalle.comments.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-start justify-between gap-2">
                          <span className="min-w-0 flex-1">
                            {c.status === "DELETED" ? <em>Eliminado</em> : `“${c.body}”`}
                            <span className="block text-xs text-[var(--admin-text-muted)]">
                              en {c.postTitle} · {formatHace(c.createdAt)} {c.status === "HIDDEN" ? "· oculto por denuncias" : ""}
                            </span>
                          </span>
                          {c.status !== "DELETED" ? (
                            <AdminButton variante={c.status === "HIDDEN" ? "secondary" : "danger"} tamano="sm" onClick={() => moderarComentario(c)}>
                              {c.status === "HIDDEN" ? "Mostrar" : "Eliminar"}
                            </AdminButton>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[var(--admin-text-muted)]">Sin comentarios.</p>
                  )}
                </section>
                <section>
                  <h3 className="mb-2 font-semibold">Denuncias recibidas</h3>
                  {detalle.reportsReceived.length ? (
                    <ul className="flex flex-col gap-1">
                      {detalle.reportsReceived.map((r) => (
                        <li key={r.id}>
                          {TIPO_DENUNCIA[r.targetType]} · {MOTIVOS_DENUNCIA[r.reason]} · @{r.reporter?.username} · {formatHace(r.createdAt)} · {r.status.toLowerCase()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-[var(--admin-text-muted)]">Sin denuncias.</p>
                  )}
                </section>
              </>
            )}
          </div>
        ) : null}
      </AdminModal>

      <ModalNota
        open={Boolean(suspender)}
        layer="confirm"
        title={`Suspender a @${suspender?.username || ""}`}
        label="Motivo (se le manda por email)"
        confirmLabel="Suspender"
        onClose={() => setSuspender(null)}
        onConfirm={confirmarSuspension}
      >
        <AdminField label="Duración">
          <AdminSelect value={dias} onChange={(e) => setDias(e.target.value)}>
            <option value="7">7 días</option>
            <option value="30">30 días</option>
            <option value="perm">Permanente</option>
          </AdminSelect>
        </AdminField>
      </ModalNota>
    </div>
  );
}

/* ---------- Palabras bloqueadas ---------- */

export function BlockedWordsTab() {
  const dispatch = useDispatch();
  const toast = useAdminToast();
  const { words, status } = useSelector((s) => s.communityAdmin.palabras);
  const [nueva, setNueva] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    dispatch(fetchBlockedWords());
  }, [dispatch]);

  async function guardar(lista, mensaje) {
    setGuardando(true);
    try {
      await dispatch(saveBlockedWords(lista)).unwrap();
      toast.push({ type: "success", message: mensaje });
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    } finally {
      setGuardando(false);
    }
  }

  function agregar(e) {
    e.preventDefault();
    const w = nueva.trim().toLowerCase();
    if (!w) return;
    if (words.includes(w)) {
      toast.push({ type: "info", message: "Esa palabra ya está en la lista." });
      return;
    }
    setNueva("");
    guardar([...words, w], `“${w}” agregada.`);
  }

  return (
    <div className="max-w-2xl">
      <p className="mb-4 text-sm text-[var(--admin-text-muted)]">
        Si un título, texto, comentario o descripción de foto contiene alguna de estas palabras, no se puede publicar (error CONTENT_BLOCKED). Se comparan palabras completas, sin distinguir mayúsculas.
      </p>
      <form onSubmit={agregar} className="mb-4 flex gap-2">
        <AdminField label="Nueva palabra" className="flex-1">
          <AdminInput value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Ej.: estafa" />
        </AdminField>
        <div className="flex items-end">
          <AdminButton type="submit" disabled={guardando}>
            Agregar
          </AdminButton>
        </div>
      </form>
      {status === "loading" ? <p className="text-sm">Cargando…</p> : null}
      {status === "succeeded" && !words.length ? <p className="text-sm text-[var(--admin-text-muted)]">La lista está vacía.</p> : null}
      <ul className="flex flex-wrap gap-2">
        {words.map((w) => (
          <li key={w} className="inline-flex items-center gap-1 border border-[var(--admin-border)] bg-[var(--admin-surface)] px-2 py-1 text-sm" style={{ borderRadius: "var(--radius-sm)" }}>
            {w}
            <button
              type="button"
              className="px-1 text-[var(--admin-danger)]"
              aria-label={`Quitar ${w}`}
              disabled={guardando}
              onClick={() => guardar(words.filter((x) => x !== w), `“${w}” quitada.`)}
            >
              ×
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
