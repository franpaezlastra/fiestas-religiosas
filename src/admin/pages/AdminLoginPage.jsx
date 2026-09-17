import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { clearAuthError, login } from "../../redux/slices/authSlice";
import { Boton } from "../../components/ui/Boton";
import { AdminAlert, AdminField, AdminInput } from "../components/AdminForm";

export function AdminLoginPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const { admin, status, error } = useSelector((state) => state.auth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (admin) {
    const to = location.state?.from?.pathname || "/admin";
    return <Navigate to={to} replace />;
  }

  async function onSubmit(e) {
    e.preventDefault();
    dispatch(clearAuthError());
    dispatch(login({ email, password }));
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(160deg,#033e60_0%,#0098d4_55%,#f7f3ec_55%)] px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-azul-logo/10 bg-blanco p-8 shadow-[0_24px_60px_rgb(3_62_96/0.25)]"
      >
        <p className="text-xs font-medium tracking-[0.18em] text-celeste-cielo uppercase">
          Peregrinos
        </p>
        <h1 className="mt-2 font-display text-3xl text-azul-petroleo">Panel administrador</h1>
        <p className="mt-2 text-sm text-texto/75">
          Ingresá con la cuenta del cliente para gestionar el contenido del sitio.
        </p>

        <div className="mt-8 grid gap-4">
          <AdminField label="Email" required span={2} className="!block">
            <AdminInput
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
            />
          </AdminField>
          <AdminField label="Contraseña" required span={2} className="!block">
            <AdminInput
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
            />
          </AdminField>
        </div>

        {error ? (
          <div className="mt-4">
            <AdminAlert type="error">{error}</AdminAlert>
          </div>
        ) : null}

        <Boton className="mt-6 w-full" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Ingresando…" : "Entrar al panel"}
        </Boton>
      </form>
    </div>
  );
}
