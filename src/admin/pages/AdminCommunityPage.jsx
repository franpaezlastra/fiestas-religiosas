import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { fetchCommunityStats } from "../../redux/slices/communityAdminSlice";
import { COMMUNITY_MOCKS } from "../../services";
import { AdminAlert, AdminPageHeader, AdminStatCard } from "../components/AdminForm";
import {
  BlockedWordsTab,
  CommunityUsersTab,
  ModerationQueueTab,
  ReportsTab,
} from "../components/community/CommunityTabs";

const TABS = [
  { id: "cola", label: "Cola de moderación", Component: ModerationQueueTab },
  { id: "denuncias", label: "Denuncias", Component: ReportsTab },
  { id: "usuarios", label: "Usuarios", Component: CommunityUsersTab },
  { id: "palabras", label: "Palabras bloqueadas", Component: BlockedWordsTab },
];

export function AdminCommunityPage() {
  const dispatch = useDispatch();
  const stats = useSelector((s) => s.communityAdmin.stats);
  const [params, setParams] = useSearchParams();
  const activa = TABS.find((t) => t.id === params.get("tab")) || TABS[0];

  useEffect(() => {
    dispatch(fetchCommunityStats());
  }, [dispatch, activa.id]);

  function elegir(id) {
    setParams(id === TABS[0].id ? {} : { tab: id }, { replace: true });
  }

  function onKeyDown(e) {
    const i = TABS.findIndex((t) => t.id === activa.id);
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const next = TABS[(i + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
      elegir(next.id);
      window.setTimeout(() => document.getElementById(`tab-${next.id}`)?.focus(), 0);
    }
  }

  const { Component } = activa;
  return (
    <div>
      <AdminPageHeader title="Comunidad" subtitle="Moderación de publicaciones, comentarios y usuarios de la comunidad." />
      {COMMUNITY_MOCKS ? (
        <div className="mb-4">
          <AdminAlert>Modo simulación: los datos de la comunidad son de prueba y viven en este navegador.</AdminAlert>
        </div>
      ) : null}
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <AdminStatCard label="Publicaciones en revisión" value={stats?.pendingPosts ?? "—"} />
        <AdminStatCard label="Contenidos denunciados" value={stats?.openReports ?? "—"} hint="Con denuncias abiertas" />
        <AdminStatCard label="Usuarios nuevos" value={stats?.newUsersThisWeek ?? "—"} hint="Últimos 7 días" />
      </div>

      <div role="tablist" aria-label="Secciones de moderación" className="mb-5 flex flex-wrap gap-1 border-b border-[var(--admin-border)]" onKeyDown={onKeyDown}>
        {TABS.map((t) => {
          const seleccionada = t.id === activa.id;
          const badge = t.id === "cola" ? stats?.pendingPosts : t.id === "denuncias" ? stats?.openReports : null;
          return (
            <button
              key={t.id}
              id={`tab-${t.id}`}
              type="button"
              role="tab"
              aria-selected={seleccionada}
              aria-controls={`panel-${t.id}`}
              tabIndex={seleccionada ? 0 : -1}
              onClick={() => elegir(t.id)}
              className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                seleccionada
                  ? "border-[var(--admin-accent)] text-[var(--admin-accent)]"
                  : "border-transparent text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]"
              }`}
            >
              {t.label}
              {badge ? (
                <span className="ml-1.5 rounded-full bg-[var(--admin-danger)] px-1.5 py-0.5 text-[11px] text-white">{badge}</span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div role="tabpanel" id={`panel-${activa.id}`} aria-labelledby={`tab-${activa.id}`}>
        <Component />
      </div>
    </div>
  );
}
