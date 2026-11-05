import { useEffect, useId, useMemo, useRef, useState } from "react";
import { communityService } from "../../services";
import { comprimirImagen } from "../../utils/imagenes";
import { LIMITES, mensajeError } from "../../utils/comunidad";

/* ---------- Buscador de fiesta (combobox accesible) ---------- */

function normalizar(s) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

export function SelectorFiesta({ fiestas, value, onChange, error }) {
  const id = useId();
  const listId = `${id}-lista`;
  const [texto, setTexto] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(0);
  const seleccionada = fiestas.find((f) => f.id === value?.id || f.slug === value?.slug) || value;

  const resultados = useMemo(() => {
    const q = normalizar(texto.trim());
    const lista = q
      ? fiestas.filter((f) => normalizar(`${f.nombre} ${f.provincia}`).includes(q))
      : fiestas;
    return lista.slice(0, 8);
  }, [fiestas, texto]);

  function elegir(f) {
    onChange(f);
    setTexto("");
    setAbierto(false);
  }

  function onKeyDown(e) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setAbierto(true);
      setActivo((i) => Math.min(i + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && abierto && resultados[activo]) {
      e.preventDefault();
      elegir(resultados[activo]);
    } else if (e.key === "Escape") {
      setAbierto(false);
    }
  }

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-azul-petroleo">
        Fiesta
      </label>
      {seleccionada?.nombre || seleccionada?.name ? (
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className="filtro-chip is-on inline-flex text-sm">{seleccionada.nombre || seleccionada.name}</span>
          <button type="button" className="text-sm text-celeste-cielo underline" onClick={() => onChange(null)}>
            Cambiar
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            id={id}
            type="text"
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={abierto}
            aria-controls={listId}
            aria-activedescendant={abierto && resultados[activo] ? `${listId}-${activo}` : undefined}
            aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
            className="campo-input"
            placeholder="Escribí el nombre o la provincia"
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setAbierto(true);
              setActivo(0);
            }}
            onFocus={() => setAbierto(true)}
            onBlur={() => window.setTimeout(() => setAbierto(false), 150)}
            onKeyDown={onKeyDown}
          />
          {abierto ? (
            <ul id={listId} role="listbox" className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto border border-azul-logo/25 bg-blanco shadow-md">
              {resultados.length === 0 ? (
                <li className="px-3 py-2 text-sm">No encontramos esa fiesta. Podés dejarla vacía y elegir solo la provincia.</li>
              ) : (
                resultados.map((f, i) => (
                  <li
                    key={f.slug}
                    id={`${listId}-${i}`}
                    role="option"
                    aria-selected={i === activo}
                    className={`cursor-pointer px-3 py-2 text-sm ${i === activo ? "bg-papel text-celeste-cielo" : ""}`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      elegir(f);
                    }}
                    onMouseEnter={() => setActivo(i)}
                  >
                    <span className="font-medium text-azul-petroleo">{f.nombre}</span>
                    {f.provincia ? <span className="text-xs"> · {f.provincia}</span> : null}
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}
      <p id={`${id}-hint`} className="mt-1 text-xs">
        Opcional. Si la elegís, completamos la provincia.
      </p>
      {error ? (
        <p id={`${id}-error`} className="campo-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ---------- Santos (hasta 3) ---------- */

export function SelectorSantos({ santos, value, onChange }) {
  const id = useId();
  const elegidos = value.map((slug) => santos.find((s) => s.slug === slug) || { slug, name: slug });
  const lleno = value.length >= LIMITES.santos;
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-azul-petroleo">
        Santos o beatos relacionados
      </label>
      {elegidos.length ? (
        <ul className="mt-1.5 flex flex-wrap gap-1.5" aria-label="Santos elegidos">
          {elegidos.map((s) => (
            <li key={s.slug} className="filtro-chip is-on inline-flex items-center gap-1 text-sm">
              {s.name}
              <button type="button" className="px-1" aria-label={`Quitar ${s.name}`} onClick={() => onChange(value.filter((x) => x !== s.slug))}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <select
        id={id}
        className="campo-input"
        value=""
        disabled={lleno}
        aria-describedby={`${id}-hint`}
        onChange={(e) => e.target.value && onChange([...value, e.target.value])}
      >
        <option value="">{lleno ? "Ya elegiste 3" : "Agregar santo o beato…"}</option>
        {santos
          .filter((s) => !value.includes(s.slug))
          .map((s) => (
            <option key={s.slug} value={s.slug}>
              {s.name}
            </option>
          ))}
      </select>
      <p id={`${id}-hint`} className="mt-1 text-xs">
        Opcional, hasta {LIMITES.santos}.
      </p>
    </div>
  );
}

/* ---------- Imágenes: comprimir, subir con progreso, ordenar, portada y texto alternativo ---------- */

let contador = 0;
const nuevaKey = () => `img-${Date.now()}-${(contador += 1)}`;

/**
 * `subir(file, onProgress)` → { uploadId | imageId, url }. Por defecto, las subidas de la comunidad.
 * Las Novedades del admin pasan su propia función y otro máximo.
 */
export function CargadorImagenes({
  imagenes,
  setImagenes,
  portada,
  setPortada,
  deshabilitado,
  errores = {},
  subir = communityService.uploadImage,
  maximo = LIMITES.imagenes,
  ayuda = "Solo fotos tuyas. Las achicamos antes de subirlas. Describí cada foto para las personas que no pueden verla.",
}) {
  const inputRef = useRef(null);
  const idBase = useId();
  const [aviso, setAviso] = useState(null);
  const lugares = maximo - imagenes.length;

  /* Libera las vistas previas locales al desmontar */
  const previews = useRef(new Set());
  useEffect(() => {
    const set = previews.current;
    return () => set.forEach((u) => URL.revokeObjectURL(u));
  }, []);

  function actualizar(key, patch) {
    setImagenes((list) => list.map((i) => (i.key === key ? { ...i, ...patch } : i)));
  }

  async function procesar(item, file) {
    try {
      const comprimida = await comprimirImagen(file);
      actualizar(item.key, { estado: "subiendo", progreso: 0 });
      const res = await subir(comprimida, (p) => actualizar(item.key, { progreso: p }));
      actualizar(item.key, { estado: "listo", uploadId: res.uploadId ?? res.imageId, url: res.url, progreso: 1 });
      URL.revokeObjectURL(item.preview);
      previews.current.delete(item.preview);
    } catch (err) {
      actualizar(item.key, { estado: "error", error: err.code ? mensajeError(err) : err.message });
    }
  }

  function elegir(e) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    setAviso(files.length > lugares ? `Solo se pueden subir ${maximo} fotos: agregamos las primeras ${lugares}.` : null);
    const nuevas = files.slice(0, Math.max(0, lugares)).map((file) => {
      const preview = URL.createObjectURL(file);
      previews.current.add(preview);
      return { key: nuevaKey(), uploadId: null, url: null, preview, alt: "", estado: "comprimiendo", progreso: 0, error: null };
    });
    setImagenes((list) => [...list, ...nuevas]);
    nuevas.forEach((item, i) => procesar(item, files[i]));
  }

  function mover(index, delta) {
    setImagenes((list) => {
      const next = [...list];
      const [item] = next.splice(index, 1);
      next.splice(index + delta, 0, item);
      return next;
    });
  }

  function quitar(item) {
    setImagenes((list) => list.filter((i) => i.key !== item.key));
    if (portada === item.key) setPortada(null);
  }

  return (
    <fieldset>
      <legend className="text-sm font-medium text-azul-petroleo">Fotos (hasta {maximo})</legend>
      <p className="mt-1 text-xs">{ayuda}</p>
      {imagenes.length ? (
        <ol className="mt-3 flex flex-col gap-3">
          {imagenes.map((img, i) => {
            const esPortada = (portada || imagenes.find((x) => x.estado === "listo")?.key) === img.key;
            const altId = `${idBase}-alt-${img.key}`;
            return (
              <li key={img.key} className="flex flex-col gap-3 border border-azul-logo/20 bg-blanco p-3 sm:flex-row">
                <div className="foto-libro relative h-28 w-full shrink-0 sm:w-36">
                  <img src={img.url || img.preview} alt="" />
                  {esPortada && img.estado === "listo" ? (
                    <span className="absolute top-1 left-1 bg-azul-petroleo px-1.5 py-0.5 text-[11px] text-blanco">Portada</span>
                  ) : null}
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {img.estado === "comprimiendo" || img.estado === "subiendo" ? (
                    <div>
                      <progress value={img.estado === "subiendo" ? img.progreso : undefined} max={1} className="w-full" aria-label={`Subiendo foto ${i + 1}`} />
                      <p className="text-xs" aria-live="polite">
                        {img.estado === "comprimiendo" ? "Preparando la foto…" : `Subiendo… ${Math.round(img.progreso * 100)}%`}
                      </p>
                    </div>
                  ) : null}
                  {img.estado === "error" ? (
                    <p className="campo-error" role="alert">
                      {img.error}
                    </p>
                  ) : null}
                  <div>
                    <label htmlFor={altId} className="text-xs font-medium text-azul-petroleo">
                      Descripción de la foto {i + 1} *
                    </label>
                    <input
                      id={altId}
                      type="text"
                      maxLength={LIMITES.altMax}
                      className="campo-input !py-1.5 text-sm"
                      placeholder="Ej.: Procesión de la Virgen por la calle principal"
                      value={img.alt}
                      onChange={(e) => actualizar(img.key, { alt: e.target.value })}
                      aria-invalid={errores[img.key] ? "true" : undefined}
                      aria-describedby={errores[img.key] ? `${altId}-error` : undefined}
                    />
                    {errores[img.key] ? (
                      <p id={`${altId}-error`} className="campo-error">
                        {errores[img.key]}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                    {img.estado === "listo" ? (
                      <label className="inline-flex items-center gap-1.5">
                        <input type="radio" name={`${idBase}-portada`} checked={esPortada} onChange={() => setPortada(img.key)} className="accent-[#0098d4]" />
                        Portada
                      </label>
                    ) : null}
                    <button type="button" className="underline disabled:opacity-40" disabled={i === 0} onClick={() => mover(i, -1)} aria-label={`Subir foto ${i + 1}`}>
                      ↑ Subir
                    </button>
                    <button type="button" className="underline disabled:opacity-40" disabled={i === imagenes.length - 1} onClick={() => mover(i, 1)} aria-label={`Bajar foto ${i + 1}`}>
                      ↓ Bajar
                    </button>
                    <button type="button" className="text-[#b42318] underline" onClick={() => quitar(img)} aria-label={`Quitar foto ${i + 1}`}>
                      Quitar
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      ) : null}
      {aviso ? <p className="mt-2 text-sm text-naranja-libro" role="status">{aviso}</p> : null}
      {lugares > 0 ? (
        <div className="mt-3">
          <input ref={inputRef} id={`${idBase}-input`} type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={elegir} disabled={deshabilitado} />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={deshabilitado}
            className="flex w-full flex-col items-center justify-center gap-1 border-2 border-dashed border-azul-logo/30 bg-papel px-4 py-6 text-sm text-azul-petroleo hover:border-celeste-cielo disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="font-medium">+ Agregar fotos</span>
            <span className="text-xs">Te quedan {lugares} · JPG, PNG o WebP</span>
          </button>
        </div>
      ) : null}
      {errores.general ? <p className="campo-error">{errores.general}</p> : null}
    </fieldset>
  );
}
