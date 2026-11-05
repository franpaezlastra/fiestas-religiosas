import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { PageLoader } from "./components/ui/SectionLoader";
import { Inicio } from "./pages/Inicio";
import { USE_MOCKS } from "./services";
import { RequiereUsuario } from "./components/comunidad/Cuenta";

function lazyPage(factory) {
  const Comp = lazy(factory);
  return function LazyRoute(props) {
    return (
      <Suspense fallback={<PageLoader texto="Cargando página…" />}>
        <Comp {...props} />
      </Suspense>
    );
  };
}

/* Público — un chunk por feature (no un Paginas.jsx monolítico) */
const PaginaMapa = lazyPage(() =>
  import("./pages/Mapa").then((m) => ({ default: m.PaginaMapa })),
);
const PaginaGaleria = lazyPage(() =>
  import("./features/galeria/SeccionGaleria").then((m) => ({ default: m.SeccionGaleria })),
);
const PaginaFrancisco = lazyPage(() =>
  import("./features/francisco/SeccionBergoglio").then((m) => ({
    default: m.SeccionBergoglio,
  })),
);
const PaginaTresArgentinos = lazyPage(() =>
  import("./features/francisco/SeccionBergoglio").then((m) => ({
    default: m.SeccionTresArgentinos,
  })),
);
const PaginaEscritores = lazyPage(() =>
  import("./features/escritores/SeccionEscritores").then((m) => ({
    default: m.SeccionEscritores,
  })),
);
const PaginaSantos = lazyPage(() =>
  import("./features/santos/SeccionSantos").then((m) => ({ default: m.SeccionSantos })),
);
const PaginaAutor = lazyPage(() =>
  import("./features/autor/SeccionAutor").then((m) => ({ default: m.SeccionAutor })),
);
const PaginaVideo = lazyPage(() =>
  import("./features/pendientes/SeccionesPendientes").then((m) => ({
    default: m.SeccionVideo,
  })),
);
const PaginaCreditos = lazyPage(() =>
  import("./features/libro/SeccionCreditos").then((m) => ({ default: m.SeccionCreditos })),
);

/* Tienda */
const PaginaTienda = lazyPage(() =>
  import("./features/tienda/PaginaTienda").then((m) => ({ default: m.PaginaTienda })),
);
const PaginaProducto = lazyPage(() =>
  import("./features/tienda/PaginaProducto").then((m) => ({ default: m.PaginaProducto })),
);
const PaginaCarrito = lazyPage(() =>
  import("./features/tienda/PaginaCarrito").then((m) => ({ default: m.PaginaCarrito })),
);
const PaginaCheckout = lazyPage(() =>
  import("./features/checkout/PaginaCheckout").then((m) => ({ default: m.PaginaCheckout })),
);
const PaginaResultado = lazyPage(() =>
  import("./features/checkout/PaginaResultado").then((m) => ({ default: m.PaginaResultado })),
);
const PaginaPedido = lazyPage(() =>
  import("./features/checkout/PaginaPedido").then((m) => ({ default: m.PaginaPedido })),
);
const SimuladorPago = lazyPage(() =>
  import("./features/checkout/SimuladorPago").then((m) => ({ default: m.SimuladorPago })),
);
const PaginaTerminos = lazyPage(() =>
  import("./features/legales/PaginasLegales").then((m) => ({ default: m.PaginaTerminos })),
);
const PaginaCambios = lazyPage(() =>
  import("./features/legales/PaginasLegales").then((m) => ({ default: m.PaginaCambios })),
);
const PaginaArrepentimiento = lazyPage(() =>
  import("./features/legales/PaginasLegales").then((m) => ({ default: m.PaginaArrepentimiento })),
);

/* Comunidad: un chunk por grupo de páginas */
const comunidad = (name) =>
  lazyPage(() => import("./features/comunidad/PaginaComunidad").then((m) => ({ default: m[name] })));
const PaginaComunidad = comunidad("PaginaComunidad");
const PaginaPublicacion = lazyPage(() =>
  import("./features/comunidad/PaginaPublicacion").then((m) => ({ default: m.PaginaPublicacion })),
);
const PaginaPerfil = lazyPage(() =>
  import("./features/comunidad/PaginaPerfil").then((m) => ({ default: m.PaginaPerfil })),
);
const PaginaPublicar = lazyPage(() =>
  import("./features/comunidad/PaginaPublicar").then((m) => ({ default: m.PaginaPublicar })),
);
const acceso = (name) =>
  lazyPage(() => import("./features/comunidad/cuenta/PaginasAcceso").then((m) => ({ default: m[name] })));
const PaginaIngresar = acceso("PaginaIngresar");
const PaginaRegistro = acceso("PaginaRegistro");
const PaginaVerificar = acceso("PaginaVerificar");
const PaginaRecuperar = acceso("PaginaRecuperar");
const PaginaRestablecer = acceso("PaginaRestablecer");
const PaginaMiCuenta = lazyPage(() =>
  import("./features/comunidad/cuenta/PaginaMiCuenta").then((m) => ({ default: m.PaginaMiCuenta })),
);
const PaginaNormas = lazyPage(() =>
  import("./features/legales/PaginasComunidad").then((m) => ({ default: m.PaginaNormas })),
);
const PaginaPrivacidad = lazyPage(() =>
  import("./features/legales/PaginasComunidad").then((m) => ({ default: m.PaginaPrivacidad })),
);

const PaginaNovedades = lazyPage(() =>
  import("./features/libro/PaginaNovedades").then((m) => ({ default: m.PaginaNovedades })),
);
const PaginaNovedad = lazyPage(() =>
  import("./features/libro/PaginaNovedades").then((m) => ({ default: m.PaginaNovedad })),
);

/* Admin: chunk aparte; el QR público nunca lo baja */
const AdminLoginPage = lazyPage(() =>
  import("./admin/pages/AdminLoginPage").then((m) => ({ default: m.AdminLoginPage })),
);
const RequireAuth = lazyPage(() =>
  import("./admin/components/RequireAuth").then((m) => ({ default: m.RequireAuth })),
);
const AdminLayout = lazyPage(() =>
  import("./admin/components/AdminLayout").then((m) => ({ default: m.AdminLayout })),
);
const AdminHomePage = lazyPage(() =>
  import("./admin/pages/AdminHomePage").then((m) => ({ default: m.AdminHomePage })),
);
const AdminCelebrationsPage = lazyPage(() =>
  import("./admin/pages/AdminCelebrationsPage").then((m) => ({
    default: m.AdminCelebrationsPage,
  })),
);
const AdminPeoplePage = lazyPage(() =>
  import("./admin/pages/AdminPeoplePage").then((m) => ({ default: m.AdminPeoplePage })),
);
const AdminTimelinesPage = lazyPage(() =>
  import("./admin/pages/AdminTimelinesPage").then((m) => ({ default: m.AdminTimelinesPage })),
);
const AdminVideosPage = lazyPage(() =>
  import("./admin/pages/AdminVideosPage").then((m) => ({ default: m.AdminVideosPage })),
);
const AdminBooksPage = lazyPage(() =>
  import("./admin/pages/AdminBooksPage").then((m) => ({ default: m.AdminBooksPage })),
);
const AdminSocialPage = lazyPage(() =>
  import("./admin/pages/AdminSocialPage").then((m) => ({ default: m.AdminSocialPage })),
);
const AdminMediaPage = lazyPage(() =>
  import("./admin/pages/AdminMediaPage").then((m) => ({ default: m.AdminMediaPage })),
);
const AdminOrdersPage = lazyPage(() =>
  import("./admin/pages/AdminOrdersPage").then((m) => ({ default: m.AdminOrdersPage })),
);
const AdminShopProductsPage = lazyPage(() =>
  import("./admin/pages/AdminShopProductsPage").then((m) => ({
    default: m.AdminShopProductsPage,
  })),
);
const AdminNovedadesPage = lazyPage(() =>
  import("./admin/pages/AdminNovedadesPage").then((m) => ({ default: m.AdminNovedadesPage })),
);
const AdminCommunityPage = lazyPage(() =>
  import("./admin/pages/AdminCommunityPage").then((m) => ({ default: m.AdminCommunityPage })),
);

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin" element={<RequireAuth />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHomePage />} />
            <Route path="celebraciones" element={<AdminCelebrationsPage />} />
            <Route path="personas" element={<AdminPeoplePage />} />
            <Route path="cronologias" element={<AdminTimelinesPage />} />
            <Route path="videos" element={<AdminVideosPage />} />
            <Route path="libros" element={<AdminBooksPage />} />
            <Route path="redes" element={<AdminSocialPage />} />
            <Route path="media" element={<AdminMediaPage />} />
            <Route path="pedidos" element={<AdminOrdersPage />} />
            <Route path="tienda" element={<AdminShopProductsPage />} />
            <Route path="comunidad" element={<AdminCommunityPage />} />
            <Route path="novedades" element={<AdminNovedadesPage />} />
          </Route>
        </Route>

        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="mapa" element={<PaginaMapa />} />
          <Route path="galeria" element={<PaginaGaleria />} />
          <Route path="francisco" element={<PaginaFrancisco />} />
          <Route path="tres-argentinos" element={<PaginaTresArgentinos />} />
          <Route path="escritores" element={<PaginaEscritores />} />
          <Route path="santos" element={<PaginaSantos />} />
          <Route path="autor" element={<PaginaAutor />} />
          <Route path="video" element={<PaginaVideo />} />
          <Route path="creditos" element={<PaginaCreditos />} />
          <Route path="novedades" element={<PaginaNovedades />} />
          <Route path="novedades/:slug" element={<PaginaNovedad />} />
          <Route path="el-libro" element={<Navigate to="/creditos" replace />} />
          <Route path="tienda" element={<PaginaTienda />} />
          <Route path="tienda/:slug" element={<PaginaProducto />} />
          <Route path="carrito" element={<PaginaCarrito />} />
          <Route path="checkout" element={<PaginaCheckout />} />
          <Route path="checkout/resultado" element={<PaginaResultado />} />
          <Route path="pedido/:publicToken" element={<PaginaPedido />} />
          {USE_MOCKS ? <Route path="simulacion/pago" element={<SimuladorPago />} /> : null}
          <Route path="terminos" element={<PaginaTerminos />} />
          <Route path="cambios-y-devoluciones" element={<PaginaCambios />} />
          <Route path="arrepentimiento" element={<PaginaArrepentimiento />} />
          <Route path="comunidad" element={<PaginaComunidad />} />
          <Route path="comunidad/p/:slug" element={<PaginaPublicacion />} />
          <Route path="comunidad/u/:username" element={<PaginaPerfil />} />
          <Route path="comunidad/ingresar" element={<PaginaIngresar />} />
          <Route path="comunidad/registro" element={<PaginaRegistro />} />
          <Route path="comunidad/verificar" element={<PaginaVerificar />} />
          <Route path="comunidad/recuperar" element={<PaginaRecuperar />} />
          <Route path="comunidad/restablecer" element={<PaginaRestablecer />} />
          <Route path="comunidad/normas" element={<PaginaNormas />} />
          <Route path="privacidad" element={<PaginaPrivacidad />} />
          {/* Mismo estilo que el resto del sitio; el panel sigue en su propio chunk */}
          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route element={<RequiereUsuario />}>
            <Route path="comunidad/publicar" element={<PaginaPublicar />} />
            <Route path="comunidad/p/:slug/editar" element={<PaginaPublicar />} />
            <Route path="comunidad/mi-cuenta" element={<PaginaMiCuenta />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
