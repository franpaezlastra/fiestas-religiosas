import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Boton } from "../../components/ui/Boton";
import {
  archiveBook,
  createBook,
  fetchAdminBooks,
  updateBook,
} from "../../redux/slices/booksSlice";
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
  isbn: "",
  title: "",
  subtitle: "",
  description: "",
  publisher: "",
  pageCount: "",
  status: "DRAFT",
};

function titleOf(book) {
  return book.translations?.find((t) => t.locale === "es")?.title || book.isbn;
}

export function AdminBooksPage() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.books.adminItems);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchAdminBooks());
  }, [dispatch]);

  function load(item) {
    const tr = item.translations?.find((t) => t.locale === "es") || item.translations?.[0];
    setEditingId(item.id);
    setForm({
      isbn: item.isbn || "",
      title: tr?.title || "",
      subtitle: tr?.subtitle || "",
      description: tr?.description || "",
      publisher: item.publisher || "",
      pageCount: item.pageCount != null ? String(item.pageCount) : "",
      status: item.status || "DRAFT",
    });
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    const body = {
      isbn: form.isbn.trim(),
      publisher: form.publisher || null,
      pageCount: form.pageCount ? Number(form.pageCount) : null,
      status: form.status,
      translations: [
        {
          locale: "es",
          title: form.title,
          subtitle: form.subtitle || null,
          description: form.description || null,
        },
      ],
      images: [],
      contributors: [],
      celebrations: [],
    };
    const action = editingId
      ? await dispatch(updateBook({ id: editingId, body }))
      : await dispatch(createBook(body));
    setSaving(false);
    if (action.meta.requestStatus === "rejected") {
      setError(action.payload?.message || "Error");
      return;
    }
    setEditingId(null);
    setForm(empty);
    dispatch(fetchAdminBooks());
  }

  const columns = [
    {
      key: "title",
      label: "Libro",
      render: (row) => (
        <div>
          <p className="font-medium text-azul-petroleo">{titleOf(row)}</p>
          <p className="text-xs text-texto/65">ISBN {row.isbn}</p>
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
            onClick={() => dispatch(archiveBook(row.id))}
          >
            Archivar
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader title="Libros" subtitle="Ficha editorial del libro Peregrinos." />
      <div className="grid gap-8 xl:grid-cols-2">
        <AdminTable columns={columns} rows={items} empty="No hay libros." />
        <form onSubmit={onSubmit}>
          <AdminPanel
            title={editingId ? "Editar libro" : "Nuevo libro"}
            footer={
              <Boton type="submit" disabled={saving}>
                {saving ? "Guardando…" : "Guardar"}
              </Boton>
            }
          >
            <AdminSection title="Ficha">
              <AdminField label="ISBN" required>
                <AdminInput
                  required
                  value={form.isbn}
                  onChange={(e) => setForm((f) => ({ ...f, isbn: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Páginas">
                <AdminInput
                  type="number"
                  value={form.pageCount}
                  onChange={(e) => setForm((f) => ({ ...f, pageCount: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Título" required span={2}>
                <AdminInput
                  required
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Subtítulo" span={2}>
                <AdminInput
                  value={form.subtitle}
                  onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))}
                />
              </AdminField>
              <AdminField label="Editorial">
                <AdminInput
                  value={form.publisher}
                  onChange={(e) => setForm((f) => ({ ...f, publisher: e.target.value }))}
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
                  rows={4}
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
