import { useState } from "react";
import { Link } from "react-router-dom";
import { ordersService } from "../../services";
import { Boton } from "../../components/ui/Boton";
import { Campo, EncabezadoTienda } from "../../components/tienda/TiendaUI";
import { validarEmail, validarRequerido } from "../../utils/tienda";

function AvisoRevisar() {
  return (
    <p className="mb-6 border-2 border-dashed border-naranja-libro bg-papel px-4 py-3 text-sm font-medium text-azul-petroleo" role="note">
      Texto de ejemplo — a revisar por un profesional antes de publicar la tienda.
    </p>
  );
}

function Seccion({ titulo, children }) {
  return (
    <section className="mt-8">
      <h2 className="subtitulo-seccion">{titulo}</h2>
      <div className="mt-2 flex flex-col gap-3">{children}</div>
    </section>
  );
}

export function PaginaTerminos() {
  return (
    <article>
      <EncabezadoTienda titulo="Términos y condiciones de compra" kicker="Legales" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <AvisoRevisar />
        <Seccion titulo="1. Vendedor">
          <p>
            Los productos son vendidos por [RAZÓN SOCIAL O NOMBRE], CUIT [XX-XXXXXXXX-X], con domicilio en
            [DIRECCIÓN]. Contacto: [EMAIL] · [TELÉFONO].
          </p>
        </Seccion>
        <Seccion titulo="2. Precios y pago">
          <p>
            Los precios están expresados en pesos argentinos e incluyen IVA. El total final, con el costo de
            envío, se muestra antes de pagar. El pago se procesa a través de Mercado Pago.
          </p>
        </Seccion>
        <Seccion titulo="3. Envíos">
          <p>
            Los libros se envían por Andreani a domicilio o a sucursal. Los plazos son estimados y
            corren desde que se acredita el pago.
          </p>
        </Seccion>
        <Seccion titulo="4. Revocación (arrepentimiento)">
          <p>
            Tenés 10 días corridos desde la entrega o la compra (lo que ocurra último) para revocar la compra
            sin dar motivos, según el artículo 34 de la Ley 24.240. Podés hacerlo desde el{" "}
            <Link to="/arrepentimiento" className="text-celeste-cielo underline">
              Botón de arrepentimiento
            </Link>
            .
          </p>
        </Seccion>
        <Seccion titulo="5. Datos personales">
          <p>
            Usamos tus datos solo para procesar la compra y el envío, según la Ley 25.326 de Protección de
            Datos Personales.
          </p>
        </Seccion>
      </div>
    </article>
  );
}

export function PaginaCambios() {
  return (
    <article>
      <EncabezadoTienda titulo="Cambios y devoluciones" kicker="Legales" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <AvisoRevisar />
        <Seccion titulo="Productos dañados o con fallas">
          <p>
            Si el libro llega dañado, escribinos a [EMAIL] dentro de los 30 días con una foto del producto y
            del embalaje. Coordinamos el cambio sin costo.
          </p>
        </Seccion>
        <Seccion titulo="Devoluciones">
          <p>
            Dentro de los 10 días corridos podés devolver el producto sin uso y en su embalaje original. Te
            reintegramos el total pagado por el mismo medio de pago.
          </p>
        </Seccion>
      </div>
    </article>
  );
}

const FORM_INICIAL = { fullName: "", email: "", orderNumber: "", reason: "" };

export function PaginaArrepentimiento() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [errorGeneral, setErrorGeneral] = useState(null);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function enviar(e) {
    e.preventDefault();
    if (enviando) return;
    const errs = Object.fromEntries(
      Object.entries({
        fullName: validarRequerido(form.fullName, "El nombre"),
        email: validarEmail(form.email),
        orderNumber: validarRequerido(form.orderNumber, "El número de pedido"),
      }).filter(([, v]) => v),
    );
    setErrores(errs);
    if (Object.keys(errs).length) return;
    setEnviando(true);
    setErrorGeneral(null);
    try {
      setResultado(await ordersService.requestWithdrawal(form));
    } catch (err) {
      setErrorGeneral(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section>
      <EncabezadoTienda titulo="Botón de arrepentimiento" kicker="Cancelar una compra" />
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p>
          Podés cancelar tu compra dentro de los 10 días corridos desde que la recibiste o la hiciste, sin dar
          motivos. Completá el formulario y te respondemos por email con los pasos a seguir.
        </p>

        {resultado ? (
          <div className="mt-6 border border-[#166534]/30 bg-[#f0fdf4] p-5" role="status">
            <p className="font-medium text-[#166534]">Recibimos tu solicitud.</p>
            <p className="mt-1">
              Número de trámite: <strong>{resultado.requestNumber}</strong>. Guardalo: te lo vamos a pedir si
              nos escribís.
            </p>
          </div>
        ) : (
          <form onSubmit={enviar} className="mt-6 flex flex-col gap-4" noValidate>
            <Campo id="fullName" label="Nombre y apellido" required autoComplete="name" value={form.fullName} onChange={set("fullName")} error={errores.fullName} />
            <Campo id="email" label="Email de la compra" type="email" required autoComplete="email" value={form.email} onChange={set("email")} error={errores.email} />
            <Campo
              id="orderNumber"
              label="Número de pedido"
              required
              placeholder="Ej. FR-1001"
              value={form.orderNumber}
              onChange={set("orderNumber")}
              error={errores.orderNumber}
              hint="Está en el email de confirmación."
            />
            <Campo id="reason" label="Motivo (opcional)" as="textarea" rows={3} value={form.reason} onChange={set("reason")} />
            {errorGeneral ? (
              <p className="text-[#b42318]" role="alert">
                {errorGeneral}
              </p>
            ) : null}
            <div>
              <Boton type="submit" disabled={enviando} className="disabled:opacity-60">
                {enviando ? "Enviando…" : "Solicitar la cancelación"}
              </Boton>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
