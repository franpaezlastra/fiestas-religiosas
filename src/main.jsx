import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import App from "./App";
import { store } from "./redux/store";
import "./styles/index.css";

/**
 * Los fetch públicos se disparan por ruta (mapa, francisco, santos, etc.),
 * no en el bootstrap global — evita pedir celebrations/people/timelines/…
 * al abrir cualquier página.
 */
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
);
