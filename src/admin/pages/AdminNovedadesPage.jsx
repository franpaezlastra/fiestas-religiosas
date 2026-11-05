import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  archiveNovedad,
  createNovedad,
  fetchAdminNovedades,
  updateNovedad,
} from "../../redux/slices/novedadesSlice";
import { NOVEDADES_MOCKS, adminNovedadesService, novedadesMockControls } from "../../services";
import { useAdminPagination } from "../hooks/useAdminPagination";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal, AdminModalActions } from "../components/AdminModal";
import {
  AdminAlert,
  AdminBadge,
  AdminField,
  AdminIconButton,
  AdminInput,
  AdminPageHeader,
  AdminPagination,
  AdminSearch,
  AdminSection,
  AdminSelect,
  AdminStatCard,
  AdminTable,
  AdminTextarea,
  AdminToolbar,
} from "../components/AdminForm";
import { CargadorImagenes } from "../../components/comunidad/Formulario";
import { PROVINCIAS_REF, erroresDeCampos, plural } from "../../utils/comunidad";
import { LIMITES_NOVEDAD, TIPOS_NOVEDAD, formatFechaNovedad, hoyISO } from "../../utils/novedades";

const FORM_ID = "novedad-form";

const vacio = () => ({
  type: "PRESENTATION",
  status: "DRAFT",
  title: "",
  summary: "",
  body: "",
  date: hoyISO(),
  place: "",
  city: "",
  provinceSlug: "",
  externalUrl: "",
});

function aFormulario(n) {
  return {
    type: n.type,
    status: n.status,
    title: n.title,
    summary: n.summary || "",
    body: n.body || "",
    date: n.date,
    place: n.place || "",
    city: n.city || "",
    provinceSlug: n.province?.slug || "",
    externalUrl: n.externalUrl || "",
  };
}

function imagenesDe(n) {
  return (n.images || []).map((img) => ({ key: img.id, uploadId: img.id, url: img.url, alt: img.alt || "", estado: "listo", progreso: 1 }));
}

const filtrar = (list, q) => (!q ? list : list.filter((n) => n.title.toLowerCase().includes(q) || (n.city || "").toLowerCase().includes(q)));

export function AdminNovedadesPage() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.novedades.adminItems);
  const status = useSelector((s) => s.novedades.adminStatus);
  const error = useSelector((s) => s.novedades.adminError);
  const toast = useAdminToast();
  const confirm = useAdminConfirm();

  const [editando, setEditando] = useState(null); // null | "nueva" | novedad
  const [form, setForm] = useState(vacio);
  const [imagenes, setImagenes] = useState([]);
  const [portada, setPortada] = useState(null);
  const [dirty, setDirty] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorForm, setErrorForm] = useState(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminNovedades());
  }, [dispatch]);

  const pagination = useAdminPagination(items, { filterFn: filtrar });
  const fotos = useMemo(() => items.reduce((acc, n) => acc + n.images.length, 0), [items]);
  const esNueva = editando === "nueva";

  function abrir(n) {
    setEditando(n || "nueva");
    setForm(n ? aFormulario(n) : vacio());
    setImagenes(n ? imagenesDe(n) : []);
    setPortada(n?.coverImageId || null);
    setErrores({});
    setErrorForm(null);
    setDirty(false);
  }

  function set(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    setDirty(true);
  }

  function setImagenesDirty(updater) {
    setImagenes(updater);
    setDirty(true);
  }

  async function guardar(e, estadoForzado) {
    e?.preventDefault();
    const errs = {};
    const title = form.title.trim();
    if (title.length < LIMITES_NOVEDAD.titleMin || title.length > LIMITES_NOVEDAD.titleMax) {
      errs.title = `Entre ${LIMITES_NOVEDAD.titleMin} y ${LIMITES_NOVEDAD.titleMax} caracteres.`;
    }
    if (!form.date) errs.date = "Elegí la fecha.";
    if (form.summary.length > LIMITES_NOVEDAD.summaryMax) errs.summary = `Máximo ${LIMITES_NOVEDAD.summaryMax} caracteres.`;
    if (form.externalUrl && !/^https?:\/\/\S+\.\S+/.test(form.externalUrl.trim())) {
      errs.externalUrl = "Tiene que empezar con http:// o https://";
    }
    const imgErr = {};
    if (imagenes.some((i) => i.estado === "comprimiendo" || i.estado === "subiendo")) imgErr.general = "Esperá a que terminen de subir las fotos.";
    if (imagenes.some((i) => i.estado === "error")) imgErr.general = "Quitá las fotos que no se pudieron subir.";
    imagenes.forEach((i) => {
      if (i.estado === "listo" && !i.alt.trim()) imgErr[i.key] = "Describí la foto en pocas palabras.";
    });
    if (Object.keys(imgErr).length) errs.imagenes = imgErr;
    setErrores(errs);
    if (Object.keys(errs).length) {
      setErrorForm("Revisá los campos marcados.");
      return;
    }

    const listas = imagenes.filter((i) => i.estado === "listo");
    const cover = listas.find((i) => i.key === portada) || listas[0];
    const body = {
      type: form.type,
      status: estadoForzado || form.status,
      title,
      summary: form.summary.trim(),
      body: form.body.trim(),
      date: form.date,
      place: form.place.trim() || null,
      city: form.city.trim() || null,
      provinceSlug: form.provinceSlug || null,
      externalUrl: form.externalUrl.trim() || null,
      images: listas.map((i) => ({ imageId: i.uploadId, alt: i.alt.trim() })),
      coverImageId: cover?.uploadId || null,
    };

    setGuardando(true);
    setErrorForm(null);
    try {
      if (esNueva) await dispatch(createNovedad(body)).unwrap();
      else await dispatch(updateNovedad({ id: editando.id, body })).unwrap();
      toast.push({
        type: "success",
        message: body.status === "PUBLISHED" ? "Novedad publicada: ya se ve en el sitio." : "Guardada como borrador.",
      });
      setEditando(null);
    } catch (err) {
      if (err.code === "INVALID_REQUEST") setErrores(erroresDeCampos(err));
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function archivar(n) {
    const ok = await confirm.ask({
      title: "Quitar novedad",
      message: `“${n.title}” deja de verse en el sitio.`,
      confirmLabel: "Quitar",
    });
    if (!ok) return;
    try {
      await dispatch(archiveNovedad(n.id)).unwrap();
      toast.push({ type: "success", message: "Novedad quitada." });
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }

  async function reiniciar() {
    const ok = await confirm.ask({
      title: "Reiniciar simulación",
      message: "Las novedades vuelven a los ejemplos iniciales.",
      confirmLabel: "Reiniciar",
    });
    if (!ok) return;
    novedadesMockControls.reset();
    dispatch(fetchAdminNovedades());
  }

  const columns = [
    {
      key: "title",
      label: "Novedad",
      render: (n) => (
        <button type="button" className="flex items-center gap-3 text-left" onClick={() => abrir(n)}>
          {n.cover ? (
            <img src={n.cover.url} alt="" className="h-10 w-14 shrink-0 object-cover" style={{ borderRadius: "var(--radius-sm)" }} />
          ) : (
            <span className="h-10 w-14 shrink-0 bg-[var(--admin-bg)]" style={{ borderRadius: "var(--radius-sm)" }} />
          )}
          <span>
            <span className="block font-medium text-[var(--admin-accent)] hover:underline">{n.title}</span>
            <span className="text-xs text-[var(--admin-text-muted)]">
              {TIPOS_NOVEDAD[n.type]}
              {n.city ? ` · ${n.city}` : ""} · {plural(n.images.length, "foto", "fotos")}
            </span>
          </span>
        </button>
      ),
    },
    {
      key: "date",
      label: "Fecha",
      render: (n) => (
<span className="whitespace-nowrap">{formatFechaNovedad(n)}</span>
      ),
    },
    { key: "status", label: "Estado", render: (n) => <AdminBadge status={n.status} /> },
    {
      key: "acciones",
      label: "",
      render: (n) => (
        <span className="flex justify-end gap-1">
          <AdminIconButton label={`Editar ${n.title}`} onClick={() => abrir(n)}>
            ✎
          </AdminIconButton>
          <AdminIconButton label={`Quitar ${n.title}`} onClick={() => archivar(n)} danger>
            🗑
          </AdminIconButton>
        </span>
      ),
    },
  ];

  return (
    <div>
      {confirm.dialog}
      <AdminPageHeader
        title="Novedades del libro"
        subtitle="Blog de noticias del libro: presentaciones, muestras y notas de prensa, con fotos. Las publicadas se ven en El libro → Novedades."
        actions={
          <>
            <AdminButton variante="secondary" to="/novedades" target="_blank" rel="noopener">
              Ver en el sitio
            </AdminButton>
            {NOVEDADES_MOCKS ? (
              <AdminButton variante="ghost" onClick={reiniciar}>
                Reiniciar simulación
              </AdminButton>
            ) : null}
            <AdminButton onClick={() => abrir(null)}>+ Nueva novedad</AdminButton>
          </>
        }
      />

      {NOVEDADES_MOCKS ? (
        <div className="mb-4">
          <AdminAlert>Modo simulación: las novedades y sus fotos se guardan en este navegador.</AdminAlert>
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Publicadas" value={items.filter((n) => n.status === "PUBLISHED").length} />
        <AdminStatCard label="Borradores" value={items.filter((n) => n.status === "DRAFT").length} />
        <AdminStatCard label="Fotos" value={fotos} hint="En todas las novedades" />
      </div>

      {status === "failed" ? (
        <div className="mb-4">
          <AdminAlert type="error">{error}</AdminAlert>
        </div>
      ) : null}

      <AdminToolbar search={<AdminSearch value={pagination.query} onChange={pagination.setQuery} placeholder="Buscar por título o ciudad…" />} />
      <AdminTable
        columns={columns}
        rows={pagination.pageItems}
        empty={status === "loading" ? "Cargando…" : "Todavía no hay novedades."}
        emptyAction={status === "loading" ? null : <AdminButton onClick={() => abrir(null)}>Cargar la primera</AdminButton>}
      />
      <AdminPagination {...pagination} onPageChange={pagination.setPage} />

      <AdminModal
        open={editando != null}
        title={esNueva ? "Nueva novedad" : "Editar novedad"}
        onClose={() => setEditando(null)}
        dirty={dirty}
        footer={
          <div className="flex w-full flex-wrap justify-end gap-2">
            {form.status === "DRAFT" ? (
              <AdminButton variante="secondary" onClick={(e) => guardar(e, "PUBLISHED")} disabled={guardando}>
                Guardar y publicar
              </AdminButton>
            ) : null}
            <AdminModalActions
              formId={FORM_ID}
              saving={guardando}
              dirty={dirty || esNueva}
              submitLabel={form.status === "PUBLISHED" ? "Guardar cambios" : "Guardar borrador"}
              onCancel={() => setEditando(null)}
            />
          </div>
        }
      >
        <form id={FORM_ID} onSubmit={guardar} noValidate>
          {errorForm ? <AdminAlert type="error">{errorForm}</AdminAlert> : null}

          <AdminSection title="Qué y cuándo">
            <AdminField label="Tipo">
              <AdminSelect value={form.type} onChange={(e) => set("type", e.target.value)}>
                {Object.entries(TIPOS_NOVEDAD).map(([k, label]) => (
                  <option key={k} value={k}>
                    {label}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Estado">
              <AdminSelect value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="DRAFT">Borrador (no se ve)</option>
                <option value="PUBLISHED">Publicada</option>
              </AdminSelect>
            </AdminField>
            <AdminField label="Título" required span={2} hint={errores.title}>
              <AdminInput value={form.title} onChange={(e) => set("title", e.target.value)} maxLength={LIMITES_NOVEDAD.titleMax + 10} aria-invalid={errores.title ? "true" : undefined} />
            </AdminField>
            <AdminField label="Fecha del evento" required hint={errores.date || "Ordena el blog: la más reciente aparece primero."}>
              <AdminInput type="date" value={form.date} onChange={(e) => set("date", e.target.value)} aria-invalid={errores.date ? "true" : undefined} />
            </AdminField>
          </AdminSection>

          <AdminSection title="Dónde fue" description="Opcional. Se muestra debajo del título.">
            <AdminField label="Lugar" span={2}>
              <AdminInput value={form.place} onChange={(e) => set("place", e.target.value)} placeholder="Ej.: Museo de Arte Sacro" />
            </AdminField>
            <AdminField label="Ciudad">
              <AdminInput value={form.city} onChange={(e) => set("city", e.target.value)} />
            </AdminField>
            <AdminField label="Provincia">
              <AdminSelect value={form.provinceSlug} onChange={(e) => set("provinceSlug", e.target.value)}>
                <option value="">Sin provincia</option>
                {PROVINCIAS_REF.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
          </AdminSection>

          <AdminSection title="Texto">
            <AdminField label={`Resumen (${form.summary.length}/${LIMITES_NOVEDAD.summaryMax})`} span={2} hint={errores.summary || "Se ve en la tarjeta del listado."}>
              <AdminTextarea rows={2} value={form.summary} onChange={(e) => set("summary", e.target.value)} />
            </AdminField>
            <AdminField label="Texto completo" span={2} hint="Separá los párrafos con una línea en blanco.">
              <AdminTextarea rows={7} value={form.body} onChange={(e) => set("body", e.target.value)} />
            </AdminField>
            <AdminField label="Link externo (opcional)" span={2} hint={errores.externalUrl || "Por ejemplo, la nota en un diario o la página del evento."}>
              <AdminInput type="url" value={form.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://" aria-invalid={errores.externalUrl ? "true" : undefined} />
            </AdminField>
          </AdminSection>

          <AdminSection title="Fotos">
            <div className="sm:col-span-2">
              <CargadorImagenes
                imagenes={imagenes}
                setImagenes={setImagenesDirty}
                portada={portada}
                setPortada={(k) => {
                  setPortada(k);
                  setDirty(true);
                }}
                errores={errores.imagenes}
                subir={adminNovedadesService.uploadImage}
                maximo={LIMITES_NOVEDAD.imagenes}
                ayuda="Las achicamos antes de subirlas. La portada es la foto de la tarjeta. Describí cada foto en pocas palabras."
              />
            </div>
          </AdminSection>
        </form>
      </AdminModal>
    </div>
  );
}
