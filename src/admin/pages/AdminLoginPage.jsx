import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";
import { clearAuthError, login } from "../../redux/slices/authSlice";
import { AdminButton } from "../components/AdminButton";
import { AdminAlert, AdminField, AdminInput } from "../components/AdminForm";
import "../admin.css";

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
    <div className="admin-shell flex min-h-screen items-center justify-center px-4">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8"
        style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-modal)" }}
      >
        <p className="text-xs font-semibold tracking-[0.14em] text-[var(--admin-accent)] uppercase">
          Peregrinos
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--admin-text)]">Panel administrador</h1>
        <p className="mt-2 text-sm text-[var(--admin-text-muted)]">
          Ingresá con la cuenta del cliente para gestionar el contenido del sitio.
        </p>

        <div className="mt-8 grid gap-4">
          <AdminField label="Email" required className="!block">
            <AdminInput
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@ejemplo.com"
            />
          </AdminField>
          <AdminField label="Contraseña" required className="!block">
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

        <AdminButton className="mt-6 !w-full" type="submit" disabled={status === "loading"}>
          {status === "loading" ? "Ingresando…" : "Entrar al panel"}
        </AdminButton>
      </form>
    </div>
  );
}
