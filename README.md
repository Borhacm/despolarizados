# Despolarizados (MVP)

Réplica en español del concepto [Ground News](https://ground.news/): mismas historias, varias redacciones, barras de cobertura por orientación. La ingesta usa **RSS públicos de los medios** (sin API propia de cada periódico). El agrupado de titulares es **léxico en el servidor por defecto** (sin OpenAI); opcionalmente **embeddings OpenAI** (`INGEST_CLUSTER_MODE=openai`). Stack: Next.js, Supabase (Postgres + pgvector), Vercel.

## Qué tienes que hacer tú (checklist)

Sigue este orden una vez; después el día a día es solo **ingesta** (cron o manual).

### 1. Cuentas y claves

1. Crea un proyecto en [Supabase](https://supabase.com) (gratis).
2. En **Project Settings → API**, copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** → `SUPABASE_SERVICE_ROLE_KEY` (solo servidor; no la subas a Git ni al cliente).
3. **Opcional:** [OpenAI](https://platform.openai.com/api-keys) solo si quieres `INGEST_CLUSTER_MODE=openai` (embeddings). Sin clave, la ingesta agrupa por similitud de titular/resumen.
4. Inventa un secreto largo (por ejemplo con `openssl rand -hex 32`) y úsalo como:
   - `CRON_SECRET` (obligatorio para cron e ingesta manual por API)
   - Opcionalmente `ADMIN_SECRET` para el formulario web; si no lo pones, el formulario acepta el mismo valor que `CRON_SECRET`.

### 2. Base de datos en Supabase

1. En el **SQL Editor** de Supabase, ejecuta **en este orden** (si solo ejecutas el seed, fallará: *relation medios does not exist*):
   - **Primero** todo el contenido de `supabase/migrations/20260414000000_init.sql` (crea tablas y políticas).
   - **Medios semilla:** o bien pega `supabase/seed_medios.sql`, o bien (recomendado si ya tienes `.env.local`) ejecuta en tu máquina **`npm run seed:medios`** — usa `SUPABASE_SERVICE_ROLE_KEY` y hace *upsert* de los **20 medios** (misma lista que `src/data/medios-seed.ts`). También puedes pulsar **Sincronizar medios semilla** en [http://localhost:3000/admin/medios](http://localhost:3000/admin/medios).
   - **Recomendado** `supabase/migrations/20260415000000_historias_fts.sql` — columna `search_vector` + índice GIN para búsqueda en español (si no la ejecutas, la app usa `ilike` como respaldo al buscar).
2. Comprueba que en **Database → Extensions** esté habilitada la extensión **`vector`** (la migración la pide con `create extension if not exists vector`).

### 3. Variables locales

1. Copia `.env.example` a `.env.local`.
2. Rellena Supabase + `CRON_SECRET`. `OPENAI_API_KEY` solo para modo `openai`.

### 4. Arrancar la app

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Si falta Supabase en `.env.local`, verás el aviso de configuración.

En la home puedes **filtrar** por texto (`q`), **medio** (`medio`, slug) y **ventana de fechas** (`ventana`: `24h`, `7d`, `30d`, `all`), con **paginación** (`page`): por ejemplo `/?q=energía&ventana=7d&medio=el-pais&page=2`.

**Mi feed** (`/feed`): en la ficha de cada medio, **Seguir en Mi feed** guarda el slug en una **cookie** del navegador; el feed lista historias donde hay cobertura de al menos uno de esos medios (sin cuenta de usuario).

### 5. Primera ingesta de noticias

Sin datos en tablas, la home mostrará **0 historias** hasta que ejecutes la ingesta (usa **OpenAI** y **service role**). Necesitas `OPENAI_API_KEY` y `SUPABASE_SERVICE_ROLE_KEY` correctos en `.env.local`.

**Opción A — UI:** [http://localhost:3000/admin/ingesta](http://localhost:3000/admin/ingesta): introduce `ADMIN_SECRET` o `CRON_SECRET` y pulsa **Ejecutar ingesta ahora**.

**Opción B — CLI (sin levantar el servidor):** con `.env.local` relleno:

```bash
npm run ingest
```

**Opción C — API con el servidor en marcha:**

```bash
curl -sS -H "Authorization: Bearer TU_CRON_SECRET" \
  "http://localhost:3000/api/cron/ingest"
```

Sustituye `TU_CRON_SECRET` por el valor de `.env.local`. La primera vez puede tardar (muchas llamadas a embeddings + feeds).

Si OpenAI devuelve **429 / quota exceeded**, la ingesta no insertará artículos hasta que haya crédito o plan activo. Los RSS cambian con frecuencia: si un medio falla siempre, revisa su URL en `supabase/seed_medios.sql` (vuelve a ejecutar el seed en Supabase o edita el medio en `/admin/medios` cuando exista edición).

### 6. Añadir medios sin tocar SQL

- Entra en [http://localhost:3000/admin/medios](http://localhost:3000/admin/medios) (enlace también en el pie de página).
- Introduce la misma clave que configuraste (`ADMIN_SECRET` o `CRON_SECRET`) y los datos del medio.

Alternativa programática: `POST /api/medios` con `Authorization: Bearer CRON_SECRET` (ver más abajo).

### 7. Despliegue en Vercel (cuando quieras)

1. Conecta el repo o sube el proyecto a Vercel.
2. En **Settings → Environment Variables**, copia **las mismas** variables que en `.env.local` (incluidas `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `CRON_SECRET`).
3. Despliega. El archivo `vercel.json` define un cron hacia `/api/cron/ingest` **dos veces al día** (07:00 y 19:00 **UTC**), con `Authorization: Bearer CRON_SECRET` como en local. Si quieres otras horas o más frecuencia, cambia el campo `schedule` (cron de 5 campos, hora en UTC). En el plan gratuito de Vercel el cron puede tener limitaciones: [documentación de Vercel Cron](https://vercel.com/docs/cron-jobs).

---

## Requisitos técnicos

- Node.js 20+
- Supabase con extensión `vector`
- OpenAI solo si usas `INGEST_CLUSTER_MODE=openai` (embeddings)

## Ingesta (referencia)

- Manual:

  ```bash
  curl -sS -H "Authorization: Bearer TU_CRON_SECRET" \
    "http://localhost:3000/api/cron/ingest"
  ```

- API alta de medio (`POST /api/medios`):

  ```json
  {
    "nombre": "Ejemplo",
    "slug": "ejemplo",
    "rss_urls": ["https://ejemplo.com/rss"],
    "sesgo": "centro",
    "factualidad": "media",
    "ownership": null,
    "prioridad": 3
  }
  ```

## Decisiones cerradas

- **Embeddings:** un solo modelo (`text-embedding-3-small`, vector 1536).
- **Ingesta:** Node.js (`rss-parser`), no Edge.
- **Blindspots:** se muestran como ausencia de cobertura, sin atribuir motivos editoriales.
