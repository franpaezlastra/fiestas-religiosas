import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminLayout } from "./admin/components/AdminLayout";
import { RequireAuth } from "./admin/components/RequireAuth";
import { AdminBooksPage } from "./admin/pages/AdminBooksPage";
import { AdminCelebrationsPage } from "./admin/pages/AdminCelebrationsPage";
import { AdminHomePage } from "./admin/pages/AdminHomePage";
import { AdminLoginPage } from "./admin/pages/AdminLoginPage";
import { AdminMediaPage } from "./admin/pages/AdminMediaPage";
import { AdminPeoplePage } from "./admin/pages/AdminPeoplePage";
import { AdminSocialPage } from "./admin/pages/AdminSocialPage";
import { AdminTimelinesPage } from "./admin/pages/AdminTimelinesPage";
import { AdminVideosPage } from "./admin/pages/AdminVideosPage";
import { Layout } from "./components/layout/Layout";
import { Inicio } from "./pages/Inicio";
import { PaginaMapa } from "./pages/Mapa";
import {
  PaginaAutor,
  PaginaCreditos,
  PaginaEscritores,
  PaginaFrancisco,
  PaginaRedes,
  PaginaSantos,
  PaginaTapa,
  PaginaTresArgentinos,
  PaginaVideo,
} from "./pages/Paginas";

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
          <Route path="francisco" element={<PaginaFrancisco />} />
          <Route path="tres-argentinos" element={<PaginaTresArgentinos />} />
          <Route path="escritores" element={<PaginaEscritores />} />
          <Route path="santos" element={<PaginaSantos />} />
          <Route path="autor" element={<PaginaAutor />} />
          <Route path="video" element={<PaginaVideo />} />
          <Route path="creditos" element={<PaginaCreditos />} />
          <Route path="el-libro" element={<PaginaTapa />} />
          <Route path="redes" element={<PaginaRedes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
