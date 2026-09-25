import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/layout/Layout";
import { PageLoader } from "./components/ui/SectionLoader";
import { Inicio } from "./pages/Inicio";

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
const PaginaTapa = lazyPage(() =>
  import("./features/libro/SeccionCreditos").then((m) => ({ default: m.SeccionTapa })),
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

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="admin/login" element={<AdminLoginPage />} />
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
          <Route path="el-libro" element={<PaginaTapa />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
