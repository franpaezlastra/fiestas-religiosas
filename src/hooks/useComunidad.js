import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchPublicCelebrations } from "../redux/slices/celebrationsSlice";
import { fetchProvinces } from "../redux/slices/provincesSlice";
import { fetchPublicPeople } from "../redux/slices/peopleSlice";
import { selectFiestasForUi } from "../utils/celebrationsAdapter";
import { selectSantosForUi } from "../utils/peopleAdapter";
import { FIESTAS_REF, PROVINCIAS_REF, SANTOS_REF } from "../utils/comunidad";

/** Publicaciones de una lista del slice community, en orden y sin recrear el array en cada render. */
export function usePostsDeLista(key) {
  const lista = useSelector((s) => s.community.listas[key]);
  const postsById = useSelector((s) => s.community.postsById);
  return useMemo(
    () => (lista ? lista.ids.map((id) => postsById[id]).filter(Boolean) : []),
    [lista, postsById],
  );
}

/**
 * Fiestas, provincias y santos para filtros y formularios.
 * Usa los slices que ya existen; si la API no responde, cae a los datos locales con los mismos slugs.
 */
export function useOpcionesComunidad() {
  const dispatch = useDispatch();
  const celebrations = useSelector((s) => s.celebrations.publicItems);
  const celebrationsStatus = useSelector((s) => s.celebrations.status);
  const provinces = useSelector((s) => s.provinces.items);
  const provincesStatus = useSelector((s) => s.provinces.status);
  const people = useSelector((s) => s.people.publicItems);
  const fromHoliness = useSelector((s) => s.people.fromHoliness);
  const peopleStatus = useSelector((s) => s.people.status);

  useEffect(() => {
    dispatch(fetchPublicCelebrations());
    dispatch(fetchPublicPeople());
    if (provincesStatus === "idle") dispatch(fetchProvinces());
  }, [dispatch, provincesStatus]);

  const fiestas = useMemo(() => {
    const api = selectFiestasForUi({ publicItems: celebrations })
      .filter((f) => f.slug)
      .map((f) => ({ id: f.apiId, slug: f.slug, nombre: f.nombre, provincia: f.provincia, provinciaSlug: f.provinciaSlug }));
    return (api.length ? api : FIESTAS_REF).slice().sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  }, [celebrations]);

  const provincias = useMemo(() => {
    const api = (provinces || []).filter((p) => p.slug).map((p) => ({ slug: p.slug, name: p.name }));
    return (api.length ? api : PROVINCIAS_REF).slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [provinces]);

  const santos = useMemo(() => {
    const api = selectSantosForUi(people, { fromHoliness })
      .filter((p) => p.slug)
      .map((p) => ({ slug: p.slug, name: p.nombre }));
    return (api.length ? api : SANTOS_REF).slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
  }, [people, fromHoliness]);

  const cargando = [celebrationsStatus, peopleStatus].includes("loading") && !celebrations?.length;

  return { fiestas, provincias, santos, cargando, provincesStatus };
}

export function useDebounce(value, ms = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}
