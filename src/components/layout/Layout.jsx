import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { CarritoDrawer } from "../../features/tienda/CarritoDrawer";
import { PanelSimulacion } from "../../features/tienda/PanelSimulacion";
import { AvisoVerificarEmail } from "../comunidad/Cuenta";
import { fetchUserMe } from "../../redux/slices/userAuthSlice";
import { COMMUNITY_MOCKS, USE_MOCKS } from "../../services";

export function Layout() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  /* Único pedido al iniciar: la sesión del usuario de la comunidad (para el header). */
  useEffect(() => {
    dispatch(fetchUserMe());
  }, [dispatch]);

  return (
    <div className="flex min-h-svh flex-col bg-blanco">
      <Header />
      <main className={`flex-1 ${pathname === "/" ? "" : "pt-[5.5rem]"}`}>
        {pathname.startsWith("/comunidad") ? <AvisoVerificarEmail /> : null}
        <Outlet />
      </main>
      <Footer />
      <CarritoDrawer />
      {USE_MOCKS || COMMUNITY_MOCKS ? <PanelSimulacion /> : null}
    </div>);

}
