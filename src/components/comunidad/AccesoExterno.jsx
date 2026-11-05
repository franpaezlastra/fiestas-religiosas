import { useEffect, useId, useRef, useState } from "react";
import { COMMUNITY_MOCKS } from "../../services";
import { cargarScript } from "../../utils/cargarScript";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

/* ---------- Captcha (Cloudflare Turnstile) ---------- */

/**
 * onToken(token | null). En la simulación es un checkbox de prueba que da "mock-captcha-ok".
 * Cambiar `key` desde el padre lo reinicia (por ejemplo, después de un CAPTCHA_FAILED).
 */
export function Captcha({ onToken, error }) {
  const errorId = useId();
  if (COMMUNITY_MOCKS) {
    return (
      <div>
        <label className="inline-flex items-center gap-3 border border-dashed border-naranja-libro bg-papel px-4 py-3 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-[#0098d4]"
            onChange={(e) => onToken(e.target.checked ? "mock-captcha-ok" : null)}
            aria-invalid={error ? "true" : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          No soy un robot <span className="text-xs">(captcha simulado)</span>
        </label>
        {error ? (
          <p id={errorId} className="campo-error">
            {error}
          </p>
        ) : null}
      </div>
    );
  }
  return <TurnstileReal onToken={onToken} error={error} errorId={errorId} />;
}

function TurnstileReal({ onToken, error, errorId }) {
  const ref = useRef(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    let widgetId = null;
    let cancelado = false;
    cargarScript("https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit")
      .then(() => {
        if (cancelado || !ref.current || !window.turnstile) return;
        widgetId = window.turnstile.render(ref.current, {
          sitekey: TURNSTILE_SITE_KEY,
          language: "es",
          callback: (token) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => setFallo(true));
    return () => {
      cancelado = true;
      if (widgetId != null) window.turnstile?.remove(widgetId);
    };
  }, []);

  return (
    <div>
      <div ref={ref} />
      {fallo ? <p className="campo-error">No se pudo cargar la verificación. Recargá la página.</p> : null}
      {error ? (
        <p id={errorId} className="campo-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}
