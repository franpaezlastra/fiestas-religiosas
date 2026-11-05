import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  adjustVariantStock,
  archiveShopProduct,
  createShopCategory,
  createShopProduct,
  fetchAdminShopCategories,
  fetchAdminShopProducts,
  updateShopProduct,
} from "../../redux/slices/shopSlice";
import { adminShopService } from "../../services";
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
import {
  ENTREGAS,
  TIENDA_SOLO_LIBROS,
  TIPOS_PRODUCTO,
  formatFecha,
  formatPrecio,
  stockTotal,
  tieneStockBajo,
} from "../../utils/tienda";

const FORM_ID = "shop-product-form";

const emptyVariant = () => ({
  id: null,
  name: "",
  sku: "",
  price: "",
  stock: "0",
  lowStockThreshold: "5",
  weightGrams: "",
  resolution: "",
  license: "",
});

const emptyForm = {
  name: "",
  slug: "",
  type: "book",
  fulfillment: "physical",
  categoryId: "",
  status: "DRAFT",
  shortDescription: "",
  description: "",
  images: "",
  variants: [emptyVariant()],
};

function toForm(p) {
  return {
    name: p.name,
    slug: p.slug,
    type: p.type,
    fulfillment: p.fulfillment,
    categoryId: p.categoryId || "",
    status: p.status,
    shortDescription: p.shortDescription || "",
    description: p.description || "",
    images: (p.images || []).map((i) => i.url).join("\n"),
    variants: p.variants.map((v) => ({
      id: v.id,
      name: v.name,
      sku: v.sku || "",
      price: String(v.price),
      stock: String(v.stock ?? 0),
      lowStockThreshold: String(v.lowStockThreshold ?? ""),
      weightGrams: String(v.weightGrams ?? ""),
      resolution: v.digital?.resolution || "",
      license: v.digital?.license || "",
    })),
  };
}

function toBody(form, existing) {
  const fulfillment = TIENDA_SOLO_LIBROS ? "physical" : form.fulfillment;
  const digital = fulfillment === "digital";
  const prevImages = new Map((existing?.images || []).map((i) => [i.url, i]));
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    type: TIENDA_SOLO_LIBROS ? "book" : form.type,
    fulfillment,
    categoryId: form.categoryId || null,
    status: form.status,
    shortDescription: form.shortDescription.trim(),
    description: form.description.trim(),
    images: form.images
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean)
      .map((url) => prevImages.get(url) || { url, alt: form.name.trim() }),
    variants: form.variants.map((v) => {
      const prev = existing?.variants.find((x) => x.id === v.id);
      return {
        id: v.id || undefined,
        name: v.name.trim(),
        sku: v.sku.trim(),
        price: Number(v.price),
        stock: digital ? null : Number(v.stock) || 0,
        lowStockThreshold: digital || v.lowStockThreshold === "" ? null : Number(v.lowStockThreshold),
        weightGrams: digital || v.weightGrams === "" ? null : Number(v.weightGrams),
        dimensions: digital ? null : prev?.dimensions || null,
        digital: digital ? { resolution: v.resolution.trim(), license: v.license.trim() } : null,
      };
    }),
  };
}

const filterProducts = (list, q) =>
  !q
    ? list
    : list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.variants.some((v) => String(v.sku || "").toLowerCase().includes(q)),
      );

function StockCell({ product }) {
  const total = stockTotal(product);
  if (total == null) return <span className="text-[var(--admin-text-muted)]">Digital</span>;
  const bajo = tieneStockBajo(product);
  return (
    <span className="flex flex-col">
      <span className={total === 0 ? "font-semibold text-[var(--admin-danger)]" : bajo ? "font-semibold text-[var(--admin-warning)]" : ""}>
        {total} u.
      </span>
      {total === 0 ? (
        <span className="text-[11px] text-[var(--admin-danger)]">Sin stock</span>
      ) : bajo ? (
        <span className="text-[11px] text-[var(--admin-warning)]">Stock bajo</span>
      ) : null}
    </span>
  );
}

/* ---------- Modal de stock ---------- */

function StockModal({ product, onClose }) {
  const dispatch = useDispatch();
  const toast = useAdminToast();
  const [ajustes, setAjustes] = useState({});
  const [movimientos, setMovimientos] = useState([]);
  const [saving, setSaving] = useState(null);

  const cargarMovimientos = useCallback(async () => {
    try {
      setMovimientos(await adminShopService.stockMovements({ productId: product.id }));
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }, [product.id, toast]);

  useEffect(() => {
    cargarMovimientos();
  }, [cargarMovimientos]);

  const setAjuste = (variantId, key, value) =>
    setAjustes((a) => ({ ...a, [variantId]: { ...a[variantId], [key]: value } }));

  async function aplicar(variant, signo) {
    const a = ajustes[variant.id] || {};
    const cantidad = Math.abs(parseInt(a.cantidad, 10));
    if (!cantidad) {
      toast.push({ type: "error", message: "Ingresá una cantidad." });
      return;
    }
    setSaving(variant.id);
    try {
      await dispatch(
        adjustVariantStock({
          variantId: variant.id,
          delta: signo * cantidad,
          reason: a.motivo || (signo > 0 ? "Reposición" : "Ajuste manual"),
        }),
      ).unwrap();
      toast.push({ type: "success", message: `Stock de "${variant.name}" actualizado.` });
      setAjustes((s) => ({ ...s, [variant.id]: {} }));
      cargarMovimientos();
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    } finally {
      setSaving(null);
    }
  }

  const nombreVariante = (id) => product.variants.find((v) => v.id === id)?.name || "—";

  return (
    <AdminModal
      open
      title={`Stock — ${product.name}`}
      subtitle="Cada cambio queda en el historial. Las ventas descuentan stock solas cuando se aprueba el pago."
      onClose={onClose}
      footer={
        <AdminButton variante="secondary" onClick={onClose}>
          Cerrar
        </AdminButton>
      }
    >
      <div className="flex flex-col gap-4">
        {product.variants.map((v) => {
          const a = ajustes[v.id] || {};
          const bajo = v.lowStockThreshold != null && (v.stock ?? 0) <= v.lowStockThreshold;
          return (
            <div
              key={v.id}
              className="border border-[var(--admin-border)] p-4"
              style={{ borderRadius: "var(--radius-md)" }}
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-semibold">
                  {v.name} <span className="text-xs font-normal text-[var(--admin-text-muted)]">{v.sku}</span>
                </p>
                <p className={bajo ? "font-semibold text-[var(--admin-warning)]" : "font-semibold"}>
                  {v.stock ?? 0} u. {bajo ? `(alerta en ${v.lowStockThreshold})` : ""}
                </p>
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-[7rem_1fr_auto]">
                <AdminField label="Cantidad">
                  <AdminInput
                    type="number"
                    min="1"
                    value={a.cantidad || ""}
                    onChange={(e) => setAjuste(v.id, "cantidad", e.target.value)}
                  />
                </AdminField>
                <AdminField label="Motivo">
                  <AdminInput
                    list="motivos-stock"
                    placeholder="Reposición, rotura, venta en feria…"
                    value={a.motivo || ""}
                    onChange={(e) => setAjuste(v.id, "motivo", e.target.value)}
                  />
                </AdminField>
                <div className="flex items-end gap-2">
                  <AdminButton onClick={() => aplicar(v, 1)} disabled={saving != null}>
                    + Sumar
                  </AdminButton>
                  <AdminButton variante="secondary" onClick={() => aplicar(v, -1)} disabled={saving != null}>
                    − Restar
                  </AdminButton>
                </div>
              </div>
            </div>
          );
        })}
        <datalist id="motivos-stock">
          <option value="Reposición" />
          <option value="Rotura o daño" />
          <option value="Venta en feria / presencial" />
          <option value="Regalo / prensa" />
          <option value="Corrección de inventario" />
        </datalist>

        <div>
          <h3 className="mb-2 text-sm font-semibold">Historial de movimientos</h3>
          {movimientos.length === 0 ? (
            <p className="text-sm text-[var(--admin-text-muted)]">Sin movimientos todavía.</p>
          ) : (
            <div className="admin-table-wrap">
              <div className="overflow-x-auto">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Variante</th>
                      <th>Cambio</th>
                      <th>Motivo</th>
                      <th>Queda</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m) => (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap">{formatFecha(m.at)}</td>
                        <td>{nombreVariante(m.variantId)}</td>
                        <td className={m.delta > 0 ? "text-[var(--admin-success)]" : "text-[var(--admin-danger)]"}>
                          {m.delta > 0 ? `+${m.delta}` : m.delta}
                        </td>
                        <td>
                          {m.reason}
                          {m.orderNumber ? ` (${m.orderNumber})` : ""}
                        </td>
                        <td>{m.stockAfter}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminModal>
  );
}

/* ---------- Página ---------- */

export function AdminShopProductsPage() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.shop.adminItems);
  const categories = useSelector((s) => s.shop.adminCategories);
  const status = useSelector((s) => s.shop.status);
  const toast = useAdminToast();
  const confirm = useAdminConfirm();

  const [editing, setEditing] = useState(null); // null | "new" | product
  const [form, setForm] = useState(emptyForm);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [stockProduct, setStockProduct] = useState(null);
  const [nuevaCategoria, setNuevaCategoria] = useState("");

  useEffect(() => {
    dispatch(fetchAdminShopProducts());
    dispatch(fetchAdminShopCategories());
  }, [dispatch]);

  const pagination = useAdminPagination(items, { filterFn: filterProducts });
  const stockActual = stockProduct ? items.find((p) => p.id === stockProduct) : null;
  const isNew = editing === "new";
  const digital = form.fulfillment === "digital";

  function abrirNuevo() {
    setForm({ ...emptyForm, categoryId: categories[0]?.id || "", variants: [emptyVariant()] });
    setEditing("new");
    setDirty(false);
    setFormError(null);
  }

  function abrirEditar(product) {
    setForm(toForm(product));
    setEditing(product);
    setDirty(false);
    setFormError(null);
  }

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function setVariant(index, key, value) {
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v, i) => (i === index ? { ...v, [key]: value } : v)),
    }));
    setDirty(true);
  }

  async function guardar(e) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    try {
      const body = toBody(form, isNew ? null : editing);
      if (isNew) await dispatch(createShopProduct(body)).unwrap();
      else await dispatch(updateShopProduct({ id: editing.id, body })).unwrap();
      toast.push({ type: "success", message: isNew ? "Producto creado." : "Producto guardado." });
      setEditing(null);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function archivar(product) {
    const ok = await confirm.ask({
      title: "Archivar producto",
      message: `"${product.name}" deja de verse en la tienda. Los pedidos existentes no cambian.`,
      confirmLabel: "Archivar",
    });
    if (!ok) return;
    try {
      await dispatch(archiveShopProduct(product.id)).unwrap();
      toast.push({ type: "success", message: "Producto archivado." });
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }

  async function agregarCategoria(e) {
    e.preventDefault();
    if (!nuevaCategoria.trim()) return;
    try {
      const cat = await dispatch(createShopCategory({ name: nuevaCategoria })).unwrap();
      set("categoryId", cat.id);
      setNuevaCategoria("");
      toast.push({ type: "success", message: `Categoría "${cat.name}" creada.` });
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    }
  }

  const fisicos = items.filter((p) => p.fulfillment === "physical");
  const columns = [
    {
      key: "name",
      label: "Producto",
      render: (p) => (
        <span className="flex items-center gap-3">
          {p.images?.[0] ? (
            <img src={p.images[0].url} alt="" className="h-10 w-10 shrink-0 object-cover" style={{ borderRadius: "var(--radius-sm)" }} />
          ) : null}
          <span>
            <span className="block font-medium">{p.name}</span>
            <span className="text-xs text-[var(--admin-text-muted)]">
              {TIPOS_PRODUCTO[p.type] || p.type} · {p.category?.name || "Sin categoría"} · {p.variants.length}{" "}
              {p.variants.length === 1 ? "variante" : "variantes"}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: "price",
      label: "Precio",
      render: (p) => {
        const prices = p.variants.map((v) => v.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        return min === max ? formatPrecio(min) : `${formatPrecio(min)} – ${formatPrecio(max)}`;
      },
    },
    { key: "stock", label: "Stock", render: (p) => <StockCell product={p} /> },
    { key: "status", label: "Estado", render: (p) => <AdminBadge status={p.status} /> },
    {
      key: "acciones",
      label: "",
      render: (p) => (
        <span className="flex justify-end gap-1">
          {p.fulfillment === "physical" ? (
            <AdminButton variante="secondary" tamano="sm" onClick={() => setStockProduct(p.id)}>
              Stock
            </AdminButton>
          ) : null}
          <AdminIconButton label={`Editar ${p.name}`} onClick={() => abrirEditar(p)}>
            ✎
          </AdminIconButton>
          <AdminIconButton label={`Archivar ${p.name}`} onClick={() => archivar(p)} danger>
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
        title="Productos de la tienda"
        subtitle={
          TIENDA_SOLO_LIBROS
            ? "Por ahora, los libros. Precio y stock van por variante (por ejemplo, ediciones)."
            : "Libros, fotografías y lo que se sume. Precio y stock van por variante."
        }
        actions={<AdminButton onClick={abrirNuevo}>+ Nuevo producto</AdminButton>}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Publicados" value={items.filter((p) => p.status === "PUBLISHED").length} />
        <AdminStatCard label="Unidades en stock" value={fisicos.reduce((acc, p) => acc + stockTotal(p), 0)} hint="Productos físicos" />
        <AdminStatCard label="Stock bajo" value={fisicos.filter((p) => tieneStockBajo(p) && stockTotal(p) > 0).length} />
        <AdminStatCard label="Sin stock" value={fisicos.filter((p) => stockTotal(p) === 0).length} />
      </div>

      <AdminToolbar
        search={
          <AdminSearch value={pagination.query} onChange={pagination.setQuery} placeholder="Buscar por nombre o SKU…" />
        }
      />
      <AdminTable
        columns={columns}
        rows={pagination.pageItems}
        empty={status === "loading" ? "Cargando productos…" : "Todavía no hay productos."}
        emptyAction={status === "loading" ? null : <AdminButton onClick={abrirNuevo}>Crear el primero</AdminButton>}
      />
      <AdminPagination {...pagination} onPageChange={pagination.setPage} />

      {stockActual ? <StockModal product={stockActual} onClose={() => setStockProduct(null)} /> : null}

      <AdminModal
        open={editing != null}
        title={isNew ? "Nuevo producto" : "Editar producto"}
        onClose={() => setEditing(null)}
        dirty={dirty}
        footer={
          <AdminModalActions
            formId={FORM_ID}
            saving={saving}
            dirty={dirty}
            submitLabel={isNew ? "Crear producto" : "Guardar cambios"}
            onCancel={() => setEditing(null)}
          />
        }
      >
        <form id={FORM_ID} onSubmit={guardar}>
          {formError ? <AdminAlert type="error">{formError}</AdminAlert> : null}

          <AdminSection title="Datos" description="Lo que se ve en la tienda.">
            <AdminField label="Nombre" required span={2}>
              <AdminInput value={form.name} onChange={(e) => set("name", e.target.value)} required />
            </AdminField>
            <AdminField label="Slug (URL)" hint="Vacío = se arma con el nombre.">
              <AdminInput value={form.slug} onChange={(e) => set("slug", e.target.value)} />
            </AdminField>
            <AdminField label="Estado">
              <AdminSelect value={form.status} onChange={(e) => set("status", e.target.value)}>
                <option value="DRAFT">Borrador (no se ve)</option>
                <option value="PUBLISHED">Publicado</option>
              </AdminSelect>
            </AdminField>
            {TIENDA_SOLO_LIBROS ? (
              <AdminField label="Tipo" hint="Por ahora la tienda vende solo libros, con envío.">
                <AdminInput value="Libro (físico)" disabled />
              </AdminField>
            ) : (
              <>
                <AdminField label="Tipo">
                  <AdminSelect value={form.type} onChange={(e) => set("type", e.target.value)}>
                    {Object.entries(TIPOS_PRODUCTO).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
                <AdminField label="Entrega" hint={isNew ? null : "Cambiarla afecta envío y stock."}>
                  <AdminSelect value={form.fulfillment} onChange={(e) => set("fulfillment", e.target.value)}>
                    {Object.entries(ENTREGAS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </AdminSelect>
                </AdminField>
              </>
            )}
            <AdminField label="Categoría">
              <AdminSelect value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </AdminSelect>
            </AdminField>
            <AdminField label="Nueva categoría" hint="Escribila y tocá Agregar.">
              <div className="mt-1 flex gap-2">
                <AdminInput
                  className="!mt-0"
                  value={nuevaCategoria}
                  onChange={(e) => setNuevaCategoria(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") agregarCategoria(e);
                  }}
                />
                <AdminButton variante="secondary" onClick={agregarCategoria}>
                  Agregar
                </AdminButton>
              </div>
            </AdminField>
            <AdminField label="Descripción corta" span={2}>
              <AdminInput value={form.shortDescription} onChange={(e) => set("shortDescription", e.target.value)} />
            </AdminField>
            <AdminField label="Descripción" span={2}>
              <AdminTextarea value={form.description} onChange={(e) => set("description", e.target.value)} />
            </AdminField>
            <AdminField
              label="Imágenes"
              span={2}
              hint="Una URL por línea; la primera es la principal. Con backend se elegirán de la biblioteca de Imágenes."
            >
              <AdminTextarea rows={3} value={form.images} onChange={(e) => set("images", e.target.value)} />
            </AdminField>
          </AdminSection>

          <AdminSection
            title="Variantes"
            description={
              digital
                ? "Cada licencia con su precio (ej. uso personal / comercial). Los digitales no manejan stock."
                : isNew
                  ? "Cada opción con su precio y stock inicial. Después el stock se ajusta desde el botón Stock."
                  : "El stock se cambia desde el botón Stock para que quede en el historial."
            }
          >
            <div className="flex flex-col gap-3 sm:col-span-2">
              {form.variants.map((v, i) => (
                <div
                  key={v.id || `nueva-${i}`}
                  className="grid gap-3 border border-[var(--admin-border)] p-3 sm:grid-cols-4"
                  style={{ borderRadius: "var(--radius-md)" }}
                >
                  <AdminField label="Nombre" required>
                    <AdminInput value={v.name} onChange={(e) => setVariant(i, "name", e.target.value)} placeholder="Ej. Edición bilingüe" />
                  </AdminField>
                  <AdminField label="SKU">
                    <AdminInput value={v.sku} onChange={(e) => setVariant(i, "sku", e.target.value)} />
                  </AdminField>
                  <AdminField label="Precio ($)" required>
                    <AdminInput type="number" min="1" value={v.price} onChange={(e) => setVariant(i, "price", e.target.value)} required />
                  </AdminField>
                  {digital ? (
                    <>
                      <AdminField label="Resolución">
                        <AdminInput value={v.resolution} onChange={(e) => setVariant(i, "resolution", e.target.value)} placeholder="6000 × 4000 px" />
                      </AdminField>
                      <AdminField label="Licencia" span={2}>
                        <AdminInput value={v.license} onChange={(e) => setVariant(i, "license", e.target.value)} placeholder="Uso personal, no comercial" />
                      </AdminField>
                    </>
                  ) : (
                    <>
                      <AdminField label={isNew || !v.id ? "Stock inicial" : "Stock actual"}>
                        <AdminInput
                          type="number"
                          min="0"
                          value={v.stock}
                          onChange={(e) => setVariant(i, "stock", e.target.value)}
                          disabled={!isNew && Boolean(v.id)}
                        />
                      </AdminField>
                      <AdminField label="Alerta de stock bajo" hint="Avisa con esta cantidad o menos.">
                        <AdminInput type="number" min="0" value={v.lowStockThreshold} onChange={(e) => setVariant(i, "lowStockThreshold", e.target.value)} />
                      </AdminField>
                      <AdminField label="Peso (g)" hint="Para cotizar Andreani.">
                        <AdminInput type="number" min="0" value={v.weightGrams} onChange={(e) => setVariant(i, "weightGrams", e.target.value)} />
                      </AdminField>
                    </>
                  )}
                  {form.variants.length > 1 ? (
                    <div className="flex items-end">
                      <AdminButton
                        variante="danger"
                        tamano="sm"
                        onClick={() => {
                          setForm((f) => ({ ...f, variants: f.variants.filter((_, idx) => idx !== i) }));
                          setDirty(true);
                        }}
                      >
                        Quitar variante
                      </AdminButton>
                    </div>
                  ) : null}
                </div>
              ))}
              <div>
                <AdminButton
                  variante="secondary"
                  tamano="sm"
                  onClick={() => {
                    setForm((f) => ({ ...f, variants: [...f.variants, emptyVariant()] }));
                    setDirty(true);
                  }}
                >
                  + Agregar variante
                </AdminButton>
              </div>
            </div>
          </AdminSection>
        </form>
      </AdminModal>
    </div>
  );
}
