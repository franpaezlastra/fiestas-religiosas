import { Campo } from "../../components/tienda/TiendaUI";
import {
  validarDni,
  validarEmail,
  validarRequerido,
  validarTelefono,
} from "../../utils/tienda";

export function validarComprador(c) {
  const errs = {
    firstName: validarRequerido(c.firstName, "El nombre"),
    lastName: validarRequerido(c.lastName, "El apellido"),
    email: validarEmail(c.email),
    phone: validarTelefono(c.phone),
    dni: validarDni(c.dni),
  };
  return Object.fromEntries(Object.entries(errs).filter(([, v]) => v));
}

export function PasoComprador({ value, onChange, errores }) {
  const set = (key) => (e) => onChange({ ...value, [key]: e.target.value });

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-2">
      <Campo id="firstName" label="Nombre" required autoComplete="given-name" value={value.firstName} onChange={set("firstName")} error={errores.firstName} />
      <Campo id="lastName" label="Apellido" required autoComplete="family-name" value={value.lastName} onChange={set("lastName")} error={errores.lastName} />
      <Campo
        id="email"
        label="Email"
        type="email"
        required
        autoComplete="email"
        value={value.email}
        onChange={set("email")}
        error={errores.email}
        hint="Te mandamos la confirmación y el seguimiento a este email."
      />
      <Campo
        id="phone"
        label="Teléfono"
        type="tel"
        required
        autoComplete="tel"
        inputMode="tel"
        value={value.phone}
        onChange={set("phone")}
        error={errores.phone}
        hint="Con código de área. Andreani lo usa para coordinar la entrega."
      />
      <Campo
        id="dni"
        label="DNI"
        required
        inputMode="numeric"
        value={value.dni}
        onChange={set("dni")}
        error={errores.dni}
        hint="Sin puntos. Lo pide Mercado Pago para la factura."
      />
    </div>
  );
}
