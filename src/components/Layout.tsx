import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Footer } from "./Footer";
import { Header } from "./Header";

export function Layout() {
  const { pathname } = useLocation();
  const [displayFont, setDisplayFont] = useState<"comfortaa" | "baloo">("comfortaa");

  useEffect(() => {
    document.documentElement.dataset.displayFont = displayFont;
  }, [displayFont]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="flex min-h-svh flex-col bg-blanco">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer displayFont={displayFont} onDisplayFont={setDisplayFont} />
    </div>
  );
}
