import { Link } from "react-router-dom";
import { EncabezadoTienda } from "../../components/tienda/TiendaUI";
import { useMetaPagina } from "../../hooks/useMetaPagina";
import { EDAD_MINIMA } from "../../utils/comunidad";

function AvisoRevisar() {
  return (
    <p className="mb-6 border-2 border-dashed border-naranja-libro bg-papel px-4 py-3 text-sm font-medium text-azul-petroleo" role="note">
      Texto de ejemplo — a revisar por un profesional antes de abrir la comunidad.
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

export function PaginaNormas() {
  useMetaPagina({ title: "Normas de la comunidad", description: "Cómo convivimos en la comunidad de Fiestas Religiosas." });
  return (
    <article>
      <EncabezadoTienda titulo="Normas de la comunidad" kicker="Comunidad" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <AvisoRevisar />
        <p>
          La comunidad es un lugar para compartir lo que vivimos en las fiestas populares y religiosas de la Argentina. Para que siga siendo un espacio cálido, te pedimos:
        </p>
        <Seccion titulo="1. Respeto a todas las creencias">
          <p>
            Acá conviven católicos, devotos populares, personas de otras religiones y quienes se acercan por la cultura o la fotografía. No se aceptan burlas, descalificaciones ni discusiones sobre qué fe o devoción es “la correcta”.
          </p>
        </Seccion>
        <Seccion titulo="2. Solo fotos y textos propios">
          <p>
            Publicá fotos que hayas sacado vos. Si usás una foto de otra persona, necesitás su permiso y tenés que mencionarla. No copies textos de otros sitios.
          </p>
        </Seccion>
        <Seccion titulo="3. Cuidá la privacidad de los demás">
          <p>
            No publiques datos personales de terceros (teléfonos, direcciones, documentos). Evitá primeros planos de personas sin su consentimiento, sobre todo de chicos y chicas, y de momentos íntimos como promesas o sanaciones.
          </p>
        </Seccion>
        <Seccion titulo="4. Nada de publicidad ni spam">
          <p>Están prohibidas las promociones, ventas, excursiones pagas, links de afiliados y los mensajes repetidos.</p>
        </Seccion>
        <Seccion titulo="5. Información verdadera">
          <p>Contá lo que viviste. Si das datos (fechas, horarios, recorridos), que sean confiables o aclará que no estás seguro.</p>
        </Seccion>
        <Seccion titulo="6. Cómo moderamos">
          <ul className="list-disc pl-5">
            <li>Las publicaciones de las cuentas nuevas se revisan antes de mostrarse.</li>
            <li>Cualquier persona puede denunciar contenido. Con varias denuncias, el contenido se oculta hasta que lo revisemos.</li>
            <li>Si no se cumplen estas normas podemos quitar el contenido y suspender la cuenta por 7 días, 30 días o de forma permanente.</li>
          </ul>
        </Seccion>
        <Seccion titulo="7. Edad mínima">
          <p>Para tener una cuenta tenés que tener {EDAD_MINIMA} años o más.</p>
        </Seccion>
        <p className="mt-8 text-sm">
          Ver también la <Link to="/privacidad" className="text-celeste-cielo underline">política de privacidad</Link>.
        </p>
      </div>
    </article>
  );
}

export function PaginaPrivacidad() {
  useMetaPagina({ title: "Política de privacidad", description: "Cómo tratamos tus datos personales (Ley 25.326)." });
  return (
    <article>
      <EncabezadoTienda titulo="Política de privacidad" kicker="Legales" />
      <div className="mx-auto max-w-3xl px-4 py-8">
        <AvisoRevisar />
        <Seccion titulo="1. Responsable de los datos">
          <p>
            [RAZÓN SOCIAL O NOMBRE], CUIT [XX-XXXXXXXX-X], con domicilio en [DIRECCIÓN], es responsable de la base de datos. Contacto: [EMAIL DE PRIVACIDAD].
          </p>
        </Seccion>
        <Seccion titulo="2. Qué datos recolectamos">
          <ul className="list-disc pl-5">
            <li>Cuenta de la comunidad: nombre, nombre de usuario, email, contraseña (guardada cifrada), provincia y foto de perfil opcionales.</li>
            <li>Lo que publicás: textos, fotos, comentarios, me gusta y denuncias.</li>
            <li>Compras en la tienda: datos de contacto, DNI y domicilio de envío.</li>
            <li>Datos técnicos mínimos para seguridad (dirección IP, navegador) y una cookie de sesión.</li>
          </ul>
        </Seccion>
        <Seccion titulo="3. Para qué los usamos">
          <p>
            Para que puedas usar la comunidad y la tienda, mostrar tus publicaciones, moderar el contenido, mandarte emails de la cuenta (confirmación, recuperación de contraseña, avisos de moderación) y prevenir abusos. No vendemos ni cedemos tus datos a terceros con fines comerciales.
          </p>
        </Seccion>
        <Seccion titulo="4. Con quién los compartimos">
          <p>
            Con proveedores que nos ayudan a operar el sitio: alojamiento (Vercel, DonWeb), imágenes (Cloudinary), envío de emails, verificación anti-bots (Cloudflare Turnstile) y, en la tienda, Mercado Pago y Andreani.
          </p>
        </Seccion>
        <Seccion titulo="5. Tus derechos">
          <p>
            Podés acceder, rectificar, actualizar y suprimir tus datos en cualquier momento. Desde{" "}
            <Link to="/comunidad/mi-cuenta" className="text-celeste-cielo underline">Mi cuenta</Link> podés descargar tus datos y eliminar tu cuenta.
          </p>
          <p>
            El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses, salvo que se acredite un interés legítimo al efecto conforme lo establecido en el artículo 14, inciso 3 de la Ley Nº 25.326. La AGENCIA DE ACCESO A LA INFORMACIÓN PÚBLICA, en su carácter de Órgano de Control de la Ley Nº 25.326, tiene la atribución de atender las denuncias y reclamos que interpongan quienes resulten afectados en sus derechos por incumplimiento de las normas vigentes en materia de protección de datos personales.
          </p>
        </Seccion>
        <Seccion titulo="6. Cuánto tiempo los guardamos">
          <p>
            Mientras tengas la cuenta activa. Si la eliminás, borramos tu perfil, publicaciones y fotos; los comentarios quedan anonimizados para no romper las conversaciones. Algunos registros de moderación y de compras se conservan el tiempo que exija la ley.
          </p>
        </Seccion>
        <Seccion titulo="7. Menores de edad">
          <p>La comunidad no está dirigida a menores de {EDAD_MINIMA} años.</p>
        </Seccion>
        <Seccion titulo="8. Cambios">
          <p>Si cambiamos esta política, lo vamos a avisar en el sitio y por email a las cuentas registradas.</p>
        </Seccion>
      </div>
    </article>
  );
}
