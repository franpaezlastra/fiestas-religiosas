# Deploy automático a DonWeb

Repo: [franpaezlastra/fiestas-religiosas](https://github.com/franpaezlastra/fiestas-religiosas)

En cada push a `main`, GitHub Actions buildea Vite y sube `dist/` por FTP a `public_html`.

## Secretos (una sola vez)

GitHub → **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Valor |
|--------|--------|
| `FTP_SERVER` | Host FTP de Ferozo (ej. `ftp.tudominio.com`) |
| `FTP_USERNAME` | Usuario FTP |
| `FTP_PASSWORD` | Contraseña FTP |
| `FTP_SERVER_DIR` | `/public_html/` |
| `VITE_API_URL` | `https://api.fiestasreligiosas.com/api/v1` (prod DonWeb) |

Local (`npm run dev`) usa el proxy → `api-preview.fiestasreligiosas.com`.
| `VITE_CLOUDINARY_CLOUD_NAME` | `duuwqmpmn` |

## Probar

1. Cargá los secretos
2. **Actions → Deploy DonWeb → Run workflow**
3. Si sale verde, el sitio en DonWeb ya tiene el build

O hacé un cambio chico y `git push origin main`.

## CORS

El dominio de DonWeb tiene que estar en `CORS_ORIGIN` del backend (Vercel), si no el API bloquea el front.
