import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Boton } from "../../components/ui/Boton";
import {
  archiveTimeline,
  createTimeline,
  fetchAdminTimelines,
  updateTimeline,
} from "../../redux/slices/timelinesSlice";
import { slugify } from "../../utils/slugify";
import {
  AdminAlert,
  AdminBadge,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSection,
  AdminSelect,
  AdminTable,
  AdminTextarea,
} from "../components/AdminForm";

const empty = {
  code: "",
  title: "",
  slug: "",
  description: "",
  displayOrder: "0",
  status: "DRAFT",
};

function titleOf(item) {
  return item.translations?.find((t) => t.locale === "es")?.title || item.code;
}

export function AdminTimelinesPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.timelines.adminItems);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminTimelines());
  }, [dispatch]);

  function load(item) {
    const tr = item.translations?.find((t) => t.locale === "es") || item.translations?.[0];
    setEditingId(item.id);
    setForm({
      code: item.code || "",
      title: tr?.title || "",
      slug: tr?.slug || "",
      description: tr?.description || "",
      displayOrder: String(item.displayOrder ?? 0),
      status: item.status || "DRAFT",
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = {
      code: form.code.trim(),
      displayOrder: Number(form.displayOrder) || 0,
      status: form.status,
      translations: [
        {
          locale: "es",
          title: form.title,
          slug: form.slug || slugify(form.title),
          description: form.description || null,
        },
      ],
      events: [],
    };
    const action = editingId
      ? await dispatch(updateTimeline({ id: editingId, body }))
      : await dispatch(createTimeline(body));
    setSaving(false);
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "Error");
      return;
    }
    setEditingId(null);
    setForm(empty);
    dispatch(fetchAdminTimelines());
  }

  const columns = [
    {
      key: "title",
      label: "Cronología",
      render: (row) => (
        <div>
          <p className="font-medium text-azul-petroleo">{titleOf(row)}</p>
          <p className="text-xs text-texto/65">{row.code}</p>
        </div>
      ),
    },
    {
      key: "status",
      label: "Estado",
      render: (row) => <AdminBadge status={row.status} />,
    },
    {
      key: "actions",
      label: "",
      render: (row) => (
        <div className="flex justify-end gap-3">
          <button type="button" className="text-sm text-celeste-cielo" onClick={() => load(row)}>
            Editar
          </button>
          <button
            type="button"
            className="text-sm text-naranja-libro"
            onClick={() => dispatch(archiveTimeline(row.id))}
          >
            Archivar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Cronologías"
        subtitle="Contenedores de línea de tiempo. Los eventos puntuales se pueden ampliar después."
      />
      <div className="grid gap-8 xl:grid-cols-2">
        <AdminTable columns={columns} rows={items} empty="No hay cronologías." />
        <form onSubmit={onSubmit}>
          <AdminPanel
            title={editingId ? "Editar cronología" : "Nueva cronología"}
            footer={
              <Boton type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Boton>
            }
          >
            <AdminSection title="Datos">
              <AdminField label="Código" required hint="Identificador interno, ej. francisco-argentina">
                <AdminInput
                  required
                  value={form.code}
                  onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Orden">
                <AdminInput
                  type="number"
                  value={form.displayOrder}
                  onChange={(e) => setForm((f) => ({ ...f, displayOrder: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Título" required span={2}>
                <AdminInput
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      title: e.target.value,
                      slug: editingId ? f.slug : slugify(e.target.value),
                    }))
                  }
                />
              </AdminField>
              <AdminField label="Slug" required>
                <AdminInput
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Estado">
                <AdminSelect
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="PUBLISHED">Publicado</option>
                </AdminSelect>
              </AdminField>
              <AdminField label="Descripción" span={2}>
                <AdminTextarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </AdminField>
            </AdminSection>
            {error ? (
              <div className="py-4">
                <AdminAlert type="error">{error}</AdminAlert>
              </div>
            ) : null}
          </AdminPanel>
        </form>
      </div>
    </div>
  );
}
