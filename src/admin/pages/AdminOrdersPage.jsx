import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  createOrderShipment,
  fetchAdminOrders,
  updateOrderStatus,
} from "../../redux/slices/ordersSlice";
import { USE_MOCKS, adminOrdersService, mockControls } from "../../services";
import { useAdminPagination } from "../hooks/useAdminPagination";
import { AdminButton } from "../components/AdminButton";
import { useAdminConfirm } from "../components/AdminConfirm";
import { useAdminToast } from "../components/AdminToast";
import { AdminModal } from "../components/AdminModal";
import {
  AdminAlert,
  AdminField,
  AdminPageHeader,
  AdminPagination,
  AdminSearch,
  AdminSelect,
  AdminStatCard,
  AdminTable,
  AdminToolbar,
} from "../components/AdminForm";
import {
  ESTADOS_PEDIDO,
  TRANSICIONES_PEDIDO,
  estadoPedido,
  formatFecha,
  formatPrecio,
} from "../../utils/tienda";

const TONO_COLOR = {
  ok: "var(--admin-success)",
  error: "var(--admin-danger)",
  pendiente: "var(--admin-warning)",
  info: "var(--admin-accent)",
};

function OrderBadge({ status }) {
  const { label, tono } = estadoPedido(status);
  const color = TONO_COLOR[tono];
  return (
    <span
      className="inline-flex items-center whitespace-nowrap px-2 py-0.5 text-xs font-medium"
      style={{
        color,
        background: `color-mix(in srgb, ${color} 10%, white)`,
        border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
        borderRadius: "var(--radius-sm)",
      }}
    >
      {label}
    </span>
  );
}

const ESTADOS_PAGO = {
  created: "sin iniciar",
  in_process: "en proceso",
  approved: "aprobado",
  rejected: "rechazado",
};

function envioResumen(order) {
  if (!order.shipping) return "Digital";
  if (order.shipping.type === "pickup") return "Retiro";
  return order.shipping.type === "branch" ? "Sucursal" : "Domicilio";
}

const filterOrders = (list, q) =>
  !q
    ? list
    : list.filter(
        (o) =>
          o.number.toLowerCase().includes(q) ||
          `${o.buyer.firstName} ${o.buyer.lastName}`.toLowerCase().includes(q) ||
          o.buyer.email.toLowerCase().includes(q),
      );

export function AdminOrdersPage() {
  const dispatch = useDispatch();
  const items = useSelector((s) => s.orders.adminItems);
  const status = useSelector((s) => s.orders.status);
  const error = useSelector((s) => s.orders.error);
  const toast = useAdminToast();
  const confirm = useAdminConfirm();

  const [filtroEstado, setFiltroEstado] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [busy, setBusy] = useState(null);

  const cargar = useCallback(() => dispatch(fetchAdminOrders()), [dispatch]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const porEstado = useMemo(
    () => (filtroEstado ? items.filter((o) => o.status === filtroEstado) : items),
    [items, filtroEstado],
  );
  const pagination = useAdminPagination(porEstado, { filterFn: filterOrders });
  const selected = items.find((o) => o.id === selectedId) || null;
  const transiciones = selected ? TRANSICIONES_PEDIDO[selected.status] || [] : [];

  const count = (st) => items.filter((o) => o.status === st).length;

  function abrir(order) {
    setSelectedId(order.id);
    setNuevoEstado("");
  }

  async function guardarEstado() {
    if (!nuevoEstado) return;
    if (nuevoEstado === "cancelled") {
      const ok = await confirm.ask({
        title: "Cancelar pedido",
        message: `¿Cancelar el pedido ${selected.number}? Si estaba pago, el stock vuelve al inventario. El reintegro del dinero se hace desde Mercado Pago.`,
        confirmLabel: "Cancelar pedido",
      });
      if (!ok) return;
    }
    setBusy("estado");
    try {
      await dispatch(updateOrderStatus({ id: selected.id, status: nuevoEstado })).unwrap();
      toast.push({ type: "success", message: `Pedido ${selected.number}: ${estadoPedido(nuevoEstado).label}` });
      setNuevoEstado("");
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    } finally {
      setBusy(null);
    }
  }

  async function generarEnvio() {
    setBusy("envio");
    try {
      const order = await dispatch(createOrderShipment(selected.id)).unwrap();
      toast.push({
        type: "success",
        message: `Envío generado. Seguimiento: ${order.shipping.trackingNumber}`,
      });
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    } finally {
      setBusy(null);
    }
  }

  async function descargarEtiqueta() {
    setBusy("etiqueta");
    try {
      const url = await adminOrdersService.labelUrl(selected.id);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiqueta-${selected.number}${USE_MOCKS ? ".txt" : ".pdf"}`;
      a.target = "_blank";
      a.rel = "noopener";
      a.click();
    } catch (err) {
      toast.push({ type: "error", message: err.message });
    } finally {
      setBusy(null);
    }
  }

  async function reiniciarSimulacion() {
    const ok = await confirm.ask({
      title: "Reiniciar simulación",
      message: "Se borran los pedidos simulados y el stock vuelve a los valores iniciales.",
      confirmLabel: "Reiniciar",
    });
    if (!ok) return;
    mockControls.reset();
    cargar();
    toast.push({ type: "success", message: "Datos de simulación reiniciados." });
  }

  const columns = [
    {
      key: "number",
      label: "Pedido",
      render: (o) => (
        <button type="button" className="font-medium text-[var(--admin-accent)] hover:underline" onClick={() => abrir(o)}>
          {o.number}
        </button>
      ),
    },
    { key: "createdAt", label: "Fecha", render: (o) => <span className="whitespace-nowrap">{formatFecha(o.createdAt)}</span> },
    {
      key: "buyer",
      label: "Comprador",
      render: (o) => (
        <span>
          {o.buyer.firstName} {o.buyer.lastName}
          <span className="block text-xs text-[var(--admin-text-muted)]">{o.buyer.email}</span>
        </span>
      ),
    },
    { key: "total", label: "Total", render: (o) => formatPrecio(o.total) },
    { key: "envio", label: "Entrega", render: envioResumen },
    { key: "status", label: "Estado", render: (o) => <OrderBadge status={o.status} /> },
    {
      key: "acciones",
      label: "",
      render: (o) => (
        <AdminButton variante="secondary" tamano="sm" onClick={() => abrir(o)}>
          Ver
        </AdminButton>
      ),
    },
  ];

  const tieneEnvioAndreani = selected?.shipping && selected.shipping.type !== "pickup";

  return (
    <div>
      {confirm.dialog}
      <AdminPageHeader
        title="Pedidos"
        subtitle="Compras de la tienda: estado del pago, preparación y envío por Andreani."
        actions={
          <>
            <AdminButton variante="secondary" onClick={cargar} disabled={status === "loading"}>
              {status === "loading" ? "Actualizando…" : "Actualizar"}
            </AdminButton>
            {USE_MOCKS ? (
              <AdminButton variante="ghost" onClick={reiniciarSimulacion}>
                Reiniciar simulación
              </AdminButton>
            ) : null}
          </>
        }
      />

      {USE_MOCKS ? (
        <div className="mb-4">
          <AdminAlert>
            Modo simulación: los pedidos salen de compras hechas en la tienda de este navegador.
          </AdminAlert>
        </div>
      ) : null}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Esperando pago" value={count("pending_payment")} />
        <AdminStatCard label="Para preparar" value={count("paid")} hint="Pagos aprobados" />
        <AdminStatCard label="En preparación" value={count("preparing")} />
        <AdminStatCard label="Enviados" value={count("shipped")} />
      </div>

      {error && status === "failed" ? (
        <div className="mb-4">
          <AdminAlert type="error">{error}</AdminAlert>
        </div>
      ) : null}

      <AdminToolbar
        search={
          <AdminSearch
            value={pagination.query}
            onChange={pagination.setQuery}
            placeholder="Buscar por número, nombre o email…"
          />
        }
      >
        <AdminSelect
          value={filtroEstado}
          onChange={(e) => {
            setFiltroEstado(e.target.value);
            pagination.setPage(1);
          }}
          aria-label="Filtrar por estado"
          className="!w-auto"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADOS_PEDIDO).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </AdminSelect>
      </AdminToolbar>

      <AdminTable
        columns={columns}
        rows={pagination.pageItems}
        empty={
          status === "loading"
            ? "Cargando pedidos…"
            : pagination.query || filtroEstado
              ? "No hay pedidos con esos filtros."
              : "Todavía no hay pedidos."
        }
      />
      <AdminPagination {...pagination} onPageChange={pagination.setPage} />

      <AdminModal
        open={Boolean(selected)}
        title={selected ? `Pedido ${selected.number}` : ""}
        subtitle={selected ? formatFecha(selected.createdAt) : ""}
        onClose={() => setSelectedId(null)}
        footer={
          <AdminButton variante="secondary" onClick={() => setSelectedId(null)}>
            Cerrar
          </AdminButton>
        }
      >
        {selected ? (
          <div className="flex flex-col gap-6 text-sm">
            <div className="flex flex-wrap items-center gap-3">
              <OrderBadge status={selected.status} />
              <span className="text-[var(--admin-text-muted)]">
                Pago en Mercado Pago: {ESTADOS_PAGO[selected.payment?.status] || selected.payment?.status || "—"}
              </span>
            </div>

            <section>
              <h3 className="mb-2 font-semibold">Comprador</h3>
              <p>
                {selected.buyer.firstName} {selected.buyer.lastName} · DNI {selected.buyer.dni}
              </p>
              <p>
                {selected.buyer.email} · {selected.buyer.phone}
              </p>
            </section>

            <section>
              <h3 className="mb-2 font-semibold">Productos</h3>
              <ul className="flex flex-col gap-1">
                {selected.items.map((i) => (
                  <li key={i.variantId} className="flex justify-between gap-3">
                    <span>
                      {i.quantity} × {i.productName}
                      {i.variantName ? ` (${i.variantName})` : ""}
                      {i.fulfillment === "digital" ? " · digital" : ""}
                    </span>
                    <span>{formatPrecio(i.total)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-2 border-t border-[var(--admin-border)] pt-2">
                <p className="flex justify-between">
                  <span>Envío</span>
                  <span>{formatPrecio(selected.shippingCost)}</span>
                </p>
                <p className="flex justify-between font-semibold">
                  <span>Total cobrado</span>
                  <span>{formatPrecio(selected.total)}</span>
                </p>
              </div>
            </section>

            {selected.shipping ? (
              <section>
                <h3 className="mb-2 font-semibold">Envío</h3>
                <p>{selected.shipping.optionName}</p>
                <p className="text-[var(--admin-text-muted)]">
                  {selected.shipping.type === "home" && selected.shipping.address
                    ? `${selected.shipping.address.street} ${selected.shipping.address.number} ${selected.shipping.address.apartment || ""}, ${selected.shipping.address.city}, ${selected.shipping.address.province} (CP ${selected.shipping.postalCode})`
                    : selected.shipping.type === "branch"
                      ? `${selected.shipping.branch?.name} — ${selected.shipping.branch?.address}`
                      : selected.shipping.pickupAddress}
                </p>
                {selected.shipping.trackingNumber ? (
                  <p className="mt-1">
                    Seguimiento Andreani: <strong>{selected.shipping.trackingNumber}</strong>
                  </p>
                ) : null}
                {tieneEnvioAndreani ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!selected.shipping.trackingNumber ? (
                      <AdminButton
                        onClick={generarEnvio}
                        disabled={busy != null || !["paid", "preparing"].includes(selected.status)}
                        title={
                          ["paid", "preparing"].includes(selected.status)
                            ? undefined
                            : "Solo para pedidos pagos"
                        }
                      >
                        {busy === "envio" ? "Generando…" : "Generar envío Andreani"}
                      </AdminButton>
                    ) : null}
                    {selected.shipping.labelAvailable ? (
                      <AdminButton variante="secondary" onClick={descargarEtiqueta} disabled={busy != null}>
                        {busy === "etiqueta" ? "Descargando…" : "Descargar etiqueta"}
                      </AdminButton>
                    ) : null}
                  </div>
                ) : null}
              </section>
            ) : null}

            {transiciones.length ? (
              <section>
                <h3 className="mb-2 font-semibold">Cambiar estado</h3>
                <div className="flex flex-wrap items-end gap-2">
                  <AdminField label="Nuevo estado" className="min-w-[12rem] flex-1">
                    <AdminSelect value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
                      <option value="">Elegí…</option>
                      {transiciones.map((st) => (
                        <option key={st} value={st}>
                          {estadoPedido(st).label}
                        </option>
                      ))}
                    </AdminSelect>
                  </AdminField>
                  <AdminButton onClick={guardarEstado} disabled={!nuevoEstado || busy != null}>
                    {busy === "estado" ? "Guardando…" : "Guardar"}
                  </AdminButton>
                </div>
              </section>
            ) : null}

            <section>
              <h3 className="mb-2 font-semibold">Historial</h3>
              <ol className="flex flex-col gap-1 text-[var(--admin-text-muted)]">
                {[...selected.history].reverse().map((h, idx) => (
                  <li key={`${h.at}-${idx}`}>
                    {formatFecha(h.at)} — {h.note || estadoPedido(h.status).label}
                  </li>
                ))}
              </ol>
            </section>
          </div>
        ) : null}
      </AdminModal>
    </div>
  );
}
