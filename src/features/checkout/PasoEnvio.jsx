import { useState } from "react";
import { shippingService } from "../../services";
import { Boton } from "../../components/ui/Boton";
import { Campo } from "../../components/tienda/TiendaUI";
import {
  PROVINCIAS,
  formatPrecio,
  validarCodigoPostal,
  validarRequerido,
} from "../../utils/tienda";

export function validarEnvio(envio) {
  const errs = {};
  if (!envio.quote) {
    errs.postalCode = validarCodigoPostal(envio.postalCode) || "Calculá el envío para seguir.";
    return errs;
  }
  const opcion = envio.quote.options.find((o) => o.id === envio.optionId);
  if (!opcion) {
    errs.optionId = "Elegí una opción de envío.";
    return errs;
  }
  if (opcion.type === "branch" && !envio.branchId) errs.branchId = "Elegí una sucursal.";
  if (opcion.type === "home") {
    const a = envio.address;
    const campos = {
      street: validarRequerido(a.street, "La calle"),
      number: validarRequerido(a.number, "La altura"),
      city: validarRequerido(a.city, "La localidad"),
      province: validarRequerido(a.province, "La provincia"),
    };
    Object.entries(campos).forEach(([k, v]) => {
      if (v) errs[`address.${k}`] = v;
    });
  }
  return errs;
}

function plazo(etaDays) {
  if (!etaDays) return null;
  return `Llega en ${etaDays.min} a ${etaDays.max} días hábiles`;
}

export function PasoEnvio({ value, onChange, errores, setErrores, items }) {
  const [cotizando, setCotizando] = useState(false);
  const [cargandoSucursales, setCargandoSucursales] = useState(false);
  const [errorSucursales, setErrorSucursales] = useState(null);

  const opcion = value.quote?.options.find((o) => o.id === value.optionId) || null;

  async function cotizar(e) {
    e.preventDefault();
    const err = validarCodigoPostal(value.postalCode);
    if (err) {
      setErrores({ postalCode: err });
      return;
    }
    setCotizando(true);
    setErrores({});
    try {
      const quote = await shippingService.quote({
        postalCode: value.postalCode.trim(),
        items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
      });
      onChange({ ...value, quote, optionId: "", branchId: "", branches: null });
    } catch (error) {
      onChange({ ...value, quote: null, optionId: "", branchId: "", branches: null });
      setErrores({
        postalCode:
          error.code === "SHIPPING_UNAVAILABLE"
            ? `${error.message} Probá con otro código postal.`
            : error.details?.fields?.postalCode || error.message,
      });
    } finally {
      setCotizando(false);
    }
  }

  async function elegirOpcion(option) {
    const next = { ...value, optionId: option.id, branchId: "" };
    onChange(next);
    setErrores({});
    if (option.type !== "branch" || value.branches) return;
    setCargandoSucursales(true);
    setErrorSucursales(null);
    try {
      const branches = await shippingService.branches({ postalCode: value.postalCode.trim() });
      onChange({ ...next, branches });
    } catch (error) {
      setErrorSucursales(error.message);
    } finally {
      setCargandoSucursales(false);
    }
  }

  const setAddress = (key) => (e) =>
    onChange({ ...value, address: { ...value.address, [key]: e.target.value } });

  const umbral = value.quote?.freeShippingThreshold;
  const faltaParaGratis = umbral != null ? umbral - value.quote.subtotal : null;

  return (
    <div className="mt-4 flex flex-col gap-6">
      <form onSubmit={cotizar} className="flex flex-wrap items-end gap-3" noValidate>
        <Campo
          id="postalCode"
          label="Código postal"
          required
          autoComplete="postal-code"
          inputMode="text"
          className="w-full max-w-[14rem]"
          value={value.postalCode}
          onChange={(e) => onChange({ ...value, postalCode: e.target.value, quote: null, optionId: "" })}
          error={errores.postalCode}
        />
        <Boton type="submit" disabled={cotizando} className="mb-[2px] disabled:opacity-60">
          {cotizando ? "Calculando…" : "Calcular envío"}
        </Boton>
      </form>

      {faltaParaGratis != null && faltaParaGratis > 0 ? (
        <p className="border border-naranja-libro/40 bg-papel px-4 py-2 text-sm" role="status">
          Te faltan {formatPrecio(faltaParaGratis)} para tener envío sin cargo.
        </p>
      ) : null}

      {value.quote ? (
        <fieldset aria-describedby={errores.optionId ? "optionId-error" : undefined}>
          <legend className="text-sm font-medium text-azul-petroleo">¿Cómo querés recibirlo?</legend>
          <div className="mt-2 flex flex-col gap-2">
            {value.quote.options.map((o) => (
              <label key={o.id} className="opcion-radio">
                <input
                  type="radio"
                  name="opcion-envio"
                  checked={value.optionId === o.id}
                  onChange={() => elegirOpcion(o)}
                  className="mt-1 accent-celeste-cielo"
                />
                <span className="flex-1">
                  <span className="flex justify-between gap-3 font-medium text-azul-petroleo">
                    <span>{o.name}</span>
                    <span>{o.price === 0 ? "Sin cargo" : formatPrecio(o.price)}</span>
                  </span>
                  <span className="block text-sm">
                    {[o.carrier, plazo(o.etaDays), o.address].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </label>
            ))}
          </div>
          {errores.optionId ? (
            <p id="optionId-error" className="campo-error">
              {errores.optionId}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {opcion?.type === "branch" ? (
        <fieldset aria-describedby={errores.branchId ? "branchId-error" : undefined}>
          <legend className="text-sm font-medium text-azul-petroleo">Elegí la sucursal</legend>
          {cargandoSucursales ? (
            <p className="mt-2 text-sm" role="status">
              Buscando sucursales cercanas…
            </p>
          ) : errorSucursales ? (
            <p className="campo-error" role="alert">
              {errorSucursales}{" "}
              <button type="button" className="underline" onClick={() => elegirOpcion(opcion)}>
                Reintentar
              </button>
            </p>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              {(value.branches || []).map((b) => (
                <label key={b.id} className="opcion-radio">
                  <input
                    type="radio"
                    name="sucursal"
                    checked={value.branchId === b.id}
                    onChange={() => {
                      onChange({ ...value, branchId: b.id });
                      setErrores({});
                    }}
                    className="mt-1 accent-celeste-cielo"
                  />
                  <span>
                    <span className="block font-medium text-azul-petroleo">{b.name}</span>
                    <span className="block text-sm">
                      {b.address}, {b.city}
                      {b.hours ? ` · ${b.hours}` : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          )}
          {errores.branchId ? (
            <p id="branchId-error" className="campo-error">
              {errores.branchId}
            </p>
          ) : null}
        </fieldset>
      ) : null}

      {opcion?.type === "home" ? (
        <fieldset className="grid gap-4 sm:grid-cols-2">
          <legend className="mb-2 text-sm font-medium text-azul-petroleo">Dirección de entrega</legend>
          <Campo id="street" label="Calle" required autoComplete="address-line1" value={value.address.street} onChange={setAddress("street")} error={errores["address.street"]} />
          <Campo id="number" label="Altura" required inputMode="numeric" value={value.address.number} onChange={setAddress("number")} error={errores["address.number"]} />
          <Campo id="apartment" label="Piso / depto (opcional)" autoComplete="address-line2" value={value.address.apartment} onChange={setAddress("apartment")} />
          <Campo id="city" label="Localidad" required autoComplete="address-level2" value={value.address.city} onChange={setAddress("city")} error={errores["address.city"]} />
          <Campo
            id="province"
            label="Provincia"
            as="select"
            required
            autoComplete="address-level1"
            value={value.address.province}
            onChange={setAddress("province")}
            error={errores["address.province"]}
          >
            <option value="">Elegí una provincia</option>
            {PROVINCIAS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </Campo>
        </fieldset>
      ) : null}
    </div>
  );
}
