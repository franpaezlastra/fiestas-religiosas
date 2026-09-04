import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Inicio } from "./pages/Inicio";
import { PaginaMapa } from "./pages/Mapa";
import {
  PaginaAutor,
  PaginaCreditos,
  PaginaEscritores,
  PaginaFrancisco,
  PaginaPapaLeon,
  PaginaRedes,
  PaginaSantos,
  PaginaShop,
  PaginaTapa,
  PaginaTresArgentinos,
  PaginaVideo,
} from "./pages/Paginas";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="mapa" element={<PaginaMapa />} />
          <Route path="francisco" element={<PaginaFrancisco />} />
          <Route path="tres-argentinos" element={<PaginaTresArgentinos />} />
          <Route path="escritores" element={<PaginaEscritores />} />
          <Route path="santos" element={<PaginaSantos />} />
          <Route path="autor" element={<PaginaAutor />} />
          <Route path="shop" element={<PaginaShop />} />
          <Route path="video" element={<PaginaVideo />} />
          <Route path="creditos" element={<PaginaCreditos />} />
          <Route path="el-libro" element={<PaginaTapa />} />
          <Route path="papa-leon" element={<PaginaPapaLeon />} />
          <Route path="redes" element={<PaginaRedes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
