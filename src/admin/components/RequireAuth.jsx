import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchMe } from "../../redux/slices/authSlice";

export function RequireAuth() {
  const dispatch = useDispatch();
  const { admin, checked } = useSelector((state) => state.auth);
  const location = useLocation();

  useEffect(() => {
    if (!checked) dispatch(fetchMe());
  }, [checked, dispatch]);

  if (!checked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-papel text-azul-petroleo">
        Comprobando sesión…
      </div>
    );
  }

  if (!admin) {
    return <Navigate to="/admin/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
