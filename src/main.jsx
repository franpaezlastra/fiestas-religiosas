import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { Provider, useDispatch } from "react-redux";
import App from "./App";
import { store } from "./redux/store";
import { fetchPublicCelebrations } from "./redux/slices/celebrationsSlice";
import { fetchPublicSocial } from "./redux/slices/socialSlice";
import { fetchPublicVideos } from "./redux/slices/videosSlice";
import "./styles/index.css";

function Bootstrap({ children }) {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(fetchPublicCelebrations());
    dispatch(fetchPublicVideos());
    dispatch(fetchPublicSocial());
  }, [dispatch]);
  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <Bootstrap>
        <App />
      </Bootstrap>
    </Provider>
  </StrictMode>,
);
