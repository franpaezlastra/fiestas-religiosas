import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useParams } from "react-router-dom";
import { fetchShopProduct } from "../../redux/slices/shopSlice";
import { addItem } from "../../redux/slices/cartSlice";
import { Boton } from "../../components/ui/Boton";
import { MensajeTienda, SelectorCantidad } from "../../components/tienda/TiendaUI";
import { formatPrecio } from "../../utils/tienda";

function textoStock(variant, digital) {
  if (digital) return "Descarga digital inmediata después del pago";
  if (!variant.available) return "Sin stock";
  if (variant.stock <= 5) return `Últimas ${variant.stock} unidades`;
  return "En stock";
}

export function PaginaProducto() {
  const { slug } = useParams();
  const dispatch = useDispatch();
  const entry = useSelector((s) => s.shop.bySlug[slug]);
  const enCarrito = useSelector((s) => s.cart.items);
  const product = entry?.item;

  const [imagen, setImagen] = useState(0);
  const [variantId, setVariantId] = useState(null);
  const [cantidad, setCantidad] = useState(1);

  useEffect(() => {
    dispatch(fetchShopProduct(slug));
  }, [dispatch, slug]);

  useEffect(() => {
    if (!product) return;
    setImagen(0);
    setCantidad(1);
    setVariantId((product.variants.find((v) => v.available) || product.variants[0])?.id);
  }, [product]);

  if (!entry || (entry.status === "loading" && !product)) {
    return (
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-2" aria-busy="true">
        <span className="sr-only" role="status">
          Cargando producto…
        </span>
        <div className="tienda-skeleton aspect-square" />
        <div className="flex flex-col gap-3">
          <div className="tienda-skeleton h-4 w-1/4" />
          <div className="tienda-skeleton h-10 w-4/5" />
          <div className="tienda-skeleton h-6 w-1/3" />
          <div className="tienda-skeleton h-24 w-full" />
        </div>
      </div>
    );
  }

  if (entry.status === "failed") {
    const noExiste = entry.error?.code === "NOT_FOUND";
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <MensajeTienda
          tono={noExiste ? "info" : "error"}
          titulo={noExiste ? "Este producto no está disponible" : "No pudimos cargar el producto"}
          texto={noExiste ? "Puede que se haya dado de baja." : entry.error?.message}
          accion={
            noExiste ? (
              <Boton to="/tienda">Volver a la tienda</Boton>
            ) : (
              <Boton onClick={() => dispatch(fetchShopProduct(slug))}>Reintentar</Boton>
            )
          }
        />
      </div>
    );
  }

  const digital = product.fulfillment === "digital";
  const variant = product.variants.find((v) => v.id === variantId) || product.variants[0];
  const yaEnCarrito = enCarrito.find((i) => i.variantId === variant.id)?.quantity || 0;
  const maxCantidad = digital ? 1 : Math.max(0, (variant.stock ?? 0) - yaEnCarrito);
  const puedeAgregar = variant.available && maxCantidad > 0;
  const imagenActual = product.images[imagen] || product.images[0];

  function agregar() {
    dispatch(
      addItem({
        quantity: digital ? 1 : cantidad,
        item: {
          productId: product.id,
          variantId: variant.id,
          slug: product.slug,
          name: product.name,
          variantName: product.variants.length > 1 ? variant.name : null,
          price: variant.price,
          image: product.images[0]?.url || null,
          stock: variant.stock,
          fulfillment: product.fulfillment,
        },
      }),
    );
    setCantidad(1);
  }

  return (
    <div className="bg-papel">
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
        <nav aria-label="Migas de pan" className="mb-6 text-sm">
          <Link to="/tienda" className="text-celeste-cielo hover:text-azul-petroleo">
            Tienda
          </Link>
          {product.category ? (
            <>
              {" / "}
              <Link
                to={`/tienda?categoria=${product.category.slug}`}
                className="text-celeste-cielo hover:text-azul-petroleo"
              >
                {product.category.name}
              </Link>
            </>
          ) : null}
        </nav>

        <div className="grid gap-8 md:grid-cols-2 md:gap-12">
          <div>
            <div className="foto-libro aspect-square bg-blanco">
              {imagenActual ? (
                <img src={imagenActual.url} alt={imagenActual.alt || product.name} />
              ) : null}
            </div>
            {product.images.length > 1 ? (
              <ul className="mt-3 grid grid-cols-4 gap-2" aria-label="Imágenes del producto">
                {product.images.map((img, i) => (
                  <li key={img.url}>
                    <button
                      type="button"
                      className={`foto-libro block aspect-square w-full ${
                        i === imagen ? "ring-2 ring-celeste-cielo" : "opacity-80 hover:opacity-100"
                      }`}
                      aria-label={`Ver imagen ${i + 1} de ${product.images.length}`}
                      aria-pressed={i === imagen}
                      onClick={() => setImagen(i)}
                    >
                      <img src={img.url} alt="" loading="lazy" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div>
            <p className="font-display text-xs uppercase tracking-wide text-celeste-cielo">
              {product.category?.name}
            </p>
            <h1 className="font-display text-3xl leading-tight text-azul-petroleo md:text-4xl">
              {product.name}
            </h1>
            <p className="mt-3 text-2xl font-medium text-azul-petroleo">{formatPrecio(variant.price)}</p>

            {product.variants.length > 1 ? (
              <fieldset className="mt-6">
                <legend className="text-sm font-medium text-azul-petroleo">
                  {digital ? "Licencia" : "Opción"}
                </legend>
                <div className="mt-2 flex flex-col gap-2">
                  {product.variants.map((v) => (
                    <label key={v.id} className="opcion-radio">
                      <input
                        type="radio"
                        name="variante"
                        value={v.id}
                        checked={v.id === variant.id}
                        onChange={() => {
                          setVariantId(v.id);
                          setCantidad(1);
                        }}
                        className="mt-1 accent-celeste-cielo"
                      />
                      <span className="flex-1">
                        <span className="flex justify-between gap-3 font-medium text-azul-petroleo">
                          <span>{v.name}</span>
                          <span>{formatPrecio(v.price)}</span>
                        </span>
                        {v.digital ? (
                          <span className="block text-sm">
                            {v.digital.license} · {v.digital.resolution}
                          </span>
                        ) : !v.available ? (
                          <span className="block text-sm text-naranja-libro">Sin stock</span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <p
              className={`mt-5 text-sm font-medium ${
                variant.available ? "text-azul-petroleo" : "text-naranja-libro"
              }`}
            >
              {textoStock(variant, digital)}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              {!digital && puedeAgregar ? (
                <SelectorCantidad value={cantidad} max={maxCantidad} onChange={setCantidad} />
              ) : null}
              <Boton onClick={agregar} disabled={!puedeAgregar} className="disabled:opacity-50">
                {!variant.available
                  ? "Sin stock"
                  : maxCantidad === 0
                    ? digital
                      ? "Ya está en el carrito"
                      : "Ya tenés todo el stock en el carrito"
                    : "Agregar al carrito"}
              </Boton>
            </div>

            <div className="mt-8 border-t border-azul-logo/15 pt-6">
              <h2 className="subtitulo-seccion">Descripción</h2>
              <p className="mt-2">{product.description}</p>
              <p className="mt-4 text-sm">
                {digital
                  ? "Después del pago vas a recibir un link de descarga por email y en la página de tu pedido."
                  : "Envíos a todo el país por Andreani, a domicilio o a sucursal. Calculás el costo en el checkout."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
