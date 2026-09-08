import { Pendiente } from "./Pendiente";
import { Portadilla } from "./Portadilla";

export function SeccionShop() {
  return (
    <section>
      <Portadilla id="shop" titulo="Comprar el libro" kicker="Buy the book" />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        <p className="font-light leading-relaxed">
          Edición bilingüe español/inglés. 324 páginas. Tirada de 1000 ejemplares. ISBN
          978-631-01-7027-5.
        </p>
        <div className="mt-8">
          {/* PENDIENTE: shop link */}
          <Pendiente titulo="Pendiente — Amazon y entrega en todo el país">
            Falta el link de Amazon (o el canal de venta que corresponda) y confirmar la política de
            entrega en todo el país que el cliente quiere mostrar.
          </Pendiente>
        </div>
      </div>
    </section>
  );
}

export function SeccionVideo() {
  return (
    <section>
      <Portadilla
        id="video"
        titulo="Video resumen de las fiestas"
        kicker="Festival summary video"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {/* PENDIENTE: YouTube embed */}
        <Pendiente titulo="Pendiente — YouTube">
          Falta el link o ID del video (y del canal) para embeber el resumen de las fiestas.
        </Pendiente>
        <div className="mt-6 aspect-video w-full border border-dashed border-azul-logo/40 bg-papel" />
      </div>
    </section>
  );
}

export function SeccionPapaLeon() {
  return (
    <section>
      <Portadilla
        id="papa-leon"
        titulo="Entrega al papa León XIV"
        kicker="Presenting the book to Pope Leo XIV"
      />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {/* PENDIENTE: foto entrega del libro al Papa León XIV */}
        <Pendiente titulo="Pendiente — fotografía">
          La foto de la entrega del libro al papa León XIV en Argentina no está en el PDF. Hay que
          pedirla al cliente.
        </Pendiente>
        <div className="mt-6 aspect-[4/3] w-full border border-dashed border-azul-logo/40 bg-papel" />
      </div>
    </section>
  );
}

export function SeccionRedes() {
  return (
    <section>
      <Portadilla id="redes" titulo="Redes" kicker="Instagram and Facebook" />
      <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
        {/* PENDIENTE: links de Instagram y Facebook */}
        <Pendiente titulo="Pendiente — cuentas">
          Faltan los links de Instagram y Facebook para que se puedan clickear.
        </Pendiente>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <span className="border border-dashed border-azul-logo/50 px-4 py-3 text-azul-logo">
            Instagram
          </span>
          <span className="border border-dashed border-azul-logo/50 px-4 py-3 text-azul-logo">
            Facebook
          </span>
        </div>
      </div>
    </section>
  );
}
