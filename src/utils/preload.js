/**
 * Precarga una lista de URLs de imagen. Resuelve cuando todas cargaron o fallaron.
 * @param {string[]} urls
 * @param {{ timeoutMs?: number }} [opts]
 */
export function preloadUrls(urls, { timeoutMs = 15000 } = {}) {
  return new Promise((resolve) => {
    const list = [...new Set((urls || []).filter(Boolean))];
    if (list.length === 0) {
      resolve();
      return;
    }

    let pending = list.length;
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    const failsafe = setTimeout(finish, timeoutMs);

    list.forEach((url) => {
      const img = new Image();
      const done = () => {
        pending -= 1;
        if (pending <= 0) {
          clearTimeout(failsafe);
          finish();
        }
      };
      img.onload = done;
      img.onerror = done;
      img.src = url;
    });
  });
}

/** true mientras el slice aún no terminó el primer fetch público */
export function isPublicLoading(status) {
  return status === "idle" || status === "loading";
}
