import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Boton } from "../../components/ui/Boton";
import {
  archivePerson,
  createPerson,
  fetchAdminPeople,
  updatePerson,
} from "../../redux/slices/peopleSlice";
import { slugify } from "../../utils/slugify";
import {
  AdminAlert,
  AdminBadge,
  AdminField,
  AdminInput,
  AdminPageHeader,
  AdminPanel,
  AdminSearch,
  AdminSection,
  AdminSelect,
  AdminTable,
  AdminTextarea,
} from "../components/AdminForm";

const empty = {
  displayName: "",
  slug: "",
  shortBio: "",
  biography: "",
  firstName: "",
  lastName: "",
  birthPlace: "",
  role: "SAINT",
  status: "DRAFT",
};

function nameOf(person) {
  return person.translations?.find((t) => t.locale === "es")?.displayName || person.id;
}

function roleLabel(person) {
  const role = person.roles?.[0]?.role;
  return (
    { SAINT: "Santo", BLESSED: "Beato", FEATURED_PERSON: "Destacado" }[role] || role || "—"
  );
}

export function AdminPeoplePage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.people.adminItems);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminPeople());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (!q) return true;
      return `${nameOf(item)} ${roleLabel(item)} ${item.status}`.toLowerCase().includes(q);
    });
  }, [items, query]);

  function load(item) {
    const tr = item.translations?.find((t) => t.locale === "es") || item.translations?.[0];
    setEditingId(item.id);
    setForm({
      displayName: tr?.displayName || "",
      slug: tr?.slug || "",
      shortBio: tr?.shortBio || "",
      biography: tr?.biography || "",
      firstName: item.firstName || "",
      lastName: item.lastName || "",
      birthPlace: tr?.birthPlace || "",
      role: item.roles?.[0]?.role || "SAINT",
      status: item.status || "DRAFT",
    });
    setError("");
    setMessage("");
  }

  function reset() {
    setEditingId(null);
    setForm(empty);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    const body = {
      firstName: form.firstName || null,
      lastName: form.lastName || null,
      status: form.status,
      translations: [
        {
          locale: "es",
          displayName: form.displayName,
          slug: form.slug || slugify(form.displayName),
          shortBio: form.shortBio || null,
          biography: form.biography || null,
          birthPlace: form.birthPlace || null,
        },
      ],
      roles: [{ role: form.role, displayOrder: 0 }],
      images: [],
    };
    const action = editingId
      ? await dispatch(updatePerson({ id: editingId, body }))
      : await dispatch(createPerson(body));
    setSaving(false);
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "Error al guardar");
      return;
    }
    setMessage(editingId ? "Persona actualizada." : "Persona creada.");
    reset();
    dispatch(fetchAdminPeople());
  }

  const columns = [
    {
      key: "name",
      label: "Persona",
      render: (row) => (
        <div>
          <p className="font-medium text-azul-petroleo">{nameOf(row)}</p>
          <p className="text-xs text-texto/65">{roleLabel(row)}</p>
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
            onClick={() => dispatch(archivePerson(row.id))}
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
        title="Personas"
        subtitle="Santos, beatos y figuras destacadas del libro y del sitio."
      />
      <div className="mb-4">
        <AdminSearch value={query} onChange={setQuery} placeholder="Buscar persona…" />
      </div>
      <div className="grid gap-8 xl:grid-cols-2">
        <AdminTable columns={columns} rows={filtered} empty="No hay personas cargadas." />
        <form onSubmit={onSubmit}>
          <AdminPanel
            title={editingId ? "Editar persona" : "Nueva persona"}
            footer={
              <>
                <Boton type="submit" disabled={saving}>
                  {saving ? "Guardando…" : "Guardar"}
                </Boton>
                {editingId ? (
                  <Boton type="button" variante="secundario" onClick={reset}>
                    Cancelar
                  </Boton>
                ) : null}
              </>
            }
          >
            <AdminSection title="Identidad">
              <AdminField label="Nombre para mostrar" required span={2}>
                <AdminInput
                  required
                  value={form.displayName}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      displayName: e.target.value,
                      slug: editingId ? f.slug : slugify(e.target.value),
                    }))
                  }
                />
              </AdminField>
              <AdminField label="Nombre">
                <AdminInput
                  value={form.firstName}
                  onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Apellido">
                <AdminInput
                  value={form.lastName}
                  onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Slug" required>
                <AdminInput
                  required
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Lugar de nacimiento">
                <AdminInput
                  value={form.birthPlace}
                  onChange={(e) => setForm((f) => ({ ...f, birthPlace: e.target.value }))}
                />
              </AdminField>
            </AdminSection>
            <AdminSection title="Rol y estado">
              <AdminField label="Rol" required>
                <AdminSelect
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                >
                  <option value="SAINT">Santo</option>
                  <option value="BLESSED">Beato</option>
                  <option value="FEATURED_PERSON">Destacado</option>
                </AdminSelect>
              </AdminField>
              <AdminField label="Estado" required>
                <AdminSelect
                  value={form.status}
                  onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="DRAFT">Borrador</option>
                  <option value="PUBLISHED">Publicado</option>
                  <option value="ARCHIVED">Archivado</option>
                </AdminSelect>
              </AdminField>
            </AdminSection>
            <AdminSection title="Biografía">
              <AdminField label="Bio corta" span={2}>
                <AdminTextarea
                  rows={3}
                  value={form.shortBio}
                  onChange={(e) => setForm((f) => ({ ...f, shortBio: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Biografía completa" span={2} hint="Podés usar texto enriquecido simple.">
                <AdminTextarea
                  rows={6}
                  value={form.biography}
                  onChange={(e) => setForm((f) => ({ ...f, biography: e.target.value }))}
                />
              </AdminField>
            </AdminSection>
            <div className="space-y-2 py-4">
              {error ? <AdminAlert type="error">{error}</AdminAlert> : null}
              {message ? <AdminAlert type="success">{message}</AdminAlert> : null}
            </div>
          </AdminPanel>
        </form>
      </div>
    </div>
  );
}
