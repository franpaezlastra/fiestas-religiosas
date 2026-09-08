import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-svh flex-col bg-blanco">
      <Header />
      <main className={`flex-1 ${pathname === "/" ? "" : "pt-[5.5rem]"}`}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
