import { AuthorAvatar } from "./AuthorAvatar";

/**
 * Bloque de autor/editor: foto + rol + bio, sin card ni hover.
 */
export function AuthorCard({ name, role, roleEn, photo, children, className = "" }) {
  return (
    <article className={`reveal-scroll ${className}`}>
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:gap-8">
        <div className="flex flex-col items-center gap-3 md:items-start">
          <AuthorAvatar src={photo} alt={`Retrato de ${name}`} />
          <div className="text-center md:text-left">
            <h3 className="subtitulo-seccion !text-[1.35rem] md:!text-[1.5rem]">{name}</h3>
            {role ? (
              <p className="mt-1 text-sm font-medium uppercase tracking-wide text-azul-logo">
                {role}
              </p>
            ) : null}
            {roleEn ? <p className="caption-en mt-0.5">{roleEn}</p> : null}
          </div>
        </div>

        <div className="min-w-0 flex-1 space-y-4 border-t border-azul-logo/15 pt-6 font-light leading-relaxed text-texto md:border-t-0 md:border-l md:pt-0 md:pl-8">
          {children}
        </div>
      </div>
    </article>
  );
}
